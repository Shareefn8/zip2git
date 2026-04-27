import { Octokit } from '@octokit/rest';

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
}

export interface RepoFile {
  path: string;
  content: string;
  encoding: 'base64';
  size?: number;
  isText?: boolean;
}

export interface CreateRepoOptions {
  name: string;
  description?: string;
  isPrivate?: boolean;
  files: Map<string, RepoFile>;
  commitMessage: string;
}

export interface PushProgress {
  step: string;
  progress: number;
  detail?: string;
}

type GitHubApiError = {
  message?: string;
  status?: number;
  response?: {
    data?: {
      message?: string;
      errors?: Array<{ message?: string }>;
    };
  };
};

function formatGitHubError(error: unknown): string {
  const githubError = error as GitHubApiError;
  const apiMessage = githubError.response?.data?.message;
  const apiErrors = githubError.response?.data?.errors
    ?.map((entry) => entry.message)
    .filter(Boolean)
    .join(', ');

  if (apiMessage && apiErrors) return `${apiMessage}: ${apiErrors}`;
  if (apiMessage) return apiMessage;
  if (githubError.message) return githubError.message;
  return 'Failed to push to GitHub';
}

export async function validateToken(token: string): Promise<GitHubUser | null> {
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.users.getAuthenticated();

    return {
      login: data.login,
      name: data.name,
      avatar_url: data.avatar_url,
    };
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}

export async function createAndPushRepo(
  token: string,
  options: CreateRepoOptions,
  onProgress?: (progress: PushProgress) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const octokit = new Octokit({ auth: token });

    onProgress?.({ step: 'Authenticating...', progress: 10 });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    onProgress?.({ step: 'Preparing repository...', progress: 20 });
    let defaultBranch = 'main';

    try {
      const { data: repository } = await octokit.rest.repos.get({
        owner: user.login,
        repo: options.name,
      });
      defaultBranch = repository.default_branch || defaultBranch;
    } catch (error) {
      const repoError = error as { status?: number };

      if (repoError.status !== 404) {
        throw error;
      }

      const { data: repository } = await octokit.rest.repos.createForAuthenticatedUser({
        name: options.name,
        description: options.description || 'Created with Zip2Git',
        private: options.isPrivate ?? false,
        auto_init: true,
      });

      defaultBranch = repository.default_branch || defaultBranch;
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    const fileEntries = Array.from(options.files.entries());
    if (!fileEntries.length) {
      return { success: false, error: 'No files were prepared for upload.' };
    }

    onProgress?.({ step: 'Uploading files...', progress: 40 });
    const tree: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];

    for (let index = 0; index < fileEntries.length; index += 1) {
      const [path, file] = fileEntries[index];

      onProgress?.({
        step: 'Uploading files...',
        progress: 40 + Math.round((index / fileEntries.length) * 40),
        detail: `${index + 1}/${fileEntries.length}: ${path.split('/').pop()}`,
      });

      const { data: blob } = await octokit.rest.git.createBlob({
        owner: user.login,
        repo: options.name,
        content: file.content,
        encoding: file.encoding,
      });

      tree.push({
        path,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    }

    onProgress?.({ step: 'Creating file tree...', progress: 85 });
    const { data: newTree } = await octokit.rest.git.createTree({
      owner: user.login,
      repo: options.name,
      tree,
    });

    let parentCommitSha: string | undefined;

    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: user.login,
        repo: options.name,
        ref: `heads/${defaultBranch}`,
      });
      parentCommitSha = ref.object.sha;
    } catch {
      parentCommitSha = undefined;
    }

    onProgress?.({ step: 'Creating commit...', progress: 90 });
    const { data: commit } = await octokit.rest.git.createCommit({
      owner: user.login,
      repo: options.name,
      message: options.commitMessage,
      tree: newTree.sha,
      ...(parentCommitSha ? { parents: [parentCommitSha] } : {}),
    });

    onProgress?.({ step: 'Finalizing...', progress: 95 });
    await octokit.rest.git.updateRef({
      owner: user.login,
      repo: options.name,
      ref: `heads/${defaultBranch}`,
      sha: commit.sha,
      force: true,
    });

    onProgress?.({ step: 'Complete!', progress: 100 });

    return {
      success: true,
      url: `https://github.com/${user.login}/${options.name}`,
    };
  } catch (error) {
    console.error('Push failed:', error);
    return {
      success: false,
      error: formatGitHubError(error),
    };
  }
}

export async function checkRepoExists(token: string, owner: string, name: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.rest.repos.get({ owner, repo: name });
    return true;
  } catch {
    return false;
  }
}

export interface RepoSummary {
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  updated_at: string | null;
}

export async function listUserRepos(token: string): Promise<RepoSummary[]> {
  try {
    const octokit = new Octokit({ auth: token });
    const repos: RepoSummary[] = [];
    let page = 1;
    while (page < 6) {
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 100,
        page,
        sort: 'updated',
        affiliation: 'owner',
      });
      data.forEach((r) =>
        repos.push({
          name: r.name,
          full_name: r.full_name,
          private: r.private,
          default_branch: r.default_branch || 'main',
          updated_at: r.updated_at,
        }),
      );
      if (data.length < 100) break;
      page += 1;
    }
    return repos;
  } catch (error) {
    console.error('Failed to list repos:', error);
    return [];
  }
}

export async function replaceRepoContents(
  token: string,
  options: { name: string; files: Map<string, RepoFile>; commitMessage: string },
  onProgress?: (progress: PushProgress) => void,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const octokit = new Octokit({ auth: token });

    onProgress?.({ step: 'Authenticating...', progress: 5 });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    onProgress?.({ step: 'Locating repository...', progress: 15 });
    const { data: repository } = await octokit.rest.repos.get({
      owner: user.login,
      repo: options.name,
    });
    const defaultBranch = repository.default_branch || 'main';

    const fileEntries = Array.from(options.files.entries());
    if (!fileEntries.length) {
      return { success: false, error: 'No files were prepared for upload.' };
    }

    onProgress?.({ step: 'Uploading new files...', progress: 25 });
    const tree: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
    for (let index = 0; index < fileEntries.length; index += 1) {
      const [path, file] = fileEntries[index];
      onProgress?.({
        step: 'Uploading new files...',
        progress: 25 + Math.round((index / fileEntries.length) * 55),
        detail: `${index + 1}/${fileEntries.length}: ${path.split('/').pop()}`,
      });
      const { data: blob } = await octokit.rest.git.createBlob({
        owner: user.login,
        repo: options.name,
        content: file.content,
        encoding: file.encoding,
      });
      tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
    }

    onProgress?.({ step: 'Building clean tree...', progress: 85 });
    const { data: newTree } = await octokit.rest.git.createTree({
      owner: user.login,
      repo: options.name,
      tree,
    });

    let parentCommitSha: string | undefined;
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner: user.login,
        repo: options.name,
        ref: `heads/${defaultBranch}`,
      });
      parentCommitSha = ref.object.sha;
    } catch {
      parentCommitSha = undefined;
    }

    onProgress?.({ step: 'Replacing repository contents...', progress: 92 });
    const { data: commit } = await octokit.rest.git.createCommit({
      owner: user.login,
      repo: options.name,
      message: options.commitMessage,
      tree: newTree.sha,
      ...(parentCommitSha ? { parents: [parentCommitSha] } : {}),
    });

    onProgress?.({ step: 'Finalizing...', progress: 97 });
    await octokit.rest.git.updateRef({
      owner: user.login,
      repo: options.name,
      ref: `heads/${defaultBranch}`,
      sha: commit.sha,
      force: true,
    });

    onProgress?.({ step: 'Complete!', progress: 100 });
    return { success: true, url: `https://github.com/${user.login}/${options.name}` };
  } catch (error) {
    console.error('Replace failed:', error);
    return { success: false, error: formatGitHubError(error) };
  }
}

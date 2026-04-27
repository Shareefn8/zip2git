import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import JSZip from 'jszip';
import {
  AlertTriangle, Archive, ArrowDown, ArrowRight, ArrowUpRight, Bug, Check, CheckCircle,
  ChevronDown, ChevronRight, Code, Copy, Download, Edit3, ExternalLink,
  Eye, File as FileIcon, FileCode, FileText, Files, Folder, GitBranch,
  Github, Globe, HelpCircle, Loader2, Lock, Package, RotateCcw, Rocket,
  Shield, Sparkles, Upload, Zap, BookOpen, Users, RefreshCw, Search,
  AlertCircle, Terminal, Layers, Clock, Wrench, Wand2, GitCommit,
  Trash2, ToggleLeft, FileSearch, FolderSearch, HardDrive, History,
  Key, Eraser, ShieldCheck, FolderGit2, Cloud, Plus, FolderUp, Pencil, Heart,
  Scale, GitMerge, KeyRound, BarChart3, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GitHubTokenGuide } from '@/components/GitHubTokenGuide';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DonationSection } from '@/components/DonationSection';
import { AdSlot } from '@/components/AdSlotProvider';
import { PromotionFeed } from '@/components/PromotionFeed';
import { SEOHead } from '@/components/SEOHead';
import { SmartRecoveryAssistant } from '@/components/SmartRecoveryAssistant';
import { ReviewsSection } from '@/components/ReviewsSection';
import { BeginnerMode } from '@/components/BeginnerMode';
import {
  analyzeProject, generateCommitMessage, generateGitignore, generateReadme, ProjectInfo,
} from '@/lib/projectAnalyzer';
import {
  createAndPushRepo, GitHubUser, PushProgress, RepoFile, validateToken,
  listUserRepos, replaceRepoContents, RepoSummary,
} from '@/lib/githubService';
import { Link } from 'react-router-dom';

// ── Types ────────────────────────────────────────────────────────────
interface FileNode {
  name: string; path: string; type: 'file' | 'folder'; children?: FileNode[];
}
interface UploadedProjectFile {
  path: string; name: string; extension: string; size: number;
  base64: string; textContent?: string; isText: boolean;
}
interface WorkspaceReport {
  issues: string[]; highlights: string[]; blockedSensitiveFiles: string[]; markdown: string;
}

// ── Helpers ──────────────────────────────────────────────────────────
const TEXT_EXTENSIONS = new Set([
  '.txt','.md','.json','.js','.ts','.jsx','.tsx','.css','.scss','.sass',
  '.html','.htm','.xml','.yaml','.yml','.toml','.ini','.cfg','.conf',
  '.py','.java','.php','.rb','.go','.rs','.c','.cpp','.h','.hpp',
  '.sh','.bash','.zsh','.fish','.ps1','.bat','.cmd','.vue','.svelte',
  '.astro','.sql','.graphql','.gql','.env','.gitignore','.editorconfig',
  '.prettierrc','.eslintrc','.babelrc','.npmrc','dockerfile','makefile','readme','license',
]);
const IMAGE_MIME: Record<string, string> = {
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon',
};
const BLOCKED = [
  /(^|\/)\.env($|\.)/i, /(^|\/)\.npmrc$/i, /(^|\/)id_(rsa|dsa|ed25519)(\.pub)?$/i,
  /\.pem$/i, /\.p12$/i, /\.pfx$/i, /service-account/i, /google-credentials/i,
];

const norm = (p: string) => p.replace(/\\/g,'/').replace(/^\.\/|^\//,'').replace(/\/+/g,'/');
const ext = (p: string) => { const i = p.lastIndexOf('.'); return i >= 0 ? p.slice(i).toLowerCase() : ''; };
const fname = (p: string) => p.split('/').pop() || p;
const isText = (p: string) => { const n = norm(p).toLowerCase(); const e = ext(n); const b = fname(n).toLowerCase(); return TEXT_EXTENSIONS.has(e) || TEXT_EXTENSIONS.has(b) || !e; };
const isImg = (p: string) => ext(p) in IMAGE_MIME;
const mime = (p: string) => IMAGE_MIME[ext(p)] || 'application/octet-stream';
const blocked = (p: string) => BLOCKED.some(r => r.test(norm(p)));

function b64(bytes: Uint8Array): string {
  let s = ''; const c = 0x8000;
  for (let i = 0; i < bytes.length; i += c) s += String.fromCharCode(...bytes.subarray(i, i + c));
  return btoa(s);
}
const strB64 = (v: string) => b64(new TextEncoder().encode(v));

function buildTree(paths: string[]): FileNode[] {
  const tree: FileNode[] = [];
  for (const p of paths) {
    const parts = p.split('/').filter(Boolean); let cur = tree; let cp = '';
    for (let i = 0; i < parts.length; i++) {
      cp = cp ? `${cp}/${parts[i]}` : parts[i]; const last = i === parts.length - 1;
      let n = cur.find(x => x.name === parts[i]);
      if (!n) { n = { name: parts[i], path: cp, type: last ? 'file' : 'folder', children: last ? undefined : [] }; cur.push(n); }
      if (n.children) cur = n.children;
    }
  }
  const sort = (ns: FileNode[]): FileNode[] =>
    ns.sort((a, b) => a.type !== b.type ? (a.type === 'folder' ? -1 : 1) : a.name.localeCompare(b.name))
      .map(n => ({ ...n, children: n.children ? sort(n.children) : undefined }));
  return sort(tree);
}

function folderPaths(ns: FileNode[]): string[] {
  const out: string[] = [];
  const v = (items: FileNode[]) => items.forEach(i => { if (i.type === 'folder') { out.push(i.path); if (i.children) v(i.children); } });
  v(ns); return out;
}

// FNV-1a 32-bit hash — fast content fingerprint
function fastHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16);
}

export function fileFingerprint(f: UploadedProjectFile): string {
  // Use textContent if text, else base64 (already encoded). Include size to reduce collisions.
  const body = f.isText ? (f.textContent ?? '') : f.base64;
  return `${f.size}-${fastHash(body)}`;
}

function genReport(files: UploadedProjectFile[], warnings: string[]): WorkspaceReport {
  // Smart duplicate detection: group by CONTENT fingerprint, not filename.
  const dupMap = new Map<string, string[]>();
  files.forEach(f => {
    const k = fileFingerprint(f);
    dupMap.set(k, [...(dupMap.get(k) || []), f.path]);
  });
  const dups = Array.from(dupMap.values()).filter(g => g.length > 1).map(g => `Duplicate content: ${g.join(' · ')}`);
  const sens = files.filter(f => blocked(f.path)).map(f => f.path);
  const empty = files.filter(f => f.size === 0).map(f => `Empty: ${f.path}`);
  const issues = [...warnings, ...dups, ...empty];
  const highlights = [
    `${files.length} files scanned`, `${files.filter(f => f.isText).length} editable code files`,
    `${sens.length} sensitive files excluded from push`,
  ];
  const md = ['# Workspace Report','','## Highlights',...highlights.map(h=>`- ${h}`),
    '','## Issues',...(issues.length ? issues.map(i=>`- ${i}`) : ['- No issues detected.']),
    '','## Sensitive Files Excluded',...(sens.length ? sens.map(s=>`- ${s}`) : ['- None']),
  ].join('\n');
  return { issues, highlights, blockedSensitiveFiles: sens, markdown: md };
}

// ── FAQ Data ─────────────────────────────────────────────────────────
const FAQ = [
  { q: 'Is Zip2Git completely free?', a: 'Yes. Zip2Git is 100% free with no usage limits, no signups, and no premium tiers. Every feature is available to every user.' },
  { q: 'Is my GitHub token safe?', a: 'Absolutely. Your token lives only in your browser\'s runtime memory during your session. It\'s never stored in localStorage, cookies, or sent to any server. When you close the tab, it\'s gone.' },
  { q: 'Does it work with all project types?', a: 'Yes. Zip2Git pushes every file in your ZIP exactly as-is — HTML, React, Python, Java, PHP, Go, images, fonts, binaries. The framework detection is a convenience feature, not a requirement.' },
  { q: 'Will it overwrite my existing repository?', a: 'If a repository with the same name exists, Zip2Git will create a new commit on the default branch. Your existing Git history is preserved.' },
  { q: 'What happens to .env and sensitive files?', a: 'Files matching sensitive patterns (.env, .pem, private keys, service accounts) are automatically detected and excluded from the push. You\'ll see them flagged in the workspace report.' },
  { q: 'Can I edit files before pushing?', a: 'Yes. After uploading a ZIP, you can click any text file in the file tree to view and edit it. Changes are reflected in the final push. You can also edit the auto-generated README.md and .gitignore.' },
  { q: 'What is Smart Recovery Assistant?', a: 'It\'s a built-in guide that helps you recover deleted files, folders, EXE files, code changes, or even restore your entire repository to a previous state — with direct links to GitHub\'s recovery pages.' },
  { q: 'Can I push to a private repository?', a: 'Yes! You can choose between Public and Private when naming your repository. Private repos require a GitHub token with the "repo" scope.' },
];

// ── Developer Tools Data ─────────────────────────────────────────────
type ToolAction = 'recovery' | 'info' | 'connect' | 'my-repos' | 'license' | 'branch-protection' | 'ssh-keys' | 'account-stats';
const DEVELOPER_TOOLS: Array<{
  icon: typeof Wrench;
  title: string;
  desc: string;
  action: ToolAction;
  color: string;
  bg: string;
  badge?: string;
}> = [
  // ── Account-connected tools (require GitHub sign-in) — shown first ──
  {
    icon: FolderGit2,
    title: 'My GitHub Repositories',
    desc: 'Browse, search and open every repo on your account in one panel — no need to switch to GitHub.',
    action: 'my-repos',
    color: 'text-primary',
    bg: 'bg-primary/10',
    badge: 'Account',
  },
  {
    icon: BarChart3,
    title: 'Account Insights',
    desc: 'Get a quick overview of your GitHub account — total repos, public vs private, recently updated projects.',
    action: 'account-stats',
    color: 'text-accent',
    bg: 'bg-accent/10',
    badge: 'Account',
  },
  {
    icon: GitMerge,
    title: 'Branch Protection Helper',
    desc: 'Step-by-step guide to lock your main branch — require PRs, reviews, status checks, and signed commits.',
    action: 'branch-protection',
    color: 'text-accent',
    bg: 'bg-accent/10',
    badge: 'Account',
  },
  {
    icon: KeyRound,
    title: 'SSH Key Setup Guide',
    desc: 'Generate, copy, and add an SSH key to your GitHub account — push without typing your password again.',
    action: 'ssh-keys',
    color: 'text-primary',
    bg: 'bg-primary/10',
    badge: 'Account',
  },

  // ── General developer tools (work on any uploaded project) ──
  {
    icon: Wrench,
    title: 'Smart Recovery Assistant',
    desc: 'Recover deleted files, folders, EXE files, code changes, or restore your entire repository to a previous state.',
    action: 'recovery',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Shield,
    title: 'Secret Shield Scanner',
    desc: 'Scan any project for exposed API keys, .env files, private keys, and service account credentials before they leak.',
    action: 'info',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
  {
    icon: Scale,
    title: 'License Picker',
    desc: 'Generate the right open-source LICENSE (MIT, Apache, GPL, BSD, ISC) with your name and year auto-filled.',
    action: 'license',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: FileText,
    title: 'README Generator',
    desc: 'Auto-generate professional README.md files with badges, tech stack, quick-start commands, and project structure.',
    action: 'info',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: FileCode,
    title: '.gitignore Builder',
    desc: 'Smart .gitignore generation based on your framework. Covers node_modules, build artifacts, IDE files, and OS junk.',
    action: 'info',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Search,
    title: 'Duplicate File Detector',
    desc: 'Find files with identical names across directories — spot redundancies, resolve conflicts, and clean your project.',
    action: 'info',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Archive,
    title: 'Clean ZIP Export',
    desc: 'Download a sanitized version of your project with all sensitive files removed — safe to share with anyone.',
    action: 'info',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
];

// ── Articles Data ────────────────────────────────────────────────────
const ARTICLES = [
  {
    icon: Terminal,
    title: 'Why Git Frustrates Beginners',
    body: 'Git\'s command-line interface was built for experienced developers. For students and self-taught coders, the learning curve can be a blocker. Zip2Git removes that barrier entirely — upload, review, push.',
  },
  {
    icon: Shield,
    title: 'The Hidden Danger of Pushing .env Files',
    body: 'Accidentally pushing API keys and secrets to a public repository is one of the most common security mistakes. Our Secret Shield automatically detects and blocks sensitive files before they ever reach GitHub.',
  },
  {
    icon: Layers,
    title: 'Understanding Your Project Structure',
    body: 'A clean project structure makes collaboration easier. Zip2Git\'s workspace report analyzes your file tree, detects duplicate filenames, flags empty files, and generates a professional README — all automatically.',
  },
  {
    icon: Clock,
    title: 'From ZIP to Repository in 5 Seconds',
    body: 'Traditional Git workflows involve initializing a repo, staging files, writing commits, and configuring remotes. Zip2Git compresses this entire workflow into a single drag-and-drop experience.',
  },
];

// ── Component ────────────────────────────────────────────
const Index = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [workspaceReport, setWorkspaceReport] = useState<WorkspaceReport | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [warnings, setWarnings] = useState<string[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedProjectFile[]>([]);
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'files' | 'readme' | 'gitignore' | 'report' | 'tools' | 'deploy' | 'boilerplate'>('files');
  const [editingMode, setEditingMode] = useState(false);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [generatedReadme, setGeneratedReadme] = useState('');
  const [generatedGitignore, setGeneratedGitignore] = useState('');
  const [showTokenGuide, setShowTokenGuide] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [validatingToken, setValidatingToken] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [pushMode, setPushMode] = useState<'new' | 'update'>('new');
  const [userRepos, setUserRepos] = useState<RepoSummary[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedExistingRepo, setSelectedExistingRepo] = useState<string>('');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [pushProgress, setPushProgress] = useState<PushProgress | null>(null);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<Set<number>>(new Set([0, 1, 2, 3, 4]));
  const [showRecovery, setShowRecovery] = useState(false);
  const [selectedIgnore, setSelectedIgnore] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [toolsCopied, setToolsCopied] = useState(false);
  const [excludedPaths, setExcludedPaths] = useState<Set<string>>(new Set());
  const [deployConfigs, setDeployConfigs] = useState<{ netlify: boolean; vercel: boolean; dockerfile: boolean }>({ netlify: false, vercel: false, dockerfile: false });
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; currentFile: string; recentFiles: string[] }>({ current: 0, total: 0, currentFile: '', recentFiles: [] });
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [showMyRepos, setShowMyRepos] = useState(false);
  const [reposFilter, setReposFilter] = useState('');
  const [openTool, setOpenTool] = useState<null | 'license' | 'branch-protection' | 'ssh-keys' | 'account-stats'>(null);
  const [licenseChoice, setLicenseChoice] = useState<'mit' | 'apache' | 'gpl' | 'bsd' | 'isc'>('mit');
  const [licenseAuthor, setLicenseAuthor] = useState('');

  // ── Don't-refresh protection while processing or pushing ───────────
  useEffect(() => {
    const busy = processing || pushing;
    if (!busy) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Your upload is in progress. Refreshing or leaving this page will cancel it. Are you sure?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [processing, pushing]);

  // ── Rename a file (path update) — keeps everything in sync ─────────
  const renameFile = (oldPath: string, newPath: string) => {
    const cleaned = norm(newPath).replace(/^\/+|\/+$/g, '');
    if (!cleaned || cleaned === oldPath) {
      setRenamingPath(null);
      return;
    }
    if (uploadedFiles.some(f => f.path === cleaned)) {
      toast({ title: '❌ Path already exists', description: cleaned, variant: 'destructive' });
      return;
    }
    setUploadedFiles(prev => prev.map(f => f.path === oldPath ? { ...f, path: cleaned, name: fname(cleaned), extension: ext(cleaned) } : f));
    setFilePaths(prev => prev.map(p => p === oldPath ? cleaned : p));
    setFileTree(buildTree(filePaths.map(p => p === oldPath ? cleaned : p)));
    setTextOverrides(prev => {
      if (!(oldPath in prev)) return prev;
      const { [oldPath]: v, ...rest } = prev;
      return { ...rest, [cleaned]: v };
    });
    setExcludedPaths(prev => {
      if (!prev.has(oldPath)) return prev;
      const n = new Set(prev);
      n.delete(oldPath);
      n.add(cleaned);
      return n;
    });
    if (selectedFilePath === oldPath) setSelectedFilePath(cleaned);
    setRenamingPath(null);
    toast({ title: '✏️ Renamed', description: `${oldPath.split('/').pop()} → ${cleaned.split('/').pop()}` });
  };

  // Keep only one file from a duplicate group, exclude the rest from push
  const keepOnlyThis = (keepPath: string, allPaths: string[]) => {
    setExcludedPaths(prev => {
      const n = new Set(prev);
      allPaths.forEach(p => { if (p !== keepPath) n.add(p); });
      n.delete(keepPath);
      return n;
    });
    toast({ title: '✅ Kept one copy', description: `${allPaths.length - 1} duplicate(s) excluded from push.` });
  };

  const toggleFaq = (i: number) => {
    setOpenFaq(prev => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const removeUploadedFile = (path: string) => {
    setExcludedPaths(prev => new Set(prev).add(path));
    if (selectedFilePath === path) setSelectedFilePath(null);
    toast({ title: '🗑️ Removed', description: `${path.split('/').pop()} excluded from push.` });
  };

  const restoreUploadedFile = (path: string) => {
    setExcludedPaths(prev => {
      const n = new Set(prev);
      n.delete(path);
      return n;
    });
  };

  // Developer Tools Templates
  const GITIGNORE_TEMPLATES: Record<string, string> = {
    'Node.js': `node_modules/\ndist/\n.env\n.env.*\n*.log\n.DS_Store\ncoverage/\n.cache/`,
    'Python': `__pycache__/\n*.py[cod]\n.env\nvenv/\n*.egg-info/\ndist/\nbuild/\n.pytest_cache/`,
    'Java': `*.class\n*.jar\ntarget/\n.idea/\n*.iml\n.gradle/\nbuild/`,
    'React': `node_modules/\nbuild/\n.env\n.env.local\n.DS_Store\ncoverage/\n.cache/`,
    'Laravel': `vendor/\nnode_modules/\n.env\nstorage/*.key\npublic/storage\npublic/hot`,
    'Flutter': `.dart_tool/\n.packages\nbuild/\n*.g.dart\n.flutter-plugins*`,
    'Go': `bin/\npkg/\n*.exe\n*.test\n*.out\nvendor/`,
    'General': `*.log\n*.tmp\n*.bak\n.DS_Store\nThumbs.db\n*.swp\n*~\n.env`,
  };

  const LICENSE_TEMPLATES: Record<string, string> = {
    'MIT': `MIT License\n\nCopyright (c) ${new Date().getFullYear()} [Your Name]\n\nPermission is hereby granted, free of charge, to any person obtaining a copy...`,
    'Apache 2.0': `Apache License\nVersion 2.0, January 2004\nhttp://www.apache.org/licenses/\n\nTerms and conditions...`,
    'GPL v3': `GNU GENERAL PUBLIC LICENSE\nVersion 3, 29 June 2007\n\nEveryone is permitted to copy...`,
  };

  const copyToolText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: '✅ Copied to clipboard' });
    setToolsCopied(true);
    setTimeout(() => setToolsCopied(false), 2000);
  };

  const currentStep = !zipFile ? 1 : !githubUser ? 2 : !pushSuccess ? 3 : 4;

  const selectedFile = useMemo(
    () => uploadedFiles.find(f => f.path === selectedFilePath) || null,
    [selectedFilePath, uploadedFiles],
  );
  const selectedFileContent = selectedFile?.isText ? (textOverrides[selectedFile.path] ?? selectedFile.textContent ?? '') : '';
  const selectedImagePreview = selectedFile && !selectedFile.isText && isImg(selectedFile.path)
    ? `data:${mime(selectedFile.path)};base64,${selectedFile.base64}` : null;

  const pushFiles = useMemo(() => {
    const m = new Map<string, RepoFile>();
    uploadedFiles.forEach(f => {
      if (blocked(f.path)) return;
      if (excludedPaths.has(f.path)) return;
      m.set(f.path, { path: f.path, content: f.isText ? strB64(textOverrides[f.path] ?? f.textContent ?? '') : f.base64, encoding: 'base64', size: f.size, isText: f.isText });
    });
    // Always re-inject Zip2Git attribution into README before push, even if user removed it in the editor.
    const ATTRIB = `\n\n---\n\n<!-- ZIP2GIT_ATTRIBUTION:DO_NOT_REMOVE -->\n> 🚀 **Pushed to GitHub using [Zip2Git](https://zip2git.online)** — the free ZIP → GitHub converter by [codebyshareef](https://codebyshareef.online).\n<!-- /ZIP2GIT_ATTRIBUTION -->\n`;
    const readmeOut = /ZIP2GIT_ATTRIBUTION/.test(generatedReadme) ? generatedReadme : (generatedReadme.trimEnd() + ATTRIB);
    m.set('README.md', { path: 'README.md', content: strB64(readmeOut), encoding: 'base64', isText: true, size: readmeOut.length });
    m.set('.gitignore', { path: '.gitignore', content: strB64(generatedGitignore), encoding: 'base64', isText: true, size: generatedGitignore.length });

    // Optional deployment configs
    if (deployConfigs.netlify) {
      const netlify = `[build]\n  command = "${projectInfo?.buildCommand || 'npm run build'}"\n  publish = "dist"\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n`;
      m.set('netlify.toml', { path: 'netlify.toml', content: strB64(netlify), encoding: 'base64', isText: true, size: netlify.length });
    }
    if (deployConfigs.vercel) {
      const vercel = JSON.stringify({
        buildCommand: projectInfo?.buildCommand || 'npm run build',
        outputDirectory: 'dist',
        framework: null,
        rewrites: [{ source: '/(.*)', destination: '/index.html' }],
      }, null, 2);
      m.set('vercel.json', { path: 'vercel.json', content: strB64(vercel), encoding: 'base64', isText: true, size: vercel.length });
    }
    if (deployConfigs.dockerfile) {
      const docker = `FROM node:20-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN ${projectInfo?.buildCommand || 'npm run build'}\n\nFROM nginx:alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n`;
      m.set('Dockerfile', { path: 'Dockerfile', content: strB64(docker), encoding: 'base64', isText: true, size: docker.length });
    }
    return m;
  }, [generatedGitignore, generatedReadme, textOverrides, uploadedFiles, excludedPaths, deployConfigs, projectInfo]);

  // ── Handlers ──────────────────────────────────────────────────────
  const triggerFileSelect = () => fileInputRef.current?.click();

  const processZip = async (file: File) => {
    setProcessing(true); setWarnings([]); setPushSuccess(null);
    setUploadProgress({ current: 0, total: 0, currentFile: 'Reading ZIP archive…', recentFiles: [] });
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const visible = Object.values(contents.files).filter(e => !e.dir && !e.name.includes('__MACOSX') && !e.name.endsWith('.DS_Store'));
      const tops = new Set(visible.map(e => norm(e.name).split('/').filter(Boolean)[0]).filter(Boolean));
      const root = tops.size === 1 ? `${Array.from(tops)[0]}/` : '';
      const nf: UploadedProjectFile[] = []; const nw: string[] = []; const tm = new Map<string, string>();
      const total = visible.length;
      setUploadProgress({ current: 0, total, currentFile: '', recentFiles: [] });
      for (let i = 0; i < visible.length; i++) {
        const entry = visible[i];
        const raw = norm(entry.name); const p = root && raw.startsWith(root) ? raw.slice(root.length) : raw;
        if (!p) continue;
        // Update progress before extracting (so user sees current file)
        setUploadProgress(prev => ({
          current: i + 1,
          total,
          currentFile: p,
          recentFiles: [p, ...prev.recentFiles].slice(0, 6),
        }));
        // Yield to the browser every few files so the UI can repaint
        if (i % 8 === 0) await new Promise(r => setTimeout(r, 0));
        const bytes = await entry.async('uint8array'); const txt = isText(p); const tc = txt ? new TextDecoder().decode(bytes) : undefined;
        nf.push({ path: p, name: fname(p), extension: ext(p), size: bytes.length, base64: b64(bytes), textContent: tc, isText: txt });
        if (tc !== undefined) tm.set(p, tc);
        if (blocked(p)) nw.push(`Sensitive file detected: ${p}`);
      }
      const np = nf.map(f => f.path); const nt = buildTree(np); const nr = genReport(nf, nw);
      const info = analyzeProject(tm, np); const bn = file.name.replace('.zip', '').replace(/[^a-zA-Z0-9-_]/g, '-');
      setZipFile(file); setUploadedFiles(nf); setFilePaths(np); setFileTree(nt);
      setExpandedFolders(new Set(folderPaths(nt))); setWarnings(nw); setExcludedPaths(new Set());
      setWorkspaceReport(nr); setTextOverrides({}); setSelectedFilePath(nf[0]?.path || null);
      setActivePanel('files'); setEditingMode(false); setProjectInfo(info);
      setRepoName(bn); setGeneratedReadme(generateReadme(bn, info)); setGeneratedGitignore(generateGitignore(info));
      toast({ title: '✅ Workspace Ready', description: `${np.length} files scanned and analyzed` });
    } catch { toast({ title: 'Error', description: 'Please upload a valid ZIP file.', variant: 'destructive' }); }
    finally {
      setProcessing(false);
      setUploadProgress({ current: 0, total: 0, currentFile: '', recentFiles: [] });
    }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f?.name.endsWith('.zip')) processZip(f); else toast({ title: 'Invalid file', description: 'Please upload a .zip file.', variant: 'destructive' }); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) processZip(f); };
  const toggleFolder = (p: string) => { const n = new Set(expandedFolders); n.has(p) ? n.delete(p) : n.add(p); setExpandedFolders(n); };

  const handleTokenSubmit = async (token: string) => {
    setValidatingToken(true); const user = await validateToken(token); setValidatingToken(false);
    if (user) {
      setGithubToken(token); setGithubUser(user); setShowTokenGuide(false);
      toast({ title: '✅ Connected', description: `@${user.login}` });
      setLoadingRepos(true);
      const repos = await listUserRepos(token);
      setUserRepos(repos);
      setLoadingRepos(false);
    }
    else toast({ title: 'Invalid token', description: 'Check your token.', variant: 'destructive' });
  };

  const handleDeleteToken = () => {
    setGithubToken(null);
    setGithubUser(null);
    setUserRepos([]);
    setSelectedExistingRepo('');
    setPushMode('new');
    toast({ title: '🗑️ Token Deleted', description: 'Your GitHub token has been removed from memory. You can safely close this tab.' });
  };

  const refreshRepos = async () => {
    if (!githubToken) return;
    setLoadingRepos(true);
    const repos = await listUserRepos(githubToken);
    setUserRepos(repos);
    setLoadingRepos(false);
    toast({ title: '🔄 Refreshed', description: `${repos.length} repositories loaded.` });
  };

  const handlePush = async () => {
    if (!githubToken || !projectInfo || !pushFiles.size) return;
    const targetRepo = pushMode === 'update' ? selectedExistingRepo : repoName;
    if (!targetRepo) {
      toast({ title: 'Pick a repository', description: pushMode === 'update' ? 'Choose an existing repo to update.' : 'Enter a repository name.', variant: 'destructive' });
      return;
    }
    if (pushMode === 'update' && !confirmReplace) {
      toast({ title: 'Confirm clean replace', description: 'Tick the confirmation box — old files in the selected repo will be removed.', variant: 'destructive' });
      return;
    }
    setPushing(true); setPushProgress({ step: 'Preparing...', progress: 0 });
    const commitMsg = pushMode === 'update'
      ? `chore: clean replace via Zip2Git — ${projectInfo.framework || 'project'} reset`
      : generateCommitMessage(projectInfo, targetRepo);
    const result = pushMode === 'update'
      ? await replaceRepoContents(githubToken, { name: targetRepo, files: pushFiles, commitMessage: commitMsg }, (p) => setPushProgress(p))
      : await createAndPushRepo(githubToken, { name: targetRepo, isPrivate, files: pushFiles, commitMessage: commitMsg }, (p) => setPushProgress(p));
    setPushing(false);
    if (result.success && result.url) { setPushSuccess(result.url); toast({ title: '🚀 Success!', description: 'Project pushed to GitHub' }); }
    else toast({ title: 'Push failed', description: result.error || 'Check your token permissions.', variant: 'destructive' });
  };

  const resetZipOnly = () => {
    setZipFile(null); setUploadedFiles([]); setFilePaths([]); setFileTree([]); setWorkspaceReport(null);
    setPushSuccess(null); setRepoName(''); setProjectInfo(null);
  };

  const copy = (t: string, w: string) => { navigator.clipboard.writeText(t); toast({ title: `${w} copied` }); };

  const dlCleanZip = async () => {
    if (!pushFiles.size) return; const z = new JSZip();
    for (const [p, f] of pushFiles) z.file(p, f.content, { base64: true });
    const blob = await z.generateAsync({ type: 'blob' }); const u = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = u; a.download = `${repoName || 'project'}-clean.zip`; a.click(); URL.revokeObjectURL(u);
    toast({ title: '✅ Exported', description: 'Sanitized ZIP file downloaded.' });
  };

  const renderTree = (nodes: FileNode[], level = 0) =>
    nodes.map(n => {
      const isExcluded = excludedPaths.has(n.path);
      return (
        <div key={n.path} className="min-w-0">
          <div className={`file-tree-item group cursor-pointer ${selectedFilePath === n.path ? 'bg-primary/10 text-foreground' : ''} ${isExcluded ? 'opacity-50 line-through' : ''}`} style={{ paddingLeft: `${Math.min(level * 10, 30)}px` }}>
            <div className="flex min-w-0 items-center gap-1.5 overflow-hidden flex-1"
              onClick={() => { if (n.type === 'folder') { toggleFolder(n.path); return; } setSelectedFilePath(n.path); setActivePanel('files'); setEditingMode(false); }}>
              {n.type === 'folder' ? (<>{expandedFolders.has(n.path) ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}<Folder className="h-3.5 w-3.5 shrink-0 text-primary" /></>) : (<><span className="w-3.5 shrink-0" /><FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></>)}
              <span className="truncate text-xs sm:text-sm font-medium">{n.name}</span>
            </div>
            {n.type === 'file' && (
              isExcluded ? (
                <button onClick={(e) => { e.stopPropagation(); restoreUploadedFile(n.path); }} className="opacity-100 px-1.5 py-0.5 text-[10px] rounded bg-primary/20 text-primary hover:bg-primary/30 shrink-0" title="Restore file">
                  Undo
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); removeUploadedFile(n.path); }} className="opacity-0 group-hover:opacity-100 sm:opacity-0 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive shrink-0 transition-opacity" title="Remove from push">
                  <Trash2 className="h-3 w-3" />
                </button>
              )
            )}
          </div>
          {n.type === 'folder' && expandedFolders.has(n.path) && n.children && renderTree(n.children, level + 1)}
        </div>
      );
    });

  const renderFilePreview = () => {
    if (!selectedFile) return <p className="text-muted-foreground text-sm">Select a file to preview</p>;
    
    if (selectedFile.isText) {
      return (
        <div className="min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="font-semibold text-sm truncate">{selectedFile.name}</h4>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => copy(selectedFileContent, 'File copied')} className="h-7 px-2 text-xs"><Copy className="h-3 w-3" /> Copy</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingMode(!editingMode)} className="h-7 px-2 text-xs"><Edit3 className="h-3 w-3" /> {editingMode ? 'Preview' : 'Edit'}</Button>
            </div>
          </div>
          {editingMode ? (
            <textarea value={selectedFileContent} onChange={e => setTextOverrides({ ...textOverrides, [selectedFile.path]: e.target.value })} className="h-64 w-full resize-none rounded-lg border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary" />
          ) : (
            <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-3 font-mono text-xs overflow-x-auto max-h-96">{selectedFileContent}</pre>
          )}
        </div>
      );
    } else if (selectedImagePreview) {
      return (
        <div className="min-w-0 space-y-2">
          <h4 className="font-semibold text-sm">{selectedFile.name}</h4>
          <img src={selectedImagePreview} alt={selectedFile.name} className="max-w-full h-auto rounded-lg border border-border" />
        </div>
      );
    } else {
      return (
        <div className="min-w-0 space-y-2">
          <h4 className="font-semibold text-sm">{selectedFile.name}</h4>
          <div className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
            <p>📦 Binary file</p>
            <p className="text-xs mt-2">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
            <p className="text-xs">Type: {selectedFile.extension}</p>
          </div>
        </div>
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Zip2Git - Free ZIP to GitHub Repo Converter with AI"
        description="Free AI tool to convert any ZIP file into a clean GitHub-ready repository. Smart recovery, auto README, secret shield, inline editor. Built by codebyshareef."
        path="/"
        image="https://i.ibb.co/35h609k7/1-zip2git.png"
      />
      <Navbar />
      <input type="file" ref={fileInputRef} accept=".zip" onChange={handleFileSelect} className="hidden" />
      <GitHubTokenGuide isOpen={showTokenGuide} onClose={() => setShowTokenGuide(false)} onTokenSubmit={handleTokenSubmit} isValidating={validatingToken} />
      <SmartRecoveryAssistant isOpen={showRecovery} onClose={() => setShowRecovery(false)} />

      <main>
        {/* ── HERO ── */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="bg-hero-glow absolute inset-0" />
          <div className="bg-grid absolute inset-0 opacity-30" />
          <div className="container relative mx-auto px-4 py-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-4xl text-center space-y-4 sm:space-y-5">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Zap className="h-3.5 w-3.5" /> 100% Free Forever — No Signup Required
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="font-display text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                Push Your ZIP to GitHub<br />
                <span className="text-gradient">in 5 Seconds</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mx-auto max-w-2xl text-muted-foreground text-xs sm:text-sm">
                Upload any ZIP file. Auto-detect frameworks. Block sensitive files. Generate README. Push directly to GitHub — fast, reliable, and completely free.
              </motion.p>
            </div>
          </div>
        </section>

        <div className="border-b border-border/40 bg-card/30">
          <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-2.5">
            <div className="flex items-center gap-2 mx-auto sm:mx-0">
              {[{ n: 1, l: 'Upload' }, { n: 2, l: 'Connect' }, { n: 3, l: 'Push' }, { n: 4, l: 'Done' }].map((s, i) => (
                <React.Fragment key={s.n}>
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${currentStep >= s.n ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {currentStep > s.n ? <Check className="h-3.5 w-3.5" /> : <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold">{s.n}</span>}
                    <span className="hidden sm:inline">{s.l}</span>
                  </div>
                  {i < 3 && <div className={`h-0.5 w-6 rounded ${currentStep > s.n ? 'bg-primary' : 'bg-border'}`} />}
                </React.Fragment>
              ))}
            </div>
            <div className="hidden sm:block">
              <BeginnerMode step={currentStep as 1 | 2 | 3 | 4} />
            </div>
          </div>
          <div className="sm:hidden flex justify-center pb-2 px-4">
            <BeginnerMode step={currentStep as 1 | 2 | 3 | 4} />
          </div>
        </div>

        {/* ── UPLOAD ZONE (only when no ZIP loaded) ── */}
        {!zipFile && (
          <section className="container mx-auto px-4 py-4 sm:py-6 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={processing ? undefined : triggerFileSelect}
              onDragOver={e => { if (!processing) { e.preventDefault(); setIsDragging(true); } }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={processing ? undefined : handleDrop}
              className={`upload-zone mx-auto flex max-w-3xl ${processing ? 'cursor-progress' : 'cursor-pointer'} flex-col items-center justify-center ${isDragging ? 'active' : ''}`}
            >
              {processing ? (
                <div className="w-full max-w-xl space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="upload-hero-icon">
                      <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-base sm:text-lg font-semibold font-display">Analyzing your project…</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {uploadProgress.total > 0
                        ? `Scanning file ${uploadProgress.current} of ${uploadProgress.total}`
                        : 'Reading ZIP archive…'}
                    </p>
                  </div>

                  {uploadProgress.total > 0 && (
                    <div className="space-y-1.5">
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-150"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                        <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                        <span>{uploadProgress.current} / {uploadProgress.total} files</span>
                      </div>
                    </div>
                  )}

                  {uploadProgress.currentFile && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 sm:p-3">
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mb-1">
                        <FileIcon className="h-3 w-3 text-primary" />
                        <span className="font-semibold uppercase tracking-wider">Currently uploading</span>
                      </div>
                      <p className="font-mono text-xs sm:text-sm text-foreground truncate" title={uploadProgress.currentFile}>
                        {uploadProgress.currentFile}
                      </p>
                    </div>
                  )}

                  {uploadProgress.recentFiles.length > 1 && (
                    <details className="rounded-lg border border-border bg-background/50 p-2.5 sm:p-3 text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                        Recent files ({uploadProgress.recentFiles.length - 1})
                      </summary>
                      <ul className="mt-2 space-y-0.5 max-h-32 overflow-y-auto">
                        {uploadProgress.recentFiles.slice(1).map((p, i) => (
                          <li key={`${p}-${i}`} className="font-mono text-[10px] sm:text-xs text-muted-foreground truncate flex items-center gap-1.5">
                            <Check className="h-3 w-3 text-primary shrink-0" /> {p}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 sm:p-3 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                      <strong>Don't refresh or close this tab.</strong> Your upload will be lost if you leave. Hang tight — we're processing every file in your browser, nothing leaves your device.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full text-center">
                  <div className="relative flex items-center justify-center mb-4">
                    <div className="upload-hero-icon">
                      <FolderUp className="h-9 w-9 sm:h-11 sm:w-11 text-primary" strokeWidth={2.2} />
                      <span className="upload-pulse-dot top-2 right-2" />
                      <span className="absolute -bottom-2 -right-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-accent text-accent-foreground border-2 border-background shadow-md">
                        <Github className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>
                  </div>
                  <p className="mb-1 text-lg sm:text-xl font-bold font-display">Drop your ZIP file here</p>
                  <p className="mb-4 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                    Or click to browse. Auto-detects framework, blocks secrets, generates README — all in your browser.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="hero" size="lg" className="shadow-xl shadow-primary/20">
                      <Upload className="h-5 w-5" /> Select ZIP File
                    </Button>
                    <Button variant="outline" size="lg" onClick={(e) => { e.stopPropagation(); setShowTokenGuide(true); }} className={githubUser ? "border-primary/50 text-primary" : ""}>
                      {githubUser ? (
                        <><img src={githubUser.avatar_url} alt="" className="h-5 w-5 rounded-full" /> @{githubUser.login}</>
                      ) : (
                        <><Github className="h-5 w-5" /> Connect GitHub</>
                      )}
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> No signup</span>
                    <span className="inline-flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> Browser-only</span>
                    <span className="inline-flex items-center gap-1"><Lock className="h-3 w-3 text-primary" /> Token never stored</span>
                  </div>
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* Ad Slot — fixed slot 1 (below upload area) */}
        {!zipFile && <AdSlot slot={1} className="container mx-auto px-4 sm:px-6 py-2" />}

        {/* ── 4 SMART QUICK ACTIONS — replaces useless nav clones ── */}
        {!zipFile && !pushSuccess && (
          <section className="border-t border-border/40 py-4 sm:py-6">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mb-3 text-center">
                <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick actions
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* 1. Connect / Profile */}
                <button
                  type="button"
                  onClick={() => githubUser ? setShowMyRepos(true) : setShowTokenGuide(true)}
                  className="quick-action-card group"
                  data-testid="button-quick-github"
                >
                  <span className={`quick-action-bubble ${githubUser ? 'bg-primary/15 text-primary' : 'bg-amber-500/15 text-amber-600'}`}>
                    {githubUser ? (
                      <img src={githubUser.avatar_url} alt="" className="h-full w-full rounded-md object-cover" />
                    ) : (
                      <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </span>
                  <span className="quick-action-text">
                    <span className="quick-action-label">{githubUser ? `@${githubUser.login}` : 'Connect GitHub'}</span>
                    <span className="quick-action-sub">{githubUser ? 'View your repos' : 'Add your token'}</span>
                  </span>
                </button>

                {/* 2. Smart Recovery */}
                <button
                  type="button"
                  onClick={() => setShowRecovery(true)}
                  className="quick-action-card group"
                  data-testid="button-quick-recovery"
                >
                  <span className="quick-action-bubble bg-accent/15 text-accent">
                    <History className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="quick-action-text">
                    <span className="quick-action-label">Smart Recovery</span>
                    <span className="quick-action-sub">Restore deleted files</span>
                  </span>
                </button>

                {/* 3. My Repos */}
                <button
                  type="button"
                  onClick={() => githubUser ? setShowMyRepos(true) : setShowTokenGuide(true)}
                  className="quick-action-card group"
                  data-testid="button-quick-myrepos"
                >
                  <span className="quick-action-bubble bg-emerald-500/15 text-emerald-600">
                    <FolderGit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="quick-action-text">
                    <span className="quick-action-label">My Repositories</span>
                    <span className="quick-action-sub">{githubUser ? `${userRepos.length || '…'} repos` : 'Connect first'}</span>
                  </span>
                </button>

                {/* 4. Pro Toolkit */}
                <button
                  type="button"
                  onClick={() => document.getElementById('developer-toolkit')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="quick-action-card group"
                  data-testid="button-quick-toolkit"
                >
                  <span className="quick-action-bubble bg-primary/15 text-primary">
                    <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="quick-action-text">
                    <span className="quick-action-label">Pro Toolkit</span>
                    <span className="quick-action-sub">{DEVELOPER_TOOLS.length}+ dev tools</span>
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── WORKSPACE (ZIP loaded) ── */}
        {zipFile && !pushSuccess && (
          <section className="container mx-auto px-3 py-6 sm:px-6 sm:py-8 overflow-x-hidden">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold mb-1">Workspace</h2>
                  <p className="text-sm text-muted-foreground">Review, edit, and push your project to GitHub</p>
                </div>
                <Button variant="outline" size="sm" onClick={resetZipOnly} className="w-full sm:w-auto"><RotateCcw className="h-4 w-4" /> New Upload</Button>
              </div>

              {/* Step 1: ZIP Info */}
              <div className="glass-card p-4 sm:p-5 border-l-4 border-l-primary">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Archive className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base">ZIP File Uploaded</h3>
                      <p className="truncate text-xs sm:text-sm text-muted-foreground">{zipFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(zipFile.size / 1024).toFixed(1)} KB · {filePaths.length} files · {pushFiles.size} ready</p>
                    </div>
                  </div>
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                </div>
              </div>

              {/* Step 2: Analysis & Warnings */}
              <div className="grid gap-4 sm:grid-cols-2">
                {projectInfo && (
                  <div className="glass-card p-4 sm:p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-display font-semibold text-sm sm:text-base"><Sparkles className="h-4 w-4 text-primary" /> Project Analysis</h3>
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Framework:</span>
                        <span className="font-medium">{projectInfo.framework}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Language:</span>
                        <span className="font-medium">{projectInfo.language}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pkg Mgr:</span>
                        <span className="font-medium">{projectInfo.packageManager}</span>
                      </div>
                      {projectInfo.detectedLanguages.length > 0 && (
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-muted-foreground">Languages:</span>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {projectInfo.detectedLanguages.map(lang => (
                              <span key={lang} className="inline-block px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">{lang}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className={`glass-card p-4 sm:p-5 border-l-4 transition-colors ${githubUser ? 'border-l-primary' : 'border-l-accent'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${githubUser ? 'bg-primary/10' : 'bg-accent/10'}`}>
                      <Github className={`h-5 w-5 ${githubUser ? 'text-primary' : 'text-accent'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base mb-0.5">
                        {githubUser ? 'GitHub Connected' : 'Connect GitHub'}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mb-3">
                        {githubUser ? `Signed in as @${githubUser.login}` : 'Required to push your project to a repository'}
                      </p>
                      <Button
                        variant={githubUser ? 'outline' : 'hero'}
                        size="sm"
                        onClick={() => setShowTokenGuide(true)}
                        className="w-full sm:w-auto h-9 text-xs px-4 gap-1.5"
                      >
                        {githubUser ? <><RefreshCw className="h-3.5 w-3.5" /> Change Token</> : <><Key className="h-3.5 w-3.5" /> Connect Now</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Browse Files & Tools (Integrated Tabs) */}
              <div className="glass-card p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="flex items-center gap-2 font-display font-semibold text-sm sm:text-base"><Files className="h-4 w-4 text-primary" /> Browse Files</h3>
                  <div className="flex gap-2 items-center">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-md px-2 py-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Private</span>
                      <button onClick={() => setIsPrivate(!isPrivate)} className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${isPrivate ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                        <span className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Repository Name Input */}
                <div className="mb-4 space-y-3">
                  {/* Mode Toggle */}
                  <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-1">
                    <button
                      type="button"
                      onClick={() => { setPushMode('new'); setConfirmReplace(false); }}
                      className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${pushMode === 'new' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Plus className="h-3.5 w-3.5" /> Create New Repo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPushMode('update')}
                      className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition ${pushMode === 'update' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Update Old Repo
                    </button>
                  </div>

                  {pushMode === 'new' ? (
                    <>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Repository Name</label>
                      <input
                        type="text"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        placeholder="Enter repository name"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <p className="text-[10px] text-muted-foreground">This will be the name of your new GitHub repository. {isPrivate ? '(Private)' : '(Public)'}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Select Existing Repo</label>
                        <button type="button" onClick={refreshRepos} disabled={!githubUser || loadingRepos} className="flex items-center gap-1 text-[10px] text-primary hover:underline disabled:opacity-50">
                          <RefreshCw className={`h-3 w-3 ${loadingRepos ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                      </div>
                      {!githubUser ? (
                        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                          Connect your GitHub account first to load your repositories.
                        </div>
                      ) : loadingRepos ? (
                        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your repos…
                        </div>
                      ) : userRepos.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                          No repositories found on this account.
                        </div>
                      ) : (
                        <select
                          value={selectedExistingRepo}
                          onChange={(e) => { setSelectedExistingRepo(e.target.value); setConfirmReplace(false); }}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          <option value="">— Choose a repository —</option>
                          {userRepos.map((r) => (
                            <option key={r.full_name} value={r.name}>
                              {r.name}{r.private ? ' (private)' : ''}
                            </option>
                          ))}
                        </select>
                      )}
                      {selectedExistingRepo && (
                        <label className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                          <input
                            type="checkbox"
                            checked={confirmReplace}
                            onChange={(e) => setConfirmReplace(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 accent-amber-500"
                          />
                          <span className="text-amber-700 dark:text-amber-300">
                            <strong>Clean replace:</strong> All current files in <code className="rounded bg-amber-500/20 px-1">{selectedExistingRepo}</code> will be replaced by your new ZIP. Commit history is preserved.
                          </span>
                        </label>
                      )}
                    </>
                  )}
                </div>

                {/* Integrated Tab Buttons Row */}
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {(['files', 'readme', 'gitignore', 'boilerplate', 'report', 'deploy', 'tools'] as const).map(p => (
                    <Button key={p} size="sm" variant={activePanel === p ? 'default' : 'outline'} onClick={() => setActivePanel(p)} className="shrink-0 text-xs sm:text-sm h-9 px-4">
                      {p === 'files' && <Files className="h-3.5 w-3.5 mr-1.5" />}
                      {p === 'readme' && <FileText className="h-3.5 w-3.5 mr-1.5" />}
                      {p === 'gitignore' && <FileCode className="h-3.5 w-3.5 mr-1.5" />}
                      {p === 'boilerplate' && <Sparkles className="h-3.5 w-3.5 mr-1.5 text-accent" />}
                      {p === 'report' && <Search className="h-3.5 w-3.5 mr-1.5 text-accent" />}
                      {p === 'deploy' && <Cloud className="h-3.5 w-3.5 mr-1.5 text-accent" />}
                      {p === 'tools' && <Archive className="h-3.5 w-3.5 mr-1.5 text-primary" />}
                      {p === 'files' ? 'Files' : p === 'readme' ? 'README' : p === 'gitignore' ? '.gitignore' : p === 'boilerplate' ? 'Pro Tools' : p === 'report' ? 'Duplicates' : p === 'deploy' ? 'Deploy Configs' : 'Clean Export'}
                    </Button>
                  ))}
                </div>
                
                {/* Push Button + real-time progress panel */}
                <div className="mb-4 space-y-3">
                  <div className="flex justify-center">
                    <Button
                      variant="hero"
                      size="lg"
                      onClick={handlePush}
                      disabled={pushing || !githubUser || (pushMode === 'new' ? !repoName : !selectedExistingRepo || !confirmReplace)}
                      className="glow-button gap-2.5 w-full sm:w-auto h-12 px-8 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg shadow-primary/30 border border-primary/40"
                    >
                      {pushing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" /> Pushing to GitHub…
                        </>
                      ) : (
                        <>
                          <Rocket className="h-5 w-5" />
                          <span>Push to GitHub</span>
                          <GitCommit className="h-4 w-4 opacity-80" />
                        </>
                      )}
                    </Button>
                  </div>

                  {pushing && pushProgress && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-primary/30 bg-primary/5 p-3 sm:p-4 space-y-3"
                      data-testid="push-progress-panel"
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {pushProgress.step}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            Pushing to <span className="font-mono text-primary">{pushMode === 'update' ? selectedExistingRepo : repoName}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary leading-none">{pushProgress.progress}%</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${pushProgress.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>

                      {/* Current file detail */}
                      {pushProgress.detail && (
                        <div className="rounded-lg border border-primary/20 bg-background/60 p-2.5 flex items-start gap-2">
                          <FileIcon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              Current operation
                            </p>
                            <p className="font-mono text-[11px] sm:text-xs text-foreground truncate" title={pushProgress.detail}>
                              {pushProgress.detail}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Don't refresh warning */}
                      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 sm:p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                          <strong>Don't refresh or close this tab.</strong> Files are being uploaded to GitHub one by one — leaving now will leave your repo in a half-pushed state.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-background/50 p-3 sm:p-4 min-h-[400px] overflow-y-auto max-h-[600px] overflow-x-hidden">
                  {/* Files Tab */}
                  {activePanel === 'files' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
                      <div className="border-r border-border pr-4 overflow-y-auto max-h-[500px]">
                        <h4 className="font-semibold text-sm mb-3">File Tree</h4>
                        {fileTree.length > 0 ? <div className="space-y-0.5">{renderTree(fileTree)}</div> : <p className="text-muted-foreground text-sm">No files</p>}
                      </div>
                      <div className="pl-4" id="workspace-editor">
                        <h4 className="font-semibold text-sm mb-3">Preview</h4>
                        {renderFilePreview()}
                      </div>
                    </div>
                  )}
                  {/* README Tab */}
                  {activePanel === 'readme' && (
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h4 className="font-semibold text-sm">README.md</h4>
                        <div className="flex gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => copy(generatedReadme, 'README copied')} className="h-7 px-2 text-xs"><Copy className="h-3 w-3" /> Copy</Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingMode(!editingMode)} className="h-7 px-2 text-xs"><Edit3 className="h-3 w-3" /> {editingMode ? 'Preview' : 'Edit'}</Button>
                        </div>
                      </div>
                      {editingMode ? <textarea value={generatedReadme} onChange={e => setGeneratedReadme(e.target.value)} className="h-80 w-full resize-none rounded-lg border border-border bg-background p-3 font-mono text-xs outline-none focus:border-primary" /> : <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-3 font-mono text-xs overflow-x-auto">{generatedReadme}</pre>}
                    </div>
                  )}
                  {/* .gitignore Tab */}
                  {activePanel === 'gitignore' && (
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h4 className="font-semibold text-sm">.gitignore</h4>
                        <Button variant="ghost" size="sm" onClick={() => copy(generatedGitignore, '.gitignore copied')} className="h-7 px-2 text-xs"><Copy className="h-3 w-3" /> Copy</Button>
                      </div>
                      <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-3 font-mono text-xs overflow-x-auto">{generatedGitignore}</pre>
                    </div>
                  )}
                  {/* Duplicate Detector Tab — content-based fingerprint */}
                  {activePanel === 'report' && workspaceReport && (
                    <div className="space-y-6 p-2">
                      <div>
                        <h4 className="text-sm font-bold text-primary uppercase tracking-tight mb-3">Workspace Analysis</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {workspaceReport.highlights.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                              <CheckCircle className="h-4 w-4 text-primary shrink-0" /> {h}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-destructive uppercase tracking-tight">Duplicate Content (byte-identical)</h4>
                          <span className="text-[10px] text-muted-foreground italic">Compares actual file content, not just filenames</span>
                        </div>
                        <div className="space-y-2">
                          {(() => {
                            // Group by content fingerprint, not filename. Real duplicates only.
                            const groups = new Map<string, UploadedProjectFile[]>();
                            uploadedFiles.forEach(f => {
                              const k = fileFingerprint(f);
                              groups.set(k, [...(groups.get(k) || []), f]);
                            });
                            const dupGroups = Array.from(groups.entries()).filter(([, files]) => files.length > 1);

                            if (dupGroups.length === 0) {
                              return (
                                <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-center">
                                  <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                                  <p className="text-sm font-medium text-primary">No duplicate content found</p>
                                  <p className="text-xs text-muted-foreground mt-1">Every file in your project is unique.</p>
                                </div>
                              );
                            }
                            return dupGroups.map(([key, files]) => {
                              const allPaths = files.map(f => f.path);
                              return (
                                <div key={key} className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2 text-xs text-destructive font-semibold flex-wrap">
                                      <AlertTriangle className="h-4 w-4 shrink-0" />
                                      <span>Identical content detected</span>
                                      <span className="text-muted-foreground font-normal">({files.length} copies · {(files[0].size / 1024).toFixed(1)} KB each)</span>
                                    </div>
                                  </div>
                                  <ul className="space-y-1.5 pl-2">
                                    {files.map(f => {
                                      const isExcluded = excludedPaths.has(f.path);
                                      const isRenaming = renamingPath === f.path;
                                      return (
                                        <li key={f.path} className="flex flex-col gap-1.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                                          {isRenaming ? (
                                            <div className="flex flex-1 items-center gap-1.5 min-w-0">
                                              <Pencil className="h-3 w-3 text-primary shrink-0" />
                                              <input
                                                type="text"
                                                value={renameDraft}
                                                autoFocus
                                                onChange={e => setRenameDraft(e.target.value)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') renameFile(f.path, renameDraft);
                                                  if (e.key === 'Escape') setRenamingPath(null);
                                                }}
                                                className="flex-1 min-w-0 px-2 py-1 rounded border border-primary bg-background text-foreground font-mono text-[11px] outline-none"
                                                placeholder="new/path/file.ext"
                                              />
                                              <button onClick={() => renameFile(f.path, renameDraft)} className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-medium"><Check className="h-3 w-3" /></button>
                                              <button onClick={() => setRenamingPath(null)} className="px-2 py-1 rounded bg-muted text-muted-foreground text-[10px] font-medium">✕</button>
                                            </div>
                                          ) : (
                                            <>
                                              <span className={`truncate font-mono flex-1 min-w-0 ${isExcluded ? 'line-through text-muted-foreground' : 'text-foreground'}`} title={f.path}>{f.path}</span>
                                              <div className="flex shrink-0 items-center gap-1 flex-wrap">
                                                {!isExcluded && (
                                                  <>
                                                    {f.isText && (
                                                      <button
                                                        onClick={() => {
                                                          setSelectedFilePath(f.path);
                                                          setActivePanel('files');
                                                          setEditingMode(true);
                                                          setTimeout(() => {
                                                            document.getElementById('workspace-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                          }, 80);
                                                          toast({ title: '✏️ Editing', description: f.path.split('/').pop() });
                                                        }}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25 text-[10px] font-medium"
                                                        title="Open in editor"
                                                      >
                                                        <Edit3 className="h-3 w-3" /> Edit
                                                      </button>
                                                    )}
                                                    <button
                                                      onClick={() => { setRenamingPath(f.path); setRenameDraft(f.path); }}
                                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/15 text-accent hover:bg-accent/25 text-[10px] font-medium"
                                                      title="Rename / change file path"
                                                    >
                                                      <Pencil className="h-3 w-3" /> Rename
                                                    </button>
                                                    <button
                                                      onClick={() => keepOnlyThis(f.path, allPaths)}
                                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary/25 text-[10px] font-medium"
                                                      title="Keep only this copy, exclude others"
                                                    >
                                                      <Check className="h-3 w-3" /> Keep this
                                                    </button>
                                                  </>
                                                )}
                                                {isExcluded ? (
                                                  <button
                                                    onClick={() => restoreUploadedFile(f.path)}
                                                    className="px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30 text-[10px] font-medium"
                                                  >
                                                    Restore
                                                  </button>
                                                ) : (
                                                  <button
                                                    onClick={() => removeUploadedFile(f.path)}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-destructive/20 text-destructive hover:bg-destructive/30 text-[10px] font-medium"
                                                  >
                                                    <Trash2 className="h-3 w-3" /> Remove
                                                  </button>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Deploy Configs Tab — Netlify, Vercel, Docker */}
                  {activePanel === 'deploy' && (
                    <div className="space-y-4 p-2">
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-tight mb-2 flex items-center gap-2">
                          <Cloud className="h-4 w-4 text-accent" /> One-Click Deployment Configs
                        </h4>
                        <p className="text-xs text-muted-foreground mb-4">
                          Auto-generate config files so your repo is ready to deploy on Netlify, Vercel, or Docker the moment it lands on GitHub.
                        </p>
                      </div>

                      {[
                        { key: 'netlify' as const, name: 'Netlify', desc: 'Adds netlify.toml with build command, publish dir, and SPA redirects.', file: 'netlify.toml', color: 'text-[hsl(173,80%,40%)]' },
                        { key: 'vercel' as const, name: 'Vercel', desc: 'Adds vercel.json with build command, output dir, and SPA rewrites.', file: 'vercel.json', color: 'text-foreground' },
                        { key: 'dockerfile' as const, name: 'Docker', desc: 'Multi-stage Dockerfile (Node build → Nginx serve). Production-ready.', file: 'Dockerfile', color: 'text-[hsl(210,80%,55%)]' },
                      ].map(opt => (
                        <div key={opt.key} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/30 transition-colors">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Cloud className={`h-5 w-5 ${opt.color}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h5 className="font-semibold text-sm">{opt.name}</h5>
                              <button
                                onClick={() => setDeployConfigs(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${deployConfigs[opt.key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${deployConfigs[opt.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                            <code className="text-[10px] text-primary mt-1 inline-block">+ {opt.file}</code>
                          </div>
                        </div>
                      ))}

                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>Toggled configs are auto-included in your push. <strong className="text-primary">{Object.values(deployConfigs).filter(Boolean).length}</strong> selected.</span>
                      </div>
                    </div>
                  )}
                  {/* Pro Tools — Boilerplate Injectors (real-time, beginner-friendly) */}
                  {activePanel === 'boilerplate' && (() => {
                    const author = (githubUser?.name || githubUser?.login || 'Your Name').replace(/[^\w\s.-]/g, '');
                    const year = new Date().getFullYear();
                    const repoTitle = repoName || 'My Project';
                    const detectedLangs = projectInfo?.detectedLanguages || [];
                    const isNode = detectedLangs.some(l => /js|ts|node/i.test(l)) || uploadedFiles.some(f => f.path === 'package.json');
                    const isPython = detectedLangs.some(l => /python/i.test(l)) || uploadedFiles.some(f => /\.(py)$/i.test(f.path));

                    const injectFile = (path: string, content: string, label: string) => {
                      if (uploadedFiles.some(f => f.path === path)) {
                        toast({ title: `ℹ️ Already exists`, description: `${path} is already in your project.`, variant: 'destructive' });
                        return;
                      }
                      const b64 = (() => { try { return btoa(unescape(encodeURIComponent(content))); } catch { return ''; }})();
                      const newFile: UploadedProjectFile = {
                        path, name: path.split('/').pop() || path, extension: ('.' + (path.split('.').pop() || '')).toLowerCase(),
                        size: new Blob([content]).size, base64: b64, textContent: content, isText: true,
                      };
                      setUploadedFiles(prev => [...prev, newFile]);
                      setFilePaths(prev => [...prev, path]);
                      toast({ title: `✅ ${label} added`, description: `${path} injected into your project.` });
                    };

                    const has = (path: string) => uploadedFiles.some(f => f.path === path);

                    const envScan = () => {
                      const envFiles = uploadedFiles.filter(f => /^\.env(\..+)?$/.test(f.name) && f.isText);
                      if (envFiles.length === 0) return `# .env.example — fill these in\nAPI_KEY=\nDATABASE_URL=\nNODE_ENV=development\n`;
                      const keys = new Set<string>();
                      envFiles.forEach(f => {
                        (f.textContent || '').split('\n').forEach(line => {
                          const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
                          if (m) keys.add(m[1]);
                        });
                      });
                      return `# .env.example — auto-generated from your .env files (values stripped)\n# Fill these in your real .env (which is gitignored)\n\n` +
                        Array.from(keys).sort().map(k => `${k}=`).join('\n') + '\n';
                    };

                    const tools: Array<{ id: string; icon: any; title: string; desc: string; file: string; existsLabel?: string; build: () => string; color: string; }> = [
                      {
                        id: 'license', icon: FileText, title: 'MIT License', color: 'text-amber-500',
                        desc: 'Add a permissive MIT license — most popular open-source choice. Authored by you.',
                        file: 'LICENSE',
                        build: () => `MIT License\n\nCopyright (c) ${year} ${author}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`,
                      },
                      {
                        id: 'envex', icon: Shield, title: '.env.example (auto)', color: 'text-emerald-500',
                        desc: 'Real-time scan of your .env files — generates a safe template with keys only (values blanked).',
                        file: '.env.example', build: envScan,
                      },
                      {
                        id: 'edcfg', icon: FileCode, title: '.editorconfig', color: 'text-blue-500',
                        desc: 'Cross-IDE consistent formatting — works in VS Code, JetBrains, Sublime, Vim. No more whitespace fights.',
                        file: '.editorconfig',
                        build: () => `# https://editorconfig.org\nroot = true\n\n[*]\nindent_style = space\nindent_size = 2\nend_of_line = lf\ncharset = utf-8\ntrim_trailing_whitespace = true\ninsert_final_newline = true\n\n[*.md]\ntrim_trailing_whitespace = false\n\n[Makefile]\nindent_style = tab\n`,
                      },
                      {
                        id: 'changelog', icon: BookOpen, title: 'CHANGELOG.md', color: 'text-purple-500',
                        desc: 'Keep-a-Changelog template (semver-friendly). Tells users what changed in every release.',
                        file: 'CHANGELOG.md',
                        build: () => `# Changelog\n\nAll notable changes to ${repoTitle} will be documented in this file.\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n## [Unreleased]\n\n### Added\n- Initial project structure\n\n### Changed\n\n### Fixed\n\n## [0.1.0] - ${new Date().toISOString().slice(0, 10)}\n\n### Added\n- Initial release\n`,
                      },
                      {
                        id: 'contrib', icon: Heart, title: 'CONTRIBUTING.md', color: 'text-pink-500',
                        desc: 'Welcomes new contributors with PR rules, commit conventions, and a clear local setup walkthrough.',
                        file: 'CONTRIBUTING.md',
                        build: () => `# Contributing to ${repoTitle}\n\nThanks for your interest! 🎉\n\n## How to contribute\n\n1. Fork this repo and clone your fork.\n2. Create a branch: \`git checkout -b feat/my-feature\`\n3. Make your changes (small, focused commits).\n4. Use [Conventional Commits](https://www.conventionalcommits.org/): \`feat:\`, \`fix:\`, \`docs:\`, \`refactor:\`, \`test:\`, \`chore:\`.\n5. Open a Pull Request describing **what** and **why**.\n\n## Local setup\n\n${isNode ? '```bash\nnpm install\nnpm run dev\n```\n' : isPython ? '```bash\npython -m venv .venv\nsource .venv/bin/activate\npip install -r requirements.txt\n```\n' : '```bash\n# Add setup commands here\n```\n'}\n\n## Code style\n\n- Match existing conventions.\n- No commented-out code.\n- Add tests when changing behavior.\n\n## Reporting bugs\n\nOpen an issue with:\n- What you expected to happen\n- What actually happened\n- Steps to reproduce (minimal example)\n- Your environment (OS, version)\n\n## Questions?\n\nOpen a discussion or reach the maintainer @${githubUser?.login || 'maintainer'}.\n`,
                      },
                      {
                        id: 'coc', icon: ShieldCheck, title: 'CODE_OF_CONDUCT.md', color: 'text-cyan-500',
                        desc: 'Contributor Covenant v2.1 — sets respectful community standards expected by GitHub & most OSS projects.',
                        file: 'CODE_OF_CONDUCT.md',
                        build: () => `# Contributor Covenant Code of Conduct\n\n## Our Pledge\n\nWe as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone.\n\n## Our Standards\n\nExamples of behavior that contributes to a positive environment:\n* Demonstrating empathy and kindness\n* Being respectful of differing opinions\n* Giving and gracefully accepting constructive feedback\n* Accepting responsibility and apologizing for mistakes\n\nExamples of unacceptable behavior:\n* The use of sexualized language or imagery\n* Trolling, insulting, or derogatory comments\n* Public or private harassment\n* Publishing others' private information\n\n## Enforcement\n\nReport issues to the project maintainer. All complaints will be reviewed promptly and fairly.\n\nThis Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org), version 2.1.\n`,
                      },
                      {
                        id: 'security', icon: Shield, title: 'SECURITY.md', color: 'text-red-500',
                        desc: 'GitHub Security tab compliant — tells researchers exactly how to privately disclose vulnerabilities.',
                        file: 'SECURITY.md',
                        build: () => `# Security Policy\n\n## Supported Versions\n\n| Version | Supported          |\n| ------- | ------------------ |\n| latest  | :white_check_mark: |\n\n## Reporting a Vulnerability\n\n**Please do not report security vulnerabilities through public GitHub issues.**\n\nInstead, open a private security advisory:\nhttps://github.com/${githubUser?.login || 'OWNER'}/${repoTitle}/security/advisories/new\n\nWe will acknowledge within 48 hours and provide a fix timeline within 7 days.\n`,
                      },
                      {
                        id: 'pr', icon: GitCommit, title: 'PR Template', color: 'text-indigo-500',
                        desc: 'Auto-prompts every PR with checklist (tests, docs, screenshots) — drastically improves contribution quality.',
                        file: '.github/pull_request_template.md',
                        build: () => `## What does this PR do?\n\n<!-- A short, clear description -->\n\n## Why?\n\n<!-- Context, screenshots, links to issues -->\n\nCloses #\n\n## Type of change\n\n- [ ] Bug fix\n- [ ] New feature\n- [ ] Breaking change\n- [ ] Documentation update\n- [ ] Refactor\n\n## Checklist\n\n- [ ] My code follows the project style\n- [ ] I added tests where needed\n- [ ] I updated documentation\n- [ ] All existing tests pass locally\n- [ ] Screenshots / videos attached (UI changes)\n`,
                      },
                      {
                        id: 'issue', icon: Bug, title: 'Bug Report Template', color: 'text-orange-500',
                        desc: 'Standardizes bug reports — saves you hours of "what version are you on?" back-and-forth.',
                        file: '.github/ISSUE_TEMPLATE/bug_report.md',
                        build: () => `---\nname: Bug report\nabout: Create a report to help us improve\ntitle: '[BUG] '\nlabels: bug\n---\n\n**Describe the bug**\nA clear description of the bug.\n\n**To Reproduce**\n1. Go to '...'\n2. Click '...'\n3. See error\n\n**Expected behavior**\nWhat you expected to happen.\n\n**Screenshots**\nIf applicable.\n\n**Environment**\n- OS: [e.g. macOS 14]\n- Browser/Runtime: [e.g. Chrome 120, Node 20]\n- Version: [e.g. 1.2.3]\n\n**Additional context**\nAny other context.\n`,
                      },
                      ...(isNode ? [{
                        id: 'nvmrc', icon: FileCode, title: '.nvmrc (Node version)', color: 'text-green-500',
                        desc: 'Pins Node version for `nvm use` — every contributor and CI runs the exact same Node.',
                        file: '.nvmrc',
                        build: () => `20\n`,
                      }] : []),
                      ...(isNode ? [{
                        id: 'ci', icon: Rocket, title: 'GitHub Actions CI', color: 'text-violet-500',
                        desc: 'Auto-runs your install + lint + test on every PR. Catch breaks before merge.',
                        file: '.github/workflows/ci.yml',
                        build: () => `name: CI\n\non:\n  push:\n    branches: [main]\n  pull_request:\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n          cache: 'npm'\n      - run: npm ci\n      - run: npm run lint --if-present\n      - run: npm test --if-present\n      - run: npm run build --if-present\n`,
                      }] : []),
                    ];

                    return (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 rounded-lg bg-accent/5 border border-accent/20 p-3 mb-2">
                          <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            <p className="font-semibold text-foreground mb-0.5">Pro Tools — instant boilerplate for serious projects</p>
                            <p>One-click adds professional files most repos forget. Each tool reads your project in real time and adapts. Beginner-safe — author/version/stack auto-detected.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {tools.map((t) => {
                            const exists = has(t.file);
                            return (
                              <div key={t.id} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 hover:border-primary/30 transition-colors" data-testid={`tool-${t.id}`}>
                                <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                                  <t.icon className={`h-4 w-4 ${t.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <h5 className="font-semibold text-xs sm:text-sm leading-tight">{t.title}</h5>
                                    <Button
                                      size="sm"
                                      variant={exists ? 'ghost' : 'outline'}
                                      disabled={exists}
                                      className="h-7 px-2 text-[10px] shrink-0"
                                      data-testid={`button-add-${t.id}`}
                                      onClick={() => injectFile(t.file, t.build(), t.title)}
                                    >
                                      {exists ? <><Check className="h-3 w-3 mr-1" /> Added</> : <><Plus className="h-3 w-3 mr-1" /> Add</>}
                                    </Button>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{t.desc}</p>
                                  <code className="text-[9px] text-primary mt-1 inline-block">+ {t.file}</code>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Clean Export Tab */}
                  {activePanel === 'tools' && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6 p-8">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Archive className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                      </div>
                      <div className="max-w-md">
                        <h4 className="text-lg font-bold mb-2">Clean ZIP Export</h4>
                        <p className="text-sm text-muted-foreground mb-6">
                          Download a sanitized version of your project. All sensitive files like <code className="text-destructive">.env</code>, private keys, and build artifacts will be automatically removed.
                        </p>
                        <Button variant="hero" size="lg" onClick={dlCleanZip} className="glow-button">
                          <Download className="h-5 w-5 mr-2" /> Download Sanitized ZIP
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {pushSuccess && (
          <section className="container mx-auto px-4 py-4 sm:py-6 sm:px-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-lg text-center space-y-6">
              <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold">🎉 Project is Live!</h2>
              <p className="text-muted-foreground">Your project has been successfully pushed to GitHub.</p>
              <a href={pushSuccess} target="_blank" rel="noopener noreferrer" className="block text-primary hover:underline font-mono text-sm break-all">{pushSuccess}</a>

              <div className="flex flex-col gap-3">
                <Button variant="hero" size="lg" className="w-full" onClick={() => window.open(pushSuccess, '_blank')}>
                  <ExternalLink className="h-5 w-5" /> Open on GitHub
                </Button>
                <Button variant="outline" size="lg" className="w-full" onClick={resetZipOnly}>
                  <RotateCcw className="h-5 w-5" /> Continue — New Project
                </Button>
                <Button variant="ghost" size="lg" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { handleDeleteToken(); resetZipOnly(); }}>
                  <Trash2 className="h-5 w-5" /> Delete Token & Finish
                </Button>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="inline h-4 w-4 text-primary mr-1" />
                <strong className="text-primary">Safety:</strong> Your token is only in browser memory. Click "Delete Token" to remove it, or simply close this tab.
              </div>
            </motion.div>
          </section>
        )}

        {/* ── DEVELOPER TOOLS (always visible) ── */}
        {!zipFile && !pushSuccess && (
          <section id="developer-toolkit" className="border-t border-border/40 py-4 sm:py-6 scroll-mt-20">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mb-4 text-center space-y-1">
                <h2 className="section-heading">Developer <span className="text-gradient">Toolkit</span></h2>
                <p className="section-subtext mx-auto">Powerful standalone tools for everyday developer problems. Each one works independently.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {DEVELOPER_TOOLS.map((tool, i) => {
                  const isOdd = i % 2 === 0;
                  return (
                    <motion.div key={tool.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                      className="feature-card cursor-pointer group relative"
                      onClick={() => {
                        if (tool.action === 'recovery') setShowRecovery(true);
                        else if (tool.action === 'connect') setShowTokenGuide(true);
                        else if (tool.action === 'my-repos') {
                          if (githubUser) setShowMyRepos(true);
                          else setShowTokenGuide(true);
                        }
                        else if (tool.action === 'license' || tool.action === 'branch-protection' || tool.action === 'ssh-keys') {
                          setOpenTool(tool.action);
                        }
                        else if (tool.action === 'account-stats') {
                          if (githubUser) setOpenTool('account-stats');
                          else setShowTokenGuide(true);
                        }
                        else {
                          toast({ title: `💡 ${tool.title}`, description: 'Upload a ZIP file first to use this tool automatically.' });
                          triggerFileSelect();
                        }
                      }}
                    >
                      {tool.badge && (
                        <span className="absolute -top-2 right-3 rounded-full bg-gradient-to-r from-primary to-accent px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow-sm">
                          {tool.badge}
                        </span>
                      )}
                      <div className={`card-icon-row ${isOdd ? '' : 'flip'}`}>
                        <div className={`card-main-icon ${tool.bg}`}>
                          <tool.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${tool.color}`} />
                        </div>
                        <span className="card-side-icon">
                          <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </span>
                      </div>
                      <h3 className={`mb-1 font-display text-sm sm:text-base font-semibold leading-tight group-hover:text-primary transition-colors ${isOdd ? 'text-left' : 'text-right'}`}>{tool.title}</h3>
                      <p className={`text-[11px] sm:text-sm text-muted-foreground leading-snug line-clamp-3 ${isOdd ? 'text-left' : 'text-right'}`}>{tool.desc}</p>
                      <div className={`flex ${isOdd ? '' : 'justify-end'} mt-2 sm:mt-3`}>
                        <Button variant="outline" size="sm" className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1"><Wrench className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Open</Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-8 text-center">
                <Link to="/tools">
                  <Button variant="outline" size="lg"><Wrench className="h-5 w-5" /> View All Tools</Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {!zipFile && !pushSuccess && <AdSlot slot={2} className="container mx-auto px-4 sm:px-6 py-3" />}

        {/* ── FEATURES ── */}
        {!zipFile && !pushSuccess && (
          <section className="border-t border-border/40 py-4 sm:py-6">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mb-4 text-center space-y-1">
                <h2 className="section-heading">Built for Speed <span className="text-gradient">& Reliability</span></h2>
                <p className="section-subtext mx-auto">Every feature designed to get your project from ZIP to GitHub without friction.</p>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-5">
                {[
                  { icon: Zap, title: 'Instant Analysis', desc: 'Auto-detects framework, language, package manager, and tech stack.' },
                  { icon: Shield, title: 'Secret Shield', desc: 'Blocks .env, private keys, and sensitive files automatically.' },
                  { icon: FileText, title: 'Auto README', desc: 'Generates professional README.md with badges and quick-start.' },
                  { icon: Edit3, title: 'Inline Editor', desc: 'Edit any file directly in the browser before pushing.' },
                  { icon: RefreshCw, title: 'Session Persistence', desc: 'Connect GitHub once, push multiple projects in one session.' },
                  { icon: Lock, title: 'Private Repos', desc: 'Push to private repositories with one click.' },
                  { icon: Trash2, title: 'Auto-Cleaning', desc: 'Smart .gitignore removes junk files automatically.' },
                  { icon: BookOpen, title: 'Workspace Report', desc: 'Complete analysis with highlights and recommendations.' },
                ].map((f, i) => (
                  <motion.div key={f.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="feature-card p-3 sm:p-5">
                    <f.icon className="mb-2 sm:mb-3 h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    <h3 className="mb-1 sm:mb-1.5 font-display font-semibold text-xs sm:text-base leading-tight">{f.title}</h3>
                    <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── HOW IT WORKS ── */}
        {!zipFile && !pushSuccess && (
          <section className="border-t border-border/40 py-4 sm:py-6">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mb-4 text-center space-y-1">
                <h2 className="section-heading">How It <span className="text-gradient-cool">Works</span></h2>
                <p className="section-subtext mx-auto">Three simple steps. No Git knowledge required.</p>
              </div>
              <div className="mx-auto grid max-w-4xl grid-cols-3 gap-2 sm:gap-4">
                {[
                  { step: '01', title: 'Upload ZIP', desc: 'Drag and drop your project ZIP. We analyze every file and detect your stack instantly.', icon: Upload },
                  { step: '02', title: 'Review & Edit', desc: 'Browse files, check the report, edit code inline, and review the auto-generated README.', icon: Eye },
                  { step: '03', title: 'Push to GitHub', desc: 'Enter your token, name your repo, and hit push. All files land on GitHub in seconds.', icon: Rocket },
                ].map((s, i) => (
                  <motion.div key={s.step} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="relative text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg border border-primary/20 bg-primary/5">
                      <s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="mb-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary">{s.step}</div>
                    <h3 className="mb-1 font-display text-xs sm:text-base font-semibold leading-tight">{s.title}</h3>
                    <p className="text-[10px] sm:text-sm text-muted-foreground leading-snug line-clamp-3 sm:line-clamp-none">{s.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── ARTICLES ── */}
        {!zipFile && !pushSuccess && (
          <section className="border-t border-border/40 py-4 sm:py-6">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mb-4 text-center space-y-1">
                <h2 className="section-heading">Developer <span className="text-gradient">Insights</span></h2>
                <p className="section-subtext mx-auto">Tips, best practices, and the thinking behind Zip2Git.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {ARTICLES.map((a, i) => {
                  const isOdd = i % 2 === 0;
                  return (
                    <motion.article key={a.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className={`glass-card p-3 sm:p-5 space-y-1.5 sm:space-y-2 ${isOdd ? 'sm:text-left' : 'sm:text-right'}`}>
                      <a.icon className={`h-5 w-5 sm:h-6 sm:w-6 text-primary ${isOdd ? '' : 'sm:ml-auto'}`} />
                      <h3 className="font-display text-xs sm:text-base font-semibold leading-tight">{a.title}</h3>
                      <p className="text-[11px] sm:text-sm text-muted-foreground leading-snug line-clamp-3">{a.body}</p>
                    </motion.article>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <Link to="/blog">
                  <Button variant="outline" size="lg"><BookOpen className="h-5 w-5" /> Read More Articles</Button>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Reviews ── */}
        {!zipFile && !pushSuccess && <ReviewsSection />}

        {/* ── DONATION (moved up — between Reviews and FAQ for higher visibility) ── */}
        {!zipFile && !pushSuccess && <DonationSection />}

        {/* ── FAQ — 2-column grid with alternating icon position per card ── */}
        {!zipFile && !pushSuccess && (
          <section className="border-t border-border/40 py-4 sm:py-6">
            <div className="container mx-auto px-4 sm:px-6">
              <div className="mb-4 text-center space-y-1">
                <h2 className="section-heading">Frequently Asked <span className="text-gradient-cool">Questions</span></h2>
              </div>
              <div className="mx-auto max-w-6xl grid gap-3 sm:grid-cols-2">
                {FAQ.map((f, i) => {
                  const isOdd = i % 2 === 0;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card overflow-hidden h-fit">
                      <button onClick={() => toggleFaq(i)} className={`flex w-full items-center gap-3 p-3 sm:p-4 ${isOdd ? '' : 'flex-row-reverse text-right'}`}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-display font-semibold text-xs sm:text-sm leading-tight flex-1 min-w-0">{f.q}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openFaq.has(i) ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq.has(i) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border/40 px-3 sm:px-4 pb-3 sm:pb-4 pt-2">
                          <p className={`text-xs sm:text-sm text-muted-foreground leading-relaxed ${isOdd ? 'text-left' : 'text-right'}`}>{f.a}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── AD SLOTS ── */}
        {!zipFile && !pushSuccess && <AdSlot slot={3} className="container mx-auto px-4 sm:px-6 pt-4" />}
        {!zipFile && !pushSuccess && <AdSlot slot={4} className="container mx-auto px-4 sm:px-6 pt-2" />}

        {/* ── PROMOTION / BUSINESS FEED ── */}
        {!zipFile && !pushSuccess && <PromotionFeed />}

        {!zipFile && !pushSuccess && <AdSlot slot={5} className="container mx-auto px-4 sm:px-6 py-3" />}

        {/* ── CTA ── */}
        {!zipFile && !pushSuccess && (
          <section className="border-t border-border/40 py-4 sm:py-6">
            <div className="container mx-auto px-4 text-center sm:px-6">
              <div className="mx-auto max-w-2xl space-y-6">
                <h2 className="section-heading">Ready to <span className="text-gradient">Ship Your Code?</span></h2>
                <p className="section-subtext mx-auto">Join thousands of developers who use Zip2Git to push projects to GitHub without the hassle.</p>
                <Button variant="hero" size="xl" onClick={triggerFileSelect} className="glow-button"><Upload className="h-5 w-5" /> Get Started Now</Button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── MY REPOS DIALOG ── */}
      {showMyRepos && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
          onClick={() => setShowMyRepos(false)}
          data-testid="modal-my-repos"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-2xl bg-card border border-border/60 flex flex-col"
          >
            <div className="bg-gradient-to-br from-emerald-500/10 via-primary/5 to-transparent p-4 sm:p-5 border-b border-border/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {githubUser && (
                  <img src={githubUser.avatar_url} alt={githubUser.login} className="h-10 w-10 rounded-full border-2 border-primary/30 shrink-0" />
                )}
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-base sm:text-lg truncate">
                    @{githubUser?.login}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">
                    {userRepos.length} repositories on your account
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={refreshRepos}
                  disabled={loadingRepos}
                  className="h-8 px-2.5 rounded-md bg-background/80 hover:bg-background text-xs flex items-center gap-1 disabled:opacity-50"
                  data-testid="button-myrepos-refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingRepos ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <button
                  onClick={() => setShowMyRepos(false)}
                  aria-label="Close"
                  className="h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground"
                  data-testid="button-myrepos-close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="px-4 sm:px-5 pt-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={reposFilter}
                  onChange={(e) => setReposFilter(e.target.value)}
                  placeholder="Search your repositories…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                  data-testid="input-myrepos-filter"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-4 space-y-1.5">
              {loadingRepos ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading your repositories…
                </div>
              ) : userRepos.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  No repositories found on this account.
                </div>
              ) : (
                userRepos
                  .filter((r) => r.name.toLowerCase().includes(reposFilter.toLowerCase()))
                  .map((repo) => (
                    <a
                      key={repo.full_name}
                      href={`https://github.com/${repo.full_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/50 hover:border-primary/40 hover:bg-primary/5 px-3 py-2.5 transition-colors group"
                      data-testid={`myrepo-${repo.name}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FolderGit2 className={`h-4 w-4 shrink-0 ${repo.private ? 'text-amber-500' : 'text-primary'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {repo.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{repo.private ? 'Private' : 'Public'}</span>
                            <span>·</span>
                            <span>{repo.default_branch}</span>
                            {repo.updated_at && (
                              <>
                                <span>·</span>
                                <span>updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                    </a>
                  ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── PRO TOOL DIALOGS ── */}
      {openTool && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
          onClick={() => setOpenTool(null)}
          data-testid="modal-pro-tool"
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-card border border-border/60"
          >
            <div className="sticky top-0 z-10 bg-card/95 backdrop-blur p-4 sm:p-5 border-b border-border/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {openTool === 'license' && <Scale className="h-4 w-4 text-primary" />}
                  {openTool === 'branch-protection' && <GitMerge className="h-4 w-4 text-accent" />}
                  {openTool === 'ssh-keys' && <KeyRound className="h-4 w-4 text-primary" />}
                  {openTool === 'account-stats' && <BarChart3 className="h-4 w-4 text-accent" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-sm sm:text-base truncate">
                    {openTool === 'license' && 'License Picker'}
                    {openTool === 'branch-protection' && 'Branch Protection Helper'}
                    {openTool === 'ssh-keys' && 'SSH Key Setup Guide'}
                    {openTool === 'account-stats' && 'Account Insights'}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {openTool === 'license' && 'Pick & generate the right open-source license'}
                    {openTool === 'branch-protection' && 'Lock your main branch in 5 steps'}
                    {openTool === 'ssh-keys' && 'Push without typing your password again'}
                    {openTool === 'account-stats' && 'Snapshot of your GitHub account'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpenTool(null)}
                aria-label="Close"
                className="h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                data-testid="button-tool-close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* LICENSE PICKER */}
              {openTool === 'license' && (() => {
                const year = new Date().getFullYear();
                const author = (licenseAuthor || githubUser?.name || githubUser?.login || 'Your Name').trim();
                const TEMPLATES: Record<typeof licenseChoice, { name: string; body: string; summary: string }> = {
                  mit: {
                    name: 'MIT License',
                    summary: 'Permissive · short · most popular for open-source.',
                    body: `MIT License\n\nCopyright (c) ${year} ${author}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`,
                  },
                  apache: {
                    name: 'Apache License 2.0',
                    summary: 'Permissive · explicit patent grant · enterprise-friendly.',
                    body: `                                 Apache License\n                           Version 2.0, January 2004\n                        http://www.apache.org/licenses/\n\n   Copyright ${year} ${author}\n\n   Licensed under the Apache License, Version 2.0 (the "License");\n   you may not use this file except in compliance with the License.\n   You may obtain a copy of the License at\n\n       http://www.apache.org/licenses/LICENSE-2.0\n\n   Unless required by applicable law or agreed to in writing, software\n   distributed under the License is distributed on an "AS IS" BASIS,\n   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n   See the License for the specific language governing permissions and\n   limitations under the License.\n`,
                  },
                  gpl: {
                    name: 'GNU GPL v3',
                    summary: 'Strong copyleft · derivative works must also be GPL.',
                    body: `Copyright (C) ${year} ${author}\n\nThis program is free software: you can redistribute it and/or modify\nit under the terms of the GNU General Public License as published by\nthe Free Software Foundation, either version 3 of the License, or\n(at your option) any later version.\n\nThis program is distributed in the hope that it will be useful,\nbut WITHOUT ANY WARRANTY; without even the implied warranty of\nMERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the\nGNU General Public License for more details.\n\nYou should have received a copy of the GNU General Public License\nalong with this program.  If not, see <https://www.gnu.org/licenses/>.\n`,
                  },
                  bsd: {
                    name: 'BSD 3-Clause',
                    summary: 'Permissive · no endorsement clause · BSD-style.',
                    body: `BSD 3-Clause License\n\nCopyright (c) ${year}, ${author}\nAll rights reserved.\n\nRedistribution and use in source and binary forms, with or without\nmodification, are permitted provided that the following conditions are met:\n\n1. Redistributions of source code must retain the above copyright notice, this\n   list of conditions and the following disclaimer.\n\n2. Redistributions in binary form must reproduce the above copyright notice,\n   this list of conditions and the following disclaimer in the documentation\n   and/or other materials provided with the distribution.\n\n3. Neither the name of the copyright holder nor the names of its\n   contributors may be used to endorse or promote products derived from\n   this software without specific prior written permission.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"\nAND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\nIMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\nDISCLAIMED.\n`,
                  },
                  isc: {
                    name: 'ISC License',
                    summary: 'Functionally equivalent to MIT · even shorter.',
                    body: `ISC License\n\nCopyright (c) ${year} ${author}\n\nPermission to use, copy, modify, and/or distribute this software for any\npurpose with or without fee is hereby granted, provided that the above\ncopyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES\nWITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF\nMERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY\nSPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER\nRESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT,\nNEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE\nUSE OR PERFORMANCE OF THIS SOFTWARE.\n`,
                  },
                };
                const current = TEMPLATES[licenseChoice];
                return (
                  <>
                    <div>
                      <label className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Author / copyright holder</label>
                      <input
                        type="text"
                        value={licenseAuthor}
                        onChange={(e) => setLicenseAuthor(e.target.value)}
                        placeholder={githubUser?.name || githubUser?.login || 'Your Name'}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                        data-testid="input-license-author"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(TEMPLATES) as Array<typeof licenseChoice>).map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setLicenseChoice(k)}
                          className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                            licenseChoice === k ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 bg-background/50 hover:border-primary/40'
                          }`}
                          data-testid={`license-${k}`}
                        >
                          {TEMPLATES[k].name.replace(' License', '').replace(' 2.0', ' 2').replace(' v3', ' v3')}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-muted-foreground">
                      <strong className="text-foreground">{current.name}:</strong> {current.summary}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Preview</p>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={() => copy(current.body, 'License')}>
                          <Copy className="h-3 w-3" /> Copy
                        </Button>
                      </div>
                      <pre className="max-h-56 overflow-y-auto rounded-lg border border-border bg-background p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap break-words">{current.body}</pre>
                    </div>

                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => {
                        const blob = new Blob([current.body], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'LICENSE'; a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: '✅ LICENSE downloaded', description: `${current.name} ready to drop in your repo root.` });
                      }}
                      data-testid="button-license-download"
                    >
                      <Download className="h-4 w-4" /> Download LICENSE file
                    </Button>
                  </>
                );
              })()}

              {/* BRANCH PROTECTION */}
              {openTool === 'branch-protection' && (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Protecting your <code className="rounded bg-muted px-1">main</code> branch prevents accidental
                    force-pushes, requires reviews, and keeps your release history clean. Follow these 5 steps:
                  </p>
                  <ol className="space-y-2.5">
                    {[
                      { t: 'Open repo settings', d: 'Go to your repo on GitHub → Settings → Branches.' },
                      { t: 'Add a rule for "main"', d: 'Click "Add branch protection rule" and enter main (or your default branch).' },
                      { t: 'Require pull-request reviews', d: 'Enable "Require a pull request before merging" with at least 1 approval.' },
                      { t: 'Require status checks', d: 'Tick "Require status checks to pass" — pick CI jobs you want green before merge.' },
                      { t: 'Lock force-pushes & deletions', d: 'Enable "Do not allow bypassing" and "Restrict force pushes". Save the rule.' },
                    ].map((s, i) => (
                      <li key={i} className="flex gap-3 rounded-lg border border-border/60 bg-background/50 p-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold">{s.t}</p>
                          <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{s.d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {githubUser && userRepos.length > 0 && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                      <p className="font-semibold text-primary mb-1.5">Quick links to your repo settings:</p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {userRepos.slice(0, 12).map((r) => (
                          <a
                            key={r.full_name}
                            href={`https://github.com/${r.full_name}/settings/branches`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background border border-border hover:border-primary/40 text-[10px] font-mono"
                          >
                            <ExternalLink className="h-2.5 w-2.5" /> {r.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <a
                    href="https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches"
                    target="_blank" rel="noopener noreferrer"
                    className="block w-full text-center rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    data-testid="link-branch-docs"
                  >
                    Open full GitHub docs <ExternalLink className="inline h-3.5 w-3.5 ml-1" />
                  </a>
                </>
              )}

              {/* SSH KEYS */}
              {openTool === 'ssh-keys' && (
                <>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    SSH keys let you push & pull without typing your password or token every time. Run these in your terminal:
                  </p>
                  {[
                    { t: '1. Generate a new key', cmd: 'ssh-keygen -t ed25519 -C "your_email@example.com"' },
                    { t: '2. Start the SSH agent', cmd: 'eval "$(ssh-agent -s)"' },
                    { t: '3. Add the key to the agent', cmd: 'ssh-add ~/.ssh/id_ed25519' },
                    { t: '4. Copy the public key', cmd: 'cat ~/.ssh/id_ed25519.pub' },
                    { t: '5. Test the connection', cmd: 'ssh -T git@github.com' },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg border border-border/60 bg-background/50 p-3 space-y-1.5">
                      <p className="text-xs font-semibold">{s.t}</p>
                      <div className="flex items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1.5">
                        <code className="font-mono text-[11px] text-foreground flex-1 truncate">{s.cmd}</code>
                        <button
                          onClick={() => copy(s.cmd, 'Command')}
                          className="h-6 w-6 rounded hover:bg-background flex items-center justify-center text-muted-foreground hover:text-primary shrink-0"
                          data-testid={`ssh-copy-${i}`}
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <a
                    href="https://github.com/settings/keys"
                    target="_blank" rel="noopener noreferrer"
                    className="block w-full text-center rounded-lg bg-gradient-to-r from-primary to-accent py-2.5 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    data-testid="link-ssh-add"
                  >
                    Paste your key on GitHub → Settings → SSH Keys <ExternalLink className="inline h-3.5 w-3.5 ml-1" />
                  </a>
                </>
              )}

              {/* ACCOUNT STATS */}
              {openTool === 'account-stats' && githubUser && (() => {
                const total = userRepos.length;
                const priv = userRepos.filter((r) => r.private).length;
                const pub = total - priv;
                const branches = new Set(userRepos.map((r) => r.default_branch));
                const recent = [...userRepos].sort((a, b) => {
                  const da = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                  const db = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                  return db - da;
                }).slice(0, 5);
                return (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
                      <img src={githubUser.avatar_url} alt={githubUser.login} className="h-12 w-12 rounded-full border-2 border-primary/30" />
                      <div className="min-w-0">
                        <p className="text-base font-bold truncate">{githubUser.name || githubUser.login}</p>
                        <a href={`https://github.com/${githubUser.login}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          @{githubUser.login} <ExternalLink className="inline h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Total', val: total, color: 'text-primary', bg: 'bg-primary/10' },
                        { label: 'Public', val: pub, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                        { label: 'Private', val: priv, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                      ].map((s) => (
                        <div key={s.label} className={`rounded-lg ${s.bg} p-3 text-center`}>
                          <p className={`text-2xl font-bold ${s.color} leading-none`}>{s.val}</p>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg border border-border/60 p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Default branches in use</span>
                        <span className="font-mono text-foreground">{Array.from(branches).join(', ') || '—'}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-2">
                        Recently updated
                      </p>
                      <div className="space-y-1.5">
                        {recent.map((r) => (
                          <a
                            key={r.full_name}
                            href={`https://github.com/${r.full_name}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-2.5 py-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FolderGit2 className={`h-3.5 w-3.5 shrink-0 ${r.private ? 'text-amber-500' : 'text-primary'}`} />
                              <span className="text-xs font-medium truncate">{r.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Index;

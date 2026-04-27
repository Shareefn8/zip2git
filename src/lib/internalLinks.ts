export const ALL_LINKS = [
  { to: '/', title: 'Zip2Git Converter', description: 'Upload a ZIP and push it to GitHub in seconds.' },
  { to: '/tools', title: 'Developer Toolkit', description: '.gitignore, license picker, HTTP codes, recovery.' },
  { to: '/blog', title: 'Developer Blog', description: 'Guides on Git, GitHub, and project security.' },
  { to: '/guides/zip-to-github', title: 'Guide: ZIP to GitHub', description: 'Step-by-step ZIP upload to GitHub repo.' },
  { to: '/guides/github-token', title: 'Guide: GitHub Token', description: 'Create a Personal Access Token safely.' },
  { to: '/guides/recover-deleted-files', title: 'Guide: Recover Files', description: 'Restore deleted GitHub files and commits.' },
  { to: '/guides/gitignore', title: 'Guide: .gitignore', description: 'Build the perfect ignore file for any stack.' },
  { to: '/guides/readme', title: 'Guide: README', description: 'Write a professional README that ranks.' },
  { to: '/faq', title: 'FAQ', description: 'Answers to common Zip2Git questions.' },
  { to: '/about', title: 'About Zip2Git', description: 'Mission, story, and what we believe.' },
  { to: '/compare', title: 'Zip2Git vs Git CLI', description: 'How Zip2Git compares to manual Git workflow.' },
  { to: '/use-cases', title: 'Use Cases', description: 'Students, freelancers, teams, agencies.' },
  { to: '/changelog', title: 'Changelog', description: 'Latest features and improvements.' },
  { to: '/developer', title: 'Developer', description: 'About CodeByShareef, the creator.' },
  { to: '/privacy', title: 'Privacy Policy', description: 'How your data and tokens stay safe.' },
];

export function getRelatedLinks(currentPath: string, count = 6) {
  return ALL_LINKS.filter((l) => l.to !== currentPath).slice(0, count);
}

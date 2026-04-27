import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { AdSlot } from '@/components/AdSlotProvider';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';
import { motion } from 'framer-motion';
import { Terminal, Shield, Layers, Clock, GitBranch, Key, ArrowUpRight, BookOpen } from 'lucide-react';

const POSTS = [
  {
    icon: Terminal,
    title: 'Why Git Frustrates Beginners — And How to Fix It',
    date: 'March 20, 2026',
    readTime: '4 min read',
    body: `Git is an essential tool for every developer, but its command-line interface was designed for experienced engineers. For students, self-taught coders, and beginners, terms like "rebase," "cherry-pick," and "HEAD detached" are deeply confusing.\n\nThe real problem isn't Git itself — it's the assumption that everyone learns best through terminal commands. Many developers just want to get their project files onto GitHub without memorizing a dozen commands.\n\nThat's exactly why Zip2Git exists. Instead of running git init, git add, git commit, and git push, you simply upload a ZIP file and click one button. The entire Git workflow happens behind the scenes.\n\nIf you're a beginner, don't feel bad about using tools like this. Even senior developers use automation to save time. The goal is shipping code, not memorizing syntax.`,
  },
  {
    icon: Shield,
    title: 'The Hidden Danger of Pushing .env Files to GitHub',
    date: 'March 18, 2026',
    readTime: '3 min read',
    body: `Every year, thousands of developers accidentally push their API keys, database credentials, and secret tokens to public GitHub repositories. Automated bots scan GitHub constantly for these leaks — and within minutes, your credentials can be compromised.\n\nCommon files that should never be pushed:\n• .env files (API keys, database URLs)\n• .pem and .pfx files (SSL certificates, private keys)\n• id_rsa files (SSH private keys)\n• service-account.json (cloud provider credentials)\n\nZip2Git's Secret Shield automatically detects these patterns and excludes them from your push. You don't need to remember what to add to .gitignore — the tool handles it for you.\n\nPro tip: If you've already pushed sensitive files, rotating your credentials immediately is more important than deleting the file from history. GitHub caches content, and bots work fast.`,
  },
  {
    icon: Layers,
    title: 'How to Structure Your Project Like a Professional',
    date: 'March 15, 2026',
    readTime: '5 min read',
    body: `A well-organized project structure isn't just about aesthetics — it directly impacts collaboration, debugging, and long-term maintenance. Here are the principles that professional developers follow:\n\n1. Separate concerns: Keep your source code, tests, documentation, and configuration in distinct directories.\n\n2. Use consistent naming: Pick a convention (kebab-case, camelCase, PascalCase) and stick with it across all files.\n\n3. Include a README: Every project should have a clear README with installation steps, usage examples, and contribution guidelines.\n\n4. Add a .gitignore early: Don't wait until you've already pushed node_modules or build artifacts. Set up .gitignore before your first commit.\n\n5. Remove duplicate files: Multiple copies of the same file in different directories is a red flag. Use Zip2Git's duplicate detection to spot these.\n\n6. Keep dependencies updated: Outdated packages are a security risk. Run npm audit or equivalent tools regularly.\n\nZip2Git analyzes your project structure automatically and generates a professional README based on what it finds. It's like having a code review before your first commit.`,
  },
  {
    icon: Clock,
    title: 'From ZIP to GitHub Repository in 5 Seconds — Here\'s How',
    date: 'March 12, 2026',
    readTime: '3 min read',
    body: `The traditional Git workflow for uploading a project to GitHub involves at least 6 steps:\n\n1. git init\n2. git add .\n3. git commit -m "initial commit"\n4. Create a repository on GitHub\n5. git remote add origin <url>\n6. git push -u origin main\n\nFor experienced developers, this is routine. But for someone who just wants to share their project or submit an assignment, it's unnecessarily complex.\n\nZip2Git reduces this to three actions: upload your ZIP, connect your GitHub token, and click push. Behind the scenes, we create the repository, generate a proper commit, and push every file — including images, fonts, and binary assets that Git sometimes struggles with.\n\nThe entire process takes about 5 seconds for a typical project. No terminal required.`,
  },
  {
    icon: Key,
    title: 'GitHub Personal Access Tokens: A Complete Security Guide',
    date: 'March 10, 2026',
    readTime: '6 min read',
    body: `GitHub Personal Access Tokens (PATs) are the recommended way to authenticate with GitHub's API. Here's everything you need to know about using them safely:\n\nWhat is a PAT?\nA Personal Access Token is like a password that gives specific permissions to applications. Unlike your main password, you can create multiple tokens with different scopes and revoke them individually.\n\nCreating a token:\n1. Go to GitHub Settings → Developer Settings → Personal Access Tokens\n2. Click "Generate new token (classic)"\n3. Give it a descriptive name (e.g., "Zip2Git")\n4. Select the "repo" scope for full repository access\n5. Click "Generate token" and copy it immediately\n\nSecurity best practices:\n• Never store tokens in your code or commit them to repositories\n• Use the minimum required scopes\n• Set an expiration date\n• Revoke tokens you no longer need\n• Use fine-grained tokens when possible for even more control\n\nHow Zip2Git handles your token:\nYour token is stored only in your browser's runtime memory (RAM). It's never written to localStorage, cookies, or any persistent storage. When you close the tab or click "Delete Token," it's gone completely. We never send your token to any server — all GitHub API calls happen directly from your browser.`,
  },
  {
    icon: GitBranch,
    title: 'How to Recover Deleted Files from GitHub — Complete Guide',
    date: 'March 8, 2026',
    readTime: '5 min read',
    body: `Accidentally deleted a file from your GitHub repository? Don't panic. Git's version control system means nothing is truly lost — as long as the file was committed at some point.\n\nMethod 1: Browse commit history\nGo to your repository → click "Commits" → find the commit before the deletion → click "Browse files" at that point in time → navigate to your file.\n\nMethod 2: Use git checkout locally\nIf you have the repo cloned locally:\ngit log --all --full-history -- path/to/deleted/file\ngit checkout <commit-hash> -- path/to/deleted/file\n\nMethod 3: Restore entire repo state\nTo roll back everything to a previous point:\ngit reset --hard <commit-hash>\ngit push --force\n\nMethod 4: Use GitHub's web interface\nFor recently deleted files, GitHub sometimes shows a "Restore" option in the commit diff view.\n\nZip2Git's Smart Recovery Assistant walks you through each of these methods with direct links to the relevant GitHub pages. No need to memorize commands — just tell us what you lost, and we'll guide you step by step.\n\nImportant: If you used --force push, the old commits may not be visible in the normal history. Check git reflog locally — it keeps a record of all ref changes for 90 days by default.`,
  },
];

const Blog = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Developer Blog - Git Tips & Guides | Zip2Git"
      description="Practical guides, security tips, and developer insights on Git, GitHub, and project management. Free knowledge by Zip2Git."
      path="/blog"
      image="https://i.ibb.co/Kpk1Xpt2/3-zip2git.png"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 text-center space-y-2">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl font-bold sm:text-4xl">
            Developer <span className="text-gradient">Blog</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Practical guides, security tips, and developer insights — by Zip2Git.
          </motion.p>
        </div>

        <AdSlot slot={7} className="mb-4" />

        <div className="grid gap-4 sm:grid-cols-2">
          {POSTS.map((post, i) => {
            const isOdd = i % 2 === 0;
            return (
              <motion.article
                key={post.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 sm:p-6 space-y-3 group hover:border-primary/40 transition-colors flex flex-col"
              >
                <div className={`card-icon-row ${isOdd ? '' : 'flip'}`}>
                  <div className="card-main-icon bg-primary/10">
                    <post.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className={`flex flex-col gap-0.5 flex-1 min-w-0 ${isOdd ? 'text-left' : 'text-right'}`}>
                    <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">{post.date}</span>
                    <span className="text-[10px] text-muted-foreground">{post.readTime}</span>
                  </div>
                  <span className="card-side-icon">
                    <BookOpen className="h-3.5 w-3.5" />
                  </span>
                </div>
                <h2 className={`font-display text-lg sm:text-xl font-bold leading-tight ${isOdd ? 'text-left' : 'text-right'}`}>
                  {post.title}
                </h2>
                <div className={`text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-6 flex-1 ${isOdd ? 'text-left' : 'text-right'}`}>
                  {post.body}
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold text-primary pt-1 ${isOdd ? '' : 'justify-end'}`}>
                  Read full article <ArrowUpRight className="h-3 w-3" />
                </div>
              </motion.article>
            );
          })}
        </div>

        <AdSlot slot={9} className="mt-6" />
        <RelatedLinks links={getRelatedLinks('/blog')} />
      </div>
    </main>
    <Footer />
  </div>
);

export default Blog;

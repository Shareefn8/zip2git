import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';
import { Link } from 'react-router-dom';

const RecoverFiles = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="How to Recover Deleted Files from GitHub (4 Methods) | Zip2Git"
      description="Lost a file on GitHub? Recover it with commit history, git checkout, reflog, or the Zip2Git Smart Recovery Assistant."
      path="/guides/recover-deleted-files"
      image="https://i.ibb.co/B5fPMqnT/image.jpg"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <article className="mx-auto max-w-3xl space-y-6">
        <p className="text-sm text-primary">Guide · 5 min read</p>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          Recover Deleted Files from <span className="text-gradient">GitHub</span> — 4 Proven Methods
        </h1>
        <p className="text-muted-foreground text-lg">
          Git almost never loses data. If you committed it once, you can get it back. Here are the
          four reliable ways to recover deleted files from a GitHub repository.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Method 1 — Browse Commit History on GitHub</h2>
        <p className="text-muted-foreground leading-relaxed">
          Open your repo → click <strong className="text-foreground">Commits</strong> → find the
          commit before the deletion → click <strong className="text-foreground">Browse files</strong>.
          Navigate to the file, copy its content.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Method 2 — git checkout from a Past Commit</h2>
        <pre className="bg-secondary/40 rounded-lg p-4 text-xs overflow-x-auto"><code>{`git log --all --full-history -- path/to/file
git checkout <commit-hash> -- path/to/file
git commit -m "restore: bring back deleted file"
git push`}</code></pre>

        <h2 className="font-display text-2xl font-bold pt-4">Method 3 — git reflog (Last Resort)</h2>
        <p className="text-muted-foreground leading-relaxed">
          The reflog tracks every HEAD movement for ~90 days. If you force-pushed and lost commits,
          this can save you.
        </p>
        <pre className="bg-secondary/40 rounded-lg p-4 text-xs overflow-x-auto"><code>{`git reflog
git checkout <reflog-hash>`}</code></pre>

        <h2 className="font-display text-2xl font-bold pt-4">Method 4 — Zip2Git Smart Recovery Assistant</h2>
        <p className="text-muted-foreground leading-relaxed">
          Don't want to touch the terminal? Open our{' '}
          <Link to="/tools" className="text-primary underline">Smart Recovery Assistant</Link> in
          the toolkit. Tell it what you lost — file, folder, or whole repo — and it generates the
          exact links and commands you need.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Prevent Future Losses</h2>
        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
          <li>Push frequently — small commits are easier to recover.</li>
          <li>Avoid <code className="text-primary">--force</code> unless absolutely necessary.</li>
          <li>Enable branch protection on <code className="text-primary">main</code>.</li>
          <li>Use Zip2Git to keep a clean local ZIP backup before risky operations.</li>
        </ul>

        <RelatedLinks links={getRelatedLinks('/guides/recover-deleted-files')} />
      </article>
    </main>
    <Footer />
  </div>
);

export default RecoverFiles;

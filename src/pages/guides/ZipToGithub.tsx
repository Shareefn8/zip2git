import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

const ZipToGithub = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="How to Upload a ZIP File to GitHub (2026 Guide) | Zip2Git"
      description="Step-by-step guide to convert any ZIP project into a GitHub repository in under 60 seconds. No Git commands required."
      path="/guides/zip-to-github"
      image="https://i.ibb.co/Q3xKNG0J/2-zip2git.png"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <article className="mx-auto max-w-3xl space-y-6">
        <p className="text-sm text-primary">Guide · 5 min read</p>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          How to Upload a ZIP File to <span className="text-gradient">GitHub</span> in 60 Seconds
        </h1>
        <p className="text-muted-foreground text-lg">
          Pushing a ZIP project to GitHub manually requires installing Git, setting up SSH keys, and
          memorizing commands. Zip2Git removes every one of those steps. Here's the complete workflow.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">The Old Way vs the Zip2Git Way</h2>
        <p className="text-muted-foreground leading-relaxed">
          The traditional workflow needs <code className="text-primary">git init</code>,{' '}
          <code className="text-primary">git add .</code>, <code className="text-primary">git commit</code>,
          a remote repo, and a final <code className="text-primary">git push</code>. With Zip2Git,
          the entire flow is reduced to upload → connect → push.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Step 1 — Prepare Your ZIP</h2>
        <p className="text-muted-foreground leading-relaxed">
          Compress your project folder into a single .zip file. Avoid zipping{' '}
          <code className="text-primary">node_modules</code>; Zip2Git auto-cleans these but keeping
          your ZIP smaller speeds the upload. Read our{' '}
          <Link to="/guides/gitignore" className="text-primary underline">.gitignore guide</Link>{' '}
          to see what else to exclude.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Step 2 — Generate a GitHub Token</h2>
        <p className="text-muted-foreground leading-relaxed">
          You need a Personal Access Token with the <code className="text-primary">repo</code>{' '}
          scope. Follow our{' '}
          <Link to="/guides/github-token" className="text-primary underline">GitHub Token guide</Link>.
          Tokens stay only in your browser memory — they are never sent to any server.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Step 3 — Push to GitHub</h2>
        <ul className="space-y-2 text-muted-foreground">
          {[
            'Open the Zip2Git converter on the home page.',
            'Drop your ZIP file in the upload area.',
            'Paste your GitHub Personal Access Token.',
            'Choose a repo name and visibility (public or private).',
            'Click "Push to GitHub" and wait ~5 seconds.',
          ].map((step) => (
            <li key={step} className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span>{step}</span>
            </li>
          ))}
        </ul>

        <h2 className="font-display text-2xl font-bold pt-4">What Happens Behind the Scenes</h2>
        <p className="text-muted-foreground leading-relaxed">
          Zip2Git extracts your archive in the browser, scans for secrets using our{' '}
          <Link to="/privacy" className="text-primary underline">Secret Shield</Link>, generates a
          professional README and .gitignore, then pushes every file using GitHub's REST API.
          Nothing leaves your computer except the final commit.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Common Errors and Fixes</h2>
        <p className="text-muted-foreground leading-relaxed">
          <strong className="text-foreground">"Bad credentials"</strong> — Your token expired or
          lacks the repo scope. Regenerate it.<br />
          <strong className="text-foreground">"Repository already exists"</strong> — Pick a
          different name or push to an existing repo by typing its exact name.<br />
          <strong className="text-foreground">Stuck push?</strong> Use our{' '}
          <Link to="/tools" className="text-primary underline">Smart Recovery Assistant</Link>.
        </p>

        <RelatedLinks links={getRelatedLinks('/guides/zip-to-github')} />
      </article>
    </main>
    <Footer />
  </div>
);

export default ZipToGithub;

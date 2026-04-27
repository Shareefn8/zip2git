import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';
import { Link } from 'react-router-dom';

const Readme = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="How to Write a Professional README (Template Inside) | Zip2Git"
      description="Write a GitHub README that ranks, attracts contributors, and explains your project clearly. Free copy-paste template."
      path="/guides/readme"
      image="https://i.ibb.co/dwsnxRzM/20260420-160924.jpg"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <article className="mx-auto max-w-3xl space-y-6">
        <p className="text-sm text-primary">Guide · 5 min read</p>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          Write a <span className="text-gradient">Professional README</span> That Ranks
        </h1>
        <p className="text-muted-foreground text-lg">
          Your README is the front page of your project. It influences GitHub search ranking,
          contributor trust, and recruiter impressions. Here's the structure that works.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">The 7-Section Template</h2>
        <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
          <li><strong className="text-foreground">Title + tagline</strong> — One sentence, keyword-rich.</li>
          <li><strong className="text-foreground">Badges</strong> — Build status, license, version.</li>
          <li><strong className="text-foreground">Demo</strong> — Screenshot, GIF, or live link.</li>
          <li><strong className="text-foreground">Features</strong> — Bullet list of capabilities.</li>
          <li><strong className="text-foreground">Installation</strong> — Copy-paste commands.</li>
          <li><strong className="text-foreground">Usage</strong> — Smallest possible example.</li>
          <li><strong className="text-foreground">License + credits</strong> — MIT is standard.</li>
        </ol>

        <h2 className="font-display text-2xl font-bold pt-4">Copy-Paste Markdown Skeleton</h2>
        <pre className="bg-secondary/40 rounded-lg p-4 text-xs overflow-x-auto"><code>{`# Project Name

> One-line description with keywords.

![Demo](./demo.gif)

## Features
- Feature one
- Feature two
- Feature three

## Installation
\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage
\`\`\`js
import thing from 'project'
\`\`\`

## License
MIT`}</code></pre>

        <h2 className="font-display text-2xl font-bold pt-4">SEO Tips for READMEs</h2>
        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
          <li>Put your primary keyword in the H1 and first paragraph.</li>
          <li>Use H2/H3 with secondary keywords (installation, usage, examples).</li>
          <li>Add an image with descriptive alt text.</li>
          <li>Link to related repos and your portfolio.</li>
        </ul>

        <h2 className="font-display text-2xl font-bold pt-4">Auto-Generate with Zip2Git</h2>
        <p className="text-muted-foreground leading-relaxed">
          Our <Link to="/" className="text-primary underline">converter</Link> analyzes your ZIP and
          generates a complete README with stack detection, install commands, and folder breakdown —
          all locally in your browser. See it work alongside our{' '}
          <Link to="/guides/gitignore" className="text-primary underline">.gitignore guide</Link>.
        </p>

        <RelatedLinks links={getRelatedLinks('/guides/readme')} />
      </article>
    </main>
    <Footer />
  </div>
);

export default Readme;

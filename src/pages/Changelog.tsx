import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';

const RELEASES = [
  {
    version: 'v2.4',
    date: 'April 16, 2026',
    notes: ['New SEO-optimized guide pages and FAQ.', 'Smarter ad slot distribution across all pages.', 'Custom domain zip2git.online live.'],
  },
  {
    version: 'v2.3',
    date: 'April 02, 2026',
    notes: ['Smart Recovery Assistant with 4 recovery methods.', 'Anti-copy protection for project security.', 'Improved mobile layout for the donation panel.'],
  },
  {
    version: 'v2.2',
    date: 'March 18, 2026',
    notes: ['Inline workspace editor before push.', 'Auto-generated README based on detected stack.', '6 ad slots managed via Google Sheets.'],
  },
  {
    version: 'v2.1',
    date: 'March 02, 2026',
    notes: ['Secret Shield: blocks .env, .pem, id_rsa.', 'Private repo support.', 'Beginner-mode toggle with simplified copy.'],
  },
  {
    version: 'v2.0',
    date: 'February 12, 2026',
    notes: ['Full rebrand to Zip2Git.', 'Separate developer toolkit page.', 'Crypto donation panel.'],
  },
];

const Changelog = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Zip2Git Changelog - All Updates and New Features"
      description="Every Zip2Git release, version by version. New features, improvements, and bug fixes for the free ZIP-to-GitHub converter."
      path="/changelog"
      image="https://i.ibb.co/WRRn4sm/6-zip2git.png"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          <span className="text-gradient">Changelog</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Every release of Zip2Git, in chronological order. Updates ship continuously.
        </p>

        <div className="space-y-5">
          {RELEASES.map((r) => (
            <div key={r.version} className="glass-card p-6 space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl font-bold text-primary">{r.version}</h2>
                <p className="text-xs text-muted-foreground">{r.date}</p>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                {r.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <RelatedLinks links={getRelatedLinks('/changelog')} />
      </div>
    </main>
    <Footer />
  </div>
);

export default Changelog;

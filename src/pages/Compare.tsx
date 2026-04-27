import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';
import { Check, X } from 'lucide-react';

const ROWS = [
  { feature: 'Install required', cli: 'Yes (Git + setup)', zip: 'No — browser only' },
  { feature: 'Time to first push', cli: '15–60 minutes', zip: '~60 seconds' },
  { feature: 'Auto README', cli: 'Manual', zip: 'Generated' },
  { feature: 'Auto .gitignore', cli: 'Manual', zip: 'Generated per stack' },
  { feature: 'Secret leak protection', cli: 'Manual', zip: 'Built-in Secret Shield' },
  { feature: 'Push to private repo', cli: 'Yes', zip: 'Yes' },
  { feature: 'Mobile friendly', cli: 'No', zip: 'Yes' },
  { feature: 'Cost', cli: 'Free', zip: 'Free forever' },
];

const Compare = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Zip2Git vs Git CLI - Detailed Comparison (2026) | Zip2Git"
      description="Honest comparison of Zip2Git and the traditional Git command line. Speed, learning curve, security, and features side by side."
      path="/compare"
      image="https://i.ibb.co/ds0Ft09j/ytoolhub-icon-49.png"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          Zip2Git vs <span className="text-gradient">Git CLI</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Both tools push code to GitHub. The difference is how much time, setup, and risk you take
          on. Here's an honest side-by-side.
        </p>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-secondary/30">
                <th className="text-left p-4 font-display">Feature</th>
                <th className="text-left p-4 font-display">Git CLI</th>
                <th className="text-left p-4 font-display">Zip2Git</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-border/20 last:border-0">
                  <td className="p-4 font-medium">{row.feature}</td>
                  <td className="p-4 text-muted-foreground">{row.cli}</td>
                  <td className="p-4 text-primary">{row.zip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="font-display text-2xl font-bold pt-4">When to Use Git CLI</h2>
        <p className="text-muted-foreground leading-relaxed">
          Long-term projects with branches, merges, rebases, and team workflows still benefit from
          mastering Git. Zip2Git is not a replacement for Git — it's a faster onramp.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">When to Use Zip2Git</h2>
        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
          <li>You just finished a project and want it on GitHub now.</li>
          <li>You're a beginner and Git intimidates you.</li>
          <li>You're on a phone or borrowed computer with no Git installed.</li>
          <li>You want guaranteed secret scanning before publishing.</li>
        </ul>

        <RelatedLinks links={getRelatedLinks('/compare')} />
      </div>
    </main>
    <Footer />
  </div>
);

export default Compare;

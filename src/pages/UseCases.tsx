import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';
import { GraduationCap, Briefcase, Users, Rocket, Code, Building } from 'lucide-react';

const CASES = [
  { icon: GraduationCap, title: 'Students', body: 'Submit assignments to GitHub without learning Git first. Push your final project ZIP and share the repo link with professors instantly.' },
  { icon: Briefcase, title: 'Freelancers', body: 'Deliver client projects through clean GitHub repos. Auto-generated README and .gitignore make every handoff look professional.' },
  { icon: Users, title: 'Teaching teams', body: 'Bootcamps and coding schools use Zip2Git so students can publish projects on day one instead of week three.' },
  { icon: Rocket, title: 'Hackathon participants', body: 'Push your weekend build to GitHub in 60 seconds when the deadline timer is ticking down.' },
  { icon: Code, title: 'Indie developers', body: 'Backup local prototypes by zipping and pushing to private repos with one click.' },
  { icon: Building, title: 'Agencies', body: 'Onboard junior developers without a week of Git training. They can ship code from day one.' },
];

const UseCases = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Zip2Git Use Cases - Students, Freelancers, Teams | Free GitHub Tool"
      description="See how students, freelancers, hackathon hackers, and agencies use Zip2Git to publish code to GitHub without learning Git."
      path="/use-cases"
      image="https://i.ibb.co/dwsnxRzM/20260420-160924.jpg"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-4xl font-bold sm:text-5xl text-center mb-4">
          Who Uses <span className="text-gradient">Zip2Git</span>
        </h1>
        <p className="text-muted-foreground text-lg text-center mb-10 max-w-2xl mx-auto">
          From first-year CS students to global agencies, here's how teams skip the Git learning
          curve and publish faster.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CASES.map((c) => (
            <div key={c.title} className="glass-card p-6 space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold">{c.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        <RelatedLinks links={getRelatedLinks('/use-cases')} />
      </div>
    </main>
    <Footer />
  </div>
);

export default UseCases;

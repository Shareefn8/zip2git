import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';
import { Link } from 'react-router-dom';

const About = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="About Zip2Git - Free ZIP to GitHub Converter | Mission & Story"
      description="Zip2Git was built to remove friction between writing code and sharing it on GitHub. Learn our mission, values, and roadmap."
      path="/about"
      image="https://i.ibb.co/Kpk1Xpt2/3-zip2git.png"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          About <span className="text-gradient">Zip2Git</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Zip2Git is a free, browser-only tool that turns any project ZIP into a fully working
          GitHub repository in seconds — no Git installation, no terminal, no learning curve.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed">
          Millions of beginners give up on Git within their first week. They love coding but hate
          memorizing commands like rebase, cherry-pick, or HEAD detached. Zip2Git removes that wall
          so anyone can publish their work to GitHub the moment it's ready.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">What Makes Us Different</h2>
        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
          <li>100% free forever, no signup required.</li>
          <li>Everything runs in your browser — no servers see your code.</li>
          <li>Built-in <Link to="/privacy" className="text-primary underline">Secret Shield</Link> blocks .env and key leaks.</li>
          <li>Automatic README, .gitignore, and stack detection.</li>
          <li>Comes with a full <Link to="/tools" className="text-primary underline">developer toolkit</Link>.</li>
        </ul>

        <h2 className="font-display text-2xl font-bold pt-4">The Story</h2>
        <p className="text-muted-foreground leading-relaxed">
          Built by <Link to="/developer" className="text-primary underline">CodeByShareef</Link>{' '}
          after watching countless friends struggle with their first GitHub push. The first version
          shipped in a weekend; today it processes thousands of pushes per week from users in 60+
          countries.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Roadmap</h2>
        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
          <li>Multi-file diff viewer before push.</li>
          <li>GitLab and Bitbucket support.</li>
          <li>Browser extension for one-click ZIP capture.</li>
          <li>Team workspaces for educators.</li>
        </ul>

        <p className="text-muted-foreground leading-relaxed pt-4">
          Want to support the project? Send a tip via the{' '}
          <Link to="/" className="text-primary underline">donation panel</Link> on the home page or
          star us on <a href="https://github.com/CodeByShareef" target="_blank" rel="noopener" className="text-primary underline">GitHub</a>.
        </p>

        <RelatedLinks links={getRelatedLinks('/about')} />
      </div>
    </main>
    <Footer />
  </div>
);

export default About;

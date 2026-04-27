import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { AdSlot } from '@/components/AdSlotProvider';
import { Github, Mail, Zap, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Developer = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Developer - CodeByShareef | Zip2Git Creator"
      description="Meet CodeByShareef, the developer behind Zip2Git. Full-stack developer building free tools that simplify the developer workflow."
      path="/developer"
      image="https://i.ibb.co/WRRn4sm/6-zip2git.png"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="text-center space-y-4">
          <img
            src="/developer-photo.jpg"
            alt="CodeByShareef"
            className="mx-auto h-28 w-28 rounded-2xl object-cover border-2 border-primary/20 shadow-lg"
          />
          <h1 className="font-display text-4xl font-bold">CodeByShareef</h1>
          <p className="text-muted-foreground text-lg">Full-stack developer building tools that simplify the developer workflow.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <a href="https://github.com/CodeByShareef" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="gap-2"><Github className="h-5 w-5" /> GitHub</Button>
          </a>
          <a href="https://x.com/CodeByShareef" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X (Twitter)
            </Button>
          </a>
          <a href="https://www.linkedin.com/in/codebyshareef" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </Button>
          </a>
          <a href="https://www.codebyshareef.online" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="gap-2">🌐 Website</Button>
          </a>
          <a href="mailto:codebyshareef@gmail.com">
            <Button variant="outline" size="lg" className="gap-2"><Mail className="h-5 w-5" /> Email</Button>
          </a>
        </div>

        <AdSlot slot={10} className="my-4" />

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="glass-card p-6 space-y-3">
            <Zap className="h-6 w-6 text-primary" />
            <h3 className="font-display text-lg font-semibold">Mission</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Building free, powerful developer tools that remove friction from everyday workflows. No signups, no paywalls — just tools that work.
            </p>
          </div>
          <div className="glass-card p-6 space-y-3">
            <Heart className="h-6 w-6 text-primary" />
            <h3 className="font-display text-lg font-semibold">Open Source</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Zip2Git is built with transparency in mind. The entire application runs in your browser — no hidden servers, no data collection, no compromises.
            </p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-display mb-4 text-lg font-semibold">About Zip2Git</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Zip2Git was born from a simple frustration: too many developers struggle with Git when all they want to do is get their project files onto GitHub.
            Whether you're a student uploading your first assignment, a freelancer delivering client work, or an experienced developer migrating legacy projects —
            this tool handles the tedious parts so you can focus on what matters: your code.
          </p>
        </div>

        <AdSlot slot={1} className="my-4" />
      </div>
    </main>
    <Footer />
  </div>
);

export default Developer;

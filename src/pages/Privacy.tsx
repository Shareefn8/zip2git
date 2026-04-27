import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { AdSlot } from '@/components/AdSlotProvider';
import { Shield, Lock, Eye, Server } from 'lucide-react';

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Privacy Policy | Zip2Git - Your Data Stays Private"
      description="Zip2Git processes everything in your browser. No data collection, no tracking, no cookies. Your code and tokens never leave your device."
      path="/privacy"
      image="https://i.ibb.co/B5fPMqnT/image.jpg"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl space-y-10">
        <div className="space-y-4">
          <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: March 2026</p>
        </div>

        <AdSlot slot={2} className="my-4" />

        <div className="space-y-8">
          {[
            {
              icon: Shield,
              title: 'No Data Collection',
              content: 'Zip2Git does not collect, store, or transmit any personal data. Your ZIP files are processed entirely in your browser using client-side JavaScript. No server receives your files at any point.',
            },
            {
              icon: Lock,
              title: 'GitHub Token Security',
              content: 'Your GitHub Personal Access Token is stored exclusively in your browser\'s runtime memory (RAM) for the duration of your session. It is never written to localStorage, cookies, or any persistent storage. The token is cleared automatically when you close or refresh the tab.',
            },
            {
              icon: Eye,
              title: 'No Tracking or Analytics',
              content: 'We do not use cookies, tracking pixels, analytics services, or any form of user behavior monitoring. Your browsing session is completely private.',
            },
            {
              icon: Server,
              title: 'Client-Side Architecture',
              content: 'Zip2Git operates as a fully client-side application. All ZIP extraction, file analysis, project detection, README generation, and GitHub API communication happens directly in your browser. The only external communication is between your browser and GitHub\'s API when you explicitly push a repository.',
            },
          ].map((section) => (
            <div key={section.title} className="glass-card p-6">
              <div className="mb-3 flex items-center gap-3">
                <section.icon className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">{section.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.content}</p>
            </div>
          ))}
        </div>

        <AdSlot slot={3} className="my-4" />

        <div className="glass-card p-6">
          <h2 className="font-display mb-3 text-xl font-semibold">Contact</h2>
          <p className="text-sm text-muted-foreground">
            If you have questions about this policy, please reach out to{' '}
            <a href="mailto:codebyshareef@gmail.com" className="text-primary hover:underline">codebyshareef@gmail.com</a>.
          </p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;

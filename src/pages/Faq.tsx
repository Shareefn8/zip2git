import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'Is Zip2Git really free forever?',
    a: 'Yes. Zip2Git is 100% free for everyone, with no payment, signup, or hidden limits. The project is supported by optional ads and crypto donations.',
  },
  {
    q: 'Do you store my GitHub token?',
    a: 'No. Your Personal Access Token lives only in your browser memory during the session. It is never written to localStorage, cookies, or any server.',
  },
  {
    q: 'Does my code leave my computer?',
    a: 'Your ZIP is extracted and analyzed entirely in your browser. The only network traffic is the final commit pushed directly to GitHub via their official API.',
  },
  {
    q: 'What is the maximum ZIP size?',
    a: 'Practical limit is around 100 MB per ZIP because everything happens in browser memory. Larger projects should be split into multiple repos.',
  },
  {
    q: 'Can I push to a private repository?',
    a: 'Yes. Toggle the "Private" option before pushing. You can also push to existing repos by typing their exact name.',
  },
  {
    q: 'What is Secret Shield?',
    a: 'Secret Shield automatically detects .env files, API keys, SSH keys, and certificates in your ZIP and excludes them from the push so they never reach GitHub.',
  },
  {
    q: 'Can I use Zip2Git on mobile?',
    a: 'Yes. The interface is fully responsive and works on phones and tablets. ZIP processing speed depends on your device.',
  },
  {
    q: 'How do I recover a deleted file?',
    a: 'Read our recovery guide or open the Smart Recovery Assistant in the toolkit. It walks you through 4 different recovery methods.',
  },
  {
    q: 'Do I need to install Git?',
    a: 'No. Zip2Git uses GitHub\'s REST API directly from your browser. No Git, no terminal, no setup.',
  },
  {
    q: 'Who built Zip2Git?',
    a: 'Zip2Git is built and maintained by CodeByShareef. Visit codebyshareef.online to learn more.',
  },
];

const Faq = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Zip2Git FAQ - Common Questions Answered | Free GitHub Tool"
      description="Answers to the most common questions about Zip2Git: pricing, security, file size limits, private repos, and how it compares to manual Git."
      path="/faq"
      image="https://i.ibb.co/PGsmmHt8/7-zip2git.png"
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQS.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        }),
      }}
    />
    <Navbar />
    <main className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-bold sm:text-4xl text-center mb-2">
          Frequently Asked <span className="text-gradient">Questions</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base text-center mb-6">
          Everything you wanted to know about Zip2Git — answered honestly.
        </p>

        <Accordion type="multiple" className="grid gap-3 sm:grid-cols-2">
          {FAQS.map((faq, i) => {
            const isOdd = i % 2 === 0;
            return (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass-card border-0 px-4 py-1 h-fit"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-sm sm:text-base hover:no-underline group">
                  <div className={`flex items-center gap-3 w-full ${isOdd ? '' : 'flex-row-reverse text-right'}`}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1">{faq.q}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <RelatedLinks links={getRelatedLinks('/faq')} />
      </div>
    </main>
    <Footer />
  </div>
);

export default Faq;

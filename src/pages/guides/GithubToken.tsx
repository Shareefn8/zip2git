import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { RelatedLinks } from '@/components/RelatedLinks';
import { getRelatedLinks } from '@/lib/internalLinks';
import { Link } from 'react-router-dom';

const GithubToken = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="How to Create a GitHub Personal Access Token (2026) | Zip2Git"
      description="Create a secure GitHub PAT in 3 minutes. Choose scopes correctly, set expiration, and avoid common security mistakes."
      path="/guides/github-token"
      image="https://i.ibb.co/Kpk1Xpt2/3-zip2git.png"
    />
    <Navbar />
    <main className="container mx-auto px-4 py-6 sm:px-6 sm:py-10">
      <article className="mx-auto max-w-3xl space-y-6">
        <p className="text-sm text-primary">Guide · 6 min read</p>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">
          GitHub <span className="text-gradient">Personal Access Token</span> — Complete Guide
        </h1>
        <p className="text-muted-foreground text-lg">
          A Personal Access Token (PAT) is the safest way to authenticate with GitHub from third-party
          tools like Zip2Git. Here's how to create one correctly the first time.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Why Tokens, Not Passwords</h2>
        <p className="text-muted-foreground leading-relaxed">
          GitHub deprecated password authentication for the API in 2021. Tokens are scoped, can be
          revoked individually, and never expose your master credentials.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Step-by-Step Creation</h2>
        <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
          <li>Visit <a href="https://github.com/settings/tokens" target="_blank" rel="noopener" className="text-primary underline">github.com/settings/tokens</a>.</li>
          <li>Click <strong className="text-foreground">"Generate new token (classic)"</strong>.</li>
          <li>Name it something descriptive like <em>Zip2Git Push</em>.</li>
          <li>Set an expiration (90 days recommended).</li>
          <li>Tick the <strong className="text-foreground">repo</strong> scope only.</li>
          <li>Click <strong className="text-foreground">Generate token</strong> and copy it immediately — GitHub will not show it again.</li>
        </ol>

        <h2 className="font-display text-2xl font-bold pt-4">Fine-Grained vs Classic Tokens</h2>
        <p className="text-muted-foreground leading-relaxed">
          Fine-grained tokens are restricted to specific repositories and offer better security.
          Classic tokens are simpler. For Zip2Git, classic with repo scope works perfectly.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">How Zip2Git Stores Your Token</h2>
        <p className="text-muted-foreground leading-relaxed">
          Your token lives only in browser RAM during the session. We never write it to localStorage,
          cookies, or any backend. Read the full{' '}
          <Link to="/privacy" className="text-primary underline">privacy policy</Link>.
        </p>

        <h2 className="font-display text-2xl font-bold pt-4">Token Security Checklist</h2>
        <ul className="space-y-2 text-muted-foreground list-disc list-inside">
          <li>Use the minimum scopes required.</li>
          <li>Always set an expiration date.</li>
          <li>Revoke tokens you no longer use.</li>
          <li>Never paste tokens into chat apps or commit messages.</li>
          <li>Use a separate token per tool so you can revoke individually.</li>
        </ul>

        <p className="text-muted-foreground leading-relaxed pt-4">
          Ready to push? Open the <Link to="/" className="text-primary underline">Zip2Git converter</Link>{' '}
          and paste your fresh token.
        </p>

        <RelatedLinks links={getRelatedLinks('/guides/github-token')} />
      </article>
    </main>
    <Footer />
  </div>
);

export default GithubToken;

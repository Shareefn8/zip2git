import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sun, Moon, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';

export const Footer = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('light') ? 'light' : 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (theme === 'light') {
      root.classList.add('light');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#ffffff');
    } else {
      root.classList.remove('light');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#0a0f14');
    }
    try { localStorage.setItem('zip2git-theme', theme); } catch {}
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === 'dark' ? 'light' : 'dark'));

  return (
    <footer className="border-t border-border/40 py-8 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
          {/* Brand — unique hexagonal Zip2Git logo + wordmark */}
          <div className="space-y-3 col-span-2 lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 group" aria-label="Zip2Git home">
              <BrandLogo size={40} className="h-10 w-10 group-hover:scale-105 transition-transform" />
              <span className="font-display text-xl font-bold tracking-tight">
                Zip2<span className="text-primary">Git</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              The fastest way to push your ZIP projects to GitHub. Built for developers who value speed, reliability, and simplicity.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <a href="https://zip2git.online" className="text-muted-foreground hover:text-foreground transition-colors">zip2git.online</a>
              <span className="text-border">·</span>
              <a
                href="https://codebyshareef.gumroad.com/coffee"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                data-testid="link-footer-gumroad"
              >
                <Coffee className="h-3 w-3" /> Buy me a coffee
              </a>
            </div>
          </div>


          {/* Product */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Converter</Link></li>
              <li><Link to="/tools" className="text-muted-foreground hover:text-foreground transition-colors">Toolkit</Link></li>
              <li><Link to="/compare" className="text-muted-foreground hover:text-foreground transition-colors">vs Git CLI</Link></li>
              <li><Link to="/use-cases" className="text-muted-foreground hover:text-foreground transition-colors">Use Cases</Link></li>
              <li><Link to="/changelog" className="text-muted-foreground hover:text-foreground transition-colors">Changelog</Link></li>
            </ul>
          </div>

          {/* Guides */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guides</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/guides/zip-to-github" className="text-muted-foreground hover:text-foreground transition-colors">ZIP → GitHub</Link></li>
              <li><Link to="/guides/github-token" className="text-muted-foreground hover:text-foreground transition-colors">GitHub Token</Link></li>
              <li><Link to="/guides/recover-deleted-files" className="text-muted-foreground hover:text-foreground transition-colors">Recover Files</Link></li>
              <li><Link to="/guides/gitignore" className="text-muted-foreground hover:text-foreground transition-colors">.gitignore</Link></li>
              <li><Link to="/guides/readme" className="text-muted-foreground hover:text-foreground transition-colors">README</Link></li>
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Developer */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Developer</h4>
            <p className="mb-3 text-sm text-muted-foreground">CodeByShareef</p>
            <div className="flex items-center gap-3">
              <a href="https://github.com/CodeByShareef" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
              <a href="https://x.com/CodeByShareef" target="_blank" rel="noopener noreferrer" aria-label="X" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://linkedin.com/in/codebyshareef" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
            <a href="mailto:codebyshareef@gmail.com" className="mt-3 block text-sm text-primary hover:underline break-all">codebyshareef@gmail.com</a>
          </div>
        </div>

        {/* Bottom bar — clean copyright + theme toggle */}
        <div className="mt-6 border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} <span className="font-semibold text-foreground">Zip2Git</span> — built by{' '}
              <a href="https://codebyshareef.online" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CodeByShareef</a>.
              Free forever for developers.
            </p>
            <p className="text-xs text-muted-foreground">
              <a href="https://codebyshareef.online" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">codebyshareef.online</a>
              <span className="mx-2">·</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="gap-2 h-9 rounded-full"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>
      </div>
    </footer>
  );
};

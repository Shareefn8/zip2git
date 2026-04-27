import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/BrandLogo';


const links = [
  { to: '/', label: 'Home' },
  { to: '/tools', label: 'Tools' },
  { to: '/blog', label: 'Blog' },
  { to: '/faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
  { to: '/developer', label: 'Developer' },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="group inline-flex items-center gap-2"
          aria-label="Zip2Git Home"
        >
          <BrandLogo
            size={32}
            className="h-8 w-8 transition-transform group-hover:scale-105"
          />
          <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
            Zip2<span className="text-primary">Git</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${location.pathname === l.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 ml-4">
            <a href="https://github.com/CodeByShareef" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground" aria-label="GitHub">
              <Github className="h-5 w-5" />
            </a>
          </div>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border/40 bg-card/90 backdrop-blur-xl md:hidden">
            <div className="space-y-1 p-4">
              {links.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${location.pathname === l.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {l.label}
                </Link>
              ))}
              <a href="https://github.com/CodeByShareef" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm text-muted-foreground hover:text-foreground">
                <Github className="h-4 w-4" /> GitHub
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};


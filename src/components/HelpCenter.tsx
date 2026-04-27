import { useState, useEffect } from 'react';
import {
  HelpCircle, X, Lock, FolderCheck, Eye, ShieldCheck, ChevronDown,
  Sparkles, Github, Wrench, BookOpen, Mail, AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

type CardKey = 'private' | 'responsibility' | 'no-accounts';

const CARDS: Array<{
  key: CardKey;
  icon: typeof Lock;
  title: string;
  short: string;
  long: string;
}> = [
  {
    key: 'private',
    icon: Lock,
    title: 'Your files stay private',
    short: 'All ZIP processing happens locally — nothing leaves your browser.',
    long:
      'Every byte of your ZIP is unpacked, scanned, and rebuilt directly inside this browser tab using JSZip. There is no server upload, no temp storage, no analytics on your code. The only outbound network calls are the GitHub REST API requests you trigger when you click "Push" — and those go straight from your browser to GitHub with your token.',
  },
  {
    key: 'responsibility',
    icon: FolderCheck,
    title: 'You own what you push',
    short: 'Zip2Git is a bridge — the repository, the code, and the consequences are yours.',
    long:
      'You decide which files to keep, which to remove, whether the repo is public or private, and whether to overwrite an existing repo. We auto-flag obvious secrets (.env, .pem, private keys, service-accounts) and let you review every file before pushing — but the final call is yours. Double-check sensitive paths before clicking Push.',
  },
  {
    key: 'no-accounts',
    icon: Eye,
    title: 'No accounts. No tracking.',
    short: 'No signup, no cookies on your code, token only in tab memory.',
    long:
      'There is no Zip2Git account. Your GitHub token is held only in JavaScript memory for the duration of this tab — close the tab and it is gone. We do not write your token to localStorage, IndexedDB, cookies, or any server log. The site uses no behavioural tracking, no fingerprinting, and no third-party analytics on your repository contents.',
  },
];

const STORAGE_KEY = 'zip2git_help_seen_v1';

export const HelpCenter = () => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<CardKey | null>(null);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        const t = setTimeout(() => setHighlight(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (open) {
      setHighlight(false);
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    }
  }, [open]);

  const close = () => { setOpen(false); setExpanded(null); };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 220 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Help & Privacy Center"
        data-testid="button-help-center"
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-2.5 sm:px-4 sm:py-3 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-shadow"
      >
        <AnimatePresence>
          {highlight && (
            <motion.span
              key="ring"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut', repeat: 3 }}
              className="absolute inset-0 rounded-full bg-emerald-400 -z-10"
            />
          )}
        </AnimatePresence>
        <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="hidden sm:inline whitespace-nowrap">Help & Privacy</span>
        <span className="sm:hidden">Help</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
            onClick={close}
            data-testid="modal-help-center"
          >
            <motion.div
              initial={{ y: 40, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl bg-card border border-border/60"
            >
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/50 px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm sm:text-base leading-tight truncate">
                      Help & Privacy Center
                    </h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      Everything you need to know — in one place
                    </p>
                  </div>
                </div>
                <button
                  onClick={close}
                  aria-label="Close"
                  data-testid="button-help-close"
                  className="h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {/* First-visit privacy explainer */}
                <div className="rounded-xl bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-primary/5 border border-amber-500/30 p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <p className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">
                      How Zip2Git protects you
                    </p>
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                    Zip2Git is <span className="font-semibold text-foreground">100% browser-based</span>.
                    Your ZIP file, your code, and your GitHub token never touch our servers.
                    Tap any card below to read exactly how each promise works.
                  </p>
                </div>

                {/* 3 expandable privacy cards */}
                <div className="space-y-2">
                  {CARDS.map((c) => {
                    const isOpen = expanded === c.key;
                    const Icon = c.icon;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : c.key)}
                        data-testid={`help-card-${c.key}`}
                        className={`w-full text-left rounded-xl border p-3 sm:p-3.5 transition-all ${
                          isOpen
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border/60 bg-background/50 hover:border-primary/30 hover:bg-primary/5'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-xs sm:text-sm leading-tight">
                                {c.title}
                              </h4>
                              <ChevronDown
                                className={`h-4 w-4 text-muted-foreground transition-transform shrink-0 ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                            <p className="mt-0.5 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                              {c.short}
                            </p>
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.22 }}
                                  className="overflow-hidden"
                                >
                                  <p className="mt-2.5 text-[11px] sm:text-xs text-foreground/85 leading-relaxed border-l-2 border-primary/40 pl-3">
                                    {c.long}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quick links row */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    More resources
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/faq"
                      onClick={close}
                      data-testid="help-link-faq"
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">FAQ & Guides</span>
                    </Link>
                    <Link
                      to="/privacy"
                      onClick={close}
                      data-testid="help-link-privacy"
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">Full Privacy Policy</span>
                    </Link>
                    <Link
                      to="/tools"
                      onClick={close}
                      data-testid="help-link-tools"
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">All Developer Tools</span>
                    </Link>
                    <a
                      href="https://github.com/CodeByShareef"
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="help-link-github"
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      <Github className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">Source on GitHub</span>
                    </a>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 border border-border/40 px-3 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Need help? Email me directly:</span>
                  </div>
                  <a
                    href="mailto:codebyshareef@gmail.com"
                    className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1"
                    data-testid="help-link-email"
                  >
                    <Mail className="h-3 w-3" /> codebyshareef@gmail.com
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

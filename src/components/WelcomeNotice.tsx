import { useState, useEffect } from 'react';
import { ShieldCheck, X, Lock, FolderCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'zip2git_welcome_dismissed_v1';

export const WelcomeNotice = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage unavailable — show once per session
      setOpen(true);
    }
    return undefined;
  }, []);

  const dismiss = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
          onClick={dismiss}
          data-testid="modal-welcome"
        >
          <motion.div
            initial={{ y: 50, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card border border-border/60 overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 p-5 border-b border-border/40">
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                data-testid="button-welcome-close"
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-white" />
                  <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg leading-tight">Welcome to Zip2Git 👋</h3>
                  <p className="text-xs text-muted-foreground">Built by <span className="font-semibold text-foreground">CodeByShareef</span></p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">⚠️ Important Notice</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Zip2Git is <span className="font-semibold text-foreground">100% browser-based</span>. Nothing is uploaded
                  to our servers. We do <span className="font-semibold text-foreground">not store, log, or save</span> your
                  files, ZIPs, tokens, or repository contents. Once you close the tab — everything is gone.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2.5 rounded-md bg-muted/40 p-2.5">
                  <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    <span className="font-semibold">Your files stay private.</span> All ZIP processing happens locally in your browser.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 rounded-md bg-muted/40 p-2.5">
                  <FolderCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    <span className="font-semibold">Project responsibility is yours.</span> You're responsible for what
                    you push to your own GitHub. We're just the bridge.
                  </p>
                </div>
                <div className="flex items-start gap-2.5 rounded-md bg-muted/40 p-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    <span className="font-semibold">No accounts, no tracking.</span> No signup, no analytics on your
                    code. GitHub token only lives in browser memory.
                  </p>
                </div>
              </div>

              <button
                onClick={dismiss}
                data-testid="button-welcome-accept"
                className="w-full mt-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white font-semibold py-2.5 text-sm hover:opacity-90 transition-opacity"
              >
                Got it — let me push my ZIP
              </button>
              <p className="text-[10px] text-center text-muted-foreground">
                Built with ❤️ by <a href="mailto:codebyshareef@gmail.com" className="text-primary hover:underline">CodeByShareef</a>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

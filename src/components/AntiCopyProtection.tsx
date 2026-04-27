import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Lightweight protection:
 * - Allow text selection, right-click, and Ctrl+C everywhere (users can copy commands, code snippets, links).
 * - Only block source-view & devtools shortcuts (Ctrl+U, Ctrl+Shift+I/J/C, F12).
 * This satisfies "user can copy text but not view full source".
 */
export const AntiCopyProtection = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.key.toLowerCase() === 'u') ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        setShowModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="font-display text-2xl font-bold">⚠️ Source view disabled</h2>
            <div className="space-y-2 text-muted-foreground text-sm leading-relaxed">
              <p>
                Zip2Git is built by{' '}
                <span className="font-semibold text-foreground">codebyshareef</span>.
              </p>
              <p>You can freely copy any visible text, link, or code snippet — but the full source is protected.</p>
              <p className="flex items-center justify-center gap-1">
                Thanks for respecting the creator's work
                <Heart className="h-4 w-4 text-destructive inline" fill="currentColor" />
              </p>
            </div>
            <Button onClick={() => setShowModal(false)} className="w-full gap-2">
              <X className="h-4 w-4" /> Close
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

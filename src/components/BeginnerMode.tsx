import { useEffect, useRef, useState } from 'react';
import { GraduationCap, Volume2, VolumeX, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BeginnerModeProps {
  step: 1 | 2 | 3 | 4;
}

const STEP_GUIDE: Record<number, { title: string; tip: string; speech: string }> = {
  1: {
    title: 'Step 1: Upload your ZIP',
    tip: 'Click the upload box or drag and drop your project ZIP file. Any project type works — React, Python, Java, anything.',
    speech: 'Welcome to Zip2Git. Step one: Click the upload box or drag and drop your zip file containing your project. We support every project type.',
  },
  2: {
    title: 'Step 2: Connect GitHub',
    tip: 'Click "Connect GitHub" and paste a Personal Access Token. Need one? Tap the help link inside that dialog — it walks you through it.',
    speech: 'Step two: Connect your GitHub account by pasting a Personal Access Token. If you do not have one, our guide will walk you through creating it in two minutes.',
  },
  3: {
    title: 'Step 3: Name & push',
    tip: 'Type a repository name, choose Public or Private, then hit the big push button. We handle the rest — files, README, .gitignore, everything.',
    speech: 'Step three: Type a name for your new repository, pick public or private, then press the push button. We will upload every file directly to GitHub.',
  },
  4: {
    title: 'All done! 🎉',
    tip: 'Your project is live on GitHub. Click the link to open it, or upload another ZIP to push more.',
    speech: 'Congratulations! Your project is now live on GitHub. You can click the link to view it, or upload another zip to push another project.',
  },
};

export const BeginnerMode = ({ step }: BeginnerModeProps) => {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('zip2git-beginner') === '1';
  });
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('zip2git-beginner-muted') === '1';
  });
  const lastSpoken = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('zip2git-beginner', enabled ? '1' : '0');
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('zip2git-beginner-muted', muted ? '1' : '0');
  }, [muted]);

  useEffect(() => {
    if (!enabled || muted) {
      window.speechSynthesis?.cancel();
      return;
    }
    if (lastSpoken.current === step) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const guide = STEP_GUIDE[step];
    if (!guide) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(guide.speech);
    u.rate = 0.95;
    u.pitch = 1;
    u.volume = 0.9;
    window.speechSynthesis.speak(u);
    lastSpoken.current = step;
  }, [enabled, muted, step]);

  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  const guide = STEP_GUIDE[step];

  return (
    <>
      <button
        onClick={() => setEnabled(v => !v)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${enabled ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40'}`}
        aria-label="Toggle beginner mode"
        title="Beginner mode: step-by-step voice guide"
      >
        <GraduationCap className="h-3.5 w-3.5" />
        <span>Beginner Mode {enabled ? 'On' : 'Off'}</span>
      </button>

      <AnimatePresence>
        {enabled && guide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-40 max-w-xs w-[calc(100%-2rem)] sm:w-80"
          >
            <div className="rounded-xl border border-primary/30 bg-card/95 backdrop-blur-xl p-3.5 shadow-md">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Beginner Mode</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setMuted(v => !v)} title={muted ? 'Unmute voice' : 'Mute voice'}>
                    {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEnabled(false)} title="Close">
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                <ChevronRight className="h-3.5 w-3.5 text-primary" />
                {guide.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{guide.tip}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

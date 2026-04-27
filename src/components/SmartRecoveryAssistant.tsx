import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, X, ExternalLink, FileSearch, FolderSearch, HardDrive, Code, RotateCcw, History, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecoveryOption {
  icon: typeof FileSearch;
  title: string;
  description: string;
  steps: { text: string; link?: string; linkLabel?: string }[];
}

const RECOVERY_OPTIONS: RecoveryOption[] = [
  {
    icon: FileSearch,
    title: 'Deleted File Recovery',
    description: 'Recover a file that was deleted from your GitHub repository.',
    steps: [
      { text: 'Go to your repository on GitHub and click on the commit history.' },
      { text: 'Find the commit before the file was deleted.' },
      { text: 'Click on "Browse files" at that commit to view the file tree.' },
      { text: 'Navigate to the file and click "Raw" to download it.', link: 'https://github.com', linkLabel: '🚀 Go to GitHub' },
    ],
  },
  {
    icon: FolderSearch,
    title: 'Deleted Folder Recovery',
    description: 'Recover an entire folder that was removed.',
    steps: [
      { text: 'Open your repository and go to the "Commits" tab.' },
      { text: 'Find the commit that deleted the folder.' },
      { text: 'Click the commit hash to see the diff — you\'ll see all deleted files.' },
      { text: 'Use "git checkout <commit-hash> -- path/to/folder" locally, or browse that commit on GitHub.', link: 'https://docs.github.com/en/repositories/working-with-files/using-files/viewing-a-file#viewing-or-copying-the-raw-file-content', linkLabel: '🚀 Learn More' },
    ],
  },
  {
    icon: HardDrive,
    title: 'Recover .exe / Binary Files',
    description: 'Recover binary files like .exe, .dll, .zip, images etc.',
    steps: [
      { text: 'GitHub stores all binary files in Git history.' },
      { text: 'Go to your repo → Commits → find the commit with the binary file.' },
      { text: 'Click on the commit, then click "View file" on the binary.' },
      { text: 'Click "Download" to get the raw binary file.', link: 'https://github.com', linkLabel: '🚀 Go to GitHub' },
    ],
  },
  {
    icon: Code,
    title: 'Recover Lost Code Changes',
    description: 'Revert to a previous version of your code.',
    steps: [
      { text: 'Navigate to the file in your repository on GitHub.' },
      { text: 'Click "History" to see all previous versions of that file.' },
      { text: 'Click on any commit to see the exact changes made.' },
      { text: 'Click "View file" at that point in time to see the full old version.', link: 'https://github.com', linkLabel: '🚀 Go to GitHub' },
    ],
  },
  {
    icon: RotateCcw,
    title: 'Restore Entire Repo to Previous State',
    description: 'Roll back your entire repository to an earlier commit.',
    steps: [
      { text: 'Go to your repository → "Commits" tab.' },
      { text: 'Find the commit you want to restore to.' },
      { text: 'Copy the commit hash (the 7-character code).' },
      { text: 'Locally run: git reset --hard <commit-hash> && git push --force', link: 'https://docs.github.com/en/repositories/working-with-files/managing-files/reverting-a-commit', linkLabel: '🚀 Learn More' },
    ],
  },
  {
    icon: History,
    title: 'View Full Repository History',
    description: 'Browse through all changes ever made to your repository.',
    steps: [
      { text: 'Open your repository on GitHub.' },
      { text: 'Click on the "Commits" count (e.g., "42 commits") near the top.' },
      { text: 'Browse through the full history of every change.' },
      { text: 'Click any commit to see what was added, changed, or removed.', link: 'https://github.com', linkLabel: '🚀 Go to GitHub' },
    ],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SmartRecoveryAssistant = ({ isOpen, onClose }: Props) => {
  const [selected, setSelected] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Wrench className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold font-display truncate">🛠️ Recovery Assistant</h2>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">What did you lose? We'll help.</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 ml-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {selected === null ? (
              <>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">Select what you need to recover:</p>
                {RECOVERY_OPTIONS.map((opt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelected(i)}
                    className="w-full flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="mt-0.5 flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <opt.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xs sm:text-sm leading-tight">{opt.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{opt.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
                  </motion.button>
                ))}
              </>
            ) : (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelected(null)} 
                  className="gap-1 text-xs sm:text-sm"
                >
                  ← Back
                </Button>
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {(() => { const Icon = RECOVERY_OPTIONS[selected].icon; return <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />; })()}
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg leading-tight">{RECOVERY_OPTIONS[selected].title}</h3>
                </div>
                <div className="space-y-4">
                  {RECOVERY_OPTIONS[selected].steps.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary flex-none">
                        {i + 1}
                      </div>
                      <div className="space-y-2 min-w-0">
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">{step.text}</p>
                        {step.link && (
                          <a href={step.link} target="_blank" rel="noopener noreferrer" className="block">
                            <Button 
                              variant="hero" 
                              size="sm" 
                              className="gap-2 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
                            >
                              {step.linkLabel} <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

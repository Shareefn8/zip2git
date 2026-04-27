import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink,
  Check,
  Key,
  Shield,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GitHubTokenGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSubmit: (token: string) => void;
  isValidating?: boolean;
}

const TOKEN_URL =
  'https://github.com/settings/tokens/new?scopes=repo&description=Zip2Git';

const steps = [
  {
    number: 1,
    title: 'Open GitHub Settings',
    description: "Tap the button to open GitHub's token page in a new tab.",
  },
  {
    number: 2,
    title: 'Configure Token',
    description: "Name it 'Zip2Git' and select the repo scope (full repo control).",
  },
  {
    number: 3,
    title: 'Generate & Copy',
    description: "Click Generate token and copy it immediately — GitHub won't show it again.",
  },
  {
    number: 4,
    title: 'Paste Token Below',
    description: 'Paste your token in the field below and click Connect.',
  },
];

export const GitHubTokenGuide: React.FC<GitHubTokenGuideProps> = ({
  isOpen,
  onClose,
  onTokenSubmit,
  isValidating = false,
}) => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  const handleOpenGitHub = () => {
    window.open(TOKEN_URL, '_blank', 'noopener,noreferrer');
    toast({
      title: 'GitHub opened in new tab',
      description: 'Follow the steps to create your Zip2Git token.',
    });
  };

  const handleSubmit = () => {
    if (!token.trim()) {
      toast({
        title: 'Token required',
        description: 'Please enter your GitHub personal access token.',
        variant: 'destructive',
      });
      return;
    }

    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      toast({
        title: 'Invalid token format',
        description: "GitHub tokens start with 'ghp_' or 'github_pat_'.",
        variant: 'destructive',
      });
      return;
    }

    onTokenSubmit(token);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.97, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 20 }}
          className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header — clean, no overlap */}
          <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-4 flex items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold leading-tight truncate">Connect GitHub</h2>
                <p className="text-xs text-muted-foreground truncate">Create a personal access token</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Steps */}
          <div className="p-5 space-y-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative pl-10">
                <div className="absolute left-0 top-0 w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />
                )}
                <div className="pb-4">
                  <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{step.description}</p>

                  {step.number === 1 && (
                    <Button onClick={handleOpenGitHub} size="sm" className="gap-1.5 h-8 text-xs">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open GitHub Token Page
                    </Button>
                  )}

                  {step.number === 2 && (
                    <div className="bg-muted/50 rounded-lg p-2.5 text-xs flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        Required scope:{' '}
                        <code className="bg-primary/20 px-1 rounded text-[11px]">repo</code>
                      </span>
                    </div>
                  )}

                  {step.number === 4 && (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="w-full px-3 py-2.5 pr-10 bg-background border border-border rounded-lg text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowToken(!showToken)}
                        >
                          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>

                      <Button
                        onClick={handleSubmit}
                        disabled={isValidating || !token.trim()}
                        className="w-full gap-2 h-9"
                        variant="hero"
                      >
                        {isValidating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Connect GitHub
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Security Note */}
          <div className="px-5 pb-5">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="text-primary font-medium">Token is secure.</span>{' '}
                Stored only in your browser memory for this session — never sent to any server.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

import { useState, useEffect } from 'react';
import { Coffee, X, Heart, Copy, Check, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const GUMROAD_URL = 'https://codebyshareef.gumroad.com/coffee';
const EVM_ADDRESS = '0x9a8c8b9665b44a0766a8d6e36802caf4b537112b';
const SOL_ADDRESS = 'Ztete4VxytT6PMmjE6eSUFW6rJ63bG8p7HfgfChWzLU';
const BINANCE_PAY_ID = '362016909';

export const FloatingDonateButton = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 4000);
    return () => clearInterval(t);
  }, []);

  const copy = (addr: string, label: string) => {
    try {
      navigator.clipboard?.writeText(addr);
      setCopied(label);
      toast({ title: `✅ ${label} copied`, description: 'Paste in your wallet to send love ☕' });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* Floating button — fixed bottom-right, persistent on every page */}
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 220 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Buy me a coffee"
        data-testid="button-floating-donate"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 px-3 py-2.5 sm:px-4 sm:py-3 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow"
      >
        {/* Pulse ring */}
        <AnimatePresence>
          {pulse && (
            <motion.span
              key="ring"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-amber-400 -z-10"
            />
          )}
        </AnimatePresence>
        <Coffee className="h-4 w-4 sm:h-5 sm:w-5" />
        <span className="hidden sm:inline whitespace-nowrap">Buy me a coffee</span>
        <span className="sm:hidden">Coffee</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
            onClick={() => setOpen(false)}
            data-testid="modal-donate"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-card border border-border/60 overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-500/5 p-5 border-b border-border/40">
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20">
                    <Coffee className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg leading-tight">Fuel Zip2Git ☕</h3>
                    <p className="text-xs text-muted-foreground">Buy me a coffee — keep it free for everyone</p>
                  </div>
                </div>
              </div>

              {/* Primary CTA — Gumroad */}
              <div className="p-4 space-y-3">
                <a
                  href={GUMROAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-gumroad"
                  className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-4 py-3 text-white font-semibold transition-all shadow-md shadow-pink-500/20"
                >
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4" fill="currentColor" />
                    Donate via Gumroad
                  </span>
                  <ExternalLink className="h-4 w-4 opacity-80" />
                </a>

                <p className="text-[11px] text-center text-muted-foreground">— or pay with crypto (lower fees, global) —</p>

                {/* Crypto rows — compact */}
                <div className="space-y-2">
                  {[
                    { id: 'binance', label: 'Binance Pay', addr: BINANCE_PAY_ID, color: 'text-yellow-500' },
                    { id: 'evm', label: 'EVM (ETH/BNB/Polygon)', addr: EVM_ADDRESS, color: 'text-blue-500' },
                    { id: 'sol', label: 'Solana (SOL/USDT)', addr: SOL_ADDRESS, color: 'text-green-500' },
                  ].map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
                      data-testid={`crypto-${c.id}`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold ${c.color}`}>{c.label}</p>
                        <code className="text-[9px] font-mono text-muted-foreground break-all line-clamp-1">{c.addr}</code>
                      </div>
                      <button
                        onClick={() => copy(c.addr, c.label)}
                        className="h-7 px-2.5 rounded-md bg-background hover:bg-primary/10 hover:text-primary text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
                      >
                        {copied === c.label ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === c.label ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sponsor CTA */}
                <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-[11px] font-semibold text-primary mb-1">Want your business featured?</p>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Sponsors get logo + title + URL on every page. Send proof + your business details.
                  </p>
                  <a
                    href="mailto:codebyshareef@gmail.com?subject=Zip2Git%20Sponsor%20Submission&body=Hi%20Shareef%2C%0A%0AI'd%20like%20to%20be%20featured%20as%20a%20sponsor.%0A%0ABusiness%20Name%3A%20%0AURL%3A%20%0ALogo%20(URL%2Fattached)%3A%20%0ADescription%20(1%20line)%3A%20%0AContact%20Email%3A%20%0APayment%20Proof%20(attached)%3A%20%0A%0AThanks!"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    ✉️ Submit your sponsor info →
                  </a>
                </div>

                <p className="text-[10px] text-center text-muted-foreground pt-1">
                  Contact: <a href="mailto:codebyshareef@gmail.com" className="text-primary hover:underline">codebyshareef@gmail.com</a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

import { useState } from 'react';
import {
  Heart, Copy, Check, Coffee, Sparkles, ShieldCheck, Zap, Globe, Mail,
  Server, Bug, Rocket, Megaphone, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';

const GUMROAD_URL = 'https://codebyshareef.gumroad.com/coffee';
const EVM_ADDRESS = '0x9a8c8b9665b44a0766a8d6e36802caf4b537112b';
const SOL_ADDRESS = 'Ztete4VxytT6PMmjE6eSUFW6rJ63bG8p7HfgfChWzLU';
const BINANCE_PAY_ID = '362016909';
const SUPPORT_EMAIL = 'codebyshareef@gmail.com';
const SPONSOR_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=Zip2Git%20Sponsor%20%2F%20Showcase%20Submission&body=Hi%20Shareef%2C%0A%0AI%20just%20supported%20Zip2Git%20%E2%98%95%20and%20I%27d%20like%20to%20be%20featured.%0A%0ABrand%2FName%3A%20%0AWebsite%20Title%3A%20%0AShort%20Description%3A%20%0AWebsite%20URL%3A%20%0AScreenshot%2FImage%20(attached)%3A%20%0APayment%20Proof%20(attached)%3A%20%0A%0AThanks!`;

export const DonationSection = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (addr: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(addr);
      } else {
        const ta = document.createElement('textarea');
        ta.value = addr; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
      setCopied(label);
      toast({ title: `✅ ${label} copied`, description: 'Paste in your wallet to send love ☕' });
      setTimeout(() => setCopied(null), 2000);
    } catch {/* ignore */}
  };

  return (
    <section className="border-t border-border/40 py-6 sm:py-8 px-4 sm:px-6" data-testid="section-support">
      <div className="container mx-auto max-w-5xl space-y-5">
        {/* === HEADER === */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Coffee className="h-3.5 w-3.5" /> Help Keep Zip2Git Free
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
            💖 Support <span className="text-gradient">Zip2Git</span> by CodeByShareef
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Built with ❤️ — keep developer tools <span className="font-semibold">free, fast, and accessible</span>.
          </p>
        </div>

        {/* === TWO BIG ACTION BUTTONS — open dialogs on click === */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* LEFT — Donate */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 p-3 sm:p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-pink-500/30"
                data-testid="button-donate-open"
              >
                <div className="absolute -top-2 -right-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white/10 group-hover:bg-white/15 transition-colors" />
                <div className="relative space-y-1.5 sm:space-y-2">
                  <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-white/25 backdrop-blur flex items-center justify-center shadow-inner">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-white leading-tight">
                      Donate / Coffee ☕
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/85 leading-snug">
                      Tap to see all payment ways
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-white/95 font-semibold">
                    <Sparkles className="h-3 w-3" /> Gumroad · Crypto · Binance
                  </div>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" data-testid="dialog-donate">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
                  Tuhade support naal eh sab possible ae
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Every coffee keeps the servers running, bugs squashed, and new features coming.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2">
                    <Server className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span><span className="font-semibold">High-speed hosting</span> — fast worldwide</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2">
                    <Bug className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span><span className="font-semibold">Security & bug fixes</span> — every issue patched</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2">
                    <Rocket className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span><span className="font-semibold">New features</span> — driven by your requests</span>
                  </li>
                </ul>

                <a
                  href={GUMROAD_URL} target="_blank" rel="noopener noreferrer"
                  data-testid="link-gumroad-primary"
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-4 py-3 text-white font-semibold text-sm transition-all"
                >
                  <Heart className="h-4 w-4" fill="currentColor" /> Donate via Gumroad
                </a>

                <div className="text-[10px] text-center text-muted-foreground">— or pay with crypto —</div>

                <div className="space-y-1.5">
                  {[
                    { id: 'binance', label: 'Binance Pay', addr: BINANCE_PAY_ID, color: 'text-yellow-500', icon: Zap },
                    { id: 'evm', label: 'EVM (ETH/BNB)', addr: EVM_ADDRESS, color: 'text-blue-500', icon: Globe },
                    { id: 'sol', label: 'Solana', addr: SOL_ADDRESS, color: 'text-green-500', icon: Zap },
                  ].map((c) => {
                    const Icon = c.icon;
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-2 border border-border/40" data-testid={`crypto-${c.id}`}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Icon className={`h-3.5 w-3.5 ${c.color} shrink-0`} />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold leading-tight">{c.label}</p>
                            <code className="text-[9px] font-mono text-muted-foreground break-all">{c.addr}</code>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-[10px] shrink-0" onClick={() => copy(c.addr, c.label)}>
                          {copied === c.label ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* RIGHT — Promote */}
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary via-amber-500 to-emerald-500 p-3 sm:p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-primary/30"
                data-testid="button-promote-open"
              >
                <div className="absolute -top-2 -right-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white/10 group-hover:bg-white/15 transition-colors" />
                <div className="relative space-y-1.5 sm:space-y-2">
                  <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-white/25 backdrop-blur flex items-center justify-center shadow-inner">
                    <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm sm:text-base text-white leading-tight">
                      Promote Your Site 🚀
                    </h3>
                    <p className="text-[10px] sm:text-xs text-white/85 leading-snug">
                      Tap to see how to get featured
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-white/95 font-semibold">
                    <Star className="h-3 w-3" fill="currentColor" /> Featured Sponsors slot
                  </div>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" data-testid="dialog-promote">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Apni website promote karni ae?
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Support Zip2Git aur main tuhadi website apni site te izzat naal showcase karanga 🔥
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2">
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Payment to baad eh details bhejo:
                  </p>
                  <ul className="space-y-1 text-[11px] text-muted-foreground">
                    <li>➤ <span className="font-semibold text-foreground">Tuhada Name / Brand</span></li>
                    <li>➤ <span className="font-semibold text-foreground">Website Title</span></li>
                    <li>➤ <span className="font-semibold text-foreground">Short Description</span></li>
                    <li>➤ <span className="font-semibold text-foreground">Website URL</span> (optional)</li>
                    <li>➤ <span className="font-semibold text-foreground">Screenshot / Logo Image</span></li>
                    <li>➤ <span className="font-semibold text-foreground">Payment Proof</span></li>
                  </ul>
                </div>

                <a
                  href={SPONSOR_MAILTO}
                  data-testid="link-send-details"
                  className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 px-4 py-3 text-white font-semibold text-sm transition-opacity"
                >
                  <Mail className="h-4 w-4" /> Email Your Details
                </a>

                <div className="rounded-md bg-amber-500/5 border border-amber-500/20 p-2.5 flex items-start gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Featured below in <span className="font-semibold text-foreground">Supporters Showcase</span> with
                    your logo, link, and 5-star rating — visible to every visitor ❤️
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Footer email line */}
        <div className="rounded-lg bg-muted/30 border border-border/40 px-3 py-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>100% browser-based · safe & transparent</span>
          </div>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[11px] font-mono text-primary hover:underline" data-testid="link-support-email">
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </section>
  );
};

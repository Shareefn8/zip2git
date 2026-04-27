import { useState } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEOHead } from '@/components/SEOHead';
import { AdSlot } from '@/components/AdSlotProvider';
import { SmartRecoveryAssistant } from '@/components/SmartRecoveryAssistant';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import {
  Wrench, Shield, FileText, FileCode, Search, Archive, Copy, Check,
  Globe, GitBranch, Terminal, Hash, Braces, RefreshCw, ExternalLink,
  Zap, Eye, Rocket, ArrowUpRight,
} from 'lucide-react';

const GITIGNORE_TEMPLATES: Record<string, string> = {
  'Node.js': `node_modules/\ndist/\n.env\n.env.*\n*.log\n.DS_Store\ncoverage/\n.cache/`,
  'Python': `__pycache__/\n*.py[cod]\n.env\nvenv/\n*.egg-info/\ndist/\nbuild/\n.pytest_cache/`,
  'Java': `*.class\n*.jar\ntarget/\n.idea/\n*.iml\n.gradle/\nbuild/`,
  'React': `node_modules/\nbuild/\n.env\n.env.local\n.DS_Store\ncoverage/\n.cache/`,
  'Laravel': `vendor/\nnode_modules/\n.env\nstorage/*.key\npublic/storage\npublic/hot`,
  'Flutter': `.dart_tool/\n.packages\nbuild/\n*.g.dart\n.flutter-plugins*`,
  'Go': `bin/\npkg/\n*.exe\n*.test\n*.out\nvendor/`,
  'General': `*.log\n*.tmp\n*.bak\n.DS_Store\nThumbs.db\n*.swp\n*~\n.env`,
};

const LICENSE_TEMPLATES: Record<string, string> = {
  'MIT': `MIT License\n\nCopyright (c) ${new Date().getFullYear()} [Your Name]\n\nPermission is hereby granted, free of charge, to any person obtaining a copy...`,
  'Apache 2.0': `Apache License\nVersion 2.0, January 2004\nhttp://www.apache.org/licenses/\n\nTerms and conditions...`,
  'GPL v3': `GNU GENERAL PUBLIC LICENSE\nVersion 3, 29 June 2007\n\nEveryone is permitted to copy...`,
};

const Tools = () => {
  const { toast } = useToast();
  const [showRecovery, setShowRecovery] = useState(false);
  const [selectedIgnore, setSelectedIgnore] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: '✅ Copied to clipboard' });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TOOLS = [
    {
      icon: Wrench, title: 'Smart Recovery Assistant', color: 'text-accent', bg: 'bg-accent/10',
      desc: 'Recover deleted files, folders, or restore your entire repo to a previous state with direct GitHub links.',
      onClick: () => setShowRecovery(true),
    },
    {
      icon: Search, title: 'Duplicate File Detector', color: 'text-primary', bg: 'bg-primary/10',
      desc: 'Find files with identical content. Edit, rename, or delete duplicates directly — keep your project clean.',
      link: '/',
    },
    {
      icon: Archive, title: 'Clean ZIP Export', color: 'text-primary', bg: 'bg-primary/10',
      desc: 'Download a sanitized version of your project with all sensitive files removed — safe to share with anyone.',
      link: '/',
    },
    {
      icon: Shield, title: 'Secret Shield Scanner', color: 'text-destructive', bg: 'bg-destructive/10',
      desc: 'Scan any project for exposed API keys, .env files, private keys, and credentials before they leak.',
      link: '/',
    },
    {
      icon: Globe, title: 'GitHub Quick Links', color: 'text-primary', bg: 'bg-primary/10',
      desc: 'Jump directly to your GitHub settings, tokens, repos, and profile.',
      links: [
        { label: 'Create Token', url: 'https://github.com/settings/tokens/new' },
        { label: 'Your Repos', url: 'https://github.com/new' },
        { label: 'Profile Settings', url: 'https://github.com/settings/profile' },
      ],
    },
    {
      icon: Hash, title: 'HTTP Status Codes', color: 'text-primary', bg: 'bg-primary/10',
      desc: 'Quick reference for common HTTP status codes every developer should know.',
      codes: [
        { code: '200', meaning: 'OK' },
        { code: '401', meaning: 'Unauthorized' },
        { code: '404', meaning: 'Not Found' },
        { code: '500', meaning: 'Server Error' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Free Developer Toolkit - Recovery, Gitignore, License | Zip2Git"
        description="Free developer tools: Smart Recovery Assistant, .gitignore generator, license picker, HTTP status codes, GitHub quick links. No signup required."
        path="/tools"
        image="https://i.ibb.co/Q3xKNG0J/2-zip2git.png"
      />
      <Navbar />
      <SmartRecoveryAssistant isOpen={showRecovery} onClose={() => setShowRecovery(false)} />

      <main className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 text-center space-y-2">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl font-bold sm:text-4xl">
              Developer <span className="text-gradient">Toolkit</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
              Free tools every developer needs. No signup, no limits — powered by Zip2Git.
            </motion.p>
          </div>

          <AdSlot slot={4} className="mb-4" />

          {/* Interactive Tools — alternating icon position per card */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {TOOLS.map((tool, i) => {
              const isOdd = i % 2 === 0;
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 sm:p-5 space-y-2.5 group hover:border-primary/40 transition-colors flex flex-col"
                >
                  <div className={`card-icon-row ${isOdd ? '' : 'flip'}`}>
                    <div className={`card-main-icon ${tool.bg}`}>
                      <tool.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${tool.color}`} />
                    </div>
                    <span className="card-side-icon">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <h3 className={`font-display font-semibold text-sm sm:text-base ${isOdd ? 'text-left' : 'text-right'}`}>
                    {tool.title}
                  </h3>
                  <p className={`text-xs text-muted-foreground leading-relaxed flex-1 ${isOdd ? 'text-left' : 'text-right'}`}>
                    {tool.desc}
                  </p>
                  <div className={`flex ${isOdd ? '' : 'justify-end'}`}>
                    {tool.onClick && <Button size="sm" variant="outline" className="gap-1.5" onClick={tool.onClick}><Wrench className="h-3.5 w-3.5" /> Open</Button>}
                    {tool.link && (
                      <Link to={tool.link}>
                        <Button size="sm" variant="outline" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5" /> Open Tool</Button>
                      </Link>
                    )}
                  </div>
                  {tool.links && (
                    <div className={`flex flex-wrap gap-1.5 ${isOdd ? '' : 'justify-end'}`}>
                      {tool.links.map(l => (
                        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-7 px-2">{l.label}</Button>
                        </a>
                      ))}
                    </div>
                  )}
                  {tool.codes && (
                    <div className="grid grid-cols-2 gap-1">
                      {tool.codes.map(c => (
                        <div key={c.code} className="flex gap-2 text-[10px]">
                          <span className="font-mono font-bold text-primary">{c.code}</span>
                          <span className="text-muted-foreground truncate">{c.meaning}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* .gitignore Generator + License Picker — side by side on lg */}
          <div className="grid gap-4 lg:grid-cols-2 mb-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FileCode className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">.gitignore Generator</h3>
                  <p className="text-xs text-muted-foreground">Pick a framework, get a ready-to-use .gitignore</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.keys(GITIGNORE_TEMPLATES).map(k => (
                  <Button key={k} size="sm" variant={selectedIgnore === k ? 'default' : 'outline'} onClick={() => setSelectedIgnore(k)}>{k}</Button>
                ))}
              </div>
              {selectedIgnore && (
                <div className="space-y-2">
                  <pre className="rounded-lg border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap max-h-40 overflow-auto">{GITIGNORE_TEMPLATES[selectedIgnore]}</pre>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copyText(GITIGNORE_TEMPLATES[selectedIgnore])}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
                  </Button>
                </div>
              )}
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-semibold">License Picker</h3>
                  <p className="text-xs text-muted-foreground">Choose the right open-source license</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.keys(LICENSE_TEMPLATES).map(k => (
                  <Button key={k} size="sm" variant={selectedLicense === k ? 'default' : 'outline'} onClick={() => setSelectedLicense(k)}>{k}</Button>
                ))}
              </div>
              {selectedLicense && (
                <div className="space-y-2">
                  <pre className="rounded-lg border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap max-h-40 overflow-auto">{LICENSE_TEMPLATES[selectedLicense]}</pre>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copyText(LICENSE_TEMPLATES[selectedLicense])}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
                  </Button>
                </div>
              )}
            </div>
          </div>

          <AdSlot slot={5} className="mb-4" />
          <AdSlot slot={6} className="mt-2" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tools;

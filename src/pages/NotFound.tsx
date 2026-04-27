import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-hero-glow" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
          <FileCode className="w-10 h-10 text-primary" />
        </div>
        
        <h1 className="text-6xl font-bold mb-4 text-gradient">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          This page doesn't exist in any repository.
        </p>
        
        <Link to="/">
          <Button variant="hero" size="lg">
            <Home className="w-5 h-5" />
            Back to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;

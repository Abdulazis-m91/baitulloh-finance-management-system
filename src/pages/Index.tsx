import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import HeroSection from '@/components/public/HeroSection';
import InfoSection from '@/components/public/InfoSection';
import GallerySection from '@/components/public/GallerySection';
import LoginDialog from '@/components/auth/LoginDialog';

const Index = () => {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center shadow-sm">
              <span className="text-lg font-bold font-arabic text-foreground">ب</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">Yayasan Baitulloh</h1>
              <p className="text-xs text-muted-foreground">Sistem Bendahara</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLoginOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-4 h-4" /> Login
          </motion.button>
        </div>
      </header>

      <main className="pt-16">
        <HeroSection />
        <InfoSection />
        <GallerySection />
      </main>

      {/* Footer */}
      <footer className="bg-foreground py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center">
              <span className="text-sm font-bold font-arabic text-foreground">ب</span>
            </div>
            <span className="text-primary-foreground font-semibold">Yayasan Baitulloh</span>
          </div>
          <p className="text-primary-foreground/50 text-sm">© 2026 Yayasan Baitulloh. Sistem Informasi Bendahara.</p>
        </div>
      </footer>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default Index;

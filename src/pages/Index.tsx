import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, ChevronDown } from 'lucide-react';
import HeroSection from '@/components/public/HeroSection';
import InfoSection from '@/components/public/InfoSection';
import GallerySection from '@/components/public/GallerySection';
import LoginDialog from '@/components/auth/LoginDialog';

const Index = () => {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-40"
      >
        <div className="mx-4 mt-3">
          <div className="max-w-7xl mx-auto glass-card rounded-2xl px-5 h-16 flex items-center justify-between shadow-elevated">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold"
              >
                <span className="text-lg font-bold font-arabic text-foreground">ب</span>
              </motion.div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-tight tracking-tight">Yayasan Baitulloh</h1>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Sistem Bendahara</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold btn-shine shadow-glow-primary"
            >
              <LogIn className="w-4 h-4" /> Masuk
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main>
        <HeroSection />

        {/* Scroll indicator */}
        <div className="flex justify-center -mt-16 relative z-10">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-10 h-10 rounded-full glass-card shadow-elegant flex items-center justify-center cursor-pointer"
            onClick={() => document.getElementById('info-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <ChevronDown className="w-5 h-5 text-primary" />
          </motion.div>
        </div>

        <div id="info-section">
          <InfoSection />
        </div>
        <GallerySection />
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden">
        <div className="gradient-hero py-12 px-4">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-secondary/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full bg-primary-foreground/3 blur-3xl" />

          <div className="max-w-6xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center gap-3 mb-4"
            >
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold">
                <span className="text-lg font-bold font-arabic text-foreground">ب</span>
              </div>
              <span className="text-primary-foreground font-bold text-lg tracking-tight">Yayasan Baitulloh</span>
            </motion.div>
            <p className="text-primary-foreground/40 text-sm">© 2026 Yayasan Baitulloh · Sistem Informasi Bendahara</p>
            <div className="mt-4 flex items-center justify-center gap-6">
              <a href="#" className="text-primary-foreground/50 text-xs hover:text-secondary transition-colors">Tentang Kami</a>
              <a href="#" className="text-primary-foreground/50 text-xs hover:text-secondary transition-colors">Kontak</a>
              <a href="#" className="text-primary-foreground/50 text-xs hover:text-secondary transition-colors">Kebijakan</a>
            </div>
          </div>
        </div>
      </footer>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default Index;

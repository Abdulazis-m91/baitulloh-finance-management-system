import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginDialog({ open, onClose }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email, password);
    if (success) {
      onClose();
      navigate('/dashboard');
    } else {
      setError('Email atau password salah');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2"
            onClick={e => e.stopPropagation()}
          >
            {/* Left - Form */}
            <div className="bg-card p-8 md:p-12 flex flex-col justify-center">
              <button onClick={onClose} className="absolute top-4 right-4 md:left-4 md:right-auto p-2 rounded-full hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <h2 className="text-2xl font-bold text-foreground mb-2">Selamat Datang</h2>
              <p className="text-muted-foreground mb-8">Masuk ke sistem Bendahara Yayasan Baitulloh</p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@baitulloh.sch.id"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm font-medium">
                    {error}
                  </motion.p>
                )}

                <button type="submit" className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
                  Login
                </button>
              </form>

              <div className="mt-6 p-4 rounded-xl bg-muted">
                <p className="text-xs text-muted-foreground font-medium mb-2">Demo Akun:</p>
                <p className="text-xs text-muted-foreground">Sekolah: sekolah@baitulloh.sch.id / sekolah123</p>
                <p className="text-xs text-muted-foreground">Pesantren: pesantren@baitulloh.sch.id / pesantren123</p>
                <p className="text-xs text-muted-foreground">Admin: admin@baitulloh.sch.id / admin123</p>
              </div>
            </div>

            {/* Right - Decorative */}
            <div className="hidden md:flex gradient-hero relative flex-col items-center justify-center p-12 text-center overflow-hidden">
              {/* Floating decorative elements */}
              <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-secondary/20 animate-float" />
              <div className="absolute bottom-20 left-10 w-16 h-16 rounded-full bg-secondary/15 animate-float" style={{ animationDelay: '2s' }} />
              <div className="absolute top-1/2 right-1/4 w-12 h-12 rounded-full bg-primary-foreground/10 animate-float" style={{ animationDelay: '4s' }} />

              <div className="relative z-10">
                <div className="w-24 h-24 rounded-full gradient-gold flex items-center justify-center mb-6 mx-auto shadow-lg">
                  <span className="text-3xl font-bold font-arabic text-foreground">ب</span>
                </div>
                <h3 className="text-2xl font-bold text-primary-foreground mb-3">Yayasan Baitulloh</h3>
                <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">Sistem Informasi Keuangan Terpadu untuk Mengelola Transaksi Yayasan</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

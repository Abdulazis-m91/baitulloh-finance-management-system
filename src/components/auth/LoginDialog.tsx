import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logoYB from '@/assets/logo-yb.png';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginDialog({ open, onClose }: LoginDialogProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    const success = login(email, password);
    setLoading(false);
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2"
            onClick={e => e.stopPropagation()}
          >
            {/* Left - Form */}
            <div className="bg-card p-8 md:p-12 flex flex-col justify-center relative">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 md:left-4 md:right-auto p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </motion.button>

              <div className="mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl font-extrabold text-foreground mb-2 tracking-tight">Selamat Datang</h2>
                  <p className="text-muted-foreground">Masuk ke sistem Bendahara Yayasan Baitulloh</p>
                </motion.div>
              </div>

              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@baitulloh.sch.id"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                    >
                      <p className="text-destructive text-sm font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold btn-shine shadow-glow-primary disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Masuk
                    </>
                  )}
                </motion.button>
              </motion.form>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 p-4 rounded-2xl bg-muted/50 border border-border"
              >
                <p className="text-xs text-muted-foreground font-semibold mb-2 uppercase tracking-wider">Demo Akun</p>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-mono">sekolah@baitulloh.sch.id / sekolah123</p>
                  <p className="text-xs text-muted-foreground font-mono">pesantren@baitulloh.sch.id / pesantren123</p>
                  <p className="text-xs text-muted-foreground font-mono">admin@baitulloh.sch.id / admin123</p>
                </div>
              </motion.div>
            </div>

            {/* Right - Decorative */}
            <div className="hidden md:flex gradient-hero relative flex-col items-center justify-center p-12 text-center overflow-hidden">
              {/* Animated decorations */}
              <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '32px 32px' }}
              />
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} className="absolute top-10 right-10 w-24 h-24 rounded-full border border-secondary/15" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} className="absolute bottom-20 left-10 w-32 h-32 rounded-full border border-primary-foreground/8" />
              <div className="absolute top-20 left-20 w-3 h-3 rounded-full bg-secondary/30 animate-bounce-gentle" />
              <div className="absolute bottom-32 right-20 w-2 h-2 rounded-full bg-secondary/20 animate-bounce-gentle" style={{ animationDelay: '1s' }} />

              <div className="relative z-10">
                <motion.img
                  src={logoYB}
                  alt="Logo Yayasan Baitulloh"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                  className="w-36 h-36 rounded-3xl object-contain mb-8 mx-auto drop-shadow-lg"
                />
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-extrabold text-primary-foreground mb-3 tracking-tight"
                >
                  Yayasan Baitulloh
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-primary-foreground/50 text-sm leading-relaxed max-w-xs"
                >
                  Sistem Informasi Keuangan Terpadu untuk Mengelola Transaksi Yayasan
                </motion.p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

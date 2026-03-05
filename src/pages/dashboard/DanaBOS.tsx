import { motion } from 'framer-motion';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DanaBOS() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-md mx-auto"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-8 shadow-elegant"
        >
          <Construction className="w-12 h-12 text-muted-foreground/40" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-6xl font-extrabold text-foreground/10 mb-2 tracking-tight"
        >
          404
        </motion.h1>
        <h2 className="text-2xl font-extrabold text-foreground mb-3 tracking-tight">Dalam Pengembangan</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Halaman Dana BOS sedang dalam tahap pengembangan. Fitur ini akan segera tersedia.
        </p>
        <motion.button
          whileHover={{ scale: 1.02, x: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold btn-shine shadow-glow-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </motion.button>
      </motion.div>
    </div>
  );
}

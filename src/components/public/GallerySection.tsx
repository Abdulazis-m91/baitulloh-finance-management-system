import { motion } from 'framer-motion';
import { Trophy, User } from 'lucide-react';

const achievements = [
  { name: 'Ahmad Fauzan', achievement: 'Juara 1 Lomba Tahfidz', kelas: '7A' },
  { name: 'Siti Aisyah', achievement: 'Juara 2 Olimpiade Matematika', kelas: '7B' },
  { name: 'Umar Faruq', achievement: 'Juara 1 Lomba Pidato', kelas: '11A' },
  { name: 'Fatimah Zahra', achievement: 'Juara 3 Kompetisi Sains', kelas: '10B' },
  { name: 'Khadijah Amira', achievement: 'Juara 1 Hafalan Al-Quran', kelas: '9B' },
  { name: 'Bilal Hakim', achievement: 'Juara 2 Lomba Kaligrafi', kelas: '9A' },
];

export default function GallerySection() {
  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Trophy className="w-6 h-6 text-secondary" />
            <h2 className="text-3xl font-bold text-foreground">Siswa Berprestasi</h2>
          </div>
          <p className="text-muted-foreground">Siswa-siswi yang telah mengharumkan nama Yayasan Baitulloh</p>
        </motion.div>

        {/* Auto-scrolling gallery */}
        <div className="overflow-hidden relative">
          <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused]" style={{ width: 'max-content' }}>
            {[...achievements, ...achievements].map((item, i) => (
              <div key={i} className="w-64 flex-shrink-0 bg-card rounded-2xl border border-border overflow-hidden shadow-elegant hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="h-40 gradient-hero flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-secondary/5 animate-pulse-glow" />
                  <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary-foreground/60" />
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-foreground text-sm">{item.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Kelas {item.kelas}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-xs text-secondary font-medium">{item.achievement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

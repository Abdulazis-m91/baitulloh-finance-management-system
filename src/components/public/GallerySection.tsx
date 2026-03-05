import { motion } from 'framer-motion';
import { Trophy, User, Star } from 'lucide-react';

const achievements = [
{ name: 'Ahmad Fauzan', achievement: 'Juara 1 Lomba Tahfidz', kelas: '7A', color: 'from-primary to-primary/80' },
{ name: 'Siti Aisyah', achievement: 'Juara 2 Olimpiade MTK', kelas: '7B', color: 'from-info to-info/80' },
{ name: 'Umar Faruq', achievement: 'Juara 1 Lomba Pidato', kelas: '11A', color: 'from-success to-success/80' },
{ name: 'Fatimah Zahra', achievement: 'Juara 3 Kompetisi Sains', kelas: '10B', color: 'from-secondary to-warning' },
{ name: 'Khadijah Amira', achievement: 'Juara 1 Hafalan Quran', kelas: '9B', color: 'from-primary to-success' },
{ name: 'Bilal Hakim', achievement: 'Juara 2 Lomba Kaligrafi', kelas: '9A', color: 'from-warning to-secondary' }];


export default function GallerySection() {
  return (
    <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]"
      style={{ backgroundImage: 'radial-gradient(circle, hsl(160, 70%, 28%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14">
          
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary mb-4">
            
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Hall of Fame</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">SISWA BERPRESTASI</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Siswa-siswi yang telah mengharumkan nama
Yayasan Baitulloh</p>
        </motion.div>

        {/* Scrolling gallery */}
        <div className="overflow-hidden relative group">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-6 animate-marquee group-hover:[animation-play-state:paused]" style={{ width: 'max-content' }}>
            {[...achievements, ...achievements, ...achievements].map((item, i) => <motion.div
              key={i}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-72 flex-shrink-0 bg-card rounded-3xl border border-border overflow-hidden shadow-elegant group/card cursor-default">
              
                <div className={`h-44 bg-gradient-to-br ${item.color} flex items-center justify-center relative overflow-hidden`}>
                  {/* Decorative circles */}
                  <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-primary-foreground/10 animate-float" style={{ animationDelay: `${i}s` }} />
                  <div className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-primary-foreground/5" />

                  <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-24 h-24 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/10">
                  
                    <User className="w-12 h-12 text-primary-foreground/70" />
                  </motion.div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-foreground">{item.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Kelas {item.kelas}</p>
                  <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/5 border border-secondary/10">
                    <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                    <span className="text-xs text-secondary font-semibold">{item.achievement}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>);

}
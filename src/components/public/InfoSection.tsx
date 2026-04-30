import { motion } from 'framer-motion';
import { Calendar, Phone, ArrowUpRight, GraduationCap, BookOpen, School } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } }
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
};

export default function InfoSection() {
  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-[100px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <motion.span initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
            Informasi Penting
          </motion.span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">INFORMASI PEMBAYARAN</h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Informasi penting terkait pembayaran biaya pendidikan di Yayasan Baitulloh
          </p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Periode Pembayaran */}
          <motion.div variants={item}
            className="group bg-card rounded-3xl border border-border shadow-elegant hover-lift card-border-glow overflow-hidden">
            {/* Header card */}
            <div className="gradient-primary p-6 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg tracking-tight">Periode Pembayaran</h3>
              <p className="text-white/70 text-xs mt-1">Batas waktu pembayaran bulanan</p>
            </div>
            {/* Body */}
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Batas Pembayaran</p>
                  <p className="font-bold text-foreground text-sm">Tanggal 1 - 10</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Pembayaran dilakukan setiap tanggal <span className="font-semibold text-foreground">1 - 10</span> setiap bulannya.
                Keterlambatan akan dicatat sebagai tunggakan.
              </p>
            </div>
          </motion.div>

          {/* Card 2: Biaya Pendidikan */}
          <motion.div variants={item}
            className="group bg-card rounded-3xl border border-border shadow-elegant hover-lift card-border-glow overflow-hidden">
            {/* Header card */}
            <div className="gradient-gold p-6 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg tracking-tight">Biaya Pendidikan</h3>
              <p className="text-white/70 text-xs mt-1">Rincian biaya per unit & kategori</p>
            </div>
            {/* Body */}
            <div className="p-6 space-y-2">
              {/* Sekolah */}
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <School className="w-3 h-3" /> Biaya Sekolah (SPP)
              </p>
              {[
                { label: 'SMP', value: 'Rp 125.000 / bulan', color: 'bg-info/10 text-info border-info/20' },
                { label: 'SMA', value: 'Rp 150.000 / bulan', color: 'bg-primary/10 text-primary border-primary/20' },
              ].map(r => (
                <div key={r.label} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${r.color}`}>
                  <span className="text-xs font-bold">{r.label}</span>
                  <span className="text-xs font-semibold">{r.value}</span>
                </div>
              ))}

              {/* Pesantren */}
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-3 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" /> Biaya Pesantren (Syahriah)
              </p>
              {[
                { label: 'Dalam Daerah', value: 'Rp 500.000 / bulan', color: 'bg-success/10 text-success border-success/20' },
                { label: 'Luar Daerah', value: 'Rp 550.000 / bulan', color: 'bg-warning/10 text-warning border-warning/20' },
              ].map(r => (
                <div key={r.label} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${r.color}`}>
                  <span className="text-xs font-bold">{r.label}</span>
                  <span className="text-xs font-semibold">{r.value}</span>
                </div>
              ))}

              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Tersedia opsi pembayaran <span className="font-semibold text-foreground">lunas, cicilan, dan deposit</span> untuk kemudahan orang tua.
              </p>
            </div>
          </motion.div>

          {/* Card 3: Hubungi Kami */}
          <motion.div variants={item}
            className="group bg-card rounded-3xl border border-border shadow-elegant hover-lift card-border-glow overflow-hidden">
            {/* Header card */}
            <div className="gradient-success p-6 pb-5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg tracking-tight">Hubungi Kami</h3>
              <p className="text-white/70 text-xs mt-1">Bantuan & informasi lebih lanjut</p>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Untuk informasi lebih lanjut mengenai pembayaran, tunggakan, atau hal lainnya — silakan hubungi kami melalui WhatsApp.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <p className="text-xs text-muted-foreground">Senin - Sabtu · 07.00 - 16.00 WIB</p>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Jl. Yukum Jaya, Terbanggi Besar, Lampung Tengah</p>
                </div>
              </div>
              <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                href="https://wa.me/6281234567890"
                target="_blank" rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-success text-success-foreground text-sm font-semibold btn-shine shadow-sm">
                <Phone className="w-4 h-4" /> Chat WhatsApp
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

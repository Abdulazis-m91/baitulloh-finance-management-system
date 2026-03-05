import { motion } from 'framer-motion';
import { Calendar, Phone, Info } from 'lucide-react';

export default function InfoSection() {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">Informasi Pembayaran</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Informasi penting terkait pembayaran biaya pendidikan di Yayasan Baitulloh</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border shadow-elegant hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">Periode Pembayaran</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Pembayaran dilakukan setiap <strong className="text-foreground">tanggal 1 - 10</strong> setiap bulannya. Keterlambatan akan dicatat sebagai tunggakan.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-6 border border-border shadow-elegant hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center mb-4">
              <Info className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">Biaya Pendidikan</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              SMP: <strong className="text-foreground">Rp 125.000</strong>/bulan<br />
              SMA: <strong className="text-foreground">Rp 150.000</strong>/bulan<br />
              Tersedia opsi cicilan dan deposit.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-6 border border-border shadow-elegant hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-2">Hubungi Kami</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              Untuk informasi lebih lanjut, silakan hubungi kami melalui WhatsApp.
            </p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success text-success-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Phone className="w-4 h-4" /> Chat WhatsApp
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

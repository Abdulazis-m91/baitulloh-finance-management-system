import { motion } from 'framer-motion';
import { Calendar, Phone, Info, ArrowUpRight } from 'lucide-react';

const cards = [
  {
    icon: Calendar,
    title: 'Periode Pembayaran',
    desc: 'Pembayaran dilakukan setiap tanggal 1 - 10 setiap bulannya. Keterlambatan akan dicatat sebagai tunggakan.',
    highlight: 'Tanggal 1 - 10',
    gradient: 'gradient-primary',
    iconColor: 'text-primary-foreground',
  },
  {
    icon: Info,
    title: 'Biaya Pendidikan',
    desc: 'Tersedia opsi pembayaran lunas, cicilan, dan deposit untuk kemudahan orang tua.',
    highlight: 'SMP: Rp 125.000 · SMA: Rp 150.000',
    gradient: 'gradient-gold',
    iconColor: 'text-foreground',
  },
  {
    icon: Phone,
    title: 'Hubungi Kami',
    desc: 'Untuk informasi lebih lanjut, silakan hubungi kami melalui WhatsApp.',
    highlight: null,
    gradient: 'gradient-success',
    iconColor: 'text-success-foreground',
    action: { label: 'Chat WhatsApp', href: 'https://wa.me/6281234567890' },
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

export default function InfoSection() {
  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Background decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-secondary/5 blur-[100px]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4"
          >
            Informasi Penting
          </motion.span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">Informasi Pembayaran</h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">Informasi penting terkait pembayaran biaya pendidikan di Yayasan Baitulloh</p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {cards.map((card, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group bg-card rounded-3xl p-7 border border-border shadow-elegant hover-lift card-border-glow cursor-default"
            >
              <div className={`w-14 h-14 rounded-2xl ${card.gradient} flex items-center justify-center mb-5 shadow-sm group-hover:shadow-lg transition-shadow duration-300`}>
                <card.icon className={`w-7 h-7 ${card.iconColor}`} />
              </div>
              <h3 className="font-bold text-foreground text-xl mb-3 tracking-tight">{card.title}</h3>
              {card.highlight && (
                <p className="text-sm font-bold text-primary mb-2">{card.highlight}</p>
              )}
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{card.desc}</p>
              {card.action && (
                <motion.a
                  whileHover={{ x: 4 }}
                  href={card.action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-semibold btn-shine shadow-sm"
                >
                  <Phone className="w-4 h-4" /> {card.action.label}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                </motion.a>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

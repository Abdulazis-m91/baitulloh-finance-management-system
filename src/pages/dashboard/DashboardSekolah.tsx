import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Users, UserX, ArrowUpRight, Loader2 } from 'lucide-react';
import { useStudents, usePembayaran, usePengeluaran } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDate } from '@/lib/format';

export default function DashboardSekolah() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: pembayaran = [], isLoading: loadingPembayaran } = usePembayaran();
  const { data: pengeluaran = [], isLoading: loadingPengeluaran } = usePengeluaran();

  if (loadingStudents || loadingPembayaran || loadingPengeluaran) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pembayaranLunas = pembayaran.filter(p => p.metode === 'Lunas');
  const totalPemasukan = pembayaranLunas.reduce((acc, p) => acc + p.nominal, 0);
  const siswaMenunggak = students.filter(s => s.tunggakan_sekolah.length > 0);
  const totalTunggakan = siswaMenunggak.reduce((acc, s) => acc + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0);
  const siswaMembayar = new Set(pembayaranLunas.map(p => p.siswa_id)).size;
  const totalPengeluaran = pengeluaran.reduce((acc, p) => acc + p.nominal, 0);

  const stats = [
    { label: 'Total Pemasukan', sublabel: 'Bulan Ini', value: formatRupiah(totalPemasukan), icon: TrendingUp, gradient: 'gradient-primary', shadow: 'shadow-glow-primary', change: '+12%' },
    { label: 'Total Tunggakan', sublabel: 'Keseluruhan', value: formatRupiah(totalTunggakan), icon: AlertTriangle, gradient: 'gradient-danger', shadow: '', change: '-5%' },
    { label: 'Siswa Membayar', sublabel: 'Bulan Ini', value: siswaMembayar.toString(), icon: Users, gradient: 'gradient-gold', shadow: 'shadow-glow-gold', change: '+3' },
    { label: 'Siswa Menunggak', sublabel: 'Saat Ini', value: siswaMenunggak.length.toString(), icon: UserX, gradient: 'gradient-warning', shadow: '', change: '-2' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard Sekolah</h1>
        <p className="text-muted-foreground text-sm mt-1">Ringkasan keuangan sekolah periode Maret 2026</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="group bg-card rounded-3xl border border-border p-6 shadow-elegant hover-lift card-border-glow cursor-default relative overflow-hidden"
          >
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${stat.gradient} flex items-center justify-center ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {stat.change}
              </span>
            </div>
            <motion.p className="text-3xl font-extrabold text-foreground tracking-tight relative z-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
              {stat.value}
            </motion.p>
            <p className="text-xs text-muted-foreground mt-1 relative z-10">
              <span className="font-semibold text-foreground/70">{stat.label}</span> · {stat.sublabel}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent payments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-card rounded-3xl border border-border p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-foreground text-lg">Pembayaran Terbaru</h3>
            <motion.button whileHover={{ x: 4 }} className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
              Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="text-left py-3 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Nama</th>
                  <th className="text-left py-3 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Bulan</th>
                  <th className="text-right py-3 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {pembayaran.slice(0, 5).map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.05 }} className="border-b border-border/50 hover:bg-muted/50 transition-colors group">
                    <td className="py-3.5 text-muted-foreground">{formatDate(p.tanggal)}</td>
                    <td className="py-3.5 text-foreground font-semibold group-hover:text-primary transition-colors">{p.nama_siswa}</td>
                    <td className="py-3.5"><span className="px-2.5 py-1 rounded-full bg-primary/5 text-primary text-xs font-semibold">{p.bulan}</span></td>
                    <td className="py-3.5 text-right text-foreground font-bold">{formatRupiah(p.nominal)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-5">
          <div className="bg-card rounded-3xl border border-border p-6 shadow-elegant">
            <h3 className="font-bold text-foreground text-lg mb-5">Rekap Keuangan</h3>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-success/5 border border-success/10 hover-lift cursor-default">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pemasukan</p>
                </div>
                <p className="text-2xl font-extrabold text-success tracking-tight">{formatRupiah(totalPemasukan)}</p>
              </div>
              <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 hover-lift cursor-default">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pengeluaran</p>
                </div>
                <p className="text-2xl font-extrabold text-destructive tracking-tight">{formatRupiah(totalPengeluaran)}</p>
              </div>
              <div className="p-5 rounded-2xl gradient-card border border-primary/15 shadow-elegant hover-lift cursor-default">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Sisa Keuangan</p>
                </div>
                <p className="text-2xl font-extrabold text-primary tracking-tight">{formatRupiah(totalPemasukan - totalPengeluaran)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Users, UserX, ArrowRight } from 'lucide-react';
import { mockStudents, mockPembayaran, mockPengeluaran } from '@/data/mockData';
import { formatRupiah, formatDate } from '@/lib/format';

export default function DashboardSekolah() {
  const totalPemasukan = mockPembayaran.reduce((acc, p) => acc + p.nominal, 0);
  const siswaMenunggak = mockStudents.filter(s => s.tunggakanSekolah.length > 0);
  const totalTunggakan = siswaMenunggak.reduce((acc, s) => acc + s.tunggakanSekolah.length * s.biayaPerBulan, 0);
  const siswaMembayar = new Set(mockPembayaran.map(p => p.siswaId)).size;
  const totalPengeluaran = mockPengeluaran.reduce((acc, p) => acc + p.nominal, 0);

  const stats = [
    { label: 'Total Pemasukan Bulan Ini', value: formatRupiah(totalPemasukan), icon: TrendingUp, color: 'gradient-primary' },
    { label: 'Total Nilai Tunggakan', value: formatRupiah(totalTunggakan), icon: AlertTriangle, color: 'bg-destructive' },
    { label: 'Siswa Membayar (Bulan Ini)', value: siswaMembayar.toString(), icon: Users, color: 'gradient-gold' },
    { label: 'Siswa Menunggak', value: siswaMenunggak.length.toString(), icon: UserX, color: 'bg-warning' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Sekolah</h1>
        <p className="text-muted-foreground text-sm mt-1">Ringkasan keuangan sekolah bulan ini</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl border border-border p-5 shadow-elegant hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent payments */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-elegant">
          <h3 className="font-bold text-foreground mb-4">Rekap Pembayaran Terbaru</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-muted-foreground font-medium">Tanggal</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Nama</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Bulan</th>
                  <th className="text-right py-3 text-muted-foreground font-medium">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {mockPembayaran.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 text-foreground">{formatDate(p.tanggal)}</td>
                    <td className="py-3 text-foreground font-medium">{p.namaSiswa}</td>
                    <td className="py-3 text-muted-foreground">{p.bulan}</td>
                    <td className="py-3 text-right text-foreground font-medium">{formatRupiah(p.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
            <h3 className="font-bold text-foreground mb-4">Rekap Singkat</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                <p className="text-xs text-muted-foreground mb-1">Pemasukan Bulan Ini</p>
                <p className="text-xl font-bold text-success">{formatRupiah(totalPemasukan)}</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-xs text-muted-foreground mb-1">Pengeluaran Bulan Ini</p>
                <p className="text-xl font-bold text-destructive">{formatRupiah(totalPengeluaran)}</p>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Sisa Keuangan</p>
                <p className="text-xl font-bold text-primary">{formatRupiah(totalPemasukan - totalPengeluaran)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

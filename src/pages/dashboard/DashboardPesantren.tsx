import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Users, UserX, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSantri } from '@/hooks/useSupabaseSantri';
import { usePembayaranPesantren, usePengeluaranPesantren, KATEGORI_BIAYA, KategoriSantri } from '@/hooks/useSupabasePesantren';
import { formatRupiah, formatDate } from '@/lib/format';

const PAGE_SIZE = 5;

// Auto font size berdasarkan panjang teks
function autoFontSize(value: string): string {
  if (value.length >= 16) return 'text-lg';
  if (value.length >= 13) return 'text-xl';
  if (value.length >= 10) return 'text-2xl';
  return 'text-3xl';
}

export default function DashboardPesantren() {
  const { data: students = [], isLoading: l1 } = useSantri();
  const { data: pembayaran = [], isLoading: l2 } = usePembayaranPesantren();
  const { data: pengeluaran = [], isLoading: l3 } = usePengeluaranPesantren();
  const [page, setPage] = useState(1);

  if (l1 || l2 || l3) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const now = new Date();
  const bulanIni = now.getMonth();
  const tahunIni = now.getFullYear();

  // Pemasukan & santri membayar: filter by kolom "bulan" (bukan tanggal transaksi)
  // karena deposit yang diproses punya tanggal lama tapi bulan=bulan berjalan
  const bulanNamaList = ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'];
  const namabulanIni = bulanNamaList[bulanIni];

  const pembayaranLunas = pembayaran.filter(p => {
    if (p.metode !== 'Lunas') return false;
    // Filter by tanggal ATAU kolom bulan (sama dengan LaporanPesantren)
    const d = new Date(p.tanggal);
    if (d.getMonth() === bulanIni && d.getFullYear() === tahunIni) return true;
    const bulanParts = p.bulan.split('-');
    const namaBulanP = bulanParts[0];
    const tahunP = bulanParts.length > 1 ? parseInt(bulanParts[1]) : tahunIni;
    return namaBulanP === namabulanIni && tahunP === tahunIni;
  });
  const totalPemasukan = pembayaranLunas.reduce((acc, p) => acc + p.nominal, 0);
  const santriMenunggak = students.filter(s => s.tunggakan_pesantren.length > 0);
  const totalTunggakan = santriMenunggak.reduce((acc, s) => {
    const kat = (s.kategori as KategoriSantri) || 'REGULER';
    const biaya = KATEGORI_BIAYA[kat]?.total || 450000;
    return acc + s.tunggakan_pesantren.length * biaya;
  }, 0);
  const santriMembayar = new Set(pembayaranLunas.map(p => p.siswa_id)).size;
  // Pengeluaran: HANYA bulan ini
  const totalPengeluaran = pengeluaran.filter(p => {
    const d = new Date(p.tanggal);
    return d.getMonth() === bulanIni && d.getFullYear() === tahunIni;
  }).reduce((acc, p) => acc + p.nominal, 0);

  const stats = [
    { label: 'Pemasukan Pesantren', sublabel: `${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'][bulanIni]} ${tahunIni}`, value: formatRupiah(totalPemasukan), icon: TrendingUp, gradient: 'gradient-primary', shadow: 'shadow-glow-primary' },
    { label: 'Total Tunggakan', sublabel: 'Semua Periode', value: formatRupiah(totalTunggakan), icon: AlertTriangle, gradient: 'gradient-danger', shadow: '' },
    { label: 'Santri Membayar', sublabel: `${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'][bulanIni]} ${tahunIni}`, value: santriMembayar.toString(), icon: Users, gradient: 'gradient-gold', shadow: 'shadow-glow-gold' },
    { label: 'Santri Menunggak', sublabel: 'Saat Ini', value: santriMenunggak.length.toString(), icon: UserX, gradient: 'gradient-warning', shadow: '' },
  ];

  // Hanya 5 terbaru per halaman
  // Pembayaran Terbaru: filter by tanggal ATAU kolom bulan = bulan ini
  const sorted = [...pembayaran].filter(p => {
    if (p.metode === 'Deposit') return false; // Deposit tidak masuk pembayaran terbaru
    const d = new Date(p.tanggal);
    if (d.getMonth() === bulanIni && d.getFullYear() === tahunIni) return true;
    const parts = p.bulan.split('-');
    return parts[0] === namabulanIni && (parts.length > 1 ? parseInt(parts[1]) : tahunIni) === tahunIni;
  }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pagedPembayaran = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard Pesantren</h1>
        <p className="text-muted-foreground text-sm mt-1">Ringkasan keuangan pesantren</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div key={stat.label}
            initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="group bg-card rounded-3xl border border-border p-6 shadow-elegant hover-lift card-border-glow cursor-default relative overflow-hidden">
            <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${stat.gradient} flex items-center justify-center ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            {/* Auto font size agar tidak terpotong */}
            <motion.p
              className={`${autoFontSize(stat.value)} font-extrabold text-foreground tracking-tight relative z-10 leading-tight`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}>
              {stat.value}
            </motion.p>
            <p className="text-xs text-muted-foreground mt-1.5 relative z-10 leading-tight">
              <span className="font-semibold text-foreground/70">{stat.label}</span>
              <br /><span className="opacity-70">{stat.sublabel}</span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabel Pembayaran Terbaru - 5 per halaman */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <h3 className="font-bold text-foreground text-lg">Pembayaran Terbaru</h3>
            <span className="text-xs text-muted-foreground">{sorted.length} transaksi</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Nama</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Kategori</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Bulan</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {pagedPembayaran.map((p, i) => (
                  <motion.tr key={p.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">{formatDate(p.tanggal)}</td>
                    <td className="py-3.5 px-4 text-foreground font-semibold">{p.nama_siswa}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent-foreground text-xs font-semibold whitespace-nowrap">
                        {p.kategori}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-semibold">
                        {p.bulan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-foreground font-bold whitespace-nowrap">
                      {formatRupiah(p.nominal)}
                    </td>
                  </motion.tr>
                ))}
                {pagedPembayaran.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-muted-foreground">Belum ada data pembayaran</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer dengan pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Halaman <span className="font-bold text-foreground">{page}</span> dari <span className="font-bold text-foreground">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Rekap Keuangan */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="space-y-5">
          <div className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <h3 className="font-bold text-foreground text-lg">Rekap Keuangan</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-5 rounded-2xl bg-success/5 border border-success/10 hover-lift cursor-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pemasukan {bulanIni+1}/{tahunIni}</p>
                </div>
                <p className={`${autoFontSize(formatRupiah(totalPemasukan))} font-extrabold text-success tracking-tight leading-tight`}>
                  {formatRupiah(totalPemasukan)}
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 hover-lift cursor-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Pengeluaran Pesantren</p>
                </div>
                <p className={`${autoFontSize(formatRupiah(totalPengeluaran))} font-extrabold text-destructive tracking-tight leading-tight`}>
                  {formatRupiah(totalPengeluaran)}
                </p>
              </div>
              <div className="p-5 rounded-2xl gradient-card border border-primary/15 shadow-elegant hover-lift cursor-default">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Sisa Keuangan</p>
                </div>
                <p className={`${autoFontSize(formatRupiah(totalPemasukan - totalPengeluaran))} font-extrabold text-primary tracking-tight leading-tight`}>
                  {formatRupiah(totalPemasukan - totalPengeluaran)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
 
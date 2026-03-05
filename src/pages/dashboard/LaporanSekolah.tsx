import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, TrendingDown, Wallet, AlertTriangle, Loader2, Info, Users } from 'lucide-react';
import { useStudents, usePembayaran, usePengeluaran } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'SMP' | 'SMA' | 'Total';

const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function LaporanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');
  const { data: students = [], isLoading: l1 } = useStudents();
  const { data: pembayaranAll = [], isLoading: l2 } = usePembayaran();
  const { data: pengeluaranAll = [], isLoading: l3 } = usePengeluaran();

  if (l1 || l2 || l3) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const now = new Date();
  const bulanIni = bulanNama[now.getMonth()];
  const tahunIni = now.getFullYear();
  const bulanTahun = `${bulanIni.toUpperCase()} - ${tahunIni}`;

  const getData = (jenjang: 'SMP' | 'SMA') => {
    const pembayaran = pembayaranAll.filter(p => p.jenjang === jenjang);
    const pengeluaran = pengeluaranAll.filter(e => e.sumber_dana === jenjang);
    const siswaMenunggak = students.filter(s => s.jenjang === jenjang && s.tunggakan_sekolah.length > 0);
    const totalPemasukan = pembayaran.reduce((a, p) => a + p.nominal, 0);
    const totalPengeluaran = pengeluaran.reduce((a, e) => a + e.nominal, 0);
    const totalTunggakan = siswaMenunggak.reduce((a, s) => a + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0);
    return { totalPemasukan, totalPengeluaran, totalTunggakan, jumlahMembayar: new Set(pembayaran.map(p => p.siswa_id)).size, jumlahMenunggak: siswaMenunggak.length };
  };

  const smp = getData('SMP');
  const sma = getData('SMA');

  const exportExcel = () => {
    if (activeTab === 'Total') {
      const totalPendapatan = smp.totalPemasukan + sma.totalPemasukan;
      const totalPengeluaran = smp.totalPengeluaran + sma.totalPengeluaran;
      const rows = [
        { Kategori: 'Total Pendapatan SMP', Nominal: smp.totalPemasukan },
        { Kategori: 'Total Pendapatan SMA', Nominal: sma.totalPemasukan },
        { Kategori: 'TOTAL PENDAPATAN', Nominal: totalPendapatan },
        { Kategori: '', Nominal: '' },
        { Kategori: 'Total Pengeluaran SMP', Nominal: smp.totalPengeluaran },
        { Kategori: 'Total Pengeluaran SMA', Nominal: sma.totalPengeluaran },
        { Kategori: 'TOTAL PENGELUARAN', Nominal: totalPengeluaran },
        { Kategori: '', Nominal: '' },
        { Kategori: `SISA KEUANGAN (${bulanTahun})`, Nominal: totalPendapatan - totalPengeluaran },
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Total');
      XLSX.writeFile(wb, 'laporan_total.xlsx');
    } else {
      const d = getData(activeTab);
      const rows = [
        { Kategori: 'Pemasukan', Detail: `${d.jumlahMembayar} siswa`, Nominal: d.totalPemasukan },
        { Kategori: 'Pengeluaran', Detail: 'Periode bulan ini', Nominal: d.totalPengeluaran },
        { Kategori: 'Sisa Keuangan', Detail: '', Nominal: d.totalPemasukan - d.totalPengeluaran },
        { Kategori: '', Detail: '', Nominal: '' },
        { Kategori: 'Tunggakan', Detail: `${d.jumlahMenunggak} siswa`, Nominal: d.totalTunggakan },
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Laporan ${activeTab}`);
      XLSX.writeFile(wb, `laporan_${activeTab.toLowerCase()}.xlsx`);
    }
    toast.success('Laporan berhasil diekspor');
  };

  const renderJenjangTab = (jenjang: 'SMP' | 'SMA') => {
    const d = getData(jenjang);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-4 h-4 text-primary-foreground" /></div>
              Laporan Keuangan {jenjang}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Periode: 1 sd akhir {bulanIni} {tahunIni}</p>
          </div>
          <div className="divide-y divide-border">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="p-6 flex items-center justify-between bg-success/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success-foreground" /></div>
                <div><p className="font-bold text-foreground">Pemasukan</p><p className="text-xs text-muted-foreground">{d.jumlahMembayar} siswa membayar</p></div>
              </div>
              <p className="text-xl font-extrabold text-success">{formatRupiah(d.totalPemasukan)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="p-6 flex items-center justify-between bg-destructive/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive-foreground" /></div>
                <div><p className="font-bold text-foreground">Pengeluaran</p><p className="text-xs text-muted-foreground">Periode bulan ini</p></div>
              </div>
              <p className="text-xl font-extrabold text-destructive">{formatRupiah(d.totalPengeluaran)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="p-6 flex items-center justify-between gradient-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold"><Wallet className="w-5 h-5 text-foreground" /></div>
                <div><p className="font-extrabold text-foreground">Sisa Keuangan</p></div>
              </div>
              <p className="text-2xl font-extrabold text-primary">{formatRupiah(d.totalPemasukan - d.totalPengeluaran)}</p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning-foreground" /></div>
              Laporan Tunggakan {jenjang}
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-center p-8 rounded-2xl bg-destructive/5 border border-destructive/10">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Jumlah Siswa Menunggak</p>
              <p className="text-5xl font-extrabold text-destructive mb-1">{d.jumlahMenunggak}</p>
              <p className="text-sm text-muted-foreground">siswa</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }} className="text-center p-8 rounded-2xl gradient-card border border-destructive/10">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Total Nominal Tunggakan</p>
              <p className="text-3xl font-extrabold text-destructive">{formatRupiah(d.totalTunggakan)}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderTotalTab = () => {
    const totalPendapatan = smp.totalPemasukan + sma.totalPemasukan;
    const totalPengeluaranAll = smp.totalPengeluaran + sma.totalPengeluaran;
    const sisaKeuangan = totalPendapatan - totalPengeluaranAll;

    const totalTunggakanAll = smp.totalTunggakan + sma.totalTunggakan;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jendela Laporan Total Keuangan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-4 h-4 text-primary-foreground" /></div>
                Laporan Total Keuangan
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Periode: {bulanIni} {tahunIni}</p>
            </div>
            <div className="divide-y divide-border">
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="p-6 bg-success/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL PENDAPATAN</p>
                  </div>
                  <p className="text-2xl font-extrabold text-success">{formatRupiah(totalPendapatan)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  <p className="text-xs text-muted-foreground">Total Pendapatan SMP : <span className="font-semibold text-foreground">{formatRupiah(smp.totalPemasukan)}</span></p>
                  <p className="text-xs text-muted-foreground">Total Pendapatan SMA : <span className="font-semibold text-foreground">{formatRupiah(sma.totalPemasukan)}</span></p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="p-6 bg-destructive/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL PENGELUARAN</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(totalPengeluaranAll)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  <p className="text-xs text-muted-foreground">Total Pengeluaran SMP : <span className="font-semibold text-foreground">{formatRupiah(smp.totalPengeluaran)}</span></p>
                  <p className="text-xs text-muted-foreground">Total Pengeluaran SMA : <span className="font-semibold text-foreground">{formatRupiah(sma.totalPengeluaran)}</span></p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="p-6 gradient-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold"><Wallet className="w-5 h-5 text-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">SISA KEUANGAN SEKOLAH ({bulanTahun})</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary">{formatRupiah(sisaKeuangan)}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Jendela Total Tunggakan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning-foreground" /></div>
                TOTAL TUNGGAKAN
              </h3>
            </div>
            <div className="divide-y divide-border">
              {/* Tunggakan SMP */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Users className="w-5 h-5 text-destructive" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL TUNGGAKAN SMP</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(smp.totalTunggakan)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  <p className="text-xs text-muted-foreground">Semua Kelas Jenjang SMP</p>
                  <p className="text-xs text-muted-foreground">Jumlah Siswa Menunggak : <span className="font-semibold text-foreground">{smp.jumlahMenunggak} siswa</span></p>
                </div>
              </motion.div>

              {/* Tunggakan SMA */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Users className="w-5 h-5 text-destructive" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL TUNGGAKAN SMA</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(sma.totalTunggakan)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  <p className="text-xs text-muted-foreground">Semua Kelas Jenjang SMA</p>
                  <p className="text-xs text-muted-foreground">Jumlah Siswa Menunggak : <span className="font-semibold text-foreground">{sma.jumlahMenunggak} siswa</span></p>
                </div>
              </motion.div>

              {/* Total Keseluruhan */}
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="p-6 gradient-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-destructive-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL TUNGGAKAN SISWA ({bulanTahun})</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary">{formatRupiah(totalTunggakanAll)}</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Info Box */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>Ini adalah sisa keuangan sekolah <span className="font-bold text-foreground">{bulanIni} {tahunIni}</span> saat ini.</p>
              <p>Silahkan dicetak dan diarsipkan.</p>
              <p>Sisa keuangan sekolah bisa dimasukan secara manual di halaman <span className="font-bold text-foreground">Pendapatan SMP/SMA</span>.</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Laporan Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">Laporan keuangan periode {bulanIni} {tahunIni}</p>
        </motion.div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
          <Download className="w-4 h-4" /> Export Excel
        </motion.button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit flex-wrap">
        {(['SMP', 'SMA', 'Total'] as Tab[]).map(tab => (
          <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'Total' ? 'Laporan Total' : `Laporan ${tab}`}
          </motion.button>
        ))}
      </motion.div>

      {activeTab === 'Total' ? renderTotalTab() : renderJenjangTab(activeTab)}
    </div>
  );
}

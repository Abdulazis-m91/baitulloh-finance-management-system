import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';
import { mockStudents, mockPembayaran, mockPengeluaran } from '@/data/mockData';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'SMP' | 'SMA';

export default function LaporanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');

  const getData = (jenjang: Tab) => {
    const pembayaran = mockPembayaran.filter(p => p.jenjang === jenjang);
    const pengeluaran = mockPengeluaran.filter(e => e.sumberDana === jenjang);
    const siswaMenunggak = mockStudents.filter(s => s.jenjang === jenjang && s.tunggakanSekolah.length > 0);
    const totalPemasukan = pembayaran.reduce((a, p) => a + p.nominal, 0);
    const totalPengeluaran = pengeluaran.reduce((a, e) => a + e.nominal, 0);
    const totalTunggakan = siswaMenunggak.reduce((a, s) => a + s.tunggakanSekolah.length * s.biayaPerBulan, 0);
    return { totalPemasukan, totalPengeluaran, totalTunggakan, jumlahMembayar: new Set(pembayaran.map(p => p.siswaId)).size, jumlahMenunggak: siswaMenunggak.length };
  };

  const d = getData(activeTab);

  const exportExcel = () => {
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
    toast.success('Laporan berhasil diekspor');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Laporan Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">Laporan keuangan periode Maret 2026</p>
        </motion.div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
          <Download className="w-4 h-4" /> Export Excel
        </motion.button>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit">
        {(['SMP', 'SMA'] as Tab[]).map(tab => (
          <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            Laporan {tab}
          </motion.button>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Report */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-4 h-4 text-primary-foreground" /></div>
              Laporan Keuangan {activeTab}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Periode: 1 sd akhir Maret 2026</p>
          </div>
          <div className="divide-y divide-border">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="p-6 flex items-center justify-between bg-success/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success-foreground" /></div>
                <div>
                  <p className="font-bold text-foreground">Pemasukan</p>
                  <p className="text-xs text-muted-foreground">{d.jumlahMembayar} siswa membayar</p>
                </div>
              </div>
              <p className="text-xl font-extrabold text-success">{formatRupiah(d.totalPemasukan)}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="p-6 flex items-center justify-between bg-destructive/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive-foreground" /></div>
                <div>
                  <p className="font-bold text-foreground">Pengeluaran</p>
                  <p className="text-xs text-muted-foreground">Periode bulan ini</p>
                </div>
              </div>
              <p className="text-xl font-extrabold text-destructive">{formatRupiah(d.totalPengeluaran)}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="p-6 flex items-center justify-between gradient-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold"><Wallet className="w-5 h-5 text-foreground" /></div>
                <div>
                  <p className="font-extrabold text-foreground">Sisa Keuangan</p>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-primary">{formatRupiah(d.totalPemasukan - d.totalPengeluaran)}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Tunggakan Report */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning-foreground" /></div>
              Laporan Tunggakan {activeTab}
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
    </div>
  );
}

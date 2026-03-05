import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { mockPembayaran, mockStudents } from '@/data/mockData';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'SMP' | 'SMA' | 'Cicil' | 'Deposit';

export default function PendapatanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');
  const [filterKelas, setFilterKelas] = useState('');
  const tabs: Tab[] = ['SMP', 'SMA', 'Cicil', 'Deposit'];

  const filteredData = () => {
    if (activeTab === 'SMP' || activeTab === 'SMA') {
      return mockPembayaran.filter(p => p.jenjang === activeTab && (!filterKelas || p.kelas === filterKelas) && p.metode !== 'Deposit');
    }
    if (activeTab === 'Cicil') {
      return mockStudents.filter(s => s.cicilan.length > 0).flatMap(s =>
        s.cicilan.map(c => ({ ...c, namaSiswa: s.namaLengkap, jenjang: s.jenjang, kelas: s.kelas }))
      );
    }
    if (activeTab === 'Deposit') {
      return mockStudents.filter(s => s.deposit > 0).map(s => ({
        id: s.id, namaSiswa: s.namaLengkap, deposit: s.deposit, jenjang: s.jenjang, kelas: s.kelas
      }));
    }
    return [];
  };

  const kelasOpts = activeTab === 'SMP' ? ['7A','7B','8A','8B','9A','9B'] : ['10A','10B','11A','11B','12A','12B'];

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData() as any[]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `pendapatan_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pendapatan Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">Riwayat pendapatan dari pembayaran siswa</p>
        </motion.div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
          <Download className="w-4 h-4" /> Export Excel
        </motion.button>
      </div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit">
        {tabs.map(tab => (
          <motion.button
            key={tab}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveTab(tab); setFilterKelas(''); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </motion.button>
        ))}
      </motion.div>

      {(activeTab === 'SMP' || activeTab === 'SMA') && (
        <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
          <option value="">Semua Kelas</option>
          {kelasOpts.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {(activeTab === 'SMP' || activeTab === 'SMA') && ['Tanggal', 'Nama', 'Bulan', 'Nominal', 'Petugas'].map(h => (
                  <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${h === 'Nominal' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
                {activeTab === 'Cicil' && ['Nama', 'Bulan', 'Nominal', 'Tanggal'].map(h => (
                  <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${h === 'Nominal' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
                {activeTab === 'Deposit' && ['Nama', 'Jenjang', 'Kelas', 'Deposit'].map(h => (
                  <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${h === 'Deposit' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'SMP' || activeTab === 'SMA') && (filteredData() as any[]).map((p: any, i: number) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(p.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{p.namaSiswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{p.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(p.nominal)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{p.petugas}</td>
                </motion.tr>
              ))}
              {activeTab === 'Cicil' && (filteredData() as any[]).map((c: any, i: number) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-foreground font-semibold">{c.namaSiswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-warning/10 text-warning text-xs font-bold">{c.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(c.nominal)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(c.tanggal)}</td>
                </motion.tr>
              ))}
              {activeTab === 'Deposit' && (filteredData() as any[]).map((d: any, i: number) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-foreground font-semibold">{d.namaSiswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">{d.jenjang}</span></td>
                  <td className="py-4 px-4 text-foreground">{d.kelas}</td>
                  <td className="py-4 px-4 text-right text-success font-bold">{formatRupiah(d.deposit)}</td>
                </motion.tr>
              ))}
              {filteredData().length === 0 && (
                <tr><td colSpan={5} className="py-16 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3"><Download className="w-8 h-8 text-muted-foreground/30" /></div>
                  Tidak ada data
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePembayaran, useStudents, useCicilan } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'SMP' | 'SMA' | 'Cicil' | 'Deposit';
const PAGE_SIZE = 15;

export default function PendapatanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');
  const [filterKelas, setFilterKelas] = useState('');
  const [page, setPage] = useState(1);
  const tabs: Tab[] = ['SMP', 'SMA', 'Cicil', 'Deposit'];

  const { data: pembayaran = [], isLoading: l1 } = usePembayaran();
  const { data: students = [], isLoading: l2 } = useStudents();
  const { data: cicilan = [], isLoading: l3 } = useCicilan();

  if (l1 || l2 || l3) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  // All data (unfiltered by page) for totals
  const allData = (): any[] => {
    if (activeTab === 'SMP' || activeTab === 'SMA') {
      return pembayaran.filter(p => p.jenjang === activeTab && (!filterKelas || p.kelas === filterKelas) && p.metode !== 'Deposit');
    }
    if (activeTab === 'Cicil') {
      return cicilan.map(c => ({
        ...c,
        namaSiswa: studentMap[c.siswa_id]?.nama_lengkap || '',
        jenjang: studentMap[c.siswa_id]?.jenjang || '-',
        kelas: studentMap[c.siswa_id]?.kelas || '-',
      }));
    }
    if (activeTab === 'Deposit') {
      return pembayaran.filter(p => p.metode === 'Deposit' && (!filterKelas || p.kelas === filterKelas));
    }
    return [];
  };

  const data = allData();
  const totalNominal = data.reduce((sum, d) => sum + (d.nominal || d.deposit || 0), 0);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pagedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const today = new Date();
  const todayStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const monthStr = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const kelasOpts = activeTab === 'SMP' ? ['7A','7B','8A','8B','9A','9B'] : activeTab === 'SMA' ? ['10A','10B','11A','11B','12A','12B'] : [];

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `pendapatan_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  const headers = {
    'SMP': ['No', 'Tanggal Bayar', 'Nama', 'Jenjang', 'Kelas', 'Pembayaran Bulan', 'Nominal', 'Petugas'],
    'SMA': ['No', 'Tanggal Bayar', 'Nama', 'Jenjang', 'Kelas', 'Pembayaran Bulan', 'Nominal', 'Petugas'],
    'Cicil': ['No', 'Tanggal Bayar', 'Nama', 'Jenjang', 'Kelas', 'Cicilan Untuk Bulan', 'Nominal Cicilan'],
    'Deposit': ['No', 'Tanggal Bayar', 'Nama', 'Jenjang', 'Kelas', 'Deposit Untuk Bulan', 'Nominal Deposit'],
  };

  const colCount = headers[activeTab].length;

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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit">
        {tabs.map(tab => (
          <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setActiveTab(tab); setFilterKelas(''); setPage(1); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'Cicil' ? 'Cicilan' : tab}
          </motion.button>
        ))}
      </motion.div>

      {(activeTab === 'SMP' || activeTab === 'SMA') && (
        <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }} className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
          <option value="">Semua Kelas</option>
          {kelasOpts.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      )}

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {headers[activeTab].map(h => (
                  <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${h.startsWith('Nominal') || h.startsWith('Deposit') ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 && (
                <tr><td colSpan={colCount} className="py-16 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3"><Download className="w-8 h-8 text-muted-foreground/30" /></div>
                  Tidak ada data
                </td></tr>
              )}

              {/* SMP / SMA rows */}
              {(activeTab === 'SMP' || activeTab === 'SMA') && pagedData.map((p: any, i: number) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(p.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{p.nama_siswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{p.jenjang}</span></td>
                  <td className="py-4 px-4 text-foreground">{p.kelas}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-bold">{p.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(p.nominal)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{p.petugas}</td>
                </motion.tr>
              ))}

              {/* Cicilan rows */}
              {activeTab === 'Cicil' && pagedData.map((c: any, i: number) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(c.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{c.namaSiswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{c.jenjang}</span></td>
                  <td className="py-4 px-4 text-foreground">{c.kelas}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-warning/10 text-warning text-xs font-bold">{c.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(c.nominal)}</td>
                </motion.tr>
              ))}

              {/* Deposit rows */}
              {activeTab === 'Deposit' && pagedData.map((d: any, i: number) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(d.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{d.nama_siswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{d.jenjang}</span></td>
                  <td className="py-4 px-4 text-foreground">{d.kelas}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-bold">{d.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-success font-bold">{formatRupiah(d.nominal)}</td>
                </motion.tr>
              ))}
            </tbody>
            {/* Footer total - always shows full total regardless of page */}
            <tfoot>
              <tr className="bg-muted/50 border-t-2 border-border">
                <td colSpan={2} className="py-4 px-4 font-bold text-foreground text-sm">TOTAL</td>
                <td className="py-4 px-4 text-muted-foreground text-xs">{todayStr}</td>
                <td className="py-4 px-4 text-muted-foreground text-xs">{monthStr}</td>
                <td colSpan={colCount - 5} className="py-4 px-4"></td>
                <td className="py-4 px-4 text-right font-extrabold text-primary text-base">{formatRupiah(totalNominal)}</td>
              </tr>
              <tr className="bg-muted/30">
                <td colSpan={colCount} className="py-2 px-4 text-xs text-muted-foreground text-center">
                  Total dari {data.length} transaksi
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

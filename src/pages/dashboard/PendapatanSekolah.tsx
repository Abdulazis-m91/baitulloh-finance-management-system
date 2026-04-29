import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, ChevronLeft, ChevronRight, Trash2, AlertTriangle, X } from 'lucide-react';
import { usePembayaran, useStudents, useCicilan, useDeletePembayaran, type PembayaranDB } from '@/hooks/useSupabaseData';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'SMP' | 'SMA' | 'Cicil' | 'Deposit';
const PAGE_SIZE = 15;

const modalOverlay = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4";
const modalSpring = { type: 'spring' as const, stiffness: 300, damping: 25 };

export default function PendapatanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');
  const [filterKelas, setFilterKelas] = useState('');
  const [page, setPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<PembayaranDB | null>(null);

  const tabs: Tab[] = ['SMP', 'SMA', 'Cicil', 'Deposit'];

  const { data: pembayaran = [], isLoading: l1 } = usePembayaran();
  const { data: students = [], isLoading: l2 } = useStudents();
  const { data: cicilan = [], isLoading: l3 } = useCicilan();
  const deletePembayaran = useDeletePembayaran();

  if (l1 || l2 || l3) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  const allData = (): any[] => {
    if (activeTab === 'SMP' || activeTab === 'SMA') {
      return pembayaran.filter(p =>
        p.jenjang === activeTab &&
        (!filterKelas || p.kelas === filterKelas) &&
        p.metode !== 'Deposit'
      );
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

  const kelasOpts = activeTab === 'SMP'
    ? ['7A','7B','8A','8B','9A','9B']
    : activeTab === 'SMA'
    ? ['10A','10B','11A','11B','12A','12B']
    : [];

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `pendapatan_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) return;
    deletePembayaran.mutate(showDeleteConfirm, {
      onSuccess: () => setShowDeleteConfirm(null),
    });
  };

  // Header kolom — SMP/SMA tambah kolom Aksi
  const headers = {
    'SMP': ['No', 'Tanggal Bayar', 'Nama', 'Jenjang', 'Kelas', 'Pembayaran Bulan', 'Nominal', 'Petugas', 'Aksi'],
    'SMA': ['No', 'Tanggal Bayar', 'Nama', 'Jenjang', 'Kelas', 'Pembayaran Bulan', 'Nominal', 'Petugas', 'Aksi'],
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
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportExcel}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
          <Download className="w-4 h-4" /> Export Excel
        </motion.button>
      </div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit">
        {tabs.map(tab => (
          <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveTab(tab); setFilterKelas(''); setPage(1); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'Cicil' ? 'Cicilan' : tab}
          </motion.button>
        ))}
      </motion.div>

      {/* Filter Kelas */}
      {(activeTab === 'SMP' || activeTab === 'SMA') && (
        <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }}
          className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
          <option value="">Semua Kelas</option>
          {kelasOpts.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      )}

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {headers[activeTab].map(h => (
                  <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${
                    h.startsWith('Nominal') || h.startsWith('Deposit') ? 'text-right' :
                    h === 'Aksi' ? 'text-center' : 'text-left'
                  }`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 && (
                <tr><td colSpan={colCount} className="py-16 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Download className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  Tidak ada data
                </td></tr>
              )}

              {/* ── SMP / SMA rows ── */}
              {(activeTab === 'SMP' || activeTab === 'SMA') && pagedData.map((p: any, i: number) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors group">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(p.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{p.nama_siswa}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{p.jenjang}</span>
                  </td>
                  <td className="py-4 px-4 text-foreground">{p.kelas}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-bold">{p.bulan}</span>
                  </td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(p.nominal)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{p.petugas}</td>
                  {/* ── Tombol Hapus ── */}
                  <td className="py-4 px-4 text-center">
                    <motion.button
                      whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setShowDeleteConfirm(p)}
                      className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                      title="Hapus pembayaran (tunggakan siswa akan dipulihkan)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}

              {/* ── Cicilan rows ── */}
              {activeTab === 'Cicil' && pagedData.map((c: any, i: number) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(c.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{c.namaSiswa}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{c.jenjang}</span>
                  </td>
                  <td className="py-4 px-4 text-foreground">{c.kelas}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-warning/10 text-warning text-xs font-bold">{c.bulan}</span>
                  </td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(c.nominal)}</td>
                </motion.tr>
              ))}

              {/* ── Deposit rows ── */}
              {activeTab === 'Deposit' && pagedData.map((d: any, i: number) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(d.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{d.nama_siswa}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{d.jenjang}</span>
                  </td>
                  <td className="py-4 px-4 text-foreground">{d.kelas}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-bold">{d.bulan}</span>
                  </td>
                  <td className="py-4 px-4 text-right text-success font-bold">{formatRupiah(d.nominal)}</td>
                </motion.tr>
              ))}
            </tbody>

            {/* Footer total */}
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
        )}
      </motion.div>

      {/* ── DELETE CONFIRMATION POPUP ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={modalSpring} className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center"
              onClick={e => e.stopPropagation()}>

              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                onClick={() => setShowDeleteConfirm(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted">
                <X className="w-4 h-4" />
              </motion.button>

              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Hapus Pembayaran?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Pembayaran <span className="font-bold text-foreground">{showDeleteConfirm.nama_siswa}</span> untuk bulan{' '}
                <span className="font-bold text-destructive">{showDeleteConfirm.bulan}</span> akan dihapus.
              </p>

              {/* Peringatan rollback */}
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-5">
                <p className="text-xs text-warning font-semibold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Perhatian
                </p>
                <p className="text-xs text-muted-foreground">
                  Status siswa akan berubah kembali menjadi <span className="font-bold text-destructive">menunggak</span> untuk bulan {showDeleteConfirm.bulan}.
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80 transition-colors">
                  Batal
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={deletePembayaran.isPending}
                  className="flex-1 py-3 rounded-xl gradient-danger text-destructive-foreground font-bold text-sm btn-shine disabled:opacity-50">
                  {deletePembayaran.isPending ? 'Menghapus...' : 'Ya, Hapus'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

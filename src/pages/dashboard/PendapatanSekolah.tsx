import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, ChevronLeft, ChevronRight, Trash2, AlertTriangle, X, Plus, Search } from 'lucide-react';
import { usePembayaran, useStudents, useCicilan, useInsertPembayaran, useDeletePembayaran, type PembayaranDB } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// Tab sekarang termasuk Khusus
type Tab = 'SMP' | 'SMA' | 'Khusus' | 'Cicil' | 'Deposit';
const PAGE_SIZE = 15;

const modalOverlay = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4";
const modalSpring = { type: 'spring' as const, stiffness: 300, damping: 25 };

type TambahForm = {
  keterangan: string;
  nominal: string;
};

const emptyTambahForm: TambahForm = { keterangan: '', nominal: '' };

// Helper: cek apakah pembayaran dari siswa "Khusus"
const isKhususPembayaran = (p: any, studentMap: Record<string, any>) => {
  const siswa = studentMap[p.siswa_id];
  return siswa?.kategori === 'Khusus';
};

export default function PendapatanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');
  const [filterKelas, setFilterKelas] = useState('');
  const [searchNama, setSearchNama] = useState('');
  const [page, setPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<PembayaranDB | null>(null);
  const [showTambahForm, setShowTambahForm] = useState(false);
  const [tambahForm, setTambahForm] = useState<TambahForm>(emptyTambahForm);

  const tabs: Tab[] = ['SMP', 'SMA', 'Khusus', 'Cicil', 'Deposit'];

  const { data: pembayaran = [], isLoading: l1 } = usePembayaran();
  const { data: students = [], isLoading: l2 } = useStudents();
  const { data: cicilan = [], isLoading: l3 } = useCicilan();
  const deletePembayaran = useDeletePembayaran();
  const insertPembayaran = useInsertPembayaran();
  const { userName } = useAuth();

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
        p.metode !== 'Deposit' &&
        !isKhususPembayaran(p, studentMap) // exclude Khusus dari SMP/SMA
      );
    }
    if (activeTab === 'Khusus') {
      // Tampilkan pembayaran dari siswa berkategori Khusus
      return pembayaran.filter(p =>
        isKhususPembayaran(p, studentMap) &&
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

  // Apply search filter
  const data = allData().filter(p => {
    if (!searchNama) return true;
    const nama = p.nama_siswa || p.namaSiswa || '';
    return nama.toLowerCase().includes(searchNama.toLowerCase());
  });

  const totalNominal = data.reduce((sum, d) => sum + (d.nominal || 0), 0);
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

  const handleTambahPendapatan = () => {
    const nominal = parseInt(tambahForm.nominal);
    if (!tambahForm.keterangan.trim()) { toast.error('Keterangan wajib diisi'); return; }
    if (!nominal || nominal <= 0) { toast.error('Nominal harus lebih dari 0'); return; }

    const tanggal = new Date().toISOString().split('T')[0];
    insertPembayaran.mutate({
      siswa_id: null,
      nama_siswa: tambahForm.keterangan.trim(),
      nisn: '-',
      jenjang: activeTab === 'SMA' ? 'SMA' : 'SMP',
      kelas: '-',
      bulan: 'Pendapatan Lainnya',
      nominal,
      metode: 'Lunas',
      tanggal,
      petugas: userName || 'Petugas',
    }, {
      onSuccess: () => {
        setShowTambahForm(false);
        setTambahForm(emptyTambahForm);
        toast.success('Pendapatan lainnya berhasil ditambahkan');
      },
    });
  };

  const headers: Record<Tab, string[]> = {
    'SMP':    ['No', 'Tanggal Bayar', 'Nama / Keterangan', 'Jenjang', 'Kelas', 'Pembayaran Bulan', 'Nominal', 'Petugas', 'Aksi'],
    'SMA':    ['No', 'Tanggal Bayar', 'Nama / Keterangan', 'Jenjang', 'Kelas', 'Pembayaran Bulan', 'Nominal', 'Petugas', 'Aksi'],
    'Khusus': ['No', 'Tanggal Bayar', 'Nama Siswa', 'Kelas', 'Pembayaran Bulan', 'Nominal', 'Petugas', 'Aksi'],
    'Cicil':  ['No', 'Tanggal Bayar', 'Nama', 'Jenjang', 'Kelas', 'Cicilan Untuk Bulan', 'Nominal Cicilan'],
    'Deposit':['No', 'Tanggal Bayar', 'Nama', 'Jenjang', 'Kelas', 'Deposit Untuk Bulan', 'Nominal Deposit'],
  };

  const colCount = headers[activeTab].length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pendapatan Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">Riwayat pendapatan dari pembayaran siswa</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 flex-wrap">
          {(activeTab === 'SMP' || activeTab === 'SMA') && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setShowTambahForm(true); setTambahForm(emptyTambahForm); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine shadow-glow-primary">
              <Plus className="w-4 h-4" /> Tambah Pendapatan
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportExcel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
            <Download className="w-4 h-4" /> Export Excel
          </motion.button>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit flex-wrap">
        {tabs.map(tab => (
          <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveTab(tab); setFilterKelas(''); setSearchNama(''); setPage(1); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'Cicil' ? 'Cicilan' : tab}
          </motion.button>
        ))}
      </motion.div>

      {/* ── Filter Bar ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-3 items-center">
        {/* Search nama siswa — panjang */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchNama}
            onChange={e => { setSearchNama(e.target.value); setPage(1); }}
            placeholder="Cari nama siswa..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm"
          />
        </div>
        {/* Filter kelas — hanya SMP/SMA */}
        {(activeTab === 'SMP' || activeTab === 'SMA') && (
          <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus min-w-[150px]">
            <option value="">Semua Kelas</option>
            {kelasOpts.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        )}
      </motion.div>

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
                  <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">{formatDate(p.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{p.nama_siswa}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{p.jenjang}</span>
                  </td>
                  <td className="py-4 px-4 text-foreground">{p.kelas}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      p.bulan === 'Pendapatan Lainnya' ? 'bg-info/10 text-info' : 'bg-accent/50 text-accent-foreground'
                    }`}>{p.bulan}</span>
                  </td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(p.nominal)}</td>
                  <td className="py-4 px-4 text-muted-foreground text-xs">{p.petugas}</td>
                  <td className="py-4 px-4 text-center">
                    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setShowDeleteConfirm(p)}
                      className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}

              {/* ── Khusus rows ── */}
              {activeTab === 'Khusus' && pagedData.map((p: any, i: number) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/30 hover:bg-warning/[0.02] transition-colors group">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">{formatDate(p.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{p.nama_siswa}</td>
                  <td className="py-4 px-4 text-foreground">{p.kelas}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-bold">{p.bulan}</span>
                  </td>
                  <td className="py-4 px-4 text-right font-bold">
                    <span className="text-warning">{formatRupiah(p.nominal)}</span>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground text-xs">{p.petugas}</td>
                  <td className="py-4 px-4 text-center">
                    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setShowDeleteConfirm(p)}
                      className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors" title="Hapus">
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
                  <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">{formatDate(c.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{c.namaSiswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{c.jenjang}</span></td>
                  <td className="py-4 px-4 text-foreground">{c.kelas}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-warning/10 text-warning text-xs font-bold">{c.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(c.nominal)}</td>
                </motion.tr>
              ))}

              {/* ── Deposit rows ── */}
              {activeTab === 'Deposit' && pagedData.map((d: any, i: number) => (
                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">{formatDate(d.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{d.nama_siswa}</td>

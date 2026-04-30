import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, ChevronLeft, ChevronRight, Plus, X, Trash2, AlertTriangle, Search } from 'lucide-react';
import { useSantri } from '@/hooks/useSupabaseSantri';
import {
  usePembayaranPesantren, useKonsumsiPesantren, useOperasionalPesantren, usePembangunanPesantren,
  useCicilanPesantren, KATEGORI_LIST, useInsertKonsumsi, useDeleteKonsumsi, useDeletePembayaranPesantren,
  type PembayaranPesantrenDB, type KomponenPesantrenDB,
} from '@/hooks/useSupabasePesantren';
import { usePendapatanLainPesantren } from '@/hooks/useSupabasePesantren';
import { useAuth } from '@/contexts/AuthContext';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'Pembayaran' | 'Konsumsi' | 'Operasional' | 'Pembangunan' | 'Cicilan' | 'Deposit';
const PAGE_SIZE = 15;
const kelasOptions: Record<string, string[]> = { SMP: ['7A','7B','8A','8B','9A','9B'], SMA: ['10A','10B','11A','11B','12A','12B'] };
const bulanNama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const modalOverlay = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4";
const modalSpring = { type: 'spring' as const, stiffness: 300, damping: 25 };

export default function PendapatanPesantren() {
  const [activeTab, setActiveTab] = useState<Tab>('Pembayaran');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [page, setPage] = useState(1);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<PembayaranPesantrenDB | null>(null);
  const [showDeleteKonsumsi, setShowDeleteKonsumsi] = useState<KomponenPesantrenDB | null>(null);
  const [addNama, setAddNama] = useState('');
  const [addNominal, setAddNominal] = useState('');
  const [addKeterangan, setAddKeterangan] = useState('');
  const [searchNama, setSearchNama] = useState('');
  const tabs: Tab[] = ['Pembayaran', 'Konsumsi', 'Operasional', 'Pembangunan', 'Cicilan', 'Deposit'];

  const { data: pembayaran = [], isLoading: l1 } = usePembayaranPesantren();
  const { data: konsumsi = [], isLoading: l2 } = useKonsumsiPesantren();
  const { data: operasional = [], isLoading: l3 } = useOperasionalPesantren();
  const { data: pembangunan = [], isLoading: l4 } = usePembangunanPesantren();
  const { data: cicilan = [], isLoading: l5 } = useCicilanPesantren();
  const { data: students = [], isLoading: l6 } = useSantri();
  const { data: pendapatanLain = [], isLoading: l7 } = usePendapatanLainPesantren();
  const insertKonsumsi = useInsertKonsumsi();
  const deletePembayaran = useDeletePembayaranPesantren();
  const deleteKonsumsi = useDeleteKonsumsi();
  const { userName } = useAuth();

  if (l1 || l2 || l3 || l4 || l5 || l6 || l7) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
  const now = new Date();
  const todayStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const monthStr = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const todayISO = now.toISOString().split('T')[0];
  const currentBulan = bulanNama[now.getMonth()];

  const allData = (): any[] => {
    if (activeTab === 'Pembayaran') {
      return pembayaran.filter(p =>
        p.metode !== 'Deposit' &&
        (!filterJenjang || p.jenjang === filterJenjang) &&
        (!filterKelas || p.kelas === filterKelas) &&
        (!filterKategori || p.kategori === filterKategori)
      );
    }
    if (activeTab === 'Konsumsi') return konsumsi.filter(c => !filterKategori || c.kategori === filterKategori).map(c => ({ ...c, jenjang: '-', kelas: '-' }));
    if (activeTab === 'Operasional') return operasional.filter(c => !filterKategori || c.kategori === filterKategori).map(c => ({ ...c, jenjang: '-', kelas: '-' }));
    if (activeTab === 'Pembangunan') return pembangunan.filter(c => !filterKategori || c.kategori === filterKategori).map(c => ({ ...c, jenjang: '-', kelas: '-' }));
    if (activeTab === 'Cicilan') {
      return cicilan.map(c => ({
        ...c,
        nama_siswa: studentMap[c.siswa_id]?.nama_lengkap || '',
        jenjang: studentMap[c.siswa_id]?.jenjang || '-',
        kelas: studentMap[c.siswa_id]?.kelas || '-',
        kategori: '-',
      }));
    }
    if (activeTab === 'Deposit') {
      return pembayaran.filter(p =>
        p.metode === 'Deposit' &&
        (!filterJenjang || p.jenjang === filterJenjang) &&
        (!filterKelas || p.kelas === filterKelas) &&
        (!filterKategori || p.kategori === filterKategori)
      );
    }
    return [];
  };

  const data = allData().filter(p => {
    if (!searchNama) return true;
    const nama = p.nama_siswa || '';
    return nama.toLowerCase().includes(searchNama.toLowerCase());
  });
  const totalNominal = data.reduce((sum, d) => sum + (d.nominal || 0), 0);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pagedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showJenjangFilter = ['Pembayaran', 'Deposit'].includes(activeTab);
  const showKategoriFilter = !['Cicilan'].includes(activeTab);
  const isPembayaranTab = activeTab === 'Pembayaran';
  const isKonsumsiTab = activeTab === 'Konsumsi';
  const hasAksi = isPembayaranTab || isKonsumsiTab;

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `pendapatan_pesantren_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  const handleAddPendapatan = () => {
    if (!addNama || !addNominal) { toast.error('Mohon lengkapi semua field'); return; }
    insertKonsumsi.mutate({
      nama_siswa: addNama, kategori: 'Pendapatan Lainnya', bulan: currentBulan,
      nominal: parseInt(addNominal.replace(/\D/g, '')), tanggal: todayISO,
      petugas: userName || 'Petugas', siswa_id: null, pembayaran_id: null,
    }, {
      onSuccess: () => {
        setShowAddPopup(false); setAddNama(''); setAddNominal(''); setAddKeterangan('');
      },
    });
  };

  const handleDeleteKonsumsi = () => {
    if (!showDeleteKonsumsi) return;
    deleteKonsumsi.mutate(showDeleteKonsumsi.id, {
      onSuccess: () => setShowDeleteKonsumsi(null),
    });
  };

  const handleDelete = () => {
    if (!showDeleteConfirm) return;
    deletePembayaran.mutate(showDeleteConfirm, {
      onSuccess: () => setShowDeleteConfirm(null),
    });
  };

  const tabIcons: Record<Tab, string> = {
    'Pembayaran': '📌', 'Konsumsi': '🍚', 'Operasional': '🏗️',
    'Pembangunan': '🏢', 'Cicilan': '💳', 'Deposit': '💰'
  };

  const headers = hasAksi
    ? ['No', 'Tanggal', 'Nama', 'Jenjang', 'Kelas', 'Kategori', 'Bulan', 'Nominal', 'Petugas', 'Aksi']
    : ['No', 'Tanggal', 'Nama', 'Jenjang', 'Kelas', 'Kategori', 'Bulan', 'Nominal', 'Petugas'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pendapatan Pesantren</h1>
          <p className="text-muted-foreground text-sm mt-1">Riwayat pendapatan dari pembayaran santri</p>
        </motion.div>
        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddPopup(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine">
            <Plus className="w-4 h-4" /> Tambah Pendapatan
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={exportExcel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
            <Download className="w-4 h-4" /> Export Excel
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex gap-1 bg-muted p-1.5 rounded-2xl flex-wrap">
        {tabs.map(tab => (
          <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveTab(tab); setFilterJenjang(''); setFilterKelas(''); setFilterKategori(''); setSearchNama(''); setPage(1); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}>
            {tabIcons[tab]} {tab}
          </motion.button>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search nama - panjang */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchNama}
            onChange={e => { setSearchNama(e.target.value); setPage(1); }}
            placeholder="Cari nama santri..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm"
          />
        </div>

        {showJenjangFilter && (
          <>
            <select value={filterJenjang} onChange={e => { setFilterJenjang(e.target.value); setFilterKelas(''); setPage(1); }}
              className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
              <option value="">Semua Jenjang</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
            </select>
            <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }} disabled={!filterJenjang}
              className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus disabled:opacity-50">
              <option value="">{filterJenjang ? 'Semua Kelas' : 'Pilih jenjang'}</option>
              {filterJenjang && kelasOptions[filterJenjang]?.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </>
        )}
        {showKategoriFilter && (
          <select value={filterKategori} onChange={e => { setFilterKategori(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
            <option value="">Semua Kategori</option>
            {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
            <option value="Pendapatan Lainnya">Pendapatan Lainnya</option>
          </select>
        )}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table key={activeTab} className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {headers.map(h => (
                  <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${
                    h === 'Nominal' ? 'text-right' : h === 'Aksi' ? 'text-center' : 'text-left'
                  }`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 && (
                <tr><td colSpan={headers.length} className="py-16 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Download className="w-8 h-8 text-muted-foreground/30" />
                  </div>Tidak ada data
                </td></tr>
              )}
              {pagedData.map((p: any, i: number) => (
                <motion.tr key={p.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">{formatDate(p.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{p.nama_siswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{p.jenjang}</span></td>
                  <td className="py-4 px-4 text-foreground">{p.kelas}</td>
                  <td className="py-4 px-4"><span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-semibold whitespace-nowrap">{p.kategori}</span></td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-bold">{p.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-foreground font-bold whitespace-nowrap">{formatRupiah(p.nominal)}</td>
                  <td className="py-4 px-4 text-muted-foreground text-xs">{p.petugas}</td>
                  {hasAksi && (
                    <td className="py-4 px-4 text-center">
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          if (isPembayaranTab) setShowDeleteConfirm(p as PembayaranPesantrenDB);
                          if (isKonsumsiTab) setShowDeleteKonsumsi(p as KomponenPesantrenDB);
                        }}
                        className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Total */}
        <div className="border-t-2 border-border bg-muted/20">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Total Transaksi</p>
                <p className="text-sm font-bold text-foreground">{data.length} transaksi</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Periode</p>
                <p className="text-sm font-bold text-foreground">{monthStr}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Tanggal Cetak</p>
                <p className="text-sm font-bold text-foreground">{todayStr}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Total Nominal</p>
              <p className="text-2xl font-extrabold text-primary">{formatRupiah(totalNominal)}</p>
            </div>
          </div>
        </div>

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

      {/* ── POPUP TAMBAH PENDAPATAN ── */}
      <AnimatePresence>
        {showAddPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={modalOverlay} onClick={() => setShowAddPopup(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={modalSpring} className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-5"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-lg">Tambah Pendapatan Lainnya</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddPopup(false)} className="p-2 rounded-full hover:bg-muted">
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl">
                💡 Pendapatan lainnya akan otomatis masuk ke <span className="font-bold text-foreground">Dana Konsumsi</span>
              </p>
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nama Pemasukan</label>
                <select value={addNama} onChange={e => setAddNama(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                  <option value="">Pilih</option>
                  <option value="Sodaqoh">Sodaqoh</option>
                  <option value="Sisa Pendapatan Bulan Lalu">Sisa Pendapatan Bulan Lalu</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nominal</label>
                <input value={addNominal ? formatRupiah(parseInt(addNominal)) : ''}
                  onChange={e => setAddNominal(e.target.value.replace(/\D/g, ''))}
                  placeholder="Rp 0"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Keterangan (Opsional)</label>
                <input value={addKeterangan} onChange={e => setAddKeterangan(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={handleAddPendapatan} disabled={insertKonsumsi.isPending}
                  className="flex-1 py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold btn-shine disabled:opacity-50">
                  {insertKonsumsi.isPending ? 'Menyimpan...' : 'Simpan'}
                </motion.button>
                <button onClick={() => setShowAddPopup(false)}
                  className="flex-1 py-3.5 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-colors">
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── POPUP KONFIRMASI HAPUS ── */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={modalSpring} className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center"
              onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Hapus Pembayaran?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Pembayaran <span className="font-bold text-foreground">{showDeleteConfirm.nama_siswa}</span> bulan{' '}
                <span className="font-bold text-destructive">{showDeleteConfirm.bulan}</span> akan dihapus.
              </p>
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 mb-5 text-left">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                  <p className="text-xs text-warning font-semibold">Perhatian</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Data di <span className="font-bold text-foreground">Konsumsi, Operasional, dan Pembangunan</span> yang terkait akan ikut dihapus, dan tunggakan santri akan dikembalikan.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80">
                  Batal
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDelete} disabled={deletePembayaran.isPending}
                  className="flex-1 py-3 rounded-xl gradient-danger text-destructive-foreground font-bold text-sm btn-shine disabled:opacity-50">
                  {deletePembayaran.isPending ? 'Menghapus...' : 'Ya, Hapus'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── POPUP KONFIRMASI HAPUS KONSUMSI ── */}
      <AnimatePresence>
        {showDeleteKonsumsi && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={modalOverlay} onClick={() => setShowDeleteKonsumsi(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={modalSpring} className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center"
              onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Hapus Data Konsumsi?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Data konsumsi <span className="font-bold text-foreground">{showDeleteKonsumsi.nama_siswa}</span> bulan{' '}
                <span className="font-bold text-destructive">{showDeleteKonsumsi.bulan}</span> akan dihapus permanen.
              </p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteKonsumsi(null)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80">
                  Batal
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteKonsumsi} disabled={deleteKonsumsi.isPending}
                  className="flex-1 py-3 rounded-xl gradient-danger text-destructive-foreground font-bold text-sm btn-shine disabled:opacity-50">
                  {deleteKonsumsi.isPending ? 'Menghapus...' : 'Ya, Hapus'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

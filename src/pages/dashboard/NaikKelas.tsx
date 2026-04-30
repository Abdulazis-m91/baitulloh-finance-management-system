import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Archive, RotateCcw, CheckSquare, Square, Loader2, AlertTriangle, X, ChevronDown, Users, BookOpen } from 'lucide-react';
import { useStudents, useBatchUpdateKelas, useUpdateStatusSiswa, type StudentDB } from '@/hooks/useSupabaseData';
import { toast } from 'sonner';

const kelasOptions: Record<string, string[]> = {
  SMP: ['7A', '7B', '8A', '8B', '9A', '9B'],
  SMA: ['10A', '10B', '11A', '11B', '12A', '12B'],
  Khusus: ['7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'],
};

const modalOverlay = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4";
const modalSpring = { type: 'spring' as const, stiffness: 300, damping: 25 };

type Tab = 'naik_kelas' | 'arsip';

export default function NaikKelas() {
  const [activeTab, setActiveTab] = useState<Tab>('naik_kelas');

  // ── Filter state ──
  const [filterJenjang, setFilterJenjang] = useState('SMP');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState<'aktif' | 'lulus'>('aktif');

  // ── Selection state ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Konfirmasi state ──
  const [showKonfirmasiNaik, setShowKonfirmasiNaik] = useState(false);
  const [showKonfirmasiArsip, setShowKonfirmasiArsip] = useState(false);
  const [showKonfirmasiAktif, setShowKonfirmasiAktif] = useState(false);
  const [kelasTarget, setKelasTarget] = useState('');

  const { data: students = [], isLoading } = useStudents();
  const batchUpdateKelas = useBatchUpdateKelas();
  const updateStatus = useUpdateStatusSiswa();

  // ── Filter siswa ──
  const filtered = useMemo(() => {
    return students.filter(s => {
      const jenjangLabel = s.kategori === 'Khusus' ? 'Khusus' : s.jenjang;
      const matchJenjang = !filterJenjang || jenjangLabel === filterJenjang;
      const matchKelas = !filterKelas || s.kelas === filterKelas;
      const matchStatus = s.status === filterStatus;
      return matchJenjang && matchKelas && matchStatus;
    });
  }, [students, filterJenjang, filterKelas, filterStatus]);

  // ── Arsip siswa (status=lulus) ──
  const arsipSiswa = useMemo(() => students.filter(s => s.status === 'lulus'), [students]);

  // ── Toggle select ──
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)));
    }
  };

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const selectedCount = selectedIds.size;

  // ── Naik Kelas ──
  const handleNaikKelas = () => {
    if (!kelasTarget) { toast.error('Pilih kelas tujuan dulu'); return; }
    if (selectedCount === 0) { toast.error('Pilih siswa dulu'); return; }
    setShowKonfirmasiNaik(true);
  };

  const konfirmasiNaikKelas = () => {
    batchUpdateKelas.mutate(
      { ids: [...selectedIds], kelasBaru: kelasTarget },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setKelasTarget('');
          setShowKonfirmasiNaik(false);
        },
      }
    );
  };

  // ── Arsipkan (lulus) ──
  const handleArsipkan = () => {
    if (selectedCount === 0) { toast.error('Pilih siswa dulu'); return; }
    setShowKonfirmasiArsip(true);
  };

  const konfirmasiArsipkan = () => {
    updateStatus.mutate(
      { ids: [...selectedIds], status: 'lulus' },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setShowKonfirmasiArsip(false);
        },
      }
    );
  };

  // ── Aktifkan kembali ──
  const handleAktifkanKembali = () => {
    if (selectedCount === 0) { toast.error('Pilih siswa dulu'); return; }
    setShowKonfirmasiAktif(true);
  };

  const konfirmasiAktifkan = () => {
    updateStatus.mutate(
      { ids: [...selectedIds], status: 'aktif' },
      {
        onSuccess: () => {
          setSelectedIds(new Set());
          setShowKonfirmasiAktif(false);
        },
      }
    );
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const kelasOpts = kelasOptions[filterJenjang] || [];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Manajemen Siswa</h1>
        <p className="text-muted-foreground text-sm mt-1">Naik kelas massal & arsip siswa lulus</p>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit">
        {([
          { key: 'naik_kelas' as Tab, label: 'Naik Kelas', icon: GraduationCap },
          { key: 'arsip' as Tab, label: 'Arsip Siswa Lulus', icon: Archive },
        ]).map(tab => (
          <motion.button key={tab.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); setFilterStatus(tab.key === 'arsip' ? 'lulus' : 'aktif'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.key === 'arsip' && arsipSiswa.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-xs font-bold">{arsipSiswa.length}</span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* ── TAB NAIK KELAS ── */}
      {activeTab === 'naik_kelas' && (
        <div className="space-y-4">
          {/* Filter & Action Bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border p-5 shadow-elegant">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Filter Jenjang */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Jenjang</label>
                <select value={filterJenjang} onChange={e => { setFilterJenjang(e.target.value); setFilterKelas(''); setSelectedIds(new Set()); }}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus min-w-[120px]">
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="Khusus">Khusus</option>
                </select>
              </div>

              {/* Filter Kelas Asal */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Kelas Asal</label>
                <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setSelectedIds(new Set()); }}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus min-w-[120px]">
                  <option value="">Semua Kelas</option>
                  {kelasOpts.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              {/* Kelas Tujuan */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Pindah ke Kelas</label>
                <select value={kelasTarget} onChange={e => setKelasTarget(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus min-w-[120px]">
                  <option value="">Pilih Kelas Tujuan</option>
                  {kelasOpts.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              <div className="flex-1" />

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleNaikKelas}
                  disabled={selectedCount === 0 || !kelasTarget}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine disabled:opacity-40">
                  <GraduationCap className="w-4 h-4" />
                  Naik Kelas {selectedCount > 0 ? `(${selectedCount})` : ''}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleArsipkan}
                  disabled={selectedCount === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-warning text-warning-foreground text-sm font-bold btn-shine disabled:opacity-40">
                  <Archive className="w-4 h-4" />
                  Arsipkan Lulus {selectedCount > 0 ? `(${selectedCount})` : ''}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Info bar */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              Menampilkan <span className="font-bold text-foreground">{filtered.length}</span> siswa aktif
              {filterKelas && <span> · Kelas <span className="font-bold text-foreground">{filterKelas}</span></span>}
            </p>
            {selectedCount > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-sm font-bold text-primary">
                {selectedCount} siswa dipilih
              </motion.p>
            )}
          </div>

          {/* Tabel Siswa */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="py-4 px-4 w-12">
                      <button onClick={toggleAll} className="flex items-center justify-center">
                        {isAllSelected
                          ? <CheckSquare className="w-4 h-4 text-primary" />
                          : <Square className="w-4 h-4 text-muted-foreground" />
                        }
                      </button>
                    </th>
                    {['No', 'NISN', 'Nama Lengkap', 'Jenjang', 'Kelas', 'Status Bayar', 'Orang Tua'].map(h => (
                      <th key={h} className="py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-16 text-center text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Tidak ada siswa ditemukan</p>
                    </td></tr>
                  )}
                  {filtered.map((s, i) => {
                    const isSelected = selectedIds.has(s.id);
                    const jenjangLabel = s.kategori === 'Khusus' ? 'Khusus' : s.jenjang;
                    return (
                      <motion.tr key={s.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        onClick={() => toggleSelect(s.id)}
                        className={`border-b border-border/30 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center">
                            {isSelected
                              ? <CheckSquare className="w-4 h-4 text-primary" />
                              : <Square className="w-4 h-4 text-muted-foreground" />
                            }
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">{i + 1}</td>
                        <td className="py-3.5 px-4 text-foreground font-mono text-xs">{s.nisn}</td>
                        <td className="py-3.5 px-4 text-foreground font-semibold">{s.nama_lengkap}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            jenjangLabel === 'SMP' ? 'bg-info/10 text-info' :
                            jenjangLabel === 'SMA' ? 'bg-primary/10 text-primary' :
                            'bg-warning/10 text-warning'
                          }`}>{jenjangLabel}</span>
                        </td>
                        <td className="py-3.5 px-4 text-foreground font-medium">{s.kelas}</td>
                        <td className="py-3.5 px-4">
                          {s.tunggakan_sekolah.length > 0
                            ? <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-destructive/10 text-destructive">{s.tunggakan_sekolah.length} bulan tunggakan</span>
                            : <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-success/10 text-success">✓ Lunas</span>
                          }
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">{s.nama_orang_tua}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── TAB ARSIP ── */}
      {activeTab === 'arsip' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border p-5 shadow-elegant">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Siswa Lulus / Diarsipkan</p>
                <p className="text-xs text-muted-foreground mt-0.5">Siswa lulus yang masih memiliki tunggakan dapat ditagih dari sini</p>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleAktifkanKembali}
                disabled={selectedCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine disabled:opacity-40">
                <RotateCcw className="w-4 h-4" />
                Aktifkan Kembali {selectedCount > 0 ? `(${selectedCount})` : ''}
              </motion.button>
            </div>
          </motion.div>

          {selectedCount > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-sm font-bold text-primary px-1">
              {selectedCount} siswa dipilih
            </motion.p>
          )}

          {/* Tabel Arsip */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="py-4 px-4 w-12">
                      <button onClick={() => {
                        if (selectedIds.size === arsipSiswa.length) setSelectedIds(new Set());
                        else setSelectedIds(new Set(arsipSiswa.map(s => s.id)));
                      }} className="flex items-center justify-center">
                        {arsipSiswa.length > 0 && selectedIds.size === arsipSiswa.length
                          ? <CheckSquare className="w-4 h-4 text-primary" />
                          : <Square className="w-4 h-4 text-muted-foreground" />
                        }
                      </button>
                    </th>
                    {['No', 'NISN', 'Nama Lengkap', 'Jenjang', 'Kelas Terakhir', 'Tunggakan', 'WhatsApp', 'Orang Tua'].map(h => (
                      <th key={h} className="py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {arsipSiswa.length === 0 && (
                    <tr><td colSpan={9} className="py-16 text-center text-muted-foreground">
                      <Archive className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Belum ada siswa yang diarsipkan</p>
                    </td></tr>
                  )}
                  {arsipSiswa.map((s, i) => {
                    const isSelected = selectedIds.has(s.id);
                    const jenjangLabel = s.kategori === 'Khusus' ? 'Khusus' : s.jenjang;
                    return (
                      <motion.tr key={s.id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                        onClick={() => toggleSelect(s.id)}
                        className={`border-b border-border/30 cursor-pointer transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center">
                            {isSelected
                              ? <CheckSquare className="w-4 h-4 text-primary" />
                              : <Square className="w-4 h-4 text-muted-foreground" />
                            }
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">{i + 1}</td>
                        <td className="py-3.5 px-4 text-foreground font-mono text-xs">{s.nisn}</td>
                        <td className="py-3.5 px-4 text-foreground font-semibold">{s.nama_lengkap}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            jenjangLabel === 'SMP' ? 'bg-info/10 text-info' :
                            jenjangLabel === 'SMA' ? 'bg-primary/10 text-primary' :
                            'bg-warning/10 text-warning'
                          }`}>{jenjangLabel}</span>
                        </td>
                        <td className="py-3.5 px-4 text-foreground font-medium">{s.kelas}</td>
                        <td className="py-3.5 px-4">
                          {s.tunggakan_sekolah.length > 0 ? (
                            <div>
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-destructive/10 text-destructive">{s.tunggakan_sekolah.length} bulan</span>
                              <a href={`https://wa.me/${s.nomor_whatsapp.replace('+','')}?text=${encodeURIComponent(`Assalamu'alaikum Yth. ${s.nama_orang_tua}, siswa ${s.nama_lengkap} (${jenjangLabel} ${s.kelas}) yang telah lulus masih memiliki tunggakan SPP sebanyak ${s.tunggakan_sekolah.length} bulan. Mohon segera dilunasi. Terima kasih.`)}`}
                                target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="ml-2 text-xs text-success font-bold hover:underline">
                                Tagih WA
                              </a>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-success/10 text-success">✓ Lunas</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <a href={`https://wa.me/${s.nomor_whatsapp.replace('+','')}`}
                            target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs font-mono text-success hover:underline">{s.nomor_whatsapp}</a>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground text-xs">{s.nama_orang_tua}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── POPUP KONFIRMASI NAIK KELAS ── */}
      <AnimatePresence>
        {showKonfirmasiNaik && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={modalOverlay} onClick={() => setShowKonfirmasiNaik(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={modalSpring} className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center"
              onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Konfirmasi Naik Kelas</h3>
              <p className="text-sm text-muted-foreground mb-6">
                <span className="font-bold text-foreground">{selectedCount} siswa</span> akan dipindahkan ke kelas{' '}
                <span className="font-bold text-primary">{kelasTarget}</span>. Lanjutkan?
              </p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowKonfirmasiNaik(false)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80">Batal</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={konfirmasiNaikKelas}
                  disabled={batchUpdateKelas.isPending}
                  className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground font-bold text-sm btn-shine disabled:opacity-50">
                  {batchUpdateKelas.isPending ? 'Memproses...' : 'Ya, Naik Kelas'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── POPUP KONFIRMASI ARSIP ── */}
      <AnimatePresence>
        {showKonfirmasiArsip && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={modalOverlay} onClick={() => setShowKonfirmasiArsip(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={modalSpring} className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center"
              onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <Archive className="w-8 h-8 text-warning" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Arsipkan Siswa Lulus?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                <span className="font-bold text-foreground">{selectedCount} siswa</span> akan diarsipkan sebagai siswa lulus.
              </p>
              <div className="bg-info/10 border border-info/20 rounded-xl p-3 mb-5 text-left">
                <p className="text-xs text-info font-semibold mb-1">ℹ Info</p>
                <p className="text-xs text-muted-foreground">Siswa yang diarsipkan tidak akan muncul di Data Siswa aktif, namun tunggakan tetap bisa dilihat dan ditagih dari menu Arsip.</p>
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowKonfirmasiArsip(false)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm">Batal</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={konfirmasiArsipkan}
                  disabled={updateStatus.isPending}
                  className="flex-1 py-3 rounded-xl gradient-warning text-warning-foreground font-bold text-sm btn-shine disabled:opacity-50">
                  {updateStatus.isPending ? 'Memproses...' : 'Ya, Arsipkan'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── POPUP KONFIRMASI AKTIFKAN KEMBALI ── */}
      <AnimatePresence>
        {showKonfirmasiAktif && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={modalOverlay} onClick={() => setShowKonfirmasiAktif(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={modalSpring} className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center"
              onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Aktifkan Kembali?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                <span className="font-bold text-foreground">{selectedCount} siswa</span> akan dipindahkan kembali ke daftar siswa aktif.
              </p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowKonfirmasiAktif(false)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm">Batal</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={konfirmasiAktifkan}
                  disabled={updateStatus.isPending}
                  className="flex-1 py-3 rounded-xl gradient-success text-success-foreground font-bold text-sm btn-shine disabled:opacity-50">
                  {updateStatus.isPending ? 'Memproses...' : 'Ya, Aktifkan'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

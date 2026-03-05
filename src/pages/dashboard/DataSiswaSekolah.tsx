import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Send, Search, Eye, Edit, Trash2, MessageCircle, X, User, AlertTriangle, Calendar } from 'lucide-react';
import { mockStudents, kelasOptions, bulanList } from '@/data/mockData';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type FilterStatus = '' | 'lunas' | 'menunggak';
type StudentForm = {
  nisn: string; barcode: string; namaLengkap: string; jenjang: string; kelas: string;
  namaOrangTua: string; nomorWhatsApp: string;
  tunggakanTahun: string; tunggakanBulan: string[];
};

const emptyForm: StudentForm = {
  nisn: '', barcode: '', namaLengkap: '', jenjang: '', kelas: '',
  namaOrangTua: '', nomorWhatsApp: '+62', tunggakanTahun: '', tunggakanBulan: [],
};

const modalOverlay = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4";
const modalSpring = { type: 'spring' as const, stiffness: 300, damping: 25 };

type StudentFormPopupProps = {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  form: StudentForm;
  setForm: React.Dispatch<React.SetStateAction<StudentForm>>;
  toggleBulan: (b: string) => void;
  handleWhatsAppChange: (value: string) => void;
};

const StudentFormPopup = ({ title, onClose, onSubmit, form, setForm, toggleBulan, handleWhatsAppChange }: StudentFormPopupProps) => {
  const rfidRef = useRef<HTMLInputElement>(null);
  const [rfidFocused, setRfidFocused] = useState(false);
  const [rfidLastEvent, setRfidLastEvent] = useState<string>('');
  const [rfidFlash, setRfidFlash] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      rfidRef.current?.focus();
      console.log('[RFID] Auto-focus triggered after animation delay');
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Global keydown listener as fallback — captures keys even if focus is lost
  useEffect(() => {
    let buffer = '';
    let bufferTimer: ReturnType<typeof setTimeout>;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in another input
      const active = document.activeElement;
      if (active && active !== rfidRef.current && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'Enter') {
        if (buffer.length > 0) {
          console.log('[RFID] Scanner Enter detected, buffer:', buffer);
          setForm(prev => ({ ...prev, barcode: prev.barcode + buffer }));
          buffer = '';
          setRfidFlash(true);
          setTimeout(() => setRfidFlash(false), 600);
          toast.success(`✅ Kartu RFID terbaca: ${buffer}`);
        }
        e.preventDefault();
        return;
      }

      if (e.key.length === 1) {
        buffer += e.key;
        console.log('[RFID] Key captured:', e.key, '| Buffer:', buffer);
        clearTimeout(bufferTimer);
        bufferTimer = setTimeout(() => {
          console.log('[RFID] Buffer timeout, flushing:', buffer);
          if (buffer.length > 2) {
            // Likely scanner input (fast burst of chars)
            setForm(prev => ({ ...prev, barcode: prev.barcode + buffer }));
            setRfidFlash(true);
            setTimeout(() => setRfidFlash(false), 600);
            toast.success(`✅ Kartu RFID terbaca!`);
          }
          buffer = '';
        }, 150); // Scanners type fast, humans don't reach 150ms per char
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      clearTimeout(bufferTimer);
    };
  }, [setForm]);

  const handleRfidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    console.log('[RFID] onChange fired, value:', val);
    setForm(prev => ({ ...prev, barcode: val }));
    setRfidLastEvent(`Input: ${val.slice(-10)}`);
    if (val.length > 0) {
      setRfidFlash(true);
      setTimeout(() => setRfidFlash(false), 600);
    }
  };

  const handleRfidKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('[RFID] onKeyDown:', e.key, '| keyCode:', e.keyCode, '| current value:', form.barcode);
    setRfidLastEvent(`Key: ${e.key} (${e.keyCode})`);
    if (e.key === 'Enter') e.preventDefault();
  };

  return (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={modalOverlay} onClick={onClose}>
    <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={modalSpring}
      className="bg-card rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-7" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-foreground text-xl">{title}</h3>
        <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-full hover:bg-muted"><X className="w-5 h-5" /></motion.button>
      </div>

      <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-5">
        <div className="flex gap-6">
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary border-4 border-card">
              <User className="w-14 h-14 text-primary-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Foto Siswa</p>
          </div>

          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">NISN</label>
                <input value={form.nisn} onChange={e => setForm(prev => ({ ...prev, nisn: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Nama Lengkap</label>
                <input value={form.namaLengkap} onChange={e => setForm(prev => ({ ...prev, namaLengkap: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Barcode / RFID</label>
              <div className="relative">
                <input 
                  ref={rfidRef}
                  value={form.barcode} 
                  onChange={handleRfidChange}
                  onKeyDown={handleRfidKeyDown}
                  onFocus={() => { setRfidFocused(true); console.log('[RFID] Input FOCUSED'); }}
                  onBlur={() => { setRfidFocused(false); console.log('[RFID] Input BLURRED'); }}
                  onInput={(e) => console.log('[RFID] onInput event:', (e.target as HTMLInputElement).value)}
                  autoComplete="off"
                  inputMode="none"
                  placeholder="📡 Tempelkan kartu RFID — kursor otomatis aktif di sini..."
                  className={`w-full px-4 py-3 rounded-xl border-2 text-foreground text-sm input-focus font-mono transition-all duration-300
                    ${rfidFlash ? 'border-green-500 bg-green-500/10 ring-4 ring-green-500/30' : rfidFocused ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-primary/40 bg-primary/5'}
                    placeholder:text-primary/40`} 
                />
                {/* Live status indicator */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${rfidFocused ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {rfidFocused ? '🟢 Siap scan — tempelkan kartu RFID' : '⚪ Klik field ini untuk mengaktifkan scanner'}
                    {rfidLastEvent && ` | ${rfidLastEvent}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Jenjang</label>
                <select value={form.jenjang} onChange={e => setForm(prev => ({ ...prev, jenjang: e.target.value, kelas: '' }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required>
                  <option value="">Pilih</option><option>SMP</option><option>SMA</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Kelas</label>
                <select value={form.kelas} onChange={e => setForm(prev => ({ ...prev, kelas: e.target.value }))}
                  disabled={!form.jenjang} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus disabled:opacity-50" required>
                  <option value="">{form.jenjang ? 'Pilih Kelas' : 'Pilih jenjang dulu'}</option>
                  {form.jenjang && kelasOptions[form.jenjang]?.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Nama Orang Tua</label>
                <input value={form.namaOrangTua} onChange={e => setForm(prev => ({ ...prev, namaOrangTua: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">No. WhatsApp</label>
                <input value={form.nomorWhatsApp} onChange={e => handleWhatsAppChange(e.target.value)}
                  placeholder="+628xxxxxxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-5">
          <label className="text-xs font-semibold text-foreground mb-1 block uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-primary" /> Tunggakan Awal (opsional)
          </label>
          <p className="text-xs text-muted-foreground mb-3">Pilih tahun lalu centang bulan-bulan tunggakan</p>
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-32">
              <select value={form.tunggakanTahun} onChange={e => setForm(prev => ({ ...prev, tunggakanTahun: e.target.value, tunggakanBulan: [] }))}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                <option value="">Tahun</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>

            {form.tunggakanTahun && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {bulanList.map(b => (
                    <label key={b} className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all text-xs font-medium border ${
                      form.tunggakanBulan.includes(b)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-muted/30 border-border hover:bg-muted/60 text-foreground'
                    }`}>
                      <input type="checkbox" checked={form.tunggakanBulan.includes(b)} onChange={() => toggleBulan(b)} className="rounded border-border accent-primary w-3.5 h-3.5" />
                      {b}
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit"
          className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold btn-shine shadow-glow-primary text-sm">
          {title === 'Tambah Data Siswa' ? 'Simpan Data' : 'Perbarui Data'}
        </motion.button>
      </form>
    </motion.div>
  </motion.div>
  );
};

export default function DataSiswaSekolah() {
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<typeof mockStudents[0] | null>(null);
  const [showDetail, setShowDetail] = useState<typeof mockStudents[0] | null>(null);
  const [showTunggakan, setShowTunggakan] = useState<typeof mockStudents[0] | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<typeof mockStudents[0] | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const perPage = 15;

  const filtered = mockStudents.filter(s => {
    const matchSearch = !search || s.namaLengkap.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search);
    const matchJenjang = !filterJenjang || s.jenjang === filterJenjang;
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    const matchStatus = !filterStatus ||
      (filterStatus === 'lunas' && s.tunggakanSekolah.length === 0) ||
      (filterStatus === 'menunggak' && s.tunggakanSekolah.length > 0);
    return matchSearch && matchJenjang && matchKelas && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const exportExcel = () => {
    const data = filtered.map((s, i) => ({
      No: i + 1, NISN: s.nisn, 'Nama Lengkap': s.namaLengkap, Jenjang: s.jenjang, Kelas: s.kelas,
      'Status Pembiayaan': s.tunggakanSekolah.length > 0 ? `Menunggak (${s.tunggakanSekolah.length} bulan)` : 'Lunas',
      'Nama Orang Tua': s.namaOrangTua, 'No. WhatsApp': s.nomorWhatsApp,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.writeFile(wb, 'data_siswa.xlsx');
    toast.success('Data berhasil diekspor ke Excel');
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      toast.success(`Data ${showDeleteConfirm.namaLengkap} berhasil dihapus`);
      setShowDeleteConfirm(null);
    }
  };

  const openEdit = (s: typeof mockStudents[0]) => {
    setForm({
      nisn: s.nisn, barcode: s.barcode, namaLengkap: s.namaLengkap, jenjang: s.jenjang, kelas: s.kelas,
      namaOrangTua: s.namaOrangTua, nomorWhatsApp: s.nomorWhatsApp,
      tunggakanTahun: '', tunggakanBulan: [],
    });
    setShowEdit(s);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setShowAdd(true);
  };

  const sendWhatsApp = (s: typeof mockStudents[0]) => {
    const msg = encodeURIComponent(`Assalamu'alaikum. Yth. ${s.namaOrangTua}, kami informasikan bahwa ${s.namaLengkap} (${s.jenjang} ${s.kelas}) memiliki tunggakan SPP sebanyak ${s.tunggakanSekolah.length} bulan (${s.tunggakanSekolah.join(', ')}). Total: ${formatRupiah(s.tunggakanSekolah.length * s.biayaPerBulan)}. Mohon segera melakukan pembayaran. Terima kasih.`);
    window.open(`https://wa.me/${s.nomorWhatsApp}?text=${msg}`, '_blank');
  };

  const toggleBulan = (b: string) => {
    setForm(prev => ({
      ...prev,
      tunggakanBulan: prev.tunggakanBulan.includes(b)
        ? prev.tunggakanBulan.filter(x => x !== b)
        : [...prev.tunggakanBulan, b]
    }));
  };

  const handleWhatsAppChange = (value: string) => {
    if (!value.startsWith('+62')) {
      value = '+62';
    }
    setForm(prev => ({ ...prev, nomorWhatsApp: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Data Siswa</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola data siswa sekolah</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine shadow-glow-primary">
            <Plus className="w-4 h-4" /> Tambah Data
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
            <Download className="w-4 h-4" /> Export Excel
          </motion.button>
          {filterStatus === 'menunggak' && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02 }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-warning text-warning-foreground text-sm font-bold btn-shine">
              <Send className="w-4 h-4" /> Tagih Sekaligus
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-3xl border border-border p-5 shadow-elegant">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nama atau NISN..." className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
          </div>
          <select value={filterJenjang} onChange={e => { setFilterJenjang(e.target.value); setFilterKelas(''); setPage(1); }} className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
            <option value="">Semua Jenjang</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
          </select>
          <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }} disabled={!filterJenjang} className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus disabled:opacity-50">
            <option value="">{filterJenjang ? 'Semua Kelas' : 'Pilih jenjang'}</option>
            {filterJenjang && kelasOptions[filterJenjang]?.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as FilterStatus); setPage(1); }} className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
            <option value="">Semua Status</option><option value="lunas">Lunas</option><option value="menunggak">Belum Lunas</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {['No', 'NISN', 'Nama Lengkap', 'Jenjang', 'Kelas', 'Status', 'Orang Tua', 'WhatsApp', 'Aksi'].map(h => (
                  <th key={h} className="py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors group">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * perPage + i + 1}</td>
                  <td className="py-4 px-4 text-foreground font-mono text-xs">{s.nisn}</td>
                  <td className="py-4 px-4 text-foreground font-semibold group-hover:text-primary transition-colors">{s.namaLengkap}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${s.jenjang === 'SMP' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>{s.jenjang}</span>
                  </td>
                  <td className="py-4 px-4 text-foreground font-medium">{s.kelas}</td>
                  <td className="py-4 px-4">
                    {s.tunggakanSekolah.length > 0 ? (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowTunggakan(s)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        {s.tunggakanSekolah.length} bulan ↗
                      </motion.button>
                    ) : (
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-success/10 text-success">✓ Lunas</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground text-xs">{s.namaOrangTua}</td>
                  <td className="py-4 px-4">
                    <a href={`https://wa.me/${s.nomorWhatsApp.replace('+', '')}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-bold font-mono text-success hover:underline">
                      {s.nomorWhatsApp}
                    </a>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-start gap-1">
                      {[
                        { icon: Eye, color: 'text-info hover:bg-info/10', action: () => setShowDetail(s), title: 'Lihat' },
                        { icon: Edit, color: 'text-warning hover:bg-warning/10', action: () => openEdit(s), title: 'Edit' },
                        { icon: Trash2, color: 'text-destructive hover:bg-destructive/10', action: () => setShowDeleteConfirm(s), title: 'Hapus' },
                      ].map(({ icon: Icon, color, action, title }) => (
                        <motion.button key={title} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={action} className={`p-2 rounded-xl ${color} transition-colors`} title={title}>
                          <Icon className="w-4 h-4" />
                        </motion.button>
                      ))}
                      {s.tunggakanSekolah.length > 0 && (
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => sendWhatsApp(s)} className="p-2 rounded-xl text-success hover:bg-success/10 transition-colors" title="WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium">Menampilkan {paginated.length} dari {filtered.length} data</p>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => (
                <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === i + 1 ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'hover:bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ===== DETAIL POPUP (wider) ===== */}
      <AnimatePresence>
        {showDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={modalOverlay} onClick={() => setShowDetail(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={modalSpring}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-7" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-foreground text-xl">Detail Siswa</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowDetail(null)} className="p-2 rounded-full hover:bg-muted"><X className="w-5 h-5" /></motion.button>
              </div>

              {/* Top section: Photo left, Info right */}
              <div className="flex gap-6 mb-6">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-28 h-28 rounded-full gradient-primary flex items-center justify-center shadow-glow-primary border-4 border-card">
                    <User className="w-12 h-12 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h4 className="font-extrabold text-foreground text-xl">{showDetail.namaLengkap}</h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {[
                      ['NISN', showDetail.nisn],
                      ['Jenjang', showDetail.jenjang],
                      ['Kelas', showDetail.kelas],
                      ['Biaya/Bulan', formatRupiah(showDetail.biayaPerBulan)],
                      ['Nama Orang Tua', showDetail.namaOrangTua],
                      ['No. WhatsApp', showDetail.nomorWhatsApp],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
                        <span className="text-sm text-foreground font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom: Tunggakan */}
              <div className="border-t border-border pt-5">
                {showDetail.tunggakanSekolah.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-3 uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive" /> Daftar Tunggakan
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {showDetail.tunggakanSekolah.map(b => (
                        <div key={b} className="flex justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-sm">
                          <span className="text-foreground">{b}</span>
                          <span className="text-destructive font-bold">{formatRupiah(showDetail.biayaPerBulan)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-extrabold mt-2">
                      <span className="text-foreground">Total Tunggakan</span>
                      <span className="text-destructive">{formatRupiah(showDetail.tunggakanSekolah.length * showDetail.biayaPerBulan)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 text-center">✓ Tidak ada tunggakan</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== TUNGGAKAN POPUP ===== */}
      <AnimatePresence>
        {showTunggakan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={modalOverlay} onClick={() => setShowTunggakan(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={modalSpring}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-lg">Detail Tunggakan</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowTunggakan(null)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></motion.button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{showTunggakan.namaLengkap} · <span className="font-bold text-foreground">{showTunggakan.jenjang} {showTunggakan.kelas}</span></p>
              <div className="space-y-2">
                {showTunggakan.tunggakanSekolah.map(b => (
                  <div key={b} className="flex justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-sm">
                    <span className="text-foreground">{b}</span>
                    <span className="text-destructive font-bold">{formatRupiah(showTunggakan.biayaPerBulan)}</span>
                  </div>
                ))}
                <div className="flex justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20 font-extrabold text-sm">
                  <span className="text-foreground">Total</span>
                  <span className="text-destructive">{formatRupiah(showTunggakan.tunggakanSekolah.length * showTunggakan.biayaPerBulan)}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== ADD STUDENT POPUP ===== */}
      <AnimatePresence>
        {showAdd && (
          <StudentFormPopup
            title="Tambah Data Siswa"
            onClose={() => setShowAdd(false)}
            onSubmit={() => { toast.success('Data berhasil ditambahkan'); setShowAdd(false); }}
            form={form} setForm={setForm} toggleBulan={toggleBulan} handleWhatsAppChange={handleWhatsAppChange}
          />
        )}
      </AnimatePresence>

      {/* ===== EDIT STUDENT POPUP ===== */}
      <AnimatePresence>
        {showEdit && (
          <StudentFormPopup
            title="Edit Data Siswa"
            onClose={() => setShowEdit(null)}
            onSubmit={() => { toast.success('Data berhasil diperbarui'); setShowEdit(null); }}
            form={form} setForm={setForm} toggleBulan={toggleBulan} handleWhatsAppChange={handleWhatsAppChange}
          />
        )}
      </AnimatePresence>

      {/* ===== DELETE CONFIRMATION POPUP ===== */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={modalSpring}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Konfirmasi Hapus</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Apakah Anda yakin akan menghapus data <span className="font-bold text-foreground">{showDeleteConfirm.namaLengkap}</span>?
              </p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80 transition-colors">
                  Batal
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete}
                  className="flex-1 py-3 rounded-xl gradient-danger text-destructive-foreground font-bold text-sm btn-shine">
                  Ya, Hapus
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

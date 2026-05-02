import { useAutoTambahTunggakanPesantren } from '@/hooks/useSupabasePesantren';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Send, Search, Eye, Edit, Trash2, MessageCircle, X, User, AlertTriangle, Calendar, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSantri, useInsertSantri, useUpdateSantri, useDeleteSantri, type SantriDB } from '@/hooks/useSupabaseSantri';

const FONNTE_TOKEN = import.meta.env.VITE_FONNTE_TOKEN || 'UfZ8GV7RQHsWRRLBXJK7';

async function kirimFonnte(noWa: string, pesan: string): Promise<boolean> {
  try {
    const nomor = noWa.replace(/\D/g, '');
    const formData = new FormData();
    formData.append('target', nomor);
    formData.append('message', pesan);

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': FONNTE_TOKEN },
      body: formData,
    });
    const data = await res.json();
    // Fonnte return status: true (boolean) atau "true" (string)
    return data.status === true || data.status === 'true' || data.detail === 'success';
  } catch (e) {
    console.error('Fonnte error:', e);
    return false;
  }
}

async function kirimStrukFonnte(noWa: string, pesan: string, imageBase64: string): Promise<boolean> {
  try {
    const nomor = noWa.replace(/\D/g, '');
    // Fonnte tidak support upload langsung - kirim teks dulu, lalu upload gambar via URL
    // Alternatif: upload ke Supabase Storage lalu kirim URL
    // Untuk sementara: kirim teks saja dengan tanda bahwa struk sudah dicetak
    const formData = new FormData();
    formData.append('target', nomor);
    formData.append('message', pesan);

    // Coba kirim dengan gambar sebagai file
    try {
      const byteString = atob(imageBase64.split(',')[1] || imageBase64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: 'image/png' });
      formData.append('file', blob, 'struk-pembayaran.png');
    } catch {}

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': FONNTE_TOKEN },
      body: formData,
    });
    const data = await res.json();
    console.log('Fonnte response:', data);
    return data.status === true || data.status === 'true' || data.detail === 'success';
  } catch (e) {
    console.error('Fonnte struk error:', e);
    // Fallback: kirim teks saja
    return kirimFonnte(noWa, pesan);
  }
}

const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const kelasOptions: Record<string, string[]> = { SMP: ['7A','7B','8A','8B','9A','9B'], SMA: ['10A','10B','11A','11B','12A','12B'], Reguler: ['Reguler'] };

type FilterStatus = '' | 'lunas' | 'menunggak';
type StudentForm = {
  nisn: string; barcode: string; namaLengkap: string; jenjang: string; kelas: string;
  namaOrangTua: string; nomorWhatsApp: string; kategori: KategoriSantri;
  tunggakanTahun: string; tunggakanBulan: string[];
};

const emptyForm: StudentForm = {
  nisn: '', barcode: '', namaLengkap: '', jenjang: '', kelas: '',
  namaOrangTua: '', nomorWhatsApp: '+62', kategori: 'DALAM DAERAH',
  tunggakanTahun: '', tunggakanBulan: [],
};

const modalOverlay = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4";
const modalSpring = { type: 'spring' as const, stiffness: 300, damping: 25 };
const PAGE_SIZE = 15;

function SantriFormPopup({ title, onClose, onSubmit, form, setForm, toggleBulan, handleWhatsAppChange }: {
  title: string; onClose: () => void; onSubmit: () => void; form: StudentForm;
  setForm: React.Dispatch<React.SetStateAction<StudentForm>>; toggleBulan: (b: string) => void; handleWhatsAppChange: (v: string) => void;
}) {
  const rfidRef = useRef<HTMLInputElement>(null);
  const [rfidFocused, setRfidFocused] = useState(false);
  const [rfidFlash, setRfidFlash] = useState(false);

  useEffect(() => { const t = setTimeout(() => rfidRef.current?.focus(), 400); return () => clearTimeout(t); }, []);

  useEffect(() => {
    let buffer = ''; let bufferTimer: ReturnType<typeof setTimeout>;
    const handleKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && active !== rfidRef.current && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
      if (e.key === 'Enter') { if (buffer.length > 0) { setForm(p => ({ ...p, barcode: p.barcode + buffer })); buffer = ''; setRfidFlash(true); setTimeout(() => setRfidFlash(false), 600); toast.success('✅ Kartu RFID terbaca!'); } e.preventDefault(); return; }
      if (e.key.length === 1) { buffer += e.key; clearTimeout(bufferTimer); bufferTimer = setTimeout(() => { if (buffer.length > 2) { setForm(p => ({ ...p, barcode: p.barcode + buffer })); setRfidFlash(true); setTimeout(() => setRfidFlash(false), 600); toast.success('✅ Kartu RFID terbaca!'); } buffer = ''; }, 150); }
    };
    window.addEventListener('keydown', handleKey);
    return () => { window.removeEventListener('keydown', handleKey); clearTimeout(bufferTimer); };
  }, [setForm]);

  const biaya = KATEGORI_BIAYA[form.kategori];

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
              <div className="w-32 h-32 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary border-4 border-card"><User className="w-14 h-14 text-primary-foreground" /></div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Foto Santri</p>
            </div>
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">NISN</label>
                  <input value={form.nisn} onChange={e => setForm(p => ({ ...p, nisn: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required /></div>
                <div><label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Nama Lengkap</label>
                  <input value={form.namaLengkap} onChange={e => setForm(p => ({ ...p, namaLengkap: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required /></div>
              </div>
              <div><label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Barcode / RFID</label>
                <input ref={rfidRef} value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))}
                  onFocus={() => setRfidFocused(true)} onBlur={() => setRfidFocused(false)} autoComplete="off"
                  placeholder="📡 Tempelkan kartu RFID..."
                  className={`w-full px-4 py-3 rounded-xl border-2 text-foreground text-sm input-focus font-mono transition-all duration-300 ${rfidFlash ? 'border-green-500 bg-green-500/10 ring-4 ring-green-500/30' : rfidFocused ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-primary/40 bg-primary/5'} placeholder:text-primary/40`} />
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${rfidFocused ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <span className="text-[10px] text-muted-foreground font-mono">{rfidFocused ? '🟢 Siap scan' : '⚪ Klik untuk aktifkan scanner'}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Kategori</label>
                  <select value={form.kategori} onChange={e => setForm(p => ({ ...p, kategori: e.target.value as KategoriSantri }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required>
                    {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Total Nominal</label>
                  <input value={formatRupiah(biaya.total)} readOnly className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm font-bold cursor-not-allowed" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Jenjang</label>
                  <select value={form.jenjang} onChange={e => setForm(p => ({ ...p, jenjang: e.target.value, kelas: '' }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required>
                    <option value="">Pilih</option><option>SMP</option><option>SMA</option><option>Reguler</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Kelas</label>
                  <select value={form.kelas} onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))} disabled={!form.jenjang}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus disabled:opacity-50" required>
                    <option value="">{form.jenjang ? 'Pilih Kelas' : 'Pilih jenjang dulu'}</option>
                    {form.jenjang && kelasOptions[form.jenjang]?.map(k => <option key={k} value={k}>{k}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Nama Orang Tua</label>
                  <input value={form.namaOrangTua} onChange={e => setForm(p => ({ ...p, namaOrangTua: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required /></div>
                <div><label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">No. WhatsApp</label>
                  <input value={form.nomorWhatsApp} onChange={e => handleWhatsAppChange(e.target.value)} placeholder="+628xxxxxxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required /></div>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-5">
            <label className="text-xs font-semibold text-foreground mb-1 block uppercase tracking-wider flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-primary" /> Tunggakan Awal (opsional)</label>
            <p className="text-xs text-muted-foreground mb-3">Pilih tahun lalu centang bulan-bulan tunggakan</p>
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-32">
                <select value={form.tunggakanTahun} onChange={e => setForm(p => ({ ...p, tunggakanTahun: e.target.value, tunggakanBulan: [] }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                  <option value="">Tahun</option><option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                </select>
              </div>
              {form.tunggakanTahun && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex-1">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {bulanList.map(b => (
                      <label key={b} className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all text-xs font-medium border ${
                        form.tunggakanBulan.includes(b) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/30 border-border hover:bg-muted/60 text-foreground'
                      }`}>
                        <input type="checkbox" checked={form.tunggakanBulan.includes(b)} onChange={() => toggleBulan(b)} className="rounded border-border accent-primary w-3.5 h-3.5" />{b}
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit"
            className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold btn-shine shadow-glow-primary text-sm">
            {title.includes('Tambah') ? 'Simpan Data' : 'Perbarui Data'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DetailSantriPopup({ student, onClose }: { student: SantriDB; onClose: () => void }) {
  const { data: cicilanSiswa = [] } = useCicilanPesantrenBySiswa(student.id);
  const kat = (student.kategori as KategoriSantri) || 'REGULER';
  const biaya = KATEGORI_BIAYA[kat];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={modalOverlay} onClick={onClose}>
      <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={modalSpring}
        className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-7" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-foreground text-xl">Detail Santri</h3>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-full hover:bg-muted"><X className="w-5 h-5" /></motion.button>
        </div>
        <div className="flex gap-6 mb-6">
          <div className="flex-shrink-0"><div className="w-28 h-28 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary border-4 border-card"><User className="w-12 h-12 text-primary-foreground" /></div></div>
          <div className="flex-1 space-y-3">
            <h4 className="font-extrabold text-foreground text-xl">{student.nama_lengkap}</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {[['NISN', student.nisn], ['Jenjang', student.jenjang], ['Kelas', student.kelas], ['Kategori', kat],
                ['Biaya/Bulan', formatRupiah(biaya.total)], ['Nama Orang Tua', student.nama_orang_tua], ['No. WhatsApp', student.nomor_whatsapp],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
                  <span className="text-sm text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-border pt-5 space-y-4">
          {student.tunggakan_pesantren.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-3 uppercase tracking-wider"><AlertTriangle className="w-3.5 h-3.5 text-destructive" /> Daftar Tunggakan Pesantren</p>
              <div className="grid grid-cols-2 gap-2">
                {student.tunggakan_pesantren.map(b => (
                  <div key={b} className="flex justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-sm">
                    <span className="text-foreground">{b}</span><span className="text-destructive font-bold">{formatRupiah(biaya.total)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-sm font-extrabold mt-2">
                <span className="text-foreground">Total Tunggakan</span><span className="text-destructive">{formatRupiah(student.tunggakan_pesantren.length * biaya.total)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 text-center">✓ Tidak ada tunggakan pesantren</p>
          )}
          {cicilanSiswa.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">Riwayat Cicilan Pesantren</p>
              {cicilanSiswa.map(c => (
                <div key={c.id} className="flex justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-sm">
                  <span className="text-foreground">{c.bulan}</span><span className="text-amber-600 font-bold">{formatRupiah(c.nominal)}</span>
                </div>
              ))}
            </div>
          )}
          {student.deposit > 0 && (
            <div className="flex justify-between p-4 rounded-xl bg-success/5 border border-success/10 text-sm">
              <span className="text-muted-foreground">Deposit</span><span className="text-success font-extrabold">{formatRupiah(student.deposit)}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Label warna kategori
function KategoriLabel({ kat }: { kat: string }) {
  const colors: Record<string, string> = {
    'DALAM DAERAH': 'bg-info/10 text-info',
    'LUAR DAERAH':  'bg-primary/10 text-primary',
    'REGULER':      'bg-warning/10 text-warning',
    'NON MUKIM':    'bg-muted text-muted-foreground',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${colors[kat] || 'bg-muted text-muted-foreground'}`}>
      {kat}
    </span>
  );
}

export default function DataSantriPesantren() {
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('');
  const [filterKategori, setFilterKategori] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<SantriDB | null>(null);
  const [showDetail, setShowDetail] = useState<SantriDB | null>(null);
  const [showTunggakan, setShowTunggakan] = useState<SantriDB | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<SantriDB | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [isTagihLoading, setIsTagihLoading] = useState(false);

  const autoTunggakan = useAutoTambahTunggakanPesantren();
  const { data: students = [], isLoading } = useSantri();

  const handleTagihSekaligus = async () => {
    const menunggak = filtered.filter(s => s.tunggakan_pesantren.length > 0);
    if (menunggak.length === 0) { toast.error('Tidak ada santri yang menunggak'); return; }
    setIsTagihLoading(true);
    let sukses = 0; let gagal = 0;
    for (const s of menunggak) {
      const kat = (s.kategori as KategoriSantri) || 'REGULER';
      const biaya = KATEGORI_BIAYA[kat].total;
      const total = formatRupiah(s.tunggakan_pesantren.length * biaya);
      const bulanStr = s.tunggakan_pesantren.join(', ');
      const pesan = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nKepada Yth.\nBapak/Ibu *${s.nama_orang_tua}*\nOrang Tua/Wali dari *${s.nama_lengkap}*\n\nDengan hormat, bersama pesan ini kami dari *Yayasan Baitulloh* menyampaikan informasi terkait kewajiban pembayaran syahriah pesantren putra/putri Bapak/Ibu.\n\n📋 *INFORMASI TAGIHAN PESANTREN*\n━━━━━━━━━━━━━━━━━━━━\n👤 Nama Santri : *${s.nama_lengkap}*\n🏫 Jenjang      : ${s.jenjang} ${s.kelas}\n📅 Bulan         : ${bulanStr}\n💵 Nominal       : _${total}_\n━━━━━━━━━━━━━━━━━━━━\n\nMohon kiranya Bapak/Ibu dapat segera menyelesaikan kewajiban pembayaran tersebut. Pembayaran dapat dilakukan langsung ke kantor yayasan pada hari dan jam kerja.\n\nAtas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.\n\nAlhamdulillah, Jazakumullahu Khairan atas perhatian dan kerja sama Bapak/Ibu.\n\nAlhamdulilahi Jazakumullahu Khoiro,\n\n*Bendahara Yayasan Baitulloh*\n_Yukum Jaya, Terbanggi Besar, Lampung Tengah_`;
      const ok = await kirimFonnte(s.nomor_whatsapp, pesan);
      if (ok) sukses++; else gagal++;
    }
    setIsTagihLoading(false);
    if (sukses > 0) toast.success(`✅ ${sukses} pesan tagihan terkirim`);
    if (gagal > 0) toast.error(`❌ ${gagal} pesan gagal dikirim`);
  };

  // Auto tambah tunggakan bulan baru saat halaman dibuka
  useEffect(() => {
    autoTunggakan.mutate();
  }, []);
  const insertStudent = useInsertSantri();
  const updateStudentMut = useUpdateSantri();
  const deleteStudentMut = useDeleteSantri();

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const filtered = students.filter(s => {
    const matchSearch = !search || s.nama_lengkap.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search);
    const matchJenjang = !filterJenjang || s.jenjang === filterJenjang;
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    const matchStatus = !filterStatus || (filterStatus === 'lunas' && s.tunggakan_pesantren.length === 0) || (filterStatus === 'menunggak' && s.tunggakan_pesantren.length > 0);
    const matchKategori = !filterKategori || s.kategori === filterKategori;
    return matchSearch && matchJenjang && matchKelas && matchStatus && matchKategori;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportExcel = () => {
    const data = filtered.map((s, i) => ({
      No: i + 1, NISN: s.nisn, 'Nama Lengkap': s.nama_lengkap, Jenjang: s.jenjang, Kelas: s.kelas,
      Status: s.tunggakan_pesantren.length > 0 ? `Menunggak (${s.tunggakan_pesantren.length} bulan)` : 'Lunas',
      Kategori: s.kategori || 'REGULER', 'Nama Orang Tua': s.nama_orang_tua, 'No. WhatsApp': s.nomor_whatsapp,
    }));
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Santri'); XLSX.writeFile(wb, 'data_santri_pesantren.xlsx');
    toast.success('Data berhasil diekspor ke Excel');
  };

  const handleDelete = () => { if (showDeleteConfirm) { deleteStudentMut.mutate(showDeleteConfirm.id); setShowDeleteConfirm(null); } };

  const openEdit = (s: SantriDB) => {
    const tahunSet = new Set<string>(); const bulanSet = new Set<string>();
    s.tunggakan_pesantren.forEach(t => { const parts = t.split('-'); if (parts.length === 2) { tahunSet.add(parts[0]); bulanSet.add(parts[1]); } else if (bulanList.includes(t)) bulanSet.add(t); });
    const tahun = tahunSet.size === 1 ? [...tahunSet][0] : (bulanSet.size > 0 ? new Date().getFullYear().toString() : '');
    setForm({ nisn: s.nisn, barcode: s.barcode, namaLengkap: s.nama_lengkap, jenjang: s.jenjang, kelas: s.kelas,
      namaOrangTua: s.nama_orang_tua, nomorWhatsApp: s.nomor_whatsapp, kategori: (s.kategori as KategoriSantri) || 'DALAM DAERAH',
      tunggakanTahun: tahun, tunggakanBulan: [...bulanSet] });
    setShowEdit(s);
  };

  const openAdd = () => { setForm(emptyForm); setShowAdd(true); };

  const handleAdd = () => {
    const biaya = KATEGORI_BIAYA[form.kategori];
    insertStudent.mutate({
      nisn: form.nisn, barcode: form.barcode, nama_lengkap: form.namaLengkap,
      jenjang: form.jenjang as any, kelas: form.kelas,
      nama_orang_tua: form.namaOrangTua, nomor_whatsapp: form.nomorWhatsApp,
      foto: null, tunggakan_pesantren: form.tunggakanBulan,
      biaya_per_bulan: biaya.total, deposit: 0, kategori: form.kategori,
    });
    setShowAdd(false);
  };

  const handleEdit = () => {
    if (!showEdit) return;
    const biaya = KATEGORI_BIAYA[form.kategori];
    const tunggakan = form.tunggakanTahun ? [...form.tunggakanBulan] : showEdit.tunggakan_pesantren;
    updateStudentMut.mutate({
      id: showEdit.id, nisn: form.nisn, barcode: form.barcode, nama_lengkap: form.namaLengkap,
      jenjang: form.jenjang as any, kelas: form.kelas,
      nama_orang_tua: form.namaOrangTua, nomor_whatsapp: form.nomorWhatsApp,
      tunggakan_pesantren: tunggakan, kategori: form.kategori, biaya_per_bulan: biaya.total,
    });
    setShowEdit(null);
  };

  const sendWhatsApp = async (s: SantriDB) => {
    const kat = (s.kategori as KategoriSantri) || 'REGULER';
    const biaya = KATEGORI_BIAYA[kat].total;
    const total = formatRupiah(s.tunggakan_pesantren.length * biaya);
    const bulanStr = s.tunggakan_pesantren.join(', ');
    const pesan = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nKepada Yth.\nBapak/Ibu *${s.nama_orang_tua}*\nOrang Tua/Wali dari *${s.nama_lengkap}*\n\nDengan hormat, bersama pesan ini kami dari *Yayasan Baitulloh* menyampaikan informasi terkait kewajiban pembayaran syahriah pesantren putra/putri Bapak/Ibu.\n\n📋 *INFORMASI TAGIHAN PESANTREN*\n━━━━━━━━━━━━━━━━━━━━\n👤 Nama Santri : *${s.nama_lengkap}*\n🏫 Jenjang      : ${s.jenjang} ${s.kelas}\n📅 Bulan         : ${bulanStr}\n💵 Nominal       : _${total}_\n━━━━━━━━━━━━━━━━━━━━\n\nMohon kiranya Bapak/Ibu dapat segera menyelesaikan kewajiban pembayaran tersebut. Pembayaran dapat dilakukan langsung ke kantor yayasan pada hari dan jam kerja.\n\nAtas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.\n\nAlhamdulillah, Jazakumullahu Khairan atas perhatian dan kerja sama Bapak/Ibu.\n\nAlhamdulilahi Jazakumullahu Khoiro,\n\n*Bendahara Yayasan Baitulloh*\n_Yukum Jaya, Terbanggi Besar, Lampung Tengah_`;
    const ok = await kirimFonnte(s.nomor_whatsapp, pesan);
    if (ok) toast.success(`✅ Tagihan terkirim ke ${s.nama_orang_tua}`);
    else toast.error(`❌ Gagal kirim ke ${s.nomor_whatsapp}`);
  };

  const toggleBulan = (b: string) => setForm(p => ({ ...p, tunggakanBulan: p.tunggakanBulan.includes(b) ? p.tunggakanBulan.filter(x => x !== b) : [...p.tunggakanBulan, b] }));
  const handleWhatsAppChange = (v: string) => { if (!v.startsWith('+62')) v = '+62'; setForm(p => ({ ...p, nomorWhatsApp: v })); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Data Santri Pesantren</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola data santri pesantren</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine shadow-glow-primary">
            <Plus className="w-4 h-4" /> Tambah Data
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportExcel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
            <Download className="w-4 h-4" /> Export Excel
          </motion.button>
          {filterStatus === 'menunggak' && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-warning text-warning-foreground text-sm font-bold btn-shine">
              <Send className="w-4 h-4" /> Tagih Sekaligus
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl border border-border p-5 shadow-elegant">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama atau NISN..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
          </div>
          <select value={filterJenjang} onChange={e => { setFilterJenjang(e.target.value); setFilterKelas(''); setPage(1); }}
            className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
            <option value="">Semua Jenjang</option><option value="SMP">SMP</option><option value="SMA">SMA</option><option value="Reguler">Reguler</option>
          </select>
          <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }} disabled={!filterJenjang}
            className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus disabled:opacity-50">
            <option value="">{filterJenjang ? 'Semua Kelas' : 'Pilih jenjang'}</option>
            {filterJenjang && kelasOptions[filterJenjang]?.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filterKategori} onChange={e => { setFilterKategori(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
            <option value="">Semua Kategori</option>
            {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as FilterStatus); setPage(1); }}
            className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
            <option value="">Semua Status</option><option value="lunas">Lunas</option><option value="menunggak">Belum Lunas</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: '3%' }} />   {/* No */}
              <col style={{ width: '10%' }} />  {/* NISN */}
              <col style={{ width: '18%' }} />  {/* Nama */}
              <col style={{ width: '7%' }} />   {/* Jenjang */}
              <col style={{ width: '6%' }} />   {/* Kelas */}
              <col style={{ width: '10%' }} />  {/* Status */}
              <col style={{ width: '13%' }} />  {/* Kategori */}
              <col style={{ width: '13%' }} />  {/* Orang Tua */}
              <col style={{ width: '12%' }} />  {/* WhatsApp */}
              <col style={{ width: '8%' }} />   {/* Aksi */}
            </colgroup>
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {['No', 'NISN', 'Nama Lengkap', 'Jenjang', 'Kelas', 'Status', 'Kategori', 'Orang Tua', 'WhatsApp', 'Aksi'].map(h => (
                  <th key={h} className="py-4 px-3 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={10} className="py-16 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3"><User className="w-8 h-8 text-muted-foreground/30" /></div>
                  Tidak ada data santri
                </td></tr>
              )}
              {paginated.map((s, i) => (
                <motion.tr key={s.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors group">
                  <td className="py-3.5 px-3 text-muted-foreground text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-3.5 px-3 text-foreground font-mono text-xs truncate">{s.nisn}</td>
                  <td className="py-3.5 px-3 text-foreground font-semibold text-xs leading-tight group-hover:text-primary transition-colors">{s.nama_lengkap}</td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${s.jenjang === 'SMP' ? 'bg-info/10 text-info' : (s.jenjang as string) === 'Reguler' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
                      {s.jenjang}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-foreground font-medium text-xs">{s.kelas}</td>
                  <td className="py-3.5 px-3">
                    {s.tunggakan_pesantren.length > 0 ? (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowTunggakan(s)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors whitespace-nowrap">
                        {s.tunggakan_pesantren.length} bulan ↗
                      </motion.button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-success/10 text-success whitespace-nowrap">✓ Lunas</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3"><KategoriLabel kat={s.kategori || 'REGULER'} /></td>
                  <td className="py-3.5 px-3 text-muted-foreground text-xs leading-tight">{s.nama_orang_tua}</td>
                  <td className="py-3.5 px-3">
                    <a href={`https://wa.me/${s.nomor_whatsapp.replace('+', '')}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-bold font-mono text-success hover:underline block truncate">
                      {s.nomor_whatsapp}
                    </a>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-0.5">
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setShowDetail(s)} className="p-1.5 rounded-lg text-info hover:bg-info/10 transition-colors" title="Lihat">
                        <Eye className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-warning hover:bg-warning/10 transition-colors" title="Edit">
                        <Edit className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setShowDeleteConfirm(s)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                      {s.tunggakan_pesantren.length > 0 && (
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                          onClick={() => sendWhatsApp(s)} className="p-1.5 rounded-lg text-success hover:bg-success/10 transition-colors" title="WhatsApp">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/10">
          <p className="text-xs text-muted-foreground">
            Menampilkan <span className="font-bold text-foreground">{paginated.length}</span> dari{' '}
            <span className="font-bold text-foreground">{filtered.length}</span> data
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-border bg-background disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-border bg-background disabled:opacity-30 hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Popups */}
      <AnimatePresence>{showDetail && <DetailSantriPopup student={showDetail} onClose={() => setShowDetail(null)} />}</AnimatePresence>

      <AnimatePresence>
        {showTunggakan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={modalOverlay} onClick={() => setShowTunggakan(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={modalSpring}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-lg">Detail Tunggakan Pesantren</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowTunggakan(null)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></motion.button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{showTunggakan.nama_lengkap} · <span className="font-bold text-foreground">{showTunggakan.jenjang} {showTunggakan.kelas}</span></p>
              <div className="space-y-2">
                {(() => { const kat = (showTunggakan.kategori as KategoriSantri) || 'REGULER'; const biaya = KATEGORI_BIAYA[kat].total; return (<>
                  {showTunggakan.tunggakan_pesantren.map(b => (
                    <div key={b} className="flex justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-sm">
                      <span className="text-foreground">{b}</span><span className="text-destructive font-bold">{formatRupiah(biaya)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20 font-extrabold text-sm">
                    <span className="text-foreground">Total</span><span className="text-destructive">{formatRupiah(showTunggakan.tunggakan_pesantren.length * biaya)}</span>
                  </div>
                </>); })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{showAdd && <SantriFormPopup title="Tambah Data Santri" onClose={() => setShowAdd(false)} onSubmit={handleAdd} form={form} setForm={setForm} toggleBulan={toggleBulan} handleWhatsAppChange={handleWhatsAppChange} />}</AnimatePresence>
      <AnimatePresence>{showEdit && <SantriFormPopup title="Edit Data Santri" onClose={() => setShowEdit(null)} onSubmit={handleEdit} form={form} setForm={setForm} toggleBulan={toggleBulan} handleWhatsAppChange={handleWhatsAppChange} />}</AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={modalSpring}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-destructive" /></div>
              <h3 className="font-bold text-foreground text-lg mb-2">Konfirmasi Hapus</h3>
              <p className="text-sm text-muted-foreground mb-6">Apakah Anda yakin akan menghapus data <span className="font-bold text-foreground">{showDeleteConfirm.nama_lengkap}</span>?</p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-sm hover:bg-muted/80 transition-colors">Batal</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete}
                  className="flex-1 py-3 rounded-xl gradient-danger text-destructive-foreground font-bold text-sm btn-shine">Ya, Hapus</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

 
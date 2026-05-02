import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, CreditCard, Scan, Loader2, X, Printer, Send, LogOut } from 'lucide-react';
import { useSantri, useUpdateSantri, type SantriDB } from '@/hooks/useSupabaseSantri';
import {
  useInsertPembayaranPesantren, useInsertKonsumsi, useInsertOperasional, useInsertPembangunan,
  useCicilanPesantrenBySiswa, useInsertCicilanPesantren, useDeleteCicilanPesantrenBySiswaAndBulan,
  useProcessDepositPesantren,
  KATEGORI_BIAYA, KategoriSantri, type CicilanPesantrenDB,
} from '@/hooks/useSupabasePesantren';
import { useAuth } from '@/contexts/AuthContext';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoYB from '@/assets/logo-yb.png';

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
export default function PembayaranPesantren() {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<SantriDB | null>(null);
  const [metode, setMetode] = useState<'Lunas' | 'Cicil' | 'Deposit'>('Lunas');
  const [selectedBulan, setSelectedBulan] = useState('');
  const [nominal, setNominal] = useState(0);
  const [nominalCicilInput, setNominalCicilInput] = useState('');
  const [showStruk, setShowStruk] = useState(false);
  const [strukData, setStrukData] = useState<any>(null);
  const strukRef = useRef<HTMLDivElement>(null);

  const { data: students = [], isLoading } = useSantri();
  const { data: cicilanSiswa = [] } = useCicilanPesantrenBySiswa(selectedStudent?.id);
  const insertPembayaran = useInsertPembayaranPesantren();
  const insertKonsumsi = useInsertKonsumsi();
  const insertOperasional = useInsertOperasional();
  const insertPembangunan = useInsertPembangunan();
  const updateStudent = useUpdateSantri();
  const insertCicilan = useInsertCicilanPesantren();
  const deleteCicilan = useDeleteCicilanPesantrenBySiswaAndBulan();
  const processDeposit = useProcessDepositPesantren();
  const { userName } = useAuth();

  // ── Auto-proses deposit jatuh tempo saat halaman dibuka ──────────────────
  useEffect(() => {
    processDeposit.mutate();
  }, []);

  const getKategori = (s: SantriDB): KategoriSantri => (s.kategori as KategoriSantri) || 'REGULER';
  const getBiaya = (s: SantriDB) => KATEGORI_BIAYA[getKategori(s)];
  const hasTunggakan = selectedStudent ? selectedStudent.tunggakan_pesantren.length > 0 : false;

  const cicilanByBulan = useMemo(() => {
    const map: Record<string, CicilanPesantrenDB[]> = {};
    cicilanSiswa.forEach(c => { if (!map[c.bulan]) map[c.bulan] = []; map[c.bulan].push(c); });
    return map;
  }, [cicilanSiswa]);

  const bulanWithCicilan = useMemo(() => Object.keys(cicilanByBulan), [cicilanByBulan]);
  const hasAnyCicilan = bulanWithCicilan.length > 0;
  const isLunasEnabled = hasTunggakan;
  const isCicilEnabled = hasTunggakan && !hasAnyCicilan;
  const isDepositEnabled = !hasTunggakan;

  if (isLoading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const searchResults = searchQuery.length >= 2
    ? students.filter(s => s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) || s.nisn.includes(searchQuery)).slice(0, 5)
    : [];

  const selectStudent = (s: SantriDB) => {
    setSelectedStudent(s); setSearchQuery(''); setSelectedBulan(''); setNominalCicilInput('');
    if (s.tunggakan_pesantren.length > 0) { setMetode('Lunas'); setNominal(getBiaya(s).total); }
    else { setMetode('Deposit'); setNominal(0); }
  };

  const handleBarcode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setBarcodeQuery(val);
    const found = students.find(s => s.barcode === val);
    if (found) { selectStudent(found); setBarcodeQuery(''); }
  };

  const handleMetodeChange = (m: 'Lunas' | 'Cicil' | 'Deposit') => {
    const enabled = m === 'Cicil' ? isCicilEnabled : m === 'Lunas' ? isLunasEnabled : isDepositEnabled;
    if (!enabled) return;
    setMetode(m); setSelectedBulan(''); setNominalCicilInput(''); setNominal(0);
  };

  const getAvailableMonths = () => {
    if (!selectedStudent) return [];
    if (metode === 'Lunas') return selectedStudent.tunggakan_pesantren;
    if (metode === 'Cicil') return selectedStudent.tunggakan_pesantren.filter(b => !bulanWithCicilan.includes(b));
    if (metode === 'Deposit') {
      const now = new Date();
      const cm = now.getMonth();
      const cy = now.getFullYear();
      // Format: "Mei-2026"
      return bulanList.filter((_, i) => i > cm).map(b => `${b}-${cy}`);
    }
    return [];
  };

  const selectedBulanHasCicilan = selectedBulan ? (cicilanByBulan[selectedBulan]?.length > 0) : false;
  const totalCicilanForBulan = selectedBulan ? (cicilanByBulan[selectedBulan] || []).reduce((sum, c) => sum + c.nominal, 0) : 0;

  const getLunasNominal = () => {
    if (!selectedStudent || !selectedBulan) return 0;
    const biaya = getBiaya(selectedStudent).total;
    return selectedBulanHasCicilan ? Math.max(0, biaya - totalCicilanForBulan) : biaya;
  };

  const handleBulanChange = (bulan: string) => {
    setSelectedBulan(bulan);
    if (metode === 'Lunas' && bulan && selectedStudent) {
      const cicilanTotal = (cicilanByBulan[bulan] || []).reduce((sum, c) => sum + c.nominal, 0);
      setNominal(Math.max(0, getBiaya(selectedStudent).total - cicilanTotal));
    }
  };

  const handleSubmit = () => {
    if (!selectedStudent || !selectedBulan) return;
    if (metode === 'Cicil') {
      const n = parseInt(nominalCicilInput) || 0;
      if (n <= 0) { toast.error('Nominal cicilan harus lebih dari 0'); return; }
      if (n >= getBiaya(selectedStudent).total) { toast.error('Gunakan metode Lunas untuk pembayaran penuh'); return; }
    }
    if (metode === 'Deposit') {
      if ((parseInt(nominalCicilInput) || 0) <= 0) { toast.error('Nominal deposit harus lebih dari 0'); return; }
    }

    const tanggal = new Date().toISOString().split('T')[0];
    const kat = getKategori(selectedStudent);
    const bk = getBiaya(selectedStudent);
    const lunasNom = getLunasNominal();
    const cicilNom = parseInt(nominalCicilInput) || 0;
    const finalNominal = metode === 'Lunas' ? lunasNom : cicilNom;

    setStrukData({
      siswa_id: selectedStudent.id, nama_siswa: selectedStudent.nama_lengkap, nisn: selectedStudent.nisn,
      jenjang: selectedStudent.jenjang, kelas: selectedStudent.kelas, kategori: kat,
      bulan: selectedBulan, nominal: finalNominal, metode, tanggal,
      petugas: userName || 'Petugas',
      refNo: generateRefNo(), tahunAjaran: getTahunAjaran(),
      student: selectedStudent, hasCicilanAktif: selectedBulanHasCicilan,
      totalCicilanSebelumnya: totalCicilanForBulan, totalBayarUtuh: bk.total, biayaKomponen: bk,
    });
    setShowStruk(true);
  };

  const downloadStrukAsPDF = async (): Promise<boolean> => {
    if (!strukRef.current) return false;
    try {
      const images = strukRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => { if (img.complete) return Promise.resolve(); return new Promise(r => { img.onload = r; img.onerror = r; }); }));
      const canvas = await html2canvas(strukRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdfW = 80; const pdfH = (canvas.height * pdfW) / canvas.width;
      const doc = new jsPDF({ unit: 'mm', format: [pdfW, pdfH + 10] });
      doc.addImage(imgData, 'PNG', 0, 5, pdfW, pdfH);
      doc.save(`struk-pesantren-${strukData?.nama_siswa?.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      return true;
    } catch (err) { toast.error('Gagal mendownload struk'); return false; }
  };

  const saveData = () => {
    if (!strukData) return;
    const { student, hasCicilanAktif, totalCicilanSebelumnya, totalBayarUtuh, biayaKomponen, refNo, tahunAjaran, ...record } = strukData;
    const kat = record.kategori;
    const bk = biayaKomponen;

    if (metode === 'Cicil') {
      insertCicilan.mutate({ siswa_id: student.id, bulan: record.bulan, nominal: record.nominal, tanggal: record.tanggal, petugas: record.petugas });
    } else if (metode === 'Lunas') {
      insertPembayaran.mutate({ ...record, nominal: totalBayarUtuh, metode: 'Lunas' as const });
      const baseComp = { siswa_id: student.id, pembayaran_id: null, nama_siswa: student.nama_lengkap, kategori: kat, bulan: record.bulan, tanggal: record.tanggal, petugas: record.petugas };
      if (bk.konsumsi > 0) insertKonsumsi.mutate({ ...baseComp, nominal: bk.konsumsi });
      if (bk.operasional > 0) insertOperasional.mutate({ ...baseComp, nominal: bk.operasional });
      if (bk.pembangunan > 0) insertPembangunan.mutate({ ...baseComp, nominal: bk.pembangunan });
      updateStudent.mutate({ id: student.id, tunggakan_pesantren: student.tunggakan_pesantren.filter((b: string) => b !== record.bulan) });
      if (hasCicilanAktif) deleteCicilan.mutate({ siswa_id: student.id, bulan: record.bulan });
    } else if (metode === 'Deposit') {
      insertPembayaran.mutate(record);
      updateStudent.mutate({ id: student.id, deposit: (student.deposit || 0) + record.nominal });
    }
  };

  const resetForm = () => { setShowStruk(false); setSelectedStudent(null); setSelectedBulan(''); setNominalCicilInput(''); };

  const handleSimpanCetak = async () => {
    if (!strukData) return;
    const downloaded = await downloadStrukAsPDF();
    if (!downloaded) return;
    saveData(); window.print(); resetForm();
    toast.success('Data tersimpan & struk dicetak');
  };

  const handleSimpanKirim = async () => {
    if (!strukData) return;
    const downloaded = await downloadStrukAsPDF();
    if (!downloaded) return;
    saveData();

    // Kirim via Fonnte
    const nominalText = formatRupiah(metode === 'Lunas' ? strukData.totalBayarUtuh : strukData.nominal);
    const bulanDisplay = strukData.bulan.includes('-') ? strukData.bulan.split('-').join(' ') : strukData.bulan;
    const pesan = `Assalamu'alaikum Warahmatullahi Wabarakatuh,

Kepada Yth.
Bapak/Ibu *${strukData.student?.nama_orang_tua || ''}*
Orang Tua/Wali dari *${strukData.nama_siswa}*

Dengan hormat, kami sampaikan bahwa putra/putri Bapak/Ibu telah melakukan pembayaran syahriah pesantren.

📋 *BUKTI PEMBAYARAN PESANTREN*
━━━━━━━━━━━━━━━━━━━━
🔖 No. Ref       : ${strukData.refNo}
👤 Nama Santri : *${strukData.nama_siswa}*
🏫 Jenjang       : ${strukData.jenjang} ${strukData.kelas}
📅 Bulan          : ${bulanDisplay}
💳 Metode        : ${strukData.metode}
💵 Nominal       : _${nominalText}_
📆 Tanggal       : ${formatDate(strukData.tanggal)}
👩‍💼 Petugas       : ${strukData.petugas}
━━━━━━━━━━━━━━━━━━━━

Terima kasih atas pembayarannya. Semoga menjadi berkah.

Alhamdulilahi Jazakumullahu Khoiro,

*Bendahara Yayasan Baitulloh*
_Yukum Jaya, Terbanggi Besar, Lampung Tengah_`;

    const noWa = strukData.student?.nomor_whatsapp || '';
    const ok = await kirimFonnte(noWa, pesan);
    if (ok) toast.success('✅ Notifikasi pembayaran terkirim via WhatsApp!');
    else toast.error('❌ Gagal kirim WA, cek koneksi Fonnte');
    resetForm();
  };

  const effectiveMetode = (() => {
    if (metode === 'Cicil' && !isCicilEnabled) return isLunasEnabled ? 'Lunas' : 'Deposit';
    if (metode === 'Deposit' && !isDepositEnabled) return isLunasEnabled ? 'Lunas' : 'Cicil';
    return metode;
  })();
  if (effectiveMetode !== metode && selectedStudent) setTimeout(() => setMetode(effectiveMetode), 0);

  const availableMonths = getAvailableMonths();
  const biayaInfo = selectedStudent ? getBiaya(selectedStudent) : null;
  const now = new Date();
  const tanggalStruk = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pembayaran Pesantren</h1>
        <p className="text-muted-foreground text-sm mt-1">Proses pembayaran santri pesantren</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-3xl border border-border p-6 shadow-elegant">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Search className="w-4 h-4 text-primary-foreground" /></div>
          Cari Santri
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari nama atau NISN..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-elevated z-10 overflow-hidden">
                  {searchResults.map((s, i) => (
                    <motion.button key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      onClick={() => selectStudent(s)} className="w-full text-left px-4 py-3.5 hover:bg-muted/70 transition-all flex items-center gap-3 border-b border-border/30 last:border-0">
                      <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm"><User className="w-4 h-4 text-primary-foreground" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.nama_lengkap}</p>
                        <p className="text-xs text-muted-foreground">{s.nisn} · {s.jenjang} {s.kelas} · {s.kategori || 'REGULER'}</p>
                      </div>
                      {s.tunggakan_pesantren.length > 0 && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">{s.tunggakan_pesantren.length} tunggakan</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={barcodeQuery} onChange={handleBarcode} placeholder="Scan barcode santri..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedStudent && biayaInfo && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Info Santri */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-elegant">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-info flex items-center justify-center"><User className="w-4 h-4 text-info-foreground" /></div>
                Informasi Santri
              </h3>
              <div className="flex items-center gap-4 p-5 rounded-2xl gradient-card border border-border mb-5">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary"><User className="w-8 h-8 text-primary-foreground" /></div>
                <div>
                  <h4 className="font-extrabold text-foreground text-lg">{selectedStudent.nama_lengkap}</h4>
                  <p className="text-sm text-muted-foreground">NISN: {selectedStudent.nisn}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{selectedStudent.jenjang}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">Kelas {selectedStudent.kelas}</span>
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-bold">{getKategori(selectedStudent)}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between p-4 rounded-xl bg-muted/50 border border-border">
                  <span className="text-sm text-muted-foreground">Jumlah Tunggakan</span>
                  <span className={`text-sm font-extrabold ${hasTunggakan ? 'text-destructive' : 'text-success'}`}>
                    {hasTunggakan ? `${selectedStudent.tunggakan_pesantren.length} bulan` : 'Nihil ✓'}
                  </span>
                </div>
                {hasTunggakan && (
                  <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Bulan Tunggakan</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudent.tunggakan_pesantren.map(b => (
                        <span key={b} className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-1.5">
                  {[['Konsumsi', biayaInfo.konsumsi], ['Operasional', biayaInfo.operasional], ['Pembangunan', biayaInfo.pembangunan]].map(([l,v]) => (
                    <div key={l as string} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{l as string}</span>
                      <span className="font-semibold text-foreground">{formatRupiah(v as number)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-border pt-1.5">
                    <span className="font-semibold text-foreground">Total/Bulan</span>
                    <span className="font-extrabold text-primary">{formatRupiah(biayaInfo.total)}</span>
                  </div>
                </div>
                <div className="flex justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/15">
                  <span className="text-sm font-semibold text-muted-foreground">Total Tunggakan</span>
                  <span className="text-sm font-extrabold text-destructive">{formatRupiah(selectedStudent.tunggakan_pesantren.length * biayaInfo.total)}</span>
                </div>
              </div>
            </div>

            {/* Form Transaksi */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-elegant">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center"><CreditCard className="w-4 h-4 text-foreground" /></div>
                Form Transaksi
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'Lunas' as const, enabled: isLunasEnabled },
                      { key: 'Cicil' as const, enabled: isCicilEnabled },
                      { key: 'Deposit' as const, enabled: isDepositEnabled },
                    ]).map(({ key: m, enabled }) => (
                      <motion.button key={m} whileHover={enabled ? { scale: 1.02 } : {}} whileTap={enabled ? { scale: 0.98 } : {}}
                        onClick={() => handleMetodeChange(m)} disabled={!enabled}
                        className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                          metode === m && enabled ? 'gradient-primary text-primary-foreground shadow-glow-primary'
                            : enabled ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                            : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
                        }`}>{m}</motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Bulan</label>
                  <select value={selectedBulan} onChange={e => handleBulanChange(e.target.value)} disabled={availableMonths.length === 0}
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground input-focus text-sm disabled:opacity-50">
                    <option value="">{availableMonths.length === 0 ? 'Tidak ada bulan tersedia' : 'Pilih bulan'}</option>
                    {availableMonths.map(b => <option key={b} value={b}>{b.includes('-') ? b.split('-').join(' ') : b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nominal</label>
                  {metode === 'Cicil' ? (
                    <input type="number" value={nominalCicilInput} onChange={e => setNominalCicilInput(e.target.value)} placeholder="Masukkan nominal cicilan..."
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground input-focus text-sm" />
                  ) : metode === 'Lunas' && selectedBulan ? (
                    <div className="px-4 py-3.5 rounded-xl bg-muted border border-border text-foreground font-bold text-lg">
                      {formatRupiah(getLunasNominal())}
                      <span className="text-xs font-normal text-muted-foreground ml-2">{selectedBulanHasCicilan ? '(sisa pelunasan)' : '(bayar penuh)'}</span>
                    </div>
                  ) : metode === 'Deposit' ? (
                    <input type="number" value={nominalCicilInput} onChange={e => setNominalCicilInput(e.target.value)} placeholder="Masukkan nominal deposit..."
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground input-focus text-sm" />
                  ) : (
                    <div className="px-4 py-3.5 rounded-xl bg-muted border border-border text-muted-foreground text-sm">Pilih bulan terlebih dahulu</div>
                  )}
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSubmit}
                  disabled={!selectedBulan || (metode === 'Cicil' && (!nominalCicilInput || parseInt(nominalCicilInput) <= 0)) || (metode === 'Deposit' && (!nominalCicilInput || parseInt(nominalCicilInput) <= 0))}
                  className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold btn-shine shadow-glow-primary disabled:opacity-50 text-base">
                  {metode === 'Lunas' ? 'Bayar Lunas' : metode === 'Cicil' ? 'Bayar Cicilan' : 'Proses Deposit'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedStudent && !showStruk && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card rounded-3xl border border-border p-16 shadow-elegant text-center">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5"><Search className="w-10 h-10 text-muted-foreground/30" /></div>
          <h3 className="font-bold text-foreground text-lg mb-2">Pilih Santri</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">Cari santri berdasarkan nama, NISN, atau scan barcode</p>
        </motion.div>
      )}

      {/* Struk Popup */}
      <AnimatePresence>
        {showStruk && strukData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowStruk(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-7 max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-lg">Struk Pembayaran Pesantren</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowStruk(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></motion.button>
              </div>

              {/* Struk content */}
              <div ref={strukRef} className="bg-white rounded-2xl overflow-hidden" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', padding: '16px 12px 10px', borderBottom: '1px dashed #ccc' }}>
                  <img src={logoYB} alt="Logo" style={{ width: '48px', height: '48px', margin: '0 auto 6px', display: 'block', objectFit: 'contain' }} />
                  <div style={{ fontWeight: 900, fontSize: '15px', letterSpacing: '1px', color: '#111', marginBottom: '2px' }}>YAYASAN BAITULLOH</div>
                  <div style={{ fontSize: '9px', color: '#888', fontWeight: 300 }}>Jl. Yukum Jaya, Terbanggi Besar, Lampung Tengah</div>
                </div>
                {/* Judul */}
                <div style={{ textAlign: 'center', padding: '7px 12px', background: '#f8f9fa' }}>
                  <div style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '1px', color: '#333', textTransform: 'uppercase' }}>Pembayaran Pesantren</div>
                </div>
                {/* Info */}
                <div style={{ padding: '8px 12px', borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc' }}>
                  {[
                    ['No. Referensi', strukData.refNo],
                    ['Tahun Ajaran', strukData.tahunAjaran],
                    ['Tanggal', formatDate(strukData.tanggal)],
                    ['NISN', strukData.nisn],
                    ['Nama Santri', strukData.nama_siswa],
                    ['Jenjang / Kelas', `${strukData.jenjang} / ${strukData.kelas}`],
                    ['Kategori', strukData.kategori],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#666', fontSize: '10px' }}>{l}</span>
                      <span style={{ color: '#111', fontWeight: 600, fontSize: '10px', textAlign: 'right', maxWidth: '55%' }}>{v}</span>
                    </div>
                  ))}
                </div>
                {/* Header tabel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#555', fontWeight: 700, fontSize: '9px' }}>NO.</span>
                    <span style={{ color: '#555', fontWeight: 700, fontSize: '9px' }}>PEMBAYARAN</span>
                  </div>
                  <span style={{ color: '#555', fontWeight: 700, fontSize: '9px' }}>JUMLAH</span>
                </div>
                {/* Baris pembayaran */}
                <div style={{ padding: '6px 12px', borderBottom: '1px dashed #ccc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '10px' }}>1.</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '10px', color: '#111' }}>
                          Syahriah {strukData.bulan.includes('-') ? strukData.bulan.split('-').join(' ') : strukData.bulan}
                        </div>
                        <div style={{ color: '#999', fontSize: '9px' }}>{metode}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '10px' }}>{formatRupiah(metode === 'Lunas' ? strukData.totalBayarUtuh : strukData.nominal)}</span>
                  </div>
                </div>
                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px dashed #ccc', background: '#fafafa' }}>
                  <span style={{ fontWeight: 700, fontSize: '11px', color: '#111' }}>TOTAL PEMBAYARAN</span>
                  <span style={{ fontWeight: 900, fontSize: '12px', color: '#16a34a' }}>{formatRupiah(metode === 'Lunas' ? strukData.totalBayarUtuh : strukData.nominal)}</span>
                </div>
                {/* Tanda tangan */}
                <div style={{ padding: '8px 12px 4px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#555' }}>Yukum Jaya, {tanggalStruk}</div>
                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Bendahara,</div>
                    <div style={{ height: '36px' }} />
                    <div style={{ borderTop: '1px solid #333', paddingTop: '3px', minWidth: '100px' }}>
                      <div style={{ fontWeight: 700, fontSize: '9px', color: '#111' }}>{strukData.petugas}</div>
                    </div>
                    <div style={{ height: '8px' }} />
                  </div>
                </div>
                {/* Footer */}
                <div style={{ textAlign: 'center', padding: '6px 12px 12px', borderTop: '1px dashed #ccc' }}>
                  <div style={{ fontSize: '8px', color: '#888', fontStyle: 'italic' }}>Simpan struk ini sebagai bukti pembayaran yang sah</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSimpanCetak}
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs shadow-md">
                  <Printer className="w-5 h-5" /><span>Simpan &<br />Cetak</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSimpanKirim}
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl bg-success text-success-foreground font-semibold text-xs shadow-md">
                  <Send className="w-5 h-5" /><span>Simpan &<br />Kirim WA</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowStruk(false)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl border-2 border-border text-muted-foreground font-semibold text-xs hover:bg-muted transition-colors">
                  <LogOut className="w-5 h-5" /><span>Keluar</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

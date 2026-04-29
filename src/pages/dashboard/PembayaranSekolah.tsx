import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, CreditCard, Scan, Loader2, X, Printer, Send, LogOut } from 'lucide-react';
import { useStudents, useInsertPembayaran, useUpdateStudent, useCicilanBySiswa, useInsertCicilan, useDeleteCicilanBySiswaAndBulan, type StudentDB, type CicilanDB } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoYB from '@/assets/logo-yb.png';

const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// ── Helper: generate nomor referensi unik ──────────────────────────────────
function generateRefNo(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `YB-${yy}${mm}${dd}-${rand}`;
}

// ── Helper: tahun ajaran ────────────────────────────────────────────────────
function getTahunAjaran(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 7) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
}

// ── Helper: jenjang label (Khusus jika kategori=Khusus) ────────────────────
function getJenjangLabel(s: StudentDB): string {
  return s.kategori === 'Khusus' ? 'Khusus' : s.jenjang;
}

export default function PembayaranSekolah() {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentDB | null>(null);
  const [metode, setMetode] = useState<'Lunas' | 'Cicil' | 'Deposit'>('Lunas');
  const [selectedBulan, setSelectedBulan] = useState('');
  const [nominal, setNominal] = useState(0);
  const [nominalCicilInput, setNominalCicilInput] = useState('');
  const [showStruk, setShowStruk] = useState(false);
  const [strukData, setStrukData] = useState<any>(null);
  const [paperSize, setPaperSize] = useState<'thermal57' | 'thermal80' | 'a5' | 'a4'>('thermal57');
  const strukRef = useRef<HTMLDivElement>(null);

  const { data: students = [], isLoading } = useStudents();
  const { data: cicilanSiswa = [] } = useCicilanBySiswa(selectedStudent?.id);
  const insertPembayaran = useInsertPembayaran();
  const updateStudent = useUpdateStudent();
  const insertCicilan = useInsertCicilan();
  const deleteCicilan = useDeleteCicilanBySiswaAndBulan();
  const { userName } = useAuth();

  const hasTunggakan = selectedStudent ? selectedStudent.tunggakan_sekolah.length > 0 : false;

  const cicilanByBulan = useMemo(() => {
    const map: Record<string, CicilanDB[]> = {};
    cicilanSiswa.forEach(c => {
      if (!map[c.bulan]) map[c.bulan] = [];
      map[c.bulan].push(c);
    });
    return map;
  }, [cicilanSiswa]);

  const bulanWithCicilan = useMemo(() => Object.keys(cicilanByBulan), [cicilanByBulan]);
  const hasAnyCicilan = bulanWithCicilan.length > 0;

  const isLunasEnabled   = hasTunggakan;
  const isCicilEnabled   = hasTunggakan && !hasAnyCicilan;
  const isDepositEnabled = !hasTunggakan;

  if (isLoading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const searchResults = searchQuery.length >= 2
    ? students.filter(s =>
        s.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery)
      ).slice(0, 5)
    : [];

  const selectStudent = (s: StudentDB) => {
    setSelectedStudent(s);
    setSearchQuery('');
    setSelectedBulan('');
    setNominalCicilInput('');
    if (s.tunggakan_sekolah.length > 0) { setMetode('Lunas'); setNominal(s.biaya_per_bulan); }
    else { setMetode('Deposit'); setNominal(0); }
  };

  const handleBarcode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBarcodeQuery(val);
    const found = students.find(s => s.barcode === val);
    if (found) { selectStudent(found); setBarcodeQuery(''); }
  };

  const handleMetodeChange = (m: 'Lunas' | 'Cicil' | 'Deposit') => {
    const enabled = m === 'Cicil' ? isCicilEnabled : m === 'Lunas' ? isLunasEnabled : isDepositEnabled;
    if (!enabled) return;
    setMetode(m);
    setSelectedBulan('');
    setNominalCicilInput('');
    setNominal(0);
  };

  const getAvailableMonths = () => {
    if (!selectedStudent) return [];
    if (metode === 'Lunas') return selectedStudent.tunggakan_sekolah;
    if (metode === 'Cicil') return selectedStudent.tunggakan_sekolah.filter(b => !bulanWithCicilan.includes(b));
    if (metode === 'Deposit') {
      const currentMonth = new Date().getMonth();
      return bulanList.filter((_, i) => i > currentMonth);
    }
    return [];
  };

  const selectedBulanHasCicilan = selectedBulan ? (cicilanByBulan[selectedBulan]?.length > 0) : false;
  const totalCicilanForBulan = selectedBulan ? (cicilanByBulan[selectedBulan] || []).reduce((sum, c) => sum + c.nominal, 0) : 0;

  const getLunasNominal = () => {
    if (!selectedStudent || !selectedBulan) return 0;
    if (selectedBulanHasCicilan) return Math.max(0, selectedStudent.biaya_per_bulan - totalCicilanForBulan);
    return selectedStudent.biaya_per_bulan;
  };

  const handleBulanChange = (bulan: string) => {
    setSelectedBulan(bulan);
    if (metode === 'Lunas' && bulan && selectedStudent) {
      const cicilanTotal = (cicilanByBulan[bulan] || []).reduce((sum, c) => sum + c.nominal, 0);
      setNominal(Math.max(0, selectedStudent.biaya_per_bulan - cicilanTotal));
    }
  };

  const handleSubmit = () => {
    if (!selectedStudent || !selectedBulan) return;
    if (metode === 'Cicil') {
      const nomCicil = parseInt(nominalCicilInput) || 0;
      if (nomCicil <= 0) { toast.error('Nominal cicilan harus lebih dari 0'); return; }
      if (nomCicil >= selectedStudent.biaya_per_bulan) { toast.error('Gunakan metode Lunas untuk pembayaran penuh'); return; }
    }
    if (metode === 'Deposit') {
      const nomDeposit = parseInt(nominalCicilInput) || 0;
      if (nomDeposit <= 0) { toast.error('Nominal deposit harus lebih dari 0'); return; }
    }

    const tanggal = new Date().toISOString().split('T')[0];
    const lunasNominal  = getLunasNominal();
    const cicilNominal  = parseInt(nominalCicilInput) || 0;
    const depositNominal = parseInt(nominalCicilInput) || 0;
    const finalNominal  = metode === 'Lunas' ? lunasNominal : metode === 'Cicil' ? cicilNominal : depositNominal;

    const data = {
      siswa_id:   selectedStudent.id,
      nama_siswa: selectedStudent.nama_lengkap,
      nisn:       selectedStudent.nisn,
      jenjang:    selectedStudent.jenjang,
      kelas:      selectedStudent.kelas,
      bulan:      selectedBulan,
      nominal:    finalNominal,
      metode,
      tanggal,
      petugas:    userName || 'Petugas',
    };

    setStrukData({
      ...data,
      refNo: generateRefNo(),
      tahunAjaran: getTahunAjaran(),
      jenjangLabel: getJenjangLabel(selectedStudent),
      student: selectedStudent,
      hasCicilanAktif: selectedBulanHasCicilan,
      totalCicilanSebelumnya: totalCicilanForBulan,
      totalBayarUtuh: selectedStudent.biaya_per_bulan,
    });
    setShowStruk(true);
  };

  // ── Download PDF dengan ukuran kertas yang dipilih ─────────────────────
  const downloadStrukAsPDF = async (): Promise<boolean> => {
    if (!strukRef.current) return false;
    try {
      const images = strukRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      const canvas = await html2canvas(strukRef.current, {
        backgroundColor: '#ffffff', scale: 3, useCORS: true, allowTaint: true, logging: false,
      });
      const imgData   = canvas.toDataURL('image/png');
      const imgWidth  = canvas.width;
      const imgHeight = canvas.height;

      // Dimensi kertas (mm)
      const paperDims: Record<string, [number, number]> = {
        thermal57: [57, (imgHeight * 57) / imgWidth],
        thermal80: [80, (imgHeight * 80) / imgWidth],
        a5: [148, 210],
        a4: [210, 297],
      };
      const [pdfW, pdfH] = paperDims[paperSize];
      const printW = paperSize === 'a5' || paperSize === 'a4' ? pdfW - 20 : pdfW;
      const printH = (imgHeight * printW) / imgWidth;
      const offsetX = (pdfW - printW) / 2;
      const offsetY = paperSize === 'a5' || paperSize === 'a4' ? 10 : 3;

      const doc = new jsPDF({ unit: 'mm', format: [pdfW, Math.max(pdfH, printH + offsetY + 5)] });
      doc.addImage(imgData, 'PNG', offsetX, offsetY, printW, printH);
      doc.save(`struk-${strukData?.nama_siswa?.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
      return true;
    } catch (err) {
      toast.error('Gagal mendownload struk');
      return false;
    }
  };

  const saveData = () => {
    if (!strukData) return;
    const { student, hasCicilanAktif, totalCicilanSebelumnya, totalBayarUtuh, refNo, tahunAjaran, jenjangLabel, ...record } = strukData;
    if (metode === 'Cicil') {
      insertCicilan.mutate({ siswa_id: student.id, bulan: record.bulan, nominal: record.nominal, tanggal: record.tanggal, petugas: record.petugas });
    } else if (metode === 'Lunas') {
      insertPembayaran.mutate({ ...record, nominal: totalBayarUtuh, metode: 'Lunas' as const });
      updateStudent.mutate({ id: student.id, tunggakan_sekolah: student.tunggakan_sekolah.filter((b: string) => b !== record.bulan) });
      if (hasCicilanAktif) deleteCicilan.mutate({ siswa_id: student.id, bulan: record.bulan });
    } else if (metode === 'Deposit') {
      insertPembayaran.mutate(record);
      updateStudent.mutate({ id: student.id, deposit: (student.deposit || 0) + record.nominal });
    }
  };

  const resetForm = () => {
    setShowStruk(false);
    setSelectedStudent(null);
    setSelectedBulan('');
    setNominalCicilInput('');
  };

  const handleSimpanCetak = async () => {
    if (!strukData) return;
    const downloaded = await downloadStrukAsPDF();
    if (!downloaded) return;
    saveData();
    window.print();
    resetForm();
    toast.success('Data tersimpan & struk dicetak');
  };

  const handleSimpanKirim = async () => {
    if (!strukData) return;
    const downloaded = await downloadStrukAsPDF();
    if (!downloaded) return;
    saveData();
    const nominalText = formatRupiah(metode === 'Lunas' ? strukData.totalBayarUtuh : strukData.nominal);
    const msg = `Assalamu'alaikum,\n\nBerikut struk pembayaran SPP:\n\nNo. Ref: ${strukData.refNo}\nNama: ${strukData.nama_siswa}\nNISN: ${strukData.nisn}\nJenjang/Kelas: ${strukData.jenjangLabel} - ${strukData.kelas}\nBulan: ${strukData.bulan}\nMetode: ${strukData.metode}\nNominal: ${nominalText}\nTanggal: ${formatDate(strukData.tanggal)}\nPetugas: ${strukData.petugas}\n\nTerima kasih atas pembayarannya.\n\n- Yayasan Baitulloh`;
    const phone = strukData.student?.nomor_whatsapp?.replace(/^0/, '62')?.replace(/[^0-9]/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    resetForm();
    toast.success('Data tersimpan & struk dikirim via WhatsApp');
  };

  const effectiveMetode = (() => {
    if (metode === 'Cicil' && !isCicilEnabled) return isLunasEnabled ? 'Lunas' : 'Deposit';
    if (metode === 'Deposit' && !isDepositEnabled) return isLunasEnabled ? 'Lunas' : 'Cicil';
    return metode;
  })();
  if (effectiveMetode !== metode && selectedStudent) setTimeout(() => setMetode(effectiveMetode), 0);

  const availableMonths = getAvailableMonths();
  const now = new Date();
  const tanggalStruk = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pembayaran Sekolah</h1>
        <p className="text-muted-foreground text-sm mt-1">Proses pembayaran SPP siswa</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl border border-border p-6 shadow-elegant">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Search className="w-4 h-4 text-primary-foreground" /></div>
          Cari Siswa
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
                    <motion.button key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => selectStudent(s)} className="w-full text-left px-4 py-3.5 hover:bg-muted/70 transition-all flex items-center gap-3 border-b border-border/30 last:border-0">
                      <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center"><User className="w-4 h-4 text-primary-foreground" /></div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.nama_lengkap}</p>
                        <p className="text-xs text-muted-foreground">{s.nisn} · {getJenjangLabel(s)} {s.kelas}</p>
                      </div>
                      {s.tunggakan_sekolah.length > 0 && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">{s.tunggakan_sekolah.length} tunggakan</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={barcodeQuery} onChange={handleBarcode} placeholder="Scan barcode siswa..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedStudent && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Info Siswa */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-elegant">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-info flex items-center justify-center"><User className="w-4 h-4 text-info-foreground" /></div>
                Informasi Siswa
              </h3>
              <div className="flex items-center gap-4 p-5 rounded-2xl gradient-card border border-border mb-5">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary"><User className="w-8 h-8 text-primary-foreground" /></div>
                <div>
                  <h4 className="font-extrabold text-foreground text-lg">{selectedStudent.nama_lengkap}</h4>
                  <p className="text-sm text-muted-foreground">NISN: {selectedStudent.nisn}</p>
                  <div className="flex gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedStudent.kategori === 'Khusus' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
                      {getJenjangLabel(selectedStudent)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">Kelas {selectedStudent.kelas}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between p-4 rounded-xl bg-muted/50 border border-border">
                  <span className="text-sm text-muted-foreground">Jumlah Tunggakan</span>
                  <span className={`text-sm font-extrabold ${hasTunggakan ? 'text-destructive' : 'text-success'}`}>
                    {hasTunggakan ? `${selectedStudent.tunggakan_sekolah.length} bulan` : 'Nihil ✓'}
                  </span>
                </div>
                {hasTunggakan && (
                  <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Bulan Tunggakan</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudent.tunggakan_sekolah.map(b => (
                        <span key={b} className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between p-4 rounded-xl bg-muted/50 border border-border">
                  <span className="text-sm text-muted-foreground">Biaya/Bulan</span>
                  <span className="text-sm font-extrabold text-foreground">{formatRupiah(selectedStudent.biaya_per_bulan)}</span>
                </div>
                <div className="flex justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/15">
                  <span className="text-sm font-semibold text-muted-foreground">Total Tunggakan</span>
                  <span className="text-sm font-extrabold text-destructive">{formatRupiah(selectedStudent.tunggakan_sekolah.length * selectedStudent.biaya_per_bulan)}</span>
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
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                          metode === m && enabled ? 'gradient-primary text-primary-foreground shadow-glow-primary' :
                          enabled ? 'bg-muted text-muted-foreground hover:bg-muted/80' :
                          'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
                        }`}>{m}</motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Bulan</label>
                  <select value={selectedBulan} onChange={e => handleBulanChange(e.target.value)} disabled={availableMonths.length === 0}
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground input-focus text-sm disabled:opacity-50">
                    <option value="">{availableMonths.length === 0 ? 'Tidak ada bulan tersedia' : 'Pilih bulan'}</option>
                    {availableMonths.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nominal</label>
                  {metode === 'Cicil' ? (
                    <input type="number" value={nominalCicilInput} onChange={e => setNominalCicilInput(e.target.value)}
                      placeholder="Masukkan nominal cicilan..."
                      className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground input-focus text-sm" />
                  ) : metode === 'Lunas' && selectedBulan ? (
                    <div className="px-4 py-3.5 rounded-xl bg-muted border border-border text-foreground font-bold text-lg">
                      {formatRupiah(getLunasNominal())}
                      <span className="text-xs font-normal text-muted-foreground ml-2">{selectedBulanHasCicilan ? '(sisa cicilan)' : '(bayar penuh)'}</span>
                    </div>
                  ) : metode === 'Deposit' ? (
                    <input type="number" value={nominalCicilInput} onChange={e => setNominalCicilInput(e.target.value)}
                      placeholder="Masukkan nominal deposit..."
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl border border-border p-16 shadow-elegant text-center">
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5"><Search className="w-10 h-10 text-muted-foreground/30" /></div>
          <h3 className="font-bold text-foreground text-lg mb-2">Pilih Siswa</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">Cari siswa berdasarkan nama, NISN, atau scan barcode</p>
        </motion.div>
      )}

      {/* ── STRUK POPUP ── */}
      <AnimatePresence>
        {showStruk && strukData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowStruk(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-lg p-7 max-h-[95vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-lg">Struk Pembayaran</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowStruk(false)} className="p-2 rounded-full hover:bg-muted">
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Pilih ukuran kertas */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">Ukuran Kertas</label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { key: 'thermal57', label: '57mm' },
                    { key: 'thermal80', label: '80mm' },
                    { key: 'a5',        label: 'A5' },
                    { key: 'a4',        label: 'A4' },
                  ] as const).map(p => (
                    <button key={p.key} onClick={() => setPaperSize(p.key)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${paperSize === p.key ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── STRUK CONTENT ── */}
              <div ref={strukRef} className="bg-white rounded-2xl overflow-hidden"
                style={{ fontFamily: 'Arial, sans-serif', fontSize: paperSize === 'thermal57' ? '10px' : paperSize === 'thermal80' ? '11px' : '13px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', padding: '16px 12px 10px', borderBottom: '1px dashed #ccc' }}>
                  <img src={logoYB} alt="Logo" style={{ width: paperSize === 'thermal57' ? '36px' : '48px', height: paperSize === 'thermal57' ? '36px' : '48px', margin: '0 auto 6px', display: 'block', objectFit: 'contain' }} />
                  <div style={{ fontWeight: 900, fontSize: paperSize === 'thermal57' ? '12px' : '15px', letterSpacing: '1px', color: '#111', marginBottom: '2px' }}>
                    YAYASAN BAITULLOH
                  </div>
                  <div style={{ fontSize: paperSize === 'thermal57' ? '8px' : '10px', color: '#888', fontWeight: 300, lineHeight: 1.4 }}>
                    Jl. Bintara RT 006 RW 003, Lingkungan II Kel.Yukum Jaya, Kec. Terbanggi Besar, Kab.Lampung Tengah, Lampung<br />
                    Telp: (0725) XXXXXX
                  </div>
                </div>

                {/* Judul */}
                <div style={{ textAlign: 'center', padding: '8px 12px 6px', background: '#f8f9fa' }}>
                  <div style={{ fontWeight: 700, fontSize: paperSize === 'thermal57' ? '10px' : '12px', letterSpacing: '1.5px', color: '#333', textTransform: 'uppercase' }}>
                    Pembayaran Sekolah
                  </div>
                </div>

                {/* Info Pembayaran */}
                <div style={{ padding: '8px 12px', borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc' }}>
                  {[
                    ['No. Referensi', strukData.refNo],
                    ['Tahun Ajaran', strukData.tahunAjaran],
                    ['Tanggal Pembayaran', formatDate(strukData.tanggal)],
                    ['NISN', strukData.nisn],
                    ['Nama Siswa', strukData.nama_siswa],
                    ['Jenjang / Kelas', `${strukData.jenjangLabel} / ${strukData.kelas}`],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'flex-start' }}>
                      <span style={{ color: '#666', fontSize: paperSize === 'thermal57' ? '8.5px' : '11px', minWidth: '45%' }}>{label}</span>
                      <span style={{ color: '#111', fontWeight: 600, fontSize: paperSize === 'thermal57' ? '8.5px' : '11px', textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Header tabel pembayaran */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#f0f0f0', borderBottom: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#555', fontWeight: 700, fontSize: paperSize === 'thermal57' ? '8px' : '10px' }}>NO.</span>
                    <span style={{ color: '#555', fontWeight: 700, fontSize: paperSize === 'thermal57' ? '8px' : '10px' }}>PEMBAYARAN</span>
                  </div>
                  <span style={{ color: '#555', fontWeight: 700, fontSize: paperSize === 'thermal57' ? '8px' : '10px' }}>JUMLAH</span>
                </div>

                {/* Baris pembayaran */}
                <div style={{ padding: '6px 12px', borderBottom: '1px dashed #ccc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#111', fontSize: paperSize === 'thermal57' ? '9px' : '11px' }}>1.</span>
                      <div>
                        <div style={{ color: '#111', fontWeight: 600, fontSize: paperSize === 'thermal57' ? '9px' : '11px' }}>
                          SPP {strukData.bulan} {new Date().getFullYear()}
                        </div>
                        <div style={{ color: '#999', fontSize: paperSize === 'thermal57' ? '7.5px' : '9px', marginTop: '1px' }}>
                          {metode === 'Lunas' && strukData.hasCicilanAktif ? 'Pelunasan Cicilan' : metode}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: '#111', fontWeight: 600, fontSize: paperSize === 'thermal57' ? '9px' : '11px' }}>
                      {formatRupiah(metode === 'Lunas' ? strukData.totalBayarUtuh : strukData.nominal)}
                    </span>
                  </div>

                  {/* Rincian cicilan jika ada */}
                  {metode === 'Lunas' && strukData.hasCicilanAktif && (
                    <div style={{ marginTop: '4px', paddingLeft: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: paperSize === 'thermal57' ? '7.5px' : '9px' }}>
                        <span>Cicilan sebelumnya</span>
                        <span>{formatRupiah(strukData.totalCicilanSebelumnya)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999', fontSize: paperSize === 'thermal57' ? '7.5px' : '9px' }}>
                        <span>Pelunasan sekarang</span>
                        <span>{formatRupiah(strukData.nominal)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px dashed #ccc', background: '#fafafa' }}>
                  <span style={{ fontWeight: 700, fontSize: paperSize === 'thermal57' ? '10px' : '13px', color: '#111' }}>TOTAL PEMBAYARAN</span>
                  <span style={{ fontWeight: 900, fontSize: paperSize === 'thermal57' ? '11px' : '14px', color: '#16a34a' }}>
                    {formatRupiah(metode === 'Lunas' ? strukData.totalBayarUtuh : strukData.nominal)}
                  </span>
                </div>

                {/* Tanda Tangan */}
                <div style={{ padding: '8px 12px 4px', display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: paperSize === 'thermal57' ? '8px' : '10px', color: '#555' }}>
                      Yukum Jaya, {tanggalStruk}
                    </div>
                    <div style={{ fontSize: paperSize === 'thermal57' ? '8px' : '10px', color: '#555', marginTop: '2px' }}>
                      Petugas,
                    </div>
                    <div style={{ height: paperSize === 'thermal57' ? '22px' : '30px' }} />
                    <div style={{ borderTop: '1px solid #333', paddingTop: '3px', minWidth: paperSize === 'thermal57' ? '80px' : '100px' }}>
                      <div style={{ fontWeight: 700, fontSize: paperSize === 'thermal57' ? '8.5px' : '11px', color: '#111' }}>
                        {strukData.petugas}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', padding: '6px 12px 12px', borderTop: '1px dashed #ccc' }}>
                  <div style={{ fontSize: paperSize === 'thermal57' ? '7.5px' : '9.5px', color: '#888', fontStyle: 'italic' }}>
                    Simpan struk ini sebagai bukti pembayaran yang sah
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSimpanCetak}
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs shadow-md">
                  <Printer className="w-5 h-5" />
                  <span>Simpan &<br />Cetak</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleSimpanKirim}
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl bg-success text-success-foreground font-semibold text-xs shadow-md">
                  <Send className="w-5 h-5" />
                  <span>Simpan &<br />Kirim WA</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setShowStruk(false)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 px-3 rounded-2xl border-2 border-border text-muted-foreground font-semibold text-xs hover:bg-muted transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span>Keluar</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

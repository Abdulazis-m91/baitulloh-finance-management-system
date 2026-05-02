import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Printer, X, AlertCircle, Receipt, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePengeluaran, useInsertPengeluaran, usePembayaran } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoYB from '@/assets/logo-yb.png';

type Tab = 'pengeluaran' | 'rekap_smp' | 'rekap_sma' | 'rekap_khusus';

const PAGE_SIZE_RIWAYAT = 5;

const tataTertib = [
  'Setiap transaksi pengeluaran wajib disertai bukti/nota yang sah.',
  'Pengeluaran hanya dapat dilakukan oleh petugas yang berwenang.',
  'Setiap pengeluaran di atas Rp 500.000 harus mendapat persetujuan kepala yayasan.',
  'Nota pengeluaran wajib dicetak dan diarsipkan secara fisik maupun digital.',
  'Petugas bertanggung jawab penuh atas keakuratan data yang diinput ke sistem.',
];

const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function generateRefNo(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `YBS-${yy}${mm}${dd}-${rand}`;
}

export default function PengeluaranSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('pengeluaran');
  const [keterangan, setKeterangan] = useState('');
  const [sumberDana, setSumberDana] = useState<'SMP' | 'SMA'>('SMP');
  const [jenisKeperluan, setJenisKeperluan] = useState('');
  const [nominal, setNominal] = useState('');
  const [showNota, setShowNota] = useState(false);
  const [notaData, setNotaData] = useState<any>(null);
  const [riwayatPage, setRiwayatPage] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const notaRef = useRef<HTMLDivElement>(null);

  const { data: pengeluaranList = [], isLoading } = usePengeluaran();
  const { data: pembayaranList = [] } = usePembayaran();
  const insertPengeluaran = useInsertPengeluaran();
  const { userName } = useAuth();

  // Hitung saldo tersedia per dana (pemasukan - pengeluaran)
  const getSaldoDana = (dana: 'SMP' | 'SMA' | 'Reguler') => {
    const nowObj = new Date();
    const bulanNamaArr = ['Januari','Februari','Maret','April','Mei','Juni',
      'Juli','Agustus','September','Oktober','November','Desember'];
    const nmBulanIni = bulanNamaArr[nowObj.getMonth()];
    const thnIni = nowObj.getFullYear();
    // Pemasukan hanya bulan ini (filter by kolom bulan)
    const pemasukan = pembayaranList
      .filter(p => {
        if (p.jenjang !== dana || p.metode !== 'Lunas') return false;
        const parts = (p.bulan || '').split('-');
        const nm = parts[0];
        const thn = parts.length > 1 ? parseInt(parts[1]) : thnIni;
        return nm === nmBulanIni && thn === thnIni;
      })
      .reduce((a, p) => a + p.nominal, 0);
    // Pengeluaran hanya bulan ini (filter by tanggal)
    const pengeluaran = pengeluaranList
      .filter(e => {
        if (e.sumber_dana !== dana) return false;
        const d = new Date(e.tanggal);
        return d.getMonth() === nowObj.getMonth() && d.getFullYear() === nowObj.getFullYear();
      })
      .reduce((a, e) => a + e.nominal, 0);
    return pemasukan - pengeluaran;
  };

  const saldoSumberDana = getSaldoDana(sumberDana === 'SMP' ? 'SMP' : sumberDana === 'SMA' ? 'SMA' : 'Reguler');
  const nominalInput = parseInt(nominal.replace(/\D/g, '') || '0');
  const sisaSetelahInput = saldoSumberDana - nominalInput;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const handleSubmit = () => {
    if (!keterangan || !jenisKeperluan || !nominal) { toast.error('Mohon lengkapi semua field'); return; }
    const data = {
      keterangan,
      sumber_dana: sumberDana,
      jenis_keperluan: jenisKeperluan,
      nominal: parseInt(nominal.replace(/\D/g, '')),
      tanggal: new Date().toISOString().split('T')[0],
      petugas: userName || 'Petugas',
    };
    setNotaData({ ...data, refNo: generateRefNo() });
    setShowNota(true);
  };

  const downloadNotaAsPDF = async (): Promise<boolean> => {
    if (!notaRef.current) return false;
    try {
      const images = notaRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      const canvas = await html2canvas(notaRef.current, {
        backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: true, logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const doc = new jsPDF({ unit: 'mm', format: [pdfWidth, pdfHeight + 10] });
      doc.addImage(imgData, 'PNG', 0, 5, pdfWidth, pdfHeight);
      doc.save(`nota-pengeluaran-sekolah-${Date.now()}.pdf`);
      return true;
    } catch (err) {
      toast.error('Gagal mendownload nota');
      return false;
    }
  };

  const doSave = () => {
    if (!notaData) return;
    const { refNo, ...record } = notaData;
    insertPengeluaran.mutate(record);
    setShowNota(false);
    setKeterangan(''); setNominal(''); setJenisKeperluan('');
    setRiwayatPage(1);
    toast.success('Data pengeluaran berhasil disimpan');
  };

  const handleSimpanCetak = async () => {
    if (!notaData) return;
    setIsSaving(true);
    const downloaded = await downloadNotaAsPDF();
    setIsSaving(false);
    if (downloaded) { doSave(); }
  };

  const handleSimpanSaja = () => { doSave(); };

  // Rekap hanya bulan ini
  const nowRekap = new Date();
  const rekapData = (jenjang: string) => pengeluaranList.filter(e => {
    if (e.sumber_dana !== jenjang) return false;
    const d = new Date(e.tanggal);
    return d.getMonth() === nowRekap.getMonth() && d.getFullYear() === nowRekap.getFullYear();
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const rekapBulanIni = (jenjang: string) =>
    rekapData(jenjang).filter(e => {
      const d = new Date(e.tanggal);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

  const exportRekap = (jenjang: string) => {
    const ws = XLSX.utils.json_to_sheet(rekapData(jenjang).map(d => ({
      Tanggal: formatDate(d.tanggal), Keterangan: d.keterangan,
      Jenis: d.jenis_keperluan, Nominal: d.nominal, Petugas: d.petugas,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Rekap ${jenjang}`);
    XLSX.writeFile(wb, `rekap_pengeluaran_${jenjang.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  // Riwayat hanya bulan ini
  const nowRiwayat = new Date();
  const riwayatBulanIni = pengeluaranList.filter(e => {
    const d = new Date(e.tanggal);
    return d.getMonth() === nowRiwayat.getMonth() && d.getFullYear() === nowRiwayat.getFullYear();
  });
  const totalRiwayatPages = Math.max(1, Math.ceil(riwayatBulanIni.length / PAGE_SIZE_RIWAYAT));
  const pagedRiwayat = riwayatBulanIni.slice(
    (riwayatPage - 1) * PAGE_SIZE_RIWAYAT,
    riwayatPage * PAGE_SIZE_RIWAYAT
  );

  const tanggalStruk = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pengeluaran Sekolah</h1>
        <p className="text-muted-foreground text-sm mt-1">Catat dan kelola pengeluaran keuangan</p>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit">
        {([
          { key: 'pengeluaran' as Tab, label: 'Pengeluaran' },
          { key: 'rekap_smp' as Tab, label: 'Rekap SMP' },
          { key: 'rekap_sma' as Tab, label: 'Rekap SMA' },
          { key: 'rekap_khusus' as Tab, label: 'Rekap Khusus' },
        ]).map(tab => (
          <motion.button key={tab.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {activeTab === 'pengeluaran' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card rounded-3xl border border-border p-7 shadow-elegant">
            <h3 className="font-bold text-foreground mb-5 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg gradient-danger flex items-center justify-center">
                <Receipt className="w-4 h-4 text-destructive-foreground" />
              </div>
              Form Pengeluaran
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Keterangan</label>
                <input value={keterangan} onChange={e => setKeterangan(e.target.value)}
                  placeholder="Contoh: Pembelian ATK"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Sumber Dana</label>
                  <select value={sumberDana} onChange={e => setSumberDana(e.target.value as any)}
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="Reguler">Khusus</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Jenis</label>
                  <select value={jenisKeperluan} onChange={e => setJenisKeperluan(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                    <option value="">Pilih</option>
                    <option value="Perlengkapan Sekolah">Perlengkapan</option>
                    <option value="Kebutuhan Kantor">Kantor</option>
                    <option value="Gaji">Gaji</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>
              {/* Saldo tersedia */}
              <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm ${
                saldoSumberDana <= 0 ? 'bg-destructive/5 border-destructive/20' :
                sisaSetelahInput < 0 ? 'bg-warning/5 border-warning/20' :
                'bg-success/5 border-success/20'
              }`}>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                    Total Nominal Dana {sumberDana === 'Reguler' ? 'Khusus' : sumberDana}
                  </p>
                  <p className={`font-extrabold text-lg ${saldoSumberDana <= 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatRupiah(saldoSumberDana)}
                  </p>
                </div>
                {nominalInput > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                      Sisa Setelah Pengeluaran
                    </p>
                    <p className={`font-extrabold text-lg ${sisaSetelahInput < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {formatRupiah(sisaSetelahInput)}
                    </p>
                  </div>
                )}
              </div>
              {sisaSetelahInput < 0 && nominalInput > 0 && (
                <p className="text-xs text-warning font-semibold flex items-center gap-1">
                  ⚠️ Nominal melebihi saldo dana {sumberDana === 'Reguler' ? 'Khusus' : sumberDana}
                </p>
              )}

              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nominal</label>
                <input value={nominal ? formatRupiah(parseInt(nominal)) : ''}
                  onChange={e => setNominal(e.target.value.replace(/\D/g, ''))}
                  placeholder="Rp 0"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSubmit}
                className="w-full py-3.5 rounded-xl gradient-danger text-destructive-foreground font-bold btn-shine">
                Keluarkan Uang
              </motion.button>
            </div>
            <div className="mt-6 p-5 rounded-2xl bg-muted/50 border border-border">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-warning" /> Tata Tertib
              </h4>
              <ol className="space-y-2">
                {tataTertib.map((t, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="w-5 h-5 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-[10px]">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>

          {/* Riwayat */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl border border-border shadow-elegant flex flex-col" style={{ minHeight: '520px' }}>
            <div className="px-7 pt-7 pb-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">Riwayat Pengeluaran</h3>
              <span className="text-xs text-muted-foreground">{riwayatBulanIni.length} transaksi bulan ini</span>
            </div>
            <div className="flex-1 px-7 py-4 space-y-3 overflow-hidden">
              {pagedRiwayat.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                  <Receipt className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Belum ada pengeluaran</p>
                </div>
              ) : pagedRiwayat.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors group cursor-default">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[60%]">{e.keterangan}</p>
                    <span className="text-sm font-extrabold text-destructive">{formatRupiah(e.nominal)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(e.tanggal)}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold">{e.sumber_dana}</span>
                    <span>{e.jenis_keperluan}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="px-7 py-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Halaman <span className="font-bold text-foreground">{riwayatPage}</span> dari{' '}
                <span className="font-bold text-foreground">{totalRiwayatPages}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => setRiwayatPage(p => Math.max(1, p - 1))} disabled={riwayatPage === 1}
                  className="p-2 rounded-xl border border-border bg-background disabled:opacity-30 hover:bg-muted transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setRiwayatPage(p => Math.min(totalRiwayatPages, p + 1))} disabled={riwayatPage === totalRiwayatPages}
                  className="p-2 rounded-xl border border-border bg-background disabled:opacity-30 hover:bg-muted transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Rekap */}
      {(activeTab === 'rekap_smp' || activeTab === 'rekap_sma' || activeTab === 'rekap_khusus') && (() => {
        const jenjang = activeTab === 'rekap_smp' ? 'SMP' : activeTab === 'rekap_sma' ? 'SMA' : 'Reguler';
        const jenjangLabel = activeTab === 'rekap_khusus' ? 'Khusus' : jenjang;
        const data = rekapData(jenjang);
        const dataBulanIni = rekapBulanIni(jenjang);
        const totalBulanIni = dataBulanIni.reduce((s, e) => s + e.nominal, 0);
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex justify-end">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => exportRekap(jenjang)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
                <Download className="w-4 h-4" /> Export Excel
              </motion.button>
            </div>
            <div className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    {['No', 'Tanggal', 'Keterangan', 'Jenis', 'Nominal', 'Petugas'].map(h => (
                      <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${h === 'Nominal' ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && (
                    <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">Belum ada data pengeluaran {jenjangLabel}</td></tr>
                  )}
                  {data.map((e, i) => (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                      <td className="py-4 px-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">{formatDate(e.tanggal)}</td>
                      <td className="py-4 px-4 text-foreground font-semibold">{e.keterangan}</td>
                      <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-bold">{e.jenis_keperluan}</span></td>
                      <td className="py-4 px-4 text-right text-destructive font-bold whitespace-nowrap">{formatRupiah(e.nominal)}</td>
                      <td className="py-4 px-4 text-muted-foreground">{e.petugas}</td>
                    </motion.tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 border-t-2 border-border">
                    <td colSpan={2} className="py-4 px-4 font-extrabold text-foreground text-sm">TOTAL</td>
                    <td className="py-4 px-4 text-xs text-muted-foreground font-semibold">{bulanNames[currentMonth]} {currentYear}</td>
                    <td className="py-4 px-4 text-xs text-muted-foreground font-semibold">{dataBulanIni.length} Transaksi</td>
                    <td className="py-4 px-4 text-right font-extrabold text-destructive text-base">{formatRupiah(totalBulanIni)}</td>
                    <td className="py-4 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        );
      })()}

      {/* Nota Popup */}
      <AnimatePresence>
        {showNota && notaData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowNota(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-7 max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-lg">Nota Pengeluaran Sekolah</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNota(false)} className="p-2 rounded-full hover:bg-muted">
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Struk Profesional */}
              <div ref={notaRef} className="bg-white rounded-xl overflow-hidden" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
                {/* Header biru */}
                <div style={{ background: '#1e40af', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={logoYB} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px' }} />
                  <div>
                    <div style={{ color: '#fff', fontWeight: 900, fontSize: '13px', letterSpacing: '0.5px' }}>YAYASAN BAITULLOH</div>
                    <div style={{ color: '#bfdbfe', fontSize: '9px' }}>Nota Pengeluaran Sekolah</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '10px' }}>NOTA PENGELUARAN</div>
                    <div style={{ color: '#bfdbfe', fontSize: '9px' }}>{notaData.refNo}</div>
                  </div>
                </div>
                {/* Garis emas */}
                <div style={{ height: '3px', background: '#a17810' }} />
                {/* Body */}
                <div style={{ padding: '10px 14px' }}>
                  <div style={{ background: '#1e40af', padding: '4px 8px', borderRadius: '4px', marginBottom: '6px' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '9px', letterSpacing: '0.5px' }}>DETAIL TRANSAKSI</span>
                  </div>
                  {[
                    ['No. Referensi', notaData.refNo],
                    ['Tanggal', formatDate(notaData.tanggal)],
                    ['Keterangan', notaData.keterangan],
                    ['Sumber Dana', notaData.sumber_dana],
                    ['Jenis Keperluan', notaData.jenis_keperluan],
                    ['Petugas', notaData.petugas],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '3px' }}>
                      <span style={{ color: '#6b7280', fontSize: '10px' }}>{l}</span>
                      <span style={{ color: '#111', fontWeight: 600, fontSize: '10px', textAlign: 'right', maxWidth: '55%' }}>{v}</span>
                    </div>
                  ))}
                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', marginTop: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '11px', color: '#111' }}>TOTAL PENGELUARAN</span>
                    <span style={{ fontWeight: 900, fontSize: '13px', color: '#dc2626' }}>{formatRupiah(notaData.nominal)}</span>
                  </div>
                  {/* TTD */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', color: '#555' }}>Yukum Jaya, {tanggalStruk}</div>
                      <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Bendahara,</div>
                      <div style={{ height: '28px' }} />
                      <div style={{ borderTop: '1px solid #333', paddingTop: '2px', minWidth: '90px' }}>
                        <div style={{ fontWeight: 700, fontSize: '9px', color: '#111' }}>{notaData.petugas}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div style={{ height: '2px', background: '#a17810' }} />
                <div style={{ background: '#f8fafc', padding: '5px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '8px', color: '#9ca3af', fontStyle: 'italic' }}>Dokumen ini sah sebagai bukti pengeluaran Yayasan Baitulloh</span>
                </div>
              </div>

              {/* 3 Tombol */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSimpanCetak} disabled={isSaving}
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-semibold text-xs shadow-md disabled:opacity-50">
                  <Printer className="w-5 h-5" />
                  <span>Simpan &<br />Cetak</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSimpanSaja}
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl gradient-success text-success-foreground font-semibold text-xs shadow-md">
                  <Download className="w-5 h-5" />
                  <span>Simpan</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNota(false)}
                  className="flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-2xl border-2 border-border text-muted-foreground font-semibold text-xs hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                  <span>Batal</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

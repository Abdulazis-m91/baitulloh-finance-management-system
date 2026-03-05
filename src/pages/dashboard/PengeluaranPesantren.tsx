import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Printer, X, AlertCircle, Receipt, Loader2 } from 'lucide-react';
import { usePengeluaranPesantren, useInsertPengeluaranPesantren, useKonsumsiPesantren, useOperasionalPesantren, usePembangunanPesantren } from '@/hooks/useSupabasePesantren';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoYB from '@/assets/logo-yb.png';

type Tab = 'pengeluaran' | 'konsumsi' | 'operasional' | 'pembangunan';

const tataTertib = [
  'Setiap transaksi pengeluaran wajib disertai bukti/nota yang sah.',
  'Pengeluaran hanya dapat dilakukan oleh petugas yang berwenang.',
  'Setiap pengeluaran di atas Rp 500.000 harus mendapat persetujuan kepala yayasan.',
  'Nota pengeluaran wajib dicetak dan diarsipkan secara fisik maupun digital.',
  'Petugas bertanggung jawab penuh atas keakuratan data yang diinput ke sistem.',
];

const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function PengeluaranPesantren() {
  const [activeTab, setActiveTab] = useState<Tab>('pengeluaran');
  const [keterangan, setKeterangan] = useState('');
  const [danaDigunakan, setDanaDigunakan] = useState('');
  const [jenisKeperluan, setJenisKeperluan] = useState('');
  const [nominal, setNominal] = useState('');
  const [showNota, setShowNota] = useState(false);
  const [notaData, setNotaData] = useState<any>(null);
  const notaRef = useRef<HTMLDivElement>(null);

  const { data: pengeluaranList = [], isLoading: l1 } = usePengeluaranPesantren();
  const { data: konsumsiList = [], isLoading: l2 } = useKonsumsiPesantren();
  const { data: operasionalList = [], isLoading: l3 } = useOperasionalPesantren();
  const { data: pembangunanList = [], isLoading: l4 } = usePembangunanPesantren();
  const insertPengeluaran = useInsertPengeluaranPesantren();

  if (l1 || l2 || l3 || l4) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const handleSubmit = () => {
    if (!keterangan || !danaDigunakan || !jenisKeperluan || !nominal) { toast.error('Mohon lengkapi semua field'); return; }
    const data = { keterangan, jenis_keperluan: `${danaDigunakan} - ${jenisKeperluan}`, nominal: parseInt(nominal.replace(/\D/g, '')), tanggal: new Date().toISOString().split('T')[0], petugas: 'Petugas Pesantren' };
    setNotaData({ ...data, dana_digunakan: danaDigunakan, jenis: jenisKeperluan });
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
      const canvas = await html2canvas(notaRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 80;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const doc = new jsPDF({ unit: 'mm', format: [pdfWidth, pdfHeight + 10] });
      doc.addImage(imgData, 'PNG', 0, 5, pdfWidth, pdfHeight);
      doc.save(`nota-pengeluaran-pesantren-${Date.now()}.pdf`);
      return true;
    } catch (err) {
      console.error('Download nota PDF error:', err);
      toast.error('Gagal mendownload nota');
      return false;
    }
  };

  const saveNota = async () => {
    if (notaData) {
      const downloaded = await downloadNotaAsPDF();
      if (downloaded) {
        insertPengeluaran.mutate({ keterangan: notaData.keterangan, jenis_keperluan: notaData.jenis_keperluan, nominal: notaData.nominal, tanggal: notaData.tanggal, petugas: notaData.petugas });
        setShowNota(false);
        setKeterangan('');
        setDanaDigunakan('');
        setNominal('');
        setJenisKeperluan('');
        toast.success('Nota berhasil didownload & data tersimpan');
      }
    }
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filterByMonth = (list: any[]) => list.filter(e => {
    const d = new Date(e.tanggal);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const getRekapData = () => {
    if (activeTab === 'konsumsi') return konsumsiList;
    if (activeTab === 'operasional') return operasionalList;
    if (activeTab === 'pembangunan') return pembangunanList;
    return [];
  };

  const rekapData = getRekapData();
  const rekapBulanIni = filterByMonth(rekapData);
  const totalRekapBulanIni = rekapBulanIni.reduce((s, e) => s + (e.nominal || 0), 0);

  const pengeluaranBulanIni = filterByMonth(pengeluaranList);
  const totalPengeluaranBulanIni = pengeluaranBulanIni.reduce((s, e) => s + e.nominal, 0);

  const exportRekap = (label: string, data: any[]) => {
    const ws = XLSX.utils.json_to_sheet(data.map(d => ({ Tanggal: formatDate(d.tanggal), Nama: d.nama_siswa || d.keterangan || '-', Kategori: d.kategori || '-', Bulan: d.bulan || '-', Nominal: d.nominal, Petugas: d.petugas })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, label);
    XLSX.writeFile(wb, `rekap_${label.toLowerCase()}_pesantren.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  const tabList: { key: Tab; label: string; icon: string }[] = [
    { key: 'pengeluaran', label: 'Pengeluaran', icon: '📝' },
    { key: 'konsumsi', label: 'Konsumsi', icon: '🍚' },
    { key: 'operasional', label: 'Operasional', icon: '🏗️' },
    { key: 'pembangunan', label: 'Pembangunan', icon: '🏢' },
  ];

  const rekapHeaders = activeTab === 'pengeluaran'
    ? ['No', 'Tanggal', 'Keterangan', 'Jenis', 'Nominal', 'Petugas']
    : ['No', 'Tanggal', 'Nama', 'Kategori', 'Bulan', 'Nominal', 'Petugas'];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pengeluaran Pesantren</h1>
        <p className="text-muted-foreground text-sm mt-1">Catat dan kelola pengeluaran keuangan pesantren</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 bg-muted p-1.5 rounded-2xl flex-wrap">
        {tabList.map(tab => (
          <motion.button key={tab.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab(tab.key)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.icon} {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {activeTab === 'pengeluaran' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl border border-border p-7 shadow-elegant">
            <h3 className="font-bold text-foreground mb-5 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg gradient-danger flex items-center justify-center"><Receipt className="w-4 h-4 text-destructive-foreground" /></div>
              Form Pengeluaran Pesantren
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Keterangan</label>
                <input value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Contoh: Pembelian bahan makanan" className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Dana yang Digunakan</label>
                <select value={danaDigunakan} onChange={e => setDanaDigunakan(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                  <option value="">Pilih Dana</option>
                  <option value="Konsumsi">Konsumsi</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Pembangunan">Pembangunan</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Jenis Pengeluaran</label>
                  <select value={jenisKeperluan} onChange={e => setJenisKeperluan(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                    <option value="">Pilih</option>
                    <option value="Konsumsi">Konsumsi</option>
                    <option value="Perlengkapan">Perlengkapan</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Pembangunan">Pembangunan</option>
                    <option value="Gaji">Gaji</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nominal</label>
                  <input value={nominal ? formatRupiah(parseInt(nominal)) : ''} onChange={e => setNominal(e.target.value.replace(/\D/g, ''))} placeholder="Rp 0" className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSubmit} className="w-full py-3.5 rounded-xl gradient-danger text-destructive-foreground font-bold btn-shine">
                Keluarkan Uang
              </motion.button>
            </div>

            <div className="mt-6 p-5 rounded-2xl bg-muted/50 border border-border">
              <h4 className="font-bold text-foreground text-sm flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-warning" /> Tata Tertib</h4>
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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border p-7 shadow-elegant">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground text-lg">Riwayat Pengeluaran</h3>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => exportRekap('Pengeluaran', pengeluaranList)} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-success text-success-foreground text-xs font-bold btn-shine">
                <Download className="w-3.5 h-3.5" /> Export
              </motion.button>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {pengeluaranList.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Belum ada data pengeluaran</p>}
              {pengeluaranList.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.03 }} className="p-5 rounded-2xl bg-muted/30 border border-border hover-lift cursor-default group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{e.keterangan}</p>
                    <span className="text-sm font-extrabold text-destructive">{formatRupiah(e.nominal)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDate(e.tanggal)}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold">{e.jenis_keperluan}</span>
                    <span>{e.petugas}</span>
                  </div>
                </motion.div>
              ))}
            </div>
            {pengeluaranList.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-muted/50 border border-border text-center">
                <span className="text-xs text-muted-foreground">{bulanNames[currentMonth]} {currentYear}: </span>
                <span className="text-sm font-extrabold text-destructive">{formatRupiah(totalPengeluaranBulanIni)}</span>
                <span className="text-xs text-muted-foreground"> ({pengeluaranBulanIni.length} transaksi)</span>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Rekap tabs: Konsumsi, Operasional, Pembangunan */}
      {activeTab !== 'pengeluaran' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-foreground">Rekap Dana {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (Pendapatan)</h3>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => exportRekap(activeTab.charAt(0).toUpperCase() + activeTab.slice(1), rekapData)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
              <Download className="w-4 h-4" /> Export Excel
            </motion.button>
          </div>
          <div className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {rekapHeaders.map(h => (
                    <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${h === 'Nominal' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rekapData.length === 0 && (
                  <tr><td colSpan={rekapHeaders.length} className="py-16 text-center text-muted-foreground">Belum ada data</td></tr>
                )}
                {rekapData.map((e: any, i: number) => (
                  <tr key={e.id} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                    <td className="py-4 px-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-4 px-4 text-muted-foreground">{formatDate(e.tanggal)}</td>
                    <td className="py-4 px-4 text-foreground font-semibold">{e.nama_siswa}</td>
                    <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-bold">{e.kategori}</span></td>
                    <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-bold">{e.bulan}</span></td>
                    <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(e.nominal)}</td>
                    <td className="py-4 px-4 text-muted-foreground">{e.petugas}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 border-t-2 border-border">
                  <td colSpan={rekapHeaders.length - 2} className="py-4 px-4 font-extrabold text-foreground text-sm">TOTAL — {bulanNames[currentMonth]} {currentYear}</td>
                  <td className="py-4 px-4 text-xs text-muted-foreground font-semibold">{rekapBulanIni.length} Transaksi</td>
                  <td className="py-4 px-4 text-right font-extrabold text-primary text-base">{formatRupiah(totalRekapBulanIni)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      )}

      {/* Nota Popup */}
      <AnimatePresence>
        {showNota && notaData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowNota(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-7" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-lg">Nota Pengeluaran Pesantren</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowNota(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></motion.button>
              </div>
              
              <div ref={notaRef} className="border-2 border-dashed border-border rounded-2xl p-6 space-y-3 bg-white">
                <div className="text-center mb-5 pb-4 border-b border-dashed border-border">
                  <img src={logoYB} alt="Logo Yayasan Baitulloh" className="w-12 h-12 rounded-xl mx-auto mb-2 object-contain" />
                  <h4 className="font-extrabold text-gray-900">YAYASAN BAITULLOH</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">Nota Pengeluaran Pesantren</p>
                </div>
                {[
                  ['Tanggal', formatDate(notaData.tanggal)],
                  ['Keterangan', notaData.keterangan],
                  ['Dana Digunakan', notaData.dana_digunakan],
                  ['Jenis', notaData.jenis],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}</span><span className="text-gray-900 font-medium">{v}</span></div>
                ))}
                <div className="border-t border-dashed border-gray-300 pt-3 flex justify-between text-sm font-extrabold"><span className="text-gray-900">Nominal</span><span className="text-red-600 text-lg">{formatRupiah(notaData.nominal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Petugas</span><span className="text-gray-900">{notaData.petugas}</span></div>
              </div>

              <div className="flex gap-3 mt-5">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => window.print()} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Cetak</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={saveNota} className="flex-1 py-3 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">Simpan</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowNota(false)} className="flex-1 py-3 rounded-xl border-2 border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors">Batal</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

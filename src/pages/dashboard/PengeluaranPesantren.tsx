import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Printer, X, AlertCircle, Receipt, Loader2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePengeluaranPesantren, useInsertPengeluaranPesantren } from '@/hooks/useSupabasePesantren';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logoYB from '@/assets/logo-yb.png';

type Tab = 'konsumsi' | 'operasional' | 'pembangunan';

const PAGE_SIZE = 20;

const tataTertib = [
  'Setiap transaksi pengeluaran wajib disertai bukti/nota yang sah.',
  'Pengeluaran hanya dapat dilakukan oleh petugas yang berwenang.',
  'Setiap pengeluaran di atas Rp 500.000 harus mendapat persetujuan kepala yayasan.',
  'Nota pengeluaran wajib dicetak dan diarsipkan secara fisik maupun digital.',
  'Petugas bertanggung jawab penuh atas keakuratan data yang diinput ke sistem.',
];

const bulanNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const tabList: { key: Tab; label: string; icon: string }[] = [
  { key: 'konsumsi', label: 'Konsumsi', icon: '🍚' },
  { key: 'operasional', label: 'Operasional', icon: '🏗️' },
  { key: 'pembangunan', label: 'Pembangunan', icon: '🏢' },
];

export default function PengeluaranPesantren() {
  const [activeTab, setActiveTab] = useState<Tab>('konsumsi');
  const [page, setPage] = useState(1);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [keterangan, setKeterangan] = useState('');
  const [jenisKeperluan, setJenisKeperluan] = useState('');
  const [nominal, setNominal] = useState('');
  const [showNota, setShowNota] = useState(false);
  const [notaData, setNotaData] = useState<any>(null);
  const notaRef = useRef<HTMLDivElement>(null);

  const { data: pengeluaranList = [], isLoading } = usePengeluaranPesantren();
  const insertPengeluaran = useInsertPengeluaranPesantren();

  if (isLoading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const danaLabel = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

  // Filter pengeluaran by dana (jenis_keperluan starts with "Konsumsi", "Operasional", or "Pembangunan")
  const getFilteredData = () => {
    let filtered = pengeluaranList.filter(e => {
      const prefix = e.jenis_keperluan.split(' - ')[0];
      return prefix === danaLabel;
    });
    if (filterDateFrom) filtered = filtered.filter(e => e.tanggal >= filterDateFrom);
    if (filterDateTo) filtered = filtered.filter(e => e.tanggal <= filterDateTo);
    return filtered;
  };

  const data = getFilteredData();
  const totalNominal = data.reduce((s, e) => s + e.nominal, 0);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pagedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const handleSubmit = () => {
    if (!keterangan || !jenisKeperluan || !nominal) { toast.error('Mohon lengkapi semua field'); return; }
    const record = {
      keterangan,
      jenis_keperluan: `${danaLabel} - ${jenisKeperluan}`,
      nominal: parseInt(nominal.replace(/\D/g, '')),
      tanggal: new Date().toISOString().split('T')[0],
      petugas: 'Petugas Pesantren',
    };
    setNotaData({ ...record, dana_digunakan: danaLabel, jenis: jenisKeperluan });
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
        insertPengeluaran.mutate({
          keterangan: notaData.keterangan,
          jenis_keperluan: notaData.jenis_keperluan,
          nominal: notaData.nominal,
          tanggal: notaData.tanggal,
          petugas: notaData.petugas,
        });
        setShowNota(false);
        setShowForm(false);
        setKeterangan('');
        setNominal('');
        setJenisKeperluan('');
        toast.success('Nota berhasil didownload & data tersimpan');
      }
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(d => ({
      Tanggal: formatDate(d.tanggal),
      Keterangan: d.keterangan,
      'Jenis Keperluan': d.jenis_keperluan,
      Nominal: d.nominal,
      Petugas: d.petugas,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Pengeluaran ${danaLabel}`);
    XLSX.writeFile(wb, `pengeluaran_${activeTab}_pesantren.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pengeluaran Pesantren</h1>
          <p className="text-muted-foreground text-sm mt-1">Riwayat pengeluaran dana pesantren</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-danger text-destructive-foreground text-sm font-bold btn-shine hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Tambah Pengeluaran
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1.5 rounded-2xl flex-wrap">
        {tabList.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Dari Tanggal</label>
          <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sampai Tanggal</label>
          <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus" />
        </div>
        {(filterDateFrom || filterDateTo) && (
          <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Reset</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {['No', 'Tanggal', 'Keterangan', 'Jenis Keperluan', 'Nominal', 'Petugas'].map(h => (
                  <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${h === 'Nominal' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3"><Receipt className="w-8 h-8 text-muted-foreground/30" /></div>
                  Belum ada data pengeluaran {danaLabel}
                </td></tr>
              )}
              {pagedData.map((e, i) => (
                <tr key={e.id} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(e.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{e.keterangan}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-bold">{e.jenis_keperluan.split(' - ')[1] || e.jenis_keperluan}</span></td>
                  <td className="py-4 px-4 text-right text-destructive font-bold">{formatRupiah(e.nominal)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{e.petugas}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 border-t-2 border-border">
                <td colSpan={4} className="py-4 px-4 font-extrabold text-foreground text-sm">TOTAL PENGELUARAN {danaLabel.toUpperCase()}</td>
                <td className="py-4 px-4 text-right font-extrabold text-destructive text-base">{formatRupiah(totalNominal)}</td>
                <td className="py-4 px-4 text-xs text-muted-foreground">{data.length} transaksi</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Form Popup */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="bg-card rounded-3xl shadow-2xl w-full max-w-lg p-7" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-danger flex items-center justify-center"><Receipt className="w-4 h-4 text-destructive-foreground" /></div>
                  Tambah Pengeluaran {danaLabel}
                </h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Dana yang Digunakan</label>
                  <input type="text" value={danaLabel} disabled className="w-full px-4 py-3.5 rounded-xl border border-border bg-muted text-foreground text-sm cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Keterangan</label>
                  <input value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Contoh: Pembelian bahan makanan" className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
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
                <button onClick={handleSubmit} className="w-full py-3.5 rounded-xl gradient-danger text-destructive-foreground font-bold btn-shine">
                  Keluarkan Uang
                </button>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nota Popup */}
      <AnimatePresence>
        {showNota && notaData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowNota(false)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-7" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-foreground text-lg">Nota Pengeluaran Pesantren</h3>
                <button onClick={() => setShowNota(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
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
                <button onClick={() => window.print()} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Cetak</button>
                <button onClick={saveNota} className="flex-1 py-3 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">Simpan</button>
                <button onClick={() => setShowNota(false)} className="flex-1 py-3 rounded-xl border-2 border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors">Batal</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

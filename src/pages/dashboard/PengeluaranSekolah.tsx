import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Printer, X, AlertCircle } from 'lucide-react';
import { mockPengeluaran } from '@/data/mockData';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'pengeluaran' | 'rekap_smp' | 'rekap_sma';

const tataTertib = [
  'Setiap transaksi pengeluaran wajib disertai bukti/nota yang sah.',
  'Pengeluaran hanya dapat dilakukan oleh petugas yang berwenang.',
  'Setiap pengeluaran di atas Rp 500.000 harus mendapat persetujuan kepala yayasan.',
  'Nota pengeluaran wajib dicetak dan diarsipkan secara fisik maupun digital.',
  'Petugas bertanggung jawab penuh atas keakuratan data yang diinput ke sistem.',
];

export default function PengeluaranSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('pengeluaran');
  const [keterangan, setKeterangan] = useState('');
  const [sumberDana, setSumberDana] = useState<'SMP' | 'SMA'>('SMP');
  const [jenisKeperluan, setJenisKeperluan] = useState('');
  const [nominal, setNominal] = useState('');
  const [showNota, setShowNota] = useState(false);
  const [notaData, setNotaData] = useState<any>(null);

  const handleSubmit = () => {
    if (!keterangan || !jenisKeperluan || !nominal) {
      toast.error('Mohon lengkapi semua field');
      return;
    }
    const data = { keterangan, sumberDana, jenisKeperluan, nominal: parseInt(nominal.replace(/\D/g, '')), tanggal: new Date().toISOString().split('T')[0], petugas: 'Petugas A' };
    setNotaData(data);
    setShowNota(true);
  };

  const handlePrint = () => { window.print(); };

  const rekapData = (jenjang: 'SMP' | 'SMA') => mockPengeluaran.filter(e => e.sumberDana === jenjang);

  const exportRekap = (jenjang: 'SMP' | 'SMA') => {
    const data = rekapData(jenjang);
    const ws = XLSX.utils.json_to_sheet(data.map(d => ({ Tanggal: formatDate(d.tanggal), Keterangan: d.keterangan, Jenis: d.jenisKeperluan, Nominal: d.nominal, Petugas: d.petugas })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Rekap ${jenjang}`);
    XLSX.writeFile(wb, `rekap_pengeluaran_${jenjang.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  const handleNominalChange = (val: string) => {
    const num = val.replace(/\D/g, '');
    setNominal(num);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengeluaran Sekolah</h1>
        <p className="text-muted-foreground text-sm mt-1">Catat dan kelola pengeluaran keuangan sekolah</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {[
          { key: 'pengeluaran' as Tab, label: 'Pengeluaran' },
          { key: 'rekap_smp' as Tab, label: 'Rekap SMP' },
          { key: 'rekap_sma' as Tab, label: 'Rekap SMA' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'gradient-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'pengeluaran' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
            <h3 className="font-bold text-foreground mb-4">Form Transaksi Pengeluaran</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Keterangan Transaksi</label>
                <input value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Contoh: Pembelian ATK" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Sumber Dana</label>
                <select value={sumberDana} onChange={e => setSumberDana(e.target.value as any)} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Jenis Keperluan</label>
                <select value={jenisKeperluan} onChange={e => setJenisKeperluan(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Pilih jenis</option>
                  <option value="Perlengkapan Sekolah">Perlengkapan Sekolah</option>
                  <option value="Gaji">Gaji</option>
                  <option value="Kebutuhan Kantor">Kebutuhan Kantor</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nominal</label>
                <input value={nominal ? formatRupiah(parseInt(nominal)) : ''} onChange={e => handleNominalChange(e.target.value)} placeholder="Rp 0" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
              </div>
              <button onClick={handleSubmit} className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold hover:opacity-90 transition-opacity">
                Keluarkan Uang
              </button>
            </div>

            {/* Tata tertib */}
            <div className="mt-6 p-4 rounded-xl bg-muted border border-border">
              <h4 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-warning" /> Tata Tertib</h4>
              <ol className="space-y-2">
                {tataTertib.map((t, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="font-bold text-foreground">{i + 1}.</span> {t}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* History */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
            <h3 className="font-bold text-foreground mb-4">Riwayat Pengeluaran</h3>
            <div className="space-y-3">
              {mockPengeluaran.map(e => (
                <div key={e.id} className="p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{e.keterangan}</p>
                    <span className="text-sm font-bold text-destructive">{formatRupiah(e.nominal)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDate(e.tanggal)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">{e.sumberDana}</span>
                    <span>{e.jenisKeperluan}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'rekap_smp' || activeTab === 'rekap_sma') && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => exportRekap(activeTab === 'rekap_smp' ? 'SMP' : 'SMA')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
          <div className="bg-card rounded-2xl border border-border shadow-elegant overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Keterangan</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Jenis</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Nominal</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Petugas</th>
                </tr>
              </thead>
              <tbody>
                {rekapData(activeTab === 'rekap_smp' ? 'SMP' : 'SMA').map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-foreground">{formatDate(e.tanggal)}</td>
                    <td className="py-3 px-4 text-foreground font-medium">{e.keterangan}</td>
                    <td className="py-3 px-4 text-muted-foreground">{e.jenisKeperluan}</td>
                    <td className="py-3 px-4 text-right text-destructive font-medium">{formatRupiah(e.nominal)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{e.petugas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Nota Popup */}
      <AnimatePresence>
        {showNota && notaData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowNota(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Nota Pengeluaran</h3>
                <button onClick={() => setShowNota(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="border-2 border-dashed border-border rounded-xl p-6 space-y-3">
                <div className="text-center mb-4">
                  <h4 className="font-bold text-foreground">YAYASAN BAITULLOH</h4>
                  <p className="text-xs text-muted-foreground">Nota Pengeluaran</p>
                </div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tanggal</span><span className="text-foreground">{formatDate(notaData.tanggal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Keterangan</span><span className="text-foreground">{notaData.keterangan}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sumber Dana</span><span className="text-foreground">{notaData.sumberDana}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Jenis</span><span className="text-foreground">{notaData.jenisKeperluan}</span></div>
                <div className="border-t border-border pt-3 flex justify-between text-sm font-bold"><span className="text-foreground">Nominal</span><span className="text-destructive">{formatRupiah(notaData.nominal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Petugas</span><span className="text-foreground">{notaData.petugas}</span></div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handlePrint} className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Cetak
                </button>
                <button onClick={() => { toast.success('Nota berhasil disimpan'); setShowNota(false); setKeterangan(''); setNominal(''); setJenisKeperluan(''); }} className="flex-1 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
                  Simpan
                </button>
                <button onClick={() => setShowNota(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors">
                  Batal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

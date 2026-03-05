import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Printer, X, AlertCircle, Receipt } from 'lucide-react';
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
    if (!keterangan || !jenisKeperluan || !nominal) { toast.error('Mohon lengkapi semua field'); return; }
    const data = { keterangan, sumberDana, jenisKeperluan, nominal: parseInt(nominal.replace(/\D/g, '')), tanggal: new Date().toISOString().split('T')[0], petugas: 'Petugas A' };
    setNotaData(data);
    setShowNota(true);
  };

  const rekapData = (jenjang: 'SMP' | 'SMA') => mockPengeluaran.filter(e => e.sumberDana === jenjang);

  const exportRekap = (jenjang: 'SMP' | 'SMA') => {
    const ws = XLSX.utils.json_to_sheet(rekapData(jenjang).map(d => ({ Tanggal: formatDate(d.tanggal), Keterangan: d.keterangan, Jenis: d.jenisKeperluan, Nominal: d.nominal, Petugas: d.petugas })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Rekap ${jenjang}`);
    XLSX.writeFile(wb, `rekap_pengeluaran_${jenjang.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pengeluaran Sekolah</h1>
        <p className="text-muted-foreground text-sm mt-1">Catat dan kelola pengeluaran keuangan</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit">
        {([{ key: 'pengeluaran' as Tab, label: 'Pengeluaran' }, { key: 'rekap_smp' as Tab, label: 'Rekap SMP' }, { key: 'rekap_sma' as Tab, label: 'Rekap SMA' }]).map(tab => (
          <motion.button key={tab.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab(tab.key)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {activeTab === 'pengeluaran' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl border border-border p-7 shadow-elegant">
            <h3 className="font-bold text-foreground mb-5 flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-lg gradient-danger flex items-center justify-center"><Receipt className="w-4 h-4 text-destructive-foreground" /></div>
              Form Pengeluaran
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Keterangan</label>
                <input value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Contoh: Pembelian ATK" className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Sumber Dana</label>
                  <select value={sumberDana} onChange={e => setSumberDana(e.target.value as any)} className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                    <option value="SMP">SMP</option><option value="SMA">SMA</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Jenis</label>
                  <select value={jenisKeperluan} onChange={e => setJenisKeperluan(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                    <option value="">Pilih</option>
                    <option value="Perlengkapan Sekolah">Perlengkapan</option>
                    <option value="Gaji">Gaji</option>
                    <option value="Kebutuhan Kantor">Kantor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nominal</label>
                <input value={nominal ? formatRupiah(parseInt(nominal)) : ''} onChange={e => setNominal(e.target.value.replace(/\D/g, ''))} placeholder="Rp 0" className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
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
            <h3 className="font-bold text-foreground mb-5 text-lg">Riwayat Pengeluaran</h3>
            <div className="space-y-3">
              {mockPengeluaran.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }} className="p-5 rounded-2xl bg-muted/30 border border-border hover-lift cursor-default group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{e.keterangan}</p>
                    <span className="text-sm font-extrabold text-destructive">{formatRupiah(e.nominal)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDate(e.tanggal)}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold">{e.sumberDana}</span>
                    <span>{e.jenisKeperluan}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {(activeTab === 'rekap_smp' || activeTab === 'rekap_sma') && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex justify-end">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => exportRekap(activeTab === 'rekap_smp' ? 'SMP' : 'SMA')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
              <Download className="w-4 h-4" /> Export Excel
            </motion.button>
          </div>
          <div className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {['Tanggal', 'Keterangan', 'Jenis', 'Nominal', 'Petugas'].map(h => (
                    <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${h === 'Nominal' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rekapData(activeTab === 'rekap_smp' ? 'SMP' : 'SMA').map((e, i) => (
                  <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                    <td className="py-4 px-4 text-muted-foreground">{formatDate(e.tanggal)}</td>
                    <td className="py-4 px-4 text-foreground font-semibold">{e.keterangan}</td>
                    <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-bold">{e.jenisKeperluan}</span></td>
                    <td className="py-4 px-4 text-right text-destructive font-bold">{formatRupiah(e.nominal)}</td>
                    <td className="py-4 px-4 text-muted-foreground">{e.petugas}</td>
                  </motion.tr>
                ))}
              </tbody>
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
                <h3 className="font-bold text-foreground text-lg">Nota Pengeluaran</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowNota(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></motion.button>
              </div>
              <div className="border-2 border-dashed border-border rounded-2xl p-6 space-y-3 bg-muted/20">
                <div className="text-center mb-5 pb-4 border-b border-dashed border-border">
                  <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center mx-auto mb-2 shadow-sm"><span className="text-sm font-bold font-arabic text-foreground">ب</span></div>
                  <h4 className="font-extrabold text-foreground">YAYASAN BAITULLOH</h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Nota Pengeluaran</p>
                </div>
                {[
                  ['Tanggal', formatDate(notaData.tanggal)],
                  ['Keterangan', notaData.keterangan],
                  ['Sumber Dana', notaData.sumberDana],
                  ['Jenis', notaData.jenisKeperluan],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="text-foreground font-medium">{v}</span></div>
                ))}
                <div className="border-t border-dashed border-border pt-3 flex justify-between text-sm font-extrabold"><span className="text-foreground">Nominal</span><span className="text-destructive text-lg">{formatRupiah(notaData.nominal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Petugas</span><span className="text-foreground">{notaData.petugas}</span></div>
              </div>
              <div className="flex gap-3 mt-5">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => window.print()} className="flex-1 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Cetak</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { toast.success('Nota berhasil disimpan'); setShowNota(false); setKeterangan(''); setNominal(''); setJenisKeperluan(''); }} className="flex-1 py-3 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">Simpan</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowNota(false)} className="flex-1 py-3 rounded-xl border-2 border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors">Batal</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

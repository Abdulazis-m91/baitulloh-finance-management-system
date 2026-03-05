import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, CreditCard, Scan } from 'lucide-react';
import { mockStudents, bulanList } from '@/data/mockData';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';

export default function PembayaranSekolah() {
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null);
  const [metode, setMetode] = useState<'Lunas' | 'Cicil' | 'Deposit'>('Lunas');
  const [selectedBulan, setSelectedBulan] = useState('');
  const [nominal, setNominal] = useState(0);

  const searchResults = searchQuery.length >= 2
    ? mockStudents.filter(s =>
        s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery)
      ).slice(0, 5)
    : [];

  const selectStudent = (s: typeof mockStudents[0]) => {
    setSelectedStudent(s);
    setSearchQuery('');
    setNominal(s.biayaPerBulan);
    setMetode('Lunas');
    setSelectedBulan('');
  };

  const handleBarcode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBarcodeQuery(val);
    const found = mockStudents.find(s => s.barcode === val);
    if (found) {
      selectStudent(found);
      setBarcodeQuery('');
    }
  };

  const getAvailableMonths = () => {
    if (!selectedStudent) return [];
    if (metode === 'Lunas' || metode === 'Cicil') return selectedStudent.tunggakanSekolah;
    if (metode === 'Deposit') {
      const currentMonth = new Date().getMonth();
      return bulanList.filter((_, i) => i > currentMonth);
    }
    return [];
  };

  const handleSubmit = () => {
    if (!selectedStudent || !selectedBulan) return;
    toast.success(`Pembayaran ${metode} berhasil untuk ${selectedStudent.namaLengkap} bulan ${selectedBulan}`);
    setSelectedStudent(null);
    setSelectedBulan('');
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pembayaran Sekolah</h1>
        <p className="text-muted-foreground text-sm mt-1">Proses pembayaran SPP siswa</p>
      </motion.div>

      {/* Search Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl border border-border p-6 shadow-elegant"
      >
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Search className="w-4 h-4 text-primary-foreground" />
          </div>
          Cari Siswa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NISN..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm"
            />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-elevated z-10 overflow-hidden"
                >
                  {searchResults.map((s, i) => (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => selectStudent(s)}
                      className="w-full text-left px-4 py-3.5 hover:bg-muted/70 transition-all flex items-center gap-3 border-b border-border/30 last:border-0"
                    >
                      <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.namaLengkap}</p>
                        <p className="text-xs text-muted-foreground">{s.nisn} · {s.jenjang} {s.kelas}</p>
                      </div>
                      {s.tunggakanSekolah.length > 0 && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold">{s.tunggakanSekolah.length} tunggakan</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative">
            <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={barcodeQuery}
              onChange={handleBarcode}
              placeholder="Scan barcode siswa..."
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Student Info & Payment Form */}
      <AnimatePresence mode="wait">
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Student Info */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-elegant">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-info flex items-center justify-center">
                  <User className="w-4 h-4 text-info-foreground" />
                </div>
                Informasi Siswa
              </h3>
              <div className="flex items-center gap-4 p-5 rounded-2xl gradient-card border border-border mb-5">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-extrabold text-foreground text-lg tracking-tight">{selectedStudent.namaLengkap}</h4>
                  <p className="text-sm text-muted-foreground">NISN: {selectedStudent.nisn} · <span className="font-mono text-xs">{selectedStudent.barcode}</span></p>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{selectedStudent.jenjang}</span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">Kelas {selectedStudent.kelas}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 stagger-children">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                  <span className="text-sm text-muted-foreground">Jumlah Tunggakan</span>
                  <span className={`text-sm font-extrabold ${selectedStudent.tunggakanSekolah.length > 0 ? 'text-destructive' : 'text-success'}`}>
                    {selectedStudent.tunggakanSekolah.length > 0 ? `${selectedStudent.tunggakanSekolah.length} bulan` : 'Nihil ✓'}
                  </span>
                </div>
                {selectedStudent.tunggakanSekolah.length > 0 && (
                  <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Bulan Tunggakan</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedStudent.tunggakanSekolah.map(b => (
                        <span key={b} className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border">
                  <span className="text-sm text-muted-foreground">Biaya/Bulan</span>
                  <span className="text-sm font-extrabold text-foreground">{formatRupiah(selectedStudent.biayaPerBulan)}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/15">
                  <span className="text-sm text-muted-foreground font-semibold">Total Tunggakan</span>
                  <span className="text-sm font-extrabold text-destructive">{formatRupiah(selectedStudent.tunggakanSekolah.length * selectedStudent.biayaPerBulan)}</span>
                </div>
                {selectedStudent.deposit > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-success/5 border border-success/10">
                    <span className="text-sm text-muted-foreground">Deposit</span>
                    <span className="text-sm font-extrabold text-success">{formatRupiah(selectedStudent.deposit)}</span>
                  </div>
                )}
                {selectedStudent.cicilan.length > 0 && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-info/5 border border-info/10">
                    <span className="text-sm text-muted-foreground">Cicilan Aktif</span>
                    <span className="text-sm font-extrabold text-info">{selectedStudent.cicilan.length} cicilan</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-card rounded-3xl border border-border p-6 shadow-elegant">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-foreground" />
                </div>
                Form Transaksi
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Lunas', 'Cicil', 'Deposit'] as const).map(m => (
                      <motion.button
                        key={m}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setMetode(m); setSelectedBulan(''); }}
                        className={`py-3 rounded-xl text-sm font-semibold transition-all ${metode === m ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      >
                        {m}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Bulan</label>
                  <select
                    value={selectedBulan}
                    onChange={e => setSelectedBulan(e.target.value)}
                    disabled={getAvailableMonths().length === 0}
                    className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground input-focus text-sm disabled:opacity-50"
                  >
                    <option value="">{getAvailableMonths().length === 0 ? 'Tidak ada tunggakan' : 'Pilih bulan'}</option>
                    {getAvailableMonths().map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nominal</label>
                  <div className="px-4 py-3.5 rounded-xl bg-muted border border-border text-foreground font-bold text-lg">
                    {formatRupiah(nominal)}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSubmit}
                  disabled={!selectedBulan}
                  className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold btn-shine shadow-glow-primary disabled:opacity-50 disabled:shadow-none text-base"
                >
                  Proses Pembayaran
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!selectedStudent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl border border-border p-16 shadow-elegant text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-5">
            <Search className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="font-bold text-foreground text-lg mb-2">Pilih Siswa</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">Cari siswa berdasarkan nama, NISN, atau scan barcode untuk memulai transaksi pembayaran</p>
        </motion.div>
      )}
    </div>
  );
}

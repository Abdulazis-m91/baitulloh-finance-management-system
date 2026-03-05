import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, CreditCard, AlertTriangle } from 'lucide-react';
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pembayaran Sekolah</h1>
        <p className="text-muted-foreground text-sm mt-1">Proses pembayaran SPP siswa</p>
      </div>

      {/* Search Panel */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" /> Cari Siswa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NISN..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden">
                {searchResults.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.namaLengkap}</p>
                      <p className="text-xs text-muted-foreground">{s.nisn} · {s.jenjang} {s.kelas}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={barcodeQuery}
            onChange={handleBarcode}
            placeholder="Scan barcode siswa..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Student Info & Payment Form */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Student Info */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Informasi Siswa
              </h3>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted mb-4">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
                  <User className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{selectedStudent.namaLengkap}</h4>
                  <p className="text-sm text-muted-foreground">NISN: {selectedStudent.nisn} · Barcode: {selectedStudent.barcode}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudent.jenjang} - Kelas {selectedStudent.kelas}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm text-muted-foreground">Jumlah Tunggakan</span>
                  <span className="text-sm font-bold text-destructive">{selectedStudent.tunggakanSekolah.length} bulan</span>
                </div>
                {selectedStudent.tunggakanSekolah.length > 0 && (
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <p className="text-xs text-muted-foreground mb-1">Bulan Tunggakan:</p>
                    <p className="text-sm font-medium text-foreground">{selectedStudent.tunggakanSekolah.join(', ')}</p>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm text-muted-foreground">Biaya/Bulan</span>
                  <span className="text-sm font-bold text-foreground">{formatRupiah(selectedStudent.biayaPerBulan)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                  <span className="text-sm text-muted-foreground">Total Tunggakan</span>
                  <span className="text-sm font-bold text-destructive">{formatRupiah(selectedStudent.tunggakanSekolah.length * selectedStudent.biayaPerBulan)}</span>
                </div>
                {selectedStudent.deposit > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
                    <span className="text-sm text-muted-foreground">Deposit</span>
                    <span className="text-sm font-bold text-success">{formatRupiah(selectedStudent.deposit)}</span>
                  </div>
                )}
                {selectedStudent.cicilan.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-info/5 border border-info/10">
                    <span className="text-sm text-muted-foreground">Cicilan Aktif</span>
                    <span className="text-sm font-bold text-info">{selectedStudent.cicilan.length} cicilan</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-elegant">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Form Transaksi
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Metode Pembayaran</label>
                  <select
                    value={metode}
                    onChange={e => { setMetode(e.target.value as any); setSelectedBulan(''); }}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="Cicil">Cicil</option>
                    <option value="Deposit">Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Bulan</label>
                  <select
                    value={selectedBulan}
                    onChange={e => setSelectedBulan(e.target.value)}
                    disabled={getAvailableMonths().length === 0}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
                  >
                    <option value="">{getAvailableMonths().length === 0 ? 'Tidak ada tunggakan' : 'Pilih bulan'}</option>
                    {getAvailableMonths().map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Nominal</label>
                  <input
                    type="text"
                    value={formatRupiah(nominal)}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-foreground"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!selectedBulan}
                  className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Proses Pembayaran
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

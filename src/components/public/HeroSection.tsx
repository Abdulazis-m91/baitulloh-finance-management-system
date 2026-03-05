import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, BookOpen, Phone } from 'lucide-react';
import { mockStudents } from '@/data/mockData';
import { kelasOptions } from '@/data/mockData';
import { formatRupiah } from '@/lib/format';

export default function HeroSection() {
  const [nama, setNama] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [kelas, setKelas] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [foundStudent, setFoundStudent] = useState<typeof mockStudents[0] | null>(null);

  const handleSearch = () => {
    if (!nama && !kelas) return;
    const student = mockStudents.find(s => {
      const matchNama = !nama || s.namaLengkap.toLowerCase().includes(nama.toLowerCase());
      const matchJenjang = !jenjang || s.jenjang === jenjang;
      const matchKelas = !kelas || s.kelas === kelas;
      return matchNama && matchJenjang && matchKelas;
    });
    setFoundStudent(student || null);
    setShowPopup(true);
  };

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-hero">
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-secondary/10 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-[15%] w-96 h-96 rounded-full bg-primary-foreground/5 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-3xl animate-pulse-glow" />
        {/* Islamic pattern dots */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-secondary/20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-2xl font-bold font-arabic text-foreground">ب</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Bendahara <span className="text-gradient-gold">Yayasan Baitulloh</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg mb-10 max-w-lg mx-auto">Cek informasi pembayaran dan tunggakan siswa dengan mudah</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="glass-card rounded-2xl p-6 md:p-8 shadow-elegant"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm font-medium text-foreground/80 mb-1.5 block text-left">Nama Siswa</label>
              <input
                type="text"
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Masukkan nama..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1.5 block text-left">Jenjang</label>
              <select
                value={jenjang}
                onChange={e => { setJenjang(e.target.value); setKelas(''); }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
              >
                <option value="">Semua</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1.5 block text-left">Kelas</label>
              <select
                value={kelas}
                onChange={e => setKelas(e.target.value)}
                disabled={!jenjang}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm disabled:opacity-50"
              >
                <option value="">{jenjang ? 'Semua' : 'Pilih jenjang'}</option>
                {jenjang && kelasOptions[jenjang]?.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Search className="w-4 h-4" /> Cari Data
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Student Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 md:p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Informasi Siswa</h3>
                <button onClick={() => setShowPopup(false)} className="p-2 rounded-full hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {foundStudent ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted">
                    <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
                      <User className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{foundStudent.namaLengkap}</h4>
                      <p className="text-sm text-muted-foreground">NISN: {foundStudent.nisn}</p>
                      <p className="text-sm text-muted-foreground">{foundStudent.jenjang} - Kelas {foundStudent.kelas}</p>
                    </div>
                  </div>

                  {/* Tunggakan Sekolah */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <h5 className="font-semibold text-foreground">Tunggakan Sekolah</h5>
                    </div>
                    {foundStudent.tunggakanSekolah.length > 0 ? (
                      <div className="space-y-2">
                        {foundStudent.tunggakanSekolah.map(bulan => (
                          <div key={bulan} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                            <span className="text-sm text-foreground">{bulan}</span>
                            <span className="text-sm font-medium text-destructive">{formatRupiah(foundStudent.biayaPerBulan)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 font-semibold">
                          <span className="text-sm text-foreground">Total Tunggakan</span>
                          <span className="text-sm text-destructive">{formatRupiah(foundStudent.tunggakanSekolah.length * foundStudent.biayaPerBulan)}</span>
                        </div>
                        <button className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity mt-2">
                          Bayar Tunggakan
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-success font-medium p-3 rounded-lg bg-success/5 border border-success/10">✓ Tidak ada tunggakan</p>
                    )}
                  </div>

                  {/* Tunggakan Pesantren */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-secondary" />
                      <h5 className="font-semibold text-foreground">Tunggakan Pesantren</h5>
                    </div>
                    {foundStudent.tunggakanPesantren.length > 0 ? (
                      <div className="space-y-2">
                        {foundStudent.tunggakanPesantren.map(bulan => (
                          <div key={bulan} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                            <span className="text-sm text-foreground">{bulan}</span>
                            <span className="text-sm font-medium text-destructive">{formatRupiah(foundStudent.biayaPerBulan)}</span>
                          </div>
                        ))}
                        <button className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity mt-2">
                          Bayar Tunggakan
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-success font-medium p-3 rounded-lg bg-success/5 border border-success/10">✓ Tidak ada tunggakan</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">Data siswa tidak ditemukan</p>
                  <p className="text-sm text-muted-foreground mt-1">Pastikan nama dan kelas sudah benar</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

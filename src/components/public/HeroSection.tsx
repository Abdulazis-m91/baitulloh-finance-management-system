import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, BookOpen } from 'lucide-react';
import { mockStudents } from '@/data/mockData';
import { kelasOptions } from '@/data/mockData';
import { formatRupiah } from '@/lib/format';

export default function HeroSection() {
  const [nama, setNama] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [kelas, setKelas] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [foundStudent, setFoundStudent] = useState<typeof mockStudents[0] | null>(null);

  const particles = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 15,
      duration: 10 + Math.random() * 20,
      opacity: 0.1 + Math.random() * 0.3,
    })), []);

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
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-hero">
        {/* Shifting light orbs */}
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full blur-[140px] animate-float-slow"
          style={{ background: 'radial-gradient(circle, hsla(217,71%,55%,0.25) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[5%] right-[5%] w-[600px] h-[600px] rounded-full blur-[160px] animate-float-slow"
          style={{ background: 'radial-gradient(circle, hsla(210,80%,60%,0.2) 0%, transparent 70%)', animationDelay: '5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[180px] animate-pulse-glow"
          style={{ background: 'radial-gradient(circle, hsla(220,70%,50%,0.15) 0%, transparent 60%)' }} />
        <div className="absolute top-[60%] left-[30%] w-[400px] h-[400px] rounded-full blur-[120px] animate-float"
          style={{ background: 'radial-gradient(circle, hsla(200,80%,65%,0.12) 0%, transparent 70%)', animationDelay: '3s' }} />

        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        {/* Floating particles - white/blue */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              bottom: '-20px',
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              background: p.id % 3 === 0 ? 'hsla(210,90%,75%,0.6)' : 'hsla(0,0%,100%,0.5)',
              animation: `particle-float ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}

        {/* Rotating ring decorations */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[12%] right-[12%] w-40 h-40 border border-white/[0.06] rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[18%] left-[8%] w-56 h-56 border border-white/[0.04] rounded-full"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[45%] right-[25%] w-24 h-24 border border-white/[0.05] rounded-full"
        />

        {/* Wave SVG at bottom */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
          <svg viewBox="0 0 1440 120" className="w-full h-auto opacity-[0.06]" preserveAspectRatio="none">
            <motion.path
              d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,40 1440,60 L1440,120 L0,120 Z"
              fill="white"
              animate={{ d: [
                "M0,60 C360,120 720,0 1080,60 C1260,90 1380,40 1440,60 L1440,120 L0,120 Z",
                "M0,80 C360,20 720,100 1080,40 C1260,20 1380,80 1440,50 L1440,120 L0,120 Z",
                "M0,60 C360,120 720,0 1080,60 C1260,90 1380,40 1440,60 L1440,120 L0,120 Z",
              ]}}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
          <svg viewBox="0 0 1440 120" className="w-full h-auto opacity-[0.04] -mt-16" preserveAspectRatio="none">
            <motion.path
              d="M0,40 C480,100 960,10 1440,70 L1440,120 L0,120 Z"
              fill="white"
              animate={{ d: [
                "M0,40 C480,100 960,10 1440,70 L1440,120 L0,120 Z",
                "M0,70 C480,10 960,100 1440,40 L1440,120 L0,120 Z",
                "M0,40 C480,100 960,10 1440,70 L1440,120 L0,120 Z",
              ]}}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 text-center pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-8 shadow-glow-gold"
          >
            <span className="text-3xl font-bold font-arabic text-foreground">ب</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/80 text-sm font-semibold uppercase tracking-[0.3em] mb-4"
          >
            Sistem Informasi Keuangan
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-5 leading-tight tracking-tight"
          >
            Yayasan Baitulloh
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/60 text-lg mb-12 max-w-lg mx-auto leading-relaxed"
          >
            Cek informasi pembayaran dan tunggakan siswa dengan mudah dan cepat
          </motion.p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-3xl p-8 shadow-elevated"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">Nama Siswa</label>
              <input
                type="text"
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Masukkan nama..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground placeholder:text-muted-foreground input-focus text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">Jenjang</label>
              <select
                value={jenjang}
                onChange={e => { setJenjang(e.target.value); setKelas(''); }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground input-focus text-sm"
              >
                <option value="">Semua</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">Kelas</label>
              <select
                value={kelas}
                onChange={e => setKelas(e.target.value)}
                disabled={!jenjang}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground input-focus text-sm disabled:opacity-50"
              >
                <option value="">{jenjang ? 'Semua' : 'Pilih jenjang'}</option>
                {jenjang && kelasOptions[jenjang]?.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 btn-shine shadow-glow-primary text-sm"
              >
                <Search className="w-4 h-4" /> Cari Data
              </motion.button>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setShowPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Informasi Siswa</h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPopup(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {foundStudent ? (
                <div className="space-y-6 stagger-children">
                  <div className="flex items-center gap-4 p-5 rounded-2xl gradient-card border border-border">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary">
                      <User className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-lg">{foundStudent.namaLengkap}</h4>
                      <p className="text-sm text-muted-foreground">NISN: {foundStudent.nisn}</p>
                      <p className="text-sm text-muted-foreground">{foundStudent.jenjang} - Kelas {foundStudent.kelas}</p>
                    </div>
                  </div>

                  {/* Tunggakan Sekolah */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                      <h5 className="font-bold text-foreground">Tunggakan Sekolah</h5>
                    </div>
                    {foundStudent.tunggakanSekolah.length > 0 ? (
                      <div className="space-y-2">
                        {foundStudent.tunggakanSekolah.map(bulan => (
                          <div key={bulan} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                            <span className="text-sm text-foreground">{bulan}</span>
                            <span className="text-sm font-semibold text-destructive">{formatRupiah(foundStudent.biayaPerBulan)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between p-3 rounded-xl gradient-danger/10 border border-destructive/20 font-bold bg-destructive/10">
                          <span className="text-sm text-foreground">Total</span>
                          <span className="text-sm text-destructive">{formatRupiah(foundStudent.tunggakanSekolah.length * foundStudent.biayaPerBulan)}</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm btn-shine shadow-glow-primary mt-2"
                        >
                          Bayar Tunggakan
                        </motion.button>
                      </div>
                    ) : (
                      <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full gradient-success flex items-center justify-center text-xs text-success-foreground">✓</span>
                        Tidak ada tunggakan
                      </p>
                    )}
                  </div>

                  {/* Tunggakan Pesantren */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-foreground" />
                      </div>
                      <h5 className="font-bold text-foreground">Tunggakan Pesantren</h5>
                    </div>
                    {foundStudent.tunggakanPesantren.length > 0 ? (
                      <div className="space-y-2">
                        {foundStudent.tunggakanPesantren.map(bulan => (
                          <div key={bulan} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                            <span className="text-sm text-foreground">{bulan}</span>
                            <span className="text-sm font-semibold text-destructive">{formatRupiah(foundStudent.biayaPerBulan)}</span>
                          </div>
                        ))}
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full py-3 rounded-xl gradient-gold text-foreground font-semibold text-sm btn-shine mt-2"
                        >
                          Bayar Tunggakan
                        </motion.button>
                      </div>
                    ) : (
                      <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full gradient-success flex items-center justify-center text-xs text-success-foreground">✓</span>
                        Tidak ada tunggakan
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-foreground font-bold text-lg">Data tidak ditemukan</p>
                  <p className="text-sm text-muted-foreground mt-1">Pastikan nama dan kelas sudah benar</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

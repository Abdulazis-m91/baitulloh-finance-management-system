import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, BookOpen } from 'lucide-react';
import { mockStudents } from '@/data/mockData';
import { kelasOptions } from '@/data/mockData';
import { formatRupiah } from '@/lib/format';
import logoYB from '@/assets/logo-yb.png';

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
    opacity: 0.1 + Math.random() * 0.3
  })), []);

  const handleSearch = () => {
    if (!nama && !kelas) return;
    const student = mockStudents.find((s) => {
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
        {/* Mesh gradient blobs - slow drifting */}
        <motion.div
          animate={{ x: [0, 80, -40, 0], y: [0, -60, 30, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle, hsla(217,80%,55%,0.2) 0%, transparent 70%)' }} />
        
        <motion.div
          animate={{ x: [0, -60, 50, 0], y: [0, 40, -80, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[10%] -right-[10%] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(circle, hsla(200,85%,60%,0.18) 0%, transparent 65%)' }} />
        
        <motion.div
          animate={{ x: [0, 40, -30, 0], y: [0, -30, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[150px]"
          style={{ background: 'radial-gradient(circle, hsla(230,70%,50%,0.12) 0%, transparent 60%)' }} />
        

        {/* Constellation grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating glowing dots */}
        {particles.map((p) =>
        <motion.div
          key={p.id}
          animate={{
            y: [0, -(100 + p.size * 30), -(200 + p.size * 50)],
            opacity: [0, p.opacity, 0],
            scale: [0.5, 1, 0.3]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut'
          }}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: '5%',
            width: p.size,
            height: p.size,
            background: p.id % 4 === 0 ?
            'hsla(210,100%,80%,0.8)' :
            p.id % 3 === 0 ?
            'hsla(220,90%,70%,0.6)' :
            'hsla(0,0%,100%,0.5)',
            boxShadow: p.id % 4 === 0 ? '0 0 8px hsla(210,100%,80%,0.4)' : 'none'
          }} />

        )}

        {/* Orbiting rings with dash animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[8%] right-[8%] w-48 h-48">
          
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsla(0,0%,100%,0.06)" strokeWidth="1" strokeDasharray="8 12" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="hsla(210,80%,70%,0.05)" strokeWidth="0.5" strokeDasharray="4 16" />
          </svg>
        </motion.div>
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[12%] left-[5%] w-64 h-64">
          
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="95" fill="none" stroke="hsla(0,0%,100%,0.04)" strokeWidth="1" strokeDasharray="6 14" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="hsla(220,70%,60%,0.04)" strokeWidth="0.5" strokeDasharray="3 12" />
          </svg>
        </motion.div>

        {/* Horizontal light beam sweep */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }}
          className="absolute top-[30%] w-[400px] h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, hsla(210,90%,70%,0.15), transparent)' }} />
        
        <motion.div
          animate={{ x: ['200%', '-100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', repeatDelay: 6 }}
          className="absolute top-[65%] w-[300px] h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, hsla(220,80%,75%,0.1), transparent)' }} />
        

        {/* Corner accent glow */}
        <div className="absolute top-0 left-0 w-[300px] h-[300px] opacity-[0.08]"
        style={{ background: 'radial-gradient(circle at 0% 0%, hsla(210,80%,60%,1) 0%, transparent 60%)' }} />
        
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] opacity-[0.06]"
        style={{ background: 'radial-gradient(circle at 100% 100%, hsla(220,70%,55%,1) 0%, transparent 60%)' }} />
        
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 text-center pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          
          {/* Logo */}
          <motion.img
            src={logoYB}
            alt="Logo Yayasan Baitulloh"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-40 h-40 rounded-2xl object-contain mx-auto mb-8 drop-shadow-lg" />
          

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/80 text-sm font-semibold uppercase tracking-[0.3em] mb-4">SISTEM INFORMASI YAYASAN


          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-5 leading-tight tracking-tight">YAYASAN BAITULLOH


          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/60 text-lg mb-12 max-w-lg mx-auto leading-relaxed">Pantau informasi pembayaran dan tunggakan siswa secara cepat, akurat, dan real-time.


          </motion.p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-3xl p-8 shadow-elevated">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">NAMA LENGKAP SISWA</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Masukkan nama..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground placeholder:text-muted-foreground input-focus text-sm" />
              
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">Jenjang</label>
              <select
                value={jenjang}
                onChange={(e) => {setJenjang(e.target.value);setKelas('');}}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground input-focus text-sm">
                
                <option value="">Semua</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">Kelas</label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                disabled={!jenjang}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground input-focus text-sm disabled:opacity-50">
                
                <option value="">{jenjang ? 'Semua' : 'Pilih jenjang'}</option>
                {jenjang && kelasOptions[jenjang]?.map((k) =>
                <option key={k} value={k}>{k}</option>
                )}
              </select>
            </div>
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 btn-shine shadow-glow-primary text-sm">
                
                <Search className="w-4 h-4" /> Cari Data
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Student Popup */}
      <AnimatePresence>
        {showPopup &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          onClick={() => setShowPopup(false)}>
          
            <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-card rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}>
            
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Informasi Siswa</h3>
                <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowPopup(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors">
                
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {foundStudent ?
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
                    {foundStudent.tunggakanSekolah.length > 0 ?
                <div className="space-y-2">
                        {foundStudent.tunggakanSekolah.map((bulan) =>
                  <div key={bulan} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                            <span className="text-sm text-foreground">{bulan}</span>
                            <span className="text-sm font-semibold text-destructive">{formatRupiah(foundStudent.biayaPerBulan)}</span>
                          </div>
                  )}
                        <div className="flex items-center justify-between p-3 rounded-xl gradient-danger/10 border border-destructive/20 font-bold bg-destructive/10">
                          <span className="text-sm text-foreground">Total</span>
                          <span className="text-sm text-destructive">{formatRupiah(foundStudent.tunggakanSekolah.length * foundStudent.biayaPerBulan)}</span>
                        </div>
                        <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm btn-shine shadow-glow-primary mt-2">
                    
                          Bayar Tunggakan
                        </motion.button>
                      </div> :

                <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full gradient-success flex items-center justify-center text-xs text-success-foreground">✓</span>
                        Tidak ada tunggakan
                      </p>
                }
                  </div>

                  {/* Tunggakan Pesantren */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-foreground" />
                      </div>
                      <h5 className="font-bold text-foreground">Tunggakan Pesantren</h5>
                    </div>
                    {foundStudent.tunggakanPesantren.length > 0 ?
                <div className="space-y-2">
                        {foundStudent.tunggakanPesantren.map((bulan) =>
                  <div key={bulan} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                            <span className="text-sm text-foreground">{bulan}</span>
                            <span className="text-sm font-semibold text-destructive">{formatRupiah(foundStudent.biayaPerBulan)}</span>
                          </div>
                  )}
                        <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3 rounded-xl gradient-gold text-foreground font-semibold text-sm btn-shine mt-2">
                    
                          Bayar Tunggakan
                        </motion.button>
                      </div> :

                <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full gradient-success flex items-center justify-center text-xs text-success-foreground">✓</span>
                        Tidak ada tunggakan
                      </p>
                }
                  </div>
                </div> :

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12">
              
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-foreground font-bold text-lg">Data tidak ditemukan</p>
                  <p className="text-sm text-muted-foreground mt-1">Pastikan nama dan kelas sudah benar</p>
                </motion.div>
            }
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </section>);

}
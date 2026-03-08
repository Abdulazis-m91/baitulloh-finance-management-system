import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, BookOpen, MessageCircle, ChevronRight } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import logoYB from '@/assets/logo-yb.png';

interface MergedResult {
  nama_lengkap: string;
  nisn_sekolah: string | null;
  jenjang_sekolah: string | null;
  kelas_sekolah: string | null;
  tunggakan_sekolah: string[];
  biaya_sekolah: number;
  nisn_pesantren: string | null;
  jenjang_pesantren: string | null;
  kelas_pesantren: string | null;
  kategori_pesantren: string | null;
  tunggakan_pesantren: string[];
  biaya_pesantren: number;
  is_siswa: boolean;
  is_santri: boolean;
}

const kelasOptionsPublic: Record<string, string[]> = {
  SMP: ['7A', '7B', '8A', '8B', '9A', '9B'],
  SMA: ['10A', '10B', '11A', '11B', '12A', '12B'],
  Reguler: ['Reguler'],
};

export default function HeroSection() {
  const [nama, setNama] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [kelas, setKelas] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [results, setResults] = useState<MergedResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<MergedResult | null>(null);
  const [waSekolah, setWaSekolah] = useState('');
  const [waPesantren, setWaPesantren] = useState('');
  const [loading, setLoading] = useState(false);

  const particles = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 15,
      duration: 10 + Math.random() * 20,
      opacity: 0.1 + Math.random() * 0.3
    })), []);

  const handleSearch = async () => {
    if (!nama && !kelas) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nama) params.set('nama', nama);
      if (jenjang) params.set('jenjang', jenjang);
      if (kelas) params.set('kelas', kelas);

      const { data, error } = await supabase.functions.invoke('public-search', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: null,
      });

      // Use fetch directly since supabase.functions.invoke doesn't support GET params well
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-search?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const json = await res.json();

      if (json.results) {
        setResults(json.results);
        setWaSekolah(json.wa_sekolah || '');
        setWaPesantren(json.wa_pesantren || '');
        if (json.results.length === 1) {
          setSelectedResult(json.results[0]);
        } else {
          setSelectedResult(null);
        }
      } else {
        setResults([]);
        setSelectedResult(null);
      }
      setShowPopup(true);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      setShowPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsAppUrl = (phone: string, result: MergedResult, type: 'sekolah' | 'pesantren') => {
    if (!phone) return '#';
    const tunggakan = type === 'sekolah' ? result.tunggakan_sekolah : result.tunggakan_pesantren;
    const biaya = type === 'sekolah' ? result.biaya_sekolah : result.biaya_pesantren;
    const total = tunggakan.length * biaya;
    const bulanList = tunggakan.map(b => {
      const parts = b.split('-');
      return parts.length === 2 ? `${parts[1]} ${parts[0]}` : b;
    }).join(', ');
    const label = type === 'sekolah' ? 'Sekolah' : 'Pesantren';
    const nisn = type === 'sekolah' ? result.nisn_sekolah : result.nisn_pesantren;

    const message = `Halo, saya ingin melakukan pembayaran tunggakan ${label} untuk:\n\nNama: ${result.nama_lengkap}\nNISN: ${nisn || '-'}\nBulan Tunggakan: ${bulanList}\nJumlah Tunggakan: ${formatRupiah(total)}\n\nMohon info cara pembayaran. Terima kasih.`;

    const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone.startsWith('0') ? '62' + phone.substring(1) : phone;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const renderResultDetail = (r: MergedResult) => (
    <div className="space-y-6 stagger-children">
      {/* Profile Card */}
      <div className="flex items-center gap-4 p-5 rounded-2xl gradient-card border border-border">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary">
          <User className="w-8 h-8 text-primary-foreground" />
        </div>
        <div>
          <h4 className="font-bold text-foreground text-lg">{r.nama_lengkap}</h4>
          {r.is_siswa && <p className="text-sm text-muted-foreground">NISN Sekolah: {r.nisn_sekolah} · {r.jenjang_sekolah} - {r.kelas_sekolah}</p>}
          {r.is_santri && <p className="text-sm text-muted-foreground">NISN Pesantren: {r.nisn_pesantren} · {r.jenjang_pesantren} - {r.kelas_pesantren}{r.kategori_pesantren ? ` · ${r.kategori_pesantren}` : ''}</p>}
        </div>
      </div>

      {/* Biaya Sekolah */}
      {r.is_siswa && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <h5 className="font-bold text-foreground">Biaya Sekolah</h5>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">SPP per bulan</span>
              <span className="font-semibold text-foreground">{formatRupiah(r.biaya_sekolah)}</span>
            </div>
          </div>
          {r.tunggakan_sekolah.length > 0 ? (
            <div className="space-y-2">
              {r.tunggakan_sekolah.map((bulan) => (
                <div key={bulan} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                  <span className="text-sm text-foreground">{bulan.includes('-') ? bulan.split('-').reverse().join(' - ') : bulan}</span>
                  <span className="text-sm font-semibold text-destructive">{formatRupiah(r.biaya_sekolah)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20 font-bold">
                <span className="text-sm text-foreground">Total Tunggakan</span>
                <span className="text-sm text-destructive">{formatRupiah(r.tunggakan_sekolah.length * r.biaya_sekolah)}</span>
              </div>
              <a
                href={buildWhatsAppUrl(waSekolah, r, 'sekolah')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2 transition-colors">
                <MessageCircle className="w-4 h-4" /> Bayar Tunggakan Sekolah
              </a>
            </div>
          ) : (
            <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full gradient-success flex items-center justify-center text-xs text-success-foreground">✓</span>
              Tidak ada tunggakan
            </p>
          )}
        </div>
      )}

      {/* Biaya Pesantren */}
      {r.is_santri && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-foreground" />
            </div>
            <h5 className="font-bold text-foreground">Biaya Pesantren</h5>
          </div>
          <div className="p-4 rounded-xl bg-muted/30 border border-border mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Syahriah per bulan</span>
              <span className="font-semibold text-foreground">{formatRupiah(r.biaya_pesantren)}</span>
            </div>
            {r.kategori_pesantren && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Kategori</span>
                <span className="font-semibold text-foreground">{r.kategori_pesantren}</span>
              </div>
            )}
          </div>
          {r.tunggakan_pesantren.length > 0 ? (
            <div className="space-y-2">
              {r.tunggakan_pesantren.map((bulan) => (
                <div key={bulan} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                  <span className="text-sm text-foreground">{bulan.includes('-') ? bulan.split('-').reverse().join(' - ') : bulan}</span>
                  <span className="text-sm font-semibold text-destructive">{formatRupiah(r.biaya_pesantren)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20 font-bold">
                <span className="text-sm text-foreground">Total Tunggakan</span>
                <span className="text-sm text-destructive">{formatRupiah(r.tunggakan_pesantren.length * r.biaya_pesantren)}</span>
              </div>
              <a
                href={buildWhatsAppUrl(waPesantren, r, 'pesantren')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2 transition-colors">
                <MessageCircle className="w-4 h-4" /> Bayar Tunggakan Pesantren
              </a>
            </div>
          ) : (
            <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full gradient-success flex items-center justify-center text-xs text-success-foreground">✓</span>
              Tidak ada tunggakan
            </p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-hero">
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

        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {particles.map((p) =>
          <motion.div
            key={p.id}
            animate={{
              y: [0, -(100 + p.size * 30), -(200 + p.size * 50)],
              opacity: [0, p.opacity, 0],
              scale: [0.5, 1, 0.3]
            }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              left: p.left, bottom: '5%', width: p.size, height: p.size,
              background: p.id % 4 === 0 ? 'hsla(210,100%,80%,0.8)' : p.id % 3 === 0 ? 'hsla(220,90%,70%,0.6)' : 'hsla(0,0%,100%,0.5)',
              boxShadow: p.id % 4 === 0 ? '0 0 8px hsla(210,100%,80%,0.4)' : 'none'
            }} />
        )}

        <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[8%] right-[8%] w-48 h-48">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="90" fill="none" stroke="hsla(0,0%,100%,0.06)" strokeWidth="1" strokeDasharray="8 12" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="hsla(210,80%,70%,0.05)" strokeWidth="0.5" strokeDasharray="4 16" />
          </svg>
        </motion.div>
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[12%] left-[5%] w-64 h-64">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="95" fill="none" stroke="hsla(0,0%,100%,0.04)" strokeWidth="1" strokeDasharray="6 14" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="hsla(220,70%,60%,0.04)" strokeWidth="0.5" strokeDasharray="3 12" />
          </svg>
        </motion.div>

        <motion.div animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }}
          className="absolute top-[30%] w-[400px] h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, hsla(210,90%,70%,0.15), transparent)' }} />
        <motion.div animate={{ x: ['200%', '-100%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', repeatDelay: 6 }}
          className="absolute top-[65%] w-[300px] h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, hsla(220,80%,75%,0.1), transparent)' }} />

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
          <motion.img
            src={logoYB}
            alt="Logo Yayasan Baitulloh"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-40 h-40 rounded-2xl object-contain mx-auto mb-8 drop-shadow-lg" />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-white/80 text-sm font-semibold uppercase tracking-[0.3em] mb-4">
            SISTEM INFORMASI YAYASAN
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-5 leading-tight tracking-tight">
            YAYASAN BAITULLOH
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="text-white/60 text-lg mb-12 max-w-lg mx-auto leading-relaxed">
            Pantau informasi pembayaran dan tunggakan siswa secara cepat, akurat, dan real-time.
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
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Masukkan nama..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground placeholder:text-muted-foreground input-focus text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">Jenjang</label>
              <select
                value={jenjang}
                onChange={(e) => { setJenjang(e.target.value); setKelas(''); }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground input-focus text-sm">
                <option value="">Semua</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="Reguler">Reguler</option>
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
                {jenjang && kelasOptionsPublic[jenjang]?.map((k) =>
                  <option key={k} value={k}>{k}</option>
                )}
              </select>
            </div>
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                disabled={loading}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 btn-shine shadow-glow-primary text-sm disabled:opacity-70">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {loading ? 'Mencari...' : 'Cari Data'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Results Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => { setShowPopup(false); setSelectedResult(null); }}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">
                  {selectedResult ? 'Informasi Siswa/Santri' : 'Hasil Pencarian'}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setShowPopup(false); setSelectedResult(null); }}
                  className="p-2 rounded-full hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {results.length === 0 ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <p className="text-foreground font-bold text-lg">Data tidak ditemukan</p>
                  <p className="text-sm text-muted-foreground mt-1">Pastikan nama sudah benar</p>
                </motion.div>
              ) : selectedResult ? (
                <>
                  {results.length > 1 && (
                    <button
                      onClick={() => setSelectedResult(null)}
                      className="text-sm text-primary hover:underline mb-4 flex items-center gap-1">
                      ← Kembali ke daftar
                    </button>
                  )}
                  {renderResultDetail(selectedResult)}
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-4">Ditemukan {results.length} data</p>
                  {results.map((r, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedResult(r)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl gradient-card border border-border text-left hover:border-primary/30 transition-colors">
                      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground truncate">{r.nama_lengkap}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.is_siswa && `Siswa: ${r.jenjang_sekolah}-${r.kelas_sekolah}`}
                          {r.is_siswa && r.is_santri && ' · '}
                          {r.is_santri && `Santri: ${r.jenjang_pesantren}-${r.kelas_pesantren}`}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

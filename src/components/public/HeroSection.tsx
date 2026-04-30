import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, MessageCircle, ChevronRight, ChevronDown, ChevronUp, BookOpen, GraduationCap } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
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
  const [expandSekolah, setExpandSekolah] = useState(false);
  const [expandPesantren, setExpandPesantren] = useState(false);

  const particles = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 15,
      duration: 10 + Math.random() * 20,
      opacity: 0.1 + Math.random() * 0.3
    })), []);

  const handleClosePopup = () => {
    setShowPopup(false);
    setSelectedResult(null);
    setNama('');
    setJenjang('');
    setKelas('');
    setExpandSekolah(false);
    setExpandPesantren(false);
  };

  const handleSearch = async () => {
    if (!nama && !kelas) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nama) params.set('nama', nama);
      if (jenjang) params.set('jenjang', jenjang);
      if (kelas) params.set('kelas', kelas);

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
    <div className="space-y-5">
      {/* ── Profile Card ── */}
      <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow-primary flex-shrink-0">
          <User className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-foreground text-lg leading-tight">{r.nama_lengkap}</h4>
          {r.is_siswa && (
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">NISN:</span> {r.nisn_sekolah}
                <span className="mx-1.5">·</span>
                <span className="font-semibold text-primary">{r.jenjang_sekolah} - {r.kelas_sekolah}</span>
              </p>
            </div>
          )}
          {r.is_santri && r.kategori_pesantren && (
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-lg bg-warning/10 text-warning text-[10px] font-bold border border-warning/20">
              {r.kategori_pesantren}
            </span>
          )}
        </div>
      </div>

      {/* ── Biaya Sekolah ── */}
      {r.is_siswa && (
        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Header Sekolah */}
          <div className="flex items-center justify-between p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Biaya Sekolah</p>
                <p className="text-[10px] text-muted-foreground">SPP {formatRupiah(r.biaya_sekolah)} / bulan</p>
              </div>
            </div>
            {r.tunggakan_sekolah.length > 0 ? (
              <span className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold">
                {r.tunggakan_sekolah.length} bulan tunggakan
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-bold">✓ Lunas</span>
            )}
          </div>

          {r.tunggakan_sekolah.length > 0 && (
            <div className="p-4 space-y-3">
              {/* Total Tunggakan - Klik untuk expand */}
              <button
                onClick={() => setExpandSekolah(!expandSekolah)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/15 hover:bg-destructive/10 transition-colors">
                <span className="text-sm font-bold text-foreground">Total Tunggakan</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-destructive">{formatRupiah(r.tunggakan_sekolah.length * r.biaya_sekolah)}</span>
                  {expandSekolah
                    ? <ChevronUp className="w-4 h-4 text-destructive" />
                    : <ChevronDown className="w-4 h-4 text-destructive" />
                  }
                </div>
              </button>

              {/* Detail bulan tunggakan - dropdown */}
              <AnimatePresence>
                {expandSekolah && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden space-y-1.5">
                    {r.tunggakan_sekolah.map((bulan) => (
                      <div key={bulan} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border">
                        <span className="text-sm text-foreground">{bulan.includes('-') ? bulan.split('-').reverse().join(' ') : bulan}</span>
                        <span className="text-sm font-semibold text-destructive">{formatRupiah(r.biaya_sekolah)}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <a href={buildWhatsAppUrl(waSekolah, r, 'sekolah')} target="_blank" rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                <MessageCircle className="w-4 h-4" /> Bayar Tunggakan Sekolah
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Biaya Pesantren ── */}
      {r.is_santri && (
        <div className="rounded-2xl border border-border overflow-hidden">
          {/* Header Pesantren */}
          <div className="flex items-center justify-between p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">Biaya Pesantren</p>
                <p className="text-[10px] text-muted-foreground">
                  Syahriah {formatRupiah(r.biaya_pesantren)} / bulan
                  {r.kategori_pesantren && <span className="ml-1 opacity-70">· {r.kategori_pesantren}</span>}
                </p>
              </div>
            </div>
            {r.tunggakan_pesantren.length > 0 ? (
              <span className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold">
                {r.tunggakan_pesantren.length} bulan tunggakan
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-success/10 text-success text-xs font-bold">✓ Lunas</span>
            )}
          </div>

          {r.tunggakan_pesantren.length > 0 && (
            <div className="p-4 space-y-3">
              {/* Total Tunggakan - Klik untuk expand */}
              <button
                onClick={() => setExpandPesantren(!expandPesantren)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/15 hover:bg-destructive/10 transition-colors">
                <div className="text-left">
                  <span className="text-sm font-bold text-foreground block">Total Tunggakan</span>
                  {r.kategori_pesantren && (
                    <span className="text-[10px] text-muted-foreground">{r.kategori_pesantren}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-destructive">{formatRupiah(r.tunggakan_pesantren.length * r.biaya_pesantren)}</span>
                  {expandPesantren
                    ? <ChevronUp className="w-4 h-4 text-destructive" />
                    : <ChevronDown className="w-4 h-4 text-destructive" />
                  }
                </div>
              </button>

              {/* Detail bulan tunggakan - dropdown */}
              <AnimatePresence>
                {expandPesantren && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden space-y-1.5">
                    {r.tunggakan_pesantren.map((bulan) => (
                      <div key={bulan} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border">
                        <span className="text-sm text-foreground">{bulan.includes('-') ? bulan.split('-').reverse().join(' ') : bulan}</span>
                        <span className="text-sm font-semibold text-destructive">{formatRupiah(r.biaya_pesantren)}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <a href={buildWhatsAppUrl(waPesantren, r, 'pesantren')} target="_blank" rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                <MessageCircle className="w-4 h-4" /> Bayar Tunggakan Pesantren
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 gradient-hero">
        <motion.div animate={{ x: [0, 80, -40, 0], y: [0, -60, 30, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle, hsla(217,80%,55%,0.2) 0%, transparent 70%)' }} />
        <motion.div animate={{ x: [0, -60, 50, 0], y: [0, 40, -80, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[10%] -right-[10%] w-[700px] h-[700px] rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(circle, hsla(200,85%,60%,0.18) 0%, transparent 65%)' }} />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {particles.map((p) =>
          <motion.div key={p.id}
            animate={{ y: [0, -(100 + p.size * 30), -(200 + p.size * 50)], opacity: [0, p.opacity, 0], scale: [0.5, 1, 0.3] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{ left: p.left, bottom: '5%', width: p.size, height: p.size, background: 'hsla(0,0%,100%,0.5)' }} />
        )}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 text-center pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          <motion.img src={logoYB} alt="Logo Yayasan Baitulloh"
            initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-44 h-44 rounded-2xl object-contain mx-auto mb-6 drop-shadow-lg" />
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
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="glass-card rounded-3xl p-8 shadow-elevated">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">NAMA LENGKAP SISWA</label>
              <input type="text" value={nama} onChange={(e) => setNama(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Masukkan nama..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground placeholder:text-muted-foreground input-focus text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">Jenjang</label>
              <select value={jenjang} onChange={(e) => { setJenjang(e.target.value); setKelas(''); }}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground input-focus text-sm">
                <option value="">Semua</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="Reguler">Reguler</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 block text-left uppercase tracking-wider">Kelas</label>
              <select value={kelas} onChange={(e) => setKelas(e.target.value)} disabled={!jenjang}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background/80 text-foreground input-focus text-sm disabled:opacity-50">
                <option value="">{jenjang ? 'Semua' : 'Pilih jenjang'}</option>
                {jenjang && kelasOptionsPublic[jenjang]?.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSearch} disabled={loading}
                className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 btn-shine shadow-glow-primary text-sm disabled:opacity-70">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Mencari...' : 'Cari Data'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Results Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={handleClosePopup}>
            <motion.div initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>

              {/* Popup Header */}
              <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 rounded-t-3xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedResult ? 'Informasi Siswa dan Santri' : 'Hasil Pencarian'}
                  </h3>
                  {selectedResult && (
                    <p className="text-xs text-muted-foreground mt-0.5">Data pembayaran & tunggakan</p>
                  )}
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  onClick={handleClosePopup}
                  className="p-2 rounded-full hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Popup Body */}
              <div className="p-6">
                {results.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <Search className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <p className="text-foreground font-bold text-lg">Data tidak ditemukan</p>
                    <p className="text-sm text-muted-foreground mt-1">Pastikan nama sudah benar</p>
                  </motion.div>
                ) : selectedResult ? (
                  <>
                    {results.length > 1 && (
                      <button onClick={() => setSelectedResult(null)}
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
                      <motion.button key={i} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

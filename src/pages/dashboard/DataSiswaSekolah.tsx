import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Send, Search, Eye, Edit, Trash2, MessageCircle, X, User, AlertTriangle } from 'lucide-react';
import { mockStudents, kelasOptions, bulanList } from '@/data/mockData';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type FilterStatus = '' | 'lunas' | 'menunggak';

export default function DataSiswaSekolah() {
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState<typeof mockStudents[0] | null>(null);
  const [showTunggakan, setShowTunggakan] = useState<typeof mockStudents[0] | null>(null);
  const perPage = 15;

  const filtered = mockStudents.filter(s => {
    const matchSearch = !search || s.namaLengkap.toLowerCase().includes(search.toLowerCase()) || s.nisn.includes(search);
    const matchJenjang = !filterJenjang || s.jenjang === filterJenjang;
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    const matchStatus = !filterStatus ||
      (filterStatus === 'lunas' && s.tunggakanSekolah.length === 0) ||
      (filterStatus === 'menunggak' && s.tunggakanSekolah.length > 0);
    return matchSearch && matchJenjang && matchKelas && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const exportExcel = () => {
    const data = filtered.map((s, i) => ({
      No: i + 1,
      NISN: s.nisn,
      'Nama Lengkap': s.namaLengkap,
      Jenjang: s.jenjang,
      Kelas: s.kelas,
      'Status Pembiayaan': s.tunggakanSekolah.length > 0 ? `Menunggak (${s.tunggakanSekolah.length} bulan)` : 'Lunas',
      'Nama Orang Tua': s.namaOrangTua,
      'No. WhatsApp': s.nomorWhatsApp,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.writeFile(wb, 'data_siswa.xlsx');
    toast.success('Data berhasil diekspor ke Excel');
  };

  const handleDelete = (name: string) => {
    if (confirm(`Apakah anda yakin akan menghapus data ${name}?`)) {
      toast.success('Data berhasil dihapus');
    }
  };

  const sendWhatsApp = (s: typeof mockStudents[0]) => {
    const msg = encodeURIComponent(`Assalamu'alaikum. Yth. ${s.namaOrangTua}, kami informasikan bahwa ${s.namaLengkap} (${s.jenjang} ${s.kelas}) memiliki tunggakan SPP sebanyak ${s.tunggakanSekolah.length} bulan (${s.tunggakanSekolah.join(', ')}). Total: ${formatRupiah(s.tunggakanSekolah.length * s.biayaPerBulan)}. Mohon segera melakukan pembayaran. Terima kasih.`);
    window.open(`https://wa.me/${s.nomorWhatsApp}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Siswa Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola data siswa</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Tambah Data
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Export Excel
          </button>
          {filterStatus === 'menunggak' && (
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-warning text-warning-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" /> Tagih Sekaligus
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-elegant">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari nama atau NISN..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-sm"
            />
          </div>
          <select value={filterJenjang} onChange={e => { setFilterJenjang(e.target.value); setFilterKelas(''); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Semua Jenjang</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
          </select>
          <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }} disabled={!filterJenjang} className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50">
            <option value="">{filterJenjang ? 'Semua Kelas' : 'Pilih jenjang'}</option>
            {filterJenjang && kelasOptions[filterJenjang]?.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value as FilterStatus); setPage(1); }} className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="menunggak">Belum Lunas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">No</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">NISN</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nama Lengkap</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Jenjang</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kelas</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Orang Tua</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">WhatsApp</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, i) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-foreground">{(page - 1) * perPage + i + 1}</td>
                  <td className="py-3 px-4 text-foreground">{s.nisn}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{s.namaLengkap}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.jenjang === 'SMP' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'}`}>{s.jenjang}</span></td>
                  <td className="py-3 px-4 text-foreground">{s.kelas}</td>
                  <td className="py-3 px-4">
                    {s.tunggakanSekolah.length > 0 ? (
                      <button onClick={() => setShowTunggakan(s)} className="px-2 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        {s.tunggakanSekolah.length} bulan
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">Lunas</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{s.namaOrangTua}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{s.nomorWhatsApp}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setShowDetail(s)} className="p-1.5 rounded-lg hover:bg-info/10 text-info transition-colors" title="Lihat">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-warning/10 text-warning transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.namaLengkap)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {s.tunggakanSekolah.length > 0 && (
                        <button onClick={() => sendWhatsApp(s)} className="p-1.5 rounded-lg hover:bg-success/10 text-success transition-colors" title="WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Menampilkan {paginated.length} dari {filtered.length} data</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === i + 1 ? 'gradient-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Popup */}
      <AnimatePresence>
        {showDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowDetail(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Detail Siswa</h3>
                <button onClick={() => setShowDetail(null)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted mb-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center"><User className="w-8 h-8 text-primary-foreground" /></div>
                <div>
                  <h4 className="font-bold text-foreground">{showDetail.namaLengkap}</h4>
                  <p className="text-sm text-muted-foreground">NISN: {showDetail.nisn}</p>
                  <p className="text-sm text-muted-foreground">{showDetail.jenjang} - Kelas {showDetail.kelas}</p>
                  <p className="text-sm text-muted-foreground">Orang Tua: {showDetail.namaOrangTua}</p>
                </div>
              </div>
              {showDetail.tunggakanSekolah.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-destructive" /> Tunggakan:</p>
                  {showDetail.tunggakanSekolah.map(b => (
                    <div key={b} className="flex justify-between p-2 rounded-lg bg-destructive/5 text-sm">
                      <span className="text-foreground">{b}</span>
                      <span className="text-destructive font-medium">{formatRupiah(showDetail.biayaPerBulan)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tunggakan Popup */}
      <AnimatePresence>
        {showTunggakan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowTunggakan(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Detail Tunggakan</h3>
                <button onClick={() => setShowTunggakan(null)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{showTunggakan.namaLengkap} ({showTunggakan.jenjang} {showTunggakan.kelas})</p>
              <div className="space-y-2">
                {showTunggakan.tunggakanSekolah.map(b => (
                  <div key={b} className="flex justify-between p-2 rounded-lg bg-destructive/5 text-sm">
                    <span className="text-foreground">{b}</span>
                    <span className="text-destructive font-medium">{formatRupiah(showTunggakan.biayaPerBulan)}</span>
                  </div>
                ))}
                <div className="flex justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 font-bold text-sm">
                  <span className="text-foreground">Total</span>
                  <span className="text-destructive">{formatRupiah(showTunggakan.tunggakanSekolah.length * showTunggakan.biayaPerBulan)}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Student Popup */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Tambah Data Siswa</h3>
                <button onClick={() => setShowAdd(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={e => { e.preventDefault(); toast.success('Data berhasil ditambahkan'); setShowAdd(false); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-foreground mb-1 block">NISN</label><input className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Nama Lengkap</label><input className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Jenjang</label><select className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required><option value="">Pilih</option><option>SMP</option><option>SMA</option></select></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Kelas</label><input className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-foreground mb-1 block">Nama Orang Tua</label><input className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required /></div>
                  <div><label className="text-sm font-medium text-foreground mb-1 block">No. WhatsApp</label><input className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" required /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Tunggakan Awal (opsional)</label>
                  <p className="text-xs text-muted-foreground mb-2">Pilih bulan-bulan tunggakan jika ada</p>
                  <div className="flex flex-wrap gap-2">
                    {bulanList.map(b => (
                      <label key={b} className="flex items-center gap-1.5 text-xs text-foreground">
                        <input type="checkbox" className="rounded" /> {b}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity">Simpan Data</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { Download, Loader2, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useSantri } from '@/hooks/useSupabaseSantri';
import {
  usePembayaranPesantren, useKonsumsiPesantren, useOperasionalPesantren, usePembangunanPesantren,
  useCicilanPesantren, KATEGORI_LIST, useInsertKonsumsi,
} from '@/hooks/useSupabasePesantren';
import { usePendapatanLainPesantren } from '@/hooks/useSupabasePesantren';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'Pembayaran' | 'Konsumsi' | 'Operasional' | 'Pembangunan' | 'Cicilan' | 'Deposit';
const PAGE_SIZE = 20;
const kelasOptions: Record<string, string[]> = { SMP: ['7A','7B','8A','8B','9A','9B'], SMA: ['10A','10B','11A','11B','12A','12B'] };

const bulanNama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function PendapatanPesantren() {
  const [activeTab, setActiveTab] = useState<Tab>('Pembayaran');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [page, setPage] = useState(1);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [addNama, setAddNama] = useState('');
  const [addNominal, setAddNominal] = useState('');
  const [addKeterangan, setAddKeterangan] = useState('');
  const tabs: Tab[] = ['Pembayaran', 'Konsumsi', 'Operasional', 'Pembangunan', 'Cicilan', 'Deposit'];

  const { data: pembayaran = [], isLoading: l1 } = usePembayaranPesantren();
  const { data: konsumsi = [], isLoading: l2 } = useKonsumsiPesantren();
  const { data: operasional = [], isLoading: l3 } = useOperasionalPesantren();
  const { data: pembangunan = [], isLoading: l4 } = usePembangunanPesantren();
  const { data: cicilan = [], isLoading: l5 } = useCicilanPesantren();
  const { data: students = [], isLoading: l6 } = useStudents();
  const { data: pendapatanLain = [], isLoading: l7 } = usePendapatanLainPesantren();
  const insertKonsumsi = useInsertKonsumsi();

  if (l1 || l2 || l3 || l4 || l5 || l6 || l7) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

  const now = new Date();
  const todayStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const monthStr = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const todayISO = now.toISOString().split('T')[0];
  const currentBulan = bulanNama[now.getMonth()];

  const allData = (): any[] => {
    if (activeTab === 'Pembayaran') {
      return pembayaran.filter(p => p.metode !== 'Deposit' && (!filterJenjang || p.jenjang === filterJenjang) && (!filterKelas || p.kelas === filterKelas) && (!filterKategori || p.kategori === filterKategori));
    }
    if (activeTab === 'Konsumsi') return konsumsi.filter(c => !filterKategori || c.kategori === filterKategori).map(c => ({ ...c, jenjang: '-', kelas: '-' }));
    if (activeTab === 'Operasional') return operasional.filter(c => !filterKategori || c.kategori === filterKategori).map(c => ({ ...c, jenjang: '-', kelas: '-' }));
    if (activeTab === 'Pembangunan') return pembangunan.filter(c => !filterKategori || c.kategori === filterKategori).map(c => ({ ...c, jenjang: '-', kelas: '-' }));
    if (activeTab === 'Cicilan') {
      return cicilan.map(c => ({ ...c, nama_siswa: studentMap[c.siswa_id]?.nama_lengkap || '', jenjang: studentMap[c.siswa_id]?.jenjang || '-', kelas: studentMap[c.siswa_id]?.kelas || '-', kategori: '-', petugas: c.petugas }));
    }
    if (activeTab === 'Deposit') {
      return pembayaran.filter(p => p.metode === 'Deposit' && (!filterJenjang || p.jenjang === filterJenjang) && (!filterKelas || p.kelas === filterKelas) && (!filterKategori || p.kategori === filterKategori));
    }
    return [];
  };

  const data = allData();
  const totalNominal = data.reduce((sum, d) => sum + (d.nominal || 0), 0);
  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const pagedData = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const showJenjangFilter = ['Pembayaran', 'Deposit'].includes(activeTab);
  const showKategoriFilter = !['Cicilan'].includes(activeTab);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab); XLSX.writeFile(wb, `pendapatan_pesantren_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  const handleAddPendapatan = () => {
    if (!addNama || !addNominal) { toast.error('Mohon lengkapi semua field'); return; }
    // Insert into konsumsi_pesantren table
    insertKonsumsi.mutate(
      {
        nama_siswa: addNama,
        kategori: 'Pendapatan Lainnya',
        bulan: currentBulan,
        nominal: parseInt(addNominal.replace(/\D/g, '')),
        tanggal: todayISO,
        petugas: 'Petugas Pesantren',
        siswa_id: null,
        pembayaran_id: null,
      },
      {
        onSuccess: () => {
          setShowAddPopup(false);
          setAddNama('');
          setAddNominal('');
          setAddKeterangan('');
          toast.success('Pendapatan berhasil ditambahkan ke Dana Konsumsi');
        },
      }
    );
  };

  const tabIcons: Record<Tab, string> = { 'Pembayaran': '📌', 'Konsumsi': '🍚', 'Operasional': '🏗️', 'Pembangunan': '🏢', 'Cicilan': '💳', 'Deposit': '💰' };

  const headers = ['No', 'Tanggal', 'Nama', 'Jenjang', 'Kelas', 'Kategori', 'Bulan', 'Nominal', 'Petugas'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pendapatan Pesantren</h1>
          <p className="text-muted-foreground text-sm mt-1">Riwayat pendapatan dari pembayaran santri</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddPopup(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Tambah Pendapatan
          </button>
          <button onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine hover:opacity-90 transition-opacity">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1.5 rounded-2xl flex-wrap">
        {tabs.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setFilterJenjang(''); setFilterKelas(''); setFilterKategori(''); setPage(1); }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}>
            {tabIcons[tab]} {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {showJenjangFilter && (
          <>
            <select value={filterJenjang} onChange={e => { setFilterJenjang(e.target.value); setFilterKelas(''); setPage(1); }} className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
              <option value="">Semua Jenjang</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
            </select>
            <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }} disabled={!filterJenjang} className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus disabled:opacity-50">
              <option value="">{filterJenjang ? 'Semua Kelas' : 'Pilih jenjang'}</option>
              {filterJenjang && kelasOptions[filterJenjang]?.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </>
        )}
        {showKategoriFilter && (
          <select value={filterKategori} onChange={e => { setFilterKategori(e.target.value); setPage(1); }} className="px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
            <option value="">Semua Kategori</option>
            {KATEGORI_LIST.map(k => <option key={k} value={k}>{k}</option>)}
            <option value="Pendapatan Lainnya">Pendapatan Lainnya</option>
          </select>
        )}
      </div>

      {/* Pendapatan Lain Summary */}
      {pendapatanLain.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-elegant">
          <h3 className="text-sm font-bold text-foreground mb-3">📋 Pendapatan Lain-lain (Legacy)</h3>
          <div className="space-y-2">
            {pendapatanLain.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{formatDate(p.tanggal)}</span>
                  <span className="font-semibold text-foreground">{p.nama}</span>
                </div>
                <span className="font-bold text-primary">{formatRupiah(p.nominal)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table key={activeTab} className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {headers.map(h => (
                  <th key={h} className={`py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider ${h === 'Nominal' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedData.length === 0 && (
                <tr><td colSpan={9} className="py-16 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3"><Download className="w-8 h-8 text-muted-foreground/30" /></div>Tidak ada data
                </td></tr>
              )}
              {pagedData.map((p: any, i: number) => (
                <tr key={p.id} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(p.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{p.nama_siswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{p.jenjang}</span></td>
                  <td className="py-4 px-4 text-foreground">{p.kelas}</td>
                  <td className="py-4 px-4"><span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-semibold">{p.kategori}</span></td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-bold">{p.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(p.nominal)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{p.petugas}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 border-t-2 border-border">
                <td colSpan={8} className="py-4 px-4 font-bold text-foreground text-sm">TOTAL — {todayStr} · {monthStr}</td>
                <td className="py-4 px-4 text-right font-extrabold text-primary text-base">{formatRupiah(totalNominal)}</td>
              </tr>
              <tr className="bg-muted/30">
                <td colSpan={9} className="py-2 px-4 text-xs text-muted-foreground text-center">Total dari {data.length} transaksi</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <span className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-border bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Popup Tambah Pendapatan */}
      {showAddPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowAddPopup(false)}>
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-lg">Tambah Pendapatan Lainnya</h3>
              <button onClick={() => setShowAddPopup(false)} className="p-2 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl">💡 Pendapatan lainnya akan otomatis masuk ke <span className="font-bold text-foreground">Dana Konsumsi</span></p>

            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Tanggal</label>
              <input type="text" value={todayStr} disabled className="w-full px-4 py-3.5 rounded-xl border border-border bg-muted text-foreground text-sm cursor-not-allowed" />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nama Pemasukan</label>
              <select value={addNama} onChange={e => setAddNama(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
                <option value="">Pilih</option>
                <option value="Sodaqoh">Sodaqoh</option>
                <option value="Sisa Pendapatan Bulan Lalu">Sisa Pendapatan Bulan Lalu</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Nominal</label>
              <input value={addNominal ? formatRupiah(parseInt(addNominal)) : ''} onChange={e => setAddNominal(e.target.value.replace(/\D/g, ''))} placeholder="Rp 0" className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground mb-2 block uppercase tracking-wider">Keterangan (Opsional)</label>
              <input value={addKeterangan} onChange={e => setAddKeterangan(e.target.value)} placeholder="Keterangan tambahan..." className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground input-focus text-sm" />
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddPendapatan} disabled={insertKonsumsi.isPending} className="flex-1 py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold btn-shine disabled:opacity-50">
                {insertKonsumsi.isPending ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={() => setShowAddPopup(false)} className="flex-1 py-3.5 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-muted transition-colors">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

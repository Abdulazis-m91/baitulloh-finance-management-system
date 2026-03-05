import { useState } from 'react';
import { Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStudents } from '@/hooks/useSupabaseData';
import {
  usePembayaranPesantren, useKonsumsiPesantren, useOperasionalPesantren, usePembangunanPesantren,
  useCicilanPesantren, KATEGORI_LIST,
} from '@/hooks/useSupabasePesantren';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'Pembayaran' | 'Konsumsi' | 'Operasional' | 'Pembangunan' | 'Cicilan' | 'Deposit';
const PAGE_SIZE = 20;
const kelasOptions: Record<string, string[]> = { SMP: ['7A','7B','8A','8B','9A','9B'], SMA: ['10A','10B','11A','11B','12A','12B'] };

export default function PendapatanPesantren() {
  const [activeTab, setActiveTab] = useState<Tab>('Pembayaran');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [page, setPage] = useState(1);
  const tabs: Tab[] = ['Pembayaran', 'Konsumsi', 'Operasional', 'Pembangunan', 'Cicilan', 'Deposit'];

  const { data: pembayaran = [], isLoading: l1 } = usePembayaranPesantren();
  const { data: konsumsi = [], isLoading: l2 } = useKonsumsiPesantren();
  const { data: operasional = [], isLoading: l3 } = useOperasionalPesantren();
  const { data: pembangunan = [], isLoading: l4 } = usePembangunanPesantren();
  const { data: cicilan = [], isLoading: l5 } = useCicilanPesantren();
  const { data: students = [], isLoading: l6 } = useStudents();

  if (l1 || l2 || l3 || l4 || l5 || l6) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

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

  const today = new Date();
  const todayStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const monthStr = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const showJenjangFilter = ['Pembayaran', 'Deposit'].includes(activeTab);
  const showKategoriFilter = !['Cicilan'].includes(activeTab);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab); XLSX.writeFile(wb, `pendapatan_pesantren_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  const tabIcons: Record<Tab, string> = { 'Pembayaran': '📌', 'Konsumsi': '🍚', 'Operasional': '🏗️', 'Pembangunan': '🏢', 'Cicilan': '💳', 'Deposit': '💰' };

  const renderHeaders = (): string[] => {
    return ['No', 'Tanggal', 'Nama', 'Jenjang', 'Kelas', 'Kategori', 'Bulan', 'Nominal', 'Petugas'];
  };

  const headers = renderHeaders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Pendapatan Pesantren</h1>
          <p className="text-muted-foreground text-sm mt-1">Riwayat pendapatan dari pembayaran santri</p>
        </div>
        <button onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine hover:opacity-90 transition-opacity">
          <Download className="w-4 h-4" /> Export Excel
        </button>
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
          </select>
        )}
      </div>

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
                <tr><td colSpan={headers.length} className="py-16 text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3"><Download className="w-8 h-8 text-muted-foreground/30" /></div>Tidak ada data
                </td></tr>
              )}

              {(activeTab === 'Pembayaran' || activeTab === 'Deposit') && pagedData.map((p: any, i: number) => (
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

              {(['Konsumsi', 'Operasional', 'Pembangunan'] as Tab[]).includes(activeTab) && pagedData.map((c: any, i: number) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(c.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{c.nama_siswa}</td>
                  <td className="py-4 px-4"><span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-semibold">{c.kategori}</span></td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-accent/50 text-accent-foreground text-xs font-bold">{c.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(c.nominal)}</td>
                  <td className="py-4 px-4 text-muted-foreground">{c.petugas}</td>
                </tr>
              ))}

              {activeTab === 'Cicilan' && pagedData.map((c: any, i: number) => (
                <tr key={c.id} className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                  <td className="py-4 px-4 text-muted-foreground">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-4 px-4 text-muted-foreground">{formatDate(c.tanggal)}</td>
                  <td className="py-4 px-4 text-foreground font-semibold">{c.namaSiswa}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold">{c.jenjang}</span></td>
                  <td className="py-4 px-4 text-foreground">{c.kelas}</td>
                  <td className="py-4 px-4"><span className="px-2.5 py-1 rounded-lg bg-warning/10 text-warning text-xs font-bold">{c.bulan}</span></td>
                  <td className="py-4 px-4 text-right text-foreground font-bold">{formatRupiah(c.nominal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 border-t-2 border-border">
                <td colSpan={headers.length - 1} className="py-4 px-4 font-bold text-foreground text-sm">TOTAL — {todayStr} · {monthStr}</td>
                <td className="py-4 px-4 text-right font-extrabold text-primary text-base">{formatRupiah(totalNominal)}</td>
              </tr>
              <tr className="bg-muted/30">
                <td colSpan={headers.length} className="py-2 px-4 text-xs text-muted-foreground text-center">Total dari {data.length} transaksi</td>
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
    </div>
  );
}

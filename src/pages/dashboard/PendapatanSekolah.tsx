import { useState } from 'react';
import { Download } from 'lucide-react';
import { mockPembayaran, mockStudents } from '@/data/mockData';
import { formatRupiah, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'SMP' | 'SMA' | 'Cicil' | 'Deposit';

export default function PendapatanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');
  const [filterKelas, setFilterKelas] = useState('');

  const tabs: Tab[] = ['SMP', 'SMA', 'Cicil', 'Deposit'];

  const filteredData = () => {
    if (activeTab === 'SMP' || activeTab === 'SMA') {
      return mockPembayaran.filter(p => {
        const matchJenjang = p.jenjang === activeTab;
        const matchKelas = !filterKelas || p.kelas === filterKelas;
        return matchJenjang && matchKelas && p.metode !== 'Deposit';
      });
    }
    if (activeTab === 'Cicil') {
      return mockStudents.filter(s => s.cicilan.length > 0).flatMap(s =>
        s.cicilan.map(c => ({ ...c, namaSiswa: s.namaLengkap, jenjang: s.jenjang, kelas: s.kelas }))
      );
    }
    if (activeTab === 'Deposit') {
      return mockStudents.filter(s => s.deposit > 0).map(s => ({
        id: s.id, namaSiswa: s.namaLengkap, deposit: s.deposit, jenjang: s.jenjang, kelas: s.kelas
      }));
    }
    return [];
  };

  const kelasOpts = activeTab === 'SMP' ? ['7A', '7B', '8A', '8B', '9A', '9B'] : ['10A', '10B', '11A', '11B', '12A', '12B'];

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData() as any[]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab);
    XLSX.writeFile(wb, `pendapatan_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Data berhasil diekspor');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pendapatan Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">Riwayat pendapatan dari pembayaran siswa</p>
        </div>
        <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFilterKelas(''); }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filter */}
      {(activeTab === 'SMP' || activeTab === 'SMA') && (
        <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">Semua Kelas</option>
          {kelasOpts.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      )}

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {(activeTab === 'SMP' || activeTab === 'SMA') && (
                  <>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tanggal</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nama</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Bulan</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Nominal</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Petugas</th>
                  </>
                )}
                {activeTab === 'Cicil' && (
                  <>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nama</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Bulan</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Nominal</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tanggal</th>
                  </>
                )}
                {activeTab === 'Deposit' && (
                  <>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Nama</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Jenjang</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kelas</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Deposit</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'SMP' || activeTab === 'SMA') && (filteredData() as any[]).map((p: any) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-foreground">{formatDate(p.tanggal)}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{p.namaSiswa}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.bulan}</td>
                  <td className="py-3 px-4 text-right text-foreground font-medium">{formatRupiah(p.nominal)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{p.petugas}</td>
                </tr>
              ))}
              {activeTab === 'Cicil' && (filteredData() as any[]).map((c: any) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-foreground font-medium">{c.namaSiswa}</td>
                  <td className="py-3 px-4 text-muted-foreground">{c.bulan}</td>
                  <td className="py-3 px-4 text-right text-foreground font-medium">{formatRupiah(c.nominal)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{formatDate(c.tanggal)}</td>
                </tr>
              ))}
              {activeTab === 'Deposit' && (filteredData() as any[]).map((d: any) => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 text-foreground font-medium">{d.namaSiswa}</td>
                  <td className="py-3 px-4 text-muted-foreground">{d.jenjang}</td>
                  <td className="py-3 px-4 text-muted-foreground">{d.kelas}</td>
                  <td className="py-3 px-4 text-right text-foreground font-medium">{formatRupiah(d.deposit)}</td>
                </tr>
              ))}
              {filteredData().length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Tidak ada data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

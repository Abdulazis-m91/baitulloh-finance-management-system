import { useState } from 'react';
import { Download } from 'lucide-react';
import { mockStudents, mockPembayaran, mockPengeluaran } from '@/data/mockData';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'SMP' | 'SMA';

export default function LaporanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');

  const data = (jenjang: Tab) => {
    const pembayaranJenjang = mockPembayaran.filter(p => p.jenjang === jenjang);
    const pengeluaranJenjang = mockPengeluaran.filter(e => e.sumberDana === jenjang);
    const siswaMenunggak = mockStudents.filter(s => s.jenjang === jenjang && s.tunggakanSekolah.length > 0);

    const totalPemasukan = pembayaranJenjang.reduce((a, p) => a + p.nominal, 0);
    const totalPengeluaran = pengeluaranJenjang.reduce((a, e) => a + e.nominal, 0);
    const totalTunggakan = siswaMenunggak.reduce((a, s) => a + s.tunggakanSekolah.length * s.biayaPerBulan, 0);
    const jumlahMembayar = new Set(pembayaranJenjang.map(p => p.siswaId)).size;

    return { totalPemasukan, totalPengeluaran, totalTunggakan, jumlahMembayar, jumlahMenunggak: siswaMenunggak.length };
  };

  const d = data(activeTab);

  const exportExcel = () => {
    const rows = [
      { Kategori: 'Pemasukan', Keterangan: `Jumlah Siswa Membayar: ${d.jumlahMembayar}`, Nominal: d.totalPemasukan },
      { Kategori: 'Pengeluaran', Keterangan: '', Nominal: d.totalPengeluaran },
      { Kategori: 'Sisa Keuangan', Keterangan: '', Nominal: d.totalPemasukan - d.totalPengeluaran },
      { Kategori: '', Keterangan: '', Nominal: '' },
      { Kategori: 'Tunggakan', Keterangan: `Jumlah Siswa Menunggak: ${d.jumlahMenunggak}`, Nominal: d.totalTunggakan },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Laporan ${activeTab}`);
    XLSX.writeFile(wb, `laporan_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Laporan berhasil diekspor');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">Laporan keuangan periode bulan ini</p>
        </div>
        <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success text-success-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
          <Download className="w-4 h-4" /> Export Excel
        </button>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {(['SMP', 'SMA'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            Laporan {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabel Keuangan */}
        <div className="bg-card rounded-2xl border border-border shadow-elegant overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-bold text-foreground">Laporan Keuangan {activeTab}</h3>
            <p className="text-xs text-muted-foreground">Periode: 1 sd akhir bulan Maret 2026</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kategori</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Detail</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Nominal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 bg-success/5">
                <td className="py-3 px-4 text-foreground font-medium">Pemasukan</td>
                <td className="py-3 px-4 text-muted-foreground">{d.jumlahMembayar} siswa membayar</td>
                <td className="py-3 px-4 text-right text-success font-bold">{formatRupiah(d.totalPemasukan)}</td>
              </tr>
              <tr className="border-b border-border/50 bg-destructive/5">
                <td className="py-3 px-4 text-foreground font-medium">Pengeluaran</td>
                <td className="py-3 px-4 text-muted-foreground">Periode bulan ini</td>
                <td className="py-3 px-4 text-right text-destructive font-bold">{formatRupiah(d.totalPengeluaran)}</td>
              </tr>
              <tr className="bg-primary/5">
                <td className="py-3 px-4 text-foreground font-bold">Sisa Keuangan</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-right text-primary font-bold text-lg">{formatRupiah(d.totalPemasukan - d.totalPengeluaran)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel Tunggakan */}
        <div className="bg-card rounded-2xl border border-border shadow-elegant overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-bold text-foreground">Laporan Tunggakan {activeTab}</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Keterangan</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 text-foreground font-medium">Jumlah Siswa Menunggak</td>
                <td className="py-3 px-4 text-right text-foreground font-bold">{d.jumlahMenunggak} siswa</td>
              </tr>
              <tr className="bg-destructive/5">
                <td className="py-3 px-4 text-foreground font-bold">Total Nominal Tunggakan</td>
                <td className="py-3 px-4 text-right text-destructive font-bold text-lg">{formatRupiah(d.totalTunggakan)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

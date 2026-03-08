import { useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { Download, TrendingUp, TrendingDown, Wallet, AlertTriangle, Loader2, Info, Users, Printer } from 'lucide-react';
import { useSantri } from '@/hooks/useSupabaseSantri';
import {
  usePembayaranPesantren, useKonsumsiPesantren, useOperasionalPesantren, usePembangunanPesantren,
  usePengeluaranPesantren, usePendapatanLainPesantren, KATEGORI_LIST,
} from '@/hooks/useSupabasePesantren';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'Konsumsi' | 'Operasional' | 'Pembangunan' | 'Total';

const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function LaporanPesantren() {
  const [activeTab, setActiveTab] = useState<Tab>('Total');

  const { data: students = [], isLoading: l1 } = useSantri();
  const { data: pembayaran = [], isLoading: l2 } = usePembayaranPesantren();
  const { data: konsumsi = [], isLoading: l3 } = useKonsumsiPesantren();
  const { data: operasional = [], isLoading: l4 } = useOperasionalPesantren();
  const { data: pembangunanData = [], isLoading: l5 } = usePembangunanPesantren();
  const { data: pengeluaranAll = [], isLoading: l6 } = usePengeluaranPesantren();
  const { data: pendapatanLain = [], isLoading: l7 } = usePendapatanLainPesantren();

  if (l1 || l2 || l3 || l4 || l5 || l6 || l7) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const now = new Date();
  const bulanIni = bulanNama[now.getMonth()];
  const tahunIni = now.getFullYear();
  const bulanTahun = `${bulanIni.toUpperCase()} - ${tahunIni}`;

  // Pendapatan per kategori (dari tabel komponen + pendapatan lain masuk konsumsi)
  const totalKonsumsi = konsumsi.reduce((a, c) => a + c.nominal, 0);
  const totalPendapatanLain = pendapatanLain.reduce((a, p) => a + p.nominal, 0);
  const totalOperasional = operasional.reduce((a, c) => a + c.nominal, 0);
  const totalPembangunan = pembangunanData.reduce((a, c) => a + c.nominal, 0);

  const pendapatanKonsumsi = totalKonsumsi + totalPendapatanLain;
  const pendapatanOperasional = totalOperasional;
  const pendapatanPembangunan = totalPembangunan;
  const totalPendapatan = pendapatanKonsumsi + pendapatanOperasional + pendapatanPembangunan;

  // Pengeluaran per kategori
  const pengeluaranByDana = (dana: string) => pengeluaranAll.filter(e => e.jenis_keperluan.startsWith(dana)).reduce((a, e) => a + e.nominal, 0);
  const pengeluaranKonsumsi = pengeluaranByDana('Konsumsi');
  const pengeluaranOperasional = pengeluaranByDana('Operasional');
  const pengeluaranPembangunan = pengeluaranByDana('Pembangunan');
  const totalPengeluaran = pengeluaranKonsumsi + pengeluaranOperasional + pengeluaranPembangunan;

  // Tunggakan pesantren
  const getTunggakanPerKelas = (jenjang: 'SMP' | 'SMA') => {
    const allKelas = [...new Set(students.filter(s => s.jenjang === jenjang).map(s => s.kelas))].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
    return allKelas.map(kelas => {
      const siswa = students.filter(s => s.jenjang === jenjang && s.kelas === kelas && s.tunggakan_pesantren.length > 0);
      const nominal = siswa.reduce((a, s) => a + s.tunggakan_pesantren.length * s.biaya_per_bulan, 0);
      return { kelas, jumlah: siswa.length, nominal };
    });
  };

  const totalTunggakanSMP = students.filter(s => s.jenjang === 'SMP' && s.tunggakan_pesantren.length > 0).reduce((a, s) => a + s.tunggakan_pesantren.length * s.biaya_per_bulan, 0);
  const totalTunggakanSMA = students.filter(s => s.jenjang === 'SMA' && s.tunggakan_pesantren.length > 0).reduce((a, s) => a + s.tunggakan_pesantren.length * s.biaya_per_bulan, 0);
  const jumlahMenunggakSMP = students.filter(s => s.jenjang === 'SMP' && s.tunggakan_pesantren.length > 0).length;
  const jumlahMenunggakSMA = students.filter(s => s.jenjang === 'SMA' && s.tunggakan_pesantren.length > 0).length;
  const totalTunggakan = totalTunggakanSMP + totalTunggakanSMA;

  const getDanaData = (dana: 'Konsumsi' | 'Operasional' | 'Pembangunan') => {
    const pendapatan = dana === 'Konsumsi' ? pendapatanKonsumsi : dana === 'Operasional' ? pendapatanOperasional : pendapatanPembangunan;
    const pengeluaran = dana === 'Konsumsi' ? pengeluaranKonsumsi : dana === 'Operasional' ? pengeluaranOperasional : pengeluaranPembangunan;
    return { pendapatan, pengeluaran, sisa: pendapatan - pengeluaran };
  };

  const exportExcel = () => {
    const rows = activeTab === 'Total'
      ? [
          { Kategori: 'Pendapatan Konsumsi', Nominal: pendapatanKonsumsi },
          { Kategori: 'Pendapatan Operasional', Nominal: pendapatanOperasional },
          { Kategori: 'Pendapatan Pembangunan', Nominal: pendapatanPembangunan },
          { Kategori: 'TOTAL PENDAPATAN', Nominal: totalPendapatan },
          { Kategori: '', Nominal: '' },
          { Kategori: 'Pengeluaran Konsumsi', Nominal: pengeluaranKonsumsi },
          { Kategori: 'Pengeluaran Operasional', Nominal: pengeluaranOperasional },
          { Kategori: 'Pengeluaran Pembangunan', Nominal: pengeluaranPembangunan },
          { Kategori: 'TOTAL PENGELUARAN', Nominal: totalPengeluaran },
          { Kategori: '', Nominal: '' },
          { Kategori: `SISA KEUANGAN (${bulanTahun})`, Nominal: totalPendapatan - totalPengeluaran },
        ]
      : (() => {
          const d = getDanaData(activeTab);
          return [
            { Kategori: `Pendapatan ${activeTab}`, Nominal: d.pendapatan },
            { Kategori: `Pengeluaran ${activeTab}`, Nominal: d.pengeluaran },
            { Kategori: `Sisa Dana ${activeTab}`, Nominal: d.sisa },
          ];
        })();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Laporan ${activeTab}`);
    XLSX.writeFile(wb, `laporan_pesantren_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Laporan berhasil diekspor');
  };

  const handlePrint = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const w = doc.internal.pageSize.getWidth();
    const margin = 15;
    const cw = w - margin * 2;
    let y = 15;

    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN TOTAL KEUANGAN PESANTREN', w / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
    doc.text(`Periode: ${bulanIni} ${tahunIni}`, w / 2, y, { align: 'center' });
    y += 10; doc.setTextColor(0);

    const drawRow = (label: string, value: string, bold = false, color: [number, number, number] = [0, 0, 0]) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(bold ? 11 : 9);
      doc.setTextColor(0); doc.text(label, margin + 2, y);
      doc.setTextColor(...color); doc.text(value, w - margin - 2, y, { align: 'right' });
      doc.setTextColor(0); y += bold ? 6 : 5;
    };

    const drawSectionTitle = (title: string) => {
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(margin, y - 4, cw, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      doc.text(title, margin + 3, y + 1); y += 10;
    };

    const drawLine = () => { doc.setDrawColor(200); doc.line(margin, y, w - margin, y); y += 4; };

    drawSectionTitle('LAPORAN PENDAPATAN');
    drawRow('Pendapatan Konsumsi', formatRupiah(pendapatanKonsumsi), false, [22, 163, 74]);
    drawRow('Pendapatan Operasional', formatRupiah(pendapatanOperasional), false, [22, 163, 74]);
    drawRow('Pendapatan Pembangunan', formatRupiah(pendapatanPembangunan), false, [22, 163, 74]);
    drawRow('TOTAL PENDAPATAN', formatRupiah(totalPendapatan), true, [22, 163, 74]);
    y += 4;

    drawSectionTitle('LAPORAN PENGELUARAN');
    drawRow('Pengeluaran Konsumsi', formatRupiah(pengeluaranKonsumsi), false, [220, 38, 38]);
    drawRow('Pengeluaran Operasional', formatRupiah(pengeluaranOperasional), false, [220, 38, 38]);
    drawRow('Pengeluaran Pembangunan', formatRupiah(pengeluaranPembangunan), false, [220, 38, 38]);
    drawRow('TOTAL PENGELUARAN', formatRupiah(totalPengeluaran), true, [220, 38, 38]);
    y += 4;

    drawLine();
    drawRow(`SISA KEUANGAN PESANTREN (${bulanTahun})`, formatRupiah(totalPendapatan - totalPengeluaran), true, [37, 99, 235]);
    y += 6;

    drawSectionTitle('TOTAL TUNGGAKAN PESANTREN');
    drawRow('Tunggakan SMP', formatRupiah(totalTunggakanSMP), true, [220, 38, 38]);
    getTunggakanPerKelas('SMP').forEach(k => {
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120);
      doc.text(`   Kelas ${k.kelas}: ${k.jumlah} siswa - ${formatRupiah(k.nominal)}`, margin + 2, y); y += 4;
    });
    y += 2; doc.setTextColor(0);
    drawRow('Tunggakan SMA', formatRupiah(totalTunggakanSMA), true, [220, 38, 38]);
    getTunggakanPerKelas('SMA').forEach(k => {
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(120);
      doc.text(`   Kelas ${k.kelas}: ${k.jumlah} siswa - ${formatRupiah(k.nominal)}`, margin + 2, y); y += 4;
    });
    y += 2; doc.setTextColor(0);
    drawLine();
    drawRow(`TOTAL TUNGGAKAN (${bulanTahun})`, formatRupiah(totalTunggakan), true, [220, 38, 38]);
    y += 8;

    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(150);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, y);
    doc.save(`Laporan-Pesantren-${bulanIni}-${tahunIni}.pdf`);
    toast.success('Laporan PDF berhasil didownload');
  };

  const renderDanaTab = (dana: 'Konsumsi' | 'Operasional' | 'Pembangunan') => {
    const d = getDanaData(dana);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-4 h-4 text-primary-foreground" /></div>
              Laporan Dana {dana}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Periode: {bulanIni} {tahunIni}</p>
          </div>
          <div className="divide-y divide-border">
            <div className="p-6 flex items-center justify-between bg-success/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success-foreground" /></div>
                <div><p className="font-bold text-foreground">Pendapatan</p><p className="text-xs text-muted-foreground">Total pemasukan dana {dana.toLowerCase()}</p></div>
              </div>
              <p className="text-xl font-extrabold text-success">{formatRupiah(d.pendapatan)}</p>
            </div>
            <div className="p-6 flex items-center justify-between bg-destructive/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive-foreground" /></div>
                <div><p className="font-bold text-foreground">Pengeluaran</p><p className="text-xs text-muted-foreground">Total pengeluaran dana {dana.toLowerCase()}</p></div>
              </div>
              <p className="text-xl font-extrabold text-destructive">{formatRupiah(d.pengeluaran)}</p>
            </div>
            <div className="p-6 flex items-center justify-between gradient-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold"><Wallet className="w-5 h-5 text-foreground" /></div>
                <p className="font-extrabold text-foreground">Sisa Dana {dana}</p>
              </div>
              <p className="text-2xl font-extrabold text-primary">{formatRupiah(d.sisa)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning-foreground" /></div>
              Tunggakan Pesantren
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="text-center p-8 rounded-2xl bg-destructive/5 border border-destructive/10">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Jumlah Santri Menunggak</p>
              <p className="text-5xl font-extrabold text-destructive mb-1">{jumlahMenunggakSMP + jumlahMenunggakSMA}</p>
              <p className="text-sm text-muted-foreground">santri</p>
            </div>
            <div className="text-center p-8 rounded-2xl gradient-card border border-destructive/10">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Total Nominal Tunggakan</p>
              <p className="text-3xl font-extrabold text-destructive">{formatRupiah(totalTunggakan)}</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  const renderTotalTab = () => {
    const sisaKeuangan = totalPendapatan - totalPengeluaran;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Laporan Keuangan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-4 h-4 text-primary-foreground" /></div>
                Laporan Total Keuangan Pesantren
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Periode: {bulanIni} {tahunIni}</p>
            </div>
            <div className="divide-y divide-border">
              <div className="p-6 bg-success/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL PENDAPATAN</p>
                  </div>
                  <p className="text-2xl font-extrabold text-success">{formatRupiah(totalPendapatan)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  <p className="text-xs text-muted-foreground">Konsumsi : <span className="font-semibold text-foreground">{formatRupiah(pendapatanKonsumsi)}</span></p>
                  <p className="text-xs text-muted-foreground">Operasional : <span className="font-semibold text-foreground">{formatRupiah(pendapatanOperasional)}</span></p>
                  <p className="text-xs text-muted-foreground">Pembangunan : <span className="font-semibold text-foreground">{formatRupiah(pendapatanPembangunan)}</span></p>
                </div>
              </div>
              <div className="p-6 bg-destructive/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL PENGELUARAN</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(totalPengeluaran)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  <p className="text-xs text-muted-foreground">Konsumsi : <span className="font-semibold text-foreground">{formatRupiah(pengeluaranKonsumsi)}</span></p>
                  <p className="text-xs text-muted-foreground">Operasional : <span className="font-semibold text-foreground">{formatRupiah(pengeluaranOperasional)}</span></p>
                  <p className="text-xs text-muted-foreground">Pembangunan : <span className="font-semibold text-foreground">{formatRupiah(pengeluaranPembangunan)}</span></p>
                </div>
              </div>
              <div className="p-6 gradient-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold"><Wallet className="w-5 h-5 text-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">SISA KEUANGAN ({bulanTahun})</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary">{formatRupiah(sisaKeuangan)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tunggakan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-destructive/20 shadow-elegant overflow-hidden" style={{ backgroundColor: 'hsl(0 84% 60% / 0.08)' }}>
            <div className="p-6 border-b border-destructive/15" style={{ backgroundColor: 'hsl(0 84% 60% / 0.12)' }}>
              <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-danger flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-destructive-foreground" /></div>
                TOTAL TUNGGAKAN PESANTREN
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Periode : {bulanIni} - {tahunIni}</p>
            </div>
            <div className="divide-y divide-destructive/10">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Users className="w-5 h-5 text-destructive" /></div>
                    <p className="font-extrabold text-foreground text-lg">TUNGGAKAN SMP</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(totalTunggakanSMP)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  {getTunggakanPerKelas('SMP').map(k => (
                    <p key={k.kelas} className="text-xs text-muted-foreground">Kelas {k.kelas} : <span className="font-semibold text-foreground">{k.jumlah} santri</span> - <span className="font-semibold text-destructive">{formatRupiah(k.nominal)}</span></p>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Users className="w-5 h-5 text-destructive" /></div>
                    <p className="font-extrabold text-foreground text-lg">TUNGGAKAN SMA</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(totalTunggakanSMA)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  {getTunggakanPerKelas('SMA').map(k => (
                    <p key={k.kelas} className="text-xs text-muted-foreground">Kelas {k.kelas} : <span className="font-semibold text-foreground">{k.jumlah} santri</span> - <span className="font-semibold text-destructive">{formatRupiah(k.nominal)}</span></p>
                  ))}
                </div>
              </div>
              <div className="p-6" style={{ backgroundColor: 'hsl(0 84% 60% / 0.12)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-destructive-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL TUNGGAKAN ({bulanTahun})</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(totalTunggakan)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>Ini adalah sisa keuangan pesantren <span className="font-bold text-foreground">{bulanIni} {tahunIni}</span> saat ini.</p>
              <p>Silahkan dicetak dan diarsipkan.</p>
              <p>Sisa keuangan pesantren bisa dimasukan secara manual di halaman <span className="font-bold text-foreground">Pendapatan Pesantren</span>.</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Laporan Pesantren</h1>
          <p className="text-muted-foreground text-sm mt-1">Laporan keuangan periode {bulanIni} {tahunIni}</p>
        </motion.div>
        <div className="flex gap-2 flex-wrap">
          {activeTab === 'Total' && (
            <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine">
              <Printer className="w-4 h-4" /> Cetak Laporan
            </button>
          )}
          <button onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit flex-wrap">
        {(['Konsumsi', 'Operasional', 'Pembangunan', 'Total'] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'Total' ? 'Laporan Total' : `Dana ${tab}`}
          </button>
        ))}
      </div>

      {activeTab === 'Total' ? renderTotalTab() : renderDanaTab(activeTab)}
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { Download, TrendingUp, TrendingDown, Wallet, AlertTriangle, Loader2, Info, Users, Printer } from 'lucide-react';
import { useStudents, usePembayaran, usePengeluaran } from '@/hooks/useSupabaseData';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'SMP' | 'SMA' | 'Total';

const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export default function LaporanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');
  const { data: students = [], isLoading: l1 } = useStudents();
  const { data: pembayaranAll = [], isLoading: l2 } = usePembayaran();
  const { data: pengeluaranAll = [], isLoading: l3 } = usePengeluaran();

  if (l1 || l2 || l3) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const now = new Date();
  const bulanIni = bulanNama[now.getMonth()];
  const tahunIni = now.getFullYear();
  const bulanTahun = `${bulanIni.toUpperCase()} - ${tahunIni}`;

  const getTunggakanPerKelas = (jenjang: 'SMP' | 'SMA') => {
    const allKelas = [...new Set(students.filter(s => s.jenjang === jenjang).map(s => s.kelas))].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
    return allKelas.map(kelas => {
      const siswa = students.filter(s => s.jenjang === jenjang && s.kelas === kelas && s.tunggakan_sekolah.length > 0);
      const nominal = siswa.reduce((a, s) => a + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0);
      return { kelas, jumlah: siswa.length, nominal };
    });
  };

  const getData = (jenjang: 'SMP' | 'SMA') => {
    const pembayaran = pembayaranAll.filter(p => p.jenjang === jenjang && p.metode === 'Lunas');
    const pengeluaran = pengeluaranAll.filter(e => e.sumber_dana === jenjang);
    const siswaMenunggak = students.filter(s => s.jenjang === jenjang && s.tunggakan_sekolah.length > 0);
    const totalPemasukan = pembayaran.reduce((a, p) => a + p.nominal, 0);
    const totalPengeluaran = pengeluaran.reduce((a, e) => a + e.nominal, 0);
    const totalTunggakan = siswaMenunggak.reduce((a, s) => a + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0);
    return { totalPemasukan, totalPengeluaran, totalTunggakan, jumlahMembayar: new Set(pembayaran.map(p => p.siswa_id)).size, jumlahMenunggak: siswaMenunggak.length };
  };

  const smp = getData('SMP');
  const sma = getData('SMA');

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    if (activeTab === 'Total') {
      const rows = [
        { Kategori: 'Total Pendapatan SMP', Nominal: smp.totalPemasukan },
        { Kategori: 'Total Pendapatan SMA', Nominal: sma.totalPemasukan },
        { Kategori: 'TOTAL PENDAPATAN', Nominal: smp.totalPemasukan + sma.totalPemasukan },
        { Kategori: '', Nominal: '' },
        { Kategori: 'Total Pengeluaran SMP', Nominal: smp.totalPengeluaran },
        { Kategori: 'Total Pengeluaran SMA', Nominal: sma.totalPengeluaran },
        { Kategori: 'TOTAL PENGELUARAN', Nominal: smp.totalPengeluaran + sma.totalPengeluaran },
        { Kategori: '', Nominal: '' },
        { Kategori: `SISA KEUANGAN (${bulanTahun})`, Nominal: (smp.totalPemasukan + sma.totalPemasukan) - (smp.totalPengeluaran + sma.totalPengeluaran) },
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Total');
      XLSX.writeFile(wb, 'laporan_total.xlsx');
    } else {
      const d = getData(activeTab);
      const rows = [
        { Kategori: 'Pemasukan', Detail: `${d.jumlahMembayar} siswa`, Nominal: d.totalPemasukan },
        { Kategori: 'Pengeluaran', Detail: 'Periode bulan ini', Nominal: d.totalPengeluaran },
        { Kategori: 'Sisa Keuangan', Detail: '', Nominal: d.totalPemasukan - d.totalPengeluaran },
        { Kategori: '', Detail: '', Nominal: '' },
        { Kategori: 'Tunggakan', Detail: `${d.jumlahMenunggak} siswa`, Nominal: d.totalTunggakan },
      ];
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Laporan ${activeTab}`);
      XLSX.writeFile(wb, `laporan_${activeTab.toLowerCase()}.xlsx`);
    }
    toast.success('Laporan berhasil diekspor');
  };

  // ── Generate PDF Profesional ───────────────────────────────────────────────
  const handlePrint = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = doc.internal.pageSize.getWidth();   // 210
    const H = doc.internal.pageSize.getHeight();  // 297
    const margin = 14;
    const cw = W - margin * 2;
    let y = 0;

    const totalPendapatan  = smp.totalPemasukan  + sma.totalPemasukan;
    const totalPengeluaran = smp.totalPengeluaran + sma.totalPengeluaran;
    const sisaKeuangan     = totalPendapatan - totalPengeluaran;
    const totalTunggakan   = smp.totalTunggakan  + sma.totalTunggakan;

    // ── Warna ──
    const C = {
      primary:   [30,  64,  175] as [number,number,number],  // biru
      success:   [22, 163,  74]  as [number,number,number],  // hijau
      danger:    [185, 28,  28]  as [number,number,number],  // merah
      gold:      [161,118,  21]  as [number,number,number],  // emas
      headerBg:  [30,  64,  175] as [number,number,number],
      rowAlt:    [239,246,255]   as [number,number,number],  // biru muda
      rowDanger: [254,242,242]   as [number,number,number],  // merah muda
      gray:      [107,114,128]   as [number,number,number],
      dark:      [17,  24,  39]  as [number,number,number],
      white:     [255,255,255]   as [number,number,number],
      border:    [209,213,219]   as [number,number,number],
    };

    // ── Helper functions ──
    const setColor = (rgb: [number,number,number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    const setFill  = (rgb: [number,number,number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    const setDraw  = (rgb: [number,number,number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);

    const rect = (x: number, yy: number, w: number, h: number, filled = true) => {
      filled ? doc.rect(x, yy, w, h, 'F') : doc.rect(x, yy, w, h, 'S');
    };

    // ─────────────────────────────────────────────────────────────────────────
    // HEADER BANNER
    // ─────────────────────────────────────────────────────────────────────────
    setFill(C.primary);
    rect(0, 0, W, 42);

    // Aksen garis emas di bawah banner
    setFill(C.gold);
    rect(0, 42, W, 2);

    // Judul
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setColor(C.white);
    doc.text('LAPORAN KEUANGAN SEKOLAH', W / 2, 16, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('YAYASAN BAITULLOH', W / 2, 24, { align: 'center' });

    doc.setFontSize(9);
    setColor([180, 210, 255] as any);
    doc.text(`Periode: ${bulanIni} ${tahunIni}`, W / 2, 32, { align: 'center' });

    // Tanggal cetak di pojok kanan
    doc.setFontSize(7);
    setColor([180, 210, 255] as any);
    const printTime = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Dicetak: ${printTime}`, W - margin, 38, { align: 'right' });

    y = 52;

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION TITLE helper
    // ─────────────────────────────────────────────────────────────────────────
    const sectionTitle = (title: string, icon: string = '●') => {
      setFill(C.primary);
      rect(margin, y, cw, 9);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      setColor(C.white);
      doc.text(`${icon}  ${title}`, margin + 4, y + 6.2);
      y += 12;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // TABLE ROW helper
    // ─────────────────────────────────────────────────────────────────────────
    const tableRow = (
      label: string,
      value: string,
      opts: {
        bg?: [number,number,number];
        labelColor?: [number,number,number];
        valueColor?: [number,number,number];
        bold?: boolean;
        indent?: number;
        rowH?: number;
        fontSize?: number;
      } = {}
    ) => {
      const { bg, labelColor = C.dark, valueColor = C.dark, bold = false, indent = 0, rowH = 8, fontSize = 9 } = opts;

      if (bg) { setFill(bg); rect(margin, y, cw, rowH); }

      // border bawah
      setDraw(C.border);
      doc.setLineWidth(0.1);
      doc.line(margin, y + rowH, margin + cw, y + rowH);

      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      setColor(labelColor);
      doc.text(label, margin + 4 + indent, y + rowH - 2.2);

      setColor(valueColor);
      doc.text(value, W - margin - 4, y + rowH - 2.2, { align: 'right' });

      y += rowH;
    };

    const subRow = (label: string, value: string, color: [number,number,number] = C.gray) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      setColor(color);
      doc.text(`↳  ${label}`, margin + 10, y + 4.5);
      doc.text(value, W - margin - 4, y + 4.5, { align: 'right' });
      y += 5.5;
    };

    const spacer = (h = 4) => { y += h; };

    // ─────────────────────────────────────────────────────────────────────────
    // BAGIAN 1: LAPORAN KEUANGAN
    // ─────────────────────────────────────────────────────────────────────────
    sectionTitle('LAPORAN KEUANGAN', '💰');

    // Header tabel
    setFill([219, 234, 254] as any);
    rect(margin, y, cw, 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(C.primary);
    doc.text('KETERANGAN', margin + 4, y + 5);
    doc.text('NOMINAL', W - margin - 4, y + 5, { align: 'right' });
    y += 7;

    // Pendapatan
    tableRow('TOTAL PENDAPATAN', formatRupiah(totalPendapatan), {
      bg: [240, 253, 244] as any,
      labelColor: [15, 118, 59] as any,
      valueColor: C.success,
      bold: true,
      rowH: 9,
      fontSize: 10,
    });
    subRow(`Pendapatan SMP`, formatRupiah(smp.totalPemasukan));
    subRow(`Pendapatan SMA`, formatRupiah(sma.totalPemasukan));
    spacer(2);

    // Pengeluaran
    tableRow('TOTAL PENGELUARAN', formatRupiah(totalPengeluaran), {
      bg: [254, 242, 242] as any,
      labelColor: C.danger,
      valueColor: C.danger,
      bold: true,
      rowH: 9,
      fontSize: 10,
    });
    subRow(`Pengeluaran SMP`, formatRupiah(smp.totalPengeluaran));
    subRow(`Pengeluaran SMA`, formatRupiah(sma.totalPengeluaran));
    spacer(2);

    // Sisa keuangan
    setFill(C.primary);
    rect(margin, y, cw, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(C.white);
    doc.text(`SISA KEUANGAN SEKOLAH  (${bulanTahun})`, margin + 4, y + 7.5);
    setColor([255, 223, 100] as any);
    doc.text(formatRupiah(sisaKeuangan), W - margin - 4, y + 7.5, { align: 'right' });
    y += 14;

    spacer(6);

    // ─────────────────────────────────────────────────────────────────────────
    // BAGIAN 2: LAPORAN TUNGGAKAN
    // ─────────────────────────────────────────────────────────────────────────
    sectionTitle('LAPORAN TUNGGAKAN SISWA', '⚠');

    // Header tabel tunggakan
    setFill([254, 226, 226] as any);
    rect(margin, y, cw, 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor(C.danger);
    doc.text('KELAS / JENJANG', margin + 4, y + 5);
    doc.text('JML SISWA', W - margin - 50, y + 5, { align: 'right' });
    doc.text('NOMINAL', W - margin - 4, y + 5, { align: 'right' });
    y += 7;

    // SMP rows
    setFill([239, 246, 255] as any);
    rect(margin, y, cw, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(C.primary);
    doc.text('SMP', margin + 4, y + 5.5);
    setColor(C.danger);
    doc.text(formatRupiah(smp.totalTunggakan), W - margin - 4, y + 5.5, { align: 'right' });
    y += 8;

    getTunggakanPerKelas('SMP').forEach((k, i) => {
      if (i % 2 === 0) { setFill([249, 250, 251] as any); rect(margin, y, cw, 6.5); }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setColor(C.gray);
      doc.text(`     Kelas ${k.kelas}`, margin + 4, y + 4.5);
      doc.text(`${k.jumlah} siswa`, W - margin - 50, y + 4.5, { align: 'right' });
      setColor(C.danger);
      doc.text(formatRupiah(k.nominal), W - margin - 4, y + 4.5, { align: 'right' });
      setDraw(C.border);
      doc.setLineWidth(0.1);
      doc.line(margin, y + 6.5, margin + cw, y + 6.5);
      y += 6.5;
    });

    spacer(3);

    // SMA rows
    setFill([239, 246, 255] as any);
    rect(margin, y, cw, 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(C.primary);
    doc.text('SMA', margin + 4, y + 5.5);
    setColor(C.danger);
    doc.text(formatRupiah(sma.totalTunggakan), W - margin - 4, y + 5.5, { align: 'right' });
    y += 8;

    getTunggakanPerKelas('SMA').forEach((k, i) => {
      if (i % 2 === 0) { setFill([249, 250, 251] as any); rect(margin, y, cw, 6.5); }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setColor(C.gray);
      doc.text(`     Kelas ${k.kelas}`, margin + 4, y + 4.5);
      doc.text(`${k.jumlah} siswa`, W - margin - 50, y + 4.5, { align: 'right' });
      setColor(C.danger);
      doc.text(formatRupiah(k.nominal), W - margin - 4, y + 4.5, { align: 'right' });
      setDraw(C.border);
      doc.setLineWidth(0.1);
      doc.line(margin, y + 6.5, margin + cw, y + 6.5);
      y += 6.5;
    });

    spacer(3);

    // Total tunggakan
    setFill(C.danger);
    rect(margin, y, cw, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(C.white);
    doc.text(`TOTAL TUNGGAKAN SISWA  (${bulanTahun})`, margin + 4, y + 7.5);
    setColor([255, 200, 200] as any);
    doc.text(formatRupiah(totalTunggakan), W - margin - 4, y + 7.5, { align: 'right' });
    y += 14;

    // ─────────────────────────────────────────────────────────────────────────
    // FOOTER
    // ─────────────────────────────────────────────────────────────────────────
    const footerY = H - 18;

    // Garis emas atas footer
    setFill(C.gold);
    rect(0, footerY - 2, W, 1);

    // Background footer
    setFill([248, 250, 252] as any);
    rect(0, footerY - 1, W, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(C.gray);
    doc.text('Dokumen ini digenerate secara otomatis oleh Sistem Informasi Keuangan Yayasan Baitulloh.', W / 2, footerY + 5, { align: 'center' });
    doc.text(`Halaman 1 dari 1  |  ${printTime}`, W / 2, footerY + 10, { align: 'center' });

    // Tanda tangan placeholder
    const sigX = W - margin - 45;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor(C.dark);
    doc.text(`${bulanIni} ${tahunIni}`, sigX, footerY + 4, { align: 'center' });
    doc.text('Bendahara,', sigX, footerY + 8.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text('(________________________)', sigX, footerY + 15, { align: 'center' });

    doc.save(`Laporan-Keuangan-Sekolah-${bulanIni}-${tahunIni}.pdf`);
    toast.success('Laporan PDF berhasil didownload');
  };

  // ── Render tab SMP/SMA ────────────────────────────────────────────────────
  const renderJenjangTab = (jenjang: 'SMP' | 'SMA') => {
    const d = getData(jenjang);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-4 h-4 text-primary-foreground" /></div>
              Laporan Keuangan {jenjang}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Periode: 1 sd akhir {bulanIni} {tahunIni}</p>
          </div>
          <div className="divide-y divide-border">
            <div className="p-6 flex items-center justify-between bg-success/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success-foreground" /></div>
                <div><p className="font-bold text-foreground">Pemasukan</p><p className="text-xs text-muted-foreground">{d.jumlahMembayar} siswa membayar</p></div>
              </div>
              <p className="text-xl font-extrabold text-success">{formatRupiah(d.totalPemasukan)}</p>
            </div>
            <div className="p-6 flex items-center justify-between bg-destructive/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive-foreground" /></div>
                <div><p className="font-bold text-foreground">Pengeluaran</p><p className="text-xs text-muted-foreground">Periode bulan ini</p></div>
              </div>
              <p className="text-xl font-extrabold text-destructive">{formatRupiah(d.totalPengeluaran)}</p>
            </div>
            <div className="p-6 flex items-center justify-between gradient-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold"><Wallet className="w-5 h-5 text-foreground" /></div>
                <p className="font-extrabold text-foreground">Sisa Keuangan</p>
              </div>
              <p className="text-2xl font-extrabold text-primary">{formatRupiah(d.totalPemasukan - d.totalPengeluaran)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning-foreground" /></div>
              Laporan Tunggakan {jenjang}
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="text-center p-8 rounded-2xl bg-destructive/5 border border-destructive/10">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Jumlah Siswa Menunggak</p>
              <p className="text-5xl font-extrabold text-destructive mb-1">{d.jumlahMenunggak}</p>
              <p className="text-sm text-muted-foreground">siswa</p>
            </div>
            <div className="text-center p-8 rounded-2xl gradient-card border border-destructive/10">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Total Nominal Tunggakan</p>
              <p className="text-3xl font-extrabold text-destructive">{formatRupiah(d.totalTunggakan)}</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // ── Render tab Total ──────────────────────────────────────────────────────
  const renderTotalTab = () => {
    const totalPendapatan    = smp.totalPemasukan  + sma.totalPemasukan;
    const totalPengeluaranAll = smp.totalPengeluaran + sma.totalPengeluaran;
    const sisaKeuangan       = totalPendapatan - totalPengeluaranAll;
    const totalTunggakanAll  = smp.totalTunggakan  + sma.totalTunggakan;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-4 h-4 text-primary-foreground" /></div>
                Laporan Total Keuangan
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
                  <p className="text-xs text-muted-foreground">Total Pendapatan SMP : <span className="font-semibold text-foreground">{formatRupiah(smp.totalPemasukan)}</span></p>
                  <p className="text-xs text-muted-foreground">Total Pendapatan SMA : <span className="font-semibold text-foreground">{formatRupiah(sma.totalPemasukan)}</span></p>
                </div>
              </div>
              <div className="p-6 bg-destructive/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL PENGELUARAN</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(totalPengeluaranAll)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  <p className="text-xs text-muted-foreground">Total Pengeluaran SMP : <span className="font-semibold text-foreground">{formatRupiah(smp.totalPengeluaran)}</span></p>
                  <p className="text-xs text-muted-foreground">Total Pengeluaran SMA : <span className="font-semibold text-foreground">{formatRupiah(sma.totalPengeluaran)}</span></p>
                </div>
              </div>
              <div className="p-6 gradient-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold"><Wallet className="w-5 h-5 text-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">SISA KEUANGAN SEKOLAH ({bulanTahun})</p>
                  </div>
                  <p className="text-2xl font-extrabold text-primary">{formatRupiah(sisaKeuangan)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-3xl border border-destructive/20 shadow-elegant overflow-hidden"
            style={{ backgroundColor: 'hsl(0 84% 60% / 0.08)' }}>
            <div className="p-6 border-b border-destructive/15" style={{ backgroundColor: 'hsl(0 84% 60% / 0.12)' }}>
              <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-danger flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-destructive-foreground" /></div>
                TOTAL TUNGGAKAN
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Periode : {bulanIni} - {tahunIni}</p>
            </div>
            <div className="divide-y divide-destructive/10">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Users className="w-5 h-5 text-destructive" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL TUNGGAKAN SMP</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(smp.totalTunggakan)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  {getTunggakanPerKelas('SMP').map(k => (
                    <p key={k.kelas} className="text-xs text-muted-foreground">Kelas {k.kelas} : <span className="font-semibold text-foreground">{k.jumlah} siswa</span> - <span className="font-semibold text-destructive">{formatRupiah(k.nominal)}</span></p>
                  ))}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Users className="w-5 h-5 text-destructive" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL TUNGGAKAN SMA</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(sma.totalTunggakan)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  {getTunggakanPerKelas('SMA').map(k => (
                    <p key={k.kelas} className="text-xs text-muted-foreground">Kelas {k.kelas} : <span className="font-semibold text-foreground">{k.jumlah} siswa</span> - <span className="font-semibold text-destructive">{formatRupiah(k.nominal)}</span></p>
                  ))}
                </div>
              </div>
              <div className="p-6" style={{ backgroundColor: 'hsl(0 84% 60% / 0.12)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-destructive-foreground" /></div>
                    <p className="font-extrabold text-foreground text-lg">TOTAL TUNGGAKAN SISWA ({bulanTahun})</p>
                  </div>
                  <p className="text-2xl font-extrabold text-destructive">{formatRupiah(totalTunggakanAll)}</p>
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
              <p>Ini adalah sisa keuangan sekolah <span className="font-bold text-foreground">{bulanIni} {tahunIni}</span> saat ini.</p>
              <p>Silahkan dicetak dan diarsipkan. Klik <span className="font-bold text-foreground">Cetak Laporan</span> untuk mengunduh PDF profesional.</p>
              <p>Sisa keuangan sekolah bisa dimasukan secara manual di halaman <span className="font-bold text-foreground">Pendapatan SMP/SMA</span>.</p>
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
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Laporan Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">Laporan keuangan periode {bulanIni} {tahunIni}</p>
        </motion.div>
        <div className="flex gap-2 flex-wrap">
          {activeTab === 'Total' && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine">
              <Printer className="w-4 h-4" /> Cetak Laporan
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={exportExcel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
            <Download className="w-4 h-4" /> Export Excel
          </motion.button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit flex-wrap">
        {(['SMP', 'SMA', 'Total'] as Tab[]).map(tab => (
          <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'Total' ? 'Laporan Total' : `Laporan ${tab}`}
          </motion.button>
        ))}
      </motion.div>

      {activeTab === 'Total' ? renderTotalTab() : renderJenjangTab(activeTab)}
    </div>
  );
}

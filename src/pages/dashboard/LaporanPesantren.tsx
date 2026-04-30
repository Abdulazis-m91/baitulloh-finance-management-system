import { useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { Download, TrendingUp, TrendingDown, Wallet, AlertTriangle, Loader2, Info, Users, Printer } from 'lucide-react';
import { useSantri } from '@/hooks/useSupabaseSantri';
import {
  usePembayaranPesantren, useKonsumsiPesantren, useOperasionalPesantren, usePembangunanPesantren,
  usePengeluaranPesantren, usePendapatanLainPesantren,
} from '@/hooks/useSupabasePesantren';
import { formatRupiah } from '@/lib/format';
import { useAuth } from '@/contexts/AuthContext';
import logoYB from '@/assets/logo-yb.png';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'Konsumsi' | 'Operasional' | 'Pembangunan' | 'Total';

const bulanNama = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Auto font size berdasarkan panjang nilai
function fz(val: string) {
  if (val.length >= 16) return 'text-base';
  if (val.length >= 13) return 'text-lg';
  if (val.length >= 10) return 'text-xl';
  return 'text-2xl';
}

export default function LaporanPesantren() {
  const [activeTab, setActiveTab] = useState<Tab>('Total');

  const { userName } = useAuth();
  const { data: students = [], isLoading: l1 } = useSantri();
  const { data: pembayaran = [], isLoading: l2 } = usePembayaranPesantren();
  const { data: konsumsi = [], isLoading: l3 } = useKonsumsiPesantren();
  const { data: operasional = [], isLoading: l4 } = useOperasionalPesantren();
  const { data: pembangunanData = [], isLoading: l5 } = usePembangunanPesantren();
  const { data: pengeluaranAll = [], isLoading: l6 } = usePengeluaranPesantren();
  const { data: pendapatanLain = [], isLoading: l7 } = usePendapatanLainPesantren();

  if (l1 || l2 || l3 || l4 || l5 || l6 || l7) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const now = new Date();
  const bulanIni = bulanNama[now.getMonth()];
  const tahunIni = now.getFullYear();
  const bulanTahun = `${bulanIni.toUpperCase()} - ${tahunIni}`;

  const totalKonsumsi = konsumsi.reduce((a, c) => a + c.nominal, 0);
  const totalPendapatanLain = pendapatanLain.reduce((a, p) => a + p.nominal, 0);
  const totalOperasional = operasional.reduce((a, c) => a + c.nominal, 0);
  const totalPembangunan = pembangunanData.reduce((a, c) => a + c.nominal, 0);

  const pendapatanKonsumsi = totalKonsumsi + totalPendapatanLain;
  const pendapatanOperasional = totalOperasional;
  const pendapatanPembangunan = totalPembangunan;
  const totalPendapatan = pendapatanKonsumsi + pendapatanOperasional + pendapatanPembangunan;

  const pengeluaranByDana = (dana: string) => pengeluaranAll.filter(e => e.jenis_keperluan.startsWith(dana)).reduce((a, e) => a + e.nominal, 0);
  const pengeluaranKonsumsi = pengeluaranByDana('Konsumsi');
  const pengeluaranOperasional = pengeluaranByDana('Operasional');
  const pengeluaranPembangunan = pengeluaranByDana('Pembangunan');
  const totalPengeluaran = pengeluaranKonsumsi + pengeluaranOperasional + pengeluaranPembangunan;

  const getTunggakanPerKelas = (jenjang: string) => {
    const allKelas = [...new Set(students.filter(s => (s.jenjang as string) === jenjang).map(s => s.kelas))].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
    return allKelas.map(kelas => {
      const siswa = students.filter(s => (s.jenjang as string) === jenjang && s.kelas === kelas && s.tunggakan_pesantren.length > 0);
      return { kelas, jumlah: siswa.length, nominal: siswa.reduce((a, s) => a + s.tunggakan_pesantren.length * s.biaya_per_bulan, 0) };
    }).filter(k => k.jumlah > 0);
  };

  const totalTunggakanSMP = students.filter(s => s.jenjang === 'SMP' && s.tunggakan_pesantren.length > 0).reduce((a, s) => a + s.tunggakan_pesantren.length * s.biaya_per_bulan, 0);
  const totalTunggakanSMA = students.filter(s => s.jenjang === 'SMA' && s.tunggakan_pesantren.length > 0).reduce((a, s) => a + s.tunggakan_pesantren.length * s.biaya_per_bulan, 0);
  const totalTunggakanReguler = students.filter(s => (s.jenjang as string) === 'Reguler' && s.tunggakan_pesantren.length > 0).reduce((a, s) => a + s.tunggakan_pesantren.length * s.biaya_per_bulan, 0);
  const jumlahMenunggak = students.filter(s => s.tunggakan_pesantren.length > 0).length;
  const totalTunggakan = totalTunggakanSMP + totalTunggakanSMA + totalTunggakanReguler;

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
      : (() => { const d = getDanaData(activeTab); return [
          { Kategori: `Pendapatan ${activeTab}`, Nominal: d.pendapatan },
          { Kategori: `Pengeluaran ${activeTab}`, Nominal: d.pengeluaran },
          { Kategori: `Sisa Dana ${activeTab}`, Nominal: d.sisa },
        ]; })();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Laporan ${activeTab}`);
    XLSX.writeFile(wb, `laporan_pesantren_${activeTab.toLowerCase()}.xlsx`);
    toast.success('Laporan berhasil diekspor');
  };

  const handlePrint = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 15;
    const cw = W - margin * 2;
    const C = {
      primary: [37, 99, 235] as [number,number,number],
      success: [22, 163, 74] as [number,number,number],
      danger:  [220, 38, 38] as [number,number,number],
      gray:    [100, 100, 100] as [number,number,number],
      dark:    [30, 30, 30] as [number,number,number],
      gold:    [180, 140, 30] as [number,number,number],
    };
    const setColor = (c: [number,number,number]) => doc.setTextColor(...c);
    const setFill  = (c: [number,number,number]) => doc.setFillColor(...c);
    const setDraw  = (c: [number,number,number]) => doc.setDrawColor(...c);
    const fillRect = (x: number, y: number, w: number, h: number) => doc.rect(x, y, w, h, 'F');
    let y = 0;

    // ── HEADER BIRU ─────────────────────────────────────────────────────────
    setFill(C.primary); fillRect(0, 0, W, 38);

    // Logo
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej();
        img.src = logoYB;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, 5, 22, 22);
    } catch { /* logo gagal load, skip */ }

    // Judul header
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    setColor([255,255,255]);
    doc.text('YAYASAN BAITULLOH', margin + 26, 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    setColor([200, 220, 255]);
    doc.text('LAPORAN TOTAL KEUANGAN PESANTREN', margin + 26, 20);
    doc.text(`Periode: ${bulanIni} ${tahunIni}`, margin + 26, 26);

    // Garis emas bawah header
    setFill(C.gold); fillRect(0, 38, W, 1.5);
    y = 48;

    // ── HELPERS ─────────────────────────────────────────────────────────────
    const drawRow = (label: string, value: string, bold = false, color: [number,number,number] = C.dark) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(bold ? 10 : 9);
      setColor(C.dark); doc.text(label, margin + 2, y);
      setColor(color); doc.text(value, W - margin - 2, y, { align: 'right' });
      y += bold ? 6 : 5;
    };
    const drawSection = (title: string) => {
      setFill([235, 240, 255]); fillRect(margin, y - 4, cw, 8);
      setColor(C.primary); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(title, margin + 3, y + 1); y += 10; setColor(C.dark);
    };
    const drawLine = (gold = false) => {
      setDraw(gold ? C.gold : [200,200,200]);
      doc.setLineWidth(gold ? 0.8 : 0.3);
      doc.line(margin, y, W - margin, y); y += 4;
    };

    // ── ISI LAPORAN ──────────────────────────────────────────────────────────
    drawSection('LAPORAN PENDAPATAN');
    drawRow('Pendapatan Konsumsi',    formatRupiah(pendapatanKonsumsi),    false, C.success);
    drawRow('Pendapatan Operasional', formatRupiah(pendapatanOperasional), false, C.success);
    drawRow('Pendapatan Pembangunan', formatRupiah(pendapatanPembangunan), false, C.success);
    drawRow('TOTAL PENDAPATAN',       formatRupiah(totalPendapatan),       true,  C.success);
    y += 3;

    drawSection('LAPORAN PENGELUARAN');
    drawRow('Pengeluaran Konsumsi',    formatRupiah(pengeluaranKonsumsi),    false, C.danger);
    drawRow('Pengeluaran Operasional', formatRupiah(pengeluaranOperasional), false, C.danger);
    drawRow('Pengeluaran Pembangunan', formatRupiah(pengeluaranPembangunan), false, C.danger);
    drawRow('TOTAL PENGELUARAN',       formatRupiah(totalPengeluaran),       true,  C.danger);
    y += 3;

    drawLine(true);
    drawRow(`SISA KEUANGAN PESANTREN (${bulanTahun})`, formatRupiah(totalPendapatan - totalPengeluaran), true, C.primary);
    y += 5;

    drawSection('TOTAL TUNGGAKAN PESANTREN');
    drawRow('Tunggakan SMP', formatRupiah(totalTunggakanSMP), true, C.danger);
    getTunggakanPerKelas('SMP').forEach(k => {
      doc.setFontSize(8); doc.setFont('helvetica','normal'); setColor(C.gray);
      doc.text(`   Kelas ${k.kelas}: ${k.jumlah} santri`, margin+4, y);
      setColor(C.danger); doc.text(formatRupiah(k.nominal), W-margin-2, y, { align: 'right' }); y += 4;
    });
    y += 2; setColor(C.dark);

    drawRow('Tunggakan SMA', formatRupiah(totalTunggakanSMA), true, C.danger);
    getTunggakanPerKelas('SMA').forEach(k => {
      doc.setFontSize(8); doc.setFont('helvetica','normal'); setColor(C.gray);
      doc.text(`   Kelas ${k.kelas}: ${k.jumlah} santri`, margin+4, y);
      setColor(C.danger); doc.text(formatRupiah(k.nominal), W-margin-2, y, { align: 'right' }); y += 4;
    });
    y += 2; setColor(C.dark);

    drawRow('Tunggakan Reguler', formatRupiah(totalTunggakanReguler), true, C.danger);
    getTunggakanPerKelas('Reguler').forEach(k => {
      doc.setFontSize(8); doc.setFont('helvetica','normal'); setColor(C.gray);
      doc.text(`   Kelas ${k.kelas}: ${k.jumlah} santri`, margin+4, y);
      setColor(C.danger); doc.text(formatRupiah(k.nominal), W-margin-2, y, { align: 'right' }); y += 4;
    });
    y += 2; setColor(C.dark);
    drawLine(true);
    drawRow(`TOTAL TUNGGAKAN (${bulanTahun})`, formatRupiah(totalTunggakan), true, C.danger);
    y += 6;

    // ── TANDA TANGAN ────────────────────────────────────────────────────────
    const footerY = H - 28;
    const sigX = W - margin - 30;
    const sigTop = footerY - 36;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setColor(C.dark);
    doc.text(`Yukum Jaya, ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}`, sigX, sigTop, { align: 'center' });
    doc.text('Bendahara,', sigX, sigTop + 6, { align: 'center' });
    // Ruang tanda tangan
    setDraw(C.dark); doc.setLineWidth(0.3);
    doc.line(sigX - 24, sigTop + 24, sigX + 24, sigTop + 24);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); setColor(C.dark);
    doc.text(userName || 'Petugas', sigX, sigTop + 30, { align: 'center' });

    // ── FOOTER ───────────────────────────────────────────────────────────────
    setFill(C.gold); fillRect(0, footerY, W, 1.5);
    setFill([248,250,252]); fillRect(0, footerY + 1.5, W, H - footerY);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); setColor(C.gray);
    doc.text('Dokumen ini digenerate secara otomatis oleh Sistem Informasi Keuangan Yayasan Baitulloh.', W/2, footerY+9, { align: 'center' });
    doc.text(`Halaman 1 dari 1  |  ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })} pukul ${new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' })}`, W/2, footerY+15, { align: 'center' });

    doc.save(`Laporan-Pesantren-${bulanIni}-${tahunIni}.pdf`);
    toast.success('Laporan PDF berhasil didownload');
  };

  // ── Komponen baris tunggakan per kelas ──────────────────────────────────
  const TunggakanKelasDetail = ({ jenjang }: { jenjang: string }) => {
    const rows = getTunggakanPerKelas(jenjang);
    if (rows.length === 0) return null;
    return (
      <div className="mt-2 ml-12 space-y-1">
        {rows.map(k => (
          <div key={k.kelas} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Kelas {k.kelas} · <span className="font-semibold text-foreground">{k.jumlah} santri</span></span>
            <span className="font-semibold text-destructive whitespace-nowrap">{formatRupiah(k.nominal)}</span>
          </div>
        ))}
      </div>
    );
  };

  // ── Baris total (label kiri + nominal kanan) ─────────────────────────────
  const TotalRow = ({ icon: Icon, gradient, label, value, color, detail }: {
    icon: any; gradient: string; label: string; value: string;
    color: string; detail?: React.ReactNode;
  }) => (
    <div className="p-5 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl ${gradient} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <p className="font-bold text-foreground text-sm leading-tight">{label}</p>
        </div>
        <p className={`${fz(value)} font-extrabold ${color} whitespace-nowrap`}>{value}</p>
      </div>
      {detail}
    </div>
  );

  const renderDanaTab = (dana: 'Konsumsi' | 'Operasional' | 'Pembangunan') => {
    const d = getDanaData(dana);
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/20">
            <h3 className="font-bold text-foreground text-base flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-3.5 h-3.5 text-white" /></div>
              Laporan Dana {dana}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Periode: {bulanIni} {tahunIni}</p>
          </div>
          <div className="divide-y divide-border">
            <div className="p-5 flex items-start justify-between gap-2 bg-success/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-success flex items-center justify-center flex-shrink-0"><TrendingUp className="w-4 h-4 text-white" /></div>
                <div><p className="font-bold text-foreground text-sm">Pendapatan</p><p className="text-xs text-muted-foreground">Pemasukan dana {dana.toLowerCase()}</p></div>
              </div>
              <p className={`${fz(formatRupiah(d.pendapatan))} font-extrabold text-success whitespace-nowrap`}>{formatRupiah(d.pendapatan)}</p>
            </div>
            <div className="p-5 flex items-start justify-between gap-2 bg-destructive/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-danger flex items-center justify-center flex-shrink-0"><TrendingDown className="w-4 h-4 text-white" /></div>
                <div><p className="font-bold text-foreground text-sm">Pengeluaran</p><p className="text-xs text-muted-foreground">Pengeluaran dana {dana.toLowerCase()}</p></div>
              </div>
              <p className={`${fz(formatRupiah(d.pengeluaran))} font-extrabold text-destructive whitespace-nowrap`}>{formatRupiah(d.pengeluaran)}</p>
            </div>
            <div className="p-5 flex items-start justify-between gap-2 gradient-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center flex-shrink-0"><Wallet className="w-4 h-4 text-foreground" /></div>
                <p className="font-bold text-foreground text-sm">Sisa Dana {dana}</p>
              </div>
              <p className={`${fz(formatRupiah(d.sisa))} font-extrabold text-primary whitespace-nowrap`}>{formatRupiah(d.sisa)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/20">
            <h3 className="font-bold text-foreground text-base flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-warning flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5 text-white" /></div>
              Tunggakan Santri
            </h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Menunggak</p>
                <p className="text-3xl font-extrabold text-destructive">{jumlahMenunggak}</p>
                <p className="text-xs text-muted-foreground">santri</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Total</p>
                <p className={`${fz(formatRupiah(totalTunggakan))} font-extrabold text-destructive`}>{formatRupiah(totalTunggakan)}</p>
              </div>
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Kiri: Keuangan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/20">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-3.5 h-3.5 text-white" /></div>
                Laporan Total Keuangan Pesantren
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Periode: {bulanIni} {tahunIni}</p>
            </div>
            <div className="divide-y divide-border">
              {/* Pendapatan */}
              <div className="p-5 bg-success/[0.03]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl gradient-success flex items-center justify-center flex-shrink-0"><TrendingUp className="w-4 h-4 text-white" /></div>
                    <p className="font-bold text-foreground text-sm leading-tight">TOTAL PENDAPATAN</p>
                  </div>
                  <p className={`${fz(formatRupiah(totalPendapatan))} font-extrabold text-success whitespace-nowrap`}>{formatRupiah(totalPendapatan)}</p>
                </div>
                <div className="mt-2 ml-12 space-y-1">
                  {[['Konsumsi', pendapatanKonsumsi], ['Operasional', pendapatanOperasional], ['Pembangunan', pendapatanPembangunan]].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{l as string}</span>
                      <span className="font-semibold text-foreground whitespace-nowrap">{formatRupiah(v as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Pengeluaran */}
              <div className="p-5 bg-destructive/[0.03]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl gradient-danger flex items-center justify-center flex-shrink-0"><TrendingDown className="w-4 h-4 text-white" /></div>
                    <p className="font-bold text-foreground text-sm leading-tight">TOTAL PENGELUARAN</p>
                  </div>
                  <p className={`${fz(formatRupiah(totalPengeluaran))} font-extrabold text-destructive whitespace-nowrap`}>{formatRupiah(totalPengeluaran)}</p>
                </div>
                <div className="mt-2 ml-12 space-y-1">
                  {[['Konsumsi', pengeluaranKonsumsi], ['Operasional', pengeluaranOperasional], ['Pembangunan', pengeluaranPembangunan]].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{l as string}</span>
                      <span className="font-semibold text-foreground whitespace-nowrap">{formatRupiah(v as number)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Sisa */}
              <div className="p-5 gradient-card flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl gradient-gold flex items-center justify-center flex-shrink-0"><Wallet className="w-4 h-4 text-foreground" /></div>
                  <p className="font-bold text-foreground text-sm leading-tight">SISA KEUANGAN<br /><span className="text-xs font-normal text-muted-foreground">({bulanTahun})</span></p>
                </div>
                <p className={`${fz(formatRupiah(sisaKeuangan))} font-extrabold text-primary whitespace-nowrap`}>{formatRupiah(sisaKeuangan)}</p>
              </div>
            </div>
          </motion.div>

          {/* Kanan: Tunggakan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-3xl border border-destructive/20 shadow-elegant overflow-hidden" style={{ backgroundColor: 'hsl(0 84% 60% / 0.08)' }}>
            <div className="p-5 border-b border-destructive/15" style={{ backgroundColor: 'hsl(0 84% 60% / 0.12)' }}>
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg gradient-danger flex items-center justify-center"><AlertTriangle className="w-3.5 h-3.5 text-white" /></div>
                TOTAL TUNGGAKAN PESANTREN
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Periode : {bulanIni} - {tahunIni}</p>
            </div>
            <div className="divide-y divide-destructive/10">
              {/* SMP */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-destructive" /></div>
                    <p className="font-bold text-foreground text-sm">TUNGGAKAN SMP</p>
                  </div>
                  <p className={`${fz(formatRupiah(totalTunggakanSMP))} font-extrabold text-destructive whitespace-nowrap`}>{formatRupiah(totalTunggakanSMP)}</p>
                </div>
                <TunggakanKelasDetail jenjang="SMP" />
              </div>
              {/* SMA */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-destructive" /></div>
                    <p className="font-bold text-foreground text-sm">TUNGGAKAN SMA</p>
                  </div>
                  <p className={`${fz(formatRupiah(totalTunggakanSMA))} font-extrabold text-destructive whitespace-nowrap`}>{formatRupiah(totalTunggakanSMA)}</p>
                </div>
                <TunggakanKelasDetail jenjang="SMA" />
              </div>
              {/* Reguler */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-destructive" /></div>
                    <p className="font-bold text-foreground text-sm">TUNGGAKAN REGULER</p>
                  </div>
                  <p className={`${fz(formatRupiah(totalTunggakanReguler))} font-extrabold text-destructive whitespace-nowrap`}>{formatRupiah(totalTunggakanReguler)}</p>
                </div>
                <TunggakanKelasDetail jenjang="Reguler" />
              </div>
              {/* Total */}
              <div className="p-5" style={{ backgroundColor: 'hsl(0 84% 60% / 0.12)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl gradient-danger flex items-center justify-center flex-shrink-0"><AlertTriangle className="w-4 h-4 text-white" /></div>
                    <p className="font-bold text-foreground text-sm leading-tight">TOTAL TUNGGAKAN<br /><span className="text-xs font-normal text-muted-foreground">({bulanTahun})</span></p>
                  </div>
                  <p className={`${fz(formatRupiah(totalTunggakan))} font-extrabold text-destructive whitespace-nowrap`}>{formatRupiah(totalTunggakan)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-5 flex gap-4 items-start">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-1 text-sm text-muted-foreground leading-relaxed">
              <p>Ini adalah sisa keuangan pesantren <span className="font-bold text-foreground">{bulanIni} {tahunIni}</span> saat ini.</p>
              <p>Silahkan dicetak dan diarsipkan. Sisa keuangan bisa dimasukan secara manual di <span className="font-bold text-foreground">Pendapatan Pesantren</span>.</p>
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
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine">
              <Printer className="w-4 h-4" /> Cetak Laporan
            </motion.button>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={exportExcel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-success text-success-foreground text-sm font-bold btn-shine">
            <Download className="w-4 h-4" /> Export Excel
          </motion.button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit flex-wrap">
        {(['Konsumsi', 'Operasional', 'Pembangunan', 'Total'] as Tab[]).map(tab => (
          <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'Total' ? 'Laporan Total' : `Dana ${tab}`}
          </motion.button>
        ))}
      </motion.div>

      {activeTab === 'Total' ? renderTotalTab() : renderDanaTab(activeTab)}
    </div>
  );
}

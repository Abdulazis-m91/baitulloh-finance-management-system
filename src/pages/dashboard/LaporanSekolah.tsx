import { useState } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { Download, TrendingUp, TrendingDown, Wallet, AlertTriangle, Loader2, Info, Users, Printer } from 'lucide-react';
import { useStudents, usePembayaran, usePengeluaran } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { formatRupiah } from '@/lib/format';
import logoYB from '@/assets/logo-yb.png';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

type Tab = 'SMP' | 'SMA' | 'Khusus' | 'Total';

const bulanNama = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export default function LaporanSekolah() {
  const [activeTab, setActiveTab] = useState<Tab>('SMP');
  const { data: students = [], isLoading: l1 } = useStudents();
  const { data: pembayaranAll = [], isLoading: l2 } = usePembayaran();
  const { data: pengeluaranAll = [], isLoading: l3 } = usePengeluaran();
  const { userName } = useAuth();

  if (l1 || l2 || l3) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const now = new Date();
  const bulanIni = bulanNama[periodeMonth];
  const tahunIni = periodeYear;
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
    const pembayaran = pembayaranAll.filter(p => {
      const d = new Date(p.tanggal);
      return p.jenjang === jenjang && p.metode === 'Lunas' &&
        d.getMonth() === periodeMonth && d.getFullYear() === periodeYear;
    });
    const pengeluaran = pengeluaranAll.filter(e => {
      const d = new Date(e.tanggal);
      return e.sumber_dana === jenjang &&
        d.getMonth() === periodeMonth && d.getFullYear() === periodeYear;
    });
    const siswaMenunggak = students.filter(s => s.jenjang === jenjang && s.tunggakan_sekolah.length > 0);
    const totalPemasukan = pembayaran.reduce((a, p) => a + p.nominal, 0);
    const totalPengeluaran = pengeluaran.reduce((a, e) => a + e.nominal, 0);
    const totalTunggakan = siswaMenunggak.reduce((a, s) => a + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0);
    return { totalPemasukan, totalPengeluaran, totalTunggakan, jumlahMembayar: new Set(pembayaran.map(p => p.siswa_id)).size, jumlahMenunggak: siswaMenunggak.length };
  };

  // Data khusus — jenjang=Reguler + kategori=Khusus
  const getDataKhusus = () => {
    const siswaKhusus = students.filter(s => s.kategori === 'Khusus');
    const idKhusus = new Set(siswaKhusus.map(s => s.id));
    const pembayaran = pembayaranAll.filter(p => {
      const d = new Date(p.tanggal);
      return p.siswa_id && idKhusus.has(p.siswa_id) && p.metode === 'Lunas' &&
        d.getMonth() === periodeMonth && d.getFullYear() === periodeYear;
    });
    const pengeluaran = pengeluaranAll.filter(e => {
      const d = new Date(e.tanggal);
      return e.sumber_dana === 'Reguler' &&
        d.getMonth() === periodeMonth && d.getFullYear() === periodeYear;
    });
    const siswaMenunggak = siswaKhusus.filter(s => s.tunggakan_sekolah.length > 0);
    const totalPemasukan = pembayaran.reduce((a, p) => a + p.nominal, 0);
    const totalPengeluaran = pengeluaran.reduce((a, e) => a + e.nominal, 0);
    const totalTunggakan = siswaMenunggak.reduce((a, s) => a + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0);
    return { totalPemasukan, totalPengeluaran, totalTunggakan, jumlahMembayar: new Set(pembayaran.map(p => p.siswa_id)).size, jumlahMenunggak: siswaMenunggak.length };
  };

  const getTunggakanPerKelasKhusus = () => {
    const siswaKhusus = students.filter(s => s.kategori === 'Khusus');
    const allKelas = [...new Set(siswaKhusus.map(s => s.kelas))].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
    return allKelas.map(kelas => {
      const siswa = siswaKhusus.filter(s => s.kelas === kelas && s.tunggakan_sekolah.length > 0);
      const nominal = siswa.reduce((a, s) => a + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0);
      return { kelas, jumlah: siswa.length, nominal };
    }).filter(k => k.jumlah > 0);
  };

  const smp = getData('SMP');
  const sma = getData('SMA');
  const khusus = getDataKhusus();

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

  // ── Generate PDF Profesional (sama seperti Laporan Pesantren) ──────────────
  const handlePrint = async () => {
    const now2 = new Date();
    const doc = new jsPDF('p', 'mm', [210, 340]);
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const margin = 18;
    const cw = W - margin * 2;
    let y = 0;

    // ── WARNA ───────────────────────────────────────────────────────────────
    const C = {
      primary:   [30, 64, 175]   as [number,number,number],
      success:   [21, 128, 61]   as [number,number,number],
      danger:    [185, 28, 28]   as [number,number,number],
      gold:      [161, 120, 20]  as [number,number,number],
      gray:      [107, 114, 128] as [number,number,number],
      lightGray: [243, 244, 246] as [number,number,number],
      dark:      [17, 24, 39]    as [number,number,number],
      white:     [255, 255, 255] as [number,number,number],
    };
    const setTC = (c: [number,number,number]) => doc.setTextColor(...c);
    const setFC = (c: [number,number,number]) => doc.setFillColor(...c);
    const setDC = (c: [number,number,number]) => doc.setDrawColor(...c);
    const fillR = (x:number,y:number,w:number,h:number) => doc.rect(x,y,w,h,'F');

    // ── HEADER BIRU ─────────────────────────────────────────────────────────
    setFC(C.primary); fillR(0, 0, W, 42);

    // Logo
    try {
      const img = new Image(); img.crossOrigin = 'anonymous';
      await new Promise<void>((res,rej) => { img.onload=()=>res(); img.onerror=()=>rej(); img.src=logoYB; });
      const cv = document.createElement('canvas'); cv.width=img.width; cv.height=img.height;
      cv.getContext('2d')!.drawImage(img,0,0);
      doc.addImage(cv.toDataURL('image/png'),'PNG', margin, 7, 20, 20);
    } catch {}

    doc.setFont('helvetica','bold'); doc.setFontSize(13); setTC(C.white);
    doc.text('YAYASAN BAITULLOH', margin+24, 16);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); setTC([180,200,255] as any);
    doc.text('SISTEM INFORMASI KEUANGAN SEKOLAH', margin+24, 22);
    doc.text('Jl. Yukum Jaya, Terbanggi Besar, Lampung Tengah', margin+24, 27);

    doc.setFont('helvetica','bold'); doc.setFontSize(10); setTC(C.white);
    doc.text('LAPORAN KEUANGAN', W-margin, 16, { align:'right' });
    doc.setFont('helvetica','normal'); doc.setFontSize(8); setTC([180,200,255] as any);
    doc.text(`Periode: ${bulanIni} ${tahunIni}`, W-margin, 22, { align:'right' });
    doc.text(`Dicetak: ${now2.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}`, W-margin, 27, { align:'right' });

    setFC(C.gold); fillR(0, 42, W, 2);
    y = 52;

    // ── HELPERS ─────────────────────────────────────────────────────────────
    const sectionHeader = (title: string) => {
      setFC(C.primary); fillR(margin, y-3, cw, 7);
      doc.setFont('helvetica','bold'); doc.setFontSize(9); setTC(C.white);
      doc.text(title, margin+3, y+2); y += 10;
    };
    const dataRow = (label:string, value:string, bold=false, valColor=C.dark) => {
      doc.setFont('helvetica', bold?'bold':'normal'); doc.setFontSize(bold?9.5:9);
      setTC(C.dark); doc.text(label, margin+2, y);
      setTC(valColor); doc.text(value, W-margin-2, y, { align:'right' });
      y += 5.5;
    };
    const subRow = (label:string, value:string) => {
      doc.setFont('helvetica','normal'); doc.setFontSize(8); setTC(C.gray);
      doc.text(label, margin+10, y);
      setTC(C.danger); doc.text(value, W-margin-2, y, { align:'right' });
      y += 4.5;
    };
    const divider = (gold=false, thick=false) => {
      setDC(gold ? C.gold : [220,220,220] as any);
      doc.setLineWidth(gold||thick ? 0.6 : 0.2);
      doc.line(margin, y, W-margin, y); y += gold?5:3;
    };
    const totalRow = (label:string, value:string, color:[number,number,number]) => {
      setFC(C.lightGray); fillR(margin, y-3, cw, 8);
      doc.setFont('helvetica','bold'); doc.setFontSize(10); setTC(C.dark);
      doc.text(label, margin+3, y+2);
      setTC(color); doc.text(value, W-margin-3, y+2, { align:'right' });
      y += 11;
    };

    // ── SECTION I: PENDAPATAN ────────────────────────────────────────────────
    if (activeTab === 'Total') {
      sectionHeader('I.  LAPORAN PENDAPATAN');
      dataRow('Pendapatan SMP',    formatRupiah(smp.totalPemasukan));   divider();
      dataRow('Pendapatan SMA',    formatRupiah(sma.totalPemasukan));   divider();
      dataRow('Pendapatan Khusus', formatRupiah(khusus.totalPemasukan)); divider(false,true);
      totalRow('TOTAL PENDAPATAN', formatRupiah(smp.totalPemasukan + sma.totalPemasukan + khusus.totalPemasukan), C.success);
      y += 3;

      sectionHeader('II. LAPORAN PENGELUARAN');
      dataRow('Pengeluaran SMP',    formatRupiah(smp.totalPengeluaran));   divider();
      dataRow('Pengeluaran SMA',    formatRupiah(sma.totalPengeluaran));   divider();
      dataRow('Pengeluaran Khusus', formatRupiah(khusus.totalPengeluaran)); divider(false,true);
      totalRow('TOTAL PENGELUARAN', formatRupiah(smp.totalPengeluaran + sma.totalPengeluaran + khusus.totalPengeluaran), C.danger);
      y += 3;

      divider(true);
      setFC([239,246,255] as any); fillR(margin, y-3, cw, 10);
      doc.setFont('helvetica','bold'); doc.setFontSize(11); setTC(C.primary);
      const sisaTotal = (smp.totalPemasukan+sma.totalPemasukan+khusus.totalPemasukan) - (smp.totalPengeluaran+sma.totalPengeluaran+khusus.totalPengeluaran);
      doc.text(`SISA KEUANGAN SEKOLAH  (${bulanTahun})`, margin+3, y+3);
      doc.text(formatRupiah(sisaTotal), W-margin-3, y+3, { align:'right' });
      y += 14;

      // Tunggakan
      sectionHeader('III. TOTAL TUNGGAKAN SEKOLAH');
      (['SMP','SMA','Khusus'] as const).forEach(j => {
        const tData = j === 'SMP' ? smp : j === 'SMA' ? sma : khusus;
        const label = j === 'Khusus' ? 'Tunggakan Khusus' : `Tunggakan ${j}`;
        const tunggakanNom = j === 'Khusus'
          ? students.filter(s => s.kategori === 'Khusus' && s.tunggakan_sekolah.length > 0).reduce((a,s) => a + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0)
          : students.filter(s => s.jenjang === j && s.tunggakan_sekolah.length > 0).reduce((a,s) => a + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0);
        dataRow(label, formatRupiah(tunggakanNom), true, C.danger);
        const kelasData = getTunggakanPerKelas(j === 'Khusus' ? 'Khusus' : j);
        kelasData.forEach(k => subRow(`Kelas ${k.kelas}  (${k.jumlah} siswa)`, formatRupiah(k.nominal)));
        divider();
      });
      const totalTunggakanAll = students.filter(s => s.tunggakan_sekolah.length > 0).reduce((a,s) => a + s.tunggakan_sekolah.length * s.biaya_per_bulan, 0);
      divider(false,true);
      totalRow(`TOTAL TUNGGAKAN  (${bulanTahun})`, formatRupiah(totalTunggakanAll), C.danger);

    } else {
      // Tab SMP / SMA / Khusus
      const d = activeTab === 'SMP' ? smp : activeTab === 'SMA' ? sma : khusus;
      const jenjangLabel = activeTab;
      sectionHeader(`I.  LAPORAN PENDAPATAN ${jenjangLabel}`);
      dataRow(`Pendapatan ${jenjangLabel}`, formatRupiah(d.totalPemasukan), false, C.success); divider(false,true);
      totalRow('TOTAL PENDAPATAN', formatRupiah(d.totalPemasukan), C.success);
      y += 3;

      sectionHeader(`II. LAPORAN PENGELUARAN ${jenjangLabel}`);
      dataRow(`Pengeluaran ${jenjangLabel}`, formatRupiah(d.totalPengeluaran), false, C.danger); divider(false,true);
      totalRow('TOTAL PENGELUARAN', formatRupiah(d.totalPengeluaran), C.danger);
      y += 3;

      divider(true);
      setFC([239,246,255] as any); fillR(margin, y-3, cw, 10);
      doc.setFont('helvetica','bold'); doc.setFontSize(11); setTC(C.primary);
      doc.text(`SISA KEUANGAN ${jenjangLabel}  (${bulanTahun})`, margin+3, y+3);
      doc.text(formatRupiah(d.totalPemasukan - d.totalPengeluaran), W-margin-3, y+3, { align:'right' });
      y += 14;

      sectionHeader(`III. TUNGGAKAN ${jenjangLabel}`);
      const kelasRows = getTunggakanPerKelas(activeTab);
      kelasRows.forEach(k => {
        dataRow(`Kelas ${k.kelas}`, formatRupiah(k.nominal), true, C.danger);
        subRow(`${k.jumlah} siswa menunggak`, formatRupiah(k.nominal));
        divider();
      });
      totalRow(`TOTAL TUNGGAKAN  (${bulanTahun})`, formatRupiah(d.totalTunggakan), C.danger);
    }

    // ── TANDA TANGAN ────────────────────────────────────────────────────────
    y += 20;
    const sigX = W - margin - 32;
    doc.setFont('helvetica','normal'); doc.setFontSize(9); setTC(C.dark);
    doc.text(`Yukum Jaya, ${now2.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}`, sigX, y, { align:'center' });
    doc.text('Bendahara,', sigX, y+6, { align:'center' });
    setDC(C.dark); doc.setLineWidth(0.4);
    doc.line(sigX-26, y+24, sigX+26, y+24);
    doc.setFont('helvetica','bold'); doc.setFontSize(9); setTC(C.dark);
    doc.text(userName || 'Petugas', sigX, y+30, { align:'center' });
    y += 38;

    // ── FOOTER ──────────────────────────────────────────────────────────────
    const footerY = y + 6;
    setFC(C.gold); fillR(0, footerY, W, 2);
    setFC(C.lightGray); fillR(0, footerY+2, W, H-footerY);
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); setTC(C.gray);
    doc.text('Dokumen ini digenerate secara otomatis oleh Sistem Informasi Keuangan Yayasan Baitulloh.', W/2, footerY+10, { align:'center' });
    doc.text(`Halaman 1 dari 1   |   ${now2.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})} pukul ${now2.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}`, W/2, footerY+16, { align:'center' });

    doc.save(`Laporan-Sekolah-${activeTab}-${bulanIni}-${tahunIni}.pdf`);
    toast.success('Laporan PDF berhasil didownload');
  };

  // ── Render tab SMP/SMA ────────────────────────────────────────────────────
  const renderJenjangTab = (jenjang: 'SMP' | 'SMA') => {
    const d = getData(jenjang);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning-foreground" /></div>
              Tunggakan Siswa {jenjang}
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-5 rounded-2xl bg-destructive/5 border border-destructive/10">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Siswa Menunggak</p>
                <p className="text-4xl font-extrabold text-destructive">{d.jumlahMenunggak}</p>
                <p className="text-xs text-muted-foreground mt-1">siswa</p>
              </div>
              <div className="text-center p-5 rounded-2xl bg-destructive/5 border border-destructive/10">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Total Tunggakan</p>
                <p className="text-xl font-extrabold text-destructive">{formatRupiah(d.totalTunggakan)}</p>
              </div>
            </div>
            {/* Detail per kelas */}
            {getTunggakanPerKelas(jenjang).length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Detail Per Kelas</p>
                {getTunggakanPerKelas(jenjang).map(k => (
                  <div key={k.kelas} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/30 border border-border text-sm">
                    <span className="text-foreground font-medium">Kelas {k.kelas}</span>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">{k.jumlah} siswa</span>
                      <span className="text-destructive font-bold">{formatRupiah(k.nominal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 text-center">✓ Tidak ada tunggakan</p>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // ── Render tab Khusus ────────────────────────────────────────────────────
  const renderKhususTab = () => {
    const d = khusus;
    const tunggakanKelas = getTunggakanPerKelasKhusus();
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center"><Wallet className="w-4 h-4 text-warning-foreground" /></div>
              Laporan Keuangan Khusus
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Periode: 1 sd akhir {bulanIni} {tahunIni} · Siswa Kurang Mampu</p>
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
                <div><p className="font-bold text-foreground">Pengeluaran</p><p className="text-xs text-muted-foreground">Sumber dana Khusus</p></div>
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-warning-foreground" /></div>
              Tunggakan Siswa Khusus
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-5 rounded-2xl bg-destructive/5 border border-destructive/10">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Siswa Menunggak</p>
                <p className="text-4xl font-extrabold text-destructive">{d.jumlahMenunggak}</p>
                <p className="text-xs text-muted-foreground mt-1">siswa</p>
              </div>
              <div className="text-center p-5 rounded-2xl bg-destructive/5 border border-destructive/10">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Total Tunggakan</p>
                <p className="text-xl font-extrabold text-destructive">{formatRupiah(d.totalTunggakan)}</p>
              </div>
            </div>
            {tunggakanKelas.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Detail Per Kelas</p>
                {tunggakanKelas.map(k => (
                  <div key={k.kelas} className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border text-sm">
                    <span className="text-foreground font-medium">Kelas {k.kelas}</span>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground block">{k.jumlah} siswa</span>
                      <span className="text-destructive font-bold">{formatRupiah(k.nominal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-success font-semibold p-4 rounded-xl bg-success/5 border border-success/10 text-center">✓ Tidak ada tunggakan siswa khusus</p>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // ── Render tab Total ──────────────────────────────────────────────────────
  const renderTotalTab = () => {
    const totalPendapatan    = smp.totalPemasukan  + sma.totalPemasukan  + khusus.totalPemasukan;
    const totalPengeluaranAll = smp.totalPengeluaran + sma.totalPengeluaran + khusus.totalPengeluaran;
    const sisaKeuangan       = totalPendapatan - totalPengeluaranAll;
    const totalTunggakanAll  = smp.totalTunggakan  + sma.totalTunggakan  + khusus.totalTunggakan;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-extrabold text-foreground text-lg tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"><Wallet className="w-4 h-4 text-primary-foreground" /></div>
                Laporan Total Keuangan
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Periode: {bulanIni} {tahunIni}</p>
            </div>
            <div className="divide-y divide-border">
              <div className="p-6 bg-success/[0.03]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl gradient-success flex-shrink-0 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-success-foreground" /></div>
                    <p className="font-extrabold text-foreground text-base leading-tight">TOTAL PENDAPATAN</p>
                  </div>
                  <p className="text-xl font-extrabold text-success whitespace-nowrap">{formatRupiah(totalPendapatan)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  <p className="text-xs text-muted-foreground">Total Pendapatan SMP : <span className="font-semibold text-foreground">{formatRupiah(smp.totalPemasukan)}</span></p>
                  <p className="text-xs text-muted-foreground">Total Pendapatan SMA : <span className="font-semibold text-foreground">{formatRupiah(sma.totalPemasukan)}</span></p>
                  <p className="text-xs text-muted-foreground">Total Pendapatan Khusus : <span className="font-semibold text-foreground">{formatRupiah(khusus.totalPemasukan)}</span></p>
                </div>
              </div>
              <div className="p-6 bg-destructive/[0.03]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-danger flex items-center justify-center"><TrendingDown className="w-5 h-5 text-destructive-foreground" /></div>
                    <p className="font-extrabold text-foreground text-base leading-tight">TOTAL PENGELUARAN</p>
                  </div>
                  <p className="text-xl font-extrabold text-destructive whitespace-nowrap">{formatRupiah(totalPengeluaranAll)}</p>
                </div>
                <div className="mt-3 ml-[52px] space-y-1">
                  <p className="text-xs text-muted-foreground">Total Pengeluaran SMP : <span className="font-semibold text-foreground">{formatRupiah(smp.totalPengeluaran)}</span></p>
                  <p className="text-xs text-muted-foreground">Total Pengeluaran SMA : <span className="font-semibold text-foreground">{formatRupiah(sma.totalPengeluaran)}</span></p>
                  <p className="text-xs text-muted-foreground">Total Pengeluaran Khusus : <span className="font-semibold text-foreground">{formatRupiah(khusus.totalPengeluaran)}</span></p>
                </div>
              </div>
              <div className="p-6 gradient-card">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-glow-gold flex-shrink-0"><Wallet className="w-5 h-5 text-foreground" /></div>
                    <p className="font-extrabold text-foreground text-base leading-tight">SISA KEUANGAN<br/>({bulanTahun})</p>
                  </div>
                  <p className="text-xl font-extrabold text-primary whitespace-nowrap">{formatRupiah(sisaKeuangan)}</p>
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
                <div className="flex items-start justify-between gap-2">

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Users, CreditCard, TrendingDown, AlertTriangle, Shield, Loader2, Database } from 'lucide-react';
import { useSantri } from '@/hooks/useSupabaseSantri';
import { usePembayaranPesantren, useKonsumsiPesantren, useOperasionalPesantren, usePembangunanPesantren, useCicilanPesantren, usePengeluaranPesantren } from '@/hooks/useSupabasePesantren';
import { useStudents, usePembayaran, usePengeluaran, useCicilan } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { formatRupiah } from '@/lib/format';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

type Tab = 'pesantren' | 'sekolah';

const kelasOptionsSMP = ['7A', '7B', '8A', '8B', '9A', '9B'];
const kelasOptionsSMA = ['10A', '10B', '11A', '11B', '12A', '12B'];

const kebijakanAdmin = [
  'Admin bertanggung jawab penuh atas pengelolaan dan keamanan data keuangan yayasan.',
  'Penghapusan data bersifat permanen dan tidak dapat dikembalikan (irreversible).',
  'Setiap aksi penghapusan wajib dikonfirmasi sebelum dieksekusi.',
  'Admin wajib memastikan data sudah di-backup sebelum melakukan penghapusan massal.',
  'Hak akses admin tidak boleh dibagikan kepada pihak yang tidak berwenang.',
  'Segala perubahan data akan tercatat dalam log sistem untuk keperluan audit.',
  'Admin harus melaporkan aktivitas penghapusan data kepada kepala yayasan.',
  'Penggunaan fitur "Hapus Semua Data" hanya diperbolehkan pada akhir tahun ajaran atau atas instruksi kepala yayasan.',
];

export default function AdminControl() {
  const [activeTab, setActiveTab] = useState<Tab>('pesantren');
  const [deleteTarget, setDeleteTarget] = useState<{ label: string; action: () => Promise<void> } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const qc = useQueryClient();

  const { data: santriList = [], isLoading: loadStudents } = useSantri();
  const { data: students = [] } = useStudents();
  const { data: pembayaranPesantren = [] } = usePembayaranPesantren();
  const { data: konsumsi = [] } = useKonsumsiPesantren();
  const { data: operasional = [] } = useOperasionalPesantren();
  const { data: pembangunan = [] } = usePembangunanPesantren();
  const { data: cicilanPesantren = [] } = useCicilanPesantren();
  const { data: pengeluaranPesantren = [] } = usePengeluaranPesantren();
  const { data: pembayaranSekolah = [] } = usePembayaran();
  const { data: pengeluaranSekolah = [] } = usePengeluaran();
  const { data: cicilanSekolah = [] } = useCicilan();

  if (loadStudents) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const santri = students.filter(s => s.kategori && s.kategori !== '');
  const santriByKategori = (k: string) => santri.filter(s => s.kategori === k).length;

  const totalKonsumsiMasuk = konsumsi.reduce((s, e) => s + e.nominal, 0);
  const totalKonsumsiKeluar = pengeluaranPesantren.filter(e => e.jenis_keperluan === 'Konsumsi').reduce((s, e) => s + e.nominal, 0);
  const totalOperasionalMasuk = operasional.reduce((s, e) => s + e.nominal, 0);
  const totalOperasionalKeluar = pengeluaranPesantren.filter(e => e.jenis_keperluan === 'Operasional').reduce((s, e) => s + e.nominal, 0);
  const totalPembangunanMasuk = pembangunan.reduce((s, e) => s + e.nominal, 0);
  const totalPembangunanKeluar = pengeluaranPesantren.filter(e => e.jenis_keperluan === 'Pembangunan').reduce((s, e) => s + e.nominal, 0);

  const deleteAll = async (table: string) => {
    const { error } = await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw error;
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTarget.action();
      qc.invalidateQueries();
      toast.success(`Data ${deleteTarget.label} berhasil dihapus`);
    } catch (e: any) {
      toast.error(`Gagal menghapus: ${e.message}`);
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleDeleteAllData = () => {
    setDeleteTarget({
      label: 'SEMUA DATA (kecuali petugas)',
      action: async () => {
        const tables = ['cicilan', 'cicilan_pesantren', 'konsumsi_pesantren', 'operasional_pesantren', 'pembangunan_pesantren', 'pembayaran', 'pembayaran_pesantren', 'pengeluaran', 'pengeluaran_pesantren', 'pendapatan_lain_pesantren', 'students'];
        for (const t of tables) {
          await deleteAll(t);
        }
      }
    });
  };

  const siswaSMP = students.filter(s => s.jenjang === 'SMP');
  const siswaSMA = students.filter(s => s.jenjang === 'SMA');
  const pembayaranSMP = pembayaranSekolah.filter(p => p.jenjang === 'SMP');
  const pembayaranSMA = pembayaranSekolah.filter(p => p.jenjang === 'SMA');
  const pengeluaranSMP = pengeluaranSekolah.filter(p => p.sumber_dana === 'SMP');
  const pengeluaranSMA = pengeluaranSekolah.filter(p => p.sumber_dana === 'SMA');

  const ControlCard = ({ icon: Icon, title, children, color, onDelete, deleteLabel }: {
    icon: any; title: string; children: React.ReactNode; color: string; onDelete: () => void; deleteLabel: string;
  }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5 shadow-elegant">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h4 className="font-bold text-foreground text-sm">{title}</h4>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onDelete}
          className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors flex items-center gap-1">
          <Trash2 className="w-3 h-3" /> {deleteLabel}
        </motion.button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </motion.div>
  );

  const InfoRow = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{typeof value === 'number' ? formatRupiah(value) : value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" /> Kontrol Admin
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola dan kontrol seluruh data yayasan</p>
      </motion.div>

      {/* Hapus Semua Data button */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleDeleteAllData}
          className="px-6 py-3 rounded-xl gradient-danger text-destructive-foreground font-bold text-sm btn-shine flex items-center gap-2 shadow-lg">
          <Trash2 className="w-4 h-4" /> Hapus Semua Data
        </motion.button>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 bg-muted p-1.5 rounded-2xl w-fit">
        {([{ key: 'pesantren' as Tab, label: 'Kontrol Pesantren' }, { key: 'sekolah' as Tab, label: 'Kontrol Sekolah' }]).map(tab => (
          <motion.button key={tab.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.key ? 'gradient-primary text-primary-foreground shadow-glow-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {activeTab === 'pesantren' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <ControlCard icon={Users} title="Kontrol Santri Pesantren" color="gradient-primary"
              onDelete={() => setDeleteTarget({ label: 'Santri', action: async () => { await deleteAll('students'); } })} deleteLabel="Hapus Data Santri">
              <InfoRow label="Dalam Daerah" value={`${santriByKategori('DALAM DAERAH')} santri`} />
              <InfoRow label="Luar Daerah" value={`${santriByKategori('LUAR DAERAH')} santri`} />
              <InfoRow label="Reguler" value={`${santriByKategori('REGULER')} santri`} />
              <InfoRow label="Non Mukim" value={`${santriByKategori('NON MUKIM')} santri`} />
              <div className="border-t border-border pt-1.5 mt-1.5">
                <InfoRow label="Total Santri" value={`${santri.length} santri`} highlight />
              </div>
            </ControlCard>

            <ControlCard icon={CreditCard} title="Kontrol Data Pembayaran" color="gradient-success"
              onDelete={() => setDeleteTarget({ label: 'Pembayaran Pesantren', action: async () => { await deleteAll('pembayaran_pesantren'); } })} deleteLabel="Hapus Data">
              <InfoRow label="Total Pembayaran" value={pembayaranPesantren.reduce((s, p) => s + p.nominal, 0)} highlight />
              <InfoRow label="Jumlah Transaksi" value={`${pembayaranPesantren.length} transaksi`} />
            </ControlCard>

            <ControlCard icon={CreditCard} title="Kontrol Data Cicilan" color="gradient-info"
              onDelete={() => setDeleteTarget({ label: 'Cicilan Pesantren', action: async () => { await deleteAll('cicilan_pesantren'); } })} deleteLabel="Hapus Data Cicil">
              <InfoRow label="Total Cicilan" value={cicilanPesantren.reduce((s, c) => s + c.nominal, 0)} highlight />
              <InfoRow label="Jumlah Record" value={`${cicilanPesantren.length} record`} />
            </ControlCard>

            <ControlCard icon={Database} title="Kontrol Data Deposit" color="gradient-warning"
              onDelete={() => setDeleteTarget({ label: 'Deposit Pesantren (reset deposit siswa)', action: async () => {
                // Reset all student deposits to 0
                const { error } = await supabase.from('students').update({ deposit: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
                if (error) throw error;
              } })} deleteLabel="Hapus Data Deposit">
              <InfoRow label="Total Deposit" value={students.reduce((s, st) => s + st.deposit, 0)} highlight />
            </ControlCard>

            <ControlCard icon={TrendingDown} title="Kontrol Data Konsumsi" color="gradient-danger"
              onDelete={() => setDeleteTarget({ label: 'Konsumsi Pesantren', action: async () => { await deleteAll('konsumsi_pesantren'); } })} deleteLabel="Hapus Data Konsumsi">
              <InfoRow label="Total Pemasukan" value={totalKonsumsiMasuk} />
              <InfoRow label="Total Pengeluaran" value={totalKonsumsiKeluar} />
              <div className="border-t border-border pt-1.5 mt-1.5">
                <InfoRow label="Saldo" value={totalKonsumsiMasuk - totalKonsumsiKeluar} highlight />
              </div>
            </ControlCard>

            <ControlCard icon={TrendingDown} title="Kontrol Data Operasional" color="gradient-gold"
              onDelete={() => setDeleteTarget({ label: 'Operasional Pesantren', action: async () => { await deleteAll('operasional_pesantren'); } })} deleteLabel="Hapus Data Operasional">
              <InfoRow label="Total Pemasukan" value={totalOperasionalMasuk} />
              <InfoRow label="Total Pengeluaran" value={totalOperasionalKeluar} />
              <div className="border-t border-border pt-1.5 mt-1.5">
                <InfoRow label="Saldo" value={totalOperasionalMasuk - totalOperasionalKeluar} highlight />
              </div>
            </ControlCard>

            <ControlCard icon={TrendingDown} title="Kontrol Data Pembangunan" color="gradient-primary"
              onDelete={() => setDeleteTarget({ label: 'Pembangunan Pesantren', action: async () => { await deleteAll('pembangunan_pesantren'); } })} deleteLabel="Hapus Data Pembangunan">
              <InfoRow label="Total Pemasukan" value={totalPembangunanMasuk} />
              <InfoRow label="Total Pengeluaran" value={totalPembangunanKeluar} />
              <div className="border-t border-border pt-1.5 mt-1.5">
                <InfoRow label="Saldo" value={totalPembangunanMasuk - totalPembangunanKeluar} highlight />
              </div>
            </ControlCard>
          </div>

          {/* Kebijakan Admin */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl border border-border p-6 shadow-elegant sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-foreground text-sm">Kebijakan Admin</h3>
              </div>
              <ol className="space-y-3">
                {kebijakanAdmin.map((k, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-muted-foreground">
                    <span className="w-5 h-5 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-[10px]">{i + 1}</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>
        </div>
      )}

      {activeTab === 'sekolah' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <ControlCard icon={Users} title="Kontrol Data Siswa" color="gradient-primary"
              onDelete={() => setDeleteTarget({ label: 'Siswa', action: async () => { await deleteAll('students'); } })} deleteLabel="Hapus Data Siswa">
              <p className="text-xs font-bold text-foreground mb-1">SMP</p>
              {kelasOptionsSMP.map(k => (
                <InfoRow key={k} label={`Kelas ${k}`} value={`${siswaSMP.filter(s => s.kelas === k).length} siswa`} />
              ))}
              <div className="border-t border-border pt-1.5 mt-1.5 mb-2">
                <InfoRow label="Total SMP" value={`${siswaSMP.length} siswa`} highlight />
              </div>
              <p className="text-xs font-bold text-foreground mb-1">SMA</p>
              {kelasOptionsSMA.map(k => (
                <InfoRow key={k} label={`Kelas ${k}`} value={`${siswaSMA.filter(s => s.kelas === k).length} siswa`} />
              ))}
              <div className="border-t border-border pt-1.5 mt-1.5">
                <InfoRow label="Total SMA" value={`${siswaSMA.length} siswa`} highlight />
              </div>
            </ControlCard>

            <ControlCard icon={CreditCard} title="Kontrol Pembayaran SMP" color="gradient-success"
              onDelete={() => setDeleteTarget({ label: 'Pembayaran SMP', action: async () => {
                const { error } = await supabase.from('pembayaran').delete().eq('jenjang', 'SMP');
                if (error) throw error;
              } })} deleteLabel="Hapus Data Pembayaran SMP">
              {kelasOptionsSMP.map(k => (
                <InfoRow key={k} label={`Kelas ${k}`} value={pembayaranSMP.filter(p => p.kelas === k).reduce((s, p) => s + p.nominal, 0)} />
              ))}
              <div className="border-t border-border pt-1.5 mt-1.5">
                <InfoRow label="Total" value={pembayaranSMP.reduce((s, p) => s + p.nominal, 0)} highlight />
              </div>
            </ControlCard>

            <ControlCard icon={CreditCard} title="Kontrol Pembayaran SMA" color="gradient-info"
              onDelete={() => setDeleteTarget({ label: 'Pembayaran SMA', action: async () => {
                const { error } = await supabase.from('pembayaran').delete().eq('jenjang', 'SMA');
                if (error) throw error;
              } })} deleteLabel="Hapus Data Pembayaran SMA">
              {kelasOptionsSMA.map(k => (
                <InfoRow key={k} label={`Kelas ${k}`} value={pembayaranSMA.filter(p => p.kelas === k).reduce((s, p) => s + p.nominal, 0)} />
              ))}
              <div className="border-t border-border pt-1.5 mt-1.5">
                <InfoRow label="Total" value={pembayaranSMA.reduce((s, p) => s + p.nominal, 0)} highlight />
              </div>
            </ControlCard>

            <ControlCard icon={TrendingDown} title="Pengeluaran SMP" color="gradient-danger"
              onDelete={() => setDeleteTarget({ label: 'Pengeluaran SMP', action: async () => {
                const { error } = await supabase.from('pengeluaran').delete().eq('sumber_dana', 'SMP');
                if (error) throw error;
              } })} deleteLabel="Hapus Data Pengeluaran SMP">
              <InfoRow label="Total Pengeluaran" value={pengeluaranSMP.reduce((s, e) => s + e.nominal, 0)} highlight />
              <InfoRow label="Jumlah Transaksi" value={`${pengeluaranSMP.length} transaksi`} />
            </ControlCard>

            <ControlCard icon={TrendingDown} title="Pengeluaran SMA" color="gradient-warning"
              onDelete={() => setDeleteTarget({ label: 'Pengeluaran SMA', action: async () => {
                const { error } = await supabase.from('pengeluaran').delete().eq('sumber_dana', 'SMA');
                if (error) throw error;
              } })} deleteLabel="Hapus Data Pengeluaran SMA">
              <InfoRow label="Total Pengeluaran" value={pengeluaranSMA.reduce((s, e) => s + e.nominal, 0)} highlight />
              <InfoRow label="Jumlah Transaksi" value={`${pengeluaranSMA.length} transaksi`} />
            </ControlCard>
          </div>

          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-card rounded-2xl border border-border p-6 shadow-elegant sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-warning flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-foreground text-sm">Kebijakan Admin</h3>
              </div>
              <ol className="space-y-3">
                {kebijakanAdmin.map((k, i) => (
                  <li key={i} className="flex gap-2.5 text-xs text-muted-foreground">
                    <span className="w-5 h-5 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-[10px]">{i + 1}</span>
                    <span>{k}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => !deleting && setDeleteTarget(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-7" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl gradient-danger flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-foreground text-xl mb-2">Konfirmasi Hapus</h3>
                <p className="text-muted-foreground text-sm">
                  Apakah Anda yakin akan menghapus data <strong className="text-destructive">{deleteTarget.label}</strong>? Tindakan ini tidak dapat dikembalikan.
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmDelete} disabled={deleting}
                  className="flex-1 py-3 rounded-xl gradient-danger text-destructive-foreground font-bold text-sm btn-shine flex items-center justify-center gap-2 disabled:opacity-50">
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Menghapus...' : 'Ya, Hapus'}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setDeleteTarget(null)} disabled={deleting}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50">
                  Batal
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

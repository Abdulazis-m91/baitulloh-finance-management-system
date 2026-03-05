import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, Edit, Trash2, X, Users, Loader2, AlertTriangle, Phone, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface Petugas {
  id: string;
  namaLengkap: string;
  nomorHP: string;
  email: string;
  password: string;
  role: 'petugas_sekolah' | 'petugas_pesantren';
}

// Mock petugas data (sesuai AuthContext mockUsers)
const initialPetugas: Petugas[] = [
  { id: '1', namaLengkap: 'Petugas Sekolah', nomorHP: '+6281234567890', email: 'sekolah@baitulloh.sch.id', password: 'sekolah123', role: 'petugas_sekolah' },
  { id: '2', namaLengkap: 'Petugas Pesantren', nomorHP: '+6289876543210', email: 'pesantren@baitulloh.sch.id', password: 'pesantren123', role: 'petugas_pesantren' },
];

type PetugasForm = {
  namaLengkap: string;
  nomorHP: string;
  email: string;
  password: string;
  role: 'petugas_sekolah' | 'petugas_pesantren';
};

const emptyForm: PetugasForm = { namaLengkap: '', nomorHP: '+62', email: '', password: '', role: 'petugas_sekolah' };

export default function PetugasYayasan() {
  const [petugasList, setPetugasList] = useState<Petugas[]>(initialPetugas);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<Petugas | null>(null);
  const [showDetail, setShowDetail] = useState<Petugas | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Petugas | null>(null);
  const [form, setForm] = useState<PetugasForm>(emptyForm);

  const handleWhatsAppChange = (value: string) => {
    if (!value.startsWith('+62')) value = '+62';
    setForm(prev => ({ ...prev, nomorHP: value }));
  };

  const handleAdd = () => {
    if (!form.namaLengkap || !form.email || !form.password) {
      toast.error('Mohon lengkapi semua field');
      return;
    }
    const newPetugas: Petugas = {
      id: Date.now().toString(),
      ...form,
    };
    setPetugasList(prev => [...prev, newPetugas]);
    setShowAdd(false);
    setForm(emptyForm);
    toast.success('Petugas berhasil ditambahkan');
  };

  const handleEdit = () => {
    if (!showEdit || !form.namaLengkap || !form.email || !form.password) {
      toast.error('Mohon lengkapi semua field');
      return;
    }
    setPetugasList(prev => prev.map(p => p.id === showEdit.id ? { ...p, ...form } : p));
    setShowEdit(null);
    setForm(emptyForm);
    toast.success('Data petugas berhasil diperbarui');
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      setPetugasList(prev => prev.filter(p => p.id !== showDeleteConfirm.id));
      setShowDeleteConfirm(null);
      toast.success('Petugas berhasil dihapus');
    }
  };

  const openEdit = (p: Petugas) => {
    setForm({ namaLengkap: p.namaLengkap, nomorHP: p.nomorHP, email: p.email, password: p.password, role: p.role });
    setShowEdit(p);
  };

  const roleLabel = (role: string) => role === 'petugas_sekolah' ? 'Petugas Sekolah' : 'Petugas Pesantren';
  const roleBadgeColor = (role: string) => role === 'petugas_sekolah' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary';

  const FormPopup = ({ title, onClose, onSubmit }: { title: string; onClose: () => void; onSubmit: () => void }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-card rounded-3xl shadow-2xl w-full max-w-lg p-7" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-foreground text-xl">{title}</h3>
          <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </motion.button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Nama Lengkap Petugas</label>
            <input value={form.namaLengkap} onChange={e => setForm(prev => ({ ...prev, namaLengkap: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Nomor Handphone</label>
            <input value={form.nomorHP} onChange={e => handleWhatsAppChange(e.target.value)} placeholder="+628xxxxxxxxxx"
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Email Petugas</label>
            <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Password</label>
            <input type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Role</label>
            <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value as any }))}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm input-focus">
              <option value="petugas_sekolah">Petugas Sekolah</option>
              <option value="petugas_pesantren">Petugas Pesantren</option>
            </select>
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} type="submit"
            className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold btn-shine shadow-glow-primary text-sm">
            {title.includes('Tambah') ? 'Simpan Petugas' : 'Perbarui Petugas'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> Petugas Yayasan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola akses petugas yang dapat login ke sistem</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setForm(emptyForm); setShowAdd(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold btn-shine shadow-glow-primary">
            <Plus className="w-4 h-4" /> Tambah Petugas
          </motion.button>
        </motion.div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card rounded-3xl border border-border shadow-elegant overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {['No', 'Nama Lengkap', 'No. HP', 'Email', 'Role', 'Aksi'].map(h => (
                <th key={h} className="py-4 px-4 text-muted-foreground font-semibold text-xs uppercase tracking-wider text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {petugasList.map((p, i) => (
              <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="border-b border-border/30 hover:bg-primary/[0.02] transition-colors">
                <td className="py-4 px-4 text-muted-foreground">{i + 1}</td>
                <td className="py-4 px-4 text-foreground font-semibold">{p.namaLengkap}</td>
                <td className="py-4 px-4 text-muted-foreground">{p.nomorHP}</td>
                <td className="py-4 px-4 text-muted-foreground">{p.email}</td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${roleBadgeColor(p.role)}`}>{roleLabel(p.role)}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1.5">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowDetail(p)}
                      className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"><Eye className="w-4 h-4" /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => openEdit(p)}
                      className="p-2 rounded-lg hover:bg-secondary/10 text-secondary transition-colors"><Edit className="w-4 h-4" /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowDeleteConfirm(p)}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="w-4 h-4" /></motion.button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {petugasList.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Belum ada data petugas</td></tr>
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Popups */}
      <AnimatePresence>
        {showAdd && <FormPopup title="Tambah Petugas" onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}
        {showEdit && <FormPopup title="Edit Petugas" onClose={() => setShowEdit(null)} onSubmit={handleEdit} />}

        {showDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowDetail(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-7" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-foreground text-xl">Detail Petugas</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShowDetail(null)} className="p-2 rounded-full hover:bg-muted">
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{showDetail.namaLengkap}</p>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${roleBadgeColor(showDetail.role)}`}>{roleLabel(showDetail.role)}</span>
                  </div>
                </div>
                {[
                  { icon: Phone, label: 'No. Handphone', value: showDetail.nomorHP },
                  { icon: Mail, label: 'Email', value: showDetail.email },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" onClick={() => setShowDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-7" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl gradient-danger flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-foreground text-xl mb-2">Konfirmasi Hapus</h3>
                <p className="text-muted-foreground text-sm">Apakah Anda yakin akan menghapus data petugas <strong>{showDeleteConfirm.namaLengkap}</strong>?</p>
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDelete}
                  className="flex-1 py-3 rounded-xl gradient-danger text-destructive-foreground font-bold text-sm btn-shine flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Ya, Hapus
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-3 rounded-xl border-2 border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors">
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

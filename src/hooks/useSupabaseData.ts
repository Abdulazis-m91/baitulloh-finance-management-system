import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types matching DB schema
export interface StudentDB {
  id: string;
  nisn: string;
  nama_lengkap: string;
  jenjang: 'SMP' | 'SMA' | 'Reguler';
  kelas: string;
  nama_orang_tua: string;
  nomor_whatsapp: string;
  foto: string | null;
  barcode: string;
  tunggakan_sekolah: string[];
  tunggakan_pesantren: string[];
  biaya_per_bulan: number;
  deposit: number;
  kategori: string | null;
  created_at: string;
  updated_at: string;
}

export interface PembayaranDB {
  id: string;
  siswa_id: string | null;
  nama_siswa: string;
  nisn: string;
  jenjang: 'SMP' | 'SMA' | 'Reguler';
  kelas: string;
  bulan: string;
  nominal: number;
  metode: 'Lunas' | 'Cicil' | 'Deposit';
  tanggal: string;
  petugas: string;
  created_at: string;
}

export interface PengeluaranDB {
  id: string;
  keterangan: string;
  sumber_dana: 'SMP' | 'SMA' | 'Reguler';
  jenis_keperluan: string;
  nominal: number;
  tanggal: string;
  petugas: string;
  created_at: string;
}

export interface CicilanDB {
  id: string;
  siswa_id: string;
  bulan: string;
  nominal: number;
  tanggal: string;
  petugas: string;
  created_at: string;
}

// ========== STUDENTS ==========
export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').order('nama_lengkap');
      if (error) throw error;
      return data as StudentDB[];
    },
  });
}

export function useInsertStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (student: Omit<StudentDB, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('students').insert(student).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Data siswa berhasil ditambahkan'); },
    onError: (e) => toast.error(`Gagal menambah siswa: ${e.message}`),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StudentDB> & { id: string }) => {
      const { data, error } = await supabase.from('students').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Data siswa berhasil diperbarui'); },
    onError: (e) => toast.error(`Gagal memperbarui siswa: ${e.message}`),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['students'] }); toast.success('Data siswa berhasil dihapus'); },
    onError: (e) => toast.error(`Gagal menghapus siswa: ${e.message}`),
  });
}

// ========== PEMBAYARAN ==========
export function usePembayaran() {
  return useQuery({
    queryKey: ['pembayaran'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pembayaran').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as PembayaranDB[];
    },
  });
}

export function useInsertPembayaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<PembayaranDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('pembayaran').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pembayaran'] }); toast.success('Pembayaran berhasil dicatat'); },
    onError: (e) => toast.error(`Gagal mencatat pembayaran: ${e.message}`),
  });
}

// ── Hapus pembayaran + rollback tunggakan siswa ────────────────────────────
// Saat record pembayaran dihapus:
// 1. Ambil data pembayaran (siswa_id + bulan)
// 2. Hapus record pembayaran dari DB
// 3. Tambahkan bulan tersebut kembali ke tunggakan_sekolah siswa
export function useDeletePembayaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pembayaran: PembayaranDB) => {
      // Step 1: Hapus record pembayaran
      const { error: deleteError } = await supabase
        .from('pembayaran')
        .delete()
        .eq('id', pembayaran.id);
      if (deleteError) throw deleteError;

      // Step 2: Rollback tunggakan siswa (hanya jika ada siswa_id dan bukan Deposit)
      if (pembayaran.siswa_id && pembayaran.metode !== 'Deposit') {
        // Ambil data siswa terkini
        const { data: siswa, error: fetchError } = await supabase
          .from('students')
          .select('tunggakan_sekolah')
          .eq('id', pembayaran.siswa_id)
          .single();
        if (fetchError) throw fetchError;

        // Tambahkan bulan yang dihapus kembali ke tunggakan (hindari duplikat)
        const tunggakanLama: string[] = siswa?.tunggakan_sekolah || [];
        if (!tunggakanLama.includes(pembayaran.bulan)) {
          const tunggakanBaru = [...tunggakanLama, pembayaran.bulan];
          const { error: updateError } = await supabase
            .from('students')
            .update({ tunggakan_sekolah: tunggakanBaru })
            .eq('id', pembayaran.siswa_id);
          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pembayaran'] });
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success('Pembayaran dihapus & tunggakan siswa diperbarui');
    },
    onError: (e) => toast.error(`Gagal menghapus pembayaran: ${e.message}`),
  });
}

// ========== PENGELUARAN ==========
export function usePengeluaran() {
  return useQuery({
    queryKey: ['pengeluaran'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pengeluaran').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as PengeluaranDB[];
    },
  });
}

export function useInsertPengeluaran() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<PengeluaranDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('pengeluaran').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pengeluaran'] }); toast.success('Pengeluaran berhasil dicatat'); },
    onError: (e) => toast.error(`Gagal mencatat pengeluaran: ${e.message}`),
  });
}

// ========== CICILAN ==========
export function useCicilan() {
  return useQuery({
    queryKey: ['cicilan'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cicilan').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as CicilanDB[];
    },
  });
}

export function useCicilanBySiswa(siswaId: string | undefined) {
  return useQuery({
    queryKey: ['cicilan', siswaId],
    enabled: !!siswaId,
    queryFn: async () => {
      const { data, error } = await supabase.from('cicilan').select('*').eq('siswa_id', siswaId!).order('tanggal', { ascending: false });
      if (error) throw error;
      return data as CicilanDB[];
    },
  });
}

export function useInsertCicilan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<CicilanDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('cicilan').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cicilan'] }); toast.success('Cicilan berhasil dicatat'); },
    onError: (e) => toast.error(`Gagal mencatat cicilan: ${e.message}`),
  });
}

export function useDeleteCicilanBySiswaAndBulan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ siswa_id, bulan }: { siswa_id: string; bulan: string }) => {
      const { error } = await supabase.from('cicilan').delete().eq('siswa_id', siswa_id).eq('bulan', bulan);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cicilan'] }); },
    onError: (e) => toast.error(`Gagal menghapus cicilan: ${e.message}`),
  });
}

// ========== NAIK KELAS (BATCH UPDATE) ==========
export function useBatchUpdateKelas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, kelasBaru }: { ids: string[]; kelasBaru: string }) => {
      const { error } = await supabase
        .from('students')
        .update({ kelas: kelasBaru })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success('Kelas siswa berhasil diperbarui');
    },
    onError: (e) => toast.error(`Gagal memperbarui kelas: ${e.message}`),
  });
}

// ========== UPDATE STATUS (aktif / lulus) ==========
export function useUpdateStatusSiswa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: 'aktif' | 'lulus' }) => {
      const { error } = await supabase
        .from('students')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success(vars.status === 'lulus' ? 'Siswa berhasil diarsipkan' : 'Siswa berhasil diaktifkan kembali');
    },
    onError: (e) => toast.error(`Gagal mengubah status: ${e.message}`),
  });
}

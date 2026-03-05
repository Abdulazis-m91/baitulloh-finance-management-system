import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types matching DB schema
export interface StudentDB {
  id: string;
  nisn: string;
  nama_lengkap: string;
  jenjang: 'SMP' | 'SMA';
  kelas: string;
  nama_orang_tua: string;
  nomor_whatsapp: string;
  foto: string | null;
  barcode: string;
  tunggakan_sekolah: string[];
  tunggakan_pesantren: string[];
  biaya_per_bulan: number;
  deposit: number;
  created_at: string;
  updated_at: string;
}

export interface PembayaranDB {
  id: string;
  siswa_id: string | null;
  nama_siswa: string;
  nisn: string;
  jenjang: 'SMP' | 'SMA';
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
  sumber_dana: 'SMP' | 'SMA';
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

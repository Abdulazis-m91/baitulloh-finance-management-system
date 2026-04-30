import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StudentDB } from './useSupabaseData';

export const KATEGORI_LIST = ['DALAM DAERAH', 'LUAR DAERAH', 'REGULER', 'NON MUKIM'] as const;
export type KategoriSantri = typeof KATEGORI_LIST[number];

export const KATEGORI_BIAYA: Record<KategoriSantri, { konsumsi: number; operasional: number; pembangunan: number; total: number }> = {
  'DALAM DAERAH': { konsumsi: 400000, operasional: 50000, pembangunan: 50000, total: 500000 },
  'LUAR DAERAH': { konsumsi: 400000, operasional: 100000, pembangunan: 50000, total: 550000 },
  'REGULER': { konsumsi: 400000, operasional: 0, pembangunan: 50000, total: 450000 },
  'NON MUKIM': { konsumsi: 50000, operasional: 25000, pembangunan: 50000, total: 125000 },
};

export interface PembayaranPesantrenDB {
  id: string;
  siswa_id: string | null;
  nama_siswa: string;
  nisn: string;
  jenjang: 'SMP' | 'SMA';
  kelas: string;
  kategori: string;
  bulan: string;
  nominal: number;
  metode: 'Lunas' | 'Cicil' | 'Deposit';
  tanggal: string;
  petugas: string;
  created_at: string;
}

export interface KomponenPesantrenDB {
  id: string;
  siswa_id: string | null;
  pembayaran_id: string | null;
  nama_siswa: string;
  kategori: string;
  bulan: string;
  nominal: number;
  tanggal: string;
  petugas: string;
  created_at: string;
}

export interface CicilanPesantrenDB {
  id: string;
  siswa_id: string;
  bulan: string;
  nominal: number;
  tanggal: string;
  petugas: string;
  created_at: string;
}

export interface PengeluaranPesantrenDB {
  id: string;
  jenis_keperluan: string;
  keterangan: string;
  nominal: number;
  tanggal: string;
  petugas: string;
  created_at: string;
}

// ========== PEMBAYARAN PESANTREN ==========
export function usePembayaranPesantren() {
  return useQuery({
    queryKey: ['pembayaran_pesantren'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pembayaran_pesantren').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as PembayaranPesantrenDB[];
    },
  });
}

export function useInsertPembayaranPesantren() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<PembayaranPesantrenDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('pembayaran_pesantren').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pembayaran_pesantren'] }); toast.success('Pembayaran pesantren berhasil dicatat'); },
    onError: (e) => toast.error(`Gagal: ${e.message}`),
  });
}

// ========== DELETE PEMBAYARAN PESANTREN (dengan rollback) ==========
export function useDeletePembayaranPesantren() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pembayaran: PembayaranPesantrenDB) => {
      const { id, siswa_id, bulan } = pembayaran;

      // 1. Hapus komponen dari 3 tabel berdasarkan pembayaran_id
      const [k, o, b] = await Promise.all([
        supabase.from('konsumsi_pesantren').delete().eq('pembayaran_id', id),
        supabase.from('operasional_pesantren').delete().eq('pembayaran_id', id),
        supabase.from('pembangunan_pesantren').delete().eq('pembayaran_id', id),
      ]);
      if (k.error) throw k.error;
      if (o.error) throw o.error;
      if (b.error) throw b.error;

      // 2. Rollback tunggakan santri jika ada siswa_id
      if (siswa_id) {
        const { data: santri, error: santriError } = await supabase
          .from('santri')
          .select('tunggakan_pesantren')
          .eq('id', siswa_id)
          .single();
        if (!santriError && santri) {
          const tunggakanBaru = [...(santri.tunggakan_pesantren || [])];
          if (!tunggakanBaru.includes(bulan)) {
            tunggakanBaru.push(bulan);
          }
          await supabase
            .from('santri')
            .update({ tunggakan_pesantren: tunggakanBaru })
            .eq('id', siswa_id);
        }
      }

      // 3. Hapus pembayaran utama
      const { error: delError } = await supabase
        .from('pembayaran_pesantren')
        .delete()
        .eq('id', id);
      if (delError) throw delError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pembayaran_pesantren'] });
      qc.invalidateQueries({ queryKey: ['konsumsi_pesantren'] });
      qc.invalidateQueries({ queryKey: ['operasional_pesantren'] });
      qc.invalidateQueries({ queryKey: ['pembangunan_pesantren'] });
      qc.invalidateQueries({ queryKey: ['santri'] });
      toast.success('Pembayaran dihapus & tunggakan santri dikembalikan');
    },
    onError: (e) => toast.error(`Gagal menghapus: ${e.message}`),
  });
}

// ========== KONSUMSI ==========
export function useKonsumsiPesantren() {
  return useQuery({
    queryKey: ['konsumsi_pesantren'],
    queryFn: async () => {
      const { data, error } = await supabase.from('konsumsi_pesantren').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as KomponenPesantrenDB[];
    },
  });
}

export function useInsertKonsumsi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<KomponenPesantrenDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('konsumsi_pesantren').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['konsumsi_pesantren'] }); },
    onError: (e) => toast.error(`Gagal simpan konsumsi: ${e.message}`),
  });
}


export function useDeleteKonsumsi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('konsumsi_pesantren').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['konsumsi_pesantren'] });
      toast.success('Data konsumsi berhasil dihapus');
    },
    onError: (e) => toast.error(`Gagal menghapus: ${e.message}`),
  });
}

// ========== OPERASIONAL ==========
export function useOperasionalPesantren() {
  return useQuery({
    queryKey: ['operasional_pesantren'],
    queryFn: async () => {
      const { data, error } = await supabase.from('operasional_pesantren').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as KomponenPesantrenDB[];
    },
  });
}

export function useInsertOperasional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<KomponenPesantrenDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('operasional_pesantren').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['operasional_pesantren'] }); },
    onError: (e) => toast.error(`Gagal simpan operasional: ${e.message}`),
  });
}

// ========== PEMBANGUNAN ==========
export function usePembangunanPesantren() {
  return useQuery({
    queryKey: ['pembangunan_pesantren'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pembangunan_pesantren').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as KomponenPesantrenDB[];
    },
  });
}

export function useInsertPembangunan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<KomponenPesantrenDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('pembangunan_pesantren').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pembangunan_pesantren'] }); },
    onError: (e) => toast.error(`Gagal simpan pembangunan: ${e.message}`),
  });
}

// ========== CICILAN PESANTREN ==========
export function useCicilanPesantren() {
  return useQuery({
    queryKey: ['cicilan_pesantren'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cicilan_pesantren').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as CicilanPesantrenDB[];
    },
  });
}

export function useCicilanPesantrenBySiswa(siswaId: string | undefined) {
  return useQuery({
    queryKey: ['cicilan_pesantren', siswaId],
    enabled: !!siswaId,
    queryFn: async () => {
      const { data, error } = await supabase.from('cicilan_pesantren').select('*').eq('siswa_id', siswaId!).order('tanggal', { ascending: false });
      if (error) throw error;
      return data as CicilanPesantrenDB[];
    },
  });
}

export function useInsertCicilanPesantren() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<CicilanPesantrenDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('cicilan_pesantren').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cicilan_pesantren'] }); toast.success('Cicilan pesantren berhasil dicatat'); },
    onError: (e) => toast.error(`Gagal: ${e.message}`),
  });
}

export function useDeleteCicilanPesantrenBySiswaAndBulan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ siswa_id, bulan }: { siswa_id: string; bulan: string }) => {
      const { error } = await supabase.from('cicilan_pesantren').delete().eq('siswa_id', siswa_id).eq('bulan', bulan);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cicilan_pesantren'] }); },
    onError: (e) => toast.error(`Gagal: ${e.message}`),
  });
}

// ========== PENGELUARAN PESANTREN ==========
export function usePengeluaranPesantren() {
  return useQuery({
    queryKey: ['pengeluaran_pesantren'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pengeluaran_pesantren').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as PengeluaranPesantrenDB[];
    },
  });
}

export function useInsertPengeluaranPesantren() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<PengeluaranPesantrenDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('pengeluaran_pesantren').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pengeluaran_pesantren'] }); toast.success('Pengeluaran pesantren berhasil dicatat'); },
    onError: (e) => toast.error(`Gagal: ${e.message}`),
  });
}

// ========== PENDAPATAN LAIN PESANTREN ==========
export interface PendapatanLainPesantrenDB {
  id: string;
  nama: string;
  nominal: number;
  tanggal: string;
  petugas: string;
  created_at: string;
}

export function usePendapatanLainPesantren() {
  return useQuery({
    queryKey: ['pendapatan_lain_pesantren'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pendapatan_lain_pesantren').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      return data as PendapatanLainPesantrenDB[];
    },
  });
}

export function useInsertPendapatanLainPesantren() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Omit<PendapatanLainPesantrenDB, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('pendapatan_lain_pesantren').insert(record).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pendapatan_lain_pesantren'] }); },
    onError: (e) => toast.error(`Gagal: ${e.message}`),
  });
}

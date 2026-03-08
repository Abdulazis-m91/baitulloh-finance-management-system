import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SantriDB {
  id: string;
  nisn: string;
  nama_lengkap: string;
  jenjang: 'SMP' | 'SMA' | 'Reguler';
  kelas: string;
  nama_orang_tua: string;
  nomor_whatsapp: string;
  foto: string | null;
  barcode: string;
  kategori: string | null;
  tunggakan_pesantren: string[];
  biaya_per_bulan: number;
  deposit: number;
  created_at: string;
  updated_at: string;
}

export function useSantri() {
  return useQuery({
    queryKey: ['santri'],
    queryFn: async () => {
      const { data, error } = await supabase.from('santri' as any).select('*').order('nama_lengkap');
      if (error) throw error;
      return data as unknown as SantriDB[];
    },
  });
}

export function useInsertSantri() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (santri: Omit<SantriDB, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('santri' as any).insert(santri as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['santri'] }); toast.success('Data santri berhasil ditambahkan'); },
    onError: (e) => toast.error(`Gagal menambah santri: ${e.message}`),
  });
}

export function useUpdateSantri() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SantriDB> & { id: string }) => {
      const { data, error } = await supabase.from('santri' as any).update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['santri'] }); toast.success('Data santri berhasil diperbarui'); },
    onError: (e) => toast.error(`Gagal memperbarui santri: ${e.message}`),
  });
}

export function useDeleteSantri() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('santri' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['santri'] }); toast.success('Data santri berhasil dihapus'); },
    onError: (e) => toast.error(`Gagal menghapus santri: ${e.message}`),
  });
}

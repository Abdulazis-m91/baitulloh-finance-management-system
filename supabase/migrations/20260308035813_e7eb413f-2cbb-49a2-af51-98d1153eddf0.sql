
-- Create santri table (separate from students which is for sekolah only)
CREATE TABLE public.santri (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nisn text NOT NULL,
  nama_lengkap text NOT NULL,
  jenjang public.jenjang_type NOT NULL,
  kelas text NOT NULL,
  nama_orang_tua text NOT NULL,
  nomor_whatsapp text NOT NULL,
  foto text NULL,
  barcode text NOT NULL DEFAULT ''::text,
  kategori text NULL,
  tunggakan_pesantren text[] NOT NULL DEFAULT '{}'::text[],
  biaya_per_bulan integer NOT NULL DEFAULT 0,
  deposit integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.santri ENABLE ROW LEVEL SECURITY;

-- RLS policies - authenticated users can access
CREATE POLICY "Allow all select on santri" ON public.santri FOR SELECT USING (true);
CREATE POLICY "Allow all insert on santri" ON public.santri FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on santri" ON public.santri FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on santri" ON public.santri FOR DELETE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_santri_updated_at
  BEFORE UPDATE ON public.santri
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing santri data from students (students that have kategori or tunggakan_pesantren)
INSERT INTO public.santri (nisn, nama_lengkap, jenjang, kelas, nama_orang_tua, nomor_whatsapp, foto, barcode, kategori, tunggakan_pesantren, biaya_per_bulan, deposit, created_at, updated_at)
SELECT nisn, nama_lengkap, jenjang, kelas, nama_orang_tua, nomor_whatsapp, foto, barcode, kategori, tunggakan_pesantren, biaya_per_bulan, deposit, created_at, updated_at
FROM public.students
WHERE kategori IS NOT NULL OR array_length(tunggakan_pesantren, 1) > 0;

-- Update FK references on pesantren tables to reference santri
-- First update cicilan_pesantren
ALTER TABLE public.cicilan_pesantren DROP CONSTRAINT IF EXISTS cicilan_pesantren_siswa_id_fkey;
ALTER TABLE public.cicilan_pesantren ADD CONSTRAINT cicilan_pesantren_siswa_id_fkey 
  FOREIGN KEY (siswa_id) REFERENCES public.santri(id) ON DELETE CASCADE;

-- Update konsumsi_pesantren
ALTER TABLE public.konsumsi_pesantren DROP CONSTRAINT IF EXISTS konsumsi_pesantren_siswa_id_fkey;
ALTER TABLE public.konsumsi_pesantren ADD CONSTRAINT konsumsi_pesantren_siswa_id_fkey 
  FOREIGN KEY (siswa_id) REFERENCES public.santri(id) ON DELETE CASCADE;

-- Update operasional_pesantren
ALTER TABLE public.operasional_pesantren DROP CONSTRAINT IF EXISTS operasional_pesantren_siswa_id_fkey;
ALTER TABLE public.operasional_pesantren ADD CONSTRAINT operasional_pesantren_siswa_id_fkey 
  FOREIGN KEY (siswa_id) REFERENCES public.santri(id) ON DELETE CASCADE;

-- Update pembangunan_pesantren
ALTER TABLE public.pembangunan_pesantren DROP CONSTRAINT IF EXISTS pembangunan_pesantren_siswa_id_fkey;
ALTER TABLE public.pembangunan_pesantren ADD CONSTRAINT pembangunan_pesantren_siswa_id_fkey 
  FOREIGN KEY (siswa_id) REFERENCES public.santri(id) ON DELETE CASCADE;

-- Update pembayaran_pesantren
ALTER TABLE public.pembayaran_pesantren DROP CONSTRAINT IF EXISTS pembayaran_pesantren_siswa_id_fkey;
ALTER TABLE public.pembayaran_pesantren ADD CONSTRAINT pembayaran_pesantren_siswa_id_fkey 
  FOREIGN KEY (siswa_id) REFERENCES public.santri(id) ON DELETE CASCADE;

-- Remove tunggakan_pesantren and kategori from students table since it's now sekolah-only
-- We keep the columns for now to avoid breaking changes, but they won't be used


CREATE TABLE public.pendapatan_lain_pesantren (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nominal INTEGER NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  petugas TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pendapatan_lain_pesantren ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren FOR SELECT USING (true);

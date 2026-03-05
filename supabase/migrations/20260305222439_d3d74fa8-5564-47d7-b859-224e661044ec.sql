
-- Drop all RESTRICTIVE policies on students and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Authenticated can read students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can delete students" ON public.students;
DROP POLICY IF EXISTS "Public can search students" ON public.students;
DROP POLICY IF EXISTS "Public can insert students" ON public.students;
DROP POLICY IF EXISTS "Public can update students" ON public.students;
DROP POLICY IF EXISTS "Public can delete students" ON public.students;

CREATE POLICY "Allow all select on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow all insert on students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on students" ON public.students FOR DELETE USING (true);

-- Fix cicilan
DROP POLICY IF EXISTS "Authenticated can read cicilan" ON public.cicilan;
DROP POLICY IF EXISTS "Authenticated can insert cicilan" ON public.cicilan;
DROP POLICY IF EXISTS "Authenticated can delete cicilan" ON public.cicilan;
DROP POLICY IF EXISTS "Public can read cicilan" ON public.cicilan;
DROP POLICY IF EXISTS "Public can insert cicilan" ON public.cicilan;
DROP POLICY IF EXISTS "Public can delete cicilan" ON public.cicilan;

CREATE POLICY "Allow all select on cicilan" ON public.cicilan FOR SELECT USING (true);
CREATE POLICY "Allow all insert on cicilan" ON public.cicilan FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete on cicilan" ON public.cicilan FOR DELETE USING (true);
CREATE POLICY "Allow all update on cicilan" ON public.cicilan FOR UPDATE USING (true);

-- Fix cicilan_pesantren
DROP POLICY IF EXISTS "Public can read cicilan_pesantren" ON public.cicilan_pesantren;
DROP POLICY IF EXISTS "Public can insert cicilan_pesantren" ON public.cicilan_pesantren;
DROP POLICY IF EXISTS "Public can delete cicilan_pesantren" ON public.cicilan_pesantren;

CREATE POLICY "Allow all select on cicilan_pesantren" ON public.cicilan_pesantren FOR SELECT USING (true);
CREATE POLICY "Allow all insert on cicilan_pesantren" ON public.cicilan_pesantren FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete on cicilan_pesantren" ON public.cicilan_pesantren FOR DELETE USING (true);
CREATE POLICY "Allow all update on cicilan_pesantren" ON public.cicilan_pesantren FOR UPDATE USING (true);

-- Fix pembayaran
DROP POLICY IF EXISTS "Authenticated can read pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Authenticated can insert pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Authenticated can update pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Authenticated can delete pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Public can read pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Public can insert pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Public can delete pembayaran" ON public.pembayaran;

CREATE POLICY "Allow all select on pembayaran" ON public.pembayaran FOR SELECT USING (true);
CREATE POLICY "Allow all insert on pembayaran" ON public.pembayaran FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on pembayaran" ON public.pembayaran FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on pembayaran" ON public.pembayaran FOR DELETE USING (true);

-- Fix pengeluaran
DROP POLICY IF EXISTS "Authenticated can read pengeluaran" ON public.pengeluaran;
DROP POLICY IF EXISTS "Authenticated can insert pengeluaran" ON public.pengeluaran;
DROP POLICY IF EXISTS "Authenticated can update pengeluaran" ON public.pengeluaran;
DROP POLICY IF EXISTS "Authenticated can delete pengeluaran" ON public.pengeluaran;
DROP POLICY IF EXISTS "Public can read pengeluaran" ON public.pengeluaran;
DROP POLICY IF EXISTS "Public can insert pengeluaran" ON public.pengeluaran;

CREATE POLICY "Allow all select on pengeluaran" ON public.pengeluaran FOR SELECT USING (true);
CREATE POLICY "Allow all insert on pengeluaran" ON public.pengeluaran FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on pengeluaran" ON public.pengeluaran FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on pengeluaran" ON public.pengeluaran FOR DELETE USING (true);

-- Fix konsumsi_pesantren
DROP POLICY IF EXISTS "Public can read konsumsi_pesantren" ON public.konsumsi_pesantren;
DROP POLICY IF EXISTS "Public can insert konsumsi_pesantren" ON public.konsumsi_pesantren;
DROP POLICY IF EXISTS "Public can delete konsumsi_pesantren" ON public.konsumsi_pesantren;
DROP POLICY IF EXISTS "Public can update konsumsi_pesantren" ON public.konsumsi_pesantren;

CREATE POLICY "Allow all select on konsumsi_pesantren" ON public.konsumsi_pesantren FOR SELECT USING (true);
CREATE POLICY "Allow all insert on konsumsi_pesantren" ON public.konsumsi_pesantren FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on konsumsi_pesantren" ON public.konsumsi_pesantren FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on konsumsi_pesantren" ON public.konsumsi_pesantren FOR DELETE USING (true);

-- Fix operasional_pesantren
DROP POLICY IF EXISTS "Public can read operasional_pesantren" ON public.operasional_pesantren;
DROP POLICY IF EXISTS "Public can insert operasional_pesantren" ON public.operasional_pesantren;
DROP POLICY IF EXISTS "Public can delete operasional_pesantren" ON public.operasional_pesantren;
DROP POLICY IF EXISTS "Public can update operasional_pesantren" ON public.operasional_pesantren;

CREATE POLICY "Allow all select on operasional_pesantren" ON public.operasional_pesantren FOR SELECT USING (true);
CREATE POLICY "Allow all insert on operasional_pesantren" ON public.operasional_pesantren FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on operasional_pesantren" ON public.operasional_pesantren FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on operasional_pesantren" ON public.operasional_pesantren FOR DELETE USING (true);

-- Fix pembangunan_pesantren
DROP POLICY IF EXISTS "Public can read pembangunan_pesantren" ON public.pembangunan_pesantren;
DROP POLICY IF EXISTS "Public can insert pembangunan_pesantren" ON public.pembangunan_pesantren;
DROP POLICY IF EXISTS "Public can delete pembangunan_pesantren" ON public.pembangunan_pesantren;
DROP POLICY IF EXISTS "Public can update pembangunan_pesantren" ON public.pembangunan_pesantren;

CREATE POLICY "Allow all select on pembangunan_pesantren" ON public.pembangunan_pesantren FOR SELECT USING (true);
CREATE POLICY "Allow all insert on pembangunan_pesantren" ON public.pembangunan_pesantren FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on pembangunan_pesantren" ON public.pembangunan_pesantren FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on pembangunan_pesantren" ON public.pembangunan_pesantren FOR DELETE USING (true);

-- Fix pembayaran_pesantren
DROP POLICY IF EXISTS "Public can read pembayaran_pesantren" ON public.pembayaran_pesantren;
DROP POLICY IF EXISTS "Public can insert pembayaran_pesantren" ON public.pembayaran_pesantren;
DROP POLICY IF EXISTS "Public can update pembayaran_pesantren" ON public.pembayaran_pesantren;
DROP POLICY IF EXISTS "Public can delete pembayaran_pesantren" ON public.pembayaran_pesantren;

CREATE POLICY "Allow all select on pembayaran_pesantren" ON public.pembayaran_pesantren FOR SELECT USING (true);
CREATE POLICY "Allow all insert on pembayaran_pesantren" ON public.pembayaran_pesantren FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on pembayaran_pesantren" ON public.pembayaran_pesantren FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on pembayaran_pesantren" ON public.pembayaran_pesantren FOR DELETE USING (true);

-- Fix pengeluaran_pesantren
DROP POLICY IF EXISTS "Public can read pengeluaran_pesantren" ON public.pengeluaran_pesantren;
DROP POLICY IF EXISTS "Public can insert pengeluaran_pesantren" ON public.pengeluaran_pesantren;
DROP POLICY IF EXISTS "Public can delete pengeluaran_pesantren" ON public.pengeluaran_pesantren;
DROP POLICY IF EXISTS "Public can update pengeluaran_pesantren" ON public.pengeluaran_pesantren;

CREATE POLICY "Allow all select on pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR SELECT USING (true);
CREATE POLICY "Allow all insert on pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR DELETE USING (true);

-- Fix pendapatan_lain_pesantren
DROP POLICY IF EXISTS "Public can insert pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren;
DROP POLICY IF EXISTS "Public can read pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren;
DROP POLICY IF EXISTS "Public can delete pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren;
DROP POLICY IF EXISTS "Public can update pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren;

CREATE POLICY "Allow all select on pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren FOR SELECT USING (true);
CREATE POLICY "Allow all insert on pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren FOR DELETE USING (true);

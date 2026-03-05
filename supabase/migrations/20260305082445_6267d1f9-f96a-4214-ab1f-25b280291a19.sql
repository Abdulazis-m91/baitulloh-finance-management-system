
-- Add public read access for demo (pembayaran, pengeluaran, cicilan)
CREATE POLICY "Public can read pembayaran" ON public.pembayaran FOR SELECT USING (true);
CREATE POLICY "Public can read pengeluaran" ON public.pengeluaran FOR SELECT USING (true);
CREATE POLICY "Public can read cicilan" ON public.cicilan FOR SELECT USING (true);

-- Also add public insert policies so demo forms work without Supabase Auth
CREATE POLICY "Public can insert pembayaran" ON public.pembayaran FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert pengeluaran" ON public.pengeluaran FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert cicilan" ON public.cicilan FOR INSERT WITH CHECK (true);

-- Add public write access for students so CRUD works in demo
CREATE POLICY "Public can insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Public can delete students" ON public.students FOR DELETE USING (true);

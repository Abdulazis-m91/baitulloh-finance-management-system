
-- Add DELETE policies for tables that need them for admin control
CREATE POLICY "Public can delete konsumsi_pesantren" ON public.konsumsi_pesantren FOR DELETE USING (true);
CREATE POLICY "Public can delete operasional_pesantren" ON public.operasional_pesantren FOR DELETE USING (true);
CREATE POLICY "Public can delete pembangunan_pesantren" ON public.pembangunan_pesantren FOR DELETE USING (true);
CREATE POLICY "Public can delete pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren FOR DELETE USING (true);
CREATE POLICY "Public can delete pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR DELETE USING (true);
CREATE POLICY "Public can update pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren FOR UPDATE USING (true);
CREATE POLICY "Public can update pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR UPDATE USING (true);
CREATE POLICY "Public can update konsumsi_pesantren" ON public.konsumsi_pesantren FOR UPDATE USING (true);
CREATE POLICY "Public can update operasional_pesantren" ON public.operasional_pesantren FOR UPDATE USING (true);
CREATE POLICY "Public can update pembangunan_pesantren" ON public.pembangunan_pesantren FOR UPDATE USING (true);
CREATE POLICY "Public can delete pembayaran" ON public.pembayaran FOR DELETE USING (true);

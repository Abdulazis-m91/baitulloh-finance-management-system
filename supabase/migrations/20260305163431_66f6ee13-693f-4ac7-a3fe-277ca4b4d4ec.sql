
CREATE POLICY "Public can delete cicilan" ON public.cicilan FOR DELETE TO anon USING (true);
CREATE POLICY "Authenticated can delete cicilan" ON public.cicilan FOR DELETE TO authenticated USING (true);

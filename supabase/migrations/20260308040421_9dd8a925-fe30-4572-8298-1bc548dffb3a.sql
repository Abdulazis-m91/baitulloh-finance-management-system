
-- Drop existing permissive policies on students table
DROP POLICY IF EXISTS "Allow all select on students" ON public.students;
DROP POLICY IF EXISTS "Allow all insert on students" ON public.students;
DROP POLICY IF EXISTS "Allow all update on students" ON public.students;
DROP POLICY IF EXISTS "Allow all delete on students" ON public.students;

-- Drop existing permissive policies on santri table
DROP POLICY IF EXISTS "Allow all select on santri" ON public.santri;
DROP POLICY IF EXISTS "Allow all insert on santri" ON public.santri;
DROP POLICY IF EXISTS "Allow all update on santri" ON public.santri;
DROP POLICY IF EXISTS "Allow all delete on santri" ON public.santri;

-- Students: only admin + petugas_sekolah
CREATE POLICY "sekolah_select_students" ON public.students FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));

CREATE POLICY "sekolah_insert_students" ON public.students FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));

CREATE POLICY "sekolah_update_students" ON public.students FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));

CREATE POLICY "sekolah_delete_students" ON public.students FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));

-- Santri: only admin + petugas_pesantren
CREATE POLICY "pesantren_select_santri" ON public.santri FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

CREATE POLICY "pesantren_insert_santri" ON public.santri FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

CREATE POLICY "pesantren_update_santri" ON public.santri FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

CREATE POLICY "pesantren_delete_santri" ON public.santri FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

-- Pembayaran (sekolah): only admin + petugas_sekolah
DROP POLICY IF EXISTS "Allow all select on pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Allow all insert on pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Allow all update on pembayaran" ON public.pembayaran;
DROP POLICY IF EXISTS "Allow all delete on pembayaran" ON public.pembayaran;

CREATE POLICY "sekolah_select_pembayaran" ON public.pembayaran FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));
CREATE POLICY "sekolah_insert_pembayaran" ON public.pembayaran FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));
CREATE POLICY "sekolah_update_pembayaran" ON public.pembayaran FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));
CREATE POLICY "sekolah_delete_pembayaran" ON public.pembayaran FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));

-- Cicilan (sekolah): only admin + petugas_sekolah
DROP POLICY IF EXISTS "Allow all select on cicilan" ON public.cicilan;
DROP POLICY IF EXISTS "Allow all insert on cicilan" ON public.cicilan;
DROP POLICY IF EXISTS "Allow all update on cicilan" ON public.cicilan;
DROP POLICY IF EXISTS "Allow all delete on cicilan" ON public.cicilan;

CREATE POLICY "sekolah_select_cicilan" ON public.cicilan FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));
CREATE POLICY "sekolah_insert_cicilan" ON public.cicilan FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));
CREATE POLICY "sekolah_update_cicilan" ON public.cicilan FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));
CREATE POLICY "sekolah_delete_cicilan" ON public.cicilan FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));

-- Pengeluaran (sekolah): only admin + petugas_sekolah
DROP POLICY IF EXISTS "Allow all select on pengeluaran" ON public.pengeluaran;
DROP POLICY IF EXISTS "Allow all insert on pengeluaran" ON public.pengeluaran;
DROP POLICY IF EXISTS "Allow all update on pengeluaran" ON public.pengeluaran;
DROP POLICY IF EXISTS "Allow all delete on pengeluaran" ON public.pengeluaran;

CREATE POLICY "sekolah_select_pengeluaran" ON public.pengeluaran FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));
CREATE POLICY "sekolah_insert_pengeluaran" ON public.pengeluaran FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));
CREATE POLICY "sekolah_update_pengeluaran" ON public.pengeluaran FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));
CREATE POLICY "sekolah_delete_pengeluaran" ON public.pengeluaran FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_sekolah'));

-- Pembayaran pesantren: only admin + petugas_pesantren
DROP POLICY IF EXISTS "Allow all select on pembayaran_pesantren" ON public.pembayaran_pesantren;
DROP POLICY IF EXISTS "Allow all insert on pembayaran_pesantren" ON public.pembayaran_pesantren;
DROP POLICY IF EXISTS "Allow all update on pembayaran_pesantren" ON public.pembayaran_pesantren;
DROP POLICY IF EXISTS "Allow all delete on pembayaran_pesantren" ON public.pembayaran_pesantren;

CREATE POLICY "pesantren_select_pembayaran_pesantren" ON public.pembayaran_pesantren FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_insert_pembayaran_pesantren" ON public.pembayaran_pesantren FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_update_pembayaran_pesantren" ON public.pembayaran_pesantren FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_delete_pembayaran_pesantren" ON public.pembayaran_pesantren FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

-- Cicilan pesantren: only admin + petugas_pesantren
DROP POLICY IF EXISTS "Allow all select on cicilan_pesantren" ON public.cicilan_pesantren;
DROP POLICY IF EXISTS "Allow all insert on cicilan_pesantren" ON public.cicilan_pesantren;
DROP POLICY IF EXISTS "Allow all update on cicilan_pesantren" ON public.cicilan_pesantren;
DROP POLICY IF EXISTS "Allow all delete on cicilan_pesantren" ON public.cicilan_pesantren;

CREATE POLICY "pesantren_select_cicilan_pesantren" ON public.cicilan_pesantren FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_insert_cicilan_pesantren" ON public.cicilan_pesantren FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_update_cicilan_pesantren" ON public.cicilan_pesantren FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_delete_cicilan_pesantren" ON public.cicilan_pesantren FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

-- Pengeluaran pesantren: only admin + petugas_pesantren
DROP POLICY IF EXISTS "Allow all select on pengeluaran_pesantren" ON public.pengeluaran_pesantren;
DROP POLICY IF EXISTS "Allow all insert on pengeluaran_pesantren" ON public.pengeluaran_pesantren;
DROP POLICY IF EXISTS "Allow all update on pengeluaran_pesantren" ON public.pengeluaran_pesantren;
DROP POLICY IF EXISTS "Allow all delete on pengeluaran_pesantren" ON public.pengeluaran_pesantren;

CREATE POLICY "pesantren_select_pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_insert_pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_update_pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_delete_pengeluaran_pesantren" ON public.pengeluaran_pesantren FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

-- Konsumsi pesantren: only admin + petugas_pesantren
DROP POLICY IF EXISTS "Allow all select on konsumsi_pesantren" ON public.konsumsi_pesantren;
DROP POLICY IF EXISTS "Allow all insert on konsumsi_pesantren" ON public.konsumsi_pesantren;
DROP POLICY IF EXISTS "Allow all update on konsumsi_pesantren" ON public.konsumsi_pesantren;
DROP POLICY IF EXISTS "Allow all delete on konsumsi_pesantren" ON public.konsumsi_pesantren;

CREATE POLICY "pesantren_select_konsumsi" ON public.konsumsi_pesantren FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_insert_konsumsi" ON public.konsumsi_pesantren FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_update_konsumsi" ON public.konsumsi_pesantren FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_delete_konsumsi" ON public.konsumsi_pesantren FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

-- Operasional pesantren: only admin + petugas_pesantren
DROP POLICY IF EXISTS "Allow all select on operasional_pesantren" ON public.operasional_pesantren;
DROP POLICY IF EXISTS "Allow all insert on operasional_pesantren" ON public.operasional_pesantren;
DROP POLICY IF EXISTS "Allow all update on operasional_pesantren" ON public.operasional_pesantren;
DROP POLICY IF EXISTS "Allow all delete on operasional_pesantren" ON public.operasional_pesantren;

CREATE POLICY "pesantren_select_operasional" ON public.operasional_pesantren FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_insert_operasional" ON public.operasional_pesantren FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_update_operasional" ON public.operasional_pesantren FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_delete_operasional" ON public.operasional_pesantren FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

-- Pembangunan pesantren: only admin + petugas_pesantren
DROP POLICY IF EXISTS "Allow all select on pembangunan_pesantren" ON public.pembangunan_pesantren;
DROP POLICY IF EXISTS "Allow all insert on pembangunan_pesantren" ON public.pembangunan_pesantren;
DROP POLICY IF EXISTS "Allow all update on pembangunan_pesantren" ON public.pembangunan_pesantren;
DROP POLICY IF EXISTS "Allow all delete on pembangunan_pesantren" ON public.pembangunan_pesantren;

CREATE POLICY "pesantren_select_pembangunan" ON public.pembangunan_pesantren FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_insert_pembangunan" ON public.pembangunan_pesantren FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_update_pembangunan" ON public.pembangunan_pesantren FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_delete_pembangunan" ON public.pembangunan_pesantren FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

-- Pendapatan lain pesantren: only admin + petugas_pesantren
DROP POLICY IF EXISTS "Allow all select on pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren;
DROP POLICY IF EXISTS "Allow all insert on pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren;
DROP POLICY IF EXISTS "Allow all update on pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren;
DROP POLICY IF EXISTS "Allow all delete on pendapatan_lain_pesantren" ON public.pendapatan_lain_pesantren;

CREATE POLICY "pesantren_select_pendapatan_lain" ON public.pendapatan_lain_pesantren FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_insert_pendapatan_lain" ON public.pendapatan_lain_pesantren FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_update_pendapatan_lain" ON public.pendapatan_lain_pesantren FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));
CREATE POLICY "pesantren_delete_pendapatan_lain" ON public.pendapatan_lain_pesantren FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'petugas_pesantren'));

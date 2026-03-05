
-- Create enum for jenjang
CREATE TYPE public.jenjang_type AS ENUM ('SMP', 'SMA');

-- Create enum for payment method
CREATE TYPE public.metode_bayar AS ENUM ('Lunas', 'Cicil', 'Deposit');

-- Create enum for user role
CREATE TYPE public.app_role AS ENUM ('admin', 'petugas_sekolah', 'petugas_pesantren');

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nisn TEXT NOT NULL UNIQUE,
  nama_lengkap TEXT NOT NULL,
  jenjang jenjang_type NOT NULL,
  kelas TEXT NOT NULL,
  nama_orang_tua TEXT NOT NULL,
  nomor_whatsapp TEXT NOT NULL,
  foto TEXT,
  barcode TEXT NOT NULL DEFAULT '',
  tunggakan_sekolah TEXT[] NOT NULL DEFAULT '{}',
  tunggakan_pesantren TEXT[] NOT NULL DEFAULT '{}',
  biaya_per_bulan INTEGER NOT NULL DEFAULT 0,
  deposit INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.pembayaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  nama_siswa TEXT NOT NULL,
  nisn TEXT NOT NULL,
  jenjang jenjang_type NOT NULL,
  kelas TEXT NOT NULL,
  bulan TEXT NOT NULL,
  nominal INTEGER NOT NULL,
  metode metode_bayar NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  petugas TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.pengeluaran (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keterangan TEXT NOT NULL,
  sumber_dana jenjang_type NOT NULL,
  jenis_keperluan TEXT NOT NULL,
  nominal INTEGER NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  petugas TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create installments table
CREATE TABLE public.cicilan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  siswa_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  bulan TEXT NOT NULL,
  nominal INTEGER NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  petugas TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cicilan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: All authenticated users can CRUD (school internal system)
CREATE POLICY "Authenticated can read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update students" ON public.students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete students" ON public.students FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read pembayaran" ON public.pembayaran FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert pembayaran" ON public.pembayaran FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pembayaran" ON public.pembayaran FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete pembayaran" ON public.pembayaran FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read pengeluaran" ON public.pengeluaran FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert pengeluaran" ON public.pengeluaran FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update pengeluaran" ON public.pengeluaran FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete pengeluaran" ON public.pengeluaran FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read cicilan" ON public.cicilan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert cicilan" ON public.cicilan FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Allow public search for students (landing page)
CREATE POLICY "Public can search students" ON public.students FOR SELECT TO anon USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

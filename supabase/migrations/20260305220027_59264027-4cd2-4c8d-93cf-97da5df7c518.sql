-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text DEFAULT '';

-- Allow admin to manage user_roles (insert, update, delete)
CREATE POLICY "Admin can insert user_roles" ON public.user_roles
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can update user_roles" ON public.user_roles
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can delete user_roles" ON public.user_roles
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);

-- Allow admin to read all profiles
CREATE POLICY "Admin can read all profiles" ON public.profiles
FOR SELECT USING (
  public.has_role(auth.uid(), 'admin')
);

-- Allow admin to update all profiles
CREATE POLICY "Admin can update all profiles" ON public.profiles
FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin')
);

-- Allow admin to delete profiles
CREATE POLICY "Admin can delete profiles" ON public.profiles
FOR DELETE USING (
  public.has_role(auth.uid(), 'admin')
);

-- Allow admin to read all user_roles
CREATE POLICY "Admin can read all user_roles" ON public.user_roles
FOR SELECT USING (
  public.has_role(auth.uid(), 'admin')
);

-- Public read on user_roles for login flow  
CREATE POLICY "Public can read user_roles" ON public.user_roles
FOR SELECT USING (true);
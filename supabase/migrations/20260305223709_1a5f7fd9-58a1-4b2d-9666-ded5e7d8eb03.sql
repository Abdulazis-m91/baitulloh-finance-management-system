
-- Fix profiles: drop RESTRICTIVE policies and create PERMISSIVE ones
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;

CREATE POLICY "Allow all select on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow all insert on profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on profiles" ON public.profiles FOR DELETE USING (true);

-- Fix user_roles: drop RESTRICTIVE policies and create PERMISSIVE ones
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can read all user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public can read user_roles" ON public.user_roles;

CREATE POLICY "Allow all select on user_roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Allow all insert on user_roles" ON public.user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on user_roles" ON public.user_roles FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on user_roles" ON public.user_roles FOR DELETE USING (true);

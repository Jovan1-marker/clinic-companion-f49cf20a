
-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'admin'
  )
$$;

-- Fix patients policies - admin only for write operations
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON public.patients;

CREATE POLICY "Admin can insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin can update patients" ON public.patients FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin can delete patients" ON public.patients FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Fix records policies - admin only for write
DROP POLICY IF EXISTS "Authenticated users can insert records" ON public.records;
DROP POLICY IF EXISTS "Authenticated users can update records" ON public.records;
DROP POLICY IF EXISTS "Authenticated users can delete records" ON public.records;

CREATE POLICY "Admin can insert records" ON public.records FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin can update records" ON public.records FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admin can delete records" ON public.records FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Fix finished_appointments policies - admin only
DROP POLICY IF EXISTS "Admin can insert finished appointments" ON public.finished_appointments;
DROP POLICY IF EXISTS "Admin can delete finished appointments" ON public.finished_appointments;

CREATE POLICY "Admin can insert finished appointments" ON public.finished_appointments FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admin can delete finished appointments" ON public.finished_appointments FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

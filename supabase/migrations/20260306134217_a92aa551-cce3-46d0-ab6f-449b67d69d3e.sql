
-- Fix infinite recursion: Drop all self-referencing policies and recreate using is_admin()

-- PROFILES
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS "Admin can insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admin can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admin can delete announcements" ON public.announcements;

CREATE POLICY "Admin can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admin can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admin can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- APPOINTMENTS
DROP POLICY IF EXISTS "Admin can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admin can delete appointments" ON public.appointments;

CREATE POLICY "Admin can view all appointments" ON public.appointments FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admin can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admin can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- FEEDBACK
DROP POLICY IF EXISTS "Admin can view all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admin can insert feedback replies" ON public.feedback;

CREATE POLICY "Admin can view all feedback" ON public.feedback FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admin can insert feedback replies" ON public.feedback FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

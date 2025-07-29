-- Fix critical RLS security vulnerabilities

-- 1. Create security definer function to prevent infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Enable RLS on all tables (they were disabled)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Trainers and admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Trainers and admins can create clients" ON public.clients;
DROP POLICY IF EXISTS "Trainers and admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Trainers and admins can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Trainers and admins can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Trainers and admins can manage client packages" ON public.client_packages;
DROP POLICY IF EXISTS "Trainers and admins can view all client packages" ON public.client_packages;
DROP POLICY IF EXISTS "Trainers and admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Trainers and admins can view all payments" ON public.payments;

-- 4. Create secure RLS policies using the security definer function

-- Profiles table policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Clients table policies
CREATE POLICY "Clients can view their own record" 
ON public.clients FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Trainers and admins can view all clients" 
ON public.clients FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'trainer'));

CREATE POLICY "Trainers and admins can create clients" 
ON public.clients FOR INSERT 
WITH CHECK (public.get_current_user_role() IN ('admin', 'trainer'));

CREATE POLICY "Trainers and admins can update clients" 
ON public.clients FOR UPDATE 
USING (public.get_current_user_role() IN ('admin', 'trainer'));

-- Sessions table policies
CREATE POLICY "Clients can view their own sessions" 
ON public.sessions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.clients 
  WHERE clients.id = sessions.client_id 
  AND clients.user_id = auth.uid()
));

CREATE POLICY "Trainers and admins can view all sessions" 
ON public.sessions FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'trainer'));

CREATE POLICY "Trainers and admins can manage sessions" 
ON public.sessions FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'trainer'));

-- Client packages table policies
CREATE POLICY "Clients can view their own packages" 
ON public.client_packages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.clients 
  WHERE clients.id = client_packages.client_id 
  AND clients.user_id = auth.uid()
));

CREATE POLICY "Trainers and admins can view all client packages" 
ON public.client_packages FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'trainer'));

CREATE POLICY "Trainers and admins can manage client packages" 
ON public.client_packages FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'trainer'));

-- Payments table policies
CREATE POLICY "Clients can view their own payments" 
ON public.payments FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.clients 
  WHERE clients.id = payments.client_id 
  AND clients.user_id = auth.uid()
));

CREATE POLICY "Trainers and admins can view all payments" 
ON public.payments FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'trainer'));

CREATE POLICY "Trainers and admins can manage payments" 
ON public.payments FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'trainer'));
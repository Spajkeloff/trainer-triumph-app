-- Disable RLS for development - focus on functionality first
-- We'll add security back before production

-- Disable RLS on all tables
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages DISABLE ROW LEVEL SECURITY;

-- Drop all restrictive policies to make development easier
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Clients can view their own record" ON public.clients;
DROP POLICY IF EXISTS "Trainers and admins can view all clients" ON public.clients;
DROP POLICY IF EXISTS "Trainers and admins can create clients" ON public.clients;
DROP POLICY IF EXISTS "Trainers and admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Trainers and admins can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Trainers and admins can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Clients can view their own packages" ON public.client_packages;
DROP POLICY IF EXISTS "Trainers and admins can view all client packages" ON public.client_packages;
DROP POLICY IF EXISTS "Trainers and admins can manage client packages" ON public.client_packages;
DROP POLICY IF EXISTS "Clients can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Trainers and admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Trainers and admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Everyone can view packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;

-- Drop the security definer function since we're not using security for now
DROP FUNCTION IF EXISTS public.get_current_user_role();
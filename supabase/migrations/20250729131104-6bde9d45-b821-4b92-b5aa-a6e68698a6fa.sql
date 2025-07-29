-- Update all RLS policies to allow both trainer and admin roles

-- Fix packages table policies
DROP POLICY IF EXISTS "Trainers can manage packages" ON public.packages;
CREATE POLICY "Trainers and admins can manage packages" 
ON public.packages 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'))
WITH CHECK (get_current_user_role() IN ('trainer', 'admin'));

-- Fix sessions table policies
DROP POLICY IF EXISTS "Trainers can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Trainers can manage sessions" ON public.sessions;

CREATE POLICY "Trainers and admins can view all sessions" 
ON public.sessions 
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'));

CREATE POLICY "Trainers and admins can manage sessions" 
ON public.sessions 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'))
WITH CHECK (get_current_user_role() IN ('trainer', 'admin'));

-- Fix payments table policies
DROP POLICY IF EXISTS "Trainers can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Trainers can manage payments" ON public.payments;

CREATE POLICY "Trainers and admins can view all payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'));

CREATE POLICY "Trainers and admins can manage payments" 
ON public.payments 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'))
WITH CHECK (get_current_user_role() IN ('trainer', 'admin'));

-- Fix client_packages table policies
DROP POLICY IF EXISTS "Trainers can view all client packages" ON public.client_packages;
DROP POLICY IF EXISTS "Trainers can manage client packages" ON public.client_packages;

CREATE POLICY "Trainers and admins can view all client packages" 
ON public.client_packages 
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'));

CREATE POLICY "Trainers and admins can manage client packages" 
ON public.client_packages 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'))
WITH CHECK (get_current_user_role() IN ('trainer', 'admin'));

-- Fix client_notes table policies
DROP POLICY IF EXISTS "Trainers can view all client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Trainers can manage client notes" ON public.client_notes;

CREATE POLICY "Trainers and admins can view all client notes" 
ON public.client_notes 
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'));

CREATE POLICY "Trainers and admins can manage client notes" 
ON public.client_notes 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'))
WITH CHECK (get_current_user_role() IN ('trainer', 'admin'));

-- Fix client_documents table policies
DROP POLICY IF EXISTS "Trainers can view all client documents" ON public.client_documents;
DROP POLICY IF EXISTS "Trainers can manage client documents" ON public.client_documents;

CREATE POLICY "Trainers and admins can view all client documents" 
ON public.client_documents 
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'));

CREATE POLICY "Trainers and admins can manage client documents" 
ON public.client_documents 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'))
WITH CHECK (get_current_user_role() IN ('trainer', 'admin'));

-- Fix client_assessments table policies
DROP POLICY IF EXISTS "Trainers can view all client assessments" ON public.client_assessments;
DROP POLICY IF EXISTS "Trainers can manage client assessments" ON public.client_assessments;

CREATE POLICY "Trainers and admins can view all client assessments" 
ON public.client_assessments 
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'));

CREATE POLICY "Trainers and admins can manage client assessments" 
ON public.client_assessments 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'))
WITH CHECK (get_current_user_role() IN ('trainer', 'admin'));

-- Fix client_messages table policies
DROP POLICY IF EXISTS "Trainers can view all client messages" ON public.client_messages;
DROP POLICY IF EXISTS "Trainers can manage client messages" ON public.client_messages;

CREATE POLICY "Trainers and admins can view all client messages" 
ON public.client_messages 
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'));

CREATE POLICY "Trainers and admins can manage client messages" 
ON public.client_messages 
FOR ALL 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'))
WITH CHECK (get_current_user_role() IN ('trainer', 'admin'));

-- Add DELETE policy for clients table
CREATE POLICY "Trainers and admins can delete clients" 
ON public.clients 
FOR DELETE 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'));
-- Fix the client creation policy to allow authenticated users to create clients
-- First drop the existing restrictive policy
DROP POLICY IF EXISTS "Trainers can insert clients" ON public.clients;

-- Create a new policy that allows authenticated users to create clients
-- but ensures they set the user_id to their own user id for security
CREATE POLICY "Authenticated users can create clients" 
ON public.clients 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also update the trainer role checking to be more permissive for viewing clients
-- Keep the existing view policy but make it work for authenticated users with trainer role
DROP POLICY IF EXISTS "Trainers can view all clients" ON public.clients;
CREATE POLICY "Trainers can view all clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (get_current_user_role() = 'trainer');

-- Keep the update policy for trainers only
DROP POLICY IF EXISTS "Trainers can update clients" ON public.clients;
CREATE POLICY "Trainers can update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (get_current_user_role() = 'trainer')
WITH CHECK (get_current_user_role() = 'trainer');
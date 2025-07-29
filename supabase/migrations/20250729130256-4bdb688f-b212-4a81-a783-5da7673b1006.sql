-- Update the client viewing policy to allow both trainers and admins
DROP POLICY IF EXISTS "Trainers can view all clients" ON public.clients;

CREATE POLICY "Trainers and admins can view all clients" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'));

-- Also update the update policy to allow admins
DROP POLICY IF EXISTS "Trainers can update clients" ON public.clients;

CREATE POLICY "Trainers and admins can update clients" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (get_current_user_role() IN ('trainer', 'admin'))
WITH CHECK (get_current_user_role() IN ('trainer', 'admin'));
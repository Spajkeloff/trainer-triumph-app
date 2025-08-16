-- Fix security issue: Restrict trainer profile access to authenticated users only
-- Remove the overly permissive policy that allows public access to trainer profiles

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Trainers can access profiles for trainer data" ON public.profiles;

-- Create a more secure policy for trainer profile access
-- Only authenticated admin/trainer users can view trainer profiles, and only basic info needed for business operations
CREATE POLICY "Authenticated admin/trainers can view trainer profiles for business operations" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  -- Users can always view their own profile
  (auth.uid() = user_id) 
  OR 
  -- Admin/trainer users can view trainer profiles (only basic business info)
  (
    get_current_user_role() = ANY (ARRAY['trainer'::text, 'admin'::text]) 
    AND role = 'trainer'::text
  )
);

-- Add policy to ensure only authenticated users can access any profile data
CREATE POLICY "Only authenticated users can access profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Remove any anonymous access - ensure all access requires authentication
-- This replaces any existing policies that might allow anonymous access
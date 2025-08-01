-- Fix the role check constraint to include 'lead' role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add updated constraint that includes all valid roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('client', 'trainer', 'admin', 'lead'));
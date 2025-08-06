-- Fix the trainer creation function - it was trying to insert into auth.users which is not allowed
-- Instead, let's create a simpler approach using edge functions

DROP FUNCTION IF EXISTS public.create_trainer_with_user(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC);

-- Update the trainers table to join properly with profiles
UPDATE public.trainers SET user_id = user_id WHERE user_id IS NOT NULL;

-- Add policy for trainers to access their profiles
CREATE POLICY "Trainers can access profiles for trainer data" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'trainer' OR 
  get_current_user_role() = ANY (ARRAY['trainer'::text, 'admin'::text])
);
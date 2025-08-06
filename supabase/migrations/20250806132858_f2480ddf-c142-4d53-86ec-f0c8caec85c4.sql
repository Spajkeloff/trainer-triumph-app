-- Add foreign key relationship between trainers and profiles
ALTER TABLE public.trainers 
ADD CONSTRAINT trainers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a function to handle trainer creation that can be called by authenticated users
CREATE OR REPLACE FUNCTION public.create_trainer_with_user(
  email TEXT,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  payroll_type TEXT,
  session_rate NUMERIC DEFAULT 0,
  package_percentage NUMERIC DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id UUID;
  new_trainer_id UUID;
  result JSON;
BEGIN
  -- Only allow admins to create trainers
  IF NOT (SELECT get_current_user_role() = 'admin') THEN
    RAISE EXCEPTION 'Only admins can create trainers';
  END IF;

  -- Create the user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    json_build_object('first_name', first_name, 'last_name', last_name)::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Create profile for the new user
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    role
  ) VALUES (
    new_user_id,
    first_name,
    last_name,
    'trainer'
  );

  -- Create trainer record
  INSERT INTO public.trainers (
    user_id,
    payroll_type,
    session_rate,
    package_percentage,
    created_by
  ) VALUES (
    new_user_id,
    payroll_type,
    session_rate,
    package_percentage,
    auth.uid()
  ) RETURNING id INTO new_trainer_id;

  -- Return the result
  SELECT json_build_object(
    'user_id', new_user_id,
    'trainer_id', new_trainer_id,
    'email', email,
    'first_name', first_name,
    'last_name', last_name
  ) INTO result;

  RETURN result;
END;
$$;
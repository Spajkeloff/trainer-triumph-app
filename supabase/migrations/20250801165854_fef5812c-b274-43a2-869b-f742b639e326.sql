-- CRITICAL FIX: Clean up orphaned auth data causing JWT errors

-- Step 1: Identify and clean up orphaned profiles
-- Remove profiles that don't have matching auth users
DELETE FROM public.profiles 
WHERE user_id NOT IN (
  SELECT id FROM auth.users
);

-- Step 2: Ensure handle_new_user trigger is robust
-- Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved handle_new_user function with transaction safety
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log the user creation attempt
  RAISE LOG 'Creating profile for user: %', NEW.id;
  
  -- Insert profile with proper error handling
  BEGIN
    INSERT INTO public.profiles (
      user_id, 
      first_name, 
      last_name, 
      role
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, update it instead
      UPDATE public.profiles 
      SET 
        first_name = COALESCE(NEW.raw_user_meta_data ->> 'first_name', first_name),
        last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', last_name),
        role = COALESCE(NEW.raw_user_meta_data ->> 'role', role),
        updated_at = now()
      WHERE user_id = NEW.id;
      
      RAISE LOG 'Profile updated for existing user: %', NEW.id;
      
    WHEN OTHERS THEN
      -- Log error but don't block user creation
      RAISE WARNING 'Failed to create/update profile for user %: % %', NEW.id, SQLSTATE, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Add validation function to check auth sync
CREATE OR REPLACE FUNCTION public.validate_user_profile_sync()
RETURNS TABLE(
  issue_type text,
  user_id uuid,
  details text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  -- Find profiles without auth users (orphaned profiles)
  SELECT 
    'orphaned_profile'::text as issue_type,
    p.user_id,
    'Profile exists but no auth user found'::text as details
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.user_id = u.id
  WHERE u.id IS NULL
  
  UNION ALL
  
  -- Find auth users without profiles (missing profiles)
  SELECT 
    'missing_profile'::text as issue_type,
    u.id as user_id,
    'Auth user exists but no profile found'::text as details
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.user_id
  WHERE p.user_id IS NULL;
$$;

-- Step 4: Create any missing profiles for existing auth users
INSERT INTO public.profiles (user_id, first_name, last_name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'first_name', 'User'),
  COALESCE(u.raw_user_meta_data ->> 'last_name', ''),
  COALESCE(u.raw_user_meta_data ->> 'role', 'client')
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Verify the sync
-- This will show any remaining sync issues
SELECT * FROM public.validate_user_profile_sync();
-- Update the handle_new_user function to set new users as 'lead' by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      COALESCE(NEW.raw_user_meta_data ->> 'role', 'lead')  -- Default to 'lead' instead of 'client'
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
$function$;

-- Also update the profiles table default role to 'lead'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'lead';
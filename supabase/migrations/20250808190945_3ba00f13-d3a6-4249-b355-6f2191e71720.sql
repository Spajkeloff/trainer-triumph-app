-- Harden existing functions by setting search_path
CREATE OR REPLACE FUNCTION public.validate_user_profile_sync()
 RETURNS TABLE(issue_type text, user_id uuid, details text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_trainer_earnings(trainer_user_id uuid)
 RETURNS TABLE(session_count bigint, total_session_earnings numeric, total_package_earnings numeric, total_earnings numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(session_stats.session_count, 0) as session_count,
    COALESCE(
      CASE 
        WHEN t.payroll_type = 'per_session' THEN session_stats.session_count * t.session_rate
        ELSE 0
      END, 0
    ) as total_session_earnings,
    COALESCE(
      CASE 
        WHEN t.payroll_type = 'percentage' THEN package_stats.package_earnings
        ELSE 0
      END, 0
    ) as total_package_earnings,
    COALESCE(
      CASE 
        WHEN t.payroll_type = 'per_session' THEN session_stats.session_count * t.session_rate
        WHEN t.payroll_type = 'percentage' THEN package_stats.package_earnings
        ELSE 0
      END, 0
    ) as total_earnings
  FROM public.trainers t
  LEFT JOIN (
    SELECT 
      trainer_id,
      COUNT(*) as session_count
    FROM public.sessions
    WHERE status = 'completed'
    GROUP BY trainer_id
  ) session_stats ON session_stats.trainer_id = t.id
  LEFT JOIN (
    SELECT 
      s.trainer_id,
      SUM(p.amount * (t_inner.package_percentage / 100)) as package_earnings
    FROM public.sessions s
    JOIN public.payments p ON p.session_id = s.id
    JOIN public.trainers t_inner ON s.trainer_id = t_inner.id
    WHERE p.status = 'completed'
    GROUP BY s.trainer_id
  ) package_stats ON package_stats.trainer_id = t.id
  WHERE t.user_id = trainer_user_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE user_id = auth.uid()), 'client');
$function$;

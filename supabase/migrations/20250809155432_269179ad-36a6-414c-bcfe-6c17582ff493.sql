-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.reset_package_alerts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Reset low session alert if sessions were added
  IF NEW.sessions_remaining > OLD.sessions_remaining THEN
    NEW.alert_sent_at = NULL;
  END IF;
  
  -- Reset expiry alert if expiry date was extended
  IF NEW.expiry_date > OLD.expiry_date THEN
    NEW.expiry_alert_sent_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;
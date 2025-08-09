-- Add alert tracking to client_packages table
ALTER TABLE public.client_packages 
ADD COLUMN alert_sent_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN expiry_alert_sent_at TIMESTAMP WITH TIME ZONE NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.client_packages.alert_sent_at IS 'When low session alert was last sent';
COMMENT ON COLUMN public.client_packages.expiry_alert_sent_at IS 'When expiry alert was last sent';

-- Create function to reset alerts when sessions are updated
CREATE OR REPLACE FUNCTION public.reset_package_alerts()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to auto-reset alerts when package is updated
CREATE TRIGGER reset_package_alerts_trigger
  BEFORE UPDATE ON public.client_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_package_alerts();
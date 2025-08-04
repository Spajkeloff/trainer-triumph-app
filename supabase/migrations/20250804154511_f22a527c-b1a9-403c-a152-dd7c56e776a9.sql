-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a scheduled job to run package expiry notifications daily at 9 AM
SELECT cron.schedule(
  'package-expiry-notifications',
  '0 9 * * *', -- Daily at 9 AM
  $$
  SELECT
    net.http_post(
        url:='https://qyytmkvyjbpserxfmsxa.supabase.co/functions/v1/package-expiry-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5eXRta3Z5amJwc2VyeGZtc3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3ODU0NzcsImV4cCI6MjA2OTM2MTQ3N30.S3GSLADjoZs0lnKUka5953Ir5DbehKOJXgEeuy82RX4"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);
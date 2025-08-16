-- Add cancellation-related columns to sessions table
ALTER TABLE public.sessions 
ADD COLUMN cancelled_at timestamp with time zone,
ADD COLUMN cancelled_by text,
ADD COLUMN cancellation_reason text;
-- Add permission columns to clients table for booking control
ALTER TABLE public.clients 
ADD COLUMN can_book_sessions boolean DEFAULT false,
ADD COLUMN can_cancel_sessions boolean DEFAULT false;
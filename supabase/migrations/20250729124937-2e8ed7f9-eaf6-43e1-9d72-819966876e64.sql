-- Fix security issues by adding RLS policies and enabling RLS on existing tables

-- Enable RLS on all existing tables first
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE((SELECT role FROM public.profiles WHERE user_id = auth.uid()), 'client');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for clients table
CREATE POLICY "Trainers can view all clients" ON public.clients
  FOR SELECT USING (get_current_user_role() = 'trainer');

CREATE POLICY "Trainers can insert clients" ON public.clients
  FOR INSERT WITH CHECK (get_current_user_role() = 'trainer');

CREATE POLICY "Trainers can update clients" ON public.clients
  FOR UPDATE USING (get_current_user_role() = 'trainer');

-- RLS Policies for packages table
CREATE POLICY "Anyone can view packages" ON public.packages
  FOR SELECT USING (true);

CREATE POLICY "Trainers can manage packages" ON public.packages
  FOR ALL USING (get_current_user_role() = 'trainer');

-- RLS Policies for client_packages table
CREATE POLICY "Trainers can view all client packages" ON public.client_packages
  FOR SELECT USING (get_current_user_role() = 'trainer');

CREATE POLICY "Trainers can manage client packages" ON public.client_packages
  FOR ALL USING (get_current_user_role() = 'trainer');

-- RLS Policies for sessions table
CREATE POLICY "Trainers can view all sessions" ON public.sessions
  FOR SELECT USING (get_current_user_role() = 'trainer');

CREATE POLICY "Trainers can manage sessions" ON public.sessions
  FOR ALL USING (get_current_user_role() = 'trainer');

-- RLS Policies for payments table
CREATE POLICY "Trainers can view all payments" ON public.payments
  FOR SELECT USING (get_current_user_role() = 'trainer');

CREATE POLICY "Trainers can manage payments" ON public.payments
  FOR ALL USING (get_current_user_role() = 'trainer');

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for client_notes table
CREATE POLICY "Trainers can view all client notes" ON public.client_notes
  FOR SELECT USING (get_current_user_role() = 'trainer');

CREATE POLICY "Trainers can manage client notes" ON public.client_notes
  FOR ALL USING (get_current_user_role() = 'trainer');

-- RLS Policies for client_documents table
CREATE POLICY "Trainers can view all client documents" ON public.client_documents
  FOR SELECT USING (get_current_user_role() = 'trainer');

CREATE POLICY "Trainers can manage client documents" ON public.client_documents
  FOR ALL USING (get_current_user_role() = 'trainer');

-- RLS Policies for client_assessments table
CREATE POLICY "Trainers can view all client assessments" ON public.client_assessments
  FOR SELECT USING (get_current_user_role() = 'trainer');

CREATE POLICY "Trainers can manage client assessments" ON public.client_assessments
  FOR ALL USING (get_current_user_role() = 'trainer');

-- RLS Policies for client_messages table
CREATE POLICY "Trainers can view all client messages" ON public.client_messages
  FOR SELECT USING (get_current_user_role() = 'trainer');

CREATE POLICY "Trainers can manage client messages" ON public.client_messages
  FOR ALL USING (get_current_user_role() = 'trainer');

-- Fix function search path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
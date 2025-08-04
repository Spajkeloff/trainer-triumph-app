-- Create trainers table
CREATE TABLE public.trainers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  payroll_type text NOT NULL CHECK (payroll_type IN ('per_session', 'percentage')),
  session_rate numeric DEFAULT 0,
  package_percentage numeric DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create trainer_clients junction table
CREATE TABLE public.trainer_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid NOT NULL,
  client_id uuid NOT NULL,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(trainer_id, client_id)
);

-- Enable RLS on trainers table
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on trainer_clients table
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;

-- RLS policies for trainers table
CREATE POLICY "Admins can manage trainers" 
ON public.trainers 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Trainers can view their own record" 
ON public.trainers 
FOR SELECT 
USING (get_current_user_role() = 'trainer' AND auth.uid() = user_id);

-- RLS policies for trainer_clients table
CREATE POLICY "Admins can manage trainer client assignments" 
ON public.trainer_clients 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Trainers can view their assigned clients" 
ON public.trainer_clients 
FOR SELECT 
USING (
  get_current_user_role() = 'trainer' AND 
  trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
);

-- Add trigger for automatic timestamp updates on trainers
CREATE TRIGGER update_trainers_updated_at
BEFORE UPDATE ON public.trainers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing RLS policies to respect trainer restrictions
-- Update clients policy to allow trainers to see only their assigned clients
DROP POLICY IF EXISTS "Trainers and admins can view all clients" ON public.clients;

CREATE POLICY "Admins can view all clients" 
ON public.clients 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Trainers can view their assigned clients" 
ON public.clients 
FOR SELECT 
USING (
  get_current_user_role() = 'trainer' AND 
  id IN (
    SELECT client_id 
    FROM public.trainer_clients tc
    JOIN public.trainers t ON tc.trainer_id = t.id
    WHERE t.user_id = auth.uid()
  )
);

-- Update sessions policy to allow trainers to see only their sessions
DROP POLICY IF EXISTS "Trainers and admins can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Trainers and admins can manage sessions" ON public.sessions;

CREATE POLICY "Admins can manage all sessions" 
ON public.sessions 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Trainers can manage their own sessions" 
ON public.sessions 
FOR ALL 
USING (
  get_current_user_role() = 'trainer' AND 
  trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
)
WITH CHECK (
  get_current_user_role() = 'trainer' AND 
  trainer_id IN (SELECT id FROM public.trainers WHERE user_id = auth.uid())
);

-- Update other tables to respect trainer restrictions
-- Client packages - trainers can only see packages for their assigned clients
DROP POLICY IF EXISTS "Trainers and admins can view all client packages" ON public.client_packages;
DROP POLICY IF EXISTS "Trainers and admins can manage client packages" ON public.client_packages;

CREATE POLICY "Admins can manage all client packages" 
ON public.client_packages 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Trainers can view packages for their assigned clients" 
ON public.client_packages 
FOR SELECT 
USING (
  get_current_user_role() = 'trainer' AND 
  client_id IN (
    SELECT client_id 
    FROM public.trainer_clients tc
    JOIN public.trainers t ON tc.trainer_id = t.id
    WHERE t.user_id = auth.uid()
  )
);

-- Client notes - trainers can manage notes for their assigned clients
DROP POLICY IF EXISTS "Trainers and admins can view all client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Trainers and admins can manage client notes" ON public.client_notes;

CREATE POLICY "Admins can manage all client notes" 
ON public.client_notes 
FOR ALL 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');

CREATE POLICY "Trainers can manage notes for their assigned clients" 
ON public.client_notes 
FOR ALL 
USING (
  get_current_user_role() = 'trainer' AND 
  client_id IN (
    SELECT client_id 
    FROM public.trainer_clients tc
    JOIN public.trainers t ON tc.trainer_id = t.id
    WHERE t.user_id = auth.uid()
  )
)
WITH CHECK (
  get_current_user_role() = 'trainer' AND 
  client_id IN (
    SELECT client_id 
    FROM public.trainer_clients tc
    JOIN public.trainers t ON tc.trainer_id = t.id
    WHERE t.user_id = auth.uid()
  )
);

-- Create function to get trainer earnings (fixed GROUP BY issue)
CREATE OR REPLACE FUNCTION public.get_trainer_earnings(trainer_user_id uuid)
RETURNS TABLE(
  session_count bigint,
  total_session_earnings numeric,
  total_package_earnings numeric,
  total_earnings numeric
) 
LANGUAGE sql 
STABLE SECURITY DEFINER
AS $$
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
$$;
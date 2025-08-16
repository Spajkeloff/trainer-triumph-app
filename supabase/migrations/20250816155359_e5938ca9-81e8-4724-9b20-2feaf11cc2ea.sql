-- Add RLS policies to allow clients to view their own data

-- 1. Allow clients to view their own record in the clients table
CREATE POLICY "Clients can view their own record" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- 2. Allow clients to view their own packages in client_packages table
CREATE POLICY "Clients can view their own packages" 
ON public.client_packages 
FOR SELECT 
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- 3. Allow clients to view their own sessions in sessions table  
CREATE POLICY "Clients can view their own sessions" 
ON public.sessions 
FOR SELECT 
TO authenticated
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- 4. Allow all authenticated users to view trainer information
CREATE POLICY "Authenticated users can view trainers" 
ON public.trainers 
FOR SELECT 
TO authenticated
USING (true);
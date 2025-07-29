-- Fix client_balances view security issue by removing SECURITY DEFINER and using proper RLS
DROP VIEW IF EXISTS public.client_balances;

-- Create a function to get client balances (properly secured)
CREATE OR REPLACE FUNCTION public.get_client_balances()
RETURNS TABLE (
  client_id UUID,
  first_name TEXT,
  last_name TEXT,
  total_charges DECIMAL,
  total_payments DECIMAL,
  balance DECIMAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id as client_id,
    c.first_name,
    c.last_name,
    COALESCE(charges.total_charges, 0) as total_charges,
    COALESCE(payments.total_payments, 0) as total_payments,
    COALESCE(charges.total_charges, 0) - COALESCE(payments.total_payments, 0) as balance
  FROM public.clients c
  LEFT JOIN (
    SELECT 
      client_id,
      SUM(amount) as total_charges
    FROM public.transactions 
    WHERE transaction_type = 'charge' AND status = 'completed'
    GROUP BY client_id
  ) charges ON c.id = charges.client_id
  LEFT JOIN (
    SELECT 
      client_id,
      SUM(amount) as total_payments
    FROM public.transactions 
    WHERE transaction_type = 'payment' AND status = 'completed'
    GROUP BY client_id
  ) payments ON c.id = payments.client_id
  WHERE get_current_user_role() = ANY (ARRAY['trainer'::text, 'admin'::text]);
$$;
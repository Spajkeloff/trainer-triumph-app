-- Create transactions table for comprehensive financial tracking
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('charge', 'payment', 'refund', 'discount')),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_id TEXT, -- For linking to sessions, packages, etc.
  reference_type TEXT, -- 'session', 'package', 'membership', etc.
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  payment_terms INTEGER DEFAULT 30, -- days
  description TEXT,
  line_items JSONB, -- Store invoice line items as JSON
  notes TEXT,
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  vendor TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT, -- 'monthly', 'quarterly', 'yearly'
  tax_deductible BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'reimbursed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create client_balances view for easy balance calculation
CREATE OR REPLACE VIEW public.client_balances AS
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
) payments ON c.id = payments.client_id;

-- Enable RLS on new tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions
CREATE POLICY "Trainers and admins can manage transactions" 
ON public.transactions 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['trainer'::text, 'admin'::text]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['trainer'::text, 'admin'::text]));

-- Create RLS policies for invoices
CREATE POLICY "Trainers and admins can manage invoices" 
ON public.invoices 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['trainer'::text, 'admin'::text]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['trainer'::text, 'admin'::text]));

-- Create RLS policies for expenses
CREATE POLICY "Trainers and admins can manage expenses" 
ON public.expenses 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['trainer'::text, 'admin'::text]))
WITH CHECK (get_current_user_role() = ANY (ARRAY['trainer'::text, 'admin'::text]));

-- Create triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_transactions_client_id ON public.transactions(client_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_category ON public.expenses(category);
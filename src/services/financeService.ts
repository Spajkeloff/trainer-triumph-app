import { supabase } from "@/integrations/supabase/client";

export interface Transaction {
  id: string;
  user_id: string;
  client_id?: string;
  transaction_type: 'charge' | 'payment' | 'refund' | 'discount';
  category: string;
  amount: number;
  description?: string;
  payment_method?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_date: string;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  clients?: {
    first_name: string;
    last_name: string;
  };
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  payment_terms: number;
  description?: string;
  line_items?: any;
  notes?: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
  clients?: {
    first_name: string;
    last_name: string;
  };
}

export interface Expense {
  id: string;
  user_id: string;
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  vendor?: string;
  expense_date: string;
  payment_method?: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  tax_deductible: boolean;
  status: 'pending' | 'completed' | 'reimbursed';
  created_at: string;
  updated_at: string;
}

export interface ClientBalance {
  client_id: string;
  first_name: string;
  last_name: string;
  total_charges: number;
  total_payments: number;
  balance: number;
}

export const financeService = {
  // Transactions
  async getAllTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        clients (first_name, last_name)
      `)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Transaction[];
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Transaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Invoices
  async getAllInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (first_name, last_name)
      `)
      .order('issue_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Invoice[];
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'invoice_number'>): Promise<Invoice> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate invoice number
    const { data: latestInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1);

    const nextNumber = latestInvoice && latestInvoice.length > 0 
      ? parseInt(latestInvoice[0].invoice_number.split('-')[1]) + 1 
      : 1;
    
    const invoice_number = `INV-${String(nextNumber).padStart(4, '0')}`;

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        ...invoice,
        user_id: user.id,
        invoice_number
      })
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  },

  // Expenses
  async getAllExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) throw error;
    return (data || []) as Expense[];
  },

  async createExpense(expense: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Expense> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        ...expense,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Expense;
  },

  // Client Balances
  async getClientBalances(): Promise<ClientBalance[]> {
    const { data, error } = await supabase.rpc('get_client_balances');

    if (error) throw error;
    return (data || []) as ClientBalance[];
  },

  // Financial Statistics
  async getFinancialStats() {
    const [transactions, expenses] = await Promise.all([
      this.getAllTransactions(),
      this.getAllExpenses()
    ]);

    const totalRevenue = transactions
      .filter(t => t.transaction_type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = expenses
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const outstanding = transactions
      .filter(t => t.transaction_type === 'charge' && t.status === 'pending')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      outstanding
    };
  }
};
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
  // Transactions - derived from payments table (source of truth)
  async getAllTransactions(): Promise<Transaction[]> {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        id,
        client_id,
        amount,
        payment_date,
        payment_method,
        status,
        description,
        created_at,
        updated_at,
        clients (first_name, last_name)
      `)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    // Convert payments to transaction format
    const transactions: Transaction[] = (payments || []).map(payment => ({
      id: payment.id,
      user_id: '', // Will be populated by auth context
      client_id: payment.client_id,
      transaction_type: Number(payment.amount) < 0 ? 'charge' : 'payment',
      category: Number(payment.amount) < 0 ? 'package_charge' : 'payment_received',
      amount: Math.abs(Number(payment.amount)),
      description: payment.description || '',
      payment_method: payment.payment_method || '',
      status: payment.status as 'pending' | 'completed' | 'failed' | 'cancelled',
      transaction_date: payment.payment_date,
      reference_id: payment.id,
      reference_type: 'payment',
      notes: '',
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      clients: payment.clients
    }));

    return transactions;
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

  // Client Balances - Single source of truth from payments table
  async getClientBalances(): Promise<ClientBalance[]> {
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name');

    if (clientError) throw clientError;

    const balances: ClientBalance[] = [];

    for (const client of clients || []) {
      // Calculate charges from payments with negative amounts (packages, sessions)
      const { data: charges, error: chargesError } = await supabase
        .from('payments')
        .select('amount')
        .eq('client_id', client.id)
        .lt('amount', 0);

      if (chargesError) throw chargesError;

      // Calculate payments (positive amounts)
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('client_id', client.id)
        .gt('amount', 0)
        .eq('status', 'completed');

      if (paymentsError) throw paymentsError;

      const totalCharges = Math.abs(charges?.reduce((sum, c) => sum + Number(c.amount), 0) || 0);
      const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const balance = totalCharges - totalPayments;

      balances.push({
        client_id: client.id,
        first_name: client.first_name,
        last_name: client.last_name,
        total_charges: totalCharges,
        total_payments: totalPayments,
        balance: balance
      });
    }

    return balances;
  },

  // Financial Statistics based on payments table as source of truth
  async getFinancialStats() {
    const [expenses, clientBalances] = await Promise.all([
      this.getAllExpenses(),
      this.getClientBalances()
    ]);

    // Calculate revenue from completed payments (positive amounts)
    const { data: revenuePayments, error: revenueError } = await supabase
      .from('payments')
      .select('amount')
      .gt('amount', 0)
      .eq('status', 'completed');

    if (revenueError) throw revenueError;

    const totalRevenue = revenuePayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const totalExpenses = expenses
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate outstanding balance from client balances
    const outstanding = clientBalances
      .filter(client => client.balance > 0)
      .reduce((sum, client) => sum + Number(client.balance), 0);

    const netProfit = totalRevenue - totalExpenses;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      outstanding
    };
  }
};
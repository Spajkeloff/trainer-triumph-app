import { supabase } from "@/integrations/supabase/client";

export interface Payment {
  id: string;
  client_id: string;
  session_id?: string;
  client_package_id?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithClient extends Payment {
  clients: {
    first_name: string;
    last_name: string;
  };
}

export interface PaymentData {
  clientId: string;
  amount: number;
  description: string;
  paymentMethod: string;
  paymentDate: string;
}

export const paymentService = {
  async getAll(): Promise<PaymentWithClient[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        clients (first_name, last_name)
      `)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByClient(clientId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(paymentData: PaymentData): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        client_id: paymentData.clientId,
        amount: paymentData.amount,
        description: paymentData.description,
        payment_method: paymentData.paymentMethod,
        payment_date: paymentData.paymentDate,
        status: 'completed'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFinancialStats() {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, status');

    if (error) throw error;

    const totalRevenue = payments
      ?.filter(p => p.amount > 0 && p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const outstanding = payments
      ?.filter(p => p.amount > 0 && p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const totalCharges = payments
      ?.filter(p => p.amount < 0)
      .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0) || 0;

    const totalPaid = payments
      ?.filter(p => p.amount > 0 && p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    return {
      totalRevenue,
      outstanding,
      totalCharges,
      totalPaid,
      netProfit: totalRevenue * 0.7, // Assume 70% profit margin
      totalExpenses: totalRevenue * 0.3 // Assume 30% expenses
    };
  },

  async getClientBalance(clientId: string) {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('amount, status')
      .eq('client_id', clientId);

    if (error) throw error;

    const charges = payments
      ?.filter(p => p.amount < 0)
      .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0) || 0;

    const paid = payments
      ?.filter(p => p.amount > 0 && p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const pending = payments
      ?.filter(p => p.amount > 0 && p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    return {
      totalCharges: charges,
      totalPaid: paid,
      pendingPayments: pending,
      balance: charges - paid,
      outstandingAmount: pending
    };
  }
};
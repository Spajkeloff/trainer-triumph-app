import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  goals?: string;
  medical_notes?: string;
  status: string;
  join_date: string;
  created_at: string;
  updated_at: string;
}

export interface ClientWithDetails extends Client {
  client_packages: Array<{
    id: string;
    sessions_remaining: number;
    expiry_date: string;
    status: string;
    packages: {
      name: string;
      sessions_included: number;
      price: number;
    };
  }>;
  sessions: Array<{
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    notes?: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    payment_date: string;
    description?: string;
    status: string;
    payment_method: string;
  }>;
}

export const clientService = {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('first_name');

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ClientWithDetails | null> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        client_packages (
          id,
          sessions_remaining,
          expiry_date,
          status,
          packages (
            name,
            sessions_included,
            price
          )
        ),
        sessions (
          id,
          date,
          start_time,
          end_time,
          status,
          notes
        ),
        payments (
          id,
          amount,
          payment_date,
          description,
          status,
          payment_method
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'> & { user_id: string }): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStats() {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, status');

    if (error) throw error;

    const stats = {
      total: clients?.length || 0,
      active: clients?.filter(c => c.status === 'active').length || 0,
      leads: clients?.filter(c => c.status === 'lead').length || 0,
      inactive: clients?.filter(c => c.status === 'inactive').length || 0
    };

    return stats;
  }
};
import { supabase } from "@/integrations/supabase/client";

export interface Session {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  client_id: string;
  trainer_id: string;
  type: string;
  location?: string;
  notes?: string;
  price?: number;
  client_package_id?: string;
  status: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface SessionWithClient extends Session {
  clients: {
    first_name: string;
    last_name: string;
  };
}

export const sessionService = {
  async getAll(): Promise<SessionWithClient[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (first_name, last_name)
      `)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByDateRange(startDate: string, endDate: string): Promise<SessionWithClient[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (first_name, last_name)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
      .order('start_time');

    if (error) throw error;
    return data || [];
  },

  async create(sessionData: Omit<Session, 'id' | 'created_at' | 'updated_at'>): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        ...sessionData,
        status: 'scheduled'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string): Promise<Session> {
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*, client_packages!inner(*)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update session status
    const { data, error } = await supabase
      .from('sessions')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Session deduction is now handled in the SessionManagementModal
    // to avoid double deduction and have better control over when to deduct

    return data;
  },

  async update(id: string, updates: Partial<Session>): Promise<Session> {
    const { data, error } = await supabase
      .from('sessions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getStats() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, status, date');

    if (error) throw error;

    const stats = {
      total: sessions?.length || 0,
      upcoming: sessions?.filter(s => s.date >= today && s.status === 'scheduled').length || 0,
      completed: sessions?.filter(s => s.status === 'completed').length || 0,
      cancelled: sessions?.filter(s => s.status === 'cancelled').length || 0
    };

    return stats;
  }
};
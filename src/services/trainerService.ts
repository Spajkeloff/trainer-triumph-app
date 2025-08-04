import { supabase } from "@/integrations/supabase/client";

export interface Trainer {
  id: string;
  user_id: string;
  payroll_type: 'per_session' | 'percentage';
  session_rate: number;
  package_percentage: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined profile data
  profiles?: any;
}

export interface TrainerClient {
  id: string;
  trainer_id: string;
  client_id: string;
  assigned_date: string;
  created_at: string;
}

export interface TrainerEarnings {
  session_count: number;
  total_session_earnings: number;
  total_package_earnings: number;
  total_earnings: number;
}

export const trainerService = {
  async getAll(): Promise<Trainer[]> {
    const { data, error } = await supabase
      .from('trainers')
      .select(`
        *,
        profiles!inner (first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as any[])?.map(item => ({
      ...item,
      payroll_type: item.payroll_type as 'per_session' | 'percentage'
    })) || [];
  },

  async getById(id: string): Promise<Trainer | null> {
    const { data, error } = await supabase
      .from('trainers')
      .select(`
        *,
        profiles!inner (first_name, last_name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data ? {
      ...data,
      payroll_type: data.payroll_type as 'per_session' | 'percentage'
    } : null;
  },

  async create(trainerData: {
    user_id: string;
    payroll_type: 'per_session' | 'percentage';
    session_rate?: number;
    package_percentage?: number;
    created_by: string;
  }): Promise<Trainer> {
    const { data, error } = await supabase
      .from('trainers')
      .insert([{
        ...trainerData,
        session_rate: trainerData.session_rate || 0,
        package_percentage: trainerData.package_percentage || 0,
      }])
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      payroll_type: data.payroll_type as 'per_session' | 'percentage'
    };
  },

  async update(id: string, updates: Partial<Trainer>): Promise<Trainer> {
    const { data, error } = await supabase
      .from('trainers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      payroll_type: data.payroll_type as 'per_session' | 'percentage'
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('trainers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Trainer-Client assignments
  async getTrainerClients(trainerId: string): Promise<TrainerClient[]> {
    const { data, error } = await supabase
      .from('trainer_clients')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('assigned_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async assignClient(trainerId: string, clientId: string): Promise<TrainerClient> {
    const { data, error } = await supabase
      .from('trainer_clients')
      .insert([{
        trainer_id: trainerId,
        client_id: clientId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unassignClient(trainerId: string, clientId: string): Promise<void> {
    const { error } = await supabase
      .from('trainer_clients')
      .delete()
      .eq('trainer_id', trainerId)
      .eq('client_id', clientId);

    if (error) throw error;
  },

  // Earnings
  async getEarnings(trainerUserId: string): Promise<TrainerEarnings> {
    const { data, error } = await supabase.rpc('get_trainer_earnings', {
      trainer_user_id: trainerUserId
    });

    if (error) throw error;
    return data?.[0] || {
      session_count: 0,
      total_session_earnings: 0,
      total_package_earnings: 0,
      total_earnings: 0,
    };
  },
};
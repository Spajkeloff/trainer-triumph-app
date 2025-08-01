import { supabase } from "@/integrations/supabase/client";

export interface ClientSession {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  location?: string;
  status: string;
  notes?: string;
  trainer_id: string;
  clients?: {
    first_name: string;
    last_name: string;
  };
}

export interface ClientPackageInfo {
  id: string;
  sessions_remaining: number;
  total_sessions: number;
  package_name: string;
  expiry_date: string;
  status: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  medical_notes: string | null;
  goals: string | null;
  avatar_url: string | null;
}

export const clientAreaService = {
  // Get sessions for current client
  async getClientSessions(clientId: string): Promise<ClientSession[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (first_name, last_name)
      `)
      .eq('client_id', clientId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get client packages with remaining sessions
  async getClientPackages(clientId: string): Promise<ClientPackageInfo[]> {
    const { data, error } = await supabase
      .from('client_packages')
      .select(`
        *,
        packages (name, sessions_included)
      `)
      .eq('client_id', clientId)
      .eq('status', 'active');

    if (error) throw error;
    
    return (data || []).map(pkg => ({
      id: pkg.id,
      sessions_remaining: pkg.sessions_remaining,
      total_sessions: (pkg.packages as any)?.sessions_included || 0,
      package_name: (pkg.packages as any)?.name || 'Unknown Package',
      expiry_date: pkg.expiry_date,
      status: pkg.status
    }));
  },

  // Get client ID from user ID
  async getClientIdFromUserId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error getting client ID:', error);
      return null;
    }

    return data?.id || null;
  },

  // Update client profile
  async updateClientProfile(userId: string, profileData: Partial<ClientProfile>): Promise<void> {
    // First update the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        address: profileData.address,
        date_of_birth: profileData.date_of_birth,
        emergency_contact: profileData.emergency_contact,
        medical_notes: profileData.medical_notes,
        goals: profileData.goals,
        avatar_url: profileData.avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) throw profileError;

    // Also update the clients table if client record exists
    const clientId = await this.getClientIdFromUserId(userId);
    if (clientId) {
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          address: profileData.address,
          date_of_birth: profileData.date_of_birth,
          emergency_contact: profileData.emergency_contact,
          medical_notes: profileData.medical_notes,
          goals: profileData.goals,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (clientError) throw clientError;
    }
  },

  // Get next upcoming session
  async getNextSession(clientId: string): Promise<ClientSession | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        clients (first_name, last_name)
      `)
      .eq('client_id', clientId)
      .eq('status', 'scheduled')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Get account balance for client
  async getClientBalance(clientId: string): Promise<number> {
    const { data, error } = await supabase
      .rpc('get_client_balances')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      console.error('Error getting client balance:', error);
      return 0;
    }

    return data?.balance || 0;
  }
};

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

  // Get client permissions
  async getClientPermissions(clientId: string): Promise<{ can_book_sessions: boolean; can_cancel_sessions: boolean }> {
    const { data, error } = await supabase
      .from('clients')
      .select('can_book_sessions, can_cancel_sessions')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    return {
      can_book_sessions: data?.can_book_sessions || false,
      can_cancel_sessions: data?.can_cancel_sessions || false
    };
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
  },

  // Book a new session
  async bookSession(bookingData: {
    clientId: string;
    packageId: string;
    date: string;
    time: string;
    duration: number;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get a default trainer ID - in a real app, this would be based on availability
    const { data: trainers } = await supabase
      .from('trainers')
      .select('id')
      .limit(1);

    if (!trainers || trainers.length === 0) {
      throw new Error('No trainers available');
    }

    // Parse time to create start and end times
    const [hours, minutes] = bookingData.time.replace(/[ap]m/i, '').trim().split(':').map(Number);
    const isPM = bookingData.time.toLowerCase().includes('pm');
    const hour24 = isPM && hours !== 12 ? hours + 12 : (!isPM && hours === 12 ? 0 : hours);
    
    const startTime = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const endHour = hour24 + Math.floor(bookingData.duration / 60);
    const endMinutes = minutes + (bookingData.duration % 60);
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    // Create the session
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        client_id: bookingData.clientId,
        trainer_id: trainers[0].id,
        client_package_id: bookingData.packageId,
        date: bookingData.date,
        start_time: startTime,
        end_time: endTime,
        duration: bookingData.duration,
        type: 'personal',
        status: 'scheduled',
        notes: 'Self-booked session'
      });

    if (sessionError) throw sessionError;

    // Update package sessions remaining - get current count first
    const { data: currentPackage } = await supabase
      .from('client_packages')
      .select('sessions_remaining')
      .eq('id', bookingData.packageId)
      .single();

    if (!currentPackage) throw new Error('Package not found');

    const { error: updateError } = await supabase
      .from('client_packages')
      .update({ 
        sessions_remaining: currentPackage.sessions_remaining - 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingData.packageId);

    if (updateError) throw updateError;
  }
};

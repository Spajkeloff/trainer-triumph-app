import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  goals?: string;
  medical_notes?: string;
  medical_conditions?: string;
  injuries?: string;
  medications?: string;
  fitness_goals?: string;
  preferences?: string;
  status: string;
  join_date: string;
  date_of_birth?: string;
  assigned_trainer_id?: string;
  lead_source?: string;
  tags?: string[];
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
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
    type: string;
    location?: string;
    price?: number;
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
  notes: Array<{
    id: string;
    note_type: string;
    title?: string;
    content: string;
    is_private: boolean;
    created_at: string;
  }>;
  documents: Array<{
    id: string;
    document_name: string;
    document_type: string;
    file_url: string;
    created_at: string;
  }>;
  assessments: Array<{
    id: string;
    assessment_date: string;
    weight?: number;
    body_fat_percentage?: number;
    muscle_mass?: number;
    measurements?: any;
    fitness_level?: string;
    assessment_notes?: string;
  }>;
  messages: Array<{
    id: string;
    sender_type: string;
    message: string;
    is_read: boolean;
    created_at: string;
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
          purchase_date,
          status,
          packages (
            name,
            description,
            sessions_included,
            price,
            duration_days
          )
        ),
        sessions (
          id,
          date,
          start_time,
          end_time,
          status,
          type,
          location,
          price,
          notes
        ),
        payments (
          id,
          amount,
          payment_date,
          description,
          status,
          payment_method
        ),
        client_notes!client_notes_client_id_fkey (
          id,
          note_type,
          title,
          content,
          is_private,
          created_at
        ),
        client_documents!client_documents_client_id_fkey (
          id,
          document_name,
          document_type,
          file_url,
          created_at
        ),
        client_assessments!client_assessments_client_id_fkey (
          id,
          assessment_date,
          weight,
          body_fat_percentage,
          muscle_mass,
          measurements,
          fitness_level,
          assessment_notes
        ),
        client_messages!client_messages_client_id_fkey (
          id,
          sender_type,
          message,
          is_read,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Transform the data to match our interface
    const transformedData = data ? {
      ...data,
      notes: data.client_notes || [],
      documents: data.client_documents || [],
      assessments: data.client_assessments || [],
      messages: data.client_messages || []
    } : null;

    return transformedData;
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

  // Client Notes Management
  async addNote(clientId: string, trainerId: string, noteData: {
    note_type?: string;
    title?: string;
    content: string;
    is_private?: boolean;
  }) {
    const { data, error } = await supabase
      .from('client_notes')
      .insert({
        client_id: clientId,
        trainer_id: trainerId,
        ...noteData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateNote(noteId: string, updates: {
    title?: string;
    content?: string;
    is_private?: boolean;
  }) {
    const { data, error } = await supabase
      .from('client_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNote(noteId: string) {
    const { error } = await supabase
      .from('client_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;
  },

  // Client Assessment Management
  async addAssessment(clientId: string, trainerId: string, assessmentData: {
    assessment_date?: string;
    weight?: number;
    body_fat_percentage?: number;
    muscle_mass?: number;
    measurements?: any;
    fitness_level?: string;
    assessment_notes?: string;
  }) {
    const { data, error } = await supabase
      .from('client_assessments')
      .insert({
        client_id: clientId,
        trainer_id: trainerId,
        ...assessmentData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAssessment(assessmentId: string, updates: any) {
    const { data, error } = await supabase
      .from('client_assessments')
      .update(updates)
      .eq('id', assessmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Client Messages
  async sendMessage(clientId: string, senderId: string, senderType: 'trainer' | 'client', message: string) {
    const { data, error } = await supabase
      .from('client_messages')
      .insert({
        client_id: clientId,
        sender_id: senderId,
        sender_type: senderType,
        message
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markMessageAsRead(messageId: string) {
    const { error } = await supabase
      .from('client_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) throw error;
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
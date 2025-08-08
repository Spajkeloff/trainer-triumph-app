import { supabase } from "@/integrations/supabase/client";

export type PayrollType = 'per_session' | 'percentage';

export interface StaffListItem {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_trainer: boolean;
  is_active: boolean;
}

export interface CreateStaffPayload {
  email: string;
  sendActivationEmail: boolean;
  customPassword?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string; // ISO date
  startDate?: string;   // ISO date
  notes?: string;
  address?: string;
  loginAccess: boolean;
  isTrainer: boolean;
  payrollType?: PayrollType;
  sessionRate?: number;
  packagePercentage?: number;
  permissions: Record<string, boolean>;
}

export const staffService = {
  async getAll(activeOnly = true): Promise<StaffListItem[]> {
    const query = supabase
      .from('staff_members')
      .select(`
        is_trainer, is_active, user_id,
        profiles:profiles!inner(first_name,last_name,avatar_url,user_id),
        trainers(user_id)
      `);

    if (activeOnly) query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
      user_id: row.user_id,
      first_name: row.profiles?.first_name ?? null,
      last_name: row.profiles?.last_name ?? null,
      avatar_url: row.profiles?.avatar_url ?? null,
      is_trainer: !!row.is_trainer,
      is_active: !!row.is_active,
    }));
  },

  async createStaff(payload: CreateStaffPayload) {
    const { data, error } = await supabase.functions.invoke('create-staff', {
      body: payload,
    });
    if (error) throw error;
    return data;
  }
};

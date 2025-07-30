import { supabase } from '@/integrations/supabase/client';

export interface ClientAreaSettings {
  id?: string;
  user_id?: string;
  
  // Basic Client Area Settings
  enabled: boolean;
  client_area_name: string;
  custom_website_enabled: boolean;
  custom_website_url?: string;
  
  // Available Features
  allow_session_bookings: boolean;
  allow_class_bookings: boolean;
  allow_store_purchases: boolean;
  
  // Client Homepage Area
  hide_session_bookings_button: boolean;
  hide_class_bookings_button: boolean;
  hide_store_button: boolean;
  
  // Client Logged In Area
  hide_my_bookings: boolean;
  hide_class_booking: boolean;
  hide_session_booking: boolean;
  hide_workout: boolean;
  hide_nutrition: boolean;
  hide_assessments: boolean;
  hide_finances: boolean;
  hide_charges_payments: boolean;
  hide_packages_memberships: boolean;
  hide_shared_items: boolean;
  hide_store: boolean;
  
  // Sign Up and Login Settings
  signup_redirect_page: string;
  login_redirect_page: string;
  disallow_new_signups: boolean;
  allow_inactive_reactivation: boolean;
  
  // Sessions Settings
  sessions_approval_required: boolean;
  sessions_use_templates: boolean;
  sessions_override_default_cost: boolean;
  sessions_allow_occupied_slots: boolean;
  sessions_hide_price: boolean;
  sessions_timeslot_increment: number;
  sessions_booking_restriction_hours: number;
  
  // Classes Settings
  classes_immediate_signup: boolean;
  classes_show_spaces_left: boolean;
  classes_disable_waiting_list: boolean;
  classes_require_credits_for_waitlist: boolean;
  classes_allow_multiple_same_time: boolean;
  classes_hide_price: boolean;
  classes_booking_restriction_hours: number;
  classes_max_bookings_per_day: number;
  
  // Other Settings
  hide_store_for_leads: boolean;
  disallow_custom_payments: boolean;
  allow_client_assessments: boolean;
  mobile_app_prompt: boolean;
  disallow_family_members: boolean;
  restrict_profile_updates: boolean;
  restrict_personal_info_updates: boolean;
  restrict_payment_method_updates: boolean;
  
  // Store Settings
  store_order_packages: number;
  store_order_memberships: number;
  store_order_products: number;
  custom_text?: string;
  
  created_at?: string;
  updated_at?: string;
}

export const clientAreaService = {
  async getSettings(): Promise<ClientAreaSettings | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('client_area_settings')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  },

  async createOrUpdateSettings(settings: Partial<ClientAreaSettings>): Promise<ClientAreaSettings> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Check if settings exist
    const existing = await this.getSettings();

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('client_area_settings')
        .update({
          ...settings,
          user_id: user.user.id,
        })
        .eq('user_id', user.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('client_area_settings')
        .insert({
          ...settings,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async getDefaultSettings(): Promise<ClientAreaSettings> {
    return {
      enabled: true,
      client_area_name: 'trainwithus',
      custom_website_enabled: false,
      custom_website_url: '',
      
      allow_session_bookings: false,
      allow_class_bookings: false,
      allow_store_purchases: false,
      
      hide_session_bookings_button: false,
      hide_class_bookings_button: false,
      hide_store_button: false,
      
      hide_my_bookings: true,
      hide_class_booking: true,
      hide_session_booking: true,
      hide_workout: false,
      hide_nutrition: false,
      hide_assessments: false,
      hide_finances: false,
      hide_charges_payments: false,
      hide_packages_memberships: false,
      hide_shared_items: false,
      hide_store: true,
      
      signup_redirect_page: 'bookings',
      login_redirect_page: 'finances',
      disallow_new_signups: false,
      allow_inactive_reactivation: false,
      
      sessions_approval_required: false,
      sessions_use_templates: false,
      sessions_override_default_cost: false,
      sessions_allow_occupied_slots: false,
      sessions_hide_price: false,
      sessions_timeslot_increment: 30,
      sessions_booking_restriction_hours: 1,
      
      classes_immediate_signup: true,
      classes_show_spaces_left: false,
      classes_disable_waiting_list: false,
      classes_require_credits_for_waitlist: false,
      classes_allow_multiple_same_time: false,
      classes_hide_price: false,
      classes_booking_restriction_hours: 1,
      classes_max_bookings_per_day: 1,
      
      hide_store_for_leads: false,
      disallow_custom_payments: false,
      allow_client_assessments: false,
      mobile_app_prompt: false,
      disallow_family_members: false,
      restrict_profile_updates: false,
      restrict_personal_info_updates: false,
      restrict_payment_method_updates: false,
      
      store_order_packages: 1,
      store_order_memberships: 2,
      store_order_products: 3,
      custom_text: '',
    };
  }
};

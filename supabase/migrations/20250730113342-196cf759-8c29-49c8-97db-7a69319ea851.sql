-- Create client area settings table
CREATE TABLE public.client_area_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Client Area Settings
  enabled BOOLEAN NOT NULL DEFAULT true,
  client_area_name TEXT DEFAULT 'trainwithus',
  custom_website_enabled BOOLEAN DEFAULT false,
  custom_website_url TEXT,
  
  -- Available Features
  allow_session_bookings BOOLEAN DEFAULT false,
  allow_class_bookings BOOLEAN DEFAULT false,
  allow_store_purchases BOOLEAN DEFAULT false,
  
  -- Client Homepage Area
  hide_session_bookings_button BOOLEAN DEFAULT false,
  hide_class_bookings_button BOOLEAN DEFAULT false,
  hide_store_button BOOLEAN DEFAULT false,
  
  -- Client Logged In Area
  hide_my_bookings BOOLEAN DEFAULT true,
  hide_class_booking BOOLEAN DEFAULT true,
  hide_session_booking BOOLEAN DEFAULT true,
  hide_workout BOOLEAN DEFAULT false,
  hide_nutrition BOOLEAN DEFAULT false,
  hide_assessments BOOLEAN DEFAULT false,
  hide_finances BOOLEAN DEFAULT false,
  hide_charges_payments BOOLEAN DEFAULT false,
  hide_packages_memberships BOOLEAN DEFAULT false,
  hide_shared_items BOOLEAN DEFAULT false,
  hide_store BOOLEAN DEFAULT true,
  
  -- Sign Up and Login Settings
  signup_redirect_page TEXT DEFAULT 'bookings',
  login_redirect_page TEXT DEFAULT 'finances',
  disallow_new_signups BOOLEAN DEFAULT false,
  allow_inactive_reactivation BOOLEAN DEFAULT false,
  
  -- Sessions Settings
  sessions_approval_required BOOLEAN DEFAULT false,
  sessions_use_templates BOOLEAN DEFAULT false,
  sessions_override_default_cost BOOLEAN DEFAULT false,
  sessions_allow_occupied_slots BOOLEAN DEFAULT false,
  sessions_hide_price BOOLEAN DEFAULT false,
  sessions_timeslot_increment INTEGER DEFAULT 30,
  sessions_booking_restriction_hours INTEGER DEFAULT 1,
  
  -- Classes Settings
  classes_immediate_signup BOOLEAN DEFAULT true,
  classes_show_spaces_left BOOLEAN DEFAULT false,
  classes_disable_waiting_list BOOLEAN DEFAULT false,
  classes_require_credits_for_waitlist BOOLEAN DEFAULT false,
  classes_allow_multiple_same_time BOOLEAN DEFAULT false,
  classes_hide_price BOOLEAN DEFAULT false,
  classes_booking_restriction_hours INTEGER DEFAULT 1,
  classes_max_bookings_per_day INTEGER DEFAULT 1,
  
  -- Other Settings
  hide_store_for_leads BOOLEAN DEFAULT false,
  disallow_custom_payments BOOLEAN DEFAULT false,
  allow_client_assessments BOOLEAN DEFAULT false,
  mobile_app_prompt BOOLEAN DEFAULT false,
  disallow_family_members BOOLEAN DEFAULT false,
  restrict_profile_updates BOOLEAN DEFAULT false,
  restrict_personal_info_updates BOOLEAN DEFAULT false,
  restrict_payment_method_updates BOOLEAN DEFAULT false,
  
  -- Store Settings
  store_order_packages INTEGER DEFAULT 1,
  store_order_memberships INTEGER DEFAULT 2,
  store_order_products INTEGER DEFAULT 3,
  custom_text TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_area_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own client area settings" 
ON public.client_area_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own client area settings" 
ON public.client_area_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own client area settings" 
ON public.client_area_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_area_settings_updated_at
BEFORE UPDATE ON public.client_area_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
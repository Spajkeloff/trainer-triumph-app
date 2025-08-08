export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      client_area_settings: {
        Row: {
          allow_class_bookings: boolean | null
          allow_client_assessments: boolean | null
          allow_inactive_reactivation: boolean | null
          allow_session_bookings: boolean | null
          allow_store_purchases: boolean | null
          classes_allow_multiple_same_time: boolean | null
          classes_booking_restriction_hours: number | null
          classes_disable_waiting_list: boolean | null
          classes_hide_price: boolean | null
          classes_immediate_signup: boolean | null
          classes_max_bookings_per_day: number | null
          classes_require_credits_for_waitlist: boolean | null
          classes_show_spaces_left: boolean | null
          client_area_name: string | null
          created_at: string
          custom_text: string | null
          custom_website_enabled: boolean | null
          custom_website_url: string | null
          disallow_custom_payments: boolean | null
          disallow_family_members: boolean | null
          disallow_new_signups: boolean | null
          enabled: boolean
          hide_assessments: boolean | null
          hide_charges_payments: boolean | null
          hide_class_booking: boolean | null
          hide_class_bookings_button: boolean | null
          hide_finances: boolean | null
          hide_my_bookings: boolean | null
          hide_nutrition: boolean | null
          hide_packages_memberships: boolean | null
          hide_session_booking: boolean | null
          hide_session_bookings_button: boolean | null
          hide_shared_items: boolean | null
          hide_store: boolean | null
          hide_store_button: boolean | null
          hide_store_for_leads: boolean | null
          hide_workout: boolean | null
          id: string
          login_redirect_page: string | null
          mobile_app_prompt: boolean | null
          restrict_payment_method_updates: boolean | null
          restrict_personal_info_updates: boolean | null
          restrict_profile_updates: boolean | null
          sessions_allow_occupied_slots: boolean | null
          sessions_approval_required: boolean | null
          sessions_booking_restriction_hours: number | null
          sessions_hide_price: boolean | null
          sessions_override_default_cost: boolean | null
          sessions_timeslot_increment: number | null
          sessions_use_templates: boolean | null
          signup_redirect_page: string | null
          store_order_memberships: number | null
          store_order_packages: number | null
          store_order_products: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_class_bookings?: boolean | null
          allow_client_assessments?: boolean | null
          allow_inactive_reactivation?: boolean | null
          allow_session_bookings?: boolean | null
          allow_store_purchases?: boolean | null
          classes_allow_multiple_same_time?: boolean | null
          classes_booking_restriction_hours?: number | null
          classes_disable_waiting_list?: boolean | null
          classes_hide_price?: boolean | null
          classes_immediate_signup?: boolean | null
          classes_max_bookings_per_day?: number | null
          classes_require_credits_for_waitlist?: boolean | null
          classes_show_spaces_left?: boolean | null
          client_area_name?: string | null
          created_at?: string
          custom_text?: string | null
          custom_website_enabled?: boolean | null
          custom_website_url?: string | null
          disallow_custom_payments?: boolean | null
          disallow_family_members?: boolean | null
          disallow_new_signups?: boolean | null
          enabled?: boolean
          hide_assessments?: boolean | null
          hide_charges_payments?: boolean | null
          hide_class_booking?: boolean | null
          hide_class_bookings_button?: boolean | null
          hide_finances?: boolean | null
          hide_my_bookings?: boolean | null
          hide_nutrition?: boolean | null
          hide_packages_memberships?: boolean | null
          hide_session_booking?: boolean | null
          hide_session_bookings_button?: boolean | null
          hide_shared_items?: boolean | null
          hide_store?: boolean | null
          hide_store_button?: boolean | null
          hide_store_for_leads?: boolean | null
          hide_workout?: boolean | null
          id?: string
          login_redirect_page?: string | null
          mobile_app_prompt?: boolean | null
          restrict_payment_method_updates?: boolean | null
          restrict_personal_info_updates?: boolean | null
          restrict_profile_updates?: boolean | null
          sessions_allow_occupied_slots?: boolean | null
          sessions_approval_required?: boolean | null
          sessions_booking_restriction_hours?: number | null
          sessions_hide_price?: boolean | null
          sessions_override_default_cost?: boolean | null
          sessions_timeslot_increment?: number | null
          sessions_use_templates?: boolean | null
          signup_redirect_page?: string | null
          store_order_memberships?: number | null
          store_order_packages?: number | null
          store_order_products?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_class_bookings?: boolean | null
          allow_client_assessments?: boolean | null
          allow_inactive_reactivation?: boolean | null
          allow_session_bookings?: boolean | null
          allow_store_purchases?: boolean | null
          classes_allow_multiple_same_time?: boolean | null
          classes_booking_restriction_hours?: number | null
          classes_disable_waiting_list?: boolean | null
          classes_hide_price?: boolean | null
          classes_immediate_signup?: boolean | null
          classes_max_bookings_per_day?: number | null
          classes_require_credits_for_waitlist?: boolean | null
          classes_show_spaces_left?: boolean | null
          client_area_name?: string | null
          created_at?: string
          custom_text?: string | null
          custom_website_enabled?: boolean | null
          custom_website_url?: string | null
          disallow_custom_payments?: boolean | null
          disallow_family_members?: boolean | null
          disallow_new_signups?: boolean | null
          enabled?: boolean
          hide_assessments?: boolean | null
          hide_charges_payments?: boolean | null
          hide_class_booking?: boolean | null
          hide_class_bookings_button?: boolean | null
          hide_finances?: boolean | null
          hide_my_bookings?: boolean | null
          hide_nutrition?: boolean | null
          hide_packages_memberships?: boolean | null
          hide_session_booking?: boolean | null
          hide_session_bookings_button?: boolean | null
          hide_shared_items?: boolean | null
          hide_store?: boolean | null
          hide_store_button?: boolean | null
          hide_store_for_leads?: boolean | null
          hide_workout?: boolean | null
          id?: string
          login_redirect_page?: string | null
          mobile_app_prompt?: boolean | null
          restrict_payment_method_updates?: boolean | null
          restrict_personal_info_updates?: boolean | null
          restrict_profile_updates?: boolean | null
          sessions_allow_occupied_slots?: boolean | null
          sessions_approval_required?: boolean | null
          sessions_booking_restriction_hours?: number | null
          sessions_hide_price?: boolean | null
          sessions_override_default_cost?: boolean | null
          sessions_timeslot_increment?: number | null
          sessions_use_templates?: boolean | null
          signup_redirect_page?: string | null
          store_order_memberships?: number | null
          store_order_packages?: number | null
          store_order_products?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_assessments: {
        Row: {
          assessment_date: string | null
          assessment_notes: string | null
          body_fat_percentage: number | null
          client_id: string | null
          created_at: string | null
          fitness_level: string | null
          id: string
          measurements: Json | null
          muscle_mass: number | null
          trainer_id: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          assessment_date?: string | null
          assessment_notes?: string | null
          body_fat_percentage?: number | null
          client_id?: string | null
          created_at?: string | null
          fitness_level?: string | null
          id?: string
          measurements?: Json | null
          muscle_mass?: number | null
          trainer_id: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          assessment_date?: string | null
          assessment_notes?: string | null
          body_fat_percentage?: number | null
          client_id?: string | null
          created_at?: string | null
          fitness_level?: string | null
          id?: string
          measurements?: Json | null
          muscle_mass?: number | null
          trainer_id?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string | null
          created_at: string | null
          document_name: string
          document_type: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          trainer_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          document_name: string
          document_type: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          trainer_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          document_name?: string
          document_type?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string | null
          content: string
          created_at: string | null
          id: string
          is_private: boolean | null
          note_type: string
          title: string | null
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note_type?: string
          title?: string | null
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note_type?: string
          title?: string | null
          trainer_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_packages: {
        Row: {
          client_id: string
          created_at: string
          expiry_date: string
          id: string
          package_id: string
          purchase_date: string
          sessions_remaining: number
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          expiry_date: string
          id?: string
          package_id: string
          purchase_date?: string
          sessions_remaining: number
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          expiry_date?: string
          id?: string
          package_id?: string
          purchase_date?: string
          sessions_remaining?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          assigned_trainer_id: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          fitness_goals: string | null
          goals: string | null
          id: string
          injuries: string | null
          join_date: string
          last_name: string
          lead_source: string | null
          medical_conditions: string | null
          medical_notes: string | null
          medications: string | null
          phone: string | null
          preferences: string | null
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          assigned_trainer_id?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          fitness_goals?: string | null
          goals?: string | null
          id?: string
          injuries?: string | null
          join_date?: string
          last_name: string
          lead_source?: string | null
          medical_conditions?: string | null
          medical_notes?: string | null
          medications?: string | null
          phone?: string | null
          preferences?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          assigned_trainer_id?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          fitness_goals?: string | null
          goals?: string | null
          id?: string
          injuries?: string | null
          join_date?: string
          last_name?: string
          lead_source?: string | null
          medical_conditions?: string | null
          medical_notes?: string | null
          medications?: string | null
          phone?: string | null
          preferences?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          is_recurring: boolean | null
          payment_method: string | null
          receipt_url: string | null
          recurring_frequency: string | null
          status: string
          subcategory: string | null
          tax_deductible: boolean | null
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          status?: string
          subcategory?: string | null
          tax_deductible?: boolean | null
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          receipt_url?: string | null
          recurring_frequency?: string | null
          status?: string
          subcategory?: string | null
          tax_deductible?: boolean | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {}
        Insert: {}
        Update: {}
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          line_items: Json | null
          notes: string | null
          paid_date: string | null
          payment_terms: number | null
          status: string
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          line_items?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_terms?: number | null
          status?: string
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          line_items?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_terms?: number | null
          status?: string
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          name: string
          price: number
          sessions_included: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          id?: string
          name: string
          price: number
          sessions_included: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          name?: string
          price?: number
          sessions_included?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          client_package_id: string | null
          created_at: string
          description: string | null
          id: string
          payment_date: string
          payment_method: string
          session_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          client_package_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          payment_method: string
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          client_package_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          payment_date?: string
          payment_method?: string
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact: string | null
          first_name: string | null
          goals: string | null
          id: string
          last_name: string | null
          medical_notes: string | null
          phone: string | null
          preferences: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          goals?: string | null
          id?: string
          last_name?: string | null
          medical_notes?: string | null
          phone?: string | null
          preferences?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          first_name?: string | null
          goals?: string | null
          id?: string
          last_name?: string | null
          medical_notes?: string | null
          phone?: string | null
          preferences?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          client_id: string
          client_package_id: string | null
          created_at: string
          date: string
          duration: number
          end_time: string
          id: string
          location: string | null
          notes: string | null
          price: number | null
          start_time: string
          status: string
          trainer_id: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          client_package_id?: string | null
          created_at?: string
          date: string
          duration: number
          end_time: string
          id?: string
          location?: string | null
          notes?: string | null
          price?: number | null
          start_time: string
          status?: string
          trainer_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          client_package_id?: string | null
          created_at?: string
          date?: string
          duration?: number
          end_time?: string
          id?: string
          location?: string | null
          notes?: string | null
          price?: number | null
          start_time?: string
          status?: string
          trainer_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_clients: {
        Row: {
          assigned_date: string
          client_id: string
          created_at: string
          id: string
          trainer_id: string
        }
        Insert: {
          assigned_date?: string
          client_id: string
          created_at?: string
          id?: string
          trainer_id: string
        }
        Update: {
          assigned_date?: string
          client_id?: string
          created_at?: string
          id?: string
          trainer_id?: string
        }
        Relationships: []
      }
      trainers: {
        Row: {
          created_at: string
          created_by: string
          id: string
          package_percentage: number | null
          payroll_type: string
          session_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          package_percentage?: number | null
          payroll_type: string
          session_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          package_percentage?: number | null
          payroll_type?: string
          session_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_trainers_user_profile"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          client_id: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_date: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_date?: string
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          client_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_client_balances: {
        Args: Record<PropertyKey, never>
        Returns: {
          client_id: string
          first_name: string
          last_name: string
          total_charges: number
          total_payments: number
          balance: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_trainer_earnings: {
        Args: { trainer_user_id: string }
        Returns: {
          session_count: number
          total_session_earnings: number
          total_package_earnings: number
          total_earnings: number
        }[]
      }
      validate_user_profile_sync: {
        Args: Record<PropertyKey, never>
        Returns: {
          issue_type: string
          user_id: string
          details: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

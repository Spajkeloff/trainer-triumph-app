-- Create staff_members table
CREATE TABLE IF NOT EXISTS public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  login_access boolean NOT NULL DEFAULT true,
  is_trainer boolean NOT NULL DEFAULT false,
  start_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Policies for staff_members
DROP POLICY IF EXISTS "Admins can manage staff members" ON public.staff_members;
CREATE POLICY "Admins can manage staff members"
ON public.staff_members
AS RESTRICTIVE
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Users can view their own staff member" ON public.staff_members;
CREATE POLICY "Users can view their own staff member"
ON public.staff_members
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_staff_members_updated_at ON public.staff_members;
CREATE TRIGGER trg_staff_members_updated_at
BEFORE UPDATE ON public.staff_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create staff_permissions table
CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  -- Bookings
  bookings_view_own boolean DEFAULT true,
  bookings_create_edit_own boolean DEFAULT false,
  bookings_reconcile_own boolean DEFAULT false,
  bookings_view_all boolean DEFAULT false,
  bookings_create_edit_all boolean DEFAULT false,
  bookings_reconcile_all boolean DEFAULT false,
  hide_booking_prices boolean DEFAULT false,
  prevent_edit_past_reconciled boolean DEFAULT true,
  -- Clients
  clients_view boolean DEFAULT true,
  clients_show_financial_info boolean DEFAULT false,
  clients_hide_payment_integration boolean DEFAULT false,
  clients_hide_services boolean DEFAULT false,
  clients_assign_services boolean DEFAULT false,
  clients_only_show_assigned boolean DEFAULT true,
  prevent_changing_client_status boolean DEFAULT true,
  -- Other
  make_payment_access boolean DEFAULT false,
  only_data_for_assigned_clients boolean DEFAULT true,
  show_messages_sent_to_others boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

-- Policies for staff_permissions
DROP POLICY IF EXISTS "Admins can manage staff permissions" ON public.staff_permissions;
CREATE POLICY "Admins can manage staff permissions"
ON public.staff_permissions
AS RESTRICTIVE
FOR ALL
USING (public.get_current_user_role() = 'admin')
WITH CHECK (public.get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "Users can view their own permissions" ON public.staff_permissions;
CREATE POLICY "Users can view their own permissions"
ON public.staff_permissions
AS RESTRICTIVE
FOR SELECT
USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_staff_permissions_updated_at ON public.staff_permissions;
CREATE TRIGGER trg_staff_permissions_updated_at
BEFORE UPDATE ON public.staff_permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Permission checker function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (
      SELECT CASE _perm
        WHEN 'bookings_view_own' THEN sp.bookings_view_own
        WHEN 'bookings_create_edit_own' THEN sp.bookings_create_edit_own
        WHEN 'bookings_reconcile_own' THEN sp.bookings_reconcile_own
        WHEN 'bookings_view_all' THEN sp.bookings_view_all
        WHEN 'bookings_create_edit_all' THEN sp.bookings_create_edit_all
        WHEN 'bookings_reconcile_all' THEN sp.bookings_reconcile_all
        WHEN 'hide_booking_prices' THEN sp.hide_booking_prices
        WHEN 'prevent_edit_past_reconciled' THEN sp.prevent_edit_past_reconciled
        WHEN 'clients_view' THEN sp.clients_view
        WHEN 'clients_show_financial_info' THEN sp.clients_show_financial_info
        WHEN 'clients_hide_payment_integration' THEN sp.clients_hide_payment_integration
        WHEN 'clients_hide_services' THEN sp.clients_hide_services
        WHEN 'clients_assign_services' THEN sp.clients_assign_services
        WHEN 'clients_only_show_assigned' THEN sp.clients_only_show_assigned
        WHEN 'prevent_changing_client_status' THEN sp.prevent_changing_client_status
        WHEN 'make_payment_access' THEN sp.make_payment_access
        WHEN 'only_data_for_assigned_clients' THEN sp.only_data_for_assigned_clients
        WHEN 'show_messages_sent_to_others' THEN sp.show_messages_sent_to_others
        ELSE false
      END
      FROM public.staff_permissions sp
      WHERE sp.user_id = _user_id
    ), false
  );
$$;

-- Payments: require permission for trainers (restrictive gate)
DROP POLICY IF EXISTS "Trainer payments permission gate" ON public.payments;
CREATE POLICY "Trainer payments permission gate"
ON public.payments
AS RESTRICTIVE
FOR ALL
USING (
  public.get_current_user_role() = 'admin'
  OR (
    public.get_current_user_role() = 'trainer'
    AND public.has_permission(auth.uid(), 'make_payment_access')
  )
)
WITH CHECK (
  public.get_current_user_role() = 'admin'
  OR (
    public.get_current_user_role() = 'trainer'
    AND public.has_permission(auth.uid(), 'make_payment_access')
  )
);

-- Sessions: replace trainer policy to honor view/manage all permissions
DROP POLICY IF EXISTS "Trainers can manage their own sessions" ON public.sessions;

-- Trainers can select sessions they own or if they have view_all
DROP POLICY IF EXISTS "Trainers can view sessions per permissions" ON public.sessions;
CREATE POLICY "Trainers can view sessions per permissions"
ON public.sessions
AS RESTRICTIVE
FOR SELECT
USING (
  public.get_current_user_role() = 'admin'
  OR (
    public.get_current_user_role() = 'trainer'
    AND (
      public.has_permission(auth.uid(),'bookings_view_all')
      OR (trainer_id IN (SELECT t.id FROM public.trainers t WHERE t.user_id = auth.uid()))
    )
  )
);

-- Trainers can manage sessions they own or if they have create/edit all
DROP POLICY IF EXISTS "Trainers can manage sessions per permissions" ON public.sessions;
CREATE POLICY "Trainers can manage sessions per permissions"
ON public.sessions
AS RESTRICTIVE
FOR ALL
USING (
  public.get_current_user_role() = 'admin'
  OR (
    public.get_current_user_role() = 'trainer'
    AND (
      public.has_permission(auth.uid(),'bookings_create_edit_all')
      OR (trainer_id IN (SELECT t.id FROM public.trainers t WHERE t.user_id = auth.uid()))
    )
  )
)
WITH CHECK (
  public.get_current_user_role() = 'admin'
  OR (
    public.get_current_user_role() = 'trainer'
    AND (
      public.has_permission(auth.uid(),'bookings_create_edit_all')
      OR (trainer_id IN (SELECT t.id FROM public.trainers t WHERE t.user_id = auth.uid()))
    )
  )
);

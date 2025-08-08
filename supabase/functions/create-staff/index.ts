import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader?.replace('Bearer ', '') ?? '';

    // Verify requester and must be admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can create staff' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();

    const {
      email,
      sendActivationEmail = true,
      customPassword,
      firstName,
      lastName,
      phone,
      dateOfBirth,
      startDate,
      notes,
      address,
      loginAccess = true,
      isTrainer = false,
      payrollType,
      sessionRate = 0,
      packagePercentage = 0,
      // Permissions
      permissions = {},
    } = body;

    // Create or invite user
    let newUserId: string | null = null;

    if (sendActivationEmail && !customPassword) {
      const { data: invite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { first_name: firstName, last_name: lastName },
      });
      if (inviteError || !invite?.user) {
        return new Response(JSON.stringify({ error: inviteError?.message || 'Failed to invite user' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      newUserId = invite.user.id;
    } else {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: customPassword || crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName }
      });
      if (createError || !created?.user) {
        return new Response(JSON.stringify({ error: createError?.message || 'Failed to create user' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      newUserId = created.user.id;
    }

    // Ensure profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([
        {
          user_id: newUserId!,
          first_name: firstName,
          last_name: lastName,
          phone,
          date_of_birth: dateOfBirth || null,
          address: address || null,
          role: 'trainer', // keep granular control via permissions; trainer role works with RLS
        },
      ], { onConflict: 'user_id' });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId!);
      return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create staff_members row
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff_members')
      .upsert([
        {
          user_id: newUserId!,
          is_active: true,
          login_access: loginAccess,
          is_trainer: isTrainer,
          start_date: startDate || null,
          notes: notes || null,
        },
      ], { onConflict: 'user_id' })
      .select()
      .single();

    if (staffError) {
      await supabaseAdmin.from('profiles').delete().eq('user_id', newUserId!);
      await supabaseAdmin.auth.admin.deleteUser(newUserId!);
      return new Response(JSON.stringify({ error: staffError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create permissions row with sensible defaults merged
    const defaultPerms = {
      bookings_view_own: true,
      bookings_create_edit_own: false,
      bookings_reconcile_own: false,
      bookings_view_all: false,
      bookings_create_edit_all: false,
      bookings_reconcile_all: false,
      hide_booking_prices: false,
      prevent_edit_past_reconciled: true,
      clients_view: true,
      clients_show_financial_info: false,
      clients_hide_payment_integration: false,
      clients_hide_services: false,
      clients_assign_services: false,
      clients_only_show_assigned: true,
      prevent_changing_client_status: true,
      make_payment_access: false,
      only_data_for_assigned_clients: true,
      show_messages_sent_to_others: false,
    } as Record<string, boolean>;

    const mergedPerms = { ...defaultPerms, ...(permissions || {}) };

    const { error: permsError } = await supabaseAdmin
      .from('staff_permissions')
      .upsert([
        { user_id: newUserId!, ...mergedPerms },
      ], { onConflict: 'user_id' });

    if (permsError) {
      await supabaseAdmin.from('staff_members').delete().eq('user_id', newUserId!);
      await supabaseAdmin.from('profiles').delete().eq('user_id', newUserId!);
      await supabaseAdmin.auth.admin.deleteUser(newUserId!);
      return new Response(JSON.stringify({ error: permsError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // If trainer, create trainers row and set payroll
    if (isTrainer) {
      const { error: trainerError } = await supabaseAdmin
        .from('trainers')
        .upsert([
          {
            user_id: newUserId!,
            payroll_type: payrollType,
            session_rate: payrollType === 'per_session' ? sessionRate || 0 : 0,
            package_percentage: payrollType === 'percentage' ? packagePercentage || 0 : 0,
            created_by: user.id,
          },
        ], { onConflict: 'user_id' });

      if (trainerError) {
        await supabaseAdmin.from('staff_permissions').delete().eq('user_id', newUserId!);
        await supabaseAdmin.from('staff_members').delete().eq('user_id', newUserId!);
        await supabaseAdmin.from('profiles').delete().eq('user_id', newUserId!);
        await supabaseAdmin.auth.admin.deleteUser(newUserId!);
        return new Response(JSON.stringify({ error: trainerError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: newUserId, staff }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

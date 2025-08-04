import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClientPackageData {
  id: string;
  client_id: string;
  sessions_remaining: number;
  expiry_date: string;
  status: string;
  packages: {
    name: string;
    sessions_included: number;
  };
  clients: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured. Please contact administrator." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    // Check for packages expiring in 2 weeks
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    // Get packages expiring in 2 weeks
    const { data: expiringPackages, error: expiringError } = await supabase
      .from("client_packages")
      .select(`
        id,
        client_id,
        sessions_remaining,
        expiry_date,
        status,
        packages (
          name,
          sessions_included
        ),
        clients (
          first_name,
          last_name,
          email
        )
      `)
      .eq("status", "active")
      .lte("expiry_date", twoWeeksFromNow.toISOString().split('T')[0])
      .gt("expiry_date", new Date().toISOString().split('T')[0]); // Not expired yet

    if (expiringError) throw expiringError;

    // Get packages with 3 or fewer sessions remaining
    const { data: lowSessionPackages, error: lowSessionError } = await supabase
      .from("client_packages")
      .select(`
        id,
        client_id,
        sessions_remaining,
        expiry_date,
        status,
        packages (
          name,
          sessions_included
        ),
        clients (
          first_name,
          last_name,
          email
        )
      `)
      .eq("status", "active")
      .lte("sessions_remaining", 3)
      .gt("sessions_remaining", 0);

    if (lowSessionError) throw lowSessionError;

    const notifications = [];

    // Process expiring packages
    for (const pkg of (expiringPackages as ClientPackageData[]) || []) {
      const daysUntilExpiry = Math.ceil(
        (new Date(pkg.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send email to client
      try {
        await resend.emails.send({
          from: "TrainWithUs <notifications@trainwithus.ae>",
          to: [pkg.clients.email],
          subject: `Your ${pkg.packages.name} package expires in ${daysUntilExpiry} days`,
          html: `
            <h2>Package Expiry Reminder</h2>
            <p>Hi ${pkg.clients.first_name},</p>
            <p>Your <strong>${pkg.packages.name}</strong> package will expire in <strong>${daysUntilExpiry} days</strong> on ${new Date(pkg.expiry_date).toLocaleDateString()}.</p>
            <p>You currently have <strong>${pkg.sessions_remaining}</strong> sessions remaining.</p>
            <p>Please contact us to renew your package or book your remaining sessions.</p>
            <p>Best regards,<br>TrainWithUs Team</p>
          `,
        });

        notifications.push({
          type: "expiry_reminder",
          client_id: pkg.client_id,
          package_name: pkg.packages.name,
          days_until_expiry: daysUntilExpiry,
          sessions_remaining: pkg.sessions_remaining
        });
      } catch (emailError) {
        console.error("Failed to send expiry email:", emailError);
      }
    }

    // Process low session packages
    for (const pkg of (lowSessionPackages as ClientPackageData[]) || []) {
      // Send email to client
      try {
        await resend.emails.send({
          from: "TrainWithUs <notifications@trainwithus.ae>",
          to: [pkg.clients.email],
          subject: `Only ${pkg.sessions_remaining} sessions left in your ${pkg.packages.name} package`,
          html: `
            <h2>Session Reminder</h2>
            <p>Hi ${pkg.clients.first_name},</p>
            <p>You have only <strong>${pkg.sessions_remaining} sessions</strong> remaining in your <strong>${pkg.packages.name}</strong> package.</p>
            <p>Your package expires on ${new Date(pkg.expiry_date).toLocaleDateString()}.</p>
            <p>Please book your remaining sessions or contact us to renew your package.</p>
            <p>Best regards,<br>TrainWithUs Team</p>
          `,
        });

        notifications.push({
          type: "low_sessions",
          client_id: pkg.client_id,
          package_name: pkg.packages.name,
          sessions_remaining: pkg.sessions_remaining,
          expiry_date: pkg.expiry_date
        });
      } catch (emailError) {
        console.error("Failed to send low sessions email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_sent: notifications.length,
        notifications 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in package-expiry-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordChangeRequest {
  email: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, timestamp }: PasswordChangeRequest = await req.json();

    // Format the timestamp for display
    const changeDate = new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const emailResponse = await resend.emails.send({
      from: "TrainWithUs <onboarding@resend.dev>",
      to: [email],
      subject: "Password Updated - TrainWithUs",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Updated</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 32px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 32px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 8px;
            }
            .title {
              font-size: 20px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 16px;
            }
            .content {
              margin-bottom: 24px;
            }
            .info-box {
              background-color: #f0f9ff;
              border: 1px solid #e0f2fe;
              border-radius: 6px;
              padding: 16px;
              margin: 16px 0;
            }
            .security-notice {
              background-color: #fef7f0;
              border: 1px solid #fed7aa;
              border-radius: 6px;
              padding: 16px;
              margin: 16px 0;
            }
            .footer {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
            }
            .link {
              color: #2563eb;
              text-decoration: none;
            }
            .link:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🏋️ TrainWithUs</div>
            </div>
            
            <h1 class="title">Password Successfully Updated</h1>
            
            <div class="content">
              <p>Hello,</p>
              
              <p>Your password has been successfully updated for your TrainWithUs account.</p>
              
              <div class="info-box">
                <strong>Password Changed:</strong> ${changeDate}
              </div>
              
              <div class="security-notice">
                <strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately at <a href="mailto:support@trainwithus.app" class="link">support@trainwithus.app</a> or change your password again from your account settings.
              </div>
              
              <p>For your security:</p>
              <ul>
                <li>Make sure to use a strong, unique password</li>
                <li>Don't share your password with anyone</li>
                <li>Consider using a password manager</li>
                <li>Log out of any devices you no longer use</li>
              </ul>
              
              <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
            </div>
            
            <div class="footer">
              <p>
                Best regards,<br>
                The TrainWithUs Team
              </p>
              <p>
                <a href="https://preview--trainer-triumph-app.lovable.app/" class="link">Visit TrainWithUs</a> | 
                <a href="mailto:support@trainwithus.app" class="link">Contact Support</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password change notification sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending password change notification:", error);
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
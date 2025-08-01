import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  type: 'welcome' | 'password_reset' | 'email_verification';
  data?: {
    firstName?: string;
    lastName?: string;
    resetUrl?: string;
    verificationUrl?: string;
  };
}

const generateEmailContent = (type: string, data: any) => {
  const { firstName, lastName, resetUrl, verificationUrl } = data || {};
  const name = firstName && lastName ? `${firstName} ${lastName}` : 'there';

  switch (type) {
    case 'welcome':
      return {
        subject: 'Welcome to TrainWithUs!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">TrainWithUs</h1>
              <p style="color: #6b7280;">Professional Training Management</p>
            </div>
            
            <h2 style="color: #1f2937;">Welcome ${name}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Thank you for joining TrainWithUs! We're excited to help you on your fitness journey.
            </p>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Your account has been successfully created. You can now:
            </p>
            
            <ul style="color: #4b5563; line-height: 1.8;">
              <li>Book training sessions</li>
              <li>Manage your packages</li>
              <li>Track your progress</li>
              <li>Access your training history</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Access Your Account
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              If you have any questions, feel free to reach out to our support team.
            </p>
          </div>
        `
      };

    case 'password_reset':
      return {
        subject: 'Reset Your Password - TrainWithUs',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">TrainWithUs</h1>
              <p style="color: #6b7280;">Professional Training Management</p>
            </div>
            
            <h2 style="color: #1f2937;">Password Reset Request</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Hi ${name},
            </p>
            
            <p style="color: #4b5563; line-height: 1.6;">
              We received a request to reset your password for your TrainWithUs account. 
              Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              This link will expire in 60 minutes for security reasons.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you didn't request this password reset, you can safely ignore this email. 
              Your password will remain unchanged.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 12px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
          </div>
        `
      };

    case 'email_verification':
      return {
        subject: 'Verify Your Email - TrainWithUs',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #3b82f6; margin-bottom: 10px;">TrainWithUs</h1>
              <p style="color: #6b7280;">Professional Training Management</p>
            </div>
            
            <h2 style="color: #1f2937;">Verify Your Email Address</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Hi ${name},
            </p>
            
            <p style="color: #4b5563; line-height: 1.6;">
              Thanks for signing up for TrainWithUs! To complete your registration, 
              please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Once verified, you'll be able to access all features of your TrainWithUs account.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you didn't create an account with us, you can safely ignore this email.
            </p>
            
            <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 12px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #3b82f6; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
          </div>
        `
      };

    default:
      throw new Error('Invalid email type');
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, data }: AuthEmailRequest = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "Email and type are required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    const emailContent = generateEmailContent(type, data);

    const emailResponse = await resend.emails.send({
      from: "TrainWithUs <noreply@resend.dev>", // Replace with your verified domain
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
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
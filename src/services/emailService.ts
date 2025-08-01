import { supabase } from '@/integrations/supabase/client';

interface EmailData {
  firstName?: string;
  lastName?: string;
  resetUrl?: string;
  verificationUrl?: string;
}

class EmailService {
  private async sendEmail(email: string, type: 'welcome' | 'password_reset' | 'email_verification', data?: EmailData) {
    try {
      const { data: response, error } = await supabase.functions.invoke('send-auth-email', {
        body: {
          email,
          type,
          data
        }
      });

      if (error) {
        console.error('Email service error:', error);
        throw error;
      }

      return response;
    } catch (error) {
      console.error('Failed to send email:', error);
      // Don't throw error for email failures - auth should still work
      return null;
    }
  }

  async sendWelcomeEmail(email: string, firstName?: string, lastName?: string) {
    return this.sendEmail(email, 'welcome', { firstName, lastName });
  }

  async sendPasswordResetEmail(email: string, resetUrl: string, firstName?: string, lastName?: string) {
    return this.sendEmail(email, 'password_reset', { 
      resetUrl, 
      firstName, 
      lastName 
    });
  }

  async sendEmailVerification(email: string, verificationUrl: string, firstName?: string, lastName?: string) {
    return this.sendEmail(email, 'email_verification', { 
      verificationUrl, 
      firstName, 
      lastName 
    });
  }
}

export const emailService = new EmailService();
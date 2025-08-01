import { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || !type) {
          setVerificationState('error');
          setMessage('Invalid verification link. Missing required parameters.');
          return;
        }

        // Verify the email using Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any
        });

        if (error) {
          setVerificationState('error');
          setMessage(error.message || 'Verification failed. Please try again.');
        } else if (data?.user) {
          setVerificationState('success');
          setMessage('Your email has been verified successfully! You can now access your account.');
        } else {
          setVerificationState('error');
          setMessage('Verification failed. Please try again.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationState('error');
        setMessage('An unexpected error occurred during verification.');
      }
    };

    verifyUser();
  }, [searchParams]);

  if (verificationState === 'success') {
    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {verificationState === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {verificationState === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {verificationState === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            Email Verification
          </CardTitle>
          <CardDescription>
            {verificationState === 'loading' && 'Verifying your email address...'}
            {verificationState === 'success' && 'Verification Successful!'}
            {verificationState === 'error' && 'Verification Failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {verificationState === 'success' && (
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard in 3 seconds...
            </p>
          )}
          
          {verificationState === 'error' && (
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.href = '/auth'}
                className="w-full"
              >
                Go to Login
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
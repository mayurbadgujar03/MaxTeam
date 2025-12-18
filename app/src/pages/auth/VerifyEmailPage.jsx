import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const location = useLocation();
  const email = location.state?.email;

  const [status, setStatus] = useState('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      setStatus('verifying');
      console.log('Verifying token:', token);
      authApi
        .verifyEmail(token)
        .then((response) => {
          console.log('Verification response:', response);
          if (response.message && response.message.includes('already verified')) {
            setStatus('success');
          } else {
            setStatus('success');
          }
        })
        .catch((err) => {
          console.error('Verification error:', err);
          setStatus('error');
          setError(err.message || 'Invalid or expired verification link');
        });
    }
  }, [token]);

  const renderContent = () => {
    if (status === 'verifying') {
      return (
        <div className="space-y-6">
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          </div>
          <p className="text-center text-muted-foreground">Verifying your email...</p>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="font-semibold">Email verified!</h3>
            <p className="text-sm text-muted-foreground">
              Your email has been successfully verified.
            </p>
          </div>
          <Link to="/auth/login">
            <Button className="w-full">Continue to login</Button>
          </Link>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Verification failed</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">
              The link may have expired or already been used.
            </p>
          </div>
          <div className="space-y-2">
            <Link to="/auth/login">
              <Button className="w-full">Try logging in</Button>
            </Link>
            <Link to="/auth/register">
              <Button variant="outline" className="w-full">
                Register again
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="font-semibold">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We've sent a verification link to{' '}
            <span className="font-medium text-foreground">{email || 'your email'}</span>
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Didn't receive the email? Check your spam folder or{' '}
          <Link to="/auth/register" className="text-foreground hover:underline">
            try again
          </Link>
        </p>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="mb-8 flex justify-center transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="Flowbase" className="h-16 w-auto" />
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-2xl font-semibold">Verify your email</CardTitle>
            <CardDescription className="text-center">
              Almost there! Just one more step.
            </CardDescription>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </div>
    </div>
  );
}

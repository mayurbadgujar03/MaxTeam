import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    // Directly navigate the browser to the backend OAuth initialization route
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/user/google`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-sunken p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <Link to="/" className="mb-8 flex justify-center transition-opacity hover:opacity-80">
          <img src="/logo.png" alt="Flowbase" className="h-16 w-auto" />
        </Link>

        <Card className="border-0 shadow-elevated">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-2xl font-semibold">Welcome to Flowbase</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Sign in with your Google account to access your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="flex w-full items-center justify-center gap-3 py-6 border-muted-foreground/20 hover:bg-accent/50 shadow-sm transition-all duration-200"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 14.99 1 12 1 7.24 1 3.23 3.73 1.34 7.74l3.85 2.99C6.1 7.7 8.84 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.45h6.45c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.38-4.88 3.38-8.51z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.19 14.73c-.24-.74-.38-1.54-.38-2.36s.14-1.62.38-2.36L1.34 7.74C.48 9.48 0 11.4 0 13.4s.48 3.92 1.34 5.66l3.85-2.99z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.66-2.84c-1.12.75-2.55 1.2-4.27 1.2-3.16 0-5.9-2.66-6.81-5.69l-3.85 2.99C3.23 20.27 7.24 23 12 23z"
                />
              </svg>
              <span className="font-medium text-base">Continue with Google</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

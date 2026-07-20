import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function InstitutionAdminRoute({ children }) {
  const { isAuthenticated, isLoading, activeWorkspace, workspaces } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Verify the user is an authorized HOD in the currently active workspace
  const currentWorkspace = workspaces.find((ws) => ws._id === activeWorkspace);
  const isHod = currentWorkspace?.isHod;

  if (activeWorkspace === 'PERSONAL' || !isHod) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

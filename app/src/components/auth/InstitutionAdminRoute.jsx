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

  // Verify the user is an authorized HOD or Coordinator in the currently active workspace
  const currentWorkspace = workspaces.find((ws) => ws._id === activeWorkspace);
  const isHod = currentWorkspace?.isHod;
  const isCoordinator = currentWorkspace?.isCoordinator;

  // Allow access if they are either an HOD OR a Coordinator
  if (activeWorkspace === 'PERSONAL' || (!isHod && !isCoordinator)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

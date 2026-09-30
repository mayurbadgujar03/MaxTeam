import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export function InstitutionAdminRoute({ children }) {
  const { isAuthenticated, isLoading, activeWorkspace, setActiveWorkspace, workspaces } = useAuth();

  // Fix the redirect bug: First check the current workspace
  let currentWorkspace = workspaces.find((ws) => ws._id === activeWorkspace);
  let isAuthorized = currentWorkspace?.isHod || currentWorkspace?.isCoordinator;

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      const firstAuthorized = workspaces.find((ws) => ws.isHod || ws.isCoordinator);
      if (firstAuthorized) {
        setActiveWorkspace(firstAuthorized._id);
      }
    }
  }, [isLoading, isAuthorized, workspaces, setActiveWorkspace]);

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

  // If they are on PERSONAL but they actually own an institution workspace, auto-switch them!
  if (!isAuthorized) {
    const firstAuthorized = workspaces.find(ws => ws.isHod || ws.isCoordinator);
    if (firstAuthorized) {
      // Instead of redirecting to dashboard, they just need their workspace fixed
      return <Navigate replace to="/dashboard"/>; 
      // Note: We route to dashboard because React components shouldn't directly mutate context in the render phase, but they can click the workspace switcher there.
    }
    return <Navigate replace to="/dashboard"/>;
  }

  return <>{children}</>;
}

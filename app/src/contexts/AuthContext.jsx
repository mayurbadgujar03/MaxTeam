import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/api/auth';
import { workspaceApi } from '@/api/workspace';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspaceState] = useState(() => {
    return localStorage.getItem('activeWorkspace') || 'PERSONAL';
  });

  const [workspaces, setWorkspaces] = useState([]);

  const setActiveWorkspace = (workspaceId) => {
    if (!workspaceId || workspaceId === 'PERSONAL') {
      setActiveWorkspaceState('PERSONAL');
      localStorage.setItem('activeWorkspace', 'PERSONAL');
      return;
    }

    // Only allow selecting workspaces the user belongs to
    const isAllowed = workspaces.some((ws) => ws._id === workspaceId);
    if (isAllowed) {
      setActiveWorkspaceState(workspaceId);
      localStorage.setItem('activeWorkspace', workspaceId);
    } else {
      setActiveWorkspaceState('PERSONAL');
      localStorage.setItem('activeWorkspace', 'PERSONAL');
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data.user);
      try {
        const wsResponse = await workspaceApi.getMyWorkspaces();
        // Since getMyWorkspaces returns ApiResponse(200, workspaces, ...), the array is in response.data.data
        const validWorkspaces = wsResponse.data || [];
        setWorkspaces(validWorkspaces);

        // Strict activeWorkspace validation:
        // If workspace list is empty, default strictly to 'PERSONAL'
        // If the current activeWorkspace is not in the user's workspaces, revert to 'PERSONAL'
        setActiveWorkspaceState((prev) => {
          if (!validWorkspaces || validWorkspaces.length === 0) {
            localStorage.setItem('activeWorkspace', 'PERSONAL');
            return 'PERSONAL';
          }
          if (prev === 'PERSONAL') {
            return 'PERSONAL';
          }
          const exists = validWorkspaces.some((ws) => ws._id === prev);
          if (!exists) {
            localStorage.setItem('activeWorkspace', 'PERSONAL');
            return 'PERSONAL';
          }
          return prev;
        });
      } catch (wsError) {
        console.error("Failed to fetch workspaces:", wsError);
        setWorkspaces([]);
        setActiveWorkspaceState('PERSONAL');
        localStorage.setItem('activeWorkspace', 'PERSONAL');
      }
    } catch (error) {
      setUser(null);
      setWorkspaces([]);
      setActiveWorkspaceState('PERSONAL');
      localStorage.removeItem('activeWorkspace');
      throw error;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('login') === 'success') {
        localStorage.setItem('isLoggedIn', 'true');
        // Clean the URL so the user doesn't see the query param
        window.history.replaceState({}, document.title, window.location.pathname);
        // Introduce a small delay to allow the browser to fully persist the HttpOnly cookies
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
      if (!isLoggedInFlag) {
        setUser(null);
        setWorkspaces([]);
        setActiveWorkspaceState('PERSONAL');
        setIsLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch (error) {
        console.error("Auth Context Error - refreshUser failed:", error);
        try {
          await authApi.refreshToken();
          await refreshUser();
        } catch (refreshError) {
          console.error("Auth Context Error - Token refresh completely failed:", refreshError);
          setUser(null);
          setWorkspaces([]);
          setActiveWorkspaceState('PERSONAL');
          localStorage.removeItem('activeWorkspace');
          localStorage.removeItem('isLoggedIn');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshUser]);

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspaceState('PERSONAL');
    localStorage.removeItem('activeWorkspace');
    localStorage.removeItem('isLoggedIn');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
        activeWorkspace,
        setActiveWorkspace,
        workspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

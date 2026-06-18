import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/api/auth';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
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

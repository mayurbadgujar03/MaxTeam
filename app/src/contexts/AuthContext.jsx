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
      const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
      if (!isLoggedInFlag) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch (error) {
        try {
          await authApi.refreshToken();
          await refreshUser();
        } catch (refreshError) {
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

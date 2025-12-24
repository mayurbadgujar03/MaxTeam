import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationsApi } from '@/api/notifications';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(undefined);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    // Check if push notifications are enabled
    const pushEnabled = localStorage.getItem('pushNotifications') === 'true';
    if (!pushEnabled) {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await notificationsApi.getAll();
      const notifications = response.data?.notifications || [];
      setNotifications(notifications);
      
      const unreadCount = response.data?.unreadCount || 0;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const markAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      
      setNotifications(prev => {
        const deleted = prev.find(n => n._id === notificationId);
        if (deleted && !deleted.read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n._id !== notificationId);
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const pushEnabled = localStorage.getItem('pushNotifications') === 'true';
      
      if (pushEnabled) {
        fetchNotifications();
        
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
      } else {
        // Clear notifications when disabled
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Listen for changes to notification settings
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'pushNotifications' && isAuthenticated) {
        const pushEnabled = e.newValue === 'true';
        if (pushEnabled) {
          fetchNotifications();
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

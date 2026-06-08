import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { notificationsApi } from "@/api/notifications";
import { useAuth } from "./AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const NotificationContext = createContext(undefined);

export const NotificationProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [pushEnabled, setPushEnabled] = useState(() => {
    return localStorage.getItem("pushNotifications") === "true";
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifiedSet = useRef(new Set());
  const isFirstFetch = useRef(true);

  // Sync pushEnabled state when localStorage changes across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "pushNotifications") {
        setPushEnabled(e.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // React Query polling for notifications
  const { data: queryData, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await notificationsApi.getAll();
      return response?.data || response || { notifications: [], totalCount: 0, unreadCount: 0 };
    },
    enabled: !!isAuthenticated,
    refetchInterval: 60000, // poll every 60 seconds
    refetchOnWindowFocus: true,
  });

  // Keep local state in sync with React Query cache
  useEffect(() => {
    if (!queryData) return;

    // Support nested or direct structures
    const notificationsList = queryData.notifications || queryData.data?.notifications || (Array.isArray(queryData) ? queryData : []);
    const countUnread = queryData.unreadCount !== undefined 
      ? queryData.unreadCount 
      : (queryData.data?.unreadCount !== undefined ? queryData.data.unreadCount : 0);

    setNotifications(notificationsList);
    setUnreadCount(countUnread);
  }, [queryData]);

  // Request browser notification permissions
  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    }
    return "default";
  };

  // Request permission immediately if push notifications are enabled
  useEffect(() => {
    if (pushEnabled && isAuthenticated) {
      requestNotificationPermission();
    }
  }, [pushEnabled, isAuthenticated]);

  // Native Browser Notification trigger
  useEffect(() => {
    if (!queryData) return;

    const notificationsList = queryData.notifications || queryData.data?.notifications || (Array.isArray(queryData) ? queryData : []);
    const unread = notificationsList.filter((n) => !n.read);

    // To prevent spamming the user with multiple popups on page reload/first load,
    // we populate the notifiedSet with existing unread notifications first.
    if (isFirstFetch.current) {
      unread.forEach((n) => notifiedSet.current.add(n._id));
      isFirstFetch.current = false;
      return;
    }

    unread.forEach((notif) => {
      if (!notifiedSet.current.has(notif._id)) {
        notifiedSet.current.add(notif._id);
        if (Notification.permission === "granted") {
          new Notification("Flowbase", {
            body: notif.message,
          });
        }
      }
    });
  }, [queryData]);

  const markAsRead = async (notificationId) => {
    try {
      // Optimistic local state update
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await notificationsApi.markAsRead(notificationId);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic local state update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      await notificationsApi.markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // Optimistic local state update
      setNotifications((prev) => {
        const deleted = prev.find((n) => n._id === notificationId);
        if (deleted && !deleted.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });

      await notificationsApi.deleteNotification(notificationId);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  // Used by SettingsPage to generate local test notifications
  const addNotification = (notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  };

  // Clear state/ref caches on logout or when notifications are disabled
  useEffect(() => {
    if (!isAuthenticated || !pushEnabled) {
      setNotifications([]);
      setUnreadCount(0);
      isFirstFetch.current = true;
      notifiedSet.current.clear();
    }
  }, [isAuthenticated, pushEnabled]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification,
        requestNotificationPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

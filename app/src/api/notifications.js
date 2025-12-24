import { apiClient } from '@/lib/api-client';

export const notificationsApi = {
  async getAll() {
    const response = await apiClient.get('/notifications');
    return response;
  },

  async markAsRead(notificationId) {
    const response = await apiClient.patch(`/notifications/${notificationId}`);
    return response;
  },

  async markAllAsRead() {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response;
  },

  async deleteNotification(notificationId) {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response;
  },
};

import { apiClient } from '@/lib/api-client';

export const feedbackApi = {
  async create(payload) {
    return apiClient.post('/feedback', payload);
  },
  async getPublicStats() {
    return apiClient.get('/public/stats');
  },
  async getAdminStats() {
    return apiClient.get('/admin/stats');
  },
  async resolveFeedback(feedbackId) {
    return apiClient.patch(`/admin/feedback/${feedbackId}`, { status: 'resolved' });
  }
};

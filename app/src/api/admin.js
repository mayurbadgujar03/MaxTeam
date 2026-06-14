import { apiClient } from '@/lib/api-client';

export const adminApi = {
  async getStats() {
    return apiClient.get('/admin/stats');
  },
  async resolveFeedback(feedbackId, status = 'resolved') {
    return apiClient.patch(`/admin/feedback/${feedbackId}`, { status });
  }
};

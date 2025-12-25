import { apiClient } from '@/lib/api-client';

export const dashboardApi = {
  async getStats() {
    const response = await apiClient.get('/dashboard/stats');
    return response;
  },
};

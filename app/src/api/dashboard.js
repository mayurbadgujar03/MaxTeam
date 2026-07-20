import { apiClient } from '@/lib/api-client';

export const dashboardApi = {
  async getStats(workspaceId) {
    const url = workspaceId && workspaceId !== 'PERSONAL' 
      ? `/dashboard/stats?workspaceId=${workspaceId}` 
      : '/dashboard/stats';
    const response = await apiClient.get(url);
    return response;
  },
};

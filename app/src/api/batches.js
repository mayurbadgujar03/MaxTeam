import { apiClient } from '@/lib/api-client';

export const batchesApi = {
  async create(data) {
    const response = await apiClient.post('/batch', data);
    return response;
  },

  async getWorkspaceBatches(workspaceId) {
    const response = await apiClient.get(`/batch?workspaceId=${workspaceId}`);
    return response;
  },
};

import { apiClient } from '@/lib/api-client';

export const workspaceApi = {
  async getMyWorkspaces() {
    const response = await apiClient.get('/workspace/mine');
    return response;
  },
};

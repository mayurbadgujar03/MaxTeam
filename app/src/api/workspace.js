import { apiClient } from '@/lib/api-client';

export const workspaceApi = {
  async getMyWorkspaces() {
    const response = await apiClient.get('/workspace/mine');
    return response;
  },

  async addWorkspaceHod(workspaceId, email) {
    const response = await apiClient.patch(`/workspace/${workspaceId}/hods`, { email });
    return response;
  },
};

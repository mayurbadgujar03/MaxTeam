import { apiClient } from '@/lib/api-client';

export const membersApi = {
  async getAll(projectId) {
    const response = await apiClient.get(`/project/${projectId}/members`);
    return response;
  },

  async add(projectId, data) {
    const response = await apiClient.post(`/project/${projectId}/members`, data);
    return response;
  },

  async updateRole(projectId, memberId, role) {
    const response = await apiClient.put(`/project/${projectId}/members/${memberId}`, { role });
    return response;
  },

  async remove(projectId, memberId) {
    const response = await apiClient.delete(`/project/${projectId}/members/${memberId}`);
    return response;
  },
};

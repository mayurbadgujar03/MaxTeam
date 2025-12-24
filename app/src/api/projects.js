import { apiClient } from '@/lib/api-client';

export const projectsApi = {
  async getAll() {
    const response = await apiClient.get('/project');
    return response;
  },

  async getById(id) {
    const response = await apiClient.get(`/project/${id}`);
    return response;
  },

  async create(data) {
    const response = await apiClient.post('/project', data);
    return response;
  },

  async update(id, data) {
    const response = await apiClient.put(`/project/${id}`, data);
    return response;
  },

  async delete(id) {
    const response = await apiClient.delete(`/project/${id}`);
    return response;
  },

  async getMembers(projectId) {
    const response = await apiClient.get(`/project/${projectId}/members`);
    return response;
  },

  async addMember(projectId, data) {
    const response = await apiClient.post(`/project/${projectId}/members`, data);
    return response;
  },

  async removeMember(projectId, memberId) {
    const response = await apiClient.delete(`/project/${projectId}/members/${memberId}`);
    return response;
  },

  async updateMemberRole(projectId, memberId, role) {
    const response = await apiClient.put(`/project/${projectId}/members/${memberId}`, { role });
    return response;
  },
};

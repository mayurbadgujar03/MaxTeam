import { apiClient } from '@/lib/api-client';

export const projectsApi = {
  async getAll(workspaceId, scope) {
    let url = workspaceId && workspaceId !== 'PERSONAL' ? `/project?workspaceId=${workspaceId}` : '/project';
    if (scope) {
      url += `${url.includes('?') ? '&' : '?'}scope=${scope}`;
    }
    const response = await apiClient.get(url);
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

  async updateMemberGithub(projectId, memberId, githubUsername) {
    const response = await apiClient.patch(`/project/${projectId}/members/${memberId}`, { githubUsername });
    return response;
  },

  async getCommits(projectId) {
    const response = await apiClient.get(`/project/${projectId}/commits`);
    return response;
  },

  async uploadDocument(projectId, docType, formData) {
    const response = await apiClient.post(
      `/project/${projectId}/documents/${docType}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response;
  },

  async deleteDocument(projectId, docType, versionIndex) {
    const url = versionIndex != null
      ? `/project/${projectId}/documents/${docType}?versionIndex=${versionIndex}`
      : `/project/${projectId}/documents/${docType}`;
    const response = await apiClient.delete(url);
    return response;
  },

  async updateMilestone(projectId, milestoneId, data) {
    const response = await apiClient.patch(`/project/${projectId}/milestones/${milestoneId}`, data);
    return response;
  },

  async evaluateMilestone(projectId, milestoneId, status) {
    const response = await apiClient.patch(`/project/${projectId}/milestones/${milestoneId}/evaluate`, { status });
    return response;
  },

  async initializeTimeline(projectId, { startDate, endDate }) {
    const response = await apiClient.post(`/project/${projectId}/timeline/initialize`, { startDate, endDate });
    return response;
  },
};

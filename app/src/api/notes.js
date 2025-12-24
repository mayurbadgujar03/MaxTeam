import { apiClient } from '@/lib/api-client';

export const notesApi = {
  async getAll(projectId) {
    const response = await apiClient.get(`/project-note/${projectId}`);
    return response;
  },

  async getById(projectId, noteId) {
    const response = await apiClient.get(`/project-note/${projectId}/n/${noteId}`);
    return response;
  },

  async create(projectId, data) {
    const response = await apiClient.post(`/project-note/${projectId}`, data);
    return response;
  },

  async update(projectId, noteId, data) {
    const response = await apiClient.put(`/project-note/${projectId}/n/${noteId}`, data);
    return response;
  },

  async delete(projectId, noteId) {
    const response = await apiClient.delete(`/project-note/${projectId}/n/${noteId}`);
    return response;
  },
};

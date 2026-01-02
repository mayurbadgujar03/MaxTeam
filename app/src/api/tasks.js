import { apiClient } from '@/lib/api-client';

export const tasksApi = {
  async getAll(projectId) {
    const response = await apiClient.get(`/task/projects/${projectId}/tasks`);
    return response;
  },

  async getById(projectId, taskId) {
    const response = await apiClient.get(`/task/${projectId}/n/${taskId}`);
    return response;
  },

  async create(projectId, data) {
    const response = await apiClient.post(`/task/projects/${projectId}/tasks`, {
      title: data.title,
      description: data.description || '',
      status: data.status || 'todo',
      assignedTo: data.assignedTo || null,
      links: data.links || [],
    });
    return response;
  },

  async update(projectId, taskId, data) {
    const payload = {};
    if (data.title) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.status) payload.status = data.status;
    if (data.assignedTo !== undefined) payload.assignedTo = data.assignedTo;
    if (data.links) payload.links = data.links;
    const response = await apiClient.put(`/task/${projectId}/n/${taskId}`, payload);
    return response;
  },

  async delete(projectId, taskId) {
    const response = await apiClient.delete(`/task/${projectId}/n/${taskId}`);
    return response;
  },

  async createSubtask(projectId, taskId, data) {
    const response = await apiClient.post(`/task/${projectId}/n/${taskId}/subtasks`, data);
    return response;
  },

  async updateSubtask(projectId, taskId, subtaskId, data) {
    const response = await apiClient.put(`/task/${projectId}/n/${taskId}/subtasks/${subtaskId}`, data);
    return response;
  },

  async deleteSubtask(projectId, taskId, subtaskId) {
    const response = await apiClient.delete(`/task/${projectId}/n/${taskId}/subtasks/${subtaskId}`);
    return response;
  },
};

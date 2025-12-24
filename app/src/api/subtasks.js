import { apiClient } from '@/lib/api-client';

export const subtasksApi = {
  async create(projectId, taskId, data) {
    const response = await apiClient.post(
      `/task/${projectId}/n/${taskId}/subtasks`,
      data
    );
    return response;
  },

  async update(projectId, taskId, subtaskId, data) {
    const response = await apiClient.put(
      `/task/${projectId}/n/${taskId}/subtasks/${subtaskId}`,
      data
    );
    return response;
  },

  async delete(projectId, taskId, subtaskId) {
    const response = await apiClient.delete(
      `/task/${projectId}/n/${taskId}/subtasks/${subtaskId}`
    );
    return response;
  },
};

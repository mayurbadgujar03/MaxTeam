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

  async getBatchDetails(batchId) {
    const response = await apiClient.get(`/batch/${batchId}`);
    return response;
  },

  async getBatchStats(batchId) {
    const response = await apiClient.get(`/batch/${batchId}/stats`);
    return response;
  },

  async exportBatchCSV(batchId) {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/batch/${batchId}/export`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }
    const blob = await response.blob();
    return blob;
  },

  async updateBatchCoordinators(batchId, coordinatorEmails) {
    const response = await apiClient.patch(`/batch/${batchId}/coordinators`, { coordinatorEmails });
    return response;
  },
};

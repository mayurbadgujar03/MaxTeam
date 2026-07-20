import { apiClient } from '@/lib/api-client';

export const intakeApi = {
  async getPublicBatchDetails(batchId) {
    const response = await apiClient.get(`/batch/public/${batchId}`);
    return response;
  },

  async submitIntakeForm(payload) {
    const response = await apiClient.post('/intake', payload);
    return response;
  },
};

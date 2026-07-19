import { apiClient } from '@/lib/api-client';

export const commentsApi = {
  async create(data) {
    const response = await apiClient.post('/comments', data);
    return response;
  },

  async getDocumentComments(documentId) {
    const response = await apiClient.get(`/comments/${documentId}`);
    return response;
  },
};

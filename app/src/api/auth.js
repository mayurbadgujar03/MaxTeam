import { apiClient } from '@/lib/api-client';

export const authApi = {
  async login(credentials) {
    const response = await apiClient.post('/user/login', credentials);
    return response;
  },

  async register(credentials) {
    const response = await apiClient.post('/user/register', credentials);
    return response;
  },

  async logout() {
    const response = await apiClient.post('/user/logout');
    return response;
  },

  async getCurrentUser() {
    const response = await apiClient.get('/user/current-user');
    return response;
  },

  async verifyEmail(token) {
    const response = await apiClient.post(`/user/verify-email/${token}`);
    return response;
  },

  async forgotPassword(email) {
    const response = await apiClient.post('/user/forgot-password-request', { email });
    return response;
  },

  async resetPassword(token, password) {
    const response = await apiClient.post(`/user/reset-password/${token}`, { newPassword: password });
    return response;
  },

  async changePassword(oldPassword, newPassword) {
    const response = await apiClient.put('/user/change-current-password', {
      oldPassword,
      newPassword,
    });
    return response;
  },

  async refreshToken() {
    const response = await apiClient.post('/user/refresh-access-token');
    return response;
  },

  async resendEmailVerification(email) {
    const response = await apiClient.post('/user/resend-email-verification', { email });
    return response;
  },
};

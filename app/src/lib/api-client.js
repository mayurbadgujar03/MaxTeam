const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: `Server returned non-JSON response (${response.status})` };
        console.error('Non-JSON response:', text.substring(0, 200));
      }

      if (!response.ok) {
        if (response.status === 401) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            const retryResponse = await fetch(url, {
              ...options,
              headers,
              credentials: 'include',
            });
            const retryContentType = retryResponse.headers.get('content-type');
            const retryData = retryContentType && retryContentType.includes('application/json')
              ? await retryResponse.json()
              : { message: 'Non-JSON response' };
            if (!retryResponse.ok) {
              throw { statusCode: retryResponse.status, message: retryData.message };
            }
            return retryData;
          }
        }
        throw { statusCode: response.status, message: data.message || `Request failed with status ${response.status}` };
      }

      return data;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      console.error('Network request failed:', error);
      throw { 
        statusCode: 500, 
        message: 'Network error - Cannot connect to backend server. Please ensure the backend is running.' 
      };
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.baseUrl}/user/refresh-access-token`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async upload(endpoint, formData) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw { statusCode: response.status, message: data.message };
    }

    return data;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

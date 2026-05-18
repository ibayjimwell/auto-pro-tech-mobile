import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'https://auto-pro-tech-api.onrender.com/api/v1';
// export const API_BASE_URL = 'http://localhost:4000/api/v1';

const api = {
  async request(endpoint, method = 'GET', body = null, requiresAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (requiresAuth) {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add cache‑busting timestamp to GET requests
    let url = `${API_BASE_URL}${endpoint}`;
    if (method === 'GET') {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}_t=${Date.now()}`;
    }

    const options = {
      method,
      headers,
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  },
};

export default api;
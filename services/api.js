import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://goatskin-clinic-molehill.ngrok-free.dev/api/v1'; // Replace with your actual IP for physical device

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
    const options = {
      method,
      headers,
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  },

  // Auth endpoints
  register(userData) {
    return this.request('/auth/register', 'POST', userData);
  },
  login(credentials) {
    return this.request('/auth/login', 'POST', credentials);
  },
  getMe() {
    return this.request('/auth/me', 'GET', null, true);
  },
};

export default api;
import api from './api';

// Auth endpoints
const authApi = {
  register(userData) {
    return api.request('/auth/register', 'POST', userData);
  },
  login(credentials) {
    return api.request('/auth/login', 'POST', credentials);
  },
  getMe() {
    return api.request('/auth/me', 'GET', null, true);
  },
};

export default authApi;
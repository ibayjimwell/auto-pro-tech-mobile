import api from './api';

const pushNotificationApi = {
  /**
   * Register or update the device's push token on the backend.
   * @param {string} token - Expo push token
   * @param {string} platform - 'ios' or 'android' (optional)
   */
  registerToken(token, platform = null) {
    return api.request('/push-tokens', 'POST', { token, platform }, true);
  },

  /**
   * Unregister the push token (e.g., on logout).
   * @param {string} token - Expo push token
   */
  unregisterToken(token) {
    return api.request('/push-tokens', 'DELETE', { token }, true);
  },

  /**
   * Get all registered tokens for the current customer.
   */
  getTokens() {
    return api.request('/push-tokens', 'GET', null, true);
  },
};

export default pushNotificationApi;
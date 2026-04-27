import api from './api';

const serviceTypesApi = {
  // List all active service types (for booking form)
  listActive: () => api.request('/service-types?active=true', 'GET', null, false),

  // Get all service types (admin)
  listAll: () => api.request('/service-types', 'GET', null, true),

  // Get a single service type by ID
  get: (id) => api.request(`/service-types/${id}`, 'GET', null, true),

  // Create a new service type (admin only)
  create: (data) => api.request('/service-types', 'POST', data, true),

  // Update a service type (admin only)
  update: (id, data) => api.request(`/service-types/${id}`, 'PUT', data, true),

  // Delete a service type (admin only)
  delete: (id) => api.request(`/service-types/${id}`, 'DELETE', null, true),
};

export default serviceTypesApi;
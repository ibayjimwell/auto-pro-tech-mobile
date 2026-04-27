import api from './api';

const vehiclesApi = {
  // List all vehicles for the logged-in customer
  listByCustomer: (customerId) =>
    api.request(`/vehicles/customer/${customerId}`, 'GET', null, true),

  // Get a single vehicle by ID
  get: (id) => api.request(`/vehicles/${id}`, 'GET', null, true),

  // Create a new vehicle for the customer
  create: (data) => api.request('/vehicles', 'POST', data, true),

  // Update an existing vehicle
  update: (id, data) => api.request(`/vehicles/${id}`, 'PUT', data, true),

  // Delete a vehicle
  delete: (id) => api.request(`/vehicles/${id}`, 'DELETE', null, true),
};

export default vehiclesApi;
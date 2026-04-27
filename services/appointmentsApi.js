import api from './api';

const appointmentsApi = {
  // Get appointments for the logged-in customer (or filtered)
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/appointments${query ? `?${query}` : ''}`, 'GET', null, true);
  },

  // Get a single appointment by ID
  get: (id) => api.request(`/appointments/${id}`, 'GET', null, true),

  // Create a new appointment
  create: (data) => api.request('/appointments', 'POST', data, true),

  // Cancel an appointment (soft delete)
  cancel: (id, notes = '') => api.request(`/appointments/${id}`, 'DELETE', { notes }, true),

  // Update appointment (e.g., reschedule)
  update: (id, data) => api.request(`/appointments/${id}`, 'PUT', data, true),

  // Update appointment status (if needed)
  updateStatus: (id, status, notes = '') =>
    api.request(`/appointments/${id}/status`, 'PATCH', { status, notes }, true),

  // Get available time slots for a given date and service type
  getAvailableSlots: (date, serviceTypeId) =>
    api.request(`/appointments/available-slots?date=${date}&serviceTypeId=${serviceTypeId}`, 'GET', null, true),

  // Get status history for an appointment
  getStatusLog: (id) => api.request(`/appointments/${id}/status-log`, 'GET', null, true),

  // Get calendar view (grouped by date) – optional
  getCalendarView: (month) => api.request(`/appointments/calendar?month=${month}`, 'GET', null, true),
};

export default appointmentsApi;
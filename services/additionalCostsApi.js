import api from './api';

const additionalCostsApi = {
  getByAppointment: (appointmentId) =>
    api.request(`/additional-costs/appointments/${appointmentId}`, 'GET', null, true),

  approve: (costId) =>
    api.request(`/additional-costs/${costId}/approve`, 'PATCH', null, true),

  decline: (costId) =>
    api.request(`/additional-costs/${costId}/decline`, 'PATCH', null, true),
};

export default additionalCostsApi;

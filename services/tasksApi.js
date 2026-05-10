import api from './api';

const tasksApi = {
  getByAppointment: (appointmentId) =>
    api.request(`/inspection/appointments/${appointmentId}/tasks`, 'GET', null, true),
};

export default tasksApi;
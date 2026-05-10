import api from './api';

const invoicesApi = {
  getByAppointment: (appointmentId) =>
    api.request(`/invoices/appointment/${appointmentId}`, 'GET', null, true),
};

export default invoicesApi;
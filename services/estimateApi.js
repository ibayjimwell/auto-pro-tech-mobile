import api from './api';

const estimateApi = {
  getAdjustments: (appointmentId) =>
    api.request(`/estimate/appointments/${appointmentId}/estimate`, 'GET', null, true),
};

export default estimateApi;
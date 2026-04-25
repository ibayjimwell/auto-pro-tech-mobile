import api from "./api";

const customersApi = {
    // Inside api object
    getVehiclesByCustomer(customerId) {
        return api.request(`/vehicles/customer/${customerId}`, 'GET', null, true);
    },
    getCustomerAppointments(customerId) {
        return api.request(`/customers/${customerId}/appointments`, 'GET', null, true);
    },
    getMe() {
        return api.request('/auth/me', 'GET', null, true);
    },
}

export default customersApi;
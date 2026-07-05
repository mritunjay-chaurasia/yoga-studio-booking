import api from './axios.js';

export const bookingApi = {
  createBooking: (data) =>
    api.post('/bookings', data).then((r) => r.data.data),

  cancelBooking: (id) => api.delete(`/bookings/${id}`).then((r) => r.data),

  getStudentBookings: (id) =>
    api.get(`/bookings/student/${id}`).then((r) => r.data.data),

  getClassBookings: (id) =>
    api.get(`/bookings/class/${id}`).then((r) => r.data.data),
};

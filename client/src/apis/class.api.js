import api from './axios.js';

export const classApi = {
  getClasses: (params) =>
    api.get('/classes', { params }).then((r) => r.data.data),

  getClass: (id) => api.get(`/classes/${id}`).then((r) => r.data.data),

  createClass: (data) => api.post('/classes', data).then((r) => r.data.data),

  updateClass: (id, data) =>
    api.put(`/classes/${id}`, data).then((r) => r.data.data),

  deleteClass: (id) => api.delete(`/classes/${id}`).then((r) => r.data),
};

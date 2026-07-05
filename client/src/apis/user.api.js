import api from './axios.js';

export const userApi = {
  getUsers: (params) => api.get('/users', { params }).then((r) => r.data.data),

  createUser: (data) => api.post('/users', data).then((r) => r.data.data),
};

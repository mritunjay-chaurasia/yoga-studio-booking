import api from './axios.js';

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),

  refresh: () => api.post('/auth/refresh').then((r) => r.data.data),

  logout: () => api.post('/auth/logout').then((r) => r.data),

  getMe: () => api.get('/auth/me').then((r) => r.data.data),
};

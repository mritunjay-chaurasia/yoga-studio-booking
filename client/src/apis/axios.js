import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = () => {
  refreshSubscribers.forEach(({ resolve }) => resolve());
  refreshSubscribers = [];
};

const onRefreshFailed = (err) => {
  refreshSubscribers.forEach(({ reject }) => reject(err));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (resolve, reject) => {
  refreshSubscribers.push({ resolve, reject });
};

const isAuthEndpoint = (url = '') =>
  url.includes('/auth/login') ||
  url.includes('/auth/refresh') ||
  url.includes('/auth/logout');

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const data = error.response?.data;
    const fieldError = data?.errors?.[0]?.message;
    const message = fieldError || data?.message || error.message || 'Something went wrong';

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint(original.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(
            () => resolve(api(original)),
            (err) => reject(err)
          );
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        onRefreshed();
        return api(original);
      } catch (refreshErr) {
        const sessionError = new Error('Session expired — please log in again');
        onRefreshFailed(sessionError);
        window.dispatchEvent(new Event('auth:session-expired'));
        return Promise.reject(sessionError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;

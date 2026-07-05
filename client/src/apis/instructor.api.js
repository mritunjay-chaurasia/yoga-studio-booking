import api from './axios.js';

export const instructorApi = {
  getSchedule: (id) =>
    api.get(`/instructors/${id}/schedule`).then((r) => r.data.data),
};

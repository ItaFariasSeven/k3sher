import api from './api';

export const getPrayerRequests = () =>
  api.get('/prayers/requests/').then((r) => r.data);

export const createPrayerRequest = (data) =>
  api.post('/prayers/requests/', data).then((r) => r.data);

export const thankPrayerRequest = (id) =>
  api.post(`/prayers/requests/${id}/answer/`).then((r) => r.data);

export const getThanksPrayers = () =>
  api.get('/prayers/thanks/').then((r) => r.data);

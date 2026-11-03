import api from './api';

export const getPrayerRequests = async () => {
  const response = await api.get('/prayers/requests/');
  return response.data;
};

export const createPrayerRequest = async (data) => {
  const response = await api.post('/prayers/requests/', data);
  return response.data;
};

export const thankPrayerRequest = async (id) => {
  const response = await api.post(`/prayers/requests/${id}/thank/`);
  return response.data;
};

export const getThanksPrayers = async () => {
  const response = await api.get('/prayers/thanks/');
  return response.data;
};
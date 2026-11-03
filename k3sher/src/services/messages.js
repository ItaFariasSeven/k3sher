import api from './api';

export async function getMessages() {
  const response = await api.get('/messages/');
  return response.data;
}

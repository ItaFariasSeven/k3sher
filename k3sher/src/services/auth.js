import api from './api';


export const login = async (email, password) => {
  const response = await api.post('/auth/login/', { email, password });
  return response.data;
};


export const register = async (data) => {
  const response = await api.post('/auth/register/', data);
  return response.data;
};


export const sendVerificationCode = async (email, purpose = 'register') => {
  const response = await api.post('/auth/send-code/', { email, purpose });
  return response.data;
};


export const verifyCode = async (email, code, purpose = 'register') => {
  const response = await api.post('/auth/verify-code/', { email, code, purpose });
  return response.data;
};


export const resetPassword = async (email, code, newPassword, confirmPassword) => {
  const response = await api.post('/auth/reset-password/', {
    email,
    code,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  return response.data;
};

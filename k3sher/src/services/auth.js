import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email, password) => {
  const response = await api.post('/auth/login/', {
    email,
    password,
  });

  const { access, refresh } = response.data;

  // Salva os tokens para as próximas requisições.
  await AsyncStorage.setItem('@k3sher:token', access);
  await AsyncStorage.setItem('@k3sher:refresh', refresh);

  return response.data;
};

export const register = async (data) => {
  const response = await api.post('/auth/register/', data);
  return response.data;
};

export const sendVerificationCode = async (email, purpose = 'register') => {
  const response = await api.post('/auth/send-code/', {
    email,
    purpose,
  });
  return response.data;
};

export const verifyCode = async (email, code, purpose = 'register') => {
  const response = await api.post('/auth/verify-code/', {
    email,
    code,
    purpose,
  });
  return response.data;
};

export const resetPassword = async (
  email,
  code,
  newPassword,
  confirmPassword
) => {
  const response = await api.post('/auth/reset-password/', {
    email,
    code,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });

  return response.data;
};

export const logout = async () => {
  await AsyncStorage.removeItem('@k3sher:token');
  await AsyncStorage.removeItem('@k3sher:refresh');
};

export const getProfile = async () => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

// Precisamos usar FormData porque estamos enviando arquivo de imagem!
export const updateProfile = async (formData) => {
  const response = await api.patch('/auth/profile/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Nova função para o Login Social (Google)
export const googleLogin = async (idToken) => {
  // Envia o idToken nativo do Google para o seu backend Django validar
  const response = await api.post('/auth/google/', {
    token: idToken
  });

  const { access, refresh } = response.data;

  // Se o backend confirmar, salva os tokens no app exatamente como no login padrão
  if (access) await AsyncStorage.setItem('@k3sher:token', access);
  if (refresh) await AsyncStorage.setItem('@k3sher:refresh', refresh);

  return response.data;
};

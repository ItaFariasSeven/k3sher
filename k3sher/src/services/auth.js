
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from './firebase';

import {
  entrarComEmail,
  obterFirebaseIdToken,
  sairFirebase,
} from './firebaseAuth';

const TOKEN_KEY = '@k3sher:token';
const REFRESH_KEY = '@k3sher:refresh';

// Troca a identidade Firebase pelos JWTs do Django.
export const criarSessaoBackendFirebase = async () => {
  try {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      throw new Error('Nenhum usuário Firebase autenticado.');
    }

    const idToken = await obterFirebaseIdToken();

    const response = await api.post('/auth/firebase/session/', {
      idToken,
    });

    const { access, refresh, user } = response.data;
    console.log('========== IDENTIDADE DA SESSÃO ==========');
    console.log('Firebase UID:', auth.currentUser?.uid);
    console.log('Firebase Email:', auth.currentUser?.email);
    console.log('Django User ID:', user?.id);
    console.log('Django Email:', user?.email);
    console.log('==========================================');

    if (!access || !refresh || !user?.id || !user?.email) {
      throw new Error(
        'O servidor não retornou os dados completos da sessão.'
      );
    }

    const emailFirebase = firebaseUser.email?.trim().toLowerCase();
    const emailBackend = user.email.trim().toLowerCase();

    if (emailFirebase !== emailBackend) {
      throw new Error(
        'A conta retornada pelo servidor não corresponde à conta Firebase autenticada.'
      );
    }

    await AsyncStorage.setItem(TOKEN_KEY, access);
    await AsyncStorage.setItem(REFRESH_KEY, refresh);

    return response.data;

  } catch (error) {
    console.log('STATUS:', error.response?.status);
    console.log('RESPOSTA:', JSON.stringify(error.response?.data));
    console.log('ERRO:', error.message);

    throw error;
  }
};

// Login por e-mail e senha através do Firebase.
export const login = async (email, password) => {
  const resultado = await entrarComEmail(email, password);

  if (!resultado.emailVerificado) {
    return { emailVerificado: false };
  }

  // Remove os JWTs da sessão anterior.
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);

  const sessao = await criarSessaoBackendFirebase();

  return {
    ...sessao,
    emailVerificado: true,
  };
};

// Encerra as duas sessões.
export const logout = async () => {
  try {
    await sairFirebase();
  } finally {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
  }
};

// Consulta perfil no Django.
export const getProfile = async () => {
  const response = await api.get('/auth/profile/');
  return response.data;
};

// Atualização de perfil.
export const updateProfile = async (formData) => {
  const response = await api.patch('/auth/profile/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
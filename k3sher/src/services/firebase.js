
import { Platform } from 'react-native';

import {
  initializeApp,
  getApp,
  getApps,
} from 'firebase/app';

import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Verifica se todas as configurações foram preenchidas.
const configuracoesAusentes = Object.entries(firebaseConfig)
  .filter(([_, valor]) => !valor)
  .map(([chave]) => chave);

if (configuracoesAusentes.length > 0) {
  throw new Error(
    `Configurações Firebase ausentes: ${configuracoesAusentes.join(', ')}`
  );
}

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

let auth;

if (Platform.OS === 'web') {
  // Na Web, utiliza a persistência padrão do navegador.
  auth = getAuth(app);
} else {
  // Android e iOS: persistência com AsyncStorage.
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
}

export { app, auth };

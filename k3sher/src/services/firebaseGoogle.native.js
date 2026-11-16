
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import {
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';

import { auth } from './firebase';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let configurado = false;

function configurarGoogle() {
  if (!webClientId) {
    throw new Error(
      'Google Web Client ID não configurado no ambiente.'
    );
  }

  if (!configurado) {
    GoogleSignin.configure({
      webClientId,
    });

    configurado = true;
  }
}

export async function entrarComGoogle() {
  configurarGoogle();

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const response = await GoogleSignin.signIn();

  if (response.type !== 'success') {
    return null;
  }

  const idToken = response.data?.idToken;

  if (!idToken) {
    throw new Error('O Google não retornou o ID Token.');
  }

  // Transforma a credencial Google em uma credencial Firebase
  const googleCredential = GoogleAuthProvider.credential(idToken);

  const result = await signInWithCredential(
    auth,
    googleCredential
  );

  return result.user;
}

export async function sairGoogle() {
  await GoogleSignin.signOut();
}

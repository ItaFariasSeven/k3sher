import {
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

import { auth } from './firebase';

export async function entrarComGoogle() {
  const provider = new GoogleAuthProvider();

  const result = await signInWithPopup(auth, provider);

  return result.user;
}

import { auth } from './firebase';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  reload,
  signOut,
  getIdToken,
  updateProfile,
} from 'firebase/auth';

// Cadastro com e-mail e senha
export async function registrarComEmail(email, password, nome = '') {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const user = credential.user;

  try {
    // Define o nome do usuário
    if (nome.trim()) {
      await updateProfile(user, {
        displayName: nome.trim(),
      });
    }

    // Envia o e-mail de confirmação
    auth.languageCode = 'pt-BR';
    await sendEmailVerification(user);

    return user;

  } catch (error) {
    // A conta pode já ter sido criada mesmo se o envio falhar.
    throw error;
  }
}

// Login convencional
export async function entrarComEmail(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );

  const user = credential.user;

  await reload(user);

  return {
    user,
    emailVerificado: user.emailVerified,
  };
}

// Reenvia o e-mail de confirmação
export async function reenviarVerificacaoEmail() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Nenhum usuário autenticado.');
  }

  await reload(user);

  if (user.emailVerified) {
    return { jaVerificado: true };
  }

  auth.languageCode = 'pt-BR';
  await sendEmailVerification(user);

  return { enviado: true };
}

// Verifica se o usuário confirmou o e-mail
export async function verificarEmailAtual() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Sessão não encontrada. Entre novamente.');
  }

  await reload(user);

  if (!user.emailVerified) {
    return {
      verificado: false,
    };
  }

  const idToken = await getIdToken(user, true);

  return {
    verificado: true,
    user,
    idToken,
  };
}

// Recuperação de senha
export async function recuperarSenha(email) {
  auth.languageCode = 'pt-BR';

  await sendPasswordResetEmail(
    auth,
    email.trim().toLowerCase()
  );

  return true;
}

// Obtém o token Firebase para enviar ao Django
export async function obterFirebaseIdToken() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Usuário não autenticado.');
  }

  await reload(user);

  if (!user.emailVerified) {
    throw new Error('Confirme seu e-mail antes de continuar.');
  }

  return getIdToken(user, true);
}

// Encerramento de sessão Firebase
export async function sairFirebase() {
  await signOut(auth);
}

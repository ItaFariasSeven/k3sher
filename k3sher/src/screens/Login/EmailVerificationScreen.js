
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Image,} from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import AppButton from '../../components/AppButton';
import { Colors } from '../../constants/colors';

import {verificarEmailAtual,reenviarVerificacaoEmail,} from '../../services/firebaseAuth';

import {criarSessaoBackendFirebase,} from '../../services/auth';

export default function EmailVerificationScreen({ route, navigation }) {
  const { emailOrPhone } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
  try {
    setResending(true);

    const resultado = await reenviarVerificacaoEmail();

    Alert.alert(
      'Confirmação',
      resultado.jaVerificado
        ? 'Seu e-mail já está confirmado.'
        : 'Novo link enviado para sua caixa de entrada.'
    );

  } catch (error) {
    Alert.alert('Erro', error.message);

  } finally {
    setResending(false);
  }
};

const handleVerify = async () => {
  try {
    setLoading(true);

    const resultado = await verificarEmailAtual();

    if (!resultado.verificado) {
      Alert.alert(
        'Atenção',
        'Você ainda não confirmou seu e-mail.'
      );
      return;
    }

    await criarSessaoBackendFirebase();

    navigation.replace('NavBar');

  } catch (error) {
    Alert.alert(
      'Erro',
      error.response?.data?.detail || error.message
    );

  } finally {
    setLoading(false);
  }
};

  return (
    <ScreenContainer scrollable>
      <Image
        source={require('../../assets/login/confirmaremailimage.png')}
        style={styles.illustration}
        resizeMode="contain"
      />

      <View style={styles.header}>
        <Text style={styles.title}>Confirme seu e-mail</Text>

        <Text style={styles.description}>
          Enviamos um link de confirmação para:
        </Text>

        <Text style={styles.email}>
          {emailOrPhone}
        </Text>

        <Text style={styles.description}>
          Abra sua caixa de entrada, clique no link e depois volte ao aplicativo.
        </Text>
      </View>

      <AppButton
        title={loading ? 'Verificando...' : 'Já confirmei meu e-mail'}
        onPress={handleVerify}
      />

      <View style={styles.resend}>
        <AppButton
          title={resending ? 'Enviando...' : 'Reenviar link'}
          onPress={handleResend}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  illustration: {
    width: '100%',
    height: 260,
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.link,
  },
  resend: {
    marginTop: 12,
  },
});

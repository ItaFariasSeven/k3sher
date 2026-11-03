// Tela de início do cadastro que recebe o email e solicita o envio do código de verificação.

import React, { useState } from 'react';
import { View, Image, StyleSheet, Alert } from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import HeaderLogo from '../../components/HeaderLogo';
import InputField from '../../components/InputField';
import AppButton from '../../components/AppButton';
import { sendVerificationCode } from '../../services/auth';

export default function RegisterStartScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!emailOrPhone || !emailOrPhone.includes('@')) {
      Alert.alert('Erro', 'Digite um email válido.');
      return;
    }

    try {
      setLoading(true);
      await sendVerificationCode(emailOrPhone, 'register');
      navigation.navigate('EmailVerification', { emailOrPhone });
    } catch (error) {
      const msg =
        error.response?.data?.email?.[0] ||
        error.response?.data?.detail ||
        'Erro ao enviar código. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <HeaderLogo title="Crie sua conta" />

      <Image
        source={require('../../assets/login/criarcontaimage.png')}
        style={styles.illustration}
        resizeMode="contain"
      />

      <View style={styles.form}>
        <InputField
          label="Email or Phone Number"
          placeholder="Hello@tyler.com"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          leftIcon="mail-outline"
          active
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AppButton
          title={loading ? 'Enviando...' : 'Continue'}
          onPress={handleContinue}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  illustration: {
    width: '100%',
    height: 280,
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
});

// Tela de recuperação de senha que envia o código por email e direciona para redefinir.

import React, { useState, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import InputField from '../../components/InputField';
import AppButton from '../../components/AppButton';
import { Colors } from '../../constants/colors';
import { sendVerificationCode } from '../../services/auth';

export default function ForgotPasswordScreen({ route, navigation }) {
  const { email = '' } = route.params || {};
  const [emailValue, setEmailValue] = useState(email);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCode = async () => {
    if (!emailValue || !emailValue.includes('@')) {
      Alert.alert('Erro', 'Digite um email válido.');
      return;
    }

    try {
      setLoading(true);
      await sendVerificationCode(emailValue, 'password_reset');
      setResendTimer(180);
      Alert.alert('Sucesso', 'Código enviado para seu email.');
    } catch (error) {
      const msg =
        error.response?.data?.email?.[0] ||
        error.response?.data?.detail ||
        'Erro ao enviar código.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!emailValue || !emailValue.includes('@')) {
      Alert.alert('Erro', 'Digite um email válido.');
      return;
    }

    if (code.length !== 6) {
      Alert.alert('Erro', 'Digite o código de 6 dígitos.');
      return;
    }
    await verifyCode(emailValue, code, 'password_reset');
    navigation.navigate('ResetPassword', { email: emailValue, code });
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Image
          source={require('../../assets/login/esquecisenhaimage.png')}
          style={styles.illustration}
          resizeMode="contain"
        />

        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.description}>
          Digite seu email e enviaremos um código de 6 dígitos.
        </Text>
      </View>

      <View style={styles.form}>
        <InputField
          label="Email"
          placeholder="Hello@tyler.com"
          value={emailValue}
          onChangeText={setEmailValue}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
          active
        />

        <AppButton
          title={loading ? 'Enviando...' : 'Enviar código'}
          onPress={handleSendCode}
        />

        <InputField
          label="Enter Verification Code"
          placeholder="593820"
          value={code}
          onChangeText={setCode}
          leftIcon="mail-outline"
          keyboardType="numeric"
          maxLength={6}
          active
        />

        <TouchableOpacity
          style={styles.resendRow}
          onPress={handleSendCode}
          disabled={resendTimer > 0 || loading}
        >
          <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
            {resendTimer > 0 ? `Reenviar em ${formatTime(resendTimer)}` : 'Reenviar código'}
          </Text>
        </TouchableOpacity>
      </View>

      <AppButton title="Confirmar código" onPress={handleConfirm} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  illustration: {
    width: '100%',
    height: 280,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
    marginBottom: 8,
  },
  resendRow: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
  },
  resendText: {
    fontSize: 12,
    color: Colors.link,
  },
  resendDisabled: {
    color: Colors.textMuted,
  },
});

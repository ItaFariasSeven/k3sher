// Tela que recebe o código de 6 dígitos enviado por email e o valida no backend.

import React, { useState, useEffect } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import InputField from '../../components/InputField';
import AppButton from '../../components/AppButton';
import { Colors } from '../../constants/colors';
import { sendVerificationCode, verifyCode } from '../../services/auth';

export default function EmailVerificationScreen({ route, navigation }) {
  const { emailOrPhone } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(180);

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

  const handleResend = async () => {
    try {
      await sendVerificationCode(emailOrPhone, 'register');
      setResendTimer(180);
      Alert.alert('Sucesso', 'Novo código enviado.');
    } catch (error) {
      const msg =
        error.response?.data?.email?.[0] ||
        error.response?.data?.detail ||
        'Erro ao reenviar código.';
      Alert.alert('Erro', msg);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Erro', 'Digite o código de 6 dígitos.');
      return;
    }

    try {
      setLoading(true);
      await verifyCode(emailOrPhone, code, 'register');
      navigation.navigate('RegisterComplete', { emailOrPhone });
    } catch (error) {
      const msg =
        error.response?.data?.code?.[0] ||
        error.response?.data?.detail ||
        'Código inválido ou expirado.';
      Alert.alert('Erro', msg);
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
          Enviamos um código de 6 dígitos para{' '}
          <Text style={styles.highlight}>{emailOrPhone || 'Hello@tyler.com'}</Text>
        </Text>
      </View>

      <InputField
        label="Insira o código de verificação"
        placeholder="*****"
        value={code}
        onChangeText={setCode}
        leftIcon="mail-outline"
        keyboardType="numeric"
        maxLength={6}
        active
      />

      <TouchableOpacity
        style={styles.resendRow}
        onPress={handleResend}
        disabled={resendTimer > 0}
      >
        <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
          {resendTimer > 0 ? `Reenviar em ${formatTime(resendTimer)}` : 'Reenviar código'}
        </Text>
      </TouchableOpacity>

      <AppButton
        title={loading ? 'Verificando...' : 'Verificar e criar conta'}
        onPress={handleVerify}
      />

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  illustration: {
    width: '100%',
    height: 320,
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
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
  highlight: {
    color: Colors.link,
  },
  resendRow: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 16,
  },
  resendText: {
    fontSize: 12,
    color: Colors.link,
  },
  resendDisabled: {
    color: Colors.textMuted,
  },
});

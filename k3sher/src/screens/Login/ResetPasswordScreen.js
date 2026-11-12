// Tela que recebe a nova senha e a confirmação, salvando a alteração no backend.

import React, { useState } from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenContainer from '../../components/ScreenContainer';
import InputField from '../../components/InputField';
import AppButton from '../../components/AppButton';
import { Colors } from '../../constants/colors';
import { resetPassword } from '../../services/auth';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email, code } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não conferem.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email, code, password, confirmPassword);
      Alert.alert('Sucesso', 'Senha redefinida com sucesso.', [
        { text: 'OK', onPress: () => navigation.replace('Login') },
      ]);
    } catch (error) {
      const msg =
        error.response?.data?.password?.[0] ||
        error.response?.data?.code?.[0] ||
        error.response?.data?.detail ||
        'Erro ao redefinir senha.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderEyeIcon = (visible, toggle) => (
    <TouchableOpacity onPress={toggle}>
      <Ionicons
        name={visible ? 'eye-outline' : 'eye-off-outline'}
        size={20}
        color={Colors.textMuted}
      />
    </TouchableOpacity>
  );

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Image
          source={require('../../assets/login/confirmaremailimage.png')}
          style={styles.illustration}
          resizeMode="contain"
        />

        <Text style={styles.title}>Nova senha</Text>
        <Text style={styles.description}>
          Digite sua nova senha para{' '}
          <Text style={styles.highlight}>{email}</Text>
        </Text>
      </View>

      <InputField
        label="Nova senha"
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        leftIcon="lock-closed-outline"
        secureTextEntry={!showPassword}
        rightIcon={renderEyeIcon(showPassword, () => setShowPassword(!showPassword))}
        active
      />

      <InputField
        label="Confirme a nova senha"
        placeholder="********"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        leftIcon="lock-closed-outline"
        secureTextEntry={!showConfirmPassword}
        rightIcon={renderEyeIcon(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
        active
      />

      <AppButton
        title={loading ? 'Salvando...' : 'Resetar senha'}
        onPress={handleReset}
      />
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
    height: 320,
    marginBottom: 16,
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
});

// Tela final do cadastro que coleta nome, sobrenome, senha e cria a conta no backend.

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenContainer from '../../components/ScreenContainer';
import HeaderLogo from '../../components/HeaderLogo';
import InputField from '../../components/InputField';
import AppButton from '../../components/AppButton';
import { register, login } from '../../services/auth';
import { Colors } from '../../constants/colors';

export default function RegisterCompleteScreen({ navigation, route }) {
  const { emailOrPhone } = route.params || {};

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!firstName || !lastName || !password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não conferem.');
      return;
    }

    try {
      setLoading(true);
      await register({
        email: emailOrPhone,
        first_name: firstName,
        last_name: lastName,
        phone: '',
        password,
        confirm_password: confirmPassword,
      });

      await login(emailOrPhone, password);
      navigation.replace('NavBar');
    } catch (error) {
      const msg =
        error.response?.data?.email?.[0] ||
        error.response?.data?.password?.[0] ||
        error.response?.data?.detail ||
        'Erro ao criar conta.';
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
      <HeaderLogo title="Crie sua conta" />

      <View style={styles.form}>
        <InputField
          label="Primeiro nome"
          placeholder="First Name"
          value={firstName}
          onChangeText={setFirstName}
          leftIcon="person-outline"
        />

        <InputField
          label="Último nome"
          placeholder="Last Name"
          value={lastName}
          onChangeText={setLastName}
          leftIcon="person-outline"
        />

        <InputField
          label="Senha"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          leftIcon="lock-closed-outline"
          secureTextEntry={!showPassword}
          rightIcon={renderEyeIcon(showPassword, () => setShowPassword(!showPassword))}
        />

        <InputField
          label="Confirme a senha"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          leftIcon="lock-closed-outline"
          secureTextEntry={!showConfirmPassword}
          rightIcon={renderEyeIcon(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
        />

        <AppButton title={loading ? 'Criando...' : 'Continue'} onPress={handleContinue} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: { 
    width: '100%' 
  },
});

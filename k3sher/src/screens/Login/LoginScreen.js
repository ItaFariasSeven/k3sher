// Tela inicial onde o usuário entra com email e senha, autenticando no backend via JWT.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenContainer from '../../components/ScreenContainer';
import HeaderLogo from '../../components/HeaderLogo';
import InputField from '../../components/InputField';
import AppButton from '../../components/AppButton';
import SocialLogin from '../../components/SocialLogin';
import { login } from '../../services/auth';
import { Colors } from '../../constants/colors';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
  if (!email || !password) {
    Alert.alert('Erro', 'Preencha e-mail e senha.');
    return;
  }

  try {
    setLoading(true);

    const resultado = await login(email.trim(), password);

    if (!resultado.emailVerificado) {
      navigation.replace('EmailVerification', {
        emailOrPhone: email.trim(),
      });
      return;
    }

    navigation.replace('NavBar');

  } catch (error) {
    console.log('Erro no login:', error.code, error.message);

    Alert.alert(
      'Erro ao fazer login',
      error.message || 'Não foi possível entrar.'
    );

  } finally {
    setLoading(false);
  }
};
  return (
    <ScreenContainer scrollable>
      <HeaderLogo title="Seja bem vindo" />

      <View style={styles.form}>
        <InputField
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          leftIcon="mail-outline"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <InputField
          label="Senha"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          leftIcon="lock-closed-outline"
          secureTextEntry={!showPassword}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          }
        />

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.linkText}>Esqueci a senha</Text>
        </TouchableOpacity>

        <AppButton title={loading ? 'Entrando...' : 'Login'} onPress={handleLogin} />

        <SocialLogin />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Ainda não tem conta? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegisterStart')}>
          <Text style={styles.linkText}>Crie uma conta</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: { 
    width: '100%' 
  },
  forgotPassword: { 
    alignSelf: 'flex-end', 
    marginBottom: 24 
  },
  linkText: { 
    color: Colors.link, 
    fontSize: 12, 
    fontWeight: '500' 
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 'auto', 
    paddingTop: 24 
  },
  footerText: { 
    fontSize: 12, 
    color: Colors.text 
  },
});

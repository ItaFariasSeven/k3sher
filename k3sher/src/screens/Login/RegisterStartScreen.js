
import React, { useState } from 'react';
import { View, Image, StyleSheet, Alert } from 'react-native';

import ScreenContainer from '../../components/ScreenContainer';
import HeaderLogo from '../../components/HeaderLogo';
import InputField from '../../components/InputField';
import AppButton from '../../components/AppButton';

export default function RegisterStartScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handleContinue = () => {
    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !emailNormalizado.includes('@')) {
      Alert.alert('Erro', 'Digite um e-mail válido.');
      return;
    }

    navigation.navigate('RegisterComplete', {
      emailOrPhone: emailNormalizado,
    });
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
          label="E-mail"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChangeText={setEmail}
          leftIcon="mail-outline"
          active
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AppButton
          title="Continue"
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

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator,} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { entrarComGoogle } from '../services/firebaseGoogle';
import { criarSessaoBackendFirebase } from '../services/auth';

import { Colors } from '../constants/colors';

export default function SocialLogin() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
  try {
    setLoading(true);

    const user = await entrarComGoogle();

    if (!user) return;

    await criarSessaoBackendFirebase();

    navigation.replace('NavBar');

  } catch (error) {
    console.log('Erro Google:', error.code, error.message);

    Alert.alert(
      'Erro no Google',
      error.message || 'Não foi possível entrar com o Google.'
    );

  } finally {
    setLoading(false);
  }
};
  return (
    <View style={styles.container}>
      <Text style={styles.orText}>Ou continue com</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#DB4437" />
          ) : (
            <Ionicons name="logo-google" size={24} color="#DB4437" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 24,
  },
  orText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  socialBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
});

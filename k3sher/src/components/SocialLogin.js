import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { googleLogin } from '../services/auth';
import { Colors } from '../constants/colors';

export default function SocialLogin() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // IMPORTANTE: Configure com o Web Client ID do Google Cloud Console
    GoogleSignin.configure({
      webClientId: '408373430190-p1c3um1pnr27e3bui6kc7ap79fjjoe28.apps.googleusercontent.com',
      offlineAccess: true,
    });
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo.idToken;

      if (idToken) {
        // Envia o token para o backend autenticar/cadastrar o usuário
        await googleLogin(idToken);
        navigation.replace('NavBar');
      } else {
        throw new Error('Token não retornado pelo Google.');
      }
    } catch (error) {
      console.log('Erro no Google Signin:', error);
      Alert.alert('Ops!', 'Não foi possível fazer login com o Google no momento.');
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
        
        {/* Futuramente, adicione o botão da Apple aqui se for lançar para iOS */}
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
    elevation: 2, // Sombra suave no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

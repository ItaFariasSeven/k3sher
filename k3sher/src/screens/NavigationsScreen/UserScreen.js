import React, { useState, useEffect  } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ScrollView, Platform, UIManager, LayoutAnimation, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, updateProfile } from '../../services/auth';
import { Colors } from '../../constants/colors'; // Caso use arquivo de cores. Se não, os estilos abaixo têm as cores fixas.

// Habilita a animação nativa (LayoutAnimation) no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function UserScreen() {
  const [expanded, setExpanded] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  // Estados do formulário
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('mateusfarias134@gmail.com');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userData = await getProfile();
      setFirstName(userData.first_name || '');
      setLastName(userData.last_name || '');
      setEmail(userData.email || '');
      setBio(userData.bio || '');
      if (userData.avatar) {
        setImageUri(userData.avatar); // A URL da imagem que vem do backend
      }
    } catch (error) {
      console.log('Erro ao buscar perfil', error);
    }
  };

  // Função para confirmar e fechar o formulário
  const handleConfirm = async () => {
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('bio', bio);

      // Só envia a imagem se o usuário escolheu uma nova da galeria 
      // (evita reenviar a URL antiga pro backend)
      if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('avatar', {
          uri: imageUri,
          name: filename,
          type,
        });
      }

      // Chama a API
      await updateProfile(formData);

      Alert.alert('Sucesso', 'Perfil atualizado!');

      // Recolhe a sanfona
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpanded(false);

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
      console.log(error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja desconectar?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Sair', 
        style: 'destructive', 
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        }
      }
    ]);
  };

  // Função para lidar com a abertura/fechamento com transição
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // Função para pegar a foto da galeria
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Desculpe, precisamos de permissão para acessar suas fotos!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Força recorte quadrado para ficar redondo perfeito
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Cabeçalho */}
        <Text style={styles.screenTitle}>Perfil</Text>

        {/* Área da Foto e Nomes */}
        <View style={styles.profileHeader}>
          <TouchableOpacity activeOpacity={0.8} onPress={pickImage} style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="person" size={40} color="#BFDBFE" />
              </View>
            )}
            {/* Ícone de Edição */}
            <View style={styles.editIconBadge}>
              <Ionicons name="pencil" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>
            {firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Usuário K3sher'}
          </Text>
          {/* <Text style={styles.userHandle}>
            @{firstName || lastName ? `${firstName}${lastName}`.toLowerCase().replace(/\s/g, '') : 'lucasscott3'}
          </Text> */}
          <Text style={styles.userEmail}>{email}</Text>
        </View>

        {/* Bio Text */}
        <Text style={styles.bioText}>
          {bio || 'Adicione uma bio curta para o seu perfil...'}
        </Text>

        {/* Botão de Sanfona (Atualizar Dados) */}
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={toggleExpand} 
          style={[styles.accordionToggle, expanded && styles.accordionToggleExpanded]}
        >
          <Text style={styles.accordionToggleText}>Atualizar Dados</Text>
          <Ionicons 
            name={expanded ? "chevron-down" : "chevron-forward"} 
            size={20} 
            color="#9CA3AF" 
          />
        </TouchableOpacity>

        {/* Formulário Expandível */}
        {expanded && (
          <View style={styles.formContainer}>
            {/* Primeiro Nome */}
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#2563EB" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Primeiro nome"
                placeholderTextColor="#94A3B8"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            {/* Último Nome */}
            <View style={styles.inputWrapper}>
              <Ionicons name="people-outline" size={20} color="#2563EB" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Último nome"
                placeholderTextColor="#94A3B8"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            {/* Bio */}
            <View style={styles.inputWrapper}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#2563EB" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Sua Bio"
                placeholderTextColor="#94A3B8"
                value={bio}
                onChangeText={setBio}
                maxLength={150}
              />
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#2563EB" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Senha */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#2563EB" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Botão de Confirmação */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.submitButton} 
              onPress={handleConfirm}
            >
              <Text style={styles.submitButtonText}>Confirmar alteração</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={handleLogout} 
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Sair da conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA', // bg-slate-50 aproximado
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop:40
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#262626', // neutral-800
    marginBottom: 20,
    // fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF', // indigo-50
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editIconBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB', // blue-600
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FAFAFA',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#262626',
    letterSpacing: -0.5,
  },
  userHandle: {
    fontSize: 12,
    color: '#71717A', // zinc-500
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 4,
  },
  bioText: {
    fontSize: 13,
    color: '#52525B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  accordionToggle: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  accordionToggleExpanded: {
    backgroundColor: '#F5F3FF', // violet-50 (fundo sutil ao expandir)
  },
  accordionToggleText: {
    fontSize: 14,
    color: '#262626',
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
    marginTop: 8,
    gap: 10, // Espaçamento entre os inputs
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB', // gray-50
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#334155', // slate-700
    height: '100%',
  },
  submitButton: {
    backgroundColor: '#2563EB', // blue-600
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingVertical: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

import TimePickerField from '../../components/TimePickerField';
import CheckOption from '../../components/CheckOption';
import { Colors } from '../../constants/colors';
import { createPrayerRequest } from '../../services/prayers';

/*
  Dependências necessárias:
  expo install expo-notifications @react-native-community/datetimepicker
*/

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function AddPrayerRequestScreen({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState(new Date(new Date().setHours(6, 0, 0, 0)));
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [committed, setCommitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function ensureNotificationPermission() {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
    return true;
  }

  async function schedulePrayerNotification(requestId, personName) {
    const granted = await ensureNotificationPermission();
    if (!granted || !notifyEnabled) return;

    const hour = time.getHours();
    const minute = time.getMinutes();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de orar 🙏',
        body: `Não esqueça de orar por ${personName || 'este pedido'}.`,
        data: { prayerId: requestId },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  async function handleSubmit() {
    if (!name.trim() || !description.trim()) {
      Alert.alert('Erro', 'Preencha o nome e o pedido de oração.');
      return;
    }

    if (!committed) {
      Alert.alert('Erro', 'Confirme seu compromisso de oração para continuar.');
      return;
    }

    try {
      setLoading(true);

      const prayer = await createPrayerRequest({
        name: name.trim(),
        description: description.trim(),
        prayer_time: time.toISOString(),
        notify_enabled: notifyEnabled,
      });

      await schedulePrayerNotification(prayer.id, name.trim());

      Alert.alert('Sucesso', 'Pedido adicionado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        Object.values(error.response?.data || {}).flat().join('\n') ||
        'Erro ao salvar pedido.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = committed && !loading;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Adicionar pedido</Text>
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={Colors.primary} />
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite o nome"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Pedido de oração</Text>
              <View style={styles.bubble}>
                <TextInput
                  style={styles.bubbleInput}
                  placeholder="Escreva o pedido de oração..."
                  placeholderTextColor={Colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TimePickerField
              label="Adicionar Horário de oração por esse pedido"
              value={time}
              onChange={setTime}
            />

            <View style={styles.options}>
              <CheckOption
                label="Ativar Notificação"
                checked={notifyEnabled}
                onToggle={() => setNotifyEnabled(!notifyEnabled)}
              />
              <CheckOption
                label="Confirmo que vou me comprometo a orar por esse pedido"
                checked={committed}
                onToggle={() => setCommitted(!committed)}
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={canSubmit ? 0.85 : 1}
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.button, canSubmit && styles.buttonActive]}
          >
            <Text style={[styles.buttonText, canSubmit && styles.buttonTextActive]}>
              {loading ? 'Salvando...' : 'Orar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  back: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  form: {
    flex: 1,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  bubble: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderTopLeftRadius: 4,
    padding: 16,
    minHeight: 80,
  },
  bubbleInput: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  options: {
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonTextActive: {
    color: Colors.white,
  },
});
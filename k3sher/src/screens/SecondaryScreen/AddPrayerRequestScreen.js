import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, FlatList, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';

import CheckOption from '../../components/CheckOption';
import { Colors } from '../../constants/colors';
import { createPrayerRequest } from '../../services/prayers';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const HOURS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: i.toString().padStart(2, '0'),
}));

const PERIODS = [
  { value: 'AM', label: 'am' },
  { value: 'PM', label: 'pm' },
];

const WHEEL_ITEM_HEIGHT = 48;

function TimeWheel({ data, selectedIndex, onSelect }) {
  const flatListRef = useRef(null);

  const scrollToIndex = (index, animated = false) => {
    if (flatListRef.current && index >= 0 && index < data.length) {
      flatListRef.current.scrollToOffset({
        offset: index * WHEEL_ITEM_HEIGHT,
        animated,
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToIndex(selectedIndex, false), 100);
    return () => clearTimeout(timer);
  }, []);

  const onScrollEnd = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / WHEEL_ITEM_HEIGHT);
    if (index >= 0 && index < data.length) {
      onSelect(index);
      scrollToIndex(index, true);
    }
  };

  const renderItem = ({ item, index }) => {
    const distance = Math.abs(index - selectedIndex);
    const isSelected = distance === 0;
    const isAdjacent = distance === 1;

    return (
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => {
          onSelect(index);
          scrollToIndex(index, true);
        }}
        style={[styles.wheelItem, { height: WHEEL_ITEM_HEIGHT }]}
      >
        <Text
          style={[
            styles.wheelText,
            isAdjacent && styles.wheelTextAdjacent,
            isSelected && styles.wheelTextSelected,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      nestedScrollEnabled={true}
      keyExtractor={(item) => String(item.value)}
      showsVerticalScrollIndicator={false}
      snapToInterval={WHEEL_ITEM_HEIGHT}
      decelerationRate="fast"
      onMomentumScrollEnd={onScrollEnd}
      getItemLayout={(_, index) => ({
        length: WHEEL_ITEM_HEIGHT,
        offset: WHEEL_ITEM_HEIGHT * index,
        index,
      })}
      contentContainerStyle={{ paddingVertical: WHEEL_ITEM_HEIGHT * 2 }}
      renderItem={renderItem}
    />
  );
}

export default function AddPrayerRequestScreen({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hourIndex, setHourIndex] = useState(5); // 6
  const [minuteIndex, setMinuteIndex] = useState(0); // 00
  const [periodIndex, setPeriodIndex] = useState(0); // AM
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [committed, setCommitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const hour = HOURS[hourIndex].value;
  const minute = MINUTES[minuteIndex].value;
  const period = PERIODS[periodIndex].value;

  function to24Hour() {
    let h = hour;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h;
  }

  function formatBackendTime() {
    const h = to24Hour();
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  function formatDisplayTime() {
    return `${hour}:${MINUTES[minuteIndex].label} ${period.toLowerCase()}`;
  }

  async function ensureNotificationPermission() {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
    return true;
  }

  async function schedulePrayerNotification(requestId, personName) {
    if (Platform.OS === 'web') return;
    if (!notifyEnabled) return;

    const granted = await ensureNotificationPermission();
    if (!granted) return;

    const h = to24Hour();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de orar 🙏',
        body: `Não esqueça de orar por ${personName || 'este pedido'}.`,
        data: { prayerId: requestId },
      },
      trigger: {
        hour: h,
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

      const prayerTime = formatBackendTime();
      const payload = {
        title: name.trim(),
        description: description.trim(),
        prayer_time: prayerTime,
        enable_notification: notifyEnabled,
      };

      console.log('PAYLOAD ENVIADO:', payload);

      const prayer = await createPrayerRequest(payload);

      console.log('RESPOSTA DO BACKEND:', prayer);

      await schedulePrayerNotification(prayer.id, name.trim());

      Alert.alert('Sucesso', 'Pedido adicionado com sucesso!', [
        { text: 'OK', onPress: () => navigation.navigate('Requests') },
      ]);
    } catch (error) {
      console.log('ERRO AO SALVAR PEDIDO:', error);
      console.log('RESPONSE:', error.response?.data);

      const data = error.response?.data || {};
      const msg =
        data.detail ||
        data.title?.[0] ||
        data.prayer_time?.[0] ||
        data.enable_notification?.[0] ||
        data.non_field_errors?.[0] ||
        Object.values(data).flat().join('\n') ||
        'Erro ao salvar pedido.';

      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = committed && name.trim() && description.trim() && !loading;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
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

            <View style={styles.timeSection}>
              <Text style={styles.label}>
                Adicionar Horário de oração por esse pedido
              </Text>

              <View style={styles.pickerContainer}>
                <View style={styles.pickerOverlay} pointerEvents="none" />
                <View style={styles.wheel}>
                  <TimeWheel data={HOURS} selectedIndex={hourIndex} onSelect={setHourIndex} />
                </View>
                <Text style={styles.separator}>:</Text>
                <View style={styles.wheel}>
                  <TimeWheel data={MINUTES} selectedIndex={minuteIndex} onSelect={setMinuteIndex} />
                </View>
                <View style={[styles.wheel, styles.periodWheel]}>
                  <TimeWheel data={PERIODS} selectedIndex={periodIndex} onSelect={setPeriodIndex} />
                </View>
              </View>

              <Text style={styles.displayTime}>{formatDisplayTime()}</Text>
            </View>

            <View style={styles.options}>
              <CheckOption
                label="Ativar Notificação"
                checked={notifyEnabled}
                onToggle={() => setNotifyEnabled(!notifyEnabled)}
              />
              <CheckOption
                label="Confirmo que vou me comprometer a orar por esse pedido"
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
    ...Platform.select({ web: { maxHeight: '100vh' } }),
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
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
    // flex: 1,
    flexGrow: 0
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
  timeSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_ITEM_HEIGHT * 5,
    width: '100%',
    marginTop: 8,
    position: 'relative',
  },
  pickerOverlay: {
    position: 'absolute',
    top: WHEEL_ITEM_HEIGHT * 2,
    left: 12,
    right: 12,
    height: WHEEL_ITEM_HEIGHT,
    backgroundColor: 'rgba(0, 111, 253, 0.12)',
    borderRadius: 12,
    // zIndex: -1,
    zIndex: 0,
  },
  wheel: {
    width: 70,
    height: WHEEL_ITEM_HEIGHT * 5,
    zIndex: 1
  },
  periodWheel: {
    width: 60,
  },
  wheelItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontSize: 26,
    color: Colors.textMuted,
    fontWeight: '400',
    opacity: 0.45,
  },
  wheelTextAdjacent: {
    opacity: 0.7,
    fontSize: 28,
  },
  wheelTextSelected: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 34,
    opacity: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  separator: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  displayTime: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
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
    marginBottom:20
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

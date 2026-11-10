
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { Colors } from '../../constants/colors';

import { getAlarmById } from '../../services/alarmService';

import {
  playAlarmAudio,
  stopAlarmAudio,
} from '../../services/alarmAudioService';

import {
  scheduleSnoozeNotification,
} from '../../services/alarmNotificationService';

export default function AlarmRingingScreen({ route, navigation }) {
  const {
    mode = 'alarm',
    alarmId,
    time = '6:00 AM',
    label = 'Hora de orar!',
    snoozeCountUsed = 0,
  } = route.params || {};

  const [alarm, setAlarm] = useState(null);

  const [dateText, setDateText] = useState('');

  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] = useState(false);

  const [countUsed, setCountUsed] = useState(
    Number(snoozeCountUsed) || 0
  );

  useEffect(() => {
    let mounted = true;

    const now = new Date();

    setDateText(
      now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    );

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true
    );

    async function loadAlarm() {
      try {
        if (mode !== 'alarm' || !alarmId) {
          return;
        }

        const data = await getAlarmById(alarmId);

        if (!mounted) return;

        setAlarm(data);

        if (data?.soundEnabled && data?.sound?.uri) {
          try {
            await playAlarmAudio(data.sound.uri);
          } catch (error) {
            console.warn('Não foi possível reproduzir o áudio:', error);
          }
        }

      } catch (error) {
        console.error('Erro ao carregar alarme:', error);

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAlarm();

    if (mode === 'pause') {
      setLoading(false);
    }

    return () => {
      mounted = false;

      backHandler.remove();

      stopAlarmAudio();
    };
  }, [mode, alarmId]);

  function leaveScreen() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('NavBar', {
        screen: 'Alarms',
      });
    }
  }

  async function handleDismiss() {
    if (processing) return;

    setProcessing(true);

    try {
      await stopAlarmAudio();

      leaveScreen();

    } catch (error) {
      console.error('Erro ao encerrar alarme:', error);

      Alert.alert(
        'Erro',
        'Não foi possível encerrar o alarme.'
      );

    } finally {
      setProcessing(false);
    }
  }

  async function handleSnooze() {
    if (processing || !alarm) return;

    const nextCount = countUsed + 1;

    const maximum = Number(alarm.snoozeCount || 3);

    if (nextCount > maximum) {
      Alert.alert(
        'Limite atingido',
        'Você já utilizou todas as sonecas permitidas.'
      );
      return;
    }

    setProcessing(true);

    try {
      await stopAlarmAudio();

      await scheduleSnoozeNotification({
        alarmId,

        minutes: Number(alarm.snoozeMinutes || 5),

        label: alarm.label || label,

        displayTime: time,

        snoozeCountUsed: nextCount,

        soundEnabled: alarm.soundEnabled !== false,

        vibrationEnabled: alarm.vibrationEnabled !== false,
      });

      setCountUsed(nextCount);

      leaveScreen();

    } catch (error) {
      console.error('Erro ao programar soneca:', error);

      Alert.alert(
        'Erro na soneca',
        error.message || 'Não foi possível adiar o alarme.'
      );

    } finally {
      setProcessing(false);
    }
  }

  const maxSnoozes = Number(alarm?.snoozeCount ?? 3);

  const canSnooze =
    mode === 'alarm' &&
    alarm?.snoozeEnabled !== false &&
    countUsed < maxSnoozes;

  const displayLabel =
    mode === 'pause'
      ? 'Pausa para oração'
      : alarm?.label || label;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <View style={styles.topContent}>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>
              {time}
            </Text>

            <Text style={styles.dateText}>
              {dateText}
            </Text>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {displayLabel}
            </Text>

            <Text style={styles.messageSubtext}>
              {mode === 'pause'
                ? 'Reserve alguns minutos para estar com Deus.'
                : 'Chega de dormir! Vamos orar?'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomContent}>

          {canSnooze && !loading && (
            <View style={styles.snoozeContainer}>
              <TouchableOpacity
                onPress={handleSnooze}
                disabled={processing}
                style={styles.snoozeButton}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="time-outline"
                  size={24}
                  color={Colors.primary}
                />

                <Text style={styles.snoozeText}>
                  Soneca
                </Text>
              </TouchableOpacity>

              <Text style={styles.snoozeDescription}>
                {alarm.snoozeMinutes} minutos
                {' · '}
                {maxSnoozes - countUsed} restantes
              </Text>
            </View>
          )}

          {mode === 'pause' && (
            <Text style={styles.pauseDescription}>
              Seu momento de oração começou.
            </Text>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDismiss}
            disabled={processing}
            style={styles.dismissButton}
          >
            <View style={styles.dismissInner}>
              <Ionicons
                name="close"
                size={34}
                color={Colors.white}
              />
            </View>
          </TouchableOpacity>

          <Text style={styles.dismissLabel}>
            {mode === 'pause'
              ? 'Encerrar momento de paz'
              : 'Encerrar alarme'}
          </Text>

        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 55,
    paddingBottom: 35,
  },

  topContent: {
    alignItems: 'center',
    width: '100%',
  },

  timeContainer: {
    alignItems: 'center',
    gap: 8,
  },

  timeText: {
    fontSize: 54,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: 'DM Sans',
  },

  dateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'DM Sans',
    textTransform: 'capitalize',
  },

  messageBox: {
    marginTop: 105,
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 15,
  },

  messageText: {
    fontSize: 23,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },

  messageSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'DM Sans',
  },

  bottomContent: {
    alignItems: 'center',
    gap: 18,
    width: '100%',
  },

  snoozeContainer: {
    alignItems: 'center',
    gap: 7,
  },

  snoozeButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },

  snoozeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'DM Sans',
  },

  snoozeDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'DM Sans',
  },

  pauseDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: 'DM Sans',
  },

  dismissButton: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(0, 111, 253, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dismissInner: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#5B9DFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dismissLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'DM Sans',
  },
});
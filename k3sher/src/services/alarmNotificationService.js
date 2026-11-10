import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const SOURCE = 'k3sher';

function get24HourTime(alarm) {
  let hour = Number(alarm.hour);
  const minute = Number(alarm.minute);

  const period = String(alarm.period || 'am').toLowerCase();

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error('Horário do alarme inválido.');
  }

  if (period === 'pm' && hour !== 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  return { hour, minute };
}

function formatDisplayTime(alarm) {
  return `${String(alarm.hour).padStart(2, '0')}:${String(
    alarm.minute
  ).padStart(2, '0')} ${String(alarm.period).toUpperCase()}`;
}

export async function ensureNotificationPermission() {
  if (Platform.OS === 'web') {
    return false;
  }

  let permission = await Notifications.getPermissionsAsync();

  let granted =
    permission.granted ||
    permission.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL;

  if (!granted) {
    permission = await Notifications.requestPermissionsAsync();

    granted =
      permission.granted ||
      permission.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL;
  }

  return granted;
}

async function getChannelId(soundEnabled, vibrationEnabled) {
  if (Platform.OS !== 'android') {
    return undefined;
  }

  const channelId = [
    'k3sher-alarm',
    soundEnabled ? 'sound' : 'silent',
    vibrationEnabled ? 'vibration' : 'no-vibration',
  ].join('-');

  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Alarmes de oração',
    importance: Notifications.AndroidImportance.MAX,

    sound: soundEnabled ? 'default' : null,

    vibrationPattern: vibrationEnabled
      ? [0, 250, 150, 250]
      : [],

    lightColor: '#006FFD',
  });

  return channelId;
}

export async function cancelAlarmNotifications(alarmId) {
  if (Platform.OS === 'web' || !alarmId) return;

  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync();

  const matching = scheduled.filter(notification => {
    const data = notification.content?.data;

    return (
      data?.source === SOURCE &&
      String(data?.alarmId) === String(alarmId)
    );
  });

  await Promise.all(
    matching.map(notification =>
      Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      )
    )
  );
}

async function getDeliveryMode() {
  if (Platform.OS !== 'android') {
    return undefined;
  }

  try {
    const permission =
      await Notifications.getExactAlarmPermissionsAsync();

    return permission.granted
      ? 'alarmClock'
      : 'bestEffort';

  } catch {
    return 'bestEffort';
  }
}

export async function scheduleAlarmNotifications(alarm) {
  if (Platform.OS === 'web') {
    throw new Error(
      'O agendamento de alarmes precisa ser testado em Android ou iOS.'
    );
  }

  if (!alarm.enabled) {
    await cancelAlarmNotifications(alarm.id);
    return [];
  }

  const permission = await ensureNotificationPermission();

  if (!permission) {
    throw new Error(
      'Permissão de notificações não concedida.'
    );
  }

  const selectedDays = Array.isArray(alarm.days)
    ? alarm.days
    : [];

  const activeDays = selectedDays
    .map((active, index) => active ? index + 1 : null)
    .filter(Boolean);

  if (activeDays.length === 0) {
    throw new Error('Nenhum dia da semana foi selecionado.');
  }

  await cancelAlarmNotifications(alarm.id);

  const { hour, minute } = get24HourTime(alarm);

  const displayTime = formatDisplayTime(alarm);

  const channelId = await getChannelId(
    alarm.soundEnabled !== false,
    alarm.vibrationEnabled !== false
  );

  const delivery = await getDeliveryMode();

  const identifiers = [];

  for (const weekday of activeDays) {
    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    };

    if (Platform.OS === 'android') {
      trigger.channelId = channelId;
      trigger.delivery = delivery;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || 'Hora de orar',
        body: 'Chega de dormir! Vamos orar?',

        sound: soundEnabled ? 'default' : false,

        data: {
          source: SOURCE,
          kind: 'alarm',
          alarmId: String(alarm.id),
          label: alarm.label || 'Hora de orar',
          displayTime,
          snoozeCountUsed: 0,
        },
      },

      trigger,
    });

    identifiers.push(identifier);
  }

  return identifiers;
}

export async function scheduleSnoozeNotification({
  alarmId,
  minutes = 5,
  label = 'Hora de orar',
  displayTime = '',
  snoozeCountUsed = 1,
  soundEnabled = true,
  vibrationEnabled = true,
}) {
  if (Platform.OS === 'web') {
    throw new Error(
      'A soneca precisa ser testada em um dispositivo móvel.'
    );
  }

  const permission = await ensureNotificationPermission();

  if (!permission) {
    throw new Error('Permissão de notificações não concedida.');
  }

  const channelId = await getChannelId(
    soundEnabled,
    vibrationEnabled
  );

  const trigger = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: Math.max(60, Number(minutes) * 60),
  };

  if (Platform.OS === 'android') {
    trigger.channelId = channelId;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: label,
      body: `Hora de orar! Seu alarme foi adiado por ${minutes} minutos.`,

      sound: soundEnabled ? 'default' : null,

      data: {
        source: SOURCE,
        kind: 'snooze',
        alarmId: String(alarmId),
        label,
        displayTime,
        snoozeCountUsed,
      },
    },

    trigger,
  });
}

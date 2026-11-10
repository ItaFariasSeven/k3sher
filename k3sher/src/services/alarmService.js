
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from './api';

import {
  scheduleAlarmNotifications,
  cancelAlarmNotifications,
} from './alarmNotificationService';

const ALARMS_KEY = '@k3sher_alarms';

const DEFAULT_SOUND = {
  id: 'default',
  name: 'Som do sistema',
  uri: null,
};

const DEFAULT_DAYS = [true, true, true, true, true, true, true];

function getDaysFromRepeat(repeat) {
  switch (repeat) {
    case 'daily':
      return DEFAULT_DAYS;

    case 'weekdays':
      return [false, true, true, true, true, true, false];

    case 'weekends':
      return [true, false, false, false, false, false, true];

    default:
      return DEFAULT_DAYS;
  }
}

function getRepeatFromDays(days) {
  if (days.every(Boolean)) return 'daily';

  if (JSON.stringify(days) ===
      JSON.stringify([false, true, true, true, true, true, false])) {
    return 'weekdays';
  }

  if (JSON.stringify(days) ===
      JSON.stringify([true, false, false, false, false, false, true])) {
    return 'weekends';
  }

  return 'weekly';
}

function normalizeAlarm(raw) {
  const settings = raw.settings || {};

  const rawTime = String(raw.time || '06:00').slice(0, 5);

  const [rawHour, rawMinute] = rawTime.split(':');

  const hour24 = Number(rawHour);

  const savedHour = raw.hour ?? settings.hour;

  const savedMinute = raw.minute ?? settings.minute;

  const hour = savedHour != null && Number.isFinite(Number(savedHour))
    ? Number(savedHour)
    : (hour24 % 12 || 12);

  const minute =
    savedMinute != null && Number.isFinite(Number(savedMinute))
      ? Number(savedMinute)
      : Number(rawMinute || 0);

  const period =
    raw.period ||
    settings.period ||
    (hour24 >= 12 ? 'pm' : 'am');

  const savedDays = raw.days ?? settings.days;

  const days =
    Array.isArray(savedDays) && savedDays.length === 7
      ? savedDays.map(Boolean)
      : getDaysFromRepeat(raw.repeat);

  return {
    ...raw,

    id: String(raw.id),

    hour,
    minute,
    period,

    time: `${hour}:${String(minute).padStart(2, '0')}`,

    days,

    label:
      raw.label ||
      settings.label ||
      raw.title ||
      'Despertar',

    enabled:
      raw.enabled ??
      raw.is_active ??
      true,

    holidaysOff:
      raw.holidaysOff ??
      settings.holidaysOff ??
      false,

    soundEnabled:
      raw.soundEnabled ??
      settings.soundEnabled ??
      true,

    vibrationEnabled:
      raw.vibrationEnabled ??
      settings.vibrationEnabled ??
      true,

    snoozeEnabled:
      raw.snoozeEnabled ??
      settings.snoozeEnabled ??
      true,

    snoozeMinutes:
      Number(raw.snoozeMinutes ?? settings.snoozeMinutes ?? 5),

    snoozeCount:
      Number(raw.snoozeCount ?? settings.snoozeCount ?? 3),

    sound:
      raw.sound ||
      settings.sound ||
      DEFAULT_SOUND,
  };
}

function to24Hour(alarm) {
  let hour = Number(alarm.hour);

  if (alarm.period === 'pm' && hour !== 12) hour += 12;
  if (alarm.period === 'am' && hour === 12) hour = 0;

  return hour;
}

function buildBackendPayload(alarm) {
  const hour24 = to24Hour(alarm);

  const soundMetadata = alarm.sound
    ? {
        id: alarm.sound.id,
        name: alarm.sound.name,
      }
    : DEFAULT_SOUND;

  return {
    title: alarm.label,

    time: `${String(hour24).padStart(2, '0')}:${String(
      alarm.minute
    ).padStart(2, '0')}:00`,

    repeat: getRepeatFromDays(alarm.days),

    is_active: Boolean(alarm.enabled),

    settings: {
      hour: alarm.hour,
      minute: alarm.minute,
      period: alarm.period,
      days: alarm.days,

      label: alarm.label,

      holidaysOff: alarm.holidaysOff,

      soundEnabled: alarm.soundEnabled,
      vibrationEnabled: alarm.vibrationEnabled,

      snoozeEnabled: alarm.snoozeEnabled,
      snoozeMinutes: alarm.snoozeMinutes,
      snoozeCount: alarm.snoozeCount,

      sound: soundMetadata,
    },
  };
}

async function getCachedAlarms() {
  try {
    const json = await AsyncStorage.getItem(ALARMS_KEY);

    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('[alarmService] Erro ao ler cache:', error);
    return [];
  }
}

async function saveToCache(alarms) {
  await AsyncStorage.setItem(
    ALARMS_KEY,
    JSON.stringify(alarms)
  );
}

function normalizeBackendAlarm(remoteAlarm, cachedAlarms) {
  const previous = cachedAlarms.find(
    alarm =>
      String(alarm.serverId) === String(remoteAlarm.id)
  );

  const settings = remoteAlarm.settings || {};

  const time = String(remoteAlarm.time || '06:00').slice(0, 5);

  const [hour24Text, minuteText] = time.split(':');

  const hour24 = Number(hour24Text);
  const minute = Number(minuteText);

  const remote = {
    ...previous,
    ...settings,

    id: previous?.id ?? String(remoteAlarm.id),

    serverId: String(remoteAlarm.id),

    hour: settings.hour ?? (hour24 % 12 || 12),

    minute: settings.minute ?? minute,

    period: settings.period ?? (hour24 >= 12 ? 'pm' : 'am'),

    days: settings.days ?? getDaysFromRepeat(remoteAlarm.repeat),

    label: settings.label ?? remoteAlarm.title,

    enabled: remoteAlarm.is_active,

    time,

    sound: previous?.sound?.uri
      ? previous.sound
      : settings.sound || DEFAULT_SOUND,
  };

  return normalizeAlarm(remote);
}

function getSortValue(alarm) {
  return alarm.hour * 60 + alarm.minute;
}

async function syncAlarm(alarm) {
  const payload = buildBackendPayload(alarm);

  if (alarm.serverId) {
    const response = await api.patch(
      `/alarms/${alarm.serverId}/`,
      payload
    );

    return response.data;
  }

  const response = await api.post('/alarms/', payload);

  return response.data;
}

async function updateCachedAlarm(alarm) {
  const alarms = await getCachedAlarms();

  const index = alarms.findIndex(
    item => String(item.id) === String(alarm.id)
  );

  if (index >= 0) {
    alarms[index] = alarm;
  } else {
    alarms.push(alarm);
  }

  await saveToCache(alarms);
}

export async function getAlarms() {
  const cached = await getCachedAlarms();

  try {
    const response = await api.get('/alarms/');

    const remoteList = Array.isArray(response.data)
      ? response.data
      : response.data.results || [];

    const remoteAlarms = remoteList.map(item =>
      normalizeBackendAlarm(item, cached)
    );

    const remoteIds = new Set(
      remoteAlarms.map(item => String(item.serverId))
    );

    // Mantém registros locais que ainda não foram sincronizados.
    const localOnly = cached.filter(
      item =>
        !item.serverId ||
        !remoteIds.has(String(item.serverId))
    );

    const merged = [
      ...remoteAlarms,
      ...localOnly,
    ];

    const unique = [
      ...new Map(
        merged.map(item => [String(item.id), item])
      ).values(),
    ];

    unique.sort((a, b) => getSortValue(a) - getSortValue(b));

    await saveToCache(unique);

    return unique;

  } catch (error) {
    console.warn(
      '[alarmService] API indisponível; utilizando cache:',
      error.message
    );

    return cached.map(normalizeAlarm);
  }
}

export async function createAlarm(alarm) {
  const normalized = normalizeAlarm({
    ...alarm,
    id: `local-${Date.now()}`,
    serverId: null,
    createdAt: new Date().toISOString(),
  });

  // Primeiro salva localmente.
  await updateCachedAlarm(normalized);

  let saved = { ...normalized };

  let syncWarning = null;
  let scheduleWarning = null;

  // Depois tenta sincronizar.
  try {
    const remote = await syncAlarm(saved);

    saved.serverId = String(remote.id);

    await updateCachedAlarm(saved);

  } catch (error) {
    console.warn('[alarmService] Falha ao sincronizar:', error);

    syncWarning = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;
  }

  // Agendamento não pode impedir o salvamento.
  try {
    if (saved.enabled) {
      await scheduleAlarmNotifications(saved);
    }
  } catch (error) {
    console.warn('[alarmService] Falha no agendamento:', error);

    scheduleWarning = error.message;
  }

  return {
    ...saved,
    syncWarning,
    scheduleWarning,
  };
}

export async function updateAlarm(id, updates) {
  const cached = await getCachedAlarms();

  const existing = cached.find(
    alarm =>
      String(alarm.id) === String(id) ||
      String(alarm.serverId) === String(id)
  );

  if (!existing) {
    throw new Error('Alarme não encontrado.');
  }

  const updated = normalizeAlarm({
    ...existing,
    ...updates,
    id: existing.id,
    serverId: existing.serverId,
  });

  // Persiste primeiro.
  await updateCachedAlarm(updated);

  let syncWarning = null;
  let scheduleWarning = null;

  if (updated.serverId) {
    try {
      await syncAlarm(updated);
    } catch (error) {
      console.warn('[alarmService] Falha ao atualizar servidor:', error);

      syncWarning = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
    }
  }

  try {
    if (updated.enabled) {
      await scheduleAlarmNotifications(updated);
    } else {
      await cancelAlarmNotifications(updated.id);
    }
  } catch (error) {
    scheduleWarning = error.message;
  }

  return {
    ...updated,
    syncWarning,
    scheduleWarning,
  };
}

export async function toggleAlarm(id) {
  const alarms = await getCachedAlarms();

  const alarm = alarms.find(
    item => String(item.id) === String(id)
  );

  if (!alarm) {
    throw new Error('Alarme não encontrado.');
  }

  return updateAlarm(id, {
    enabled: !alarm.enabled,
  });
}

export async function deleteAlarm(id) {
  const alarms = await getCachedAlarms();

  const alarm = alarms.find(
    item =>
      String(item.id) === String(id) ||
      String(item.serverId) === String(id)
  );

  if (!alarm) return;

  await cancelAlarmNotifications(alarm.id);

  if (alarm.serverId) {
    await cancelAlarmNotifications(alarm.serverId);
  }

  await saveToCache(
    alarms.filter(
      item =>
        String(item.id) !== String(alarm.id)
    )
  );

  if (alarm.serverId) {
    try {
      await api.delete(`/alarms/${alarm.serverId}/`);
    } catch (error) {
      console.warn(
        '[alarmService] Falha ao excluir no servidor:',
        error.message
      );
    }
  }
}

export async function getAlarmById(id) {
  const alarms = await getCachedAlarms();

  return alarms.find(
    alarm =>
      String(alarm.id) === String(id) ||
      String(alarm.serverId) === String(id)
  ) || null;
}

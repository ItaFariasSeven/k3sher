import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch, ScrollView, Alert, ActivityIndicator, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { createAlarm, updateAlarm } from '../../services/alarmService';
import TimePicker from '../TimePicker';

const WEEK_DAYS = [
  { label: 'D', full: 'Dom' },
  { label: 'S', full: 'Seg' },
  { label: 'T', full: 'Ter' },
  { label: 'Q', full: 'Qua' },
  { label: 'Q', full: 'Qui' },
  { label: 'S', full: 'Sex' },
  { label: 'S', full: 'Sáb' },
];

const DEFAULT_SOUND = { id: 'default', name: 'Som do sistema', uri: null };

function getInitialAlarmValues(alarm) {
  const settings = alarm?.settings || {};

  const rawTime = String(
    alarm?.time ?? settings.time ?? '06:00'
  ).slice(0, 5);

  const [rawHour, rawMinute] = rawTime.split(':');

  const hour24 = Number(rawHour);
  const minuteFromTime = Number(rawMinute);

  const savedHour = alarm?.hour ?? settings.hour;
  const savedMinute = alarm?.minute ?? settings.minute;

  const hour = Number.isFinite(Number(savedHour))
    ? Number(savedHour)
    : (hour24 % 12 || 12);

  const minute = Number.isFinite(Number(savedMinute))
    ? Number(savedMinute)
    : (Number.isFinite(minuteFromTime) ? minuteFromTime : 0);

  const period =
    alarm?.period ??
    settings.period ??
    (hour24 >= 12 ? 'pm' : 'am');

  const savedDays = Array.isArray(alarm?.days)
    ? alarm.days
    : settings.days;

  const days = Array.isArray(savedDays) && savedDays.length === 7
    ? savedDays.map(Boolean)
    : [true, true, true, true, true, true, true];

  return {
    hour,
    minute,
    period,
    days,
    label: alarm?.label ?? settings.label ?? alarm?.title ?? 'Despertar',
    holidaysOff: alarm?.holidaysOff ?? settings.holidaysOff ?? false,
    soundEnabled: alarm?.soundEnabled ?? settings.soundEnabled ?? true,
    vibrationEnabled: alarm?.vibrationEnabled ?? settings.vibrationEnabled ?? true,
    snoozeEnabled: alarm?.snoozeEnabled ?? settings.snoozeEnabled ?? true,
    snoozeMinutes: alarm?.snoozeMinutes ?? settings.snoozeMinutes ?? 5,
    snoozeCount: alarm?.snoozeCount ?? settings.snoozeCount ?? 3,
    sound: alarm?.sound ?? settings.sound ?? DEFAULT_SOUND,
    enabled: alarm?.enabled ?? alarm?.is_active ?? true,
  };
}

function SettingRow({ label, sublabel, value, onToggle }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingTextBlock}>
        <Text style={styles.settingLabel}>{label}</Text>
        {!!sublabel && <Text style={styles.settingSublabel}>{sublabel}</Text>}
      </View>
      <Switch
        value={Boolean(value)}
        onValueChange={onToggle}
        trackColor={{ false: '#DDE2E8', true: '#8CB8FF' }}
        thumbColor={Colors.white}
        ios_backgroundColor="#DDE2E8"
      />
    </View>
  );
}

function NumberSetting({ label, value, unit, onDecrease, onIncrease, minimum, maximum }) {
  return (
    <View style={styles.numberSetting}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.numberControls}>
        <TouchableOpacity
          onPress={onDecrease}
          disabled={value <= minimum}
          style={styles.stepButton}
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label.toLowerCase()}`}
        >
          <Ionicons name="remove" size={18} color={value <= minimum ? '#BFC7D2' : Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.numberValue}>
          {value} <Text style={styles.numberUnit}>{unit}</Text>
        </Text>
        <TouchableOpacity
          onPress={onIncrease}
          disabled={value >= maximum}
          style={styles.stepButton}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label.toLowerCase()}`}
        >
          <Ionicons name="add" size={18} color={value >= maximum ? '#BFC7D2' : Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AlarmConfigScreen({ route, navigation }) {
  const { mode = 'create', alarm } = route.params || {};
  const isEdit = mode === 'edit' && Boolean(alarm);

  const initialValues = getInitialAlarmValues(alarm);

  const [hour, setHour] = useState(initialValues.hour);
  const [minute, setMinute] = useState(initialValues.minute);
  const [period, setPeriod] = useState(initialValues.period);

  const [days, setDays] = useState(initialValues.days);

  const [label, setLabel] = useState(initialValues.label);

  const [holidaysOff, setHolidaysOff] = useState(initialValues.holidaysOff);

  const [soundEnabled, setSoundEnabled] = useState(initialValues.soundEnabled);

  const [vibrationEnabled, setVibrationEnabled] = useState(initialValues.vibrationEnabled);

  const [snoozeEnabled, setSnoozeEnabled] = useState(initialValues.snoozeEnabled);

  const [snoozeMinutes, setSnoozeMinutes] = useState(initialValues.snoozeMinutes);

  const [snoozeCount, setSnoozeCount] = useState(initialValues.snoozeCount);

  const [selectedSound, setSelectedSound] = useState(initialValues.sound);
  const [saving, setSaving] = useState(false);

  // O seletor de áudio retorna o resultado pela rota, sem passar funções nos params.
  useEffect(() => {
    const sound = route.params?.selectedSound;
    if (!sound) return;

    setSelectedSound(sound);
    navigation.setParams({ selectedSound: undefined });
  }, [route.params?.selectedSound, navigation]);

  function toggleDay(index) {
    setDays((current) =>
      current.map((active, dayIndex) => (dayIndex === index ? !active : active))
    );
  }

  function handleTimeChange(next) {
    setHour(next.hour);
    setMinute(next.minute);
    setPeriod(next.period);
  }

  function handleSoundPick() {
    navigation.navigate('AlarmSoundPicker', { current: selectedSound });
  }

  function returnToAlarmList() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('NavBar', { screen: 'Alarms' });
  }

  async function handleSave() {
    if (saving) return;

    if (!label.trim()) {
      Alert.alert('Nome do alarme', 'Informe um nome para identificar este alarme.');
      return;
    }

    if (days.every((day) => !day)) {
      Alert.alert('Dias da semana', 'Selecione pelo menos um dia para o alarme.');
      return;
    }

    const payload = {
      hour,
      minute,
      period,
      time: `${hour}:${String(minute).padStart(2, '0')}`,
      days,
      label: label.trim(),
      holidaysOff,
      soundEnabled,
      vibrationEnabled,
      snoozeEnabled,
      snoozeMinutes,
      snoozeCount,
      sound: selectedSound,
      enabled: isEdit ? initialValues.enabled : true,
    };

    setSaving(true);

    try {
      // O service salva primeiro no aparelho. Falhas de notificação ou rede
      // são devolvidas como avisos, não impedem a criação do cartão.
      const savedAlarm = isEdit
        ? await updateAlarm(alarm.id, payload)
        : await createAlarm(payload);

      setSaving(false);
      returnToAlarmList();

      const warnings = [];
      if (savedAlarm?.scheduleWarning) {
        warnings.push(`O alarme foi salvo, mas não foi possível programar a notificação: ${savedAlarm.scheduleWarning}`);
      }
      if (savedAlarm?.syncWarning) {
        warnings.push(`O alarme foi salvo neste aparelho, mas não foi sincronizado com sua conta: ${savedAlarm.syncWarning}`);
      }

      if (warnings.length) {
        Alert.alert('Alarme salvo com ressalvas', warnings.join('\n\n'));
      }
    } catch (error) {
      console.error('[AlarmConfigScreen] Erro ao salvar alarme:', error);
      Alert.alert(
        'Erro ao salvar',
        error?.response?.data?.detail || error?.message || 'Não foi possível salvar o alarme.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={returnToAlarmList}
          style={styles.headerButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Voltar para alarmes"
        >
          <Ionicons name="arrow-back" size={23} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTime}>
          <Text style={styles.headerTimeText}>
            {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
          </Text>
          <Text style={styles.headerPeriod}>{period.toUpperCase()}</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={styles.doneButton}
          hitSlop={10}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Salvar alarme"
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.doneText}>Feito</Text>
          )}
        </TouchableOpacity>
      </View>

      {/*
        Um único ScrollView envolve o relógio e todas as configurações.
        Assim, o conteúdo inteiro tem uma área de rolagem limitada pela tela,
        inclusive em aparelhos menores e quando o teclado é exibido.
      */}
      <ScrollView
        style={styles.bodyScroll}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator
        scrollEnabled
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.pickerWrapper}>
          <TimePicker
            hour={hour}
            minute={minute}
            period={period}
            onChange={handleTimeChange}
          />
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetContent}>
            <View style={styles.sectionHeader}>
              <Ionicons name="alarm-outline" size={19} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Configurações do alarme</Text>
            </View>

            <Text style={styles.inputLabel}>Nome do alarme</Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Ex.: Despertar, Oração da manhã..."
              placeholderTextColor={Colors.textMuted}
              maxLength={100}
              returnKeyType="done"
              selectionColor={Colors.primary}
              style={styles.labelInput}
            />

            <View style={styles.settingGroup}>
              <Text style={styles.settingGroupTitle}>Repetir</Text>
              <View style={styles.daysContainer}>
                {WEEK_DAYS.map((day, index) => (
                  <TouchableOpacity
                    key={day.full}
                    activeOpacity={0.75}
                    onPress={() => toggleDay(index)}
                    style={[styles.dayButton, days[index] && styles.dayButtonActive]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: Boolean(days[index]) }}
                    accessibilityLabel={day.full}
                  >
                    <Text style={[styles.dayButtonText, days[index] && styles.dayButtonTextActive]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <SettingRow
              label="Desativar durante feriados"
              sublabel="A preferência fica salva. A exclusão automática depende de um calendário de feriados integrado."
              value={holidaysOff}
              onToggle={setHolidaysOff}
            />
            <SettingRow
              label="Som do alarme"
              sublabel={soundEnabled ? selectedSound.name : 'Som desativado'}
              value={soundEnabled}
              onToggle={setSoundEnabled}
            />

            <TouchableOpacity
              style={styles.soundPickerRow}
              onPress={handleSoundPick}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Escolher áudio do alarme"
            >
              <View style={styles.soundPickerIcon}>
                <Ionicons name="musical-notes-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.soundPickerText}>
                <Text style={styles.settingLabel}>Escolher áudio</Text>
                <Text style={styles.settingSublabel}>Use um arquivo de música do aparelho</Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={Colors.textMuted} />
            </TouchableOpacity>

            <SettingRow
              label="Vibração"
              sublabel="Vibrar quando o alarme for acionado"
              value={vibrationEnabled}
              onToggle={setVibrationEnabled}
            />
            <SettingRow
              label="Soneca"
              sublabel="Permitir adiar o alarme"
              value={snoozeEnabled}
              onToggle={setSnoozeEnabled}
            />

            {snoozeEnabled && (
              <View style={styles.snoozeSettings}>
                <NumberSetting
                  label="Duração da soneca"
                  value={snoozeMinutes}
                  unit="min"
                  minimum={1}
                  maximum={30}
                  onDecrease={() => setSnoozeMinutes((value) => Math.max(1, value - 1))}
                  onIncrease={() => setSnoozeMinutes((value) => Math.min(30, value + 1))}
                />
                <NumberSetting
                  label="Limite de adiamentos"
                  value={snoozeCount}
                  unit="vezes"
                  minimum={1}
                  maximum={10}
                  onDecrease={() => setSnoozeCount((value) => Math.max(1, value - 1))}
                  onIncrease={() => setSnoozeCount((value) => Math.min(10, value + 1))}
                />
              </View>
            )}

            <View style={styles.bottomNote}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.bottomNoteText}>
                O alarme é salvo no aparelho e sincronizado com sua conta quando o servidor está disponível.
                Mantenha as permissões de notificações habilitadas.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 54,
  },
  headerButton: { width: 48, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTime: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  headerTimeText: { fontSize: 21, fontWeight: '600', color: Colors.text, fontFamily: 'DM Sans' },
  headerPeriod: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'DM Sans' },
  doneButton: { minWidth: 48, minHeight: 40, alignItems: 'flex-end', justifyContent: 'center' },
  doneText: { color: Colors.primary, fontSize: 16, fontWeight: '600', fontFamily: 'DM Sans' },
  bodyScroll: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: { flexGrow: 1, paddingBottom: 28 },
  pickerWrapper: { alignItems: 'center', paddingTop: 5, paddingBottom: 17, paddingHorizontal: 12 },
  sheet: {
    width: '100%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: { paddingHorizontal: 23, paddingTop: 20, paddingBottom: 35 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, fontFamily: 'DM Sans' },
  inputLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 7, fontFamily: 'DM Sans' },
  labelInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 11,
    minHeight: 44,
    paddingHorizontal: 13,
    color: Colors.text,
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'DM Sans',
  },
  settingGroup: { paddingBottom: 17, borderBottomWidth: 0.6, borderBottomColor: Colors.border },
  settingGroupTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 13, fontFamily: 'DM Sans' },
  daysContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  dayButton: {
    flex: 1,
    maxWidth: 40,
    aspectRatio: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: { backgroundColor: Colors.primary },
  dayButtonText: { fontSize: 12, color: Colors.primary, fontWeight: '600', fontFamily: 'DM Sans' },
  dayButtonTextActive: { color: Colors.white },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 0.6,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  settingTextBlock: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: Colors.text, fontFamily: 'DM Sans' },
  settingSublabel: { fontSize: 11, color: Colors.primary, marginTop: 3, lineHeight: 16, fontFamily: 'DM Sans' },
  soundPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.6,
    borderBottomColor: Colors.border,
    gap: 11,
  },
  soundPickerIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EDF4FF', alignItems: 'center', justifyContent: 'center' },
  soundPickerText: { flex: 1 },
  snoozeSettings: { backgroundColor: '#F8FAFD', borderRadius: 13, paddingHorizontal: 13, paddingVertical: 3, marginTop: 12 },
  numberSetting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  numberControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.white, borderWidth: 1, borderColor: '#DCE8FA', alignItems: 'center', justifyContent: 'center' },
  numberValue: { minWidth: 48, textAlign: 'center', fontSize: 14, color: Colors.text, fontWeight: '600', fontFamily: 'DM Sans' },
  numberUnit: { fontSize: 10, color: Colors.textSecondary, fontWeight: '400' },
  bottomNote: { flexDirection: 'row', gap: 7, marginTop: 20, alignItems: 'flex-start' },
  bottomNoteText: { flex: 1, color: Colors.textMuted, fontSize: 10, lineHeight: 15, fontFamily: 'DM Sans' },
});

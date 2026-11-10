import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const SIZE = 248;
const CENTER = SIZE / 2;
const RADIUS = 96;

function clockPosition(index, radius) {
  const angle = (index * Math.PI) / 6 - Math.PI / 2;
  return {
    left: CENTER + Math.cos(angle) * radius - 18,
    top: CENTER + Math.sin(angle) * radius - 18,
  };
}

export default function TimePicker({ hour = 6, minute = 0, period = 'am', onChange }) {
  const [mode, setMode] = useState('hour');

  const values = useMemo(() => {
    if (mode === 'hour') return Array.from({ length: 12 }, (_, index) => index || 12);
    return Array.from({ length: 12 }, (_, index) => index * 5);
  }, [mode]);

  const selectedIndex = mode === 'hour'
    ? hour % 12
    : Math.round(minute / 5) % 12;

  function selectValue(value) {
    if (mode === 'hour') onChange?.({ hour: value, minute, period });
    else onChange?.({ hour, minute: value, period });
  }

  function changePeriod() {
    onChange?.({ hour, minute, period: period === 'am' ? 'pm' : 'am' });
  }

  function changeMinuteBy(delta) {
    const nextMinute = (minute + delta + 60) % 60;
    onChange?.({ hour, minute: nextMinute, period });
  }

  const handAngle = mode === 'hour' ? (hour % 12) * 30 : minute * 6;

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <TouchableOpacity onPress={() => setMode('hour')} accessibilityRole="button" accessibilityLabel="Selecionar hora">
          <Text style={[styles.timeValue, mode === 'hour' && styles.selectedTime]}>
            {String(hour).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.separator}>:</Text>
        <TouchableOpacity onPress={() => setMode('minute')} accessibilityRole="button" accessibilityLabel="Selecionar minutos">
          <Text style={[styles.timeValue, mode === 'minute' && styles.selectedTime]}>
            {String(minute).padStart(2, '0')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={changePeriod} style={styles.periodButton} accessibilityRole="button" accessibilityLabel="Alternar AM e PM">
          <Text style={styles.period}>{period.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>Toque em {mode === 'hour' ? 'uma hora' : 'um intervalo de minutos'} ou alterne AM/PM.</Text>
      {mode === 'minute' && (
        <View style={styles.minuteFineTune}>
          <TouchableOpacity onPress={() => changeMinuteBy(-1)} style={styles.minuteStep} accessibilityLabel="Diminuir um minuto">
            <Ionicons name="remove" size={17} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.minuteFineText}>Ajuste de 1 em 1 minuto</Text>
          <TouchableOpacity onPress={() => changeMinuteBy(1)} style={styles.minuteStep} accessibilityLabel="Aumentar um minuto">
            <Ionicons name="add" size={17} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.clock}>
        <View style={styles.clockFace} />
        <View
          pointerEvents="none"
          style={[
            styles.hand,
            {
              transform: [{ rotate: `${handAngle}deg` }],
            },
          ]}
        />
        <View style={styles.centerDot} />
        {values.map((value, index) => {
          const selected = index === selectedIndex;
          const position = clockPosition(index, RADIUS);
          return (
            <TouchableOpacity
              key={`${mode}-${value}`}
              onPress={() => selectValue(value)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.number, position, selected && styles.numberSelected]}
            >
              <Text style={[styles.numberText, selected && styles.numberTextSelected]}>
                {mode === 'minute' ? String(value).padStart(2, '0') : value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  timeValue: { fontSize: 38, fontWeight: '500', color: '#8A929D', fontFamily: 'DM Sans' },
  selectedTime: { color: Colors.text },
  separator: { fontSize: 36, color: Colors.text, marginHorizontal: 8 },
  periodButton: { marginLeft: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#EAF2FF' },
  period: { fontSize: 15, fontWeight: '600', color: Colors.primary },
  hint: { marginTop: 2, marginBottom: 12, color: Colors.textMuted, fontSize: 11 },
  minuteFineTune: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 },
  minuteStep: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF2FF' },
  minuteFineText: { color: Colors.textMuted, fontSize: 10 },
  clock: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  clockFace: { position: 'absolute', width: SIZE - 8, height: SIZE - 8, borderRadius: SIZE / 2, backgroundColor: Colors.white, borderWidth: 1, borderColor: '#E6EAF0' },
  hand: { position: 'absolute', width: 2, height: 74, top: CENTER - 74, left: CENTER - 1, backgroundColor: Colors.primary, borderRadius: 2, transformOrigin: 'bottom center' },
  centerDot: { position: 'absolute', width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary, zIndex: 2 },
  number: { position: 'absolute', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  numberSelected: { backgroundColor: Colors.primary },
  numberText: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  numberTextSelected: { color: Colors.white },
});

import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, RefreshControl, Alert, ActivityIndicator, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { getAlarms, toggleAlarm, deleteAlarm } from '../../services/alarmService';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function formatTime(alarm) {
  return `${alarm.hour}:${String(alarm.minute).padStart(2, '0')}`;
}

function AlarmCard({ alarm, onToggle, onEdit, onDelete }) {
  return (
    <View style={[styles.alarmCard, !alarm.enabled && styles.alarmCardDisabled]}>
      <TouchableOpacity
        style={styles.alarmMain}
        activeOpacity={0.8}
        onPress={onEdit}
        onLongPress={() =>
          Alert.alert(
            'Excluir alarme',
            `Deseja excluir o alarme das ${formatTime(alarm)} ${alarm.period.toUpperCase()}?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Excluir', style: 'destructive', onPress: onDelete },
            ]
          )
        }
        accessibilityRole="button"
        accessibilityLabel={`Editar alarme ${formatTime(alarm)} ${alarm.period}`}
      >
        <View style={styles.timeLine}>
          <Text style={[styles.alarmTime, !alarm.enabled && styles.disabledText]}>
            {formatTime(alarm)}
          </Text>
          <Text style={[styles.alarmPeriod, !alarm.enabled && styles.disabledText]}>
            {alarm.period.toUpperCase()}
          </Text>
        </View>

        <View style={styles.daysRow}>
          {WEEK_DAYS.map((day, index) => (
            <Text
              key={`${alarm.id}-${index}`}
              style={[
                styles.dayText,
                alarm.days[index] && alarm.enabled && styles.dayTextActive,
                !alarm.enabled && styles.disabledText,
              ]}
            >
              {day}
            </Text>
          ))}
        </View>
        <Text style={[styles.alarmLabel, !alarm.enabled && styles.disabledText]} numberOfLines={1}>
          {alarm.label || 'Alarme de oração'}
        </Text>
      </TouchableOpacity>

      <View style={styles.cardActions}>
        {/* 3 pontos de edição */}
        {/* <TouchableOpacity
          onPress={onDelete}
          style={styles.moreButton}
          accessibilityRole="button"
          accessibilityLabel="Excluir alarme"
        >
          <Ionicons name="ellipsis-vertical" size={19} color={Colors.textMuted} />
        </TouchableOpacity> */}
        <Switch
          value={Boolean(alarm.enabled)}
          onValueChange={onToggle}
          trackColor={{ false: '#DDE2E8', true: '#8CB8FF' }}
          thumbColor={Colors.white}
          ios_backgroundColor="#DDE2E8"
          accessibilityLabel="Ativar ou desativar alarme"
        />
      </View>
    </View>
  );
}

export default function AlarmsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const rootNavigation = navigation.getParent() || navigation;

  const loadAlarms = useCallback(async () => {
    try {
      const data = await getAlarms();
      setAlarms(data);
    } catch (error) {
      console.error('[AlarmsScreen] Erro ao carregar alarmes:', error);
      Alert.alert('Não foi possível carregar', 'Tente atualizar a lista novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAlarms();
    }, [loadAlarms])
  );

  async function handleToggle(id) {
    try {
      const updated = await toggleAlarm(id);
      if (updated) setAlarms((current) => current.map((item) => String(item.id) === String(id) ? updated : item));
    } catch (error) {
      console.error('[AlarmsScreen] Erro ao alternar alarme:', error);
      Alert.alert('Erro', 'Não foi possível alterar o estado deste alarme.');
    }
  }

  function handleDelete(alarm) {
    Alert.alert(
      'Excluir alarme',
      `Deseja excluir o alarme das ${formatTime(alarm)} ${alarm.period.toUpperCase()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlarm(alarm.id);
              setAlarms((current) => current.filter((item) => String(item.id) !== String(alarm.id)));
            } catch (error) {
              console.error('[AlarmsScreen] Erro ao excluir alarme:', error);
              Alert.alert('Erro', 'Não foi possível excluir o alarme.');
            }
          },
        },
      ]
    );
  }

  function handlePausePrayer() {
    rootNavigation.navigate('AlarmRinging', {
      mode: 'pause',
      label: 'Pausa para oração',
      time: 'Agora',
    });
  }

  function handleAddAlarm() {
    rootNavigation.navigate('AlarmConfig', { mode: 'create' });
  }

  function handleEditAlarm(alarm) {
    rootNavigation.navigate('AlarmConfig', { mode: 'edit', alarm });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 104 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadAlarms();
            }}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.pauseCard}>
          <View style={styles.pauseIconWrap}>
            <Ionicons name="leaf-outline" size={21} color={Colors.primary} />
          </View>
          <Text style={styles.pauseTitle}>Pausa para oração</Text>
          <Text style={styles.pauseDescription}>Reserve alguns minutos para desacelerar e estar a sós com Deus.</Text>
          <TouchableOpacity activeOpacity={0.85} onPress={handlePausePrayer} style={styles.pauseButton}>
            <Text style={styles.pauseButtonText}>Iniciar</Text>
            <Ionicons name="arrow-forward" size={15} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Alarme para oração</Text>
            <Text style={styles.sectionSubtitle}>Seus horários programados</Text>
          </View>
          <Text style={styles.alarmCount}>{alarms.length}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.emptyText}>Carregando alarmes...</Text>
          </View>
        ) : alarms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alarm-outline" size={30} color={Colors.primary} />
            <Text style={styles.emptyTitle}>Nenhum alarme configurado</Text>
            <Text style={styles.emptyText}>Toque no botão + para criar seu primeiro horário de oração.</Text>
          </View>
        ) : (
          alarms.map((alarm) => (
            <AlarmCard
              key={String(alarm.id)}
              alarm={alarm}
              onToggle={() => handleToggle(alarm.id)}
              onEdit={() => handleEditAlarm(alarm)}
              onDelete={() => handleDelete(alarm)}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleAddAlarm}
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 18 }]}
        accessibilityRole="button"
        accessibilityLabel="Adicionar alarme"
      >
        <Ionicons name="add" size={34} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#F5F7FA' 
  },
  container: { 
    flex: 1 
  },
  content: { 
    paddingHorizontal: 20, 
    paddingTop: 40 
  },
  pauseCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 22,
    alignItems: 'center',
    marginBottom: 29,
    shadowColor: '#19345B',
    shadowOffset: { 
      width: 0, 
      height: 4 
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  pauseIconWrap: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: '#EDF4FF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 10 
  },
  pauseTitle: { 
    fontSize: 19, 
    fontWeight: '600', 
    color: '#1E3A5F', 
    fontFamily: 'DM Sans' 
  },
  pauseDescription: { 
    fontSize: 12, 
    lineHeight: 18, 
    color: Colors.textSecondary,
    textAlign: 'center', 
    marginTop: 6, 
    marginBottom: 16, 
    fontFamily: 'DM Sans' 
  },
  pauseButton: { 
    minWidth: 112, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: Colors.primary, 
    borderRadius: 12, 
    paddingHorizontal: 20, paddingVertical: 11 
  },
  pauseButtonText: { 
    color: Colors.white, 
    fontSize: 13, 
    fontWeight: '600', 
    fontFamily: 'DM Sans' 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 14 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: Colors.text, 
    fontFamily: 'DM Sans' 
  },
  sectionSubtitle: { 
    marginTop: 2, 
    fontSize: 12, 
    color: Colors.textMuted, 
    fontFamily: 'DM Sans' 
  },
  alarmCount: { 
    fontSize: 12, 
    color: Colors.primary, 
    backgroundColor: '#E8F1FF', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 20, 
    overflow: 'hidden' 
  },
  alarmCard: {
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingLeft: 17,
    paddingRight: 12,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: '#19345B',
    shadowOffset: { 
      width: 0, 
      height: 2 

    },
    shadowOpacity: 0.055,
    shadowRadius: 7,
    elevation: 2,
  },
  alarmCardDisabled: { 
    backgroundColor: '#FCFCFD', 
    opacity: 0.8
  },
  alarmMain: { 
    flex: 1, 
    justifyContent: 'center', 
    minHeight: 72 
  },
  timeLine: { 
    flexDirection: 'row', 
    alignItems: 'baseline', 
    gap: 6 
  },
  alarmTime: { 
    fontSize: 31, 
    color: Colors.text, 
    fontWeight: '400', 
    fontFamily: 'DM Sans' 
  },
  alarmPeriod: { 
    fontSize: 11, 
    color: Colors.textSecondary, 
    fontFamily: 'DM Sans' 
  },
  daysRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 1 
  },
  dayText: { 
    fontSize: 10, 
    color: '#B6BEC9', 
    fontFamily: 'DM Sans' 
  },
  dayTextActive: { 
    color: Colors.primary, 
    fontWeight: '600' 
  },
  alarmLabel: { 
    marginTop: 5, 
    fontSize: 11, 
    color: Colors.textSecondary, 
    fontFamily: 'DM Sans' 
  },
  cardActions: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 5, 
    marginLeft: 8 
  },
  moreButton: { 
    width: 30, height: 26, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  disabledText: { 
    color: '#AEB6C1' 
  },
  emptyCard: { 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingVertical: 34, 
    borderRadius: 18, 
    backgroundColor: Colors.white, 
    gap: 8 
  },
  emptyTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: Colors.text, 
    fontFamily: 'DM Sans' 
  },
  emptyText: { 
    fontSize: 12, 
    lineHeight: 18, 
    color: Colors.textMuted, 
    textAlign: 'center', 
    fontFamily: 'DM Sans' 
  },
  loadingState: { 
    alignItems: 'center', 
    gap: 10, 
    paddingTop: 40 
  },
  fab: { 
    position: 'absolute', 
    right: 24, 
    width: 58, 
    height: 58, 
    borderRadius: 29, 
    backgroundColor: Colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: Colors.primary, 
    shadowOffset: { 
      width: 0, 
      height: 5 
    }, 
    shadowOpacity: 0.25, 
    shadowRadius: 8, 
    elevation: 6 
  },
});

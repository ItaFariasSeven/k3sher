import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrayerAnsweredModal from '../../components/Modal/PrayerAnsweredModal';
import { Colors } from '../../constants/colors';
import { getPrayerRequests, thankPrayerRequest } from '../../services/prayers';

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function PedidoItem({ item, onAnswer }) {
  return (
    <View style={styles.item}>
      <View style={styles.content}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.time}>{formatTime(item.prayer_time)}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onAnswer(item)}
          style={styles.checkbox}
        >
          {item.thanked && (
            <Ionicons name="checkmark" size={18} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RequestsScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  async function loadData() {
    try {
      const data = await getPrayerRequests();
      setPedidos(data.results || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  function handleOpenAnswer(prayer) {
    setSelected(prayer);
    setModalVisible(true);
  }

  async function handleThank() {
    if (!selected) return;

    try {
      await thankPrayerRequest(selected.id);

      setPedidos((prev) => prev.filter((p) => p.id !== selected.id));
      setModalVisible(false);
      setSelected(null);
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        'Erro ao registrar agradecimento. Tente novamente.';
      Alert.alert('Erro', msg);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddPrayerRequest')}
        >
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pedidos.map((item) => (
          <PedidoItem key={item.id} item={item} onAnswer={handleOpenAnswer} />
        ))}
      </ScrollView>

      <PrayerAnsweredModal
        visible={modalVisible}
        prayer={selected}
        onClose={() => {
          setModalVisible(false);
          setSelected(null);
        }}
        onThank={handleThank}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    position: 'absolute',
    right: 24,
    top: 26,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 24,
    marginVertical: 12,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: Colors.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  meta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  time: {
    fontSize: 12,
    color: Colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D6D3D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
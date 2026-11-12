import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import PrayerAnsweredModal from '../../components/Modal/PrayerAnsweredModal';
import { Colors } from '../../constants/colors';
import { getPrayerRequests, thankPrayerRequest } from '../../services/prayers';

function formatTime(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
}

function PedidoItem({ item, onAnswer }) {
  return (
    <View style={styles.item}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={18} color={Colors.white} />
      </View>

      <View style={styles.content}>
        <Text style={styles.name}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.time}>{formatTime(item.prayer_time)}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onAnswer(item)}
          style={[styles.checkbox, item.is_answered && styles.checkboxActive]}
        >
          {item.is_answered && (
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
      const results = data.results || data;

      // Filtra para mostrar APENAS os pedidos que ainda NÃO foram respondidos
      setPedidos(results.filter((p) => !p.is_answered));
    } catch (error) {
      console.log("Erro ao carregar pedidos:", error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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
      // 1. Faz a requisição pro backend confirmar o agradecimento
      await thankPrayerRequest(selected.id);

      // 2. Remove da lista atual imediatamente na UI
      setPedidos((prev) => prev.filter((p) => p.id !== selected.id));

      // 3. Fecha o modal
      setModalVisible(false);
      setSelected(null);

      // 4. Aguarda a animação do modal fechar antes de navegar
      setTimeout(() => {
        navigation.navigate('Thanks');
      }, 200);
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
    paddingTop: 40,
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
    paddingTop: 5,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});

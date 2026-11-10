import React, { useEffect, useState, useCallback  } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '../../constants/colors';
import { getThanksPrayers } from '../../services/prayers';
import { useFocusEffect } from '@react-navigation/native';

  function formatDate(dateString) {
    if (!dateString) return 'data não registrada';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

function ThanksgivingItem({ item }) {
  return (
    <View style={styles.item}>
      <View style={styles.content}>
        <Text style={styles.name}>{item.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.dateText}>
          Deus respondeu em: {formatDate(item.answered_at)}
        </Text>
      </View>
    </View>
  );
}


export default function ThanksScreen() {
  const [thanks, setThanks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const data = await getThanksPrayers();
      setThanks(data.results || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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
        <Text style={styles.title}>Agradecimentos</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {thanks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Em breve você verá aqui seus agradecimentos.
            </Text>
          </View>
        ) : (
          thanks.map((item) => (
            <ThanksgivingItem key={item.id} item={item} />
          ))
        )}
      </ScrollView>
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
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  content: {
    gap: 4,
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 120,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
});

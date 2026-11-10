import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

export default function FilterPills({ categories, selected, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filtros de tipos de mensagens:</Text>
      <View style={styles.scrollWrapper}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isActive = selected === item;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelect(item)}
                style={[styles.pill, isActive && styles.pillActive]}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#262626',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  scrollWrapper: {
    paddingLeft: 24,
  },
  list: {
    paddingRight: 24,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
});
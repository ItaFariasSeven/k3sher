import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function MessageCard({ category, text, onCopy }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.category}>{category}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onCopy(text)}
          style={styles.copyButton}
        >
          <Ionicons name="copy-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF6FF',
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  copyButton: {
    padding: 4,
  },
  text: {
    fontSize: 13,
    color: '#71717A',
    lineHeight: 20,
  },
});
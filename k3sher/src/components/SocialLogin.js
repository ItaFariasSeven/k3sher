import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function SocialLogin() {
  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.text}>Você pode conectar com</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity activeOpacity={0.8} style={styles.googleButton}>
        <Ionicons name="logo-google" size={28} color="#EA4335" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  text: {
    marginHorizontal: 12,
    fontSize: 12,
    color: Colors.textMuted,
  },
  googleButton: {
    padding: 8,
  },
});
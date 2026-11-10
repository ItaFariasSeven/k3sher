import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../constants/colors';

export default function PrayerAnsweredModal({ visible, prayer, onClose, onThank }) {
  if (!prayer) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.card}>
          <Text style={styles.title}>
            O pedido de {prayer.title} foi atendido?
          </Text>

          <Text style={styles.description} numberOfLines={3}>
            {prayer.description}
          </Text>

          <Text style={styles.call}>
            Que coisa maravilhosa, que tal agradecer ao Senhor por essa bênção?
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onThank}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Agradecer</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  call: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    height: 44,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});

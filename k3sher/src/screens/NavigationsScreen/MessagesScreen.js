import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { getMessages } from '../../services/messages';
import { Colors } from '../../constants/colors';

function MessageCard({ item }) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(item.body);
    Alert.alert('Copiado!', 'A mensagem foi copiada para a área de transferência.');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardBody} numberOfLines={5}>
        {item.body}
      </Text>
      <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
        <Ionicons name="copy-outline" size={18} color={Colors.white} />
        <Text style={styles.copyText}>Copiar</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await getMessages();
        setMessages(data.results || data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadMessages();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensagens</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((item) => (
          <MessageCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
  header: { 
    alignItems: 'center', 
    paddingTop: 16, 
    paddingBottom: 8 
  },
  title: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: Colors.text 
  },
  list: { 
    flex: 1 
  },
  listContent: {
    paddingHorizontal: 16, 
    paddingBottom: 24 
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: Colors.text, 
    marginBottom: 8 
  },
  cardBody: { 
    fontSize: 14, 
    color: Colors.textSecondary, 
    lineHeight: 20, 
    marginBottom: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  copyText: { 
    color: Colors.white, 
    fontWeight: '600', 
    fontSize: 14 
  },
});

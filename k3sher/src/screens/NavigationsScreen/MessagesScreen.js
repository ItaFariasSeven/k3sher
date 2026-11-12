import React, { useState, useMemo, useEffect  } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, ActivityIndicator  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

// Importações dos dados e subcomponentes
import { PREDEFINED_MESSAGES } from '../../data/messages';
import FilterPills from '../../components/FilterPills';
import MessageCard from '../../components/MessageCard';

export default function MessagesScreen() {
  const [selectedFilter, setSelectedFilter] = useState('Todos');
  const [messages, setMessages] = useState([]);
  const [categories, setCategories] = useState(['Todos']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      // Aqui, futuramente você fará a chamada da API:
      // const data = await getMessagesFromApi();
      const data = PREDEFINED_MESSAGES; 
      
      // Mapeia dinamicamente as categorias que vieram dos dados
      const dynamicCategories = ['Todos', ...new Set(data.map(m => m.category))];
      
      setMessages(data);
      setCategories(dynamicCategories);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as mensagens.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = useMemo(() => {
    if (selectedFilter === 'Todos') return messages;
    return messages.filter((m) => m.category === selectedFilter);
  }, [selectedFilter, messages]);

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado!', 'Mensagem copiada para a área de transferência.', [
      { text: 'OK', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensagens prontas</Text>
      </View>

      {/* Componente de Filtros */}
      <FilterPills
        categories={categories}
        selected={selectedFilter}
        onSelect={setSelectedFilter}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filteredMessages}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          renderItem={({ item }) => (
            <MessageCard 
              category={item.category} 
              text={item.text} 
              onCopy={copyToClipboard} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhuma mensagem encontrada para este filtro.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    // backgroundColor: '#F5F3FF',
    paddingVertical: 16,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    // borderBottomWidth: 1,
    // borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#262626',
    // fontFamily: 'Inter',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
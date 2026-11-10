import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

// Importações dos dados e subcomponentes
import { CATEGORIES, PREDEFINED_MESSAGES } from '../../data/messages';
import FilterPills from '../../components/FilterPills';
import MessageCard from '../../components/MessageCard';

export default function MessagesScreen() {
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  // useMemo garante que a lista só será recalculada quando o filtro mudar.
  // Excelente para performance quando se tem centenas de itens.
  const filteredMessages = useMemo(() => {
    if (selectedFilter === 'Todos') return PREDEFINED_MESSAGES;
    return PREDEFINED_MESSAGES.filter((m) => m.category === selectedFilter);
  }, [selectedFilter]);

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado!', 'Mensagem copiada para a área de transferência.', [
      { text: 'OK', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensagens prontas</Text>
      </View>

      {/* Componente de Filtros isolado */}
      <FilterPills
        categories={CATEGORIES}
        selected={selectedFilter}
        onSelect={setSelectedFilter}
      />

      {/* Lista de Mensagens Componentizada */}
      <FlatList
        data={filteredMessages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={10} // Otimização para listas grandes
        maxToRenderPerBatch={10} // Otimização para listas grandes
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#F5F3FF',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#262626',
    fontFamily: 'Inter',
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

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator, } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { createAudioPlayer } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
// import { savePickedAudio } from '../../services/alarmAudioStorage';

const DEFAULT_SOUNDS = [
  {
    id: 'default',
    name: 'Som do sistema',
    uri: null,
  },
  {
    id: 'falar_com_deus',
    name: 'Falar com Deus',
    uri: null,
  },
];

export default function AlarmSoundPickerScreen({ route, navigation }) {
  const { current } = route.params || {};

  const [sounds, setSounds] = useState(() => {
    if (current?.id && !DEFAULT_SOUNDS.some(s => s.id === current.id)) {
      return [...DEFAULT_SOUNDS, current];
    }

    return DEFAULT_SOUNDS;
  });

  const [selected, setSelected] = useState(current?.id || 'default');

  const [playingId, setPlayingId] = useState(null);

  const [loading, setLoading] = useState(false);

  const playerRef = useRef(null);

  function stopPreview() {
    const player = playerRef.current;

    if (!player) return;

    playerRef.current = null;
    setPlayingId(null);

    try {
      player.pause();
      player.release();
    } catch (error) {
      console.warn('Erro ao interromper prévia:', error);
    }
  }

  useEffect(() => {
    return () => {
      const player = playerRef.current;

      if (player) {
        try {
          player.pause();
          player.release();
        } catch (error) {
          console.warn(error);
        }

        playerRef.current = null;
      }
    };
  }, []);

  async function playPreview(sound) {
    if (!sound.uri) {
      Alert.alert(
        'Som do sistema',
        'Este som será reproduzido pelo sistema operacional.'
      );
      return;
    }

    if (playingId === sound.id) {
      stopPreview();
      return;
    }

    stopPreview();

    try {
      const player = createAudioPlayer({ uri: sound.uri });

      player.loop = false;

      playerRef.current = player;

      setPlayingId(sound.id);

      player.play();
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);

      stopPreview();

      Alert.alert(
        'Erro',
        'Não foi possível reproduzir este arquivo.'
      );
    }
  }

  async function handlePickFile() {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];

      if (
        asset.mimeType &&
        !asset.mimeType.startsWith('audio/')
      ) {
        Alert.alert('Arquivo inválido', 'Selecione um arquivo de áudio.');
        return;
      }

      const savedUri = await savePickedAudio(asset);

      // No aplicativo Android/iOS, armazenamos permanentemente.
      // Na Web, mantemos a URI temporária do navegador para prévia.
      if (Platform.OS !== 'web') {
        if (!AUDIO_DIRECTORY.exists) {
          AUDIO_DIRECTORY.create({
            idempotent: true,
            intermediates: true,
          });
        }

        const extension = asset.name.includes('.')
          ? asset.name.split('.').pop().toLowerCase()
          : 'mp3';

        const safeName = asset.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 40);

        const fileName = `${Date.now()}_${safeName}.${extension}`;

        const source = new File(asset.uri);

        const destination = new File(
          AUDIO_DIRECTORY,
          fileName
        );

        await source.copy(destination);

        savedUri = destination.uri;
      }

      const newSound = {
        id: `custom_${Date.now()}`,
        name: asset.name,
        uri: savedUri,
        mimeType: asset.mimeType || 'audio/*',
      };

      setSounds(previous => [...previous, newSound]);

      setSelected(newSound.id);

      await playPreview(newSound);

    } catch (error) {
      console.error('Erro ao importar áudio:', error);

      Alert.alert(
        'Erro',
        'Não foi possível importar o arquivo de áudio.'
      );

    } finally {
      setLoading(false);
    }
  }

  function handleSelect(sound) {
    stopPreview();

    setSelected(sound.id);

    // Retorna à tela anterior e entrega o áudio pelos parâmetros.
    navigation.popTo(
      'AlarmConfig',
      { selectedSound: sound },
      { merge: true }
    );
  }

  function renderItem({ item }) {
    const isSelected = selected === item.id;
    const isPlaying = playingId === item.id;

    return (
      <View style={styles.item}>
        <TouchableOpacity
          style={styles.selectArea}
          activeOpacity={0.7}
          onPress={() => handleSelect(item)}
        >
          <View style={styles.itemIcon}>
            <Ionicons
              name="musical-note-outline"
              size={20}
              color={Colors.primary}
            />
          </View>

          <View style={styles.itemContent}>
            <Text style={styles.itemName}>
              {item.name}
            </Text>

            <Text style={styles.itemDescription}>
              {item.id === 'default'
                ? 'Áudio padrão do aparelho'
                : 'Áudio personalizado'}
            </Text>
          </View>

          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={23}
              color={Colors.primary}
            />
          )}
        </TouchableOpacity>

        {!!item.uri && (
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => playPreview(item)}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={Colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            stopPreview();
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={Colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Som do alarme</Text>

        <View style={{ width: 35 }} />
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={handlePickFile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Ionicons
            name="folder-open-outline"
            size={21}
            color={Colors.white}
          />
        )}

        <Text style={styles.addButtonText}>
          Escolher música do aparelho
        </Text>
      </TouchableOpacity>

      <FlatList
        data={sounds}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Text style={styles.hint}>
        Selecione um áudio ou utilize o botão de reprodução
        para ouvi-lo antes.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  backButton: {
    width: 35,
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'DM Sans',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingVertical: 15,
    borderRadius: 13,
  },

  addButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'DM Sans',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 13,
    marginBottom: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  selectArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: '#EDF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemContent: {
    flex: 1,
  },

  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: 'DM Sans',
  },

  itemDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
  },

  previewButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hint: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
});

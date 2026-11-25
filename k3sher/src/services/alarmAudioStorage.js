
import { Platform } from 'react-native';

export async function savePickedAudio(asset) {
  if (!asset?.uri) {
    throw new Error('Arquivo de áudio inválido.');
  }

  // No navegador, utiliza a URI disponibilizada pelo DocumentPicker.
  if (Platform.OS === 'web') {
    return asset.uri;
  }

  // No Android/iOS, armazena uma cópia permanente.
  try {
    const {
      File,
      Directory,
      Paths,
    } = require('expo-file-system');

    const audioDirectory = new Directory(
      Paths.document,
      'alarm-audio'
    );

    if (!audioDirectory.exists) {
      audioDirectory.create({
        idempotent: true,
        intermediates: true,
      });
    }

    const originalName = asset.name || 'audio.mp3';

    const extension = originalName.includes('.')
      ? originalName.split('.').pop().toLowerCase()
      : 'mp3';

    const safeName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40) || 'audio';

    const fileName = `${Date.now()}_${safeName}.${extension}`;

    const sourceFile = new File(asset.uri);
    const destinationFile = new File(
      audioDirectory,
      fileName
    );

    await sourceFile.copy(destinationFile);

    return destinationFile.uri;

  } catch (error) {
    console.error('[alarmAudioStorage]', error);

    throw new Error(
      'Não foi possível armazenar o áudio no dispositivo.'
    );
  }
}

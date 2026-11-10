
import {
  File,
  Directory,
  Paths,
} from 'expo-file-system';

const AUDIO_FOLDER_NAME = 'alarm-audio';

export async function savePickedAudio(asset) {
  if (!asset?.uri) {
    throw new Error('Arquivo de áudio inválido.');
  }

  try {
    // Diretório privado e persistente do aplicativo.
    const audioDirectory = new Directory(
      Paths.document,
      AUDIO_FOLDER_NAME
    );

    // Cria o diretório caso ainda não exista.
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

    // Copia o áudio para o armazenamento permanente.
    await sourceFile.copy(destinationFile);

    return destinationFile.uri;

  } catch (error) {
    console.error(
      '[alarmAudioStorage] Erro ao armazenar áudio:',
      error
    );

    throw new Error(
      'Não foi possível armazenar o arquivo de áudio.'
    );
  }
}

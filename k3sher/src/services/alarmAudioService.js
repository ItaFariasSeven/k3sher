
import {
  createAudioPlayer,
  setAudioModeAsync,
} from 'expo-audio';

let activePlayer = null;

export async function playAlarmAudio(uri) {
  await stopAlarmAudio();

  if (!uri) {
    return false;
  }

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
    });

    const player = createAudioPlayer({ uri });

    player.loop = true;

    activePlayer = player;

    player.play();

    return true;
  } catch (error) {
    console.error('[alarmAudioService] Erro:', error);

    await stopAlarmAudio();

    throw error;
  }
}

export async function stopAlarmAudio() {
  if (!activePlayer) return;

  const player = activePlayer;

  activePlayer = null;

  try {
    player.pause();
    player.release();
  } catch (error) {
    console.warn(
      '[alarmAudioService] Erro ao liberar áudio:',
      error
    );
  }
}


export async function savePickedAudio(asset) {
  if (!asset?.uri) {
    throw new Error('Arquivo de áudio inválido.');
  }

  // No navegador, o DocumentPicker fornece uma URI Blob.
  // Ela pode ser reproduzida pelo expo-audio durante a sessão.

  return asset.uri;
}
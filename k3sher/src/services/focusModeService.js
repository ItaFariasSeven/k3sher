import { Platform } from 'react-native';

/**
 * O modo de paz mantém a interface do K3SHER ativa, mas não bloqueia o aparelho
 * nem altera globalmente o Não Perturbe. Essas ações dependem de APIs nativas e
 * de autorização do usuário; no iOS, um app comum não pode ativar o Foco do sistema.
 */
export function getFocusModeCapabilities() {
  return {
    platform: Platform.OS,
    canKeepAppAwake: true,
    canChangeSystemDoNotDisturb: false,
    canBlockCalls: false,
  };
}

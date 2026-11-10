# Ajuste de dependências para Expo SDK 58

No `package.json` do K3SHER:

1. Remova a dependência `expo-av`.
2. Instale os pacotes compatíveis com o SDK:

```bash
npx expo install expo-audio expo-file-system expo-keep-awake
```

`expo-notifications`, `expo-document-picker`, `expo`, React Native e React Navigation já estão declarados no `package.json` fornecido.

# Módulo de alarmes K3SHER — Expo SDK 58

Este pacote substitui a implementação inicial das telas e serviços de alarme. Ele foi escrito para a estrutura de pastas apresentada no projeto e mantém a rota `Alarms` dentro do `NavBar`.

## 1. Arquivos incluídos

Copie os arquivos da pasta `src/` para os mesmos caminhos do seu projeto. O arquivo `App.notifications.integration.js` contém a integração que deve ser aplicada ao seu `App.js` atual; preserve as demais telas e imports que não aparecem nele. O arquivo `src/services/api.js` substitui o serviço de API atual ou pode ser mesclado com ele caso existam interceptors adicionais.

A pasta `backend/alarms/` contém os arquivos Django atualizados para aceitar o campo JSON `settings` mantendo os campos anteriores (`title`, `time`, `repeat`, `is_active`).

## 2. Dependências

Seu projeto declara Expo SDK 58. Para alinhar as bibliotecas nativas ao SDK, execute:

```bash
npx expo install expo-audio expo-file-system expo-keep-awake
```

Remova `expo-av` do `package.json`; o código deste módulo usa `expo-audio`. Não fixe manualmente versões de pacotes Expo: `expo install` escolhe as versões compatíveis com o SDK do projeto.

Depois valide:

```bash
npx expo install --check
npx expo-doctor
```

## 3. Configuração nativa

Mescle `app.config.additions.json` com o `app.json` ou `app.config.js` existente. Não substitua o arquivo inteiro: preserve `name`, `slug`, `scheme`, ícones, identificadores e outros plugins que seu app já utiliza.

As permissões `SCHEDULE_EXACT_ALARM` e `VIBRATE` são adicionadas para Android. A permissão de alarme exato pode exigir que o usuário autorize o acesso nas configurações do Android. Se a autorização não existir, o módulo agenda com entrega aproximada (`bestEffort`).

Como há alterações de configuração nativa, gere um novo development build; reiniciar apenas o Metro/Expo Go não incorpora essas mudanças:

```bash
npx expo prebuild
npx expo run:android
```

Para iOS, use um Mac com Xcode e gere um novo build após instalar e configurar os plugins.

## 4. URL do Django

O `127.0.0.1` do computador não é o mesmo `127.0.0.1` do celular físico ou do emulador Android. Configure `EXPO_PUBLIC_API_URL` em `.env`:

- Android Emulator: `http://10.0.2.2:8000/api`
- iOS Simulator: `http://127.0.0.1:8000/api`
- Celular físico: `http://IP_LAN_DO_COMPUTADOR:8000/api`

O servidor Django também precisa aceitar conexões da rede local (`ALLOWED_HOSTS`, firewall e, durante desenvolvimento, `runserver 0.0.0.0:8000`). Não coloque tokens ou senhas no prefixo `EXPO_PUBLIC_`.

## 5. Backend Django

Substitua/mescle `models.py`, `serializers.py` e `views.py` com os arquivos desta pasta. Depois rode dentro do backend:

```bash
python manage.py makemigrations alarms
python manage.py migrate
```

O exemplo pressupõe que o app Django se chama `alarms` e que as URLs já incluem `alarms.urls` em `/api/alarms/`, como no código enviado. Se o app tiver outro nome, ajuste o comando de migração.

As preferências são persistidas em `settings`:

```json
{
  "days": [true, true, true, true, true, true, true],
  "holidaysOff": false,
  "soundEnabled": true,
  "vibrationEnabled": true,
  "snoozeEnabled": true,
  "snoozeMinutes": 5,
  "snoozeCount": 3,
  "sound": { "id": "default", "name": "Som do sistema", "uri": null }
}
```

O endereço `uri` da música do usuário permanece somente no armazenamento local. O caminho é específico do dispositivo e não deve ser sincronizado como se fosse um arquivo disponível em outros aparelhos.

## 6. Comportamento implementado e limites reais

- Alarmes semanais: um agendamento por dia selecionado, com identificadores próprios para permitir cancelar e reagendar.
- Soneca: notificação avulsa, intervalo configurável e limite de repetições. A contagem é transportada no payload da notificação.
- Som personalizado: arquivo copiado para `Paths.document`, portanto não depende do cache temporário do seletor. A reprodução em loop ocorre quando a tela do alarme está ativa e o app consegue executar áudio.
- Notificações: ao receber em primeiro plano, o app abre a tela de alarme; em segundo plano, o usuário precisa tocar na notificação para abrir a tela. Expo Notifications não transforma, por si só, uma notificação local em uma Activity full-screen confiável nos dois sistemas.
- Ao pressionar o botão X de um alarme, o alarme recorrente é desativado e seus próximos agendamentos são cancelados. No modo de pausa, o botão apenas encerra a sessão.
- Modo de paz: a tela impede o retorno pelo botão físico e mantém o app acordado. Ela não bloqueia o aparelho, não bloqueia chamadas e não ativa globalmente o Não Perturbe. Essa integração exigiria implementação nativa específica e autorização do usuário; no iOS, apps comuns não podem ativar livremente o modo Foco.
- Feriados: a preferência `holidaysOff` é armazenada e sincronizada, mas **a exclusão automática ainda não está implementada**. O modelo atual não tem uma fonte de feriados nem datas de exceção. Um gatilho semanal nativo não oferece uma lista de datas a excluir. Não trate esse switch como funcional até integrar um calendário confiável e uma estratégia de agendamento que respeite os limites de notificações pendentes de cada plataforma.
- Música durante o alarme em segundo plano: o arquivo escolhido não pode ser usado automaticamente como som de notificação do sistema. Para isso, a plataforma exige recursos de som empacotados no binário/canal. Este pacote toca o arquivo escolhido quando o player do K3SHER está em execução; a notificação agendada usa o som do sistema.

## 7. Checklist de validação

1. Criar um alarme para 2 ou 3 minutos à frente e verificar permissão de notificações e alarme exato.
2. Criar um alarme semanal em um único dia e confirmar que somente aquele dia está agendado.
3. Editar horário/dias e verificar se os agendamentos antigos foram cancelados.
4. Desativar e excluir um alarme; confirmar que notificações futuras daquele identificador sumiram.
5. Importar um áudio, fechar o app, reabrir o seletor e confirmar que o arquivo ainda existe.
6. Testar a soneca várias vezes e validar que o limite definido é respeitado.
7. Tocar na notificação com o app em segundo plano e confirmar a abertura de `AlarmRinging`.
8. Testar a execução em aparelho físico Android e iOS. Emulador e Expo Go não reproduzem todas as condições de um alarme de produção.

## 8. Pendências antes de publicar

- Integrar uma fonte oficial de feriados nacionais/estaduais/municipais e implementar exceções de agenda.
- Definir se a música personalizada precisa tocar com o app encerrado; isso demanda solução nativa específica, com testes por fabricante/versão do Android e revisão das restrições do iOS.
- Definir estratégia de sincronização offline (fila de operações) se alarmes criados sem rede precisarem ser enviados ao backend depois.
- Revisar a política de permissões de alarmes exatos do Google Play para a categoria final do app.

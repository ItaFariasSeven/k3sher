import React, { useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './src/screens/Login/LoginScreen';
import RegisterStartScreen from './src/screens/Login/RegisterStartScreen';
import EmailVerificationScreen from './src/screens/Login/EmailVerificationScreen';
import RegisterCompleteScreen from './src/screens/Login/RegisterCompleteScreen';
import ForgotPasswordScreen from './src/screens/Login/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/Login/ResetPasswordScreen';
import NavBar from './src/components/NavBar';
import AddPrayerRequestScreen from './src/screens/SecondaryScreen/AddPrayerRequestScreen';
import AlarmConfigScreen from './src/components/subScreen/AlarmConfigScreen';
import AlarmRingingScreen from './src/components/subScreen/AlarmRingingScreen';
import AlarmSoundPickerScreen from './src/components/subScreen/AlarmSoundPickerScreen';

const SEU_IP_LOCAL = '192.168.1.15'; 
// const socket = io(`http://${SEU_IP_LOCAL}:3000`);

const Stack = createStackNavigator();
const navigationRef = createNavigationContainerRef();

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function navigateToAlarmRinging(response, pendingResponseRef) {
  if (!response) return;

  const notification = response.notification;
  const content = notification?.request?.content;
  const data = content?.data || {};

  if (!data.alarmId) return;

  if (!navigationRef.isReady()) {
    pendingResponseRef.current = response;
    return;
  }

  navigationRef.navigate('AlarmRinging', {
    mode: 'alarm',
    alarmId: String(data.alarmId),
    time: data.displayTime || '6:00 AM',
    label: data.label || content.title || 'Hora de orar!',
    snoozeCountUsed: Number(data.snoozeCountUsed || 0),
  });

  Notifications.clearLastNotificationResponseAsync().catch(
    error => console.warn('Erro ao limpar resposta:', error)
  );
}

export default function App() {

  const pendingResponseRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    socket.on('nova_notificacao', async (dadosServidor) => {
      console.log('Sinal recebido do backend:', dadosServidor);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: dadosServidor.titulo,
          body: dadosServidor.corpo,
          data: dadosServidor.dados, // Se o backend enviar alarmId aqui, a tela de alarme vai abrir ao clicar!
        },
        trigger: null, // Dispara na hora
      });
    });

    return () => {
      socket.off('nova_notificacao'); // Limpa o listener ao desmontar
    };
  }, []);

  // SEU USEEFFECT ORIGINAL: Lida com o clique na notificação
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        (response) => {
          navigateToAlarmRinging(response, pendingResponseRef);
        }
      );

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          navigateToAlarmRinging(response, pendingResponseRef);
        }
      })
      .catch((error) => {
        console.warn(
          'Erro ao recuperar última notificação:',
          error
        );
      });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer 
        ref={navigationRef} 
        onReady={() => {
          const pending = pendingResponseRef.current;

          if (pending) {
            pendingResponseRef.current = null;

            navigateToAlarmRinging(
              pending,
              pendingResponseRef
            );
          }
        }}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RegisterStart" component={RegisterStartScreen} />
          <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          <Stack.Screen name="RegisterComplete" component={RegisterCompleteScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="NavBar" component={NavBar} />
          <Stack.Screen name="AddPrayerRequest" component={AddPrayerRequestScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AlarmConfig" component={AlarmConfigScreen} />
          <Stack.Screen name="AlarmRinging" component={AlarmRingingScreen} />
          <Stack.Screen name="AlarmSoundPicker" component={AlarmSoundPickerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
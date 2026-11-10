import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationContainer } from '@react-navigation/native';
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
import { configureNotificationChannels } from './src/services/alarmNotificationService';

const Stack = createStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function notificationToRouteParams(notification) {
  const data = notification?.request?.content?.data || {};
  if (data.type !== 'K3SHER_ALARM' || data.mode !== 'alarm' || !data.alarmId) return null;

  return {
    mode: 'alarm',
    alarmId: String(data.alarmId),
    time: data.displayTime || 'Hora de orar',
    label: data.label || notification.request.content.title || 'Hora de orar',
    snoozeCount: Number(data.snoozeCount || 0),
    occurrenceKey: data.occurrenceKey,
    soundEnabled: data.soundEnabled,
    vibrationEnabled: data.vibrationEnabled,
  };
}

export default function App() {
  const navigationRef = useRef(null);
  const pendingAlarmRef = useRef(null);

  function openAlarmFromNotification(notification) {
    const params = notificationToRouteParams(notification);
    if (!params) return;

    if (navigationRef.current?.isReady()) {
      navigationRef.current.navigate('AlarmRinging', params);
    } else {
      pendingAlarmRef.current = params;
    }
  }

  useEffect(() => {
    configureNotificationChannels().catch((error) => {
      console.error('[App] Falha ao configurar canais de notificação:', error);
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      // Quando o app já está aberto, o alarme pode abrir a tela diretamente.
      openAlarmFromNotification(notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openAlarmFromNotification(response.notification);
      Notifications.clearLastNotificationResponseAsync().catch(() => {});
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  async function handleNavigationReady() {
    if (pendingAlarmRef.current) {
      navigationRef.current?.navigate('AlarmRinging', pendingAlarmRef.current);
      pendingAlarmRef.current = null;
      return;
    }

    try {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastResponse) {
        openAlarmFromNotification(lastResponse.notification);
        await Notifications.clearLastNotificationResponseAsync();
      }
    } catch (error) {
      console.warn('[App] Não foi possível recuperar a resposta da notificação:', error);
    }
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RegisterStart" component={RegisterStartScreen} />
          <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
          <Stack.Screen name="RegisterComplete" component={RegisterCompleteScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="NavBar" component={NavBar} />
          <Stack.Screen name="AddPrayerRequest" component={AddPrayerRequestScreen} />
          <Stack.Screen name="AlarmConfig" component={AlarmConfigScreen} />
          <Stack.Screen name="AlarmRinging" component={AlarmRingingScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="AlarmSoundPicker" component={AlarmSoundPickerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

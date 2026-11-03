import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './src/screens/Login/LoginScreen';
import RegisterStartScreen from './src/screens/Login/RegisterStartScreen';
import EmailVerificationScreen from './src/screens/Login/EmailVerificationScreen';
import RegisterCompleteScreen from './src/screens/Login/RegisterCompleteScreen';
import ForgotPasswordScreen from './src/screens/Login/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/Login/ResetPasswordScreen';
import NavBar from './src/components/NavBar';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import RequestsScreen from '../screens/NavigationsScreen/RequestsScreen';
import ThanksScreen from '../screens/NavigationsScreen/ThanksScreen';
import AlarmsScreen from '../screens/NavigationsScreen/AlarmsScreen';
import UserScreen from '../screens/NavigationsScreen/UserScreen';
import MessagesScreen from '../screens/NavigationsScreen/MessagesScreen';
import ButtonNavBar from './ButtonNavBar';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Requests', label: 'Pedidos', icon: 'chatbubble', family: 'Ionicons' },
  { name: 'Thanks', label: 'Agradecimentos', icon: 'human-handsup', family: 'MaterialCommunityIcons' },
  { name: 'Alarms', label: 'Alarmes', icon: 'alarm', family: 'Ionicons' },
  { name: 'User', label: 'Usuário', icon: 'person', family: 'Ionicons' },
  { name: 'Messages', label: 'Mensagens', icon: 'paper-plane', family: 'Ionicons' },
];

export default function NavBar() {
  return (
    <Tab.Navigator
      tabBar={(props) => <ButtonNavBar {...props} tabs={TABS} />}
      screenOptions={{ headerShown: false }}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={getScreenComponent(tab.name)}
        />
      ))}
    </Tab.Navigator>
  );
}

function getScreenComponent(name) {
  switch (name) {
    case 'Requests':
      return RequestsScreen;
    case 'Thanks':
      return ThanksScreen;
    case 'Alarms':
      return AlarmsScreen;
    case 'User':
      return UserScreen;
    case 'Messages':
      return MessagesScreen;
    default:
      return RequestsScreen;
  }
}

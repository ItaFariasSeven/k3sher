import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import RequestsScreen from '../screens/NavigationsScreen/RequestsScreen';
import ThanksScreen from '../screens/NavigationsScreen/ThanksScreen';
import AlarmsScreen from '../screens/NavigationsScreen/AlarmsScreen';
import UserScreen from '../screens/NavigationsScreen/UserScreen';
import MessagesScreen from '../screens/NavigationsScreen/MessagesScreen';
import ButtonNavBar from './ButtonNavBar';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Requests', label: 'Pedidos', icon: 'chatbubble', family: 'Ionicons', component: RequestsScreen },
  { name: 'Thanks', label: 'Agradecimentos', icon: 'human-handsup', family: 'MaterialCommunityIcons', component: ThanksScreen },
  { name: 'Alarms', label: 'Alarmes', icon: 'alarm', family: 'Ionicons', component: AlarmsScreen },
  { name: 'User', label: 'Usuário', icon: 'person', family: 'Ionicons', component: UserScreen },
  { name: 'Messages', label: 'Mensagens', icon: 'paper-plane', family: 'Ionicons', component: MessagesScreen },
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
          component={tab.component}
        />
      ))}
    </Tab.Navigator>
  );
}
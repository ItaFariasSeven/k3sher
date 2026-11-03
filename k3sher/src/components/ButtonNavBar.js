import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

function renderIcon(family, name, color) {
  if (family === 'MaterialCommunityIcons') {
    return <MaterialCommunityIcons name={name} size={22} color={color} />;
  }
  return <Ionicons name={name} size={22} color={color} />;
}

export default function BottomNavBar({ state, descriptors, navigation, tabs }) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tabConfig = tabs.find((t) => t.name === route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabBarItem
            key={route.key}
            label={options.tabBarLabel || tabConfig?.label || route.name}
            icon={tabConfig?.icon}
            family={tabConfig?.family || 'Ionicons'}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

function TabBarItem({ label, icon, family, isFocused, onPress, onLongPress }) {
  const scale = useRef(new Animated.Value(isFocused ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isFocused ? 1.15 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const activeColor = Colors.primary;
  const inactiveColor = Colors.textMuted;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {renderIcon(family, icon, isFocused ? activeColor : inactiveColor)}
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: isFocused ? activeColor : inactiveColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

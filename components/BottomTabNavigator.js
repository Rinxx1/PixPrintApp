import React from 'react';
import { Platform, View } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/Main/DashboardScreen';
import CalendarScreen from '../screens/Main/CalendarScreen';
import GalleryScreen from '../screens/Main/GalleryScreen';
import SettingsScreen from '../screens/Main/SettingsScreen';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
    const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // 🔥 hide labels
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#fff',
          elevation: 8,
          height:  Platform.OS === 'ios' ? 65 : 64,
          borderRadius: 40,
          marginHorizontal: 28,
          marginBottom: Platform.OS === 'ios' ? 28 : 38,
          paddingBottom: Platform.OS === 'ios' ? 20 : 1,
          paddingTop: Platform.OS === 'ios' ? 15 : 14,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'home';
          // if (route.name === 'Calendar') iconName = 'calendar';
          if (route.name === 'Gallery') iconName = 'images';
          if (route.name === 'Settings') iconName = 'settings';          return (
            <Ionicons
              name={iconName}
              size={focused ? 28 : 24}
              color={focused ? '#48C6EF' : '#B0B0B0'}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      {/* <Tab.Screen name="Calendar" component={CalendarScreen} /> */}
      <Tab.Screen name="Gallery" component={GalleryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function BottomTabNavigatorWrapper() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, ...TransitionPresets.SlideFromRightIOS }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
    </Stack.Navigator>
  );
}

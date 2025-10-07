import React from 'react';
import { Platform, View, Text } from 'react-native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/Main/DashboardScreen';
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
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E1E1E1',
          height: 50 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          paddingHorizontal: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let label;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
            label = 'Home';
          }
          if (route.name === 'Gallery') {
            iconName = focused ? 'images' : 'images-outline';
            label = 'Gallery';
          }
          if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
            label = 'Settings';
          }
          
          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 4,
              minWidth: 70,
              width: '100%',
            }}>
              <Ionicons
                name={iconName}
                size={24}
                color={focused ? '#48C6EF' : '#8E8E93'}
              />
              <Text 
                style={{
                  fontSize: 11,
                  fontWeight: focused ? '600' : '400',
                  color: focused ? '#48C6EF' : '#8E8E93',
                  marginTop: 4,
                  letterSpacing: 0.1,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {label}
              </Text>
            </View>
          );
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          paddingHorizontal: 4,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
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

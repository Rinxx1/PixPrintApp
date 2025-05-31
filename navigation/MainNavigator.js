// navigation/MainNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import SignInScreen from '../screens/SignInScreen';  // Import your screens
import SignUpScreen from '../screens/SignUpScreen';  // Import your screens
import BottomTabNavigatorWrapper from '../components/BottomTabNavigator';  // Import your tabs

const Stack = createNativeStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Tabs" component={BottomTabNavigatorWrapper} />
    </Stack.Navigator>
  );
}

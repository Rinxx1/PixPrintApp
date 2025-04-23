import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';

import SplashAnimation from './screens/SplashAnimation'; // NEW animation screen
import MainScreen from './screens/MainScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import ContinueAsGuestScreen from './screens/ContinueAsGuestScreen';
import NewEventScreen from './screens/NewEventScreen';
import JoinEventScreen from './screens/JoinEventScreen';
import CameraScreen from './screens/CameraScreen';
import ChooseFrameScreen from './screens/ChooseFrameScreen';
import BottomTabNavigatorWrapper from './components/BottomTabNavigator'; // adjust path if needed
import PersonalInfoScreen from './screens/PersonalInfoScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import TermsAndConditionsScreen from './screens/TermsAndConditionsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import HelpSupportScreen from './screens/HelpSupportScreen';


const Stack = createNativeStackNavigator();

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
      await SplashScreen.hideAsync();
      setAppReady(true);
    }
    prepare();
  }, []);

  if (!appReady) return null;

  if (showSplash) {
    return <SplashAnimation onDone={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ContinueAsGuest" component={ContinueAsGuestScreen} />
        <Stack.Screen name="Tabs" component={BottomTabNavigatorWrapper} />
        <Stack.Screen name="NewEvent" component={NewEventScreen} />
        <Stack.Screen name="JoinEvent" component={JoinEventScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="ChooseFrame" component={ChooseFrameScreen} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
        <Stack.Screen name='ChangePassword' component={ChangePasswordScreen}/>
        <Stack.Screen name='Terms&Condition' component={TermsAndConditionsScreen}/>
        <Stack.Screen name='PrivacyPolicy' component={PrivacyPolicyScreen}/>
        <Stack.Screen name='HelpSupport' component={HelpSupportScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

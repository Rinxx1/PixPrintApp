import React, { useEffect, useState, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, AuthContext } from './context/authContext';

import SplashAnimation from './screens/SplashAnimation';
import MainScreen from './screens/MainScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import ContinueAsGuestScreen from './screens/ContinueAsGuestScreen';
import NewEventScreen from './screens/Main/NewEventScreen';
import JoinEventScreen from './screens/Main/JoinEventScreen';
import CameraScreen from './screens/Main/CameraScreen';
import ChooseFrameScreen from './screens/Main/ChooseFrameScreen';
import BottomTabNavigatorWrapper from './components/BottomTabNavigator';
import PersonalInfoScreen from './screens/Main/PersonalInfoScreen';
import ChangePasswordScreen from './screens/Main/ChangePasswordScreen';
import TermsAndConditionsScreen from './screens/Main/TermsAndConditionsScreen';
import PrivacyPolicyScreen from './screens/Main/PrivacyPolicyScreen';
import HelpSupportScreen from './screens/Main/HelpSupportScreen';
import AddMoreCreditsScreen from './screens/Main/AddMoreCreditsScreen';
import JoinEventScreenTwo from './screens/Main/JoinEventScreenTwo';
import JoinEventSettings from './screens/Main/JoinEventSettings';
import { AlertProvider } from './context/AlertContext';

const Stack = createNativeStackNavigator();

// Create a separate component to handle navigation logic
function AppNavigator() {
  const { user, isLoading, justCreatedAccount, clearAccountCreatedFlag } = useContext(AuthContext);

  // Clear the flag when component mounts and user just created account
  useEffect(() => {
    if (justCreatedAccount && user) {
      clearAccountCreatedFlag();
    }
  }, [justCreatedAccount, user, clearAccountCreatedFlag]);

  if (isLoading) {
    // Show loading screen while checking auth state
    return null;
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? "Tabs" : "Main"}
    >
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
      <Stack.Screen name='ChangePassword' component={ChangePasswordScreen} />
      <Stack.Screen name='Terms&Condition' component={TermsAndConditionsScreen} />
      <Stack.Screen name='PrivacyPolicy' component={PrivacyPolicyScreen} />
      <Stack.Screen name='HelpSupport' component={HelpSupportScreen} />
      <Stack.Screen name='AddMoreCredits' component={AddMoreCreditsScreen} />
      <Stack.Screen name='JoinEventTwo' component={JoinEventScreenTwo} />
      <Stack.Screen name='JoinEventSettings' component={JoinEventSettings} />
    </Stack.Navigator>
  );
}

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
      <AuthProvider>
        <AlertProvider>
          <AppNavigator />
        </AlertProvider>
      </AuthProvider>
    </NavigationContainer>
  );
}
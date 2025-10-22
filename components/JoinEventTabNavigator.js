import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JoinEventScreenTwo from '../screens/Main/JoinEventScreenTwo';
import CameraScreen from '../screens/Main/CameraScreen';
import JoinEventSettings from '../screens/Main/JoinEventSettings';
import JoinEventBottomNavigator from './JoinEventBottomNavigator';

const Tab = createBottomTabNavigator();

export default function JoinEventTabNavigator({ route, navigation }) {
  const { eventId, username } = route.params || {};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => (
        <JoinEventBottomNavigator
          {...props}
          eventId={eventId}
          guestUsername={username}
        />
      )}
      initialRouteName="Gallery"
    >
      <Tab.Screen 
        name="Gallery" 
        component={JoinEventScreenTwo}
        initialParams={{ eventId, username }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        initialParams={{ eventId, username }}
      />
      <Tab.Screen 
        name="EventSettings" 
        component={JoinEventSettings}
        initialParams={{ eventId, username }}
      />
    </Tab.Navigator>
  );
}

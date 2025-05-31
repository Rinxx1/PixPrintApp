import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavBar({ navigation, active = 'Dashboard' }) {
  const handleTabPress = (tab) => {
    switch (tab) {
      case 'Dashboard':
        navigation.navigate('Dashboard');
        break;
      case 'Calendar':
        navigation.navigate('Calendar');
        break;
      case 'Gallery':
        navigation.navigate('Gallery');
        break;
      case 'Settings':
        alert('Settings screen coming soon!');
        break;
      case 'Info':
        alert('App info coming soon!');
        break;
      default:
        console.warn(`Unknown tab: ${tab}`);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => handleTabPress('Dashboard')}>
          <Ionicons
            name="home"
            size={28}
            color={active === 'Dashboard' ? '#FF6F61' : '#B0B0B0'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleTabPress('Calendar')}>
          <Ionicons
            name="calendar"
            size={28}
            color={active === 'Calendar' ? '#FF6F61' : '#B0B0B0'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleTabPress('Settings')}>
          <Ionicons
            name="settings"
            size={28}
            color={active === 'Settings' ? '#FF6F61' : '#B0B0B0'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleTabPress('Info')}>
          <Ionicons
            name="information-circle"
            size={28}
            color={active === 'Info' ? '#FF6F61' : '#B0B0B0'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
wrapper: {
  backgroundColor: '#FAF8F5',
  alignItems: 'center',
  paddingBottom: 28,
  paddingTop: 6, // optional spacing
},
navBar: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  backgroundColor: '#fff',
  width: '90%',
  borderRadius: 40,
  paddingVertical: 16,
  paddingHorizontal: 20,
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
},

});

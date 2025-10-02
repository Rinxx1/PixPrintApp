import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebase';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

export default function HeaderBar({ navigation, showBack = false, showDashboard = false, guestUsername = null }) {
  const currentUser = auth.currentUser;
  const isGuest = !currentUser && guestUsername;
  const insets = useSafeAreaInsets();
  
  // Only show dashboard button if user is authenticated (not guest) and showDashboard is true
  const shouldShowDashboard = showDashboard && currentUser && !isGuest;

  const handleDashboardPress = () => {
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'Tabs',
        params: { 
          screen: 'Dashboard'
        }
      }],
    });
  };

  return (
    <View style={[styles.header, { 
      height: 72 + insets.top, // Increased from 56 to 72 for more height
      paddingTop: insets.top + 8 
    }]}>
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>      ) : shouldShowDashboard ? (
        <TouchableOpacity onPress={handleDashboardPress} style={styles.plainBackButton}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
      ) : (
        <View style={styles.leftSpacer} />
      )}

      <View style={styles.centerSpacer} />

      <View style={styles.brandWrapper}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/icon-pix-print.png')}
            style={styles.logo}
          />
        </View>
        <Text style={styles.brand}>SnaptureX</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FAF8F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },  backArrow: {
    fontSize: 22,
    paddingHorizontal: 12,
    paddingVertical: 4,
    color: '#2D2A32',
  },
  plainBackButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftSpacer: {
    width: 40, // Same width as dashboard button for consistent spacing
  },
  centerSpacer: {
    flex: 1, // Takes up remaining space to push brand to the right
  },
  brandWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logo: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  brand: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D2A32',
    letterSpacing: 0.5,
  },
});
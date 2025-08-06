import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebase';

export default function HeaderBar({ navigation, showBack = false, showDashboard = false, guestUsername = null }) {
  const currentUser = auth.currentUser;
  const isGuest = !currentUser && guestUsername;
  
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
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      ) : shouldShowDashboard ? (
        <TouchableOpacity onPress={handleDashboardPress} style={styles.dashboardButton}>
          <LinearGradient
            colors={['#FF8D76', '#FF6F61']}
            style={styles.dashboardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="home" size={16} color="#FFFFFF" />
          </LinearGradient>
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
        <Text style={styles.brand}>PixPrint</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 110,
    backgroundColor: '#FAF8F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 38, // status bar space
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backArrow: {
    fontSize: 22,
    paddingHorizontal: 12,
    paddingVertical: 4,
    color: '#2D2A32',
  },
  dashboardButton: {
    borderRadius: 20,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dashboardGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
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
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  brand: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D2A32',
    letterSpacing: 0.5,
  },
});
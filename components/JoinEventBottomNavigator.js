import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function JoinEventBottomNavigator({ activeTab, onTabChange, eventId, navigation, guestUsername }) {
  
  const handleTabChange = (tab) => {
    onTabChange && onTabChange(tab);
    
    if (!eventId) {
      console.warn('No eventId available for navigation');
      return;
    }
    
    // Include guest username in navigation params
    const navParams = { 
      eventId,
      ...(guestUsername && { username: guestUsername })
    };
    
    if (tab === 'camera') {
      navigation.navigate('Camera', navParams);
    } else if (tab === 'gallery') {
      navigation.navigate('JoinEventTwo', navParams);
    } else if (tab === 'settings') {
      navigation.navigate('JoinEventSettings', navParams);
    }
  };

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        {/* Gallery Tab */}
        <TouchableOpacity 
          style={styles.navTab} 
          onPress={() => handleTabChange('gallery')}
        >
          <View style={[styles.navIcon, activeTab === 'gallery' && styles.activeNavIcon]}>
            <Ionicons 
              name="images" 
              size={24} 
              color={activeTab === 'gallery' ? '#FF6F61' : '#8E8E93'} 
            />
          </View>
          {activeTab === 'gallery' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        {/* Camera Tab */}
        <TouchableOpacity 
          style={styles.cameraTab} 
          onPress={() => handleTabChange('camera')}
        >
          <LinearGradient
            colors={['#FF8D76', '#FF6F61']}
            style={styles.cameraButton}
          >
            <Ionicons 
              name="camera" 
              size={26} 
              color="#FFFFFF" 
            />
          </LinearGradient>
          {activeTab === 'camera' && <View style={styles.cameraIndicator} />}
        </TouchableOpacity>

        {/* Settings Tab */}
        <TouchableOpacity 
          style={styles.navTab} 
          onPress={() => handleTabChange('settings')}
        >
          <View style={[styles.navIcon, activeTab === 'settings' && styles.activeNavIcon]}>
            <Ionicons 
              name="settings" 
              size={24} 
              color={activeTab === 'settings' ? '#FF6F61' : '#8E8E93'} 
            />
          </View>
          {activeTab === 'settings' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 66,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeNavIcon: {
    backgroundColor: 'rgba(255, 111, 97, 0.12)',
    transform: [{ scale: 1.1 }],
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6F61',
  },
  cameraTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6F61',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
});

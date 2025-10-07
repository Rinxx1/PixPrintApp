import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function JoinEventBottomNavigator({ activeTab, onTabChange, eventId, navigation, guestUsername }) {
  const insets = useSafeAreaInsets();
  
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

  const screenWidth = Dimensions.get('window').width;

  return (
    <View style={[styles.bottomNavContainer, { height: 80 + insets.bottom }]}>
      {/* Curved Navigation Background */}
      <Svg
        width={screenWidth}
        height={80 + insets.bottom}
        style={styles.curvedBackground}
      >
        <Path
          d={`M0,20 L${screenWidth * 0.35},20 Q${screenWidth * 0.4},20 ${screenWidth * 0.42},15 Q${screenWidth * 0.5},0 ${screenWidth * 0.58},15 Q${screenWidth * 0.6},20 ${screenWidth * 0.65},20 L${screenWidth},20 L${screenWidth},${80 + insets.bottom} L0,${80 + insets.bottom} Z`}
          fill="#FFFFFF"
          stroke="#E1E1E1"
          strokeWidth="0.5"
        />
      </Svg>
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        {/* Gallery Tab */}
        <TouchableOpacity 
          style={styles.navTab} 
          onPress={() => handleTabChange('gallery')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons 
              name={activeTab === 'gallery' ? 'images' : 'images-outline'}
              size={24} 
              color={activeTab === 'gallery' ? '#48C6EF' : '#8E8E93'} 
            />
            <Text style={[
              styles.navLabel,
              activeTab === 'gallery' && styles.navLabelActive
            ]}>
              Gallery
            </Text>
          </View>
        </TouchableOpacity>

        {/* Camera Tab */}
        <TouchableOpacity 
          style={styles.cameraTab} 
          onPress={() => handleTabChange('camera')}
        >
          <View style={styles.cameraButtonContainer}>
            <LinearGradient
              colors={['#48C6EF', '#36B5E6']}
              style={styles.cameraButton}
            >
              <Ionicons 
                name="camera" 
                size={32} 
                color="#FFFFFF"
              />
            </LinearGradient>
          </View>
        </TouchableOpacity>

        {/* Settings Tab */}
        <TouchableOpacity 
          style={styles.navTab} 
          onPress={() => handleTabChange('settings')}
        >
          <View style={styles.navIconContainer}>
            <Ionicons 
              name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
              size={24} 
              color={activeTab === 'settings' ? '#48C6EF' : '#8E8E93'} 
            />
            <Text style={[
              styles.navLabel,
              activeTab === 'settings' && styles.navLabelActive
            ]}>
              Settings
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  curvedBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingTop: 5,
    paddingHorizontal: 0,
    height: 80,
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    overflow: 'visible',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingVertical: 0,
    paddingBottom: 8,
    minWidth: 70,
  },
  navIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 4,
    letterSpacing: 0.1,
  },
  navLabelActive: {
    fontWeight: '600',
    color: '#48C6EF',
  },
  navIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 10,
  },
  cameraTab: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingVertical: 0,
    marginBottom: -15,
  },
  cameraButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  cameraButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#48C6EF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
});

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Image,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';

const { width } = Dimensions.get('window');

export default function JoinEventSettings({ route, navigation }) {
  // Extract eventId from route params at the top
  const { eventId } = route.params || {};
  
  // Add console log to debug
  useEffect(() => {
    //console.log('JoinEventSettings received eventId:', eventId);
    
    // Check if eventId is available
    if (!eventId) {
      console.warn('JoinEventSettings: No eventId provided in route params');
      // Optional: Navigate back to a safe screen
      // navigation.navigate('Events');
    }
  }, [eventId]);
  
  // State variables
  const [activeTab, setActiveTab] = useState('settings');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoDownloadEnabled, setAutoDownloadEnabled] = useState(false);
  const [highQualityEnabled, setHighQualityEnabled] = useState(true);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  
  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Check if eventId is available
    if (!eventId) {
      console.warn('JoinEventSettings: No eventId provided in route params');
    }
  }, []);

  // Handle tab change with corrected navigation and parameter passing
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    if (!eventId) {
      console.warn('No eventId available for navigation');
      // Maybe show alert to user
      return;
    }
    if (tab === 'camera') {
      navigation.navigate('Camera', { eventId });
    } else if (tab === 'gallery') {
      navigation.navigate('JoinEventTwo', { eventId });
    }
  };

  // Add these functions for your action buttons
  const handleDownloadPhotos = () => {
    navigation.navigate('DownloadPhotos', { eventId });
  };

  const handleShareEvent = () => {
    navigation.navigate('ShareEvent', { eventId });
  };

  const handleOrderPrints = () => {
    navigation.navigate('OrderPrints', { eventId });
  };

  const handleLeaveEvent = () => {
    // Show confirmation dialog before leaving
    Alert.alert(
      'Leave Event',
      'Are you sure you want to leave this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive', 
          onPress: () => {
            // Handle leaving logic here
            navigation.navigate('Events');
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={false} />
      
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.profileContainer}>
            <Image 
              source={require('../../assets/avatar.png')} 
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>John Doe</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Event Attendee</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.title}>Event Settings</Text>
          <Text style={styles.eventName}>Summer BBQ Party 2025</Text>
        </Animated.View>
        
        {/* Notification Settings */}
        <Animated.View 
          style={[
            styles.settingsCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.settingHeader}>
            <Ionicons name="notifications" size={22} color="#FF6F61" />
            <Text style={styles.settingTitle}>Notifications</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Event Updates</Text>
              <Text style={styles.settingDescription}>Get notified about changes to this event</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => setNotificationsEnabled(value)}
              trackColor={{ false: '#E5E5E5', true: 'rgba(255, 111, 97, 0.4)' }}
              thumbColor={notificationsEnabled ? '#FF6F61' : '#F5F5F5'}
            />
          </View>
        </Animated.View>
        
        {/* Media Settings */}
        <Animated.View 
          style={[
            styles.settingsCard,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }],
              marginTop: 16 
            }
          ]}
        >
          <View style={styles.settingHeader}>
            <Ionicons name="image" size={22} color="#FF6F61" />
            <Text style={styles.settingTitle}>Media</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Download Photos</Text>
              <Text style={styles.settingDescription}>Automatically save photos to your gallery</Text>
            </View>
            <Switch
              value={autoDownloadEnabled}
              onValueChange={(value) => setAutoDownloadEnabled(value)}
              trackColor={{ false: '#E5E5E5', true: 'rgba(255, 111, 97, 0.4)' }}
              thumbColor={autoDownloadEnabled ? '#FF6F61' : '#F5F5F5'}
            />
          </View>
          
          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>High Quality Images</Text>
              <Text style={styles.settingDescription}>Download full resolution photos (uses more data)</Text>
            </View>
            <Switch
              value={highQualityEnabled}
              onValueChange={(value) => setHighQualityEnabled(value)}
              trackColor={{ false: '#E5E5E5', true: 'rgba(255, 111, 97, 0.4)' }}
              thumbColor={highQualityEnabled ? '#FF6F61' : '#F5F5F5'}
            />
          </View>
        </Animated.View>
        
        {/* Quick Actions */}
        <Animated.View 
          style={[
            styles.settingsCard,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }],
              marginTop: 16 
            }
          ]}
        >
          <View style={styles.settingHeader}>
            <Ionicons name="flash" size={22} color="#FF6F61" />
            <Text style={styles.settingTitle}>Quick Actions</Text>
          </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadPhotos}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="download-outline" size={22} color="#555555" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Download All Photos</Text>
              <Text style={styles.actionDescription}>Save all event photos to your gallery</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.borderTop]} onPress={handleShareEvent}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="share-social-outline" size={22} color="#555555" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Share Event</Text>
              <Text style={styles.actionDescription}>Invite others to join this event</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Event Options */}
        <Animated.View 
          style={[
            styles.settingsCard,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }],
              marginTop: 16 
            }
          ]}
        >
          <View style={styles.settingHeader}>
            <Ionicons name="options" size={22} color="#FF6F61" />
            <Text style={styles.settingTitle}>Event Options</Text>
          </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleOrderPrints}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="print-outline" size={22} color="#555555" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Order Prints</Text>
              <Text style={styles.actionDescription}>Get physical copies of your photos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.borderTop]} 
            onPress={handleLeaveEvent}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Leave Event</Text>
              <Text style={styles.actionDescription}>Remove yourself from this event</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Bottom padding for scroll view */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Bottom Navigation - Matching JoinEventScreenTwo */}
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

          {/* Camera Tab - Special Highlighted Design */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 141, 118, 0.06)',
    bottom: width * 0.1,
    left: -width * 0.1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 104, // Space for header
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.15)', // Light green
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CD964',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#2E8540',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  eventName: {
    fontSize: 16,
    color: '#666',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingTitle: {
    marginLeft: 8,
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    paddingRight: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#888',
  },
  
  // Bottom Navigation - Matching JoinEventScreenTwo.js
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
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6F61',
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
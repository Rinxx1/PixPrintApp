import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Image, 
  ScrollView, 
  Animated,
  Dimensions
} from 'react-native';
import { auth, db } from '../../firebase';
import HeaderBar from '../../components/HeaderBar';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '../../context/AlertContext'; // Add this import

const { width } = Dimensions.get('window');

export default function SettingsScreen({ navigation }) {
  const [credits, setCredits] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  
  // Add alert hook
  const { showConfirm, showError, showSuccess } = useAlert();
  
  let unsubscribe;

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

    // Firestore real-time listener to fetch user's credits
    const fetchCredits = async () => {
      const user = auth.currentUser;
      if (user) {
        const creditsRef = collection(db, 'credits_tbl');
        const q = query(creditsRef, where('user_id', '==', user.uid));

        unsubscribe = onSnapshot(q, (querySnapshot) => {
          let totalCredits = 0;
          querySnapshot.forEach(doc => {
            totalCredits += doc.data().credits;
          });
          setCredits(totalCredits);
        });
      }
    };

    fetchCredits();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    showConfirm(
      'Confirm Logout',
      'Are you sure you want to log out?',
      async () => {
        // User confirmed logout
        try {
          await signOut(auth);
          
          // Navigate immediately after successful signOut
          navigation.reset({
            index: 0,
            routes: [{ name: 'SignIn' }],
          });
          
          // Show success message after navigation
          setTimeout(() => {
            showSuccess(
              'Logged Out',
              'You have been logged out successfully.'
            );
          }, 500);
          
        } catch (error) {
          console.error('Logout error:', error);
          showError(
            'Logout Failed',
            'Unable to log out. Please try again.',
            () => handleLogout(), // Retry function
            () => {} // Cancel function
          );
        }
      },
      () => {
        // User cancelled logout - no action needed
        console.log('Logout cancelled');
      }
    );
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    // You can add a toast or small feedback here if needed
    // For now, just toggle the state
  };

  const handleNotificationsToggle = async () => {
    try {
      setNotifications(!notifications);
      // Here you could add logic to update notification settings in your backend
      // or with push notification services
    } catch (error) {
      // Revert the change if there's an error
      setNotifications(notifications);
      showError(
        'Settings Update Failed',
        'Could not update notification preferences. Please try again.',
        () => handleNotificationsToggle()
      );
    }
  };

  const renderSettingItem = (icon, title, subtitle, onPress, showArrow = true, customComponent = null) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color="#FF6F61" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {customComponent || (showArrow && <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />)}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={false} />
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </Animated.View>

        {/* Credits Card */}
        <Animated.View 
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <LinearGradient
            colors={['#FF8D76', '#FF6F61']}
            style={styles.creditsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.creditsContent}>
              <View style={styles.creditsHeader}>
                <View style={styles.creditsIconWrapper}>
                  <Image source={require('../../assets/icon-pix-print.png')} style={styles.creditsIcon} />
                </View>
                <View style={styles.creditsInfo}>
                  <Text style={styles.creditsLabel}>Pix Credits</Text>
                  <Text style={styles.creditsAmount}>{credits}</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.addCreditsBtn} 
                onPress={() => navigation.navigate('AddMoreCredits')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF6F61" />
                <Text style={styles.addCreditsText}>Add Credits</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Account Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'person-outline',
              'Profile Information',
              'Update your personal details',
              () => navigation.navigate('PersonalInfo')
            )}
            {renderSettingItem(
              'lock-closed-outline',
              'Change Password',
              'Update your account password',
              () => navigation.navigate('ChangePassword')
            )}
          </View>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'moon-outline',
              'Dark Mode',
              'Switch to dark theme',
              handleDarkModeToggle,
              false,
              <Switch 
                value={darkMode} 
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: '#E5E5E5', true: '#FF6F61' }}
                thumbColor={darkMode ? '#FFFFFF' : '#FFFFFF'}
              />
            )}
            {renderSettingItem(
              'notifications-outline',
              'Push Notifications',
              'Receive app notifications',
              handleNotificationsToggle,
              false,
              <Switch 
                value={notifications} 
                onValueChange={handleNotificationsToggle}
                trackColor={{ false: '#E5E5E5', true: '#FF6F61' }}
                thumbColor={notifications ? '#FFFFFF' : '#FFFFFF'}
              />
            )}
          </View>
        </Animated.View>

        {/* Support Section */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <View style={styles.card}>
            {renderSettingItem(
              'document-text-outline',
              'Terms & Conditions',
              'Read our terms of service',
              () => navigation.navigate('Terms&Condition')
            )}
            {renderSettingItem(
              'shield-checkmark-outline',
              'Privacy Policy',
              'Learn about data protection',
              () => navigation.navigate('PrivacyPolicy')
            )}
            {renderSettingItem(
              'help-circle-outline',
              'Help & Support',
              'Get assistance and FAQ',
              () => navigation.navigate('HelpSupport')
            )}
          </View>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View 
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>PixPrint v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 22,
  },
  creditsCard: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  creditsContent: {
    padding: 20,
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditsIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  creditsIcon: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
  },
  creditsInfo: {
    flex: 1,
  },
  creditsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  creditsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addCreditsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  addCreditsText: {
    color: '#FF6F61',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2A32',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  settingRight: {
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6F61',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
  },
  versionText: {
    fontSize: 14,
    color: '#999999',
  },
});

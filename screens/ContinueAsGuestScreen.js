import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  AppState
} from 'react-native';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { useAlert } from '../context/AlertContext'; // Add this import

const { width, height } = Dimensions.get('window');

// Max time for network requests before showing slow connection message (ms)
const NETWORK_TIMEOUT = 8000;

export default function ContinueAsGuestScreen({ navigation }) {
  const [eventCode, setEventCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [showSlowNetworkMessage, setShowSlowNetworkMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryingRequest, setRetryingRequest] = useState(false);
  
  // Ref to hold timeouts
  const networkTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const networkBannerAnim = useState(new Animated.Value(-60))[0];

  // Add alert hook
  const { showAlert, showError, showSuccess, showConfirm } = useAlert();

  useEffect(() => {
    // Start entrance animations
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
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();

    // Set up network connectivity listener
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        setNetworkStatus('online');
        // Hide slow network message if it was showing
        if (showSlowNetworkMessage) {
          hideNetworkBanner();
        }
      } else {
        setNetworkStatus('offline');
        showNetworkBanner('No internet connection');
      }
    });

    // App state listener to handle when app comes back from background
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground, check connectivity
        NetInfo.fetch().then(state => {
          setNetworkStatus(state.isConnected ? 'online' : 'offline');
        });
      }
      appStateRef.current = nextAppState;
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      appStateSubscription.remove();
      clearNetworkTimeout();
    };
  }, []);

  // Show network banner animation
  const showNetworkBanner = (message) => {
    if (message === 'slow') {
      setShowSlowNetworkMessage(true);
    }
    
    Animated.spring(networkBannerAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Hide network banner animation
  const hideNetworkBanner = () => {
    Animated.timing(networkBannerAnim, {
      toValue: -60,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowSlowNetworkMessage(false);
    });
  };

  // Set a timeout for network requests
  const setNetworkTimeout = () => {
    clearNetworkTimeout();
    networkTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        showNetworkBanner('slow');
      }
    }, NETWORK_TIMEOUT);
  };

  // Clear network timeout
  const clearNetworkTimeout = () => {
    if (networkTimeoutRef.current) {
      clearTimeout(networkTimeoutRef.current);
      networkTimeoutRef.current = null;
    }
  };

  // Function to check if the user has already joined the event
  const checkIfAlreadyJoined = async (eventId, username) => {
    try {
      const joinedRef = collection(db, 'joined_tbl');
      const usernameQuery = query(joinedRef, where('event_id', '==', eventId), where('username', '==', username));
      const usernameSnapshot = await getDocs(usernameQuery);
      return !usernameSnapshot.empty;
    } catch (error) {
      console.error("Error checking if already joined:", error);
      return false;
    }
  };

  // Enhanced function to check if username belongs to a registered user
  const checkIfUsernameHasUserId = async (eventId, username) => {
    try {
      const joinedRef = collection(db, 'joined_tbl');
      const usernameQuery = query(
        joinedRef, 
        where('event_id', '==', eventId), 
        where('username', '==', username)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        const userData = usernameSnapshot.docs[0].data();
        // Check if this username has a user_id (registered user)
        return {
          exists: true,
          hasUserId: userData.user_id ? true : false,
          docData: userData
        };
      }
      
      return { exists: false, hasUserId: false, docData: null };
    } catch (error) {
      console.error("Error checking username ownership:", error);
      return { exists: false, hasUserId: false, docData: null };
    }
  };

  // REMOVE OR COMMENT OUT this useEffect that auto-navigates without validation
  /*
  useEffect(() => {
    const checkUserEvent = async () => {
      if (eventCode.trim() === '' || username.trim() === '') return;

      try {
        // Fetch the event using the event code
        const eventRef = collection(db, 'event_tbl');
        const eventQuery = query(eventRef, where('event_code', '==', eventCode.trim().toUpperCase()));
        const eventSnapshot = await getDocs(eventQuery);

        if (!eventSnapshot.empty) {
          const eventId = eventSnapshot.docs[0].id;
          
          // Check if the user already joined
          const isAlreadyJoined = await checkIfAlreadyJoined(eventId, username);
          
          if (isAlreadyJoined) {
            // If already joined, navigate to the event screen directly
            navigation.navigate('JoinEventTwo', { eventId, eventCode, username });
          }
        }
      } catch (error) {
        console.error("Error in checkUserEvent:", error);
      }
    };

    // Debounce for performance
    const debounceTimer = setTimeout(() => {
      if (networkStatus === 'online') {
        checkUserEvent();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [eventCode, username, navigation, networkStatus]);
  */

  // Add a new safe auto-check function that only validates format, not permissions
  useEffect(() => {
    const autoCheckEventValidity = async () => {
      // Only auto-check if both fields are filled and user is not currently interacting
      if (eventCode.trim() === '' || username.trim() === '' || isLoading) return;

      try {
        // Only check if event exists, don't auto-navigate
        const eventRef = collection(db, 'event_tbl');
        const eventQuery = query(eventRef, where('event_code', '==', eventCode.trim().toUpperCase()));
        const eventSnapshot = await getDocs(eventQuery);

        if (!eventSnapshot.empty) {
          const eventId = eventSnapshot.docs[0].id;
          
          // Check username validation but don't auto-navigate
          const usernameCheck = await checkIfUsernameHasUserId(eventId, username.trim());
          
          // Only auto-navigate if it's a returning guest (exists but no user_id)
          if (usernameCheck.exists && !usernameCheck.hasUserId) {
            // This is a returning guest - safe to auto-navigate
            navigation.navigate('JoinEventTwo', { 
              eventId, 
              eventCode: eventCode.trim().toUpperCase(), 
              username: username.trim() 
            });
          }
          // For all other cases (new users, registered users), require manual join button press
        }
      } catch (error) {
        console.error("Error in auto-check:", error);
      }
    };

    // Only run auto-check after a longer delay to avoid interfering with user input
    const autoCheckTimer = setTimeout(() => {
      if (networkStatus === 'online' && !isLoading) {
        autoCheckEventValidity();
      }
    }, 2000); // Increased delay to 2 seconds

    return () => clearTimeout(autoCheckTimer);
  }, [eventCode, username, networkStatus, isLoading]);

  // Retry mechanism for failed requests
  const retryRequest = async (requestFn, ...args) => {
    setRetryingRequest(true);
    
    try {
      return await requestFn(...args);
    } catch (error) {
      if (retryCount < 3) {
        // Wait a bit longer for each retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        setRetryCount(prev => prev + 1);
        return retryRequest(requestFn, ...args);
      } else {
        throw error;
      }
    } finally {
      setRetryingRequest(false);
    }
  };

  const handleJoin = async () => {
    // Prevent multiple submissions
    if (isLoading) return;
    
    // First check network status
    if (networkStatus === 'offline') {
      showError(
        '🌐 No Internet Connection',
        'Please check your internet connection and try again to join the event.',
        () => handleJoin(), // Retry function
        () => {} // Cancel function
      );
      return;
    }
    
    // Reset retry counter
    setRetryCount(0);
    
    // Set loading to true when the user clicks the button
    setIsLoading(true);
    
    // Start network timeout to detect slow connections
    setNetworkTimeout();
    
    try {
      // Enhanced input validation with better alerts
      if (eventCode.trim() === '') {
        showAlert({
          title: '🎫 Event Code Required',
          message: 'Please enter the event code provided by the event organizer to continue.',
          type: 'warning',
          buttons: [
            { text: 'OK', style: 'primary' }
          ]
        });
        return; // Early return to prevent navigation
      }

      if (username.trim() === '') {
        showAlert({
          title: '👤 Username Required',
          message: 'Please enter a display name that others will see when you share photos in this event.',
          type: 'warning',
          buttons: [
            { text: 'OK', style: 'primary' }
          ]
        });
        return; // Early return to prevent navigation
      }

      // Validate username length and format
      if (username.trim().length < 2) {
        showAlert({
          title: '👤 Username Too Short',
          message: 'Your display name must be at least 2 characters long. Please choose a longer name.',
          type: 'warning',
          buttons: [
            { text: 'OK', style: 'primary' }
          ]
        });
        return; // Early return to prevent navigation
      }

      if (username.trim().length > 30) {
        showAlert({
          title: '👤 Username Too Long',
          message: 'Your display name must be 30 characters or less. Please choose a shorter name.',
          type: 'warning',
          buttons: [
            { text: 'OK', style: 'primary' }
          ]
        });
        return; // Early return to prevent navigation
      }

      // Check if event code is valid in event_tbl
      const eventRef = collection(db, 'event_tbl');
      const q = query(eventRef, where('event_code', '==', eventCode.trim().toUpperCase()));
      
      let querySnapshot;
      try {
        querySnapshot = await retryRequest(getDocs, q);
      } catch (error) {
        showError(
          '🔍 Event Verification Failed',
          'Unable to verify the event code due to network issues. Please check your connection and try again.',
          () => handleJoin(), // Retry function
          () => {} // Cancel function
        );
        return; // Early return to prevent navigation
      }

      if (querySnapshot.empty) {
        showAlert({
          title: '❌ Invalid Event Code',
          message: `The event code "${eventCode.trim().toUpperCase()}" could not be found.\n\n• Double-check the code with the event organizer\n• Make sure you're entering it correctly\n• Codes are case-sensitive`,
          type: 'error',
          buttons: [
            { text: 'Try Again', style: 'primary' }
          ]
        });
        return; // Early return to prevent navigation
      }

      // Get the event ID from the query result
      const eventId = querySnapshot.docs[0].id;
      const eventData = querySnapshot.docs[0].data();

      // Enhanced username validation - check if username belongs to a registered user
      let usernameCheck;
      try {
        usernameCheck = await retryRequest(checkIfUsernameHasUserId, eventId, username.trim());
      } catch (error) {
        showError(
          '👤 Username Validation Failed',
          'Unable to validate your username. Please check your connection and try again.',
          () => handleJoin(), // Retry function
          () => {} // Cancel function
        );
        return; // Early return to prevent navigation
      }

      if (usernameCheck.exists && usernameCheck.hasUserId) {
        // Username exists and belongs to a registered user - deny access with appealing alert
        showAlert({
          title: '⚠️ Username Not Available',
          message: `The username "${username.trim()}" is already taken by a registered user in "${eventData.event_name}".\n\n🔐 This username belongs to someone with an account\n💡 Please choose a different username to join as a guest\n\n✨ Suggestion: Try adding numbers or your initials!`,
          type: 'warning',
          buttons: [
            { text: 'Choose Different Name', style: 'primary' }
          ]
        });
        return; // Early return to prevent navigation
      }

      if (usernameCheck.exists && !usernameCheck.hasUserId) {
        // Username exists but belongs to a guest (no user_id) - allow rejoining with success message
        showSuccess(
          '🎉 Welcome Back!',
          `Great! You're rejoining "${eventData.event_name}" as ${username.trim()}.\n\n📸 Your previous photos and activity will still be available\n🚀 Ready to capture more memories?`,
          () => {
            navigation.navigate('JoinEventTwo', { 
              eventId, 
              eventCode: eventCode.trim().toUpperCase(), 
              username: username.trim() 
            });
          }
        );
        return; // Navigation handled in success callback
      }

      // Username doesn't exist - create new guest entry with confirmation
      showConfirm(
        '🎊 Join Event as Guest?',
        `You're about to join "${eventData.event_name}" as ${username.trim()}!\n\n✅ You'll be able to:\n• 📸 Take and share photos\n• 👀 View everyone's memories\n• 💾 Download your favorites\n\n🎫 Event Code: ${eventCode.trim().toUpperCase()}\n\nReady to get started?`,
        async () => {
          // User confirmed - create the entry
          try {
            const newEntry = {
              event_id: eventId,
              joined: true,
              username: username.trim(),
              isPhotographer: false,
              joined_date: new Date(),
              user_id: null // Explicitly set to null for guest users
            };

            // Add the document to the "joined_tbl"
            await retryRequest(addDoc, collection(db, 'joined_tbl'), newEntry);

            // Show success and navigate
            showSuccess(
              '🎉 Successfully Joined!',
              `Welcome to "${eventData.event_name}", ${username.trim()}!\n\n🎊 You're now part of this amazing event\n📱 Start capturing and sharing memories right away!`,
              () => {
                navigation.navigate('JoinEventTwo', { 
                  eventId, 
                  eventCode: eventCode.trim().toUpperCase(), 
                  username: username.trim() 
                });
              }
            );

          } catch (joinError) {
            console.error('Error creating guest entry:', joinError);
            showError(
              '❌ Failed to Join Event',
              'Unable to complete your registration for this event. This could be due to network issues.',
              () => handleJoin(), // Retry function
              () => {} // Cancel function
            );
          }
        },
        () => {
          // User cancelled
          console.log('User cancelled joining event');
        }
      );
      
    } catch (error) {
      console.error("Error joining event:", error);
      showError(
        '💥 Something Went Wrong',
        'An unexpected error occurred while trying to join the event. Please check your internet connection and try again.',
        () => handleJoin(), // Retry function
        () => {} // Cancel function
      );
    } finally {
      // Reset loading state regardless of success or failure
      setIsLoading(false);
      clearNetworkTimeout();
      hideNetworkBanner();
    }
  };

  // Get appropriate network message
  const getNetworkMessage = () => {
    if (networkStatus === 'offline') return 'No internet connection';
    if (showSlowNetworkMessage) return 'Slow network detected';
    return '';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Network Status Banner */}
      <Animated.View style={[
        styles.networkBanner,
        { transform: [{ translateY: networkBannerAnim }] },
        networkStatus === 'offline' ? styles.offlineBanner : 
        showSlowNetworkMessage ? styles.slowNetworkBanner : {}
      ]}>
        <Ionicons 
          name={networkStatus === 'offline' ? "cloud-offline" : "wifi"}
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.networkBannerText}>{getNetworkMessage()}</Text>
        {showSlowNetworkMessage && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              hideNetworkBanner();
              if (isLoading) handleJoin();
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={['#FFF9F8', '#FFFFFF', '#F8F9FA']}
          style={styles.container}
        >
          {/* Decorative Background Elements */}
          <View style={styles.backgroundElements}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
            <View style={styles.patternContainer}>
              <Image 
                source={require('../assets/icon-pix-print.png')} 
                style={styles.patternImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Header with Back Button */}
          <Animated.View 
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Join as Guest</Text>
            <View style={{ width: 40 }} />
          </Animated.View>
          
          {/* Content */}
          <View style={styles.contentContainer}>
            {/* Welcome Section */}
            <Animated.View 
              style={[
                styles.welcomeSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
                }
              ]}
            >
              <View style={styles.logoContainer}>
                <Image source={require('../assets/icon-pix-print.png')} style={styles.logo} />
              </View>
              <Text style={styles.welcomeTitle}>Welcome to PixPrint!</Text>
              <Text style={styles.welcomeSubtitle}>Join an event and start capturing memories</Text>
            </Animated.View>

            {/* Enhanced Form Card with better validation feedback */}
            <Animated.View 
              style={[
                styles.formCard,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.formHeader}>
                <Ionicons name="people-outline" size={24} color="#FF6F61" />
                <Text style={styles.formTitle}>Event Details</Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Display Name</Text>
                <View style={[
                  styles.inputContainer,
                  networkStatus === 'offline' && styles.disabledInput
                ]}>
                  <Ionicons name="person-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your display name (2-30 characters)"
                    placeholderTextColor="#AAAAAA"
                    value={username}
                    onChangeText={setUsername}
                    style={styles.input}
                    editable={!isLoading && networkStatus !== 'offline'}
                    maxLength={30}
                  />
                </View>
                {username.trim().length > 0 && (
                  <Text style={styles.characterCount}>
                    {username.trim().length}/30 characters
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Access Code</Text>
                <View style={[
                  styles.inputContainer,
                  networkStatus === 'offline' && styles.disabledInput
                ]}>
                  <Ionicons name="key-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter the event access code"
                    placeholderTextColor="#AAAAAA"
                    value={eventCode}
                    onChangeText={(text) => setEventCode(text.toUpperCase())}
                    style={styles.input}
                    editable={!isLoading && networkStatus !== 'offline'}
                    autoCapitalize="characters"
                  />
                </View>
                <Text style={styles.inputHint}>
                  💡 Get this code from the event organizer
                </Text>
              </View>

              <TouchableOpacity 
                style={[
                  styles.joinButton, 
                  isLoading && styles.buttonDisabled,
                  networkStatus === 'offline' && styles.buttonDisabled
                ]} 
                onPress={handleJoin}
                disabled={isLoading || networkStatus === 'offline'}
              >
                <LinearGradient
                  colors={
                    isLoading ? ['#FFB0A8', '#FFB0A8'] : 
                    networkStatus === 'offline' ? ['#CCCCCC', '#BBBBBB'] : 
                    ['#FF8D76', '#FF6F61']
                  }
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      {showSlowNetworkMessage && (
                        <Text style={[styles.buttonText, {marginLeft: 8}]}>
                          {retryingRequest ? "Retrying..." : "Joining..."}
                        </Text>
                      )}
                    </>
                  ) : networkStatus === 'offline' ? (
                    <>
                      <Ionicons name="cloud-offline" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Waiting for connection</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Join Event</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#4CD964" />
                  <Text style={styles.infoText}>No account required</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="camera-outline" size={18} color="#4CD964" />
                  <Text style={styles.infoText}>Instantly access event photos</Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="share-outline" size={18} color="#4CD964" />
                  <Text style={styles.infoText}>Share and download memories</Text>
                </View>
              </View>
            </Animated.View>

            {/* Alternative Options */}
            <Animated.View 
              style={[
                styles.alternativeSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={styles.signInPrompt}
                onPress={() => navigation.navigate('SignIn')}
                disabled={isLoading}
              >
                <Text style={styles.signInText}>Have an account? </Text>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
            
            {/* Space at the bottom for better scrolling */}
            <View style={{height: 30}} />
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: height,
    position: 'relative',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    top: -width * 0.3,
    right: -width * 0.3,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 141, 118, 0.06)',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  circle3: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 111, 97, 0.05)',
    top: height * 0.6,
    right: -width * 0.1,
  },
  patternContainer: {
    position: 'absolute',
    top: -width * 0.15,
    right: -width * 0.15,
    width: width * 0.4,
    height: width * 0.4,
    opacity: 0.08,
    transform: [{ rotate: '30deg' }],
  },
  patternImage: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  joinButton: {
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  infoSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  alternativeSection: {
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  dividerText: {
    fontSize: 14,
    color: '#888888',
    marginHorizontal: 16,
  },
  signInPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  signInText: {
    fontSize: 16,
    color: '#666666',
  },
  signInLink: {
    fontSize: 16,
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  // Network Status Banner
  networkBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFB347',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 30 : 10,
  },
  offlineBanner: {
    backgroundColor: '#FF6D6A',
  },
  slowNetworkBanner: {
    backgroundColor: '#FFB347',
  },
  networkBannerText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  // Add new styles for enhanced validation feedback
  characterCount: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    marginLeft: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4,
    fontStyle: 'italic',
  },
});

import React, { useState, useEffect } from 'react';
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
  Animated
} from 'react-native';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function ContinueAsGuestScreen({ navigation }) {
  const [eventCode, setEventCode] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

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
  }, []);

  // Function to check if the user has already joined the event
  const checkIfAlreadyJoined = async (eventId, username) => {
    const joinedRef = collection(db, 'joined_tbl');
    const usernameQuery = query(joinedRef, where('event_id', '==', eventId), where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);

    return !usernameSnapshot.empty;
  };

  useEffect(() => {
    const checkUserEvent = async () => {
      if (eventCode.trim() === '') return;

      // Fetch the event using the event code
      const eventRef = collection(db, 'event_tbl');
      const eventQuery = query(eventRef, where('event_code', '==', eventCode));
      const eventSnapshot = await getDocs(eventQuery);

      if (!eventSnapshot.empty) {
        const eventId = eventSnapshot.docs[0].id;
        
        // Check if the user already joined
        if (username.trim() !== '') {
          const isAlreadyJoined = await checkIfAlreadyJoined(eventId, username);
          
          if (isAlreadyJoined) {
            // If already joined, navigate to the event screen directly
            navigation.navigate('JoinEventTwo', { eventId, eventCode, username });
          }
        }
      }
    };

    checkUserEvent(); // Call the function to check if the user is already joined

  }, [eventCode, username, navigation]);

  const handleJoin = async () => {
    // Prevent multiple submissions
    if (isLoading) return;
    
    // Set loading to true when the user clicks the button
    setIsLoading(true);
    
    try {
      if (eventCode.trim() === '') {
        Alert.alert('Error', 'Please enter the event code');
        setIsLoading(false); // Reset loading state
        return;
      }

      // Check if event code is valid in event_tbl
      const eventRef = collection(db, 'event_tbl');
      const q = query(eventRef, where('event_code', '==', eventCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'Invalid event code');
        setIsLoading(false); // Reset loading state
        return;
      }

      // If event code is valid, check if the username is entered
      if (username.trim() === '') {
        Alert.alert('Error', 'Please enter your username');
        setIsLoading(false); // Reset loading state
        return;
      }

      // Get the event ID from the query result
      const eventId = querySnapshot.docs[0].id;

      // Check if the username already exists in joined_tbl for this event
      const joinedRef = collection(db, 'joined_tbl');
      const usernameQuery = query(joinedRef, where('event_id', '==', eventId), where('username', '==', username));
      const usernameSnapshot = await getDocs(usernameQuery);

      if (!usernameSnapshot.empty) {
        Alert.alert('Error', 'You have already joined this event with this username');
        setIsLoading(false); // Reset loading state
        return;
      }

      // Add the user to the "joined_tbl" if username is not found
      const newEntry = {
        event_id: eventId,
        joined: true,
        username: username, // Save username if guest
      };

      // Add the document to the "joined_tbl"
      await addDoc(joinedRef, newEntry);

      // Navigate to the JoinEventScreenTwo with event details
      navigation.navigate('JoinEventTwo', { eventId, eventCode, username });
    } catch (error) {
      console.error("Error joining event:", error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      // Reset loading state regardless of success or failure
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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

            {/* Form Card */}
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
                <Text style={styles.inputLabel}>Your Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your display name"
                    placeholderTextColor="#AAAAAA"
                    value={username}
                    onChangeText={setUsername}
                    style={styles.input}
                    editable={!isLoading}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Event Code</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="key-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter the event access code"
                    placeholderTextColor="#AAAAAA"
                    value={eventCode}
                    onChangeText={setEventCode}
                    style={styles.input}
                    editable={!isLoading}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.joinButton, isLoading && styles.buttonDisabled]} 
                onPress={handleJoin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#FFB0A8', '#FFB0A8'] : ['#FF8D76', '#FF6F61']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
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
});

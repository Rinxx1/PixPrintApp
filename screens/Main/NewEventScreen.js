import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform 
} from 'react-native';
import HeaderBar from '../../components/HeaderBar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function NewEventScreen({ navigation }) {
  const [eventName, setEventName] = useState('');
  const [eventStartDate, setEventStartDate] = useState(null);
  const [eventEndDate, setEventEndDate] = useState(null);
  const [eventDescription, setEventDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'
  const [userCredits, setUserCredits] = useState(0);
  const [eventPrice, setEventPrice] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

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

    // Fetch user credits
    fetchUserCredits();
    
    // Generate code on first load only
    if (!accessCode) {
      generateUniqueAccessCode();
    }
  }, []); // Empty dependency array

  const fetchUserCredits = async () => {
    const user = auth.currentUser;
    if (user) {
      const creditsRef = collection(db, 'credits_tbl');
      const q = query(creditsRef, where('user_id', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        querySnapshot.forEach(doc => {
          setUserCredits(doc.data().credits);
        });
      } else {
        console.log('No credits data available for this user!');
      }
    }
  };

  const showDatePicker = (mode) => {
    setDatePickerMode(mode);
    setDatePickerVisibility(true);
  };
  
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date) => {
    if (datePickerMode === 'start') {
      setEventStartDate(date);
      // If end date is before start date or not set, update it
      if (!eventEndDate || eventEndDate < date) {
        // Set end date to same day initially
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        setEventEndDate(endOfDay);
      }
    } else {
      // Ensure end date is not before start date
      if (eventStartDate && date < eventStartDate) {
        Alert.alert('Error', 'End date cannot be before start date');
        return;
      }
      setEventEndDate(date);
    }
    hideDatePicker();
  };

  // Check if an access code already exists in Firestore
  const isCodeUnique = async (code) => {
    const eventRef = collection(db, 'event_tbl');
    const q = query(eventRef, where('event_code', '==', code));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  // Generate a unique access code
  const generateUniqueAccessCode = async () => {
    try {
      setIsGeneratingCode(true);
      let isUnique = false;
      let newCode = '';
      
      // Try up to 10 times to generate a unique code
      for (let i = 0; i < 10; i++) {
        newCode = generateEventCode();
        isUnique = await isCodeUnique(newCode);
        if (isUnique) break;
      }
      
      if (isUnique) {
        setAccessCode(newCode);
      } else {
        console.error('Could not generate a unique code after multiple attempts');
        setAccessCode('');
      }
    } catch (error) {
      console.error('Error generating unique code:', error);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }
    
    if (!eventStartDate) {
      Alert.alert('Error', 'Please select a start date');
      return;
    }
    
    if (!eventEndDate) {
      Alert.alert('Error', 'Please select an end date');
      return;
    }
    
    if (!accessCode) {
      Alert.alert('Error', 'Please wait while the access code is being generated');
      return;
    }

    // ⭐ IMPORTANT: Capture the current access code to ensure it doesn't change
    const finalAccessCode = accessCode;
    
    if (userCredits >= eventPrice) {
      setIsLoading(true);
      
      try {
        const user = auth.currentUser;
        if (user) {
          console.log("About to create event with code:", finalAccessCode);
          
          await createEventInFirestore(
            eventName, 
            eventStartDate, 
            eventEndDate, 
            eventDescription, 
            finalAccessCode, // Use the captured code
            user.uid
          );
          await updateCredits(user.uid, userCredits - eventPrice);
          
          Alert.alert(
            'Event Created Successfully!', 
            `"${eventName}" has been created and is ready for guests.\n\nEvent Code: ${finalAccessCode}`, // Use the captured code
            [{ text: 'OK', onPress: () => navigation.navigate('Tabs') }]
          );
        }
      } catch (error) {
        console.error("Error during event creation:", error);
        Alert.alert('Error', 'Failed to create event. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert(
        'Insufficient Credits', 
        `You need ${eventPrice} credits but only have ${userCredits}. Would you like to purchase more credits?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Buy Credits', onPress: () => navigation.navigate('AddMoreCredits') }
        ]
      );
    }
  };

  const createEventInFirestore = async (
    eventName, 
    eventStartDate, 
    eventEndDate, 
    eventDescription, 
    accessCode, 
    userId
  ) => {
    try {
      console.log("Creating event with access code:", accessCode);
      const eventRef = collection(db, 'event_tbl');
      await addDoc(eventRef, {
        event_name: eventName,
        event_start_date: eventStartDate,
        event_end_date: eventEndDate,
        event_description: eventDescription,
        user_id: userId,
        event_code: accessCode,
        created_at: new Date(),
        status: 'active'
      });
    } catch (e) {
      console.error('Error creating event: ', e);
      throw e;
    }
  };

  const generateEventCode = () => {
    // Generate a code with letters and numbers (more visually distinct than base36)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking chars like I, 1, O, 0
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const updateCredits = async (userId, newCredits) => {
    try {
      const creditsRef = collection(db, 'credits_tbl');
      const q = query(creditsRef, where('user_id', '==', userId));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (docSnapshot) => {
        const creditDocRef = doc(db, 'credits_tbl', docSnapshot.id);
        await updateDoc(creditDocRef, {
          credits: newCredits,
        });
        console.log(`Credits updated for user ${userId}`);
      });
    } catch (e) {
      console.error('Error updating credits: ', e);
      throw e;
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for display  
  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const hasEnoughCredits = userCredits >= eventPrice;

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Create New Event</Text>
          <Text style={styles.subtitle}>Set up your event details and start capturing memories</Text>
        </Animated.View>

        {/* Credits Display Card */}
        <Animated.View 
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={hasEnoughCredits ? ['#4CAF50', '#45A049'] : ['#FF6B6B', '#FF5252']}
            style={styles.creditsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.creditsContent}>
              <View style={styles.creditsLeft}>
                <View style={styles.creditsIconWrapper}>
                  <Ionicons 
                    name={hasEnoughCredits ? "checkmark-circle" : "alert-circle"} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>
                <View style={styles.creditsInfo}>
                  <Text style={styles.creditsLabel}>Event Cost</Text>
                  <Text style={styles.creditsAmount}>{eventPrice} Credits</Text>
                </View>
              </View>
              <View style={styles.creditsRight}>
                <Text style={styles.yourCreditsLabel}>Your Credits</Text>
                <Text style={styles.yourCreditsAmount}>{userCredits}</Text>
                {!hasEnoughCredits && (
                  <TouchableOpacity 
                    style={styles.addCreditsButton}
                    onPress={() => navigation.navigate('AddMoreCredits')}
                  >
                    <Text style={styles.addCreditsText}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
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
          {/* Event Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter event name"
                placeholderTextColor="#AAAAAA"
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
              />
            </View>
          </View>

          {/* Event Start Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Start</Text>
            <TouchableOpacity onPress={() => showDatePicker('start')} style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <Text style={[styles.input, styles.dateText]}>
                {eventStartDate ? formatDate(eventStartDate) : 'Select start date'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#AAAAAA" />
            </TouchableOpacity>
          </View>

          {/* Event End Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event End</Text>
            <TouchableOpacity 
              onPress={() => showDatePicker('end')} 
              style={[
                styles.inputContainer,
                !eventStartDate && styles.disabledInput
              ]}
              disabled={!eventStartDate}
            >
              <Ionicons 
                name="calendar-outline" 
                size={20} 
                color={!eventStartDate ? "#CCCCCC" : "#AAAAAA"} 
                style={styles.inputIcon} 
              />
              <Text 
                style={[
                  styles.input, 
                  styles.dateText,
                  !eventStartDate && styles.disabledText
                ]}
              >
                {eventEndDate 
                  ? formatDate(eventEndDate) 
                  : !eventStartDate 
                    ? 'Select start date first' 
                    : 'Select end date'
                }
              </Text>
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={!eventStartDate ? "#CCCCCC" : "#AAAAAA"} 
              />
            </TouchableOpacity>
            {eventStartDate && eventEndDate && (
              <Text style={styles.dateRangeText}>
                Duration: {calculateDurationText(eventStartDate, eventEndDate)}
              </Text>
            )}
          </View>

          {/* Event Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Description</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="document-text-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <TextInput
                placeholder="Describe your event (optional)"
                placeholderTextColor="#AAAAAA"
                style={[styles.input, styles.textArea]}
                value={eventDescription}
                onChangeText={setEventDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Access Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Access Code</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <Text style={[styles.input, styles.codeText]}>
                {isGeneratingCode ? 'Generating code...' : accessCode}
              </Text>
              <TouchableOpacity 
                onPress={generateUniqueAccessCode} 
                disabled={isGeneratingCode}
                style={isGeneratingCode ? styles.disabledButton : styles.refreshButton}
              >
                {isGeneratingCode ? (
                  <ActivityIndicator size="small" color="#AAAAAA" />
                ) : (
                  <Ionicons name="refresh" size={20} color="#FF6F61" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.codeHelpText}>
              Unique access code for your guests to join the event
            </Text>
          </View>
        </Animated.View>

        {/* Features Info */}
        <Animated.View 
          style={[
            styles.featuresCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.featuresTitle}>What's included:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="camera-outline" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Unlimited photo uploads</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people-outline" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Guest photo sharing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="download-outline" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>High-quality downloads</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="print-outline" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Instant photo printing</Text>
            </View>
          </View>
        </Animated.View>

        {/* Create Button */}
        <Animated.View 
          style={[
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[
              styles.createButton, 
              (!hasEnoughCredits || isLoading || isGeneratingCode) && styles.createButtonDisabled
            ]} 
            onPress={handleCreateEvent}
            disabled={!hasEnoughCredits || isLoading || isGeneratingCode}
          >
            <LinearGradient
              colors={(!hasEnoughCredits || isLoading || isGeneratingCode) ? ['#CCCCCC', '#AAAAAA'] : ['#FF8D76', '#FF6F61']}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <Text style={styles.createButtonText}>Creating...</Text>
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Event</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        minimumDate={datePickerMode === 'start' ? new Date() : eventStartDate || new Date()}
        date={datePickerMode === 'start' ? (eventStartDate || new Date()) : (eventEndDate || eventStartDate || new Date())}
      />
    </View>
  );
}

// Helper function to calculate duration between two dates
function calculateDurationText(startDate, endDate) {
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays === 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else if (diffHours === 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  }
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
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
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
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  creditsCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  creditsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  creditsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creditsIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  creditsRight: {
    alignItems: 'flex-end',
  },
  yourCreditsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  yourCreditsAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  addCreditsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addCreditsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
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
    minHeight: 50,
  },
  disabledInput: {
    backgroundColor: '#F9F9F9',
    borderColor: '#EEEEEE',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 0,
  },
  disabledText: {
    color: '#AAAAAA',
  },
  dateText: {
    paddingVertical: 14,
  },
  dateRangeText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
    marginLeft: 4,
  },
  textArea: {
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    letterSpacing: 1,
    color: '#FF6F61',
    fontWeight: '700',
  },
  codeHelpText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
    marginLeft: 4,
  },
  refreshButton: {
    padding: 8,
  },
  disabledButton: {
    padding: 8,
    opacity: 0.5,
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 16,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    shadowOpacity: 0.1,
  },
  createButtonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
  Linking
} from 'react-native';
import HeaderBar from '../../components/HeaderBar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase';
import { useAlert } from '../../context/AlertContext';

const { width } = Dimensions.get('window');

// Hour packages configuration
const HOUR_PACKAGES = [
  { hours: 2, credits: 10, label: '2 Hours', popular: false },
  { hours: 4, credits: 15, label: '4 Hours', popular: true },
  { hours: 6, credits: 25, label: '6 Hours', popular: false },
];

export default function NewEventScreen({ navigation }) {
  const [eventName, setEventName] = useState('');
  const [eventStartDate, setEventStartDate] = useState(null);
  const [eventEndDate, setEventEndDate] = useState(null);
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventImageUri, setEventImageUri] = useState(null); // Store local URI instead of uploaded URL
  const [accessCode, setAccessCode] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Add alert hook
  const { showAlert, showError, showSuccess, showConfirm } = useAlert();

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
  }, []);

  // Update end date when start date or package changes
  useEffect(() => {
    if (eventStartDate && selectedPackage) {
      const endDate = new Date(eventStartDate);
      endDate.setHours(endDate.getHours() + selectedPackage.hours);
      setEventEndDate(endDate);
    }
  }, [eventStartDate, selectedPackage]);

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

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };
  
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date) => {
    // Round to nearest hour
    const roundedDate = new Date(date);
    roundedDate.setMinutes(0, 0, 0);
    setEventStartDate(roundedDate);
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
        showError(
          'Code Generation Failed',
          'Unable to generate a unique access code. Please try again.',
          () => generateUniqueAccessCode()
        );
      }
    } catch (error) {
      console.error('Error generating unique code:', error);
      showError(
        'Connection Error',
        'Failed to generate access code due to network issues. Please check your connection and try again.',
        () => generateUniqueAccessCode()
      );
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCreateEvent = async () => {
    // Validation with custom alerts
    if (!eventName.trim()) {
      showAlert({
        title: 'Event Name Required',
        message: 'Please enter a name for your event. This will help guests identify and join your event.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return;
    }
    
    if (!eventLocation.trim()) {
      showAlert({
        title: 'Event Location Required',
        message: 'Please specify where your event will take place. This helps guests know where to go.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return;
    }
    
    if (!eventStartDate) {
      showAlert({
        title: 'Start Date Required',
        message: 'Please select when your event will begin. Guests need to know the event schedule.',
        type: 'warning',
        buttons: [
          { text: 'Select Date', style: 'primary', onPress: () => showDatePicker() }
        ]
      });
      return;
    }
    
    if (!selectedPackage) {
      showAlert({
        title: 'Duration Package Required',
        message: 'Please choose how long your event will last. This determines the event cost and duration.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return;
    }
    
    if (!accessCode) {
      showAlert({
        title: 'Access Code Missing',
        message: 'Please wait while we generate a unique access code for your event, or try refreshing the code.',
        type: 'info',
        buttons: [
          { text: 'Wait', style: 'cancel' },
          { text: 'Refresh Code', style: 'primary', onPress: () => generateUniqueAccessCode() }
        ]
      });
      return;
    }

    const finalAccessCode = accessCode;
    
    if (userCredits >= selectedPackage.credits) {
      // Show confirmation dialog
      showConfirm(
        'Create Event?',
        `Are you sure you want to create "${eventName}"?\n\n📍 Location: ${eventLocation}\n⏰ Duration: ${selectedPackage.hours} hours\n🎫 Access Code: ${finalAccessCode}\n💎 Cost: ${selectedPackage.credits} credits\n\n📅 Start: ${formatDateTime(eventStartDate)}\n📅 End: ${formatDateTime(eventEndDate)}`,
        async () => {
          // User confirmed - create the event
          await processEventCreation(finalAccessCode);
        },
        () => {
          // User cancelled - no action needed
          console.log('Event creation cancelled');
        }
      );
    } else {
      // Insufficient credits
      showAlert({
        title: 'Insufficient Credits 💎',
        message: `You need ${selectedPackage.credits} credits to create this ${selectedPackage.hours}-hour event, but you only have ${userCredits} credits.\n\nWould you like to purchase more credits to continue?`,
        type: 'warning',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Buy Credits', 
            style: 'primary', 
            onPress: () => navigation.navigate('AddMoreCredits') 
          }
        ]
      });
    }
  };

  const processEventCreation = async (finalAccessCode) => {
    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      if (user) {
        console.log("About to create event with code:", finalAccessCode);
        
        await createEventInFirestore(
          eventName, 
          eventLocation,
          eventStartDate, 
          eventEndDate, 
          eventDescription, 
          finalAccessCode,
          selectedPackage.hours,
          user.uid
        );
        await updateCredits(user.uid, userCredits - selectedPackage.credits);
        
        // Show success with detailed information
        showSuccess(
          'Event Created Successfully! 🎉',
          `"${eventName}" is now live and ready for guests!\n\n🎫 Share this code with your guests:\n${finalAccessCode}\n\n📍 ${eventLocation}\n⏰ ${selectedPackage.hours} hours\n📅 ${formatDateTime(eventStartDate)}`,
          () => {
            // Navigate back to tabs after success
            navigation.navigate('Tabs');
          }
        );
      }
    } catch (error) {
      console.error("Error during event creation:", error);
      
      // Show detailed error with retry option
      showError(
        'Event Creation Failed',
        'There was an issue creating your event. This could be due to a network connection problem or server issue. Your credits have not been deducted.',
        () => processEventCreation(finalAccessCode), // Retry function
        () => setIsLoading(false) // Cancel function
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to upload event image to Firebase Storage
  const uploadEventImageToStorage = async (imageUri) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `event_${user.uid}_${timestamp}.jpg`;
      
      // Create storage reference
      const storageRef = ref(storage, `event-main-picture/${fileName}`);
      
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Upload the image
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading event image:', error);
      throw error;
    }
  };

  // Function to delete event image from storage
  const deleteEventImage = async (imageUrl) => {
    try {
      if (!imageUrl || !imageUrl.includes('firebase')) {
        return;
      }

      const urlParts = imageUrl.split('/o/');
      if (urlParts.length < 2) {
        console.log('Invalid Firebase Storage URL format');
        return;
      }

      const pathPart = urlParts[1].split('?')[0];
      const filePath = decodeURIComponent(pathPart);
      
      console.log('Attempting to delete event image at path:', filePath);

      const oldImageRef = ref(storage, filePath);
      await deleteObject(oldImageRef);
      console.log('Event image deleted successfully:', filePath);
      
    } catch (error) {
      console.error('Error deleting event image:', error);
    }
  };

  // Function to pick event image (store locally, don't upload yet)
  const pickEventImage = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!granted) {
        showAlert({
          title: 'Photo Access Required 📸',
          message: 'PixPrint needs access to your photo library to add an event image. This helps make your event more appealing to guests.',
          type: 'warning',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              style: 'primary', 
              onPress: () => Linking.openSettings() 
            }
          ]
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [16, 9],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        showConfirm(
          'Use This Event Image?',
          'This image will be shown to guests when they join your event. It will be uploaded when the event is created.',
          () => {
            setEventImageUri(selectedImage.uri); // Store local URI
            
            showAlert({
              title: 'Event Image Selected! 🎉',
              message: 'Your event image has been selected. It will be uploaded when you create the event.',
              type: 'success',
              buttons: [
                { text: 'Great!', style: 'primary' }
              ]
            });
          },
          () => {
            console.log('Event image selection cancelled');
          }
        );
      }
    } catch (error) {
      console.error('Error picking event image:', error);
      showError(
        'Image Selection Failed',
        'Unable to access your photo library. Please try again or check your device settings.',
        () => pickEventImage(),
        () => {}
      );
    }
  };

  // Function to remove event image
  const removeEventImage = () => {
    showConfirm(
      'Remove Event Image?',
      'Are you sure you want to remove this event image?',
      () => {
        setEventImageUri(null);
        
        showAlert({
          title: 'Image Removed',
          message: 'The event image has been removed. You can add a new one anytime.',
          type: 'info',
          buttons: [
            { text: 'OK', style: 'primary' }
          ]
        });
      },
      () => {
        console.log('Remove image cancelled');
      }
    );
  };

  const createEventInFirestore = async (
    eventName, 
    eventLocation,
    eventStartDate, 
    eventEndDate, 
    eventDescription, 
    accessCode,
    duration,
    userId
  ) => {
    try {
      console.log("Creating event with access code:", accessCode);
      
      let eventPhotoUrl = '';
      
      // Upload image only if event creation is successful
      if (eventImageUri) {
        console.log("Uploading event image...");
        eventPhotoUrl = await uploadEventImageToStorage(eventImageUri);
        console.log("Event image uploaded successfully:", eventPhotoUrl);
      }
      
      const eventRef = collection(db, 'event_tbl');
      await addDoc(eventRef, {
        event_name: eventName,
        event_location: eventLocation,
        event_start_date: eventStartDate,
        event_end_date: eventEndDate,
        event_description: eventDescription,
        event_duration_hours: duration,
        event_photo_url: eventPhotoUrl,
        user_id: userId,
        event_code: accessCode,
        created_at: new Date(),
        status: 'active'
      });
      
      console.log("Event created successfully with image URL:", eventPhotoUrl);
    } catch (e) {
      console.error('Error creating event: ', e);
      throw e;
    }
  };

  const generateEventCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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

  // Format date and time for display
  const formatDateTime = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Enhanced package selection with feedback
  const handlePackageSelection = (pkg) => {
    setSelectedPackage(pkg);
    
    // Show brief info about the selected package
    if (pkg.popular) {
      showAlert({
        title: 'Great Choice! ⭐',
        message: `You've selected our most popular ${pkg.label} package. This gives you plenty of time for photos while being cost-effective at ${pkg.credits} credits.`,
        type: 'success',
        buttons: [
          { text: 'Perfect!', style: 'primary' }
        ]
      });
    }
  };

  const hasEnoughCredits = selectedPackage ? userCredits >= selectedPackage.credits : false;

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

          {/* Event Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Location</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter event location"
                placeholderTextColor="#AAAAAA"
                style={styles.input}
                value={eventLocation}
                onChangeText={setEventLocation}
              />
            </View>
            <Text style={styles.locationHelpText}>
              e.g., "Central Park, New York" or "Wedding Hall, Downtown"
            </Text>
          </View>

          {/* Event Image Upload Section */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Image (Optional)</Text>
            
            {eventImageUri ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: eventImageUri }} style={styles.eventImage} />
                <View style={styles.imageOverlay}>
                  <TouchableOpacity 
                    style={styles.imageActionButton}
                    onPress={pickEventImage}
                  >
                    <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.imageActionButton, styles.removeButton]}
                    onPress={removeEventImage}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.imageBadge}>
                  <Text style={styles.imageBadgeText}>Will upload when event is created</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.imagePickerButton}
                onPress={pickEventImage}
              >
                <View style={styles.imagePickerContent}>
                  <Ionicons name="camera-outline" size={40} color="#AAAAAA" />
                  <Text style={styles.imagePickerText}>Add Event Image</Text>
                  <Text style={styles.imagePickerSubtext}>
                    Help guests identify your event with a photo
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Hour Package Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Event Duration</Text>
            <View style={styles.packageContainer}>
              {HOUR_PACKAGES.map((pkg, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.packageCard,
                    selectedPackage?.hours === pkg.hours && styles.packageCardSelected
                  ]}
                  onPress={() => handlePackageSelection(pkg)}
                >
                  {pkg.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Popular</Text>
                    </View>
                  )}
                  <Text style={styles.packageHours}>{pkg.label}</Text>
                  <Text style={styles.packageCredits}>{pkg.credits} Credits</Text>
                  <View style={styles.packageCheckbox}>
                    {selectedPackage?.hours === pkg.hours && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Event Start Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Start Date & Time</Text>
            <TouchableOpacity onPress={showDatePicker} style={styles.inputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
              <Text style={[styles.input, styles.dateText]}>
                {eventStartDate ? formatDateTime(eventStartDate) : 'Select start date & time'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#AAAAAA" />
            </TouchableOpacity>
          </View>

          {/* Event End Date (Auto-calculated) */}
          {eventStartDate && selectedPackage && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Event End Date & Time</Text>
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <Ionicons name="calendar-outline" size={20} color="#CCCCCC" style={styles.inputIcon} />
                <Text style={[styles.input, styles.dateText, styles.disabledText]}>
                  {formatDateTime(eventEndDate)}
                </Text>
                <Ionicons name="lock-closed" size={16} color="#CCCCCC" />
              </View>
              <Text style={styles.autoCalculatedText}>
                Automatically calculated based on selected duration
              </Text>
            </View>
          )}

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

        {/* Credits Display Card */}
        {selectedPackage && (
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
                    <Text style={styles.creditsLabel}>Event Cost ({selectedPackage.label})</Text>
                    <Text style={styles.creditsAmount}>{selectedPackage.credits} Credits</Text>
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
        )}

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
              (!hasEnoughCredits || isLoading || isGeneratingCode || !selectedPackage) && styles.createButtonDisabled
            ]} 
            onPress={handleCreateEvent}
            disabled={!hasEnoughCredits || isLoading || isGeneratingCode || !selectedPackage}
          >
            <LinearGradient
              colors={(!hasEnoughCredits || isLoading || isGeneratingCode || !selectedPackage) ? ['#CCCCCC', '#AAAAAA'] : ['#FF8D76', '#FF6F61']}
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
        minimumDate={new Date()}
        date={eventStartDate || new Date()}
        minuteInterval={60} // Only allow hour intervals
      />
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
  locationHelpText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  autoCalculatedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
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
  packageContainer: {
    gap: 12,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageCardSelected: {
    borderColor: '#FF6F61',
    backgroundColor: '#FFF8F7',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF6F61',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  packageHours: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  packageCredits: {
    fontSize: 16,
    color: '#666666',
    marginRight: 12,
  },
  packageCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6F61',
    justifyContent: 'center',
    alignItems: 'center',
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
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  eventImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '500',
  },
  imagePickerButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginTop: 12,
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  imageBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 111, 97, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  uploadingOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '500',
  },
  imagePickerButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    minHeight: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginTop: 12,
  },
  imagePickerSubtext: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal,
  Animated,
  Dimensions,
  ImageBackground
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';
import JoinEventBottomNavigator from '../../components/JoinEventBottomNavigator';
import { db, auth } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { useAlert } from '../../context/AlertContext';

const { width, height } = Dimensions.get('window');

export default function JoinEventScreenTwo({ route, navigation }) {
  // Extract eventId and guest info from route params
  const { eventId, username: guestUsername } = route.params || {};
  
  // State variables
  const [eventName, setEventName] = useState(''); 
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartDate, setEventStartDate] = useState(null);
  const [eventEndDate, setEventEndDate] = useState(null);
  const [eventImage, setEventImage] = useState(null); // Add state for event image
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('person');
  const [activeTab, setActiveTab] = useState('gallery');
  const [eventCode, setEventCode] = useState('');
  const [eventTime, setEventTime] = useState('All Day');
  const [eventCreatorId, setEventCreatorId] = useState(null);
  const [userCredits, setUserCredits] = useState(0); // This will now be updated in real-time
  const [isEventCreator, setIsEventCreator] = useState(false);
  const [extensionAlertShown, setExtensionAlertShown] = useState(false);
  
  // Updated state for different photo categories
  const [eventPhotos, setEventPhotos] = useState([]);
  const [myPhotos, setMyPhotos] = useState([]);
  const [photographerPhotos, setPhotographerPhotos] = useState([]); // Add new state for photographer photos
  const [photosLoading, setPhotosLoading] = useState(false);
  
  // Add alert hook
  const { showAlert, showError, showSuccess, showConfirm } = useAlert();
  
  // Add ref for unsubscribe function
  const unsubscribeCredits = useRef(null);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.6],
    extrapolate: 'clamp'
  });

  // Extension pricing configuration
  const extensionOptions = [
    { hours: 2, credits: 10, label: '2 Hours' },
    { hours: 4, credits: 15, label: '4 Hours' },
    { hours: 6, credits: 25, label: '6 Hours' }
  ];

  // Updated function to fetch user credits with real-time listener
  const fetchUserCredits = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Set up Firestore real-time listener to fetch user's credits
      const creditsRef = collection(db, 'credits_tbl');
      const q = query(creditsRef, where('user_id', '==', currentUser.uid));

      unsubscribeCredits.current = onSnapshot(q, (querySnapshot) => {
        let totalCredits = 0;
        querySnapshot.forEach(doc => {
          totalCredits += doc.data().credits;
        });
        setUserCredits(totalCredits);
      }, (error) => {
        console.error('Error fetching user credits:', error);
        setUserCredits(0); // Set to 0 on error
      });

    } catch (error) {
      console.error('Error setting up credits listener:', error);
      setUserCredits(0);
    }
  };

  // Updated function to update user credits - now adds to credits_tbl
  const updateUserCredits = async (creditsToDeduct) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;

      // Add a negative credit entry to deduct credits
      const creditsRef = collection(db, 'credits_tbl');
      await addDoc(creditsRef, {
        user_id: currentUser.uid,
        credits: -creditsToDeduct, // Negative value to deduct
        transaction_type: 'event_extension',
        event_id: eventId,
        description: `Event extension for ${eventName}`,
        created_at: new Date(),
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user credits:', error);
      return false;
    }
  };

  // Function to extend event duration
  const extendEvent = async (additionalHours) => {
    try {
      if (!eventEndDate) return false;

      const newEndDate = new Date(eventEndDate);
      newEndDate.setHours(newEndDate.getHours() + additionalHours);

      const eventRef = doc(db, 'event_tbl', eventId);
      await updateDoc(eventRef, {
        event_end_date: newEndDate,
        last_extended_at: new Date(),
        total_extensions: (await getDoc(eventRef)).data()?.total_extensions + 1 || 1
      });

      setEventEndDate(newEndDate);
      return true;
    } catch (error) {
      console.error('Error extending event:', error);
      return false;
    }
  };

  // Function to show extension alert
  const showExtensionAlert = () => {
    if (extensionAlertShown) return;
    
    setExtensionAlertShown(true);

    showConfirm(
      '⏰ Event Ending Soon!',
      `Your event "${eventName}" will end in approximately 2 minutes.\n\n💳 Your Credits: ${userCredits}\n\nWould you like to extend the event duration?`,
      () => {
        showExtensionOptions();
      },
      () => {
        showAlert({
          title: 'Event Will End Soon',
          message: `Your event "${eventName}" will automatically end as scheduled. Thank you for using PixPrint!`,
          type: 'info',
          buttons: [
            { text: 'OK', style: 'primary' }
          ]
        });
      }
    );
  };

  // Function to show extension options
  const showExtensionOptions = () => {
    const optionButtons = extensionOptions.map(option => ({
      text: `${option.label} (${option.credits} credits)`,
      style: userCredits >= option.credits ? 'primary' : 'disabled',
      disabled: userCredits < option.credits,
      onPress: () => {
        if (userCredits >= option.credits) {
          handleExtensionPurchase(option);
        } else {
          showInsufficientCreditsAlert(option.credits);
        }
      }
    }));

    optionButtons.push({
      text: 'Cancel',
      style: 'cancel'
    });

    showAlert({
      title: '🕐 Extend Event Duration',
      message: `Choose how long you want to extend your event:\n\n💳 Available Credits: ${userCredits}\n\n⏰ Current End Time: ${eventEndDate?.toLocaleString()}\n\nExtension Pricing:`,
      type: 'info',
      buttons: optionButtons
    });
  };

  // Function to handle extension purchase
  const handleExtensionPurchase = (option) => {
    const newEndTime = new Date(eventEndDate);
    newEndTime.setHours(newEndTime.getHours() + option.hours);

    showConfirm(
      '✅ Confirm Extension',
      `Extend "${eventName}" by ${option.label}?\n\n💰 Cost: ${option.credits} credits\n💳 Remaining Credits: ${userCredits - option.credits}\n\n⏰ New End Time: ${newEndTime.toLocaleString()}\n\nThis action cannot be undone.`,
      async () => {
        setLoading(true);
        
        try {
          // Deduct credits first (this will be reflected in real-time via the listener)
          const creditsUpdated = await updateUserCredits(option.credits);
          
          if (!creditsUpdated) {
            throw new Error('Failed to update credits');
          }

          // Extend the event
          const eventExtended = await extendEvent(option.hours);
          
          if (!eventExtended) {
            throw new Error('Failed to extend event');
          }

          showSuccess(
            '🎉 Event Extended Successfully!',
            `Your event has been extended by ${option.label}!\n\n⏰ New End Time: ${newEndTime.toLocaleString()}\n💳 Credits will be updated shortly\n\nEnjoy your extended event time!`,
            () => {
              // Refresh event data
              fetchEventData();
            }
          );

        } catch (error) {
          console.error('Extension error:', error);
          showError(
            'Extension Failed',
            'Unable to extend your event at this time. Please check your connection and try again. Your credits have not been charged.',
            () => showExtensionOptions(),
            () => {}
          );
        } finally {
          setLoading(false);
        }
      },
      () => {
        showExtensionOptions();
      }
    );
  };

  // Function to show insufficient credits alert
  const showInsufficientCreditsAlert = (requiredCredits) => {
    showAlert({
      title: '💳 Insufficient Credits',
      message: `You need ${requiredCredits} credits for this extension.\n\n💳 Your Credits: ${userCredits}\n💰 Credits Needed: ${requiredCredits - userCredits} more\n\nPurchase more credits to extend your event duration.`,
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Buy Credits', 
          style: 'primary',
          onPress: () => {
            showAlert({
              title: 'Credits Store',
              message: 'Credits purchase feature coming soon! Contact support for credit top-ups.',
              type: 'info',
              buttons: [{ text: 'OK', style: 'primary' }]
            });
          }
        }
      ]
    });
  };

  // Function to check if event is about to end and show alert
  const checkEventEndingStatus = () => {
    if (!eventEndDate || !isEventCreator || extensionAlertShown) return;

    const now = new Date();
    const timeDiff = eventEndDate.getTime() - now.getTime();
    const minutesUntilEnd = Math.floor(timeDiff / (1000 * 60));

    if (minutesUntilEnd <= 2 && minutesUntilEnd > 0) {
      showExtensionAlert();
    }
  };

  // Function to check if event is finished or ongoing
  const getEventStatus = () => {
    const now = new Date();
    
    if (eventEndDate) {
      return now > eventEndDate ? 'finished' : 'active';
    }
    
    if (eventStartDate) {
      const eventEnd = new Date(eventStartDate);
      eventEnd.setHours(eventEnd.getHours() + 24);
      return now > eventEnd ? 'finished' : 'active';
    }
    
    return 'active';
  };
  // Function to fetch all event photos from Firebase (excluding photographer photos)
  const fetchEventPhotos = async () => {
    if (!eventId) return;
    
    try {
      setPhotosLoading(true);
      
      // First, get all photographers for this event to exclude their photos
      const joinedRef = collection(db, 'joined_tbl');
      const photographersQuery = query(
        joinedRef,
        where('event_id', '==', eventId),
        where('isPhotographer', '==', true)
      );
      
      const photographersSnapshot = await getDocs(photographersQuery);
      const photographerIds = [];
      
      photographersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.user_id) {
          photographerIds.push(data.user_id);
        }
      });
      
      // Now fetch all event photos
      const photosRef = collection(db, 'photos_tbl');
      const q = query(
        photosRef,
        where('event_id', '==', eventId)
      );
      
      const querySnapshot = await getDocs(q);
      const photos = [];
      
      querySnapshot.forEach((doc) => {
        const photoData = doc.data();
        
        // Exclude photos taken by photographers since they have their own dedicated album
        if (!photographerIds.includes(photoData.user_id)) {
          photos.push({
            id: doc.id,
            imageUrl: photoData.photo_url,
            username: photoData.username || 'Unknown User',
            uploadedAt: photoData.uploaded_at,
            filter: photoData.filter,
            filterName: photoData.filter_name,
            likes: photoData.likes || 0,
            comments: photoData.comments || 0,
            userId: photoData.user_id
          });
        }
      });
      
      const sortedPhotos = photos.sort((a, b) => {
        if (!a.uploadedAt && !b.uploadedAt) return 0;
        if (!a.uploadedAt) return 1;
        if (!b.uploadedAt) return -1;
        
        const dateA = a.uploadedAt.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
        const dateB = b.uploadedAt.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
        
        return dateB.getTime() - dateA.getTime();
      });
      
      setEventPhotos(sortedPhotos);
      
    } catch (error) {
      setEventPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  };

  // Function to fetch current user's photos (including guest photos)
  const fetchMyPhotos = async () => {
    if (!eventId) return;
    
    const currentUser = auth.currentUser;
    
    try {
      setPhotosLoading(true);
      
      const photosRef = collection(db, 'photos_tbl');
      let q;
      
      if (currentUser) {
        // Authenticated user - get their photos
        q = query(
          photosRef,
          where('event_id', '==', eventId),
          where('user_id', '==', currentUser.uid)
        );
      } else if (guestUsername) {
        // Guest user - get photos by guest username
        q = query(
          photosRef,
          where('event_id', '==', eventId),
          where('is_guest', '==', true),
          where('guest_username', '==', guestUsername)
        );
      } else {
        // No user and no guest username - return empty
        setMyPhotos([]);
        return;
      }
      
      const querySnapshot = await getDocs(q);
      const photos = [];
      
      querySnapshot.forEach((doc) => {
        const photoData = doc.data();
        photos.push({
          id: doc.id,
          imageUrl: photoData.photo_url,
          username: photoData.username || 'Unknown User',
          uploadedAt: photoData.uploaded_at,
          filter: photoData.filter,
          filterName: photoData.filter_name,
          likes: photoData.likes || 0,
          comments: photoData.comments || 0,
          userId: photoData.user_id,
          isGuest: photoData.is_guest || false,
          guestUsername: photoData.guest_username
        });
      });
      
      const sortedPhotos = photos.sort((a, b) => {
        if (!a.uploadedAt && !b.uploadedAt) return 0;
        if (!a.uploadedAt) return 1;
        if (!b.uploadedAt) return -1;
        
        const dateA = a.uploadedAt.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
        const dateB = b.uploadedAt.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
        
        return dateB.getTime() - dateA.getTime();
      });
      
      setMyPhotos(sortedPhotos);
      
    } catch (error) {
      setMyPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  };

  // New function to fetch photographer photos
  const fetchPhotographerPhotos = async () => {
    if (!eventId) return;
    
    try {
      setPhotosLoading(true);
      
      // First, get all photographers for this event
      const joinedRef = collection(db, 'joined_tbl');
      const photographersQuery = query(
        joinedRef,
        where('event_id', '==', eventId),
        where('isPhotographer', '==', true)
      );
      
      const photographersSnapshot = await getDocs(photographersQuery);
      const photographerIds = [];
      
      photographersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.user_id) {
          photographerIds.push(data.user_id);
        }
      });
      
      if (photographerIds.length === 0) {
        setPhotographerPhotos([]);
        return;
      }
      
      // Then, get all photos taken by these photographers
      const photosRef = collection(db, 'photos_tbl');
      const photosQuery = query(
        photosRef,
        where('event_id', '==', eventId),
        where('user_id', 'in', photographerIds)
      );
      
      const photosSnapshot = await getDocs(photosQuery);
      const photos = [];
      
      photosSnapshot.forEach((doc) => {
        const photoData = doc.data();
        photos.push({
          id: doc.id,
          imageUrl: photoData.photo_url,
          username: photoData.username || 'Unknown User',
          uploadedAt: photoData.uploaded_at,
          filter: photoData.filter,
          filterName: photoData.filter_name,
          likes: photoData.likes || 0,
          comments: photoData.comments || 0,
          userId: photoData.user_id
        });
      });
      
      // Sort photos by upload date (newest first)
      const sortedPhotos = photos.sort((a, b) => {
        if (!a.uploadedAt && !b.uploadedAt) return 0;
        if (!a.uploadedAt) return 1;
        if (!b.uploadedAt) return -1;
        
        const dateA = a.uploadedAt.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
        const dateB = b.uploadedAt.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
        
        return dateB.getTime() - dateA.getTime();
      });
      
      setPhotographerPhotos(sortedPhotos);
      
    } catch (error) {
      console.error('Error fetching photographer photos:', error);
      setPhotographerPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  };

  // Updated fetchEventData function with creator check
  const fetchEventData = async () => {
    try {
      if (!eventId) {
        setLoading(false);
        return;
      }

      const eventRef = doc(db, 'event_tbl', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        
        setEventName(eventData.event_name || 'Unnamed Event');
        setEventCode(eventData.event_code || '');
        setEventLocation(eventData.event_location || 'Location not specified');
        setEventCreatorId(eventData.user_id);
        
        // Set event image - use uploaded image or default
        if (eventData.event_photo_url && eventData.event_photo_url.trim() !== '') {
          setEventImage({ uri: eventData.event_photo_url });
        } else {
          setEventImage(require('../../assets/avatar.png'));
        }
        
        // Check if current user is the event creator
        const currentUser = auth.currentUser;
        if (currentUser && eventData.user_id === currentUser.uid) {
          setIsEventCreator(true);
          await fetchUserCredits(); // Set up real-time credits listener for creator
        }
        
        // Store the actual date objects for status checking
        let startDateObj = null;
        let endDateObj = null;
        
        let formattedDateRange = 'No date specified';
        
        if (eventData.event_start_date && typeof eventData.event_start_date.toDate === 'function') {
          startDateObj = eventData.event_start_date.toDate();
          setEventStartDate(startDateObj);
          
          let startDate = startDateObj.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          
          if (eventData.event_end_date && typeof eventData.event_end_date.toDate === 'function') {
            endDateObj = eventData.event_end_date.toDate();
            setEventEndDate(endDateObj);
            
            if (startDateObj.toDateString() !== endDateObj.toDateString()) {
              const endDate = endDateObj.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });
              formattedDateRange = `${startDate} - ${endDate}`;
            } else {
              formattedDateRange = startDate;
            }
          } else {
            formattedDateRange = startDate;
          }
        } 
        else if (eventData.event_date && typeof eventData.event_date.toDate === 'function') {
          const dateObj = eventData.event_date.toDate();
          setEventStartDate(dateObj);
          formattedDateRange = dateObj.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
        }
        
        setEventDate(formattedDateRange);
        setEventDescription(eventData.event_description || 'No description available');

        // Extract time information
        let timeDisplay = "All Day";

        if (eventData.event_start_date && typeof eventData.event_start_date.toDate === 'function') {
          const startTimeObj = eventData.event_start_date.toDate();
          let startTime = startTimeObj.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          if (eventData.event_end_date && typeof eventData.event_end_date.toDate === 'function') {
            const endTimeObj = eventData.event_end_date.toDate();
            let endTime = endTimeObj.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            
            timeDisplay = `${startTime} - ${endTime}`;
          } else {
            timeDisplay = startTime;
          }

          setEventTime(timeDisplay);
        } else {
          setEventTime("All Day");
        }
        
      } else {
        setEventName('Event Not Found');
        setEventDate('');
        setEventLocation('');
        setEventDescription('The requested event could not be found.');
        setEventImage(require('../../assets/avatar.png')); // Default image for not found
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
      setEventImage(require('../../assets/avatar.png')); // Default image on error
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    if (!eventId) {
      setLoading(false);
    } else {
      fetchEventData();
      fetchEventPhotos();
    }
  }, [eventId]);

  // Update photos when category changes
  useEffect(() => {
    if (eventId) {
      if (selectedCategory === 'person') {
        fetchEventPhotos();
      } else if (selectedCategory === 'group') {
        fetchMyPhotos();
      } else if (selectedCategory === 'camera') {
        fetchPhotographerPhotos(); // Fetch photographer photos when camera tab is selected
      }
    }
  }, [selectedCategory]);

  // Set up interval to check event ending status (only for event creators)
  useEffect(() => {
    let interval;
    
    if (isEventCreator && eventEndDate) {
      interval = setInterval(() => {
        checkEventEndingStatus();
      }, 30000);
      
      checkEventEndingStatus();
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isEventCreator, eventEndDate, extensionAlertShown]);
  // Cleanup credits listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeCredits.current) {
        unsubscribeCredits.current();
      }
    };
  }, []);

  // Refresh photos when screen comes into focus (e.g., returning from camera)
  useFocusEffect(
    React.useCallback(() => {
      if (eventId) {
        // Refresh the current category's photos when screen comes into focus
        if (selectedCategory === 'person') {
          fetchEventPhotos();
        } else if (selectedCategory === 'group') {
          fetchMyPhotos();
        } else if (selectedCategory === 'camera') {
          fetchPhotographerPhotos();
        }
      }
    }, [eventId, selectedCategory])
  );
  

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Determine which set of images to display based on selected category
  let images = [];
  let galleryTitle = '';

  if (selectedCategory === 'person') {
    images = eventPhotos;
    galleryTitle = 'All Photos';
  } else if (selectedCategory === 'camera') {
    images = photographerPhotos; // Use real photographer photos instead of static data
    galleryTitle = 'Photographer';
  } else if (selectedCategory === 'group') {
    images = myPhotos;
    galleryTitle = 'My Photos';
  }

  // Handle the image click
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalVisible(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Pass guest info when navigating
    if (tab === 'camera') {
      navigation.navigate('Camera', { 
        eventId, 
        username: guestUsername 
      });
    } else if (tab === 'settings') {
      navigation.navigate('JoinEventSettings', { 
        eventId, 
        username: guestUsername 
      });
    }
  };

  // Get current event status
  const eventStatus = getEventStatus();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Event Cover with Animated Parallax Effect */}
        <Animated.View style={[styles.coverContainer, { opacity: imageOpacity }]}>
          <ImageBackground
            source={eventImage || require('../../assets/avatar.png')}
            style={styles.coverImage}
            resizeMode="cover"
          >
            <View style={styles.coverOverlay}>
              <View style={styles.eventStatus}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: eventStatus === 'active' ? '#4CD964' : '#FF6B6B' }
                ]} />
                <Text style={styles.statusText}>
                  {eventStatus === 'active' ? 'Active Event' : 'Event Finished'}
                </Text>
              </View>
              
              {/* Creator Badge - Show only to event creator */}
              {isEventCreator && (
                <View style={styles.creatorBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.creatorText}>Event Creator</Text>
                  <Text style={styles.creditsText}>{userCredits} Credits</Text>
                </View>
              )}

              {/* Guest Badge */}
              {guestUsername && !auth.currentUser && (
                <View style={styles.guestStatusBadge}>
                  <Ionicons name="person-outline" size={12} color="#4CAF50" />
                  <Text style={styles.guestStatusText}>Guest: {guestUsername}</Text>
                </View>
              )}
            </View>
          </ImageBackground>
        </Animated.View>

        {/* Event Info Card */}
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{eventName}</Text>
              {eventCode && (
                <View style={styles.eventCodeBadge}>
                  <Ionicons name="key-outline" size={14} color="#FF6F61" />
                  <Text style={styles.eventCodeText}>{eventCode}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-social" size={20} color="#FF6F61" />
            </TouchableOpacity>
          </View>

          {/* Date Row */}
          <View style={styles.dateRow}>
            <View style={styles.dateIconContainer}>
              <Ionicons name="calendar-outline" size={16} color="#FF6F61" />
            </View>
            <View style={styles.dateTextContainer}>
              <Text style={styles.date}>{eventDate}</Text>
              {eventDate && eventDate.includes(' - ') && (
                <View style={styles.multiDayBadge}>
                  <Text style={styles.multiDayText}>Multi-day Event</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.separator} />
          
          <Text style={styles.description}>{eventDescription}</Text>

          {/* Event stats without attendees */}
          <View style={styles.eventStats}>
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={18} color="#FF6F61" />
              <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">
                {eventLocation}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#FF6F61" />
              <Text style={styles.statValue}>{eventTime}</Text>
            </View>
          </View>
        </View>

        {/* Gallery Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Event Gallery</Text>
          <Text style={styles.photosCount}>
            {selectedCategory === 'person' ? eventPhotos.length : 
             selectedCategory === 'group' ? myPhotos.length : 
             images.length} Photos
          </Text>
        </View>

        {/* Category Selector */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity 
            style={[styles.categoryTab, selectedCategory === 'person' && styles.selectedCategoryTab]}
            onPress={() => handleCategoryChange('person')}
          >
            <Ionicons 
              name="grid-outline" 
              size={20} 
              color={selectedCategory === 'person' ? '#FFFFFF' : '#666666'} 
            />
            <Text 
              style={[
                styles.categoryText, 
                selectedCategory === 'person' && styles.selectedCategoryText
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.categoryTab, selectedCategory === 'camera' && styles.selectedCategoryTab]}
            onPress={() => handleCategoryChange('camera')}
          >
            <Ionicons 
              name="camera" 
              size={20} 
              color={selectedCategory === 'camera' ? '#FFFFFF' : '#666666'} 
            />
            <Text 
              style={[
                styles.categoryText, 
                selectedCategory === 'camera' && styles.selectedCategoryText
              ]}
            >
              Photographer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.categoryTab, selectedCategory === 'group' && styles.selectedCategoryTab]}
            onPress={() => handleCategoryChange('group')}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={selectedCategory === 'group' ? '#FFFFFF' : '#666666'} 
            />
            <Text 
              style={[
                styles.categoryText, 
                selectedCategory === 'group' && styles.selectedCategoryText
              ]}
            >
              Me
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gallery Title */}
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>{galleryTitle}</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF6F61" />
          </TouchableOpacity>
        </View>

        {/* Loading indicator for photos */}
        {photosLoading && (selectedCategory === 'person' || selectedCategory === 'group' || selectedCategory === 'camera') && (
          <View style={styles.photosLoadingContainer}>
            <ActivityIndicator size="small" color="#FF6F61" />
            <Text style={styles.photosLoadingText}>Loading photos...</Text>
          </View>
        )}

        {/* No photos message for All category */}
        {!photosLoading && selectedCategory === 'person' && eventPhotos.length === 0 && (
          <View style={styles.noPhotosContainer}>
            <Ionicons name="images-outline" size={48} color="#CCC" />
            <Text style={styles.noPhotosText}>No photos uploaded yet</Text>
            <Text style={styles.noPhotosSubtext}>Be the first to capture memories!</Text>
          </View>
        )}

        {/* No photos message for My Photos category */}
        {!photosLoading && selectedCategory === 'group' && myPhotos.length === 0 && (
          <View style={styles.noPhotosContainer}>
            <Ionicons name="camera-outline" size={48} color="#CCC" />
            <Text style={styles.noPhotosText}>
              {guestUsername && !auth.currentUser ? 
                "You haven't captured any photos yet as a guest" :
                "You haven't captured any photos yet"
              }
            </Text>
            <Text style={styles.noPhotosSubtext}>
              {guestUsername && !auth.currentUser ? 
                "Start taking photos to see them here! Create an account to save your memories permanently." :
                "Start taking photos to see them here!"
              }
            </Text>
            
            {/* Account creation prompt for guests */}
            {guestUsername && !auth.currentUser && (
              <TouchableOpacity 
                style={styles.createAccountButton}
                onPress={() => navigation.navigate('SignUp', { 
                  guestUsername, 
                  eventId 
                })}
              >
                <Text style={styles.createAccountButtonText}>Create Account</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* No photos message for Photographer category */}
        {!photosLoading && selectedCategory === 'camera' && photographerPhotos.length === 0 && (
          <View style={styles.noPhotosContainer}>
            <Ionicons name="camera-outline" size={48} color="#CCC" />
            <Text style={styles.noPhotosText}>No photographer photos yet</Text>
            <Text style={styles.noPhotosSubtext}>Photos taken by event photographers will appear here</Text>
          </View>
        )}

        {/* Image Gallery Grid - Instagram Style */}
        {images.length > 0 && (
          <View style={styles.instaGrid}>
            {(selectedCategory === 'person' || selectedCategory === 'group' || selectedCategory === 'camera') ? (
              // For all dynamic photo arrays (All Photos, My Photos, and Photographer Photos)
              images.map((photo, index) => {
                const isFirstInRow = index % 3 === 0;
                
                if (isFirstInRow) {
                  return (
                    <View key={`row-${index}`} style={styles.instaGridRow}>
                      {[0, 1, 2].map((colIndex) => {
                        const photoIndex = index + colIndex;
                        const currentPhoto = images[photoIndex];
                        if (!currentPhoto) return null;
                        
                        return (
                          <TouchableOpacity
                            key={`image-${currentPhoto.id}`}
                            style={styles.instaEqualImage}
                            onPress={() => handleImageClick(currentPhoto.imageUrl)}
                          >
                            <Image 
                              source={{ uri: currentPhoto.imageUrl }} 
                              style={styles.eventImage} 
                              resizeMode="cover"
                            />
                            {currentPhoto.filterName && currentPhoto.filterName !== 'None' && (
                              <View style={styles.filterBadge}>
                                <Text style={styles.filterBadgeText}>{currentPhoto.filterName}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                }
                return null;
              })
            ) : null}
          </View>
        )}

        {/* Bottom Space for Navigator */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={closeModal}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={styles.modalImage} />
          
          <View style={styles.modalControls}>
            <TouchableOpacity style={styles.modalControlButton}>
              <Ionicons name="heart-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalControlButton, styles.modalControlButton]}>
              <Ionicons name="print-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalControlButton}>
              <Ionicons name="share-social-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalControlButton}>
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Enhanced Floating Bottom Navigator */}
      <JoinEventBottomNavigator 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        eventId={eventId}
        navigation={navigation}
        guestUsername={guestUsername} // Pass guest info
      />
    </View>
  );
}

// Updated styles with new creator badge styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 104,
  },
  scrollContent: {
    paddingTop: 10,
  },
  // Cover Image Styles
  coverContainer: {
    height: 220,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  coverImage: {
    height: '100%',
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    justifyContent: 'space-between',
    padding: 15,
  },
  eventStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // New Creator Badge Styles
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  creatorText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 8,
  },
  creditsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  // Guest Status Badge Styles
  guestStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  guestStatusText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Event Card Styles
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  eventCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  eventCodeText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '600',
    marginLeft: 5,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  dateIconContainer: {
    marginRight: 6,
  },
  dateTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  multiDayBadge: {
    backgroundColor: '#FF6F61',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  multiDayText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    marginBottom: 16,
  },
  // Event stats without attendees
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    marginLeft: 6,
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E5E5E5',
  },
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  photosCount: {
    fontSize: 14,
    color: '#888',
  },
  // Category Selector Styles
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F0F2F5',
    borderRadius: 30,
    padding: 4,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
    flex: 1,
  },
  selectedCategoryTab: {
    backgroundColor: '#FF6F61',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Gallery Header Styles
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '500',
  },
  // Image Grid Styles
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  imageContainer: {
    width: (width - 48) / 3,
    aspectRatio: 1,
    marginRight: 4,
    marginBottom: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  largeImageContainer: {
    width: (width - 44) / 2,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  largeEventImage: {
    height: '100%',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalControls: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 30,
    justifyContent: 'center',
  },
  modalControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  // Instagram-style grid
  instaGrid: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  instaGridRow: {
    flexDirection: 'row',
    height: width * 0.3,
    marginBottom: 4,
  },
  instaMainImage: {
    width: '66%',
    height: '100%',
    borderRadius: 12,
    marginRight: 4,
    overflow: 'hidden',
  },
  instaSecondaryColumn: {
    width: '33%',
    height: '100%',
    justifyContent: 'space-between',
  },
  instaSecondaryImage: {
    width: '100%',
    height: '49%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  instaEqualImage: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  printText: {
    color: '#fff',
    marginLeft: 5,
  },
  // Photo loading and empty states
  photosLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  photosLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#888',
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noPhotosText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 10,
  },
  noPhotosSubtext: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 5,
    textAlign: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  // Create Account Button Styles
  createAccountButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
  },
  createAccountButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

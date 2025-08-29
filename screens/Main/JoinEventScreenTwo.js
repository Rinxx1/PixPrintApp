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
  ImageBackground,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';
import JoinEventBottomNavigator from '../../components/JoinEventBottomNavigator';
import { db, auth } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase';
import { useAlert } from '../../context/AlertContext';
import { optimizeImageUrl, ImagePresets } from '../../utils/imageOptimization';

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
  const [selectedPhoto, setSelectedPhoto] = useState(null); // Add this to track the full photo object
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

  // Updated fetchEventData function with event image
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
        console.log('Event photo URL:', eventData.event_photo_url); // Debug log
        if (eventData.event_photo_url && eventData.event_photo_url.trim() !== '') {
          setEventImage({ uri: eventData.event_photo_url });
          console.log('Using event image:', eventData.event_photo_url);
        } else {
          setEventImage(require('../../assets/avatar.png'));
          console.log('Using default image');
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

  // Auto-close modal if selected photo no longer exists
  useEffect(() => {
    if (isModalVisible && selectedPhoto && !isPhotoStillExists(selectedPhoto.id)) {
      closeModal();
    }
  }, [eventPhotos, myPhotos, photographerPhotos, isModalVisible, selectedPhoto]);

  // New function to delete a photo
  const deletePhoto = async (photoId, imageUrl) => {
    try {
      // Delete from Firestore
      const photoRef = doc(db, 'photos_tbl', photoId);
      await deleteDoc(photoRef);

      // Delete from Firebase Storage if it's a Firebase Storage URL
      if (imageUrl && imageUrl.includes('firebase')) {
        try {
          // Extract the file path from the Firebase Storage URL
          const urlParts = imageUrl.split('/o/');
          if (urlParts.length >= 2) {
            const pathPart = urlParts[1].split('?')[0];
            const filePath = decodeURIComponent(pathPart);
            
            // Create reference to the image and delete it
            const imageRef = ref(storage, filePath);
            await deleteObject(imageRef);
            console.log('Image deleted from storage:', filePath);
          }
        } catch (storageError) {
          console.error('Error deleting image from storage:', storageError);
          // Don't throw error as Firestore deletion was successful
        }
      }

      // Refresh all photo categories to ensure consistency
      if (selectedCategory === 'person') {
        fetchEventPhotos();
      } else if (selectedCategory === 'group') {
        fetchMyPhotos();
      } else if (selectedCategory === 'camera') {
        fetchPhotographerPhotos();
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  };

  // Function to handle photo deletion with confirmation
  const handleDeletePhoto = (photo) => {
    showConfirm(
      'Delete Photo? 🗑️',
      `Are you sure you want to delete this photo?`,
      async () => {
        setLoading(true);
        
        try {
          await deletePhoto(photo.id, photo.imageUrl);
          
          // Close modal and clear selected photo immediately after deletion
          closeModal();
          
          showSuccess(
            'Photo Deleted Successfully! ✅',
            'Your photo has been permanently removed from the event gallery.',
            () => {
              console.log('Photo deletion completed');
            }
          );
          
        } catch (error) {
          console.error('Delete photo error:', error);
          
          if (error.code === 'permission-denied') {
            showError(
              'Permission Denied',
              'You don\'t have permission to delete this photo. Only the photo owner can delete their photos.',
              () => handleDeletePhoto(photo),
              () => {}
            );
          } else if (error.code === 'not-found') {
            showError(
              'Photo Not Found',
              'This photo has already been deleted or doesn\'t exist. The gallery will be refreshed.',
              () => {
                closeModal();
                fetchMyPhotos();
              },
              () => {}
            );
          } else if (error.message.includes('network')) {
            showError(
              'Network Error',
              'Unable to delete the photo due to network issues. Please check your internet connection and try again.',
              () => handleDeletePhoto(photo),
              () => {}
            );
          } else {
            showError(
              'Delete Failed',
              'There was an error deleting your photo. Please try again or contact support if the problem persists.',
              () => handleDeletePhoto(photo),
              () => {}
            );
          }
        } finally {
          setLoading(false);
        }
      },
      () => {
        console.log('Photo deletion cancelled');
      }
    );
  };

  // Function to check if current user can delete a photo
  const canDeletePhoto = (photo) => {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      // Authenticated user - can delete their own photos
      return photo.userId === currentUser.uid;
    } else if (guestUsername) {
      // Guest user - can delete photos they uploaded as guest
      return photo.isGuest && photo.guestUsername === guestUsername;
    }
    
    return false;
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Add optimized grid image component with enhanced skeleton loader
  const OptimizedGridImage = ({ photo, style, onPress }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const shimmerAnim = useState(new Animated.Value(0))[0];

    // Start shimmer animation when component mounts
    useEffect(() => {
      const shimmerLoop = () => {
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]).start(() => shimmerLoop());
      };
      
      if (loading) {
        shimmerLoop();
      }
      
      return () => shimmerAnim.stopAnimation();
    }, [loading]);

    const handleLoadEnd = () => {
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };

    const handleError = () => {
      setError(true);
      setLoading(false);
    };

    // Create shimmer effect
    const shimmerTranslateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-style.width || 100, style.width || 100],
    });

    return (
      <TouchableOpacity style={style} onPress={onPress}>
        {/* Enhanced skeleton loader with shimmer effect */}
        {loading && (
          <View style={[style, styles.imageSkeleton]}>
            <Animated.View 
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                }
              ]} 
            />
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonIconContainer}>
                <Ionicons name="image-outline" size={16} color="#E0E0E0" />
              </View>
            </View>
          </View>
        )}
         
        {/* Optimized thumbnail image */}
        <Animated.View style={[style, { opacity: fadeAnim }]}>
          <Image
            source={{ 
              uri: error ? null : optimizeImageUrl(photo.imageUrl, 'thumbnail'),
              cache: 'force-cache'
            }}
            style={styles.eventImage}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            resizeMode="cover"
            // Performance optimizations
            fadeDuration={0}
            progressiveRenderingEnabled={true}
            removeClippedSubviews={true}
          />
        </Animated.View>
        
        {/* Error fallback */}
        {error && (
          <View style={[style, styles.imageError]}>
            <Ionicons name="image-outline" size={16} color="#999" />
            <Text style={styles.errorText}>Failed to load</Text>
          </View>
        )}

      </TouchableOpacity>
    );
  };

  // Enhanced high-quality modal image component with responsive design
  const HighQualityModalImage = ({ imageUrl, style }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [error, setError] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const fadeAnim = useState(new Animated.Value(0))[0];
    const modalShimmerAnim = useState(new Animated.Value(0))[0];
    const scaleAnim = useState(new Animated.Value(0.8))[0];

    // Start modal shimmer animation when component mounts
    useEffect(() => {
      if (imageLoading) {
        const modalShimmerLoop = () => {
          Animated.sequence([
            Animated.timing(modalShimmerAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: false,
            }),
            Animated.timing(modalShimmerAnim, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: false,
            }),
          ]).start(() => modalShimmerLoop());
        };
        
        modalShimmerLoop();
      }
      
      return () => modalShimmerAnim.stopAnimation();
    }, [imageLoading]);

    const handleLoadEnd = (event) => {
      setImageLoading(false);
      
      // Get image dimensions for responsive sizing
      if (event.nativeEvent) {
        const { width: imgWidth, height: imgHeight } = event.nativeEvent;
        setImageDimensions({ width: imgWidth, height: imgHeight });
      }
      
      // Animate image appearance with scale and fade
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    };

    const handleError = () => {
      setError(true);
      setImageLoading(false);
    };

    // Create modal shimmer effect
    const modalShimmerTranslateX = modalShimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-300, 300],
    });

    // Calculate responsive image dimensions
    const getResponsiveImageStyle = () => {
      const maxWidth = width * 0.95;
      const maxHeight = height * 0.7;
      
      if (imageDimensions.width && imageDimensions.height) {
        const aspectRatio = imageDimensions.width / imageDimensions.height;
        
        if (aspectRatio > 1) {
          // Landscape image
          const calculatedWidth = Math.min(maxWidth, imageDimensions.width);
          const calculatedHeight = calculatedWidth / aspectRatio;
          return {
            width: calculatedWidth,
            height: Math.min(calculatedHeight, maxHeight),
          };
        } else {
          // Portrait image
          const calculatedHeight = Math.min(maxHeight, imageDimensions.height);
          const calculatedWidth = calculatedHeight * aspectRatio;
          return {
            width: Math.min(calculatedWidth, maxWidth),
            height: calculatedHeight,
          };
        }
      }
      
      // Fallback to responsive dimensions
      return {
        width: Math.min(maxWidth, width * 0.9),
        height: Math.min(maxHeight, height * 0.6),
      };
    };

    return (
      <Animated.View style={[getResponsiveImageStyle(), { transform: [{ scale: scaleAnim }] }]}>
        {/* Enhanced modal skeleton loader with shimmer effect */}
        {imageLoading && (
          <View style={[getResponsiveImageStyle(), styles.modalImageSkeleton]}>
            <Animated.View 
              style={[
                styles.modalShimmerOverlay,
                {
                  transform: [{ translateX: modalShimmerTranslateX }],
                }
              ]} 
            />
            <View style={styles.modalSkeletonContent}>
              <View style={styles.modalSkeletonIconContainer}>
                <Ionicons name="image-outline" size={48} color="#E0E0E0" />
              </View>
              <Text style={styles.modalSkeletonText}>Loading...</Text>
            </View>
          </View>
        )}
        
        {/* High-quality image with responsive sizing */}
        <Animated.View style={[getResponsiveImageStyle(), { opacity: fadeAnim }]}>
          <Image
            source={{ 
              uri: error ? null : optimizeImageUrl(imageUrl, 'high'), // High quality for modal
              cache: 'web'
            }}
            style={getResponsiveImageStyle()}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            resizeMode="contain"
            progressiveRenderingEnabled={true}
            fadeDuration={0}
          />
        </Animated.View>
        
        {/* Error fallback for modal */}
        {error && (
          <View style={[getResponsiveImageStyle(), styles.modalImageError]}>
            <Ionicons name="alert-circle-outline" size={48} color="#FFFFFF" />
            <Text style={styles.modalErrorText}>Unable to load image</Text>
            <Text style={styles.modalErrorSubtext}>Network error or file corrupted</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  // Add these computed values before the render section
  const galleryTitle = selectedCategory === 'person' ? 'All Photos' : 
                      selectedCategory === 'group' ? 'My Photos' : 
                      'Photographer Photos';

  const images = selectedCategory === 'person' ? eventPhotos : 
                selectedCategory === 'group' ? myPhotos : 
                photographerPhotos;

  const handleImageClick = (photo) => {
    setSelectedImage(photo.imageUrl);
    setSelectedPhoto(photo);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
    setSelectedPhoto(null);
  };

  // Check if selected photo still exists in current photo list
  const isPhotoStillExists = (photoId) => {
    if (!photoId) return false;
    
    if (selectedCategory === 'person') {
      return eventPhotos.some(photo => photo.id === photoId);
    } else if (selectedCategory === 'group') {
      return myPhotos.some(photo => photo.id === photoId);
    } else if (selectedCategory === 'camera') {
      return photographerPhotos.some(photo => photo.id === photoId);
    }
    
    return false;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
      <HeaderBar navigation={navigation} showBack={false} showDashboard={true}/>

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Event Cover with proper image handling */}
        <Animated.View style={[styles.coverContainer, { opacity: imageOpacity }]}>
          <ImageBackground
            source={eventImage || require('../../assets/avatar.png')}
            style={styles.coverImage}
            resizeMode="cover"
            onError={(error) => {
              console.log('ImageBackground error:', error);
              setEventImage(require('../../assets/avatar.png'));
            }}
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

        {/* Image Gallery Grid - Instagram Style with Optimized Images */}
        {images.length > 0 && (
          <View style={styles.instaGrid}>
            {(selectedCategory === 'person' || selectedCategory === 'group' || selectedCategory === 'camera') ? (
              // Instagram-style grid with equal squares
              images.map((photo, index) => {
                const row = Math.floor(index / 3);
                const col = index % 3;
                const isFirstInRow = col === 0;
                const isLastInRow = col === 2;
                const isFirstRow = row === 0;
                const isLastRow = row === Math.floor((images.length - 1) / 3);
                
                if (isFirstInRow) {
                  return (
                    <View key={`row-${row}`} style={styles.instaGridRow}>
                      {[0, 1, 2].map((colIndex) => {
                        const photoIndex = index + colIndex;
                        const currentPhoto = images[photoIndex];
                        if (!currentPhoto) return null;
                        
                        const isEdgeLeft = colIndex === 0;
                        const isEdgeRight = colIndex === 2;
                        const isEdgeTop = row === 0;
                        const isEdgeBottom = row === Math.floor((images.length - 1) / 3);
                        
                        return (
                          <OptimizedGridImage
                            key={`image-${currentPhoto.id}`}
                            photo={currentPhoto}
                            style={[
                              styles.instaEqualImage,
                              isEdgeLeft && styles.edgeLeft,
                              isEdgeRight && styles.edgeRight,
                              isEdgeTop && styles.edgeTop,
                              isEdgeBottom && styles.edgeBottom,
                            ]}
                            onPress={() => handleImageClick(currentPhoto)}
                          />
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

      {/* Enhanced Image Preview Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={closeModal}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <View style={styles.modalContainer}>
          {/* Enhanced close button with better positioning */}
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <View style={styles.closeButtonBackground}>
              <Ionicons name="close" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
          
          {/* Enhanced photo info overlay - positioned at top */}
          {selectedPhoto && selectedImage && (
            <View style={styles.modalInfoOverlay}>
              <View style={styles.modalInfoContent}>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="person-circle-outline" size={16} color="#fff" />
                  <Text style={styles.modalPhotoInfo}>
                    {selectedPhoto.username}
                  </Text>
                </View>
                {selectedPhoto.uploadedAt && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="time-outline" size={16} color="#fff" />
                    <Text style={styles.modalPhotoDate}>
                      {new Date(selectedPhoto.uploadedAt.toDate()).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                {selectedPhoto.filterName && selectedPhoto.filterName !== 'None' && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="color-palette-outline" size={16} color="#fff" />
                    <Text style={styles.modalPhotoFilter}>
                      {selectedPhoto.filterName}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          
          {/* High-quality modal image with responsive sizing */}
          {selectedImage && (
            <View style={styles.modalImageContainer}>
              <HighQualityModalImage
                imageUrl={selectedImage}
                style={styles.modalImage}
              />
            </View>
          )}
          
          {/* Enhanced modal controls with better spacing and responsive design */}
          <View style={styles.modalControls}>
            <TouchableOpacity style={styles.modalControlButton}>
              <View style={styles.controlButtonBackground}>
                <Ionicons name="heart-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalControlButton}>
              <View style={styles.controlButtonBackground}>
                <Ionicons name="print-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalControlButton}>
              <View style={styles.controlButtonBackground}>
                <Ionicons name="share-social-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalControlButton}>
              <View style={styles.controlButtonBackground}>
                <Ionicons name="download-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            {/* Delete button - only show if user can delete this photo */}
            {selectedPhoto && canDeletePhoto(selectedPhoto) && (
              <TouchableOpacity 
                style={styles.modalControlButton}
                onPress={() => handleDeletePhoto(selectedPhoto)}
              >
                <View style={[styles.controlButtonBackground, styles.deleteButtonBackground]}>
                  <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
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
  },
  scrollContent: {
    paddingTop: 30,
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
  // Enhanced Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  modalImage: {
    // This will be handled by the responsive component
    borderRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 20,
    zIndex: 10,
  },
  closeButtonBackground: {
    width: Platform.OS === 'ios' ? 48 : 44,
    height: Platform.OS === 'ios' ? 48 : 44,
    borderRadius: Platform.OS === 'ios' ? 24 : 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalInfoOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  modalInfoContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPhotoInfo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalPhotoDate: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
    opacity: 0.9,
  },
  modalPhotoFilter: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
    opacity: 0.8,
  },
  modalControls: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexWrap: 'wrap',
    maxWidth: width * 0.9,
  },
  modalControlButton: {
    marginHorizontal: 6,
    marginVertical: 4,
  },
  controlButtonBackground: {
    width: Platform.OS === 'ios' ? 52 : 48,
    height: Platform.OS === 'ios' ? 52 : 48,
    borderRadius: Platform.OS === 'ios' ? 26 : 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteButtonBackground: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
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
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  instaGridRow: {
    flexDirection: 'row',
    height: width / 3,
    marginBottom: 2,
  },
  instaEqualImage: {
    flex: 1,
    marginHorizontal: 1,
    overflow: 'hidden',
  },
  // Edge styling for Instagram-like appearance
  edgeLeft: {
    marginLeft: 0,
  },
  edgeRight: {
    marginRight: 0,
  },
  edgeTop: {
    marginTop: 0,
  },
  edgeBottom: {
    marginBottom: 0,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  // Enhanced skeleton loader styles
  imageSkeleton: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    width: '100%',
    height: '100%',
  },
  skeletonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  skeletonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
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

  
  // Modal image loading styles
  modalImageSkeleton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalShimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 100,
    height: '100%',
    borderRadius: 12,
  },
  modalSkeletonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalSkeletonIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSkeletonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  modalImageError: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  modalErrorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  modalErrorSubtext: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },

});

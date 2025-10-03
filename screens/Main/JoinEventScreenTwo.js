import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import ProgressiveImage from '../../components/ProgressiveImage';
import CachedImage from '../../components/CachedImage';
import imagePreloader from '../../utils/imagePreloader';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';
import JoinEventBottomNavigator from '../../components/JoinEventBottomNavigator';
import { db, auth } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase';
import { useAlert } from '../../context/AlertContext';
import { addToCartPrintQueue } from '../../utils/printService';

const { width, height } = Dimensions.get('window');

export default function JoinEventScreenTwo({ route, navigation }) {
  const { eventId, username: guestUsername } = route.params || {};
  
  const [eventName, setEventName] = useState(''); 
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStartDate, setEventStartDate] = useState(null);
  const [eventEndDate, setEventEndDate] = useState(null);
  const [eventImage, setEventImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('person');
  const [activeTab, setActiveTab] = useState('gallery');
  const [eventCode, setEventCode] = useState('');
  const [eventTime, setEventTime] = useState('All Day');
  const [eventCreatorId, setEventCreatorId] = useState(null);
  const [userCredits, setUserCredits] = useState(0);
  const [isEventCreator, setIsEventCreator] = useState(false);
  const [extensionAlertShown, setExtensionAlertShown] = useState(false);
  
  // Add state for print functionality
  const [isPrinting, setIsPrinting] = useState(false);

  const [eventPhotos, setEventPhotos] = useState([]);
  const [myPhotos, setMyPhotos] = useState([]);
  const [photographerPhotos, setPhotographerPhotos] = useState([]);  const [photosLoading, setPhotosLoading] = useState(false);
  
  const [displayedImages, setDisplayedImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  const IMAGES_PER_PAGE = 6;
  const { showAlert, showError, showSuccess, showConfirm } = useAlert();
  const unsubscribeCredits = useRef(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.6],
    extrapolate: 'clamp'
  });
  const extensionOptions = [
    { hours: 2, credits: 10, label: '2 Hours' },
    { hours: 4, credits: 15, label: '4 Hours' },
    { hours: 6, credits: 25, label: '6 Hours' }
  ];

  const fetchUserCredits = async () => {
    try {      const currentUser = auth.currentUser;
      if (!currentUser) return;

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
    }  };

  const updateUserCredits = async (creditsToDeduct) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;        const creditsRef = collection(db, 'credits_tbl');
        await addDoc(creditsRef, {
          user_id: currentUser.uid,
          credits: -creditsToDeduct,
          transaction_type: 'event_extension',
          event_id: eventId,
          description: `Event extension for ${eventName}`,
          created_at: new Date(),
        });
      
      return true;
    } catch (error) {
      console.error('Error updating user credits:', error);
      return false;
    }  };

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
    }  };

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
    );  };

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
    });  };

  const handleExtensionPurchase = (option) => {
    const newEndTime = new Date(eventEndDate);
    newEndTime.setHours(newEndTime.getHours() + option.hours);

    showConfirm(
      '✅ Confirm Extension',
      `Extend "${eventName}" by ${option.label}?\n\n💰 Cost: ${option.credits} credits\n💳 Remaining Credits: ${userCredits - option.credits}\n\n⏰ New End Time: ${newEndTime.toLocaleString()}\n\nThis action cannot be undone.`,
      async () => {
        setLoading(true);
          try {
          const creditsUpdated = await updateUserCredits(option.credits);
          
          if (!creditsUpdated) {
            throw new Error('Failed to update credits');
          }

          const eventExtended = await extendEvent(option.hours);
          
          if (!eventExtended) {
            throw new Error('Failed to extend event');
          }          showSuccess(
            '🎉 Event Extended Successfully!',
            `Your event has been extended by ${option.label}!\n\n⏰ New End Time: ${newEndTime.toLocaleString()}\n💳 Credits will be updated shortly\n\nEnjoy your extended event time!`,
            () => {
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
    );  };

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
    });  };

  const checkEventEndingStatus = () => {
    if (!eventEndDate || !isEventCreator || extensionAlertShown) return;

    const now = new Date();
    const timeDiff = eventEndDate.getTime() - now.getTime();
    const minutesUntilEnd = Math.floor(timeDiff / (1000 * 60));

    if (minutesUntilEnd <= 2 && minutesUntilEnd > 0) {
      showExtensionAlert();    }
  };
  const loadMoreImages = () => {
    if (isLoadingMore || !hasMoreImages) return;

    const currentImages = selectedCategory === 'person' ? eventPhotos : 
                         selectedCategory === 'group' ? myPhotos : 
                         photographerPhotos;

    const totalImages = currentImages.length;
    const currentDisplayed = displayedImages.length;

    if (currentDisplayed >= totalImages) {
      setHasMoreImages(false);
      return;
    }

    setIsLoadingMore(true);

    setTimeout(() => {
      // Double check that we're still on the same category to prevent race conditions
      const categoryImages = selectedCategory === 'person' ? eventPhotos : 
                            selectedCategory === 'group' ? myPhotos : 
                            photographerPhotos;
      
      if (categoryImages !== currentImages) {
        // Category changed during loading, abort
        setIsLoadingMore(false);
        return;
      }

      const nextPage = currentPage + 1;
      const startIndex = currentDisplayed;
      const endIndex = Math.min(startIndex + IMAGES_PER_PAGE, totalImages);
      
      const newImages = currentImages.slice(startIndex, endIndex);
      
      // Only add images if they're not already in the displayed list
      setDisplayedImages(prev => {
        const existingIds = new Set(prev.map(img => img.id));
        const uniqueNewImages = newImages.filter(img => !existingIds.has(img.id));
        return [...prev, ...uniqueNewImages];
      });
      
      setCurrentPage(nextPage);
      setHasMoreImages(endIndex < totalImages);
      setIsLoadingMore(false);
    }, 300);
  };const resetPagination = () => {
    setDisplayedImages([]);
    setCurrentPage(0);
    setHasMoreImages(true);
    setIsLoadingMore(false);
  };

  const initializeImages = (imagesArray) => {
    // Clear any existing state first
    setDisplayedImages([]);
    setCurrentPage(0);
    setHasMoreImages(false);
    setIsLoadingMore(false);

    if (!imagesArray || imagesArray.length === 0) {
      return;
    }

    // Use setTimeout to ensure state is cleared before setting new values
    setTimeout(() => {
      const firstPageImages = imagesArray.slice(0, IMAGES_PER_PAGE);
      setDisplayedImages(firstPageImages);
      setCurrentPage(1);
      setHasMoreImages(imagesArray.length > IMAGES_PER_PAGE);
    }, 50);
  };

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

  const fetchEventPhotos = async () => {
    if (!eventId) return;
    
    try {      setPhotosLoading(true);
      
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
      
      const photosRef = collection(db, 'photos_tbl');
      const q = query(
        photosRef,
        where('event_id', '==', eventId)
      );
      
      const querySnapshot = await getDocs(q);
      const photos = [];
      
      querySnapshot.forEach((doc) => {
        const photoData = doc.data();
        
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
      });      setEventPhotos(sortedPhotos);
      
      // Only initialize images if this category is currently selected
      if (selectedCategory === 'person') {
        initializeImages(sortedPhotos);
      }
      
    } catch (error) {
      setEventPhotos([]);
    } finally {
      setPhotosLoading(false);
    }  };

  const fetchMyPhotos = async () => {
    if (!eventId) return;
    
    const currentUser = auth.currentUser;
    
    try {
      setPhotosLoading(true);
      
      const photosRef = collection(db, 'photos_tbl');      let q;
      
      if (currentUser) {
        q = query(
          photosRef,
          where('event_id', '==', eventId),
          where('user_id', '==', currentUser.uid)
        );
      } else if (guestUsername) {
        q = query(
          photosRef,
          where('event_id', '==', eventId),
          where('is_guest', '==', true),
          where('guest_username', '==', guestUsername)
        );
      } else {
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
      });      setMyPhotos(sortedPhotos);
      
      // Only initialize images if this category is currently selected
      if (selectedCategory === 'group') {
        initializeImages(sortedPhotos);
      }
      
    } catch (error) {
      setMyPhotos([]);
    } finally {
      setPhotosLoading(false);
    }  };

  const fetchPhotographerPhotos = async () => {
    if (!eventId) return;
    
    try {      setPhotosLoading(true);
      
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
          userId: photoData.user_id        });
      });
      
      const sortedPhotos = photos.sort((a, b) => {
        if (!a.uploadedAt && !b.uploadedAt) return 0;
        if (!a.uploadedAt) return 1;
        if (!b.uploadedAt) return -1;
        
        const dateA = a.uploadedAt.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
        const dateB = b.uploadedAt.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
          return dateB.getTime() - dateA.getTime();
      });      setPhotographerPhotos(sortedPhotos);
      
      // Only initialize images if this category is currently selected
      if (selectedCategory === 'camera') {
        initializeImages(sortedPhotos);
      }
      
    } catch (error) {
      console.error('Error fetching photographer photos:', error);
      setPhotographerPhotos([]);
    } finally {
      setPhotosLoading(false);
    }  };

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
        setEventCode(eventData.event_code || '');        setEventLocation(eventData.event_location || 'Location not specified');
        setEventCreatorId(eventData.user_id);

        if (eventData.event_photo_url && eventData.event_photo_url.trim() !== '') {
          setEventImage({ uri: eventData.event_photo_url });
        } else {
          setEventImage(require('../../assets/avatar.png'));
        }
        
        const currentUser = auth.currentUser;
        if (currentUser && eventData.user_id === currentUser.uid) {
          setIsEventCreator(true);
          await fetchUserCredits();
        }        
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
        
      } else {        setEventName('Event Not Found');
        setEventDate('');
        setEventLocation('');
        setEventDescription('The requested event could not be found.');
        setEventImage(require('../../assets/avatar.png'));
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
      setEventImage(require('../../assets/avatar.png'));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (!eventId) {
      setLoading(false);
    } else {
      fetchEventData();
      fetchEventPhotos();
    }  }, [eventId]);  useEffect(() => {
    if (eventId) {
      // Reset pagination immediately when category changes
      resetPagination();
      
      // Initialize with existing data if available
      const currentImages = selectedCategory === 'person' ? eventPhotos : 
                           selectedCategory === 'group' ? myPhotos : 
                           photographerPhotos;
      
      if (currentImages.length > 0) {
        initializeImages(currentImages);
      } else {
        // Only fetch if we don't have data for this category
        if (selectedCategory === 'person' && eventPhotos.length === 0) {
          fetchEventPhotos();
        } else if (selectedCategory === 'group' && myPhotos.length === 0) {
          fetchMyPhotos();
        } else if (selectedCategory === 'camera' && photographerPhotos.length === 0) {
          fetchPhotographerPhotos();
        }
      }
    }
  }, [selectedCategory]);

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
    };  }, [isEventCreator, eventEndDate, extensionAlertShown]);

  useEffect(() => {
    return () => {
      if (unsubscribeCredits.current) {
        unsubscribeCredits.current();
      }
    };
  }, []);  useFocusEffect(
    React.useCallback(() => {
      if (eventId) {
        // Only fetch if we don't have data or if we're returning from a different screen
        const hasData = selectedCategory === 'person' ? eventPhotos.length > 0 : 
                       selectedCategory === 'group' ? myPhotos.length > 0 : 
                       photographerPhotos.length > 0;
        
        if (!hasData) {
          // Reset pagination only if no data
          resetPagination();
          
          if (selectedCategory === 'person') {
            fetchEventPhotos();
          } else if (selectedCategory === 'group') {
            fetchMyPhotos();
          } else if (selectedCategory === 'camera') {
            fetchPhotographerPhotos();
          }
        }
      }
    }, [eventId, selectedCategory])
  );
  useEffect(() => {
    // Only check if modal is visible and we have a selected photo
    if (isModalVisible && selectedPhoto && selectedPhoto.id) {
      const photoExists = isPhotoStillExists(selectedPhoto.id);
      if (!photoExists) {
        // Photo was deleted, close modal without triggering refreshes
        setIsModalVisible(false);
        setSelectedImage(null);
        setSelectedPhoto(null);
        setIsPrinting(false);
      }
    }
  }, [eventPhotos, myPhotos, photographerPhotos, isModalVisible, selectedPhoto]);

  const deletePhoto = async (photoId, imageUrl) => {
    try {
      const photoRef = doc(db, 'photos_tbl', photoId);
      await deleteDoc(photoRef);

      if (imageUrl && imageUrl.includes('firebase')) {
        try {
          const urlParts = imageUrl.split('/o/');
          if (urlParts.length >= 2) {
            const pathPart = urlParts[1].split('?')[0];
            const filePath = decodeURIComponent(pathPart);
            
            const imageRef = ref(storage, filePath);
            await deleteObject(imageRef);
            console.log('Image deleted from storage:', filePath);
          }
        } catch (storageError) {
          console.error('Error deleting image from storage:', storageError);
        }
      }

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
  const handleDeletePhoto = (photo) => {
    showConfirm(
      'Delete Photo? 🗑️',
      `Are you sure you want to delete this photo?`,
      async () => {
        setLoading(true);
        
        try {
          await deletePhoto(photo.id, photo.imageUrl);
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
  const canDeletePhoto = (photo) => {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      return photo.userId === currentUser.uid;
    } else if (guestUsername) {
      return photo.isGuest && photo.guestUsername === guestUsername;
    }
    
    return false;
  };
  const handleCategoryChange = useCallback((category) => {
    if (selectedCategory !== category) {
      setSelectedCategory(category);
    }
  }, [selectedCategory]);

  // Preload images when they change
  useEffect(() => {
    if (displayedImages.length > 0) {
      // Preload first batch of images
      const urlsToPreload = displayedImages.slice(0, 12).map(img => img.imageUrl).filter(Boolean);
      imagePreloader.preloadBatch(urlsToPreload, 'normal');
    }
  }, [displayedImages]);

  // Instagram-style Grid Image with progressive loading
  const InstagramGridImage = React.memo(({ photo, style, onPress, index }) => {
    const [isVisible, setIsVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
      // Stagger animation for smooth appearance
      const delay = index * 30; // 30ms delay between images
      const timer = setTimeout(() => {
        setIsVisible(true);
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }).start();
      }, delay);

      // Preload adjacent images
      const currentImages = selectedCategory === 'person' ? eventPhotos : 
                           selectedCategory === 'group' ? myPhotos : 
                           photographerPhotos;
      imagePreloader.preloadAdjacentImages(currentImages, index, 2);

      return () => clearTimeout(timer);
    }, [index]);

    const gridImageWidth = (width - 10) / 3;

    // Generate thumbnail URL (if using Firebase Storage, you can add resize params)
    const thumbnailUrl = photo.imageUrl ? 
      `${photo.imageUrl.split('?')[0]}?alt=media&w=200` : null;

    return (
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity 
          style={[style, styles.gridImageContainer]} 
          onPress={onPress}
          activeOpacity={0.9}
        >
          {isVisible ? (
            <ProgressiveImage
              source={{ uri: photo.imageUrl }}
              thumbnailSource={{ uri: thumbnailUrl }}
              style={[style, styles.gridImage]}
              resizeMode="cover"
              priority="normal"
            />
          ) : (
            <View style={[style, styles.gridImagePlaceholder]}>
              <SkeletonLoader width={gridImageWidth} height={gridImageWidth} borderRadius={0} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, (prevProps, nextProps) => {
    return prevProps.photo.imageUrl === nextProps.photo.imageUrl && 
           prevProps.index === nextProps.index;
  });

  // Instagram-style Modal Image with high-quality loading
  const InstagramModalImage = React.memo(({ imageUrl, index }) => {
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Preload adjacent images in modal
      const currentImages = selectedCategory === 'person' ? eventPhotos : 
                           selectedCategory === 'group' ? myPhotos : 
                           photographerPhotos;
      imagePreloader.preloadAdjacentImages(currentImages, index, 1);

      // Animate entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }, [imageUrl]);

    const handleLoad = (event) => {
      if (event?.source) {
        const { width: imgWidth, height: imgHeight } = event.source;
        if (imgWidth && imgHeight) {
          setImageDimensions({ width: imgWidth, height: imgHeight });
        }
      }
    };

    const getResponsiveImageStyle = () => {
      const maxWidth = width * 0.95;
      const maxHeight = height * 0.63;
      
      if (imageDimensions.width && imageDimensions.height) {
        const aspectRatio = imageDimensions.width / imageDimensions.height;
        
        if (aspectRatio > 1) {
          // Landscape
          const calculatedWidth = Math.min(maxWidth, imageDimensions.width);
          const calculatedHeight = calculatedWidth / aspectRatio;
          return {
            width: calculatedWidth,
            height: Math.min(calculatedHeight, maxHeight),
            borderRadius: 12,
          };
        } else {
          // Portrait or square
          const calculatedHeight = Math.min(maxHeight, imageDimensions.height);
          const calculatedWidth = calculatedHeight * aspectRatio;
          return {
            width: Math.min(calculatedWidth, maxWidth),
            height: calculatedHeight,
            borderRadius: 12,
          };
        }
      }
      
      return {
        width: Math.min(maxWidth, width * 0.9),
        height: Math.min(maxHeight, height * 0.6),
        borderRadius: 12,
      };
    };

    const imageStyle = getResponsiveImageStyle();
    const thumbnailUrl = imageUrl ? `${imageUrl.split('?')[0]}?alt=media&w=400` : null;

    return (
      <Animated.View 
        style={[
          imageStyle, 
          { 
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
            overflow: 'hidden',
          }
        ]}
      >
        <ProgressiveImage
          source={{ uri: imageUrl }}
          thumbnailSource={{ uri: thumbnailUrl }}
          style={[imageStyle, { borderRadius: 12 }]}
          resizeMode="contain"
          onLoadEnd={handleLoad}
          priority="high"
        />
      </Animated.View>
    );
  }, (prevProps, nextProps) => {
    return prevProps.imageUrl === nextProps.imageUrl;
  });

  // Simple skeleton loader component using LinearGradient
  const SkeletonLoader = ({ width, height, borderRadius = 0, style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width, width],
    });

    return (
      <View style={[{ width, height, backgroundColor: '#E8E8E8', borderRadius, overflow: 'hidden' }, style]}>
        <Animated.View style={{ transform: [{ translateX }], width: '100%', height: '100%' }}>
          <LinearGradient
            colors={['#E8E8E8', '#F5F5F5', '#E8E8E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: '100%', height: '100%' }}
          />
        </Animated.View>
      </View>
    );
  };

  const galleryTitle = selectedCategory === 'person' ? 'All Photos' : 
                      selectedCategory === 'group' ? 'My Photos' : 
                      'Photographer Photos';

  const images = selectedCategory === 'person' ? eventPhotos : 
                selectedCategory === 'group' ? myPhotos : 
                photographerPhotos;

  const handleScroll = (event) => {
    if (event && event.nativeEvent) {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 20; // How far from bottom to trigger loading
      
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
        loadMoreImages();
      }
    }
  };
  const handleImageClick = useCallback((photo, index = 0) => {
    setSelectedImage(photo.imageUrl);
    setSelectedPhoto(photo);
    setSelectedPhotoIndex(index);
    setIsModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedImage(null);
    setSelectedPhoto(null);
    setSelectedPhotoIndex(0);
    setIsPrinting(false); // Reset printing state when modal closes
  }, []);

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

  const handleTabChange = (tab) => {    setActiveTab(tab);
  };  // Add print handler function using global print service
  const handlePrintPhoto = async (photo) => {
    if (!photo || !photo.imageUrl || !eventId) {
      showError(
        'Print Error',
        'Unable to print this photo. Please try again.',
        () => {},
        () => {}
      );
      return;
    }

    // Use local loading state to prevent re-renders of the entire component
    const tempSetPrinting = (value) => {
      // Only update if the modal is still visible and photo is the same
      if (isModalVisible && selectedPhoto?.id === photo.id) {
        setIsPrinting(value);
      }
    };

    tempSetPrinting(true);

    try {
      // Use the global print service
      const success = await addToCartPrintQueue(photo, eventId, showSuccess, showError);
      
      if (!success) {
        // Error already handled by the print service
        tempSetPrinting(false);
        return;
      }

    } catch (error) {
      console.error('Error in handlePrintPhoto:', error);
      showError(
        '🖨️ Print Queue Error',
        'Failed to add photo to print queue. Please check your connection and try again.',
        () => handlePrintPhoto(photo), // Retry function
        () => {} // Cancel function
      );
    } finally {
      tempSetPrinting(false);
    }
  };

  const eventStatus = getEventStatus();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#48C6EF" />
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
          { useNativeDriver: true, listener: handleScroll }
        )}
        scrollEventThrottle={16}
      >
        {/* Event Cover with proper image handling */}
        <Animated.View style={[styles.coverContainer, { opacity: imageOpacity }]}>
          <View style={styles.coverImage}>
            <CachedImage
              source={eventImage || require('../../assets/avatar.png')}
              style={styles.coverImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('CachedImage error:', error);
                setEventImage(require('../../assets/avatar.png'));
              }}
              fallbackSource={require('../../assets/avatar.png')}
            />
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
              
              {isEventCreator && (
                <View style={styles.creatorBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.creatorText}>Event Creator</Text>
                  <Text style={styles.creditsText}>{userCredits} Credits</Text>
                </View>
              )}

              {guestUsername && !auth.currentUser && (
                <View style={styles.guestStatusBadge}>
                  <Ionicons name="person-outline" size={12} color="#4CAF50" />
                  <Text style={styles.guestStatusText}>Guest: {guestUsername}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{eventName}</Text>
              {eventCode && (
                <View style={styles.eventCodeBadge}>
                  <Ionicons name="key-outline" size={14} color="#48C6EF" />
                  <Text style={styles.eventCodeText}>{eventCode}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-social" size={20} color="#48C6EF" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateIconContainer}>
              <Ionicons name="calendar-outline" size={16} color="#48C6EF" />
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

          <View style={styles.eventStats}>
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={18} color="#48C6EF" />
              <Text style={styles.statValue} numberOfLines={1} ellipsizeMode="tail">
                {eventLocation}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#48C6EF" />
              <Text style={styles.statValue}>{eventTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Event Gallery</Text>
          <Text style={styles.photosCount}>
            {selectedCategory === 'person' ? eventPhotos.length : 
             selectedCategory === 'group' ? myPhotos.length : 
             images.length} Photos
          </Text>
        </View>

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

        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>{galleryTitle}</Text>
        </View>

        {photosLoading && (selectedCategory === 'person' || selectedCategory === 'group' || selectedCategory === 'camera') && (
          <View style={styles.photosLoadingContainer}>
            <ActivityIndicator size="small" color="#48C6EF" />
            <Text style={styles.photosLoadingText}>Loading photos...</Text>
          </View>
        )}

        {!photosLoading && selectedCategory === 'person' && eventPhotos.length === 0 && (
          <View style={styles.noPhotosContainer}>
            <Ionicons name="images-outline" size={48} color="#CCC" />
            <Text style={styles.noPhotosText}>No photos uploaded yet</Text>
            <Text style={styles.noPhotosSubtext}>Be the first to capture memories!</Text>
          </View>
        )}

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

        {!photosLoading && selectedCategory === 'camera' && photographerPhotos.length === 0 && (
          <View style={styles.noPhotosContainer}>
            <Ionicons name="camera-outline" size={48} color="#CCC" />
            <Text style={styles.noPhotosText}>No photographer photos yet</Text>
            <Text style={styles.noPhotosSubtext}>Photos taken by event photographers will appear here</Text>
          </View>
        )}

        {displayedImages.length > 0 && (
          <View style={styles.instaGrid}>
            {(selectedCategory === 'person' || selectedCategory === 'group' || selectedCategory === 'camera') ? (
              (() => {
                const rows = [];
                for (let i = 0; i < displayedImages.length; i += 3) {
                  const rowPhotos = displayedImages.slice(i, i + 3);
                  const rowIndex = Math.floor(i / 3);
                  
                  rows.push(
                    <View key={`row-${rowIndex}`} style={styles.instaGridRow}>
                      {rowPhotos.map((photo, colIndex) => {
                        const imageIndex = i + colIndex;
                        const isEdgeLeft = colIndex === 0;
                        const isEdgeRight = colIndex === 2 || colIndex === rowPhotos.length - 1;
                        const isEdgeTop = rowIndex === 0;
                        const isEdgeBottom = rowIndex === Math.floor((displayedImages.length - 1) / 3);
                        
                        return (
                          <InstagramGridImage
                            key={`image-${photo.id}-${imageIndex}`}
                            photo={photo}
                            index={imageIndex}
                            style={[
                              styles.instaEqualImage,
                              isEdgeLeft && styles.edgeLeft,
                              isEdgeRight && styles.edgeRight,
                              isEdgeTop && styles.edgeTop,
                              isEdgeBottom && styles.edgeBottom,
                            ]}
                            onPress={() => handleImageClick(photo, imageIndex)}
                          />
                        );
                      })}
                    </View>
                  );
                }
                return rows;
              })()
            ) : null}
          </View>
        )}

        {/* Load More Button / Loading Indicator for Lazy Loading */}
        {hasMoreImages && displayedImages.length > 0 && (
          <View style={styles.loadMoreContainer}>
            {isLoadingMore ? (
              <View style={styles.loadingMoreIndicator}>
                <ActivityIndicator size="small" color="#48C6EF" />
                <Text style={styles.loadingMoreText}>Loading more photos...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.loadMoreButton} onPress={loadMoreImages}>
                <Ionicons name="add-circle-outline" size={20} color="#48C6EF" />
                <Text style={styles.loadMoreButtonText}>Load More Photos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Show total count when all images are loaded */}
        {!hasMoreImages && displayedImages.length > 0 && images.length > IMAGES_PER_PAGE && (
          <View style={styles.allLoadedContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CD964" />
            <Text style={styles.allLoadedText}>All {images.length} photos loaded</Text>
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
              <InstagramModalImage
                key={`modal-${selectedImage}-${selectedPhotoIndex}`}
                imageUrl={selectedImage}
                index={selectedPhotoIndex}
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
              <TouchableOpacity 
              style={styles.modalControlButton}
              onPress={() => selectedPhoto && handlePrintPhoto(selectedPhoto)}
              disabled={isPrinting}
            >
              <View style={[styles.controlButtonBackground, isPrinting && styles.printingButtonBackground]}>
                {isPrinting ? (
                  <ActivityIndicator size={20} color="#fff" />
                ) : (
                  <Ionicons name="print-outline" size={20} color="#fff" />
                )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingTop: 30,
  },
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
    color: '#FFFFFF',    fontSize: 12,
    fontWeight: '600',
  },
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
    paddingHorizontal: 6,    paddingVertical: 2,
    borderRadius: 10,
  },
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
    fontSize: 11,    fontWeight: '600',
    marginLeft: 4,
  },
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
  },  eventCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F7FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },eventCodeText: {
    fontSize: 14,
    color: '#48C6EF',
    fontWeight: '600',
    marginLeft: 5,
  },  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F7FF',
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
  },  multiDayBadge: {
    backgroundColor: '#48C6EF',
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
    lineHeight: 22,    color: '#444',
    marginBottom: 16,
  },
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
    width: 1,    height: '80%',
    backgroundColor: '#E5E5E5',
  },
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
  photosCount: {    fontSize: 14,
    color: '#888',
  },
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
  },  selectedCategoryTab: {
    backgroundColor: '#48C6EF',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  selectedCategoryText: {    color: '#FFFFFF',
    fontWeight: '600',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: 'bold',    color: '#222',
  },

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
    height: '100%',  },
  largeEventImage: {
    height: '100%',
  },
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
  },  deleteButtonBackground: {    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  printingButtonBackground: {
    backgroundColor: 'rgba(72, 198, 239, 0.8)',
    borderColor: 'rgba(72, 198, 239, 0.3)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,    fontSize: 16,
    color: '#888',
  },  instaGrid: {
    paddingHorizontal: 2, // Small padding to prevent edge touching
    marginBottom: 20,
  },
  instaGridRow: {
    flexDirection: 'row',
    height: width / 3,
    marginBottom: 2,
  },  instaEqualImage: {
    width: (width - 10) / 3, // Screen width minus padding (4px) and spacing (6px) = 10px total
    marginHorizontal: 1,
    overflow: 'hidden',
  },
  gridImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
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
  },  eventImage: {
    width: '100%',    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  imageError: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#999',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  printText: {    color: '#fff',
    marginLeft: 5,
  },
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
  },  noPhotosSubtext: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 5,
    textAlign: 'center',
  },  createAccountButton: {
    backgroundColor: '#48C6EF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 14,    fontWeight: '600',
    textAlign: 'center',
  },
  loadMoreContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#48C6EF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },  loadMoreButtonText: {
    fontSize: 14,
    color: '#48C6EF',
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingMoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 10,
    fontWeight: '500',
  },
  allLoadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  allLoadedText: {
    fontSize: 13,
    color: '#4CD964',
    fontWeight: '500',    marginLeft: 6,
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

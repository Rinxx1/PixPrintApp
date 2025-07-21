import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  PanResponder,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../firebase'; // Make sure this import path is correct
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '../../context/AlertContext'; // Add this import

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

// Platform-specific alert helper
const useHybridAlert = () => {
  const { showAlert, showError, showSuccess, showConfirm } = useAlert();
  
  const hybridAlert = (title, message, buttons = []) => {
    if (Platform.OS === 'ios') {
      // Use native alerts on iOS for reliability
      Alert.alert(title, message, buttons);
    } else {
      // Use custom alerts on Android for better design
      const alertType = title.toLowerCase().includes('error') || title.toLowerCase().includes('failed') ? 'error' :
                       title.toLowerCase().includes('success') ? 'success' :
                       title.toLowerCase().includes('warning') || title.toLowerCase().includes('required') ? 'warning' : 'info';
      
      showAlert({
        title,
        message,
        type: alertType,
        buttons: buttons.map(btn => ({
          text: btn.text,
          style: btn.style || 'default',
          onPress: btn.onPress
        }))
      });
    }
  };

  const hybridError = (title, message, onRetry, onCancel) => {
    if (Platform.OS === 'ios') {
      const buttons = [];
      if (onRetry) buttons.push({ text: 'Retry', onPress: onRetry });
      if (onCancel) buttons.push({ text: 'Cancel', style: 'cancel', onPress: onCancel });
      if (buttons.length === 0) buttons.push({ text: 'OK' });
      Alert.alert(title, message, buttons);
    } else {
      showError(title, message, onRetry, onCancel);
    }
  };

  const hybridSuccess = (title, message, onOk) => {
    if (Platform.OS === 'ios') {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    } else {
      showSuccess(title, message, onOk);
    }
  };

  const hybridConfirm = (title, message, onYes, onNo) => {
    if (Platform.OS === 'ios') {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: onNo },
        { text: 'OK', onPress: onYes }
      ]);
    } else {
      showConfirm(title, message, onYes, onNo);
    }
  };

  return { hybridAlert, hybridError, hybridSuccess, hybridConfirm };
};

export default function CameraScreen({ route, navigation }) {
  // Get eventId and guest info from route params
  const { eventId, username: guestUsername } = route.params || {};
  
  const [cameraType, setCameraType] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showFilterTip, setShowFilterTip] = useState(true);
  const [filterIndex, setFilterIndex] = useState(0);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Add the missing state for gallery functionality
  const [isUploadingFromGallery, setIsUploadingFromGallery] = useState(false);
  
  // New states for photo preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [previewFilterName, setPreviewFilterName] = useState('None');
    // Add alert hook
  const { hybridAlert, hybridError, hybridSuccess, hybridConfirm } = useHybridAlert();
  
  // Ref for camera
  const cameraRef = useRef(null);
  
  // Animation values
  const filterOpacity = useRef(new Animated.Value(0)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const horizontalSwipeAnim = useRef(new Animated.Value(0)).current;
  const horizontalIndicatorAnim = useRef(new Animated.Value(0)).current;
  const shutterAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  // Filter options (including "No Filter" as first option)
  const filterOptions = [
    { name: 'None', color: null },
    { name: 'Red', color: 'red' },
    { name: 'Sky Blue', color: 'skyblue' },
    { name: 'Gold', color: 'gold' },
    { name: 'White', color: 'white' },
  ];

  const filterColors = {
    red: 'rgba(255, 0, 0, 0.15)',
    skyblue: 'rgba(135, 206, 250, 0.15)',
    gold: 'rgba(255, 215, 0, 0.15)',
    white: 'rgba(255, 255, 255, 0.15)',
  };

  // Add this for the dots to be more visible:
  const filterDotColors = {
    red: 'rgba(255, 0, 0, 0.7)',
    skyblue: 'rgba(135, 206, 250, 0.7)',
    gold: 'rgba(255, 215, 0, 0.7)',
    white: 'rgba(255, 255, 255, 0.7)',
    null: 'rgba(255, 255, 255, 0.3)',
  };

  // Filter selection feedback
  useEffect(() => {
    if (filterIndex > 0) {
      setSelectedFilter(filterOptions[filterIndex].color);
      Animated.timing(filterOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(filterOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setSelectedFilter(null);
      });
    }

    // Animate indicator to show current position
    Animated.spring(horizontalIndicatorAnim, {
      toValue: filterIndex * 20 - ((filterOptions.length - 1) * 10),
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [filterIndex]);

  // Create pan responder for horizontal filter swipe
  const horizontalFilterPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Don't capture taps
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to clear horizontal movements
        return Math.abs(gestureState.dx) > 10 && 
               Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Only capture clear horizontal movements
        return Math.abs(gestureState.dx) > 10 && 
               Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2;
      },
      onPanResponderGrant: () => {
        // Hide tip when user starts swiping
        if (showFilterTip) {
          Animated.timing(tipOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setShowFilterTip(false);
          });
        }
      },
      onPanResponderMove: (_, gestureState) => {
        // Allow horizontal swiping
        horizontalSwipeAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 20) { // Require less distance to change filter
          if (gestureState.dx > 0) {
            // Swipe right - previous filter
            setFilterIndex(prev => Math.max(0, prev - 1));
          } else {
            // Swipe left - next filter
            setFilterIndex(prev => Math.min(filterOptions.length - 1, prev + 1));
          }
        }
        
        // Reset animation with a spring effect
        Animated.spring(horizontalSwipeAnim, {
          toValue: 0,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Take photo function - updated to support guests and fix iOS issues
  const takePicture = async () => {
    if (isTakingPicture || !cameraRef.current) {
      return;
    }
      // Check authentication - allow guests for event photos
    const user = auth.currentUser;
    if (!eventId && !user) {
      hybridAlert(
        'Sign In Required', 
        'Please sign in to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', style: 'default', onPress: () => navigation.navigate('SignIn') }
        ]
      );
      return;
    }
    
    // For event photos, allow guests
    if (eventId && !user && !guestUsername) {
      hybridAlert(
        'Guest Access Required',
        'Join as guest to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Join as Guest', style: 'default', onPress: () => navigation.navigate('ContinueAsGuest') }
        ]
      );
      return;
    }
    
    // Animate shutter button
    Animated.sequence([
      Animated.timing(shutterAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shutterAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      setIsTakingPicture(true);
      
      // Take the photo
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: true,
      });
      
      // Apply filter if one is selected (filterIndex > 0 means a filter is applied)
      let processedPhoto = photo;
      if (filterIndex > 0 && filterOptions[filterIndex].color) {
        processedPhoto = await applyFilterToImage(photo.uri, filterOptions[filterIndex].color);
      } else {
        processedPhoto = await applyFilterToImage(photo.uri, null);
      }
      
      // iOS fix: Reset modal animation first
      modalAnim.setValue(0);
      
      // Set preview data
      setPreviewImageUri(processedPhoto.uri);
      setPreviewFilterName(filterOptions[filterIndex].name);
      setShowPreviewModal(true);
      
      // iOS fix: Use requestAnimationFrame for better timing
      if (Platform.OS === 'ios') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            Animated.spring(modalAnim, {
              toValue: 1,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start();
          });
        });
      } else {
        Animated.spring(modalAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
        } catch (error) {
      console.error("Error taking picture:", error);
      hybridError(
        'Camera Error',
        'Failed to capture photo. Please try again.',
        () => takePicture(), // Retry function
        () => {} // Cancel function
      );
    } finally {
      setIsTakingPicture(false);
    }
  };

  // Handle save photo - cleaned up version using native alert
  const handleSavePhoto = async () => {
    if (!previewImageUri || isUploading) return;
    
    try {
      setIsUploading(true);
      
      // Store the captured image locally for thumbnail
      setLastCapturedImage(previewImageUri);
      
      // Upload the photo to Firebase Storage
      await uploadPhotoToStorage(previewImageUri);
      
      // Reset upload state
      setIsUploading(false);
        // Show success message using hybrid alert
      hybridSuccess(
        'Photo Saved',
        `${previewFilterName !== 'None' ? `${previewFilterName} photo` : 'Photo'} saved successfully.`,
        () => handleClosePreview()
      );
      
    } catch (error) {
      console.error("Error saving photo:", error);
      setIsUploading(false);
      
      // Show error using hybrid alert
      hybridError(
        'Save Failed',
        'Unable to save photo. Please try again.',
        () => handleSavePhoto(), // Retry
        () => {} // Cancel
      );
    }
  };
  // Handle print photo with enhanced dialog using hybrid alert
  const handlePrintPhoto = () => {
    hybridAlert(
      'Print Coming Soon',
      'Print functionality will be available in the next update. Save photo instead?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save Photo', style: 'default', onPress: () => handleSavePhoto() }
      ]
    );
  };

  // Handle closing preview modal
  const handleClosePreview = () => {
    // Reset upload state when closing modal
    setIsUploading(false);
    
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPreviewModal(false);
      setPreviewImageUri(null);
      setPreviewFilterName('None');
    });
  };

  // Retake photo
  const handleRetakePhoto = () => {
    handleClosePreview();
  };

  // Simplified applyFilterToImage function - just resize and compress
  const applyFilterToImage = async (imageUri, filterColor) => {
    try {
      
      let manipulations = [{ resize: { width: 1080 } }];
      
      if (filterColor) {
        // Try to apply tint based on filter color
        let tintColor;
        switch (filterColor) {
          case 'red':
            tintColor = '#FF4444';
            break;
          case 'skyblue':
            tintColor = '#87CEEB';
            break;
          case 'gold':
            tintColor = '#FFD700';
            break;
          case 'white':
            tintColor = '#FFFFFF';
            break;
          default:
            tintColor = null;
        }
        
        if (tintColor) {
          manipulations.push({ tint: tintColor });
        }
      }

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        manipulations,
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      //console.log('Filter applied successfully');
      return result;

    } catch (error) {
      console.error('Error applying filter:', error);
      // If filter application fails, fall back to just resizing
      const fallbackResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1080 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return fallbackResult; 
    }
  };

  // Upload photo to Firebase Storage - with iOS improvements
  const uploadPhotoToStorage = async (imageUri, updateThumbnail = true) => {
    console.log('uploadPhotoToStorage called with:', imageUri);
    
    try {
      const user = auth.currentUser;
      
      // For non-event photos, require authentication
      if (!eventId && !user) {
        throw new Error('Authentication required for personal photos');
      }
      
      let storageRef;
      let firestoreData;
      const timestamp = new Date().getTime();
      
      const filterColor = filterIndex > 0 ? filterOptions[filterIndex].color : null;
      const filterName = filterIndex > 0 ? filterOptions[filterIndex].name : 'None';
      
      if (eventId) {
        // Event-specific photo (supports both authenticated users and guests)
        const filename = user ? 
          `event_${eventId}_user_${user.uid}_${timestamp}.jpg` :
          `event_${eventId}_guest_${guestUsername}_${timestamp}.jpg`;
        
        storageRef = ref(storage, `event-photos/${eventId}/${filename}`);
        
        firestoreData = {
          event_id: eventId,
          user_id: user ? user.uid : null, // null for guests
          username: user ? (user.displayName || 'Unknown User') : guestUsername,
          photo_url: '',
          uploaded_at: serverTimestamp(),
          filter: filterColor,
          filter_name: filterName,
          likes: 0,
          comments: 0,
          source: 'camera',
          is_guest: !user, // Mark as guest photo
          guest_username: !user ? guestUsername : null
        };
      } else {
        // Personal photo (requires authentication)
        const filename = `user_photo_${timestamp}.jpg`;
        storageRef = ref(storage, `user-photos/${user.uid}/${filename}`);
        
        firestoreData = {
          user_id: user.uid,
          username: user.displayName || 'Unknown User',
          photo_url: '',
          uploaded_at: serverTimestamp(),
          filter: filterColor,
          filter_name: filterName,
          is_personal: true,
          likes: 0,
          comments: 0,
          source: 'camera'
        };
      }
      // iOS fix: Better blob conversion
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
  
      const snapshot = await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(snapshot.ref);

      firestoreData.photo_url = downloadURL;
      
      // Save photo info to Firestore
      const photoCollection = eventId ? 'photos_tbl' : 'user_photos_tbl';

      await addDoc(collection(db, photoCollection), firestoreData);

    } catch (error) {
      console.error("Error uploading photo:", error);
      throw error;
    }
  };

  // Toggle camera type (front/back)
  const toggleCameraType = () => {
    setCameraType((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  // Clear filter
  const clearFilter = () => {
    setFilterIndex(0);
  };

  // Enhanced gallery access function with better error handling
  const handleGalleryAccess = async () => {
    const user = auth.currentUser;
      // For event photos, allow guests
    if (eventId && !user && !guestUsername) {
      hybridAlert(
        'Guest Access Required',
        'Join as guest to upload photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Join as Guest', style: 'default', onPress: () => navigation.navigate('ContinueAsGuest') }
        ]
      );
      return;
    }

    // For personal photos, require authentication
    if (!eventId && !user) {
      hybridAlert(
        'Sign In Required',
        'Please sign in to upload photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', style: 'default', onPress: () => navigation.navigate('SignIn') }
        ]
      );
      return;
    }

    try {
      // Request permission to access media library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
        hybridAlert(
          'Photo Access Required',
          'Grant photo library access to upload images.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', style: 'default', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Launch image picker with multiple selection
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaType: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const selectedImages = result.assets;
        
        if (selectedImages.length > 0) {
          //           showConfirm(
          //   `Upload ${selectedImages.length} Photo${selectedImages.length > 1 ? 's' : ''}?`,
          //   `You selected ${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} from your gallery.\n\n📸 Destination: ${eventId ? 'Event Gallery' : 'Personal Collection'}\n📱 Source: Gallery Upload\n🔄 Processing: Photos will be optimized for sharing\n\nProceed with upload?`,
          //   () => handleMultipleImageUpload(selectedImages), // Confirm function
          //   () => console.log('Gallery upload cancelled') // Cancel function
          // );
          // Enhanced confirmation dialog with more details
          showConfirm(
            `Upload ${selectedImages.length} Photo${selectedImages.length > 1 ? 's' : ''}?`,
            `You selected ${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} from your gallery.\n\nProceed with upload?`,
            () => handleMultipleImageUpload(selectedImages), // Confirm function
            () => console.log('Gallery upload cancelled') // Cancel function
          );
        }
      }    } catch (error) {
      console.error('Error accessing gallery:', error);
      hybridError(
        'Gallery Access Failed',
        'Unable to access photo gallery. Please try again.',
        () => handleGalleryAccess(), // Retry function
        () => {} // Cancel function
      );
    }
  };

  // Enhanced multiple image upload function
  const handleMultipleImageUpload = async (images) => {
    if (!images || images.length === 0) return;

    const user = auth.currentUser;    if (!user && !eventId) {
      hybridAlert(
        'Sign In Required',
        'Please sign in to upload photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', style: 'default', onPress: () => navigation.navigate('SignIn') }
        ]
      );
      return;
    }

    setIsUploadingFromGallery(true);
    
    try {
      let successCount = 0;
      let failCount = 0;
      const totalImages = images.length;
        // Show initial upload progress
      hybridAlert(
        'Uploading Photos',
        `Uploading ${totalImages} photo${totalImages > 1 ? 's' : ''}...`,
        [
          { text: 'Continue', style: 'default' }
        ]
      );

      // Process each image
      for (let i = 0; i < images.length; i++) {
        try {
          const image = images[i];
          
          // Apply basic processing (resize for consistency)
          const processedImage = await applyFilterToImage(image.uri, null);
          
          // Upload to Firebase
          await uploadPhotoToStorage(processedImage.uri, i === 0);
          
          successCount++;
          
          // Update the thumbnail with the first successfully uploaded image
          if (i === 0) {
            setLastCapturedImage(processedImage.uri);
          }
          
        } catch (error) {
          console.error(`Error uploading image ${i + 1}:`, error);
          failCount++;
        }      }      // Show detailed final result
      if (successCount > 0 && failCount === 0) {
        hybridSuccess(
          'Upload Complete',
          `Successfully uploaded ${successCount} photo${successCount > 1 ? 's' : ''}.`,
          () => {
            // Navigate back to the event screen to see uploaded photos
            if (eventId) {
              navigation.goBack();
            }
          }
        );
      } else if (successCount > 0 && failCount > 0) {
        hybridAlert(
          'Partial Upload Complete',
          `${successCount} uploaded, ${failCount} failed. Try again for failed photos.`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        hybridError(
          'Upload Failed',
          'Upload failed. Check connection and try again.',
          () => handleGalleryAccess(), // Retry with new selection
          () => {} // Cancel function
        );
      }

    } catch (error) {
      console.error('Error in multiple upload:', error);      hybridError(
        'Upload Process Failed',
        'Upload failed. Check connection and try again.',
        () => handleMultipleImageUpload(images), // Retry with same images
        () => {} // Cancel function
      );
    } finally {
      setIsUploadingFromGallery(false);
    }
  };

  if (!permission) return <Text>Requesting camera permission...</Text>;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-outline" size={64} color="#FF6F61" style={{ marginBottom: 20 }} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          PixPrint needs camera access to take photos for your events and personal collection.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <LinearGradient
            colors={['#FF8D76', '#FF6F61']}
            style={styles.permissionButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.settingsButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={StyleSheet.absoluteFill} 
        facing={cameraType}
      />

      {/* Filter Overlay */}
      {selectedFilter && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { 
              backgroundColor: filterColors[selectedFilter], 
              zIndex: 1,
              opacity: filterOpacity 
            },
          ]}
        />
      )}

      {/* Filter indicator dots */}
      <View style={styles.filterDotsContainer} pointerEvents="none">
        {filterOptions.map((filter, index) => {
          const isActive = filterIndex === index;
          return (
            <Animated.View 
              key={index} 
              style={[
                styles.filterDot,
                { backgroundColor: filterDotColors[filter.color] || filterDotColors.null },
                isActive && styles.activeDot
              ]}            />
          );
        })}
      </View>
      
      {/* Controls Layer */}
      <View style={styles.controls} pointerEvents="box-none">
        {/* Back Button */}
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Filter Tip */}
        {showFilterTip && (
          <Animated.View style={[styles.filterTip, { opacity: tipOpacity }]}>
            <Text style={styles.filterTipText}>Swipe left or right to change filters</Text>
            <Ionicons name="swap-horizontal" size={18} color="#fff" />
          </Animated.View>
        )}

        {/* Switch Camera */}
        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={toggleCameraType}
          disabled={isTakingPicture || isUploading}
        >
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Capture Button - with animated press effect */}
        <Animated.View 
          style={[
            styles.shutterButton, 
            { transform: [{ scale: shutterAnim }] }
          ]}
        >
          <TouchableOpacity 
            style={styles.shutterTouchable}
            onPress={takePicture}
            disabled={isTakingPicture || isUploading}
          >
            {isTakingPicture ? (
              <ActivityIndicator size="large" color="#FF6F61" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Thumbnail */}
        <TouchableOpacity 
          style={styles.thumbnailWrapper}
          onPress={handleGalleryAccess}
          disabled={isTakingPicture || isUploading || isUploadingFromGallery}
        >
          {isUploadingFromGallery ? (
            <View style={styles.uploadingThumbnail}>
              <ActivityIndicator size="small" color="#FF6F61" />
            </View>
          ) : lastCapturedImage ? (
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: lastCapturedImage }}
                style={styles.thumbnail}
              />
              <View style={styles.galleryIcon}>
                <Ionicons name="images" size={16} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.emptyThumbnail}>
              <Ionicons name="images-outline" size={24} color="#fff" />
              <Text style={styles.galleryText}>Gallery</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Add a separate button to navigate to the app's gallery if needed */}
        <TouchableOpacity 
          style={styles.viewGalleryButton}
          onPress={() => navigation.navigate('Gallery', { eventId })}
          disabled={isTakingPicture || isUploading || isUploadingFromGallery}
        >
          <View style={styles.viewGalleryContent}>
            <Ionicons name="albums-outline" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Horizontal Swipeable Area - non-blocking for other touch events */}
      <View 
        style={styles.horizontalSwipeArea}
        {...horizontalFilterPanResponder.panHandlers}
        pointerEvents="box-only"
      >
        {/* Current filter name with animated appear/disappear */}
        <Animated.View style={[
          styles.currentFilterContainer,
          { opacity: filterIndex > 0 ? filterOpacity : 1 }
        ]}>
          <Text style={styles.currentFilterText}>
            {filterOptions[filterIndex].name}
          </Text>
        </Animated.View>
      </View>

      {/* Event ID Badge */}
      {eventId && (
        <View style={styles.eventBadge}>
          <Ionicons name="aperture" size={16} color="#fff" />
          <Text style={styles.eventBadgeText}>Event ID: {eventId.substring(0, 8)}...</Text>
        </View>
      )}

      {/* Guest Badge */}
      {eventId && guestUsername && !auth.currentUser && (
        <View style={styles.guestBadge}>
          <Ionicons name="person-outline" size={16} color="#fff" />
          <Text style={styles.guestBadgeText}>Guest: {guestUsername}</Text>
        </View>
      )}

      {/* Photo Preview Modal - with iOS-optimized rendering */}
      <Modal
        visible={showPreviewModal}
        transparent={true}
        animationType="none"
        onRequestClose={handleClosePreview}
        supportedOrientations={['portrait']}
        statusBarTranslucent={Platform.OS === 'android'}
        presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : 'fullScreen'}
      >
        <View style={styles.previewModalContainer}>
          {/* Header with filter info and close button */}
          <Animated.View 
            style={[
              styles.previewHeader,
              {
                opacity: modalAnim,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity 
              style={styles.closePreviewButton}
              onPress={handleClosePreview}
              disabled={isUploading}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            {/* Filter Info */}
            {previewFilterName !== 'None' && (
              <View style={styles.previewFilterInfo}>
                <View style={styles.filterIndicator}>
                  <View 
                    style={[
                      styles.filterColorDot,
                      { backgroundColor: filterColors[filterOptions[filterIndex].color] || '#fff' }
                    ]}
                  />
                  <Text style={styles.previewFilterText}>{previewFilterName}</Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Main Preview Image */}
          <Animated.View 
            style={[
              styles.previewImageSection,
              {
                opacity: modalAnim,
                transform: [
                  {
                    scale: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {previewImageUri && (
              <View style={styles.previewImageContainer}>
                <Image 
                  source={{ uri: previewImageUri }} 
                  style={styles.previewImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.error('Error loading preview image:', error);
                  }}
                />
                
                {/* Filter Overlay for Preview */}
                {filterIndex > 0 && filterOptions[filterIndex].color && (
                  <View 
                    style={[
                      styles.previewFilterOverlay,
                      { backgroundColor: filterColors[filterOptions[filterIndex].color] }
                    ]} 
                  />
                )}
                
                {/* Image border/frame effect */}
                <View style={styles.previewImageBorder} />
              </View>
            )}
          </Animated.View>

          {/* Bottom Actions - Simplified */}
          <Animated.View 
            style={[
              styles.previewBottomActions,
              {
                opacity: modalAnim,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Print Button - Primary CTA */}
            <TouchableOpacity 
              style={styles.printButtonPrimary}
              onPress={handlePrintPhoto}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF8D76', '#FF6F61']}
                style={styles.printButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.printButtonContent}>
                  <Ionicons name="print" size={24} color="#fff" />
                  <Text style={styles.printButtonText}>Print Photo</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity 
              style={[
                styles.saveButtonSecondary,
                isUploading && styles.disabledButton
              ]}
              onPress={handleSavePhoto}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <View style={styles.saveButtonContent}>
                {isUploading ? (
                  <>
                    <ActivityIndicator size="small" color="#4CAF50" />
                    <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>Saving...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={22} color="#4CAF50" />
                    <Text style={styles.saveButtonText}>Save to Gallery</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Retake Button */}
            <TouchableOpacity 
              style={styles.retakeButton}
              onPress={handleRetakePhoto}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <View style={styles.retakeButtonContent}>
                <Ionicons name="camera-outline" size={22} color="#666" />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 30,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 16,
  },
  permissionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  settingsButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  settingsButtonText: {
    color: '#FF6F61',
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backArrow: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: '#00000055',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  filterTip: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    transform: [{ translateY: -25 }],
  },
  filterTipText: {
    color: '#fff',
    marginRight: 10,
    fontSize: 14,
  },
  switchButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: '#00000077',
    borderRadius: 24,
    padding: 10,
    zIndex: 10,
  },
  shutterButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF33',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  shutterTouchable: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: '#000',
  },
  thumbnailWrapper: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    zIndex: 10,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalSwipeArea: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    bottom: 200,
    zIndex: 3,
  },
  filterDotsContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
    height: 20,
  },
  filterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  activeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  currentFilterContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  currentFilterText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  eventBadge: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  eventBadgeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  // Preview Modal Styles
  previewModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 20,
    zIndex: 10,
  },
  
  closePreviewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  previewFilterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  filterColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  previewFilterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  previewImageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  
  previewImageContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  
  previewImage: {
    width: width * 0.85,
    height: height * 0.52,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  
  previewFilterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  
  previewImageBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  previewBottomActions: {
    paddingHorizontal: 25,
    paddingBottom: 25,
    gap: 10,
  },
  
  // Primary Print Button
  printButtonPrimary: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 4,
  },
  
  printButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 25,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  
  printButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  printButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
  
  // Save Button
  saveButtonSecondary: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    marginBottom: 4,
  },
  
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 25,
  },
  
  saveButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  
  // Retake Button
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  
  retakeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  
  retakeButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  
  thumbnailContainer: {
    position: 'relative',
  },
  
  galleryIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF6F61',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  
  uploadingThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF6F61',
    backgroundColor: 'rgba(255, 111, 97, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  galleryText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  
  viewGalleryButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    zIndex: 10,
  },
  
  viewGalleryContent: {
      backgroundColor: '#00000077',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  guestBadge: {
    position: 'absolute',
    top: 110, // Below event badge
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 20,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  guestBadgeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});


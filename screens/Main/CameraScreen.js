import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
  StatusBar,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import * as ImageManipulator from 'expo-image-manipulator';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '../../context/AlertContext';
import ViewShot from 'react-native-view-shot';
import { BlurView } from 'expo-blur';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage'; 
import * as ImageManipulator from 'expo-image-manipulator';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '../../context/AlertContext';
import ViewShot from 'react-native-view-shot';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Instagram-style 16:9 aspect ratio calculations
const CAMERA_ASPECT_RATIO = 16 / 9;
const CAMERA_HEIGHT = width / CAMERA_ASPECT_RATIO;
const CAMERA_TOP_OFFSET = (height - CAMERA_HEIGHT - 200) / 2; // Account for controls

// Instagram-style hybrid alert system
const useInstagramAlert = () => {
  const { showAlert, showError, showSuccess, showConfirm } = useAlert();
  
  const instagramAlert = (title, message, buttons = []) => {
    if (Platform.OS === 'ios') {
      Alert.alert(title, message, buttons);
    } else {
      showAlert({
        title,
        message,
        type: 'info',
        buttons: buttons.map(btn => ({
          text: btn.text,
          style: btn.style || 'default',
          onPress: btn.onPress
        }))
      });
    }
  };

  const instagramError = (title, message, onRetry, onCancel) => {
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

  const instagramSuccess = (title, message, onOk) => {
    if (Platform.OS === 'ios') {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    } else {
      showSuccess(title, message, onOk);
    }
  };

  return { instagramAlert, instagramError, instagramSuccess };
};

export default function InstagramCameraScreen({ route, navigation }) {
  const { eventId, username: guestUsername } = route.params || {};
  
  // Camera states
  const [cameraDevice, setCameraDevice] = useState('back');
  const [flashMode, setFlashMode] = useState('auto');
  const [isActive, setIsActive] = useState(true);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  
  // Photo states
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lastPhoto, setLastPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Filter and frame states
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [eventFrames, setEventFrames] = useState([]);
  const [isLoadingFrames, setIsLoadingFrames] = useState(false);
  
  // Animation values
  const captureButtonScale = useRef(new Animated.Value(1)).current;
  const previewModalAnim = useRef(new Animated.Value(0)).current;
  const flashAnimation = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  
  // Refs
  const cameraRef = useRef(null);
  const previewViewShotRef = useRef(null);
  
  // Hooks
  const { instagramAlert, instagramError, instagramSuccess } = useInstagramAlert();
  const devices = useCameraDevices();
  const device = cameraDevice === 'back' ? devices.back : devices.front;
  
  // Instagram-style filters
  const instagramFilters = [
    { name: 'Original', value: 'none', gradient: ['#fff', '#fff'] },
    { name: 'Vivid', value: 'vivid', gradient: ['#ff6b6b', '#ffa500'] },
    { name: 'Warm', value: 'warm', gradient: ['#ffd700', '#ff8c00'] },
    { name: 'Cool', value: 'cool', gradient: ['#87ceeb', '#4169e1'] },
    { name: 'Vintage', value: 'vintage', gradient: ['#daa520', '#cd853f'] },
    { name: 'Mono', value: 'mono', gradient: ['#808080', '#404040'] },
  ];
  // Instagram-style camera functions
  const switchCamera = () => {
    setCameraDevice(prev => prev === 'back' ? 'front' : 'back');
    // Rotation animation for switch button
    Animated.sequence([
      Animated.timing(captureButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(captureButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleFlash = () => {
    const modes = ['auto', 'on', 'off'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  };

  const capturePhoto = async () => {
    if (!device || isTakingPhoto || !cameraRef.current) return;

    // Check authentication
    const user = auth.currentUser;
    if (!eventId && !user) {
      instagramAlert(
        'Sign In Required',
        'Please sign in to capture photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('SignIn') }
        ]
      );
      return;
    }

    if (eventId && !user && !guestUsername) {
      instagramAlert(
        'Guest Access Required',
        'Join as guest to capture photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Join as Guest', onPress: () => navigation.navigate('ContinueAsGuest') }
        ]
      );
      return;
    }

    try {
      setIsTakingPhoto(true);
      
      // Instagram-style capture animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(captureButtonScale, {
            toValue: 0.8,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(controlsOpacity, {
            toValue: 0.5,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(captureButtonScale, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(controlsOpacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Flash animation if enabled
      if (flashMode === 'on' || flashMode === 'auto') {
        Animated.sequence([
          Animated.timing(flashAnimation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnimation, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }

      // Capture with VisionCamera
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
        enableAutoRedEyeReduction: true,
      });

      // Process the photo for 16:9 aspect ratio
      const processedPhoto = await processPhoto(photo.path);
      
      setCapturedPhoto(processedPhoto);
      setLastPhoto(processedPhoto);
      setShowPreview(true);

      // Instagram-style preview animation
      Animated.spring(previewModalAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();

    } catch (error) {
      instagramError(
        'Camera Error',
        'Failed to capture photo. Please try again.',
        () => capturePhoto(),
        () => {}
      );
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const processPhoto = async (photoPath) => {
    try {
      // Process to 16:9 aspect ratio and apply filter
      const targetWidth = 1080;
      const targetHeight = Math.round(targetWidth / CAMERA_ASPECT_RATIO);
      
      let manipulations = [
        { resize: { width: targetWidth, height: targetHeight } }
      ];

      // Apply Instagram-style filter
      if (selectedFilter !== 'none') {
        manipulations.push(applyInstagramFilter(selectedFilter));
      }

      const result = await ImageManipulator.manipulateAsync(
        `file://${photoPath}`,
        manipulations,
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result;
    } catch (error) {
      return { uri: `file://${photoPath}` };
    }
  };

  const applyInstagramFilter = (filterType) => {
    switch (filterType) {
      case 'vivid':
        return { tint: '#ff6b6b' };
      case 'warm':
        return { tint: '#ffd700' };
      case 'cool':
        return { tint: '#87ceeb' };
      case 'vintage':
        return { tint: '#daa520' };
      case 'mono':
        return { flip: { vertical: false } }; // Placeholder for grayscale
      default:
        return null;
    }
  };
  // Instagram-style preview and gallery functions
  const retakePhoto = () => {
    Animated.timing(previewModalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPreview(false);
      setCapturedPhoto(null);
    });
  };

  const openGallery = async () => {
    const user = auth.currentUser;
    if (eventId && !user && !guestUsername) {
      instagramAlert(
        'Guest Access Required',
        'Join as guest to access gallery.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Join as Guest', onPress: () => navigation.navigate('ContinueAsGuest') }
        ]
      );
      return;
    }

    if (!eventId && !user) {
      instagramAlert(
        'Sign In Required',
        'Please sign in to access gallery.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('SignIn') }
        ]
      );
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        instagramAlert(
          'Photo Access Required',
          'Grant photo library access to upload images.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaType: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.9,
        allowsEditing: true,
        aspect: [16, 9],
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        const processedImage = await processPhoto(selectedImage.uri.replace('file://', ''));
        setCapturedPhoto(processedImage);
        setShowPreview(true);
        
        Animated.spring(previewModalAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      instagramError(
        'Gallery Access Failed',
        'Unable to access photo gallery. Please try again.',
        () => openGallery(),
        () => {}
      );
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto || isUploading) return;

    try {
      setIsUploading(true);

      let imageToSave = capturedPhoto.uri;

      // Capture the composed view if needed
      if (previewViewShotRef.current) {
        try {
          const capturedImageUri = await previewViewShotRef.current.capture();
          imageToSave = capturedImageUri;
        } catch (captureError) {
          // Fallback to original
        }
      }

      await uploadPhotoToStorage(imageToSave);
      
      instagramSuccess(
        'Photo Saved',
        'Your photo has been saved successfully!',
        () => {
          retakePhoto();
          navigation.goBack();
        }
      );

    } catch (error) {
      instagramError(
        'Save Failed',
        'Unable to save photo. Please try again.',
        () => savePhoto(),
        () => {}
      );
    } finally {
      setIsUploading(false);
    }
  };

 const uploadPhotoToStorage = async (imageUri) => {
    try {
      const user = auth.currentUser;
      const timestamp = new Date().getTime();
      
      let storageRef;
      let firestoreData;

      if (eventId) {
        const filename = user ? 
          `event_${eventId}_user_${user.uid}_${timestamp}.jpg` :
          `event_${eventId}_guest_${guestUsername}_${timestamp}.jpg`;
        
        storageRef = ref(storage, `event-photos/${eventId}/${filename}`);
        
        firestoreData = {
          event_id: eventId,
          user_id: user ? user.uid : null,
          username: user ? (user.displayName || 'Unknown User') : guestUsername,
          photo_url: '',
          uploaded_at: serverTimestamp(),
          filter: selectedFilter,
          filter_name: instagramFilters.find(f => f.value === selectedFilter)?.name || 'Original',
          likes: 0,
          comments: 0,
          source: 'instagram_camera',
          is_guest: !user,
          guest_username: !user ? guestUsername : null,
          aspect_ratio: '16:9'
        };
      } else {
        const filename = `user_photo_${timestamp}.jpg`;
        storageRef = ref(storage, `user-photos/${user.uid}/${filename}`);
        
        firestoreData = {
          user_id: user.uid,
          username: user.displayName || 'Unknown User',
          photo_url: '',
          uploaded_at: serverTimestamp(),
          filter: selectedFilter,
          filter_name: instagramFilters.find(f => f.value === selectedFilter)?.name || 'Original',
          is_personal: true,
          likes: 0,
          comments: 0,
          source: 'instagram_camera',
          aspect_ratio: '16:9'
        };
      }

      const response = await fetch(imageUri);
      const blob = await response.blob();
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      firestoreData.photo_url = downloadURL;
      
      const photoCollection = eventId ? 'photos_tbl' : 'user_photos_tbl';
      await addDoc(collection(db, photoCollection), firestoreData);

    } catch (error) {
      throw error;
    }
  };

  // Take photo function - updated to handle frames properly
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
      
      // Take the photo with specific aspect ratio
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: true,
        skipProcessing: false,
      });
        // Get current filter data
      const currentFilter = filterOptions[filterIndex];
      
      // Step 1: Apply color filter if selected
      let processedPhoto = photo;
      if (currentFilter.color) {
        processedPhoto = await applyFilterToImage(photo.uri, currentFilter.color);
      } else {
        processedPhoto = await applyFilterToImage(photo.uri, null);
      }
        // Step 2: Apply frame if selected
      let finalPhoto = processedPhoto;
      if (currentFilter.frame) {
        const compositeImageUri = await createCompositeImageWithFrame(processedPhoto.uri, currentFilter);
        finalPhoto = { uri: compositeImageUri };
        
        // Check if the URI actually changed (indicating frame was applied)
        if (finalPhoto.uri === processedPhoto.uri) {
          // Frame URI did not change - frame may not have been applied
        } else {
          // Frame was applied - URI changed
        }
      } else {
        // No frame selected, skipping frame application
      }
        
      // Pre-load the frame image if it's an event frame to reduce delay in preview
      if (currentFilter.frame === 'event-frame' && currentFilter.frameUrl) {
        // Pre-cache the frame image for immediate display
        Image.prefetch(currentFilter.frameUrl).catch(error => {
          // Failed to pre-load frame
        });
      }
      
      // iOS fix: Reset modal animation first
      modalAnim.setValue(0);
      
      // Set preview data with the final processed image
      setPreviewImageUri(finalPhoto.uri);
      setPreviewFilterName(currentFilter.name);
      
      // Small delay to ensure frame overlays render properly
      if (currentFilter.frame === 'event-frame' && currentFilter.frameUrl) {
        // Give a tiny delay for event frames to ensure they're ready
        setTimeout(() => {
          setShowPreviewModal(true);
        }, 100);
      } else {
        setShowPreviewModal(true);
      }
      
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
      }    } catch (error) {
      hybridError(
        'Camera Error',
        'Failed to capture photo. Please try again.',
        () => takePicture(),
        () => {}
      );
    } finally {
      setIsTakingPicture(false);
    }
  };

  // Handle save photo - Enhanced to capture composed image with frames
  const handleSavePhoto = async () => {
    if (!previewImageUri || isUploading) return;
        try {
      setIsUploading(true);
      
      let imageToSave = previewImageUri;
        // If there's a frame or filter applied, capture the composed view
      if (filterOptions[filterIndex].frame || filterOptions[filterIndex].color) {
        if (previewViewShotRef.current) {
          try {
            const capturedImageUri = await previewViewShotRef.current.capture();
            imageToSave = capturedImageUri;
          } catch (captureError) {
            // Fall back to original image if capture fails
          }
        }
      }
        // Verify the image exists and is accessible
      const verifyResponse = await fetch(imageToSave);
      if (!verifyResponse.ok) {
        throw new Error('Image is not accessible');
      }
      
      // Store the captured image locally for thumbnail
      setLastCapturedImage(imageToSave);
      
      // Upload the composed photo to Firebase Storage
      await uploadPhotoToStorage(imageToSave);
      
      // Reset upload state
      setIsUploading(false);
      
      // Show success message using hybrid alert
      hybridSuccess(
        'Photo Saved',
        `${previewFilterName !== 'None' ? `${previewFilterName} photo` : 'Photo'} saved successfully with all effects applied.`,
        () => handleClosePreview()
      );
        } catch (error) {
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
  // New function to composite frame with image using ViewShot
  const createCompositeImageWithFrame = async (imageUri, frameInfo) => {
    try {
      if (!frameInfo || !frameInfo.frame) {
        return imageUri;
      }

      // For event frames, we need to composite the frame image with the photo
      if (frameInfo.frame === 'event-frame' && frameInfo.frameUrl) {
        // We'll create the composite in a different way since overlay is not supported
        // First resize the image to standard size
        const resizedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1080, height: 1080 } }],
          { 
            compress: 0.9,
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
        
        return resizedImage.uri;
      }

      // For built-in frames, apply processing
      if (frameInfo.frame && frameStyles[frameInfo.frame]) {
        const resizedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1000, height: 1000 } }],
          { 
            compress: 0.9,
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
        
        return resizedImage.uri;
      }      return imageUri;
      
    } catch (error) {
      return imageUri;
    }
  };

  // Enhanced image processing with frame overlay
  const applyFilterToImage = async (imageUri, filterColor, frameData = null) => {
    try {
      // Calculate target dimensions - wider aspect ratio for better display
      const targetWidth = 1080;
      const targetHeight = Math.round(targetWidth * 0.7); // Match preview ratio
      
      let manipulations = [{ resize: { width: targetWidth, height: targetHeight } }];
      
      // Apply color filter first
      if (filterColor) {
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

      return result;    } catch (error) {
      // Fallback to just resizing
      const fallbackResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1080 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return fallbackResult;
    }
  };
  // New function to composite frame onto image - Enhanced version
  const applyFrameToImage = async (imageUri, frameInfo) => {
    try {
      if (!frameInfo || !frameInfo.frame) {
        return { uri: imageUri }; // No frame to apply
      }

      // Handle event frames
      if (frameInfo.frame === 'event-frame' && frameInfo.frameUrl) {
        try {
          // First, ensure both images are properly accessible
          const imageResponse = await fetch(imageUri);
          if (!imageResponse.ok) {
            throw new Error('Failed to fetch base image');
          }
          
          const frameResponse = await fetch(frameInfo.frameUrl);
          if (!frameResponse.ok) {
            throw new Error('Failed to fetch frame image');
          }
          
          // First resize the base image
          const resizedImage = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 1080, height: 1080 } }],
            { 
              compress: 0.9,
              format: ImageManipulator.SaveFormat.JPEG 
            }
          );
          
          // Since overlay is not supported, we'll save the frame info and let the UI handle the display
          // For now, we'll return the resized image and rely on the preview overlay to show the frame
          // Note: This means the frame won't be permanently embedded in the saved image
          
          const result = resizedImage;
          
          // Verify the composited image
          const verifyResponse = await fetch(result.uri);
          if (!verifyResponse.ok) {
            throw new Error('Composited image verification failed');
          }
          
          return result;
          
        } catch (frameError) {
          // Return original image if frame compositing fails
          return { uri: imageUri };
        }
      }      // Handle built-in frames with enhanced processing
      if (frameInfo.frame && frameStyles[frameInfo.frame]) {
        try {
          // For built-in frames, we'll create a bordered/padded effect
          // Since we don't have actual frame images, we'll simulate frames with borders and padding
          
          let manipulations = [];
          let finalFormat = ImageManipulator.SaveFormat.JPEG;
          
          switch (frameInfo.frame) {
            case 'polaroid':
              // Create polaroid effect with white border and bottom text area
              manipulations = [
                { resize: { width: 900, height: 900 } },
                // Note: For a real polaroid effect, you'd need to create a white-bordered image
                // This is a simplified version that just resizes
              ];
              break;
              
            case 'filmstrip':
              // Create filmstrip effect with darker borders
              manipulations = [
                { resize: { width: 950, height: 950 } },
                // Note: For real film strip, you'd need film strip frame images
              ];
              break;
              
            case 'classic':
              // Classic wooden frame effect
              manipulations = [
                { resize: { width: 950, height: 950 } },
              ];
              break;
              
            case 'modern':
              // Modern thin frame effect
              manipulations = [
                { resize: { width: 980, height: 980 } },
              ];
              break;
              
            case 'vintage':
              // Vintage ornate frame effect
              manipulations = [
                { resize: { width: 920, height: 920 } },
              ];
              break;
              
            default:
              manipulations = [
                { resize: { width: 1000, height: 1000 } },
              ];
          }
          
          const result = await ImageManipulator.manipulateAsync(
            imageUri,
            manipulations,
            { 
              compress: 0.9,
              format: finalFormat
            }          );
          
          // Verify the frame was applied by checking if URI changed
          if (result.uri !== imageUri) {
            return result;
          } else {
            return { uri: imageUri };
          }
          
        } catch (frameError) {
          return { uri: imageUri };
        }
      }

      return { uri: imageUri }; // No frame applied
      
    } catch (error) {
      return { uri: imageUri }; // Return original image on error
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
          // Enhanced confirmation dialog with more details
          hybridConfirm(
            `Upload ${selectedImages.length} Photo${selectedImages.length > 1 ? 's' : ''}?`,
            `You selected ${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} from your gallery.\n\nProceed with upload?`,            () => handleMultipleImageUpload(selectedImages), // Confirm function
            () => {} // Cancel function
          );
        }
      }
    } catch (error) {
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

    const user = auth.currentUser;
    if (!user && !eventId) {
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
          
          // Apply basic processing (resize for consistency) - no filters for gallery uploads
          const processedImage = await applyFilterToImage(image.uri, null);
          
          // Upload to Firebase
          await uploadPhotoToStorage(processedImage.uri, i === 0);
          
          successCount++;
          
          // Update the thumbnail with the first successfully uploaded image
          if (i === 0) {
            setLastCapturedImage(processedImage.uri);
          }
            } catch (error) {
          failCount++;
        }
      }
      
      // Show detailed final result
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
      }    } catch (error) {
      hybridError(
        'Upload Process Failed',
        'Upload failed. Check connection and try again.',
        () => handleMultipleImageUpload(images), // Retry with same images
        () => {} // Cancel function
      );
    } finally {
      setIsUploadingFromGallery(false);
    }
  };

  // Fetch event frames from Firebase Storage
  const fetchEventFrames = async () => {
    if (!eventId) return;

    setIsLoadingFrames(true);    try {
      const framesRef = ref(storage, `Frames/${eventId}/`);
      const result = await listAll(framesRef);
      
      const framePromises = result.items.map(async (itemRef) => {
        try {
          const url = await getDownloadURL(itemRef);
          const name = itemRef.name.replace(/\.(png|jpg|jpeg)$/i, '').replace(/_/g, ' ');
          
          // Pre-load the frame image for better performance
          Image.prefetch(url).catch(prefetchError => {
            // Failed to pre-load frame
          });
          
          return {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            url,
            ref: itemRef,
            fileName: itemRef.name
          };
        } catch (error) {
          return null;
        }
      });

      const frames = await Promise.all(framePromises);
      const validFrames = frames.filter(frame => frame !== null);
      
      setEventFrames(validFrames);
      
    } catch (error) {
      setEventFrames([]);
    } finally {
      setIsLoadingFrames(false);
    }
  };

  // Fetch frames when component mounts or eventId changes
  useEffect(() => {
    if (eventId) {
      fetchEventFrames();
    }
  }, [eventId]);

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

      {/* Live Frame Preview Overlay */}
      {filterOptions[filterIndex].frame === 'event-frame' && filterOptions[filterIndex].frameUrl && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { 
              zIndex: 2,
              opacity: filterOpacity,
              justifyContent: 'center',
              alignItems: 'center'
            },
          ]}
        >
          <Image 
            source={{ uri: filterOptions[filterIndex].frameUrl }}
            style={styles.liveFrameOverlay}
            resizeMode="contain"            onLoad={() => {
              setIsFrameLoaded(true);
            }}
            onError={(error) => {
              // Error loading live frame preview
            }}
          />
        </Animated.View>
      )}

      {/* Default Frame Preview Overlay for built-in frames */}
      {filterOptions[filterIndex].frame && 
       filterOptions[filterIndex].frame !== 'event-frame' && 
       filterOptions[filterIndex].frame !== null && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { 
              zIndex: 2,
              opacity: filterOpacity,
              justifyContent: 'center',
              alignItems: 'center'
            },
          ]}
        >
          <View style={[
            styles.liveDefaultFramePreview,
            frameStyles[filterOptions[filterIndex].frame]
          ]}>
            {/* Frame preview placeholder */}
            <View style={styles.liveFramePreviewContent}>
              {/* Polaroid text preview */}
              {filterOptions[filterIndex].frame === 'polaroid' && (
                <View style={styles.liveFramePreviewText}>
                  <Text style={styles.livePolaroidText}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>
              )}
              
              {/* Film strip holes preview */}
              {filterOptions[filterIndex].frame === 'filmstrip' && (
                <>
                  <View style={styles.liveFilmHolesLeft}>
                    {[...Array(8)].map((_, i) => (
                      <View key={i} style={styles.liveFilmHole} />
                    ))}
                  </View>
                  <View style={styles.liveFilmHolesRight}>
                    {[...Array(8)].map((_, i) => (
                      <View key={i} style={styles.liveFilmHole} />
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        </Animated.View>
      )}

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
        {/* Current filter/frame name with enhanced display */}
        <Animated.View style={[
          styles.currentFilterContainer,
          { opacity: filterIndex > 0 ? filterOpacity : 1 }
        ]}>
          <View style={styles.filterNameDisplay}>
            {filterOptions[filterIndex].type === 'frame' && (
              <Ionicons name="image-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            )}
            {filterOptions[filterIndex].type === 'color' && (
              <View style={[
                styles.colorIndicatorDot,
                { backgroundColor: filterColors[filterOptions[filterIndex].color] || '#fff' }
              ]} />
            )}
            <Text style={styles.currentFilterText}>
              {filterOptions[filterIndex].name}
            </Text>
          </View>
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
            {/* Enhanced preview with frame compositing using ViewShot */}
            {previewImageUri && (
              <ViewShot 
                ref={previewViewShotRef}
                options={{ 
                  fileName: `composed_image_${Date.now()}`, 
                  format: "jpg", 
                  quality: 0.9,
                  width: width * 0.9,
                  height: width * 0.7 // Match reduced height
                }}
                style={styles.previewImageContainer}
              >
                {/* Base image */}
                <Image 
                  source={{ uri: previewImageUri }} 
                  style={styles.previewImage}
                  resizeMode="cover"                  onLoad={() => {
                    // Preview image loaded successfully
                  }}
                  onError={(error) => {
                    // Error loading preview image
                  }}
                />
                
                {/* Event Frame Overlay */}
                {filterOptions[filterIndex].frame === 'event-frame' && filterOptions[filterIndex].frameUrl && (
                  <Image 
                    source={{ uri: filterOptions[filterIndex].frameUrl }}
                    style={styles.eventFrameOverlay}
                    resizeMode="contain"                    onLoad={() => {
                      setIsFrameLoaded(true);
                    }}
                    onError={(error) => {
                      // Error loading event frame overlay
                    }}
                  />
                )}
                
                {/* Built-in Frame Overlay */}
                {filterOptions[filterIndex].frame && 
                 filterOptions[filterIndex].frame !== 'event-frame' && 
                 filterOptions[filterIndex].frame !== null && (
                  <View style={[
                    styles.previewFrameWrapper,
                    frameStyles[filterOptions[filterIndex].frame]
                  ]}>
                    {/* Polaroid text area */}
                    {filterOptions[filterIndex].frame === 'polaroid' && (
                      <View style={styles.previewPolaroidTextArea}>
                        <Text style={styles.previewPolaroidText}>
                          {new Date().toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    
                    {/* Film strip holes */}
                    {filterOptions[filterIndex].frame === 'filmstrip' && (
                      <>
                        <View style={styles.previewFilmHolesLeft}>
                          {[...Array(8)].map((_, i) => (
                            <View key={i} style={styles.previewFilmHole} />
                          ))}
                        </View>
                        <View style={styles.previewFilmHolesRight}>
                          {[...Array(8)].map((_, i) => (
                            <View key={i} style={styles.previewFilmHole} />
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                )}
                
                {/* Color Filter Overlay (only for color filters) */}
                {filterOptions[filterIndex].type === 'color' && filterOptions[filterIndex].color && (
                  <View 
                    style={[
                      styles.previewFilterOverlay,
                      { backgroundColor: filterColors[filterOptions[filterIndex].color] }
                    ]} 
                  />
                )}
                
                {/* Image border for styling */}
                <View style={styles.previewImageBorder} />
              </ViewShot>
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
  
  // Enhanced filter info display
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
  
  filterNameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  colorIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  frameDot: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  
  previewImageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 30,
  },
  
  previewImageContainer: {
    position: 'relative',
    width: width * 0.9,
    height: width * 0.7, // Reduced height to prevent stretching
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: '#000', // Add background to prevent stretching artifacts
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    resizeMode: 'contain', // Use contain to prevent stretching
  },
  
  // Event frame overlay in preview - matching live preview dimensions
  eventFrameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 20,
    zIndex: 2,
  },
  
  // Built-in frame wrapper in preview
  previewFrameWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    zIndex: 2,
  },
  
  previewPolaroidTextArea: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  
  previewPolaroidText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: 'rgba(248, 248, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  
  previewFilmHolesLeft: {
    position: 'absolute',
    left: -8,
    top: 10,
    bottom: 10,
    width: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  previewFilmHolesRight: {
    position: 'absolute',
    right: -8,
    top: 10,
    bottom: 10,
    width: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  previewFilmHole: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
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
  // Frame-specific styles
  frameWrapper: {
    position: 'relative',
  },
  
  polaroidImage: {
    width: width * 0.75,
    height: width * 0.75,
  },
  
  polaroidTextArea: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  
  polaroidText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  filmHolesLeft: {
    position: 'absolute',
    left: -8,
    top: 10,
    bottom: 10,
    width: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  filmHolesRight: {
    position: 'absolute',
    right: -8,
    top: 10,
    bottom: 10,
    width: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  filmHole: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000',
  },
  // Event frame styles
  eventFrameContainer: {
    position: 'relative',
    width: width * 0.85,
    height: height * 0.52,
    backgroundColor: 'transparent', // Ensure transparent background
  },
  
  previewImageWithEventFrame: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  
  eventFrameOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 20,
    zIndex: 2, // Ensure frame is above the image
  },
  
  // Debug styles
  frameErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  
  frameErrorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  frameErrorDetails: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  
  debugFrameBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#00ff00',
    borderStyle: 'dashed',
    zIndex: 4,
  },
  // Live frame overlay styles
  liveFrameOverlay: {
    width: width * 0.9,
    height: width * 0.7, // Match reduced height same as preview
    position: 'absolute',
  },
  
  liveDefaultFramePreview: {
    width: width * 0.9,
    height: width * 0.7, // Match reduced height same as preview
    position: 'relative',
  },
  
  liveFramePreviewContent: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  
  liveFramePreviewText: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  
  livePolaroidText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: 'rgba(248, 248, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 2,
  },
  
  liveFilmHolesLeft: {
    position: 'absolute',
    left: -8,
    top: 20,
    bottom: 20,
    width: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  liveFilmHolesRight: {
    position: 'absolute',
    right: -8,
    top: 20,
    bottom: 20,
    width: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  liveFilmHole: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',

  },
});


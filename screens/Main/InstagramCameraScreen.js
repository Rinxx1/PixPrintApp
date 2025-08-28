// Instagram-style Camera Screen for Expo Go compatibility
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

const { width, height } = Dimensions.get('window');

// Instagram's approach - Full screen immersive experience
const INSTAGRAM_ASPECT_RATIO = 9 / 16; // Instagram's portrait aspect ratio

// Instagram uses almost the entire screen width with very minimal padding
const CAMERA_PADDING = 4; // Tiny padding like Instagram
const CAMERA_WIDTH = width - (CAMERA_PADDING * 2);

// Instagram preview controls height (fixed at bottom)
const PREVIEW_CONTROLS_HEIGHT = 90; // Reduced space for controls
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : 24;
const SAFE_AREA_BOTTOM = Platform.OS === 'ios' ? 34 : 20;

// Calculate maximum available height for camera/preview (leaving minimal space for controls)
const MAX_AVAILABLE_HEIGHT = height - STATUS_BAR_HEIGHT - PREVIEW_CONTROLS_HEIGHT - SAFE_AREA_BOTTOM - 10;

// Instagram approach: Use full available height with aspect ratio constraint
const HEIGHT_BY_ASPECT = CAMERA_WIDTH / INSTAGRAM_ASPECT_RATIO;
const HEIGHT_BY_SCREEN = MAX_AVAILABLE_HEIGHT * 0.95; // Use 95% of available height

// Choose the larger dimension for maximum screen usage like Instagram
const FINAL_CAMERA_HEIGHT = Math.max(HEIGHT_BY_ASPECT, HEIGHT_BY_SCREEN);
const FINAL_CAMERA_WIDTH = FINAL_CAMERA_HEIGHT * INSTAGRAM_ASPECT_RATIO;

// Instagram-style alert system
const useInstagramAlert = () => {
  const { showAlert, showError, showSuccess } = useAlert();
  
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
  
  // Camera permission hook
  const [permission, requestPermission] = useCameraPermissions();
  
  // Camera states
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('auto');
  const [isActive, setIsActive] = useState(true);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  
  // Photo states
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lastPhoto, setLastPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
    // Filter states
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  // Instagram Collage/Layout states
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState('single'); // single, grid2, grid3, grid4, grid6
  const [gridImages, setGridImages] = useState({});
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [activeGridIndex, setActiveGridIndex] = useState(0);
  const [showCollagePreview, setShowCollagePreview] = useState(false);
  
  // Animation values
  const flashAnimation = useRef(new Animated.Value(0)).current;
  const switchCameraRotation = useRef(new Animated.Value(0)).current;
  const captureScale = useRef(new Animated.Value(1)).current;
  const filterScale = useRef(new Animated.Value(1)).current;
  const gridTransitionOpacity = useRef(new Animated.Value(1)).current;
  const cameraScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Camera ref
  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);
  
  // Hooks
  const { instagramAlert, instagramError, instagramSuccess } = useInstagramAlert();
    // Instagram-style filters
  const instagramFilters = [
    { name: 'Original', value: 'none', gradient: ['#fff', '#fff'] },
    { name: 'Vivid', value: 'vivid', gradient: ['#ff6b6b', '#ffa500'] },
    { name: 'Warm', value: 'warm', gradient: ['#ffd700', '#ff8c00'] },
    { name: 'Cool', value: 'cool', gradient: ['#87ceeb', '#4169e1'] },
    { name: 'Vintage', value: 'vintage', gradient: ['#daa520', '#cd853f'] },
    { name: 'Mono', value: 'mono', gradient: ['#808080', '#404040'] },
  ];

  // Instagram Layout/Collage definitions
  const instagramLayouts = [
    { 
      id: 'single', 
      name: 'Single', 
      gridCount: 1,
      icon: 'square-outline',
      positions: [{ x: 0, y: 0, width: 1, height: 1 }]
    },
    { 
      id: 'grid2', 
      name: '2 Photos', 
      gridCount: 2,
      icon: 'grid-outline',
      positions: [
        { x: 0, y: 0, width: 0.5, height: 1 },
        { x: 0.5, y: 0, width: 0.5, height: 1 }
      ]
    },
    { 
      id: 'grid3', 
      name: '3 Photos', 
      gridCount: 3,
      icon: 'apps-outline',
      positions: [
        { x: 0, y: 0, width: 0.5, height: 0.5 },
        { x: 0.5, y: 0, width: 0.5, height: 0.5 },
        { x: 0, y: 0.5, width: 1, height: 0.5 }
      ]
    },
    { 
      id: 'grid4', 
      name: '4 Photos', 
      gridCount: 4,
      icon: 'grid',
      positions: [
        { x: 0, y: 0, width: 0.5, height: 0.5 },
        { x: 0.5, y: 0, width: 0.5, height: 0.5 },
        { x: 0, y: 0.5, width: 0.5, height: 0.5 },
        { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
      ]
    },
    { 
      id: 'grid6', 
      name: '6 Photos', 
      gridCount: 6,
      icon: 'apps',
      positions: [
        { x: 0, y: 0, width: 0.33, height: 0.5 },
        { x: 0.33, y: 0, width: 0.33, height: 0.5 },
        { x: 0.66, y: 0, width: 0.34, height: 0.5 },
        { x: 0, y: 0.5, width: 0.33, height: 0.5 },
        { x: 0.33, y: 0.5, width: 0.33, height: 0.5 },
        { x: 0.66, y: 0.5, width: 0.34, height: 0.5 }
      ]
    }
  ];

  // Get current layout configuration
  const getCurrentLayout = () => {
    return instagramLayouts.find(layout => layout.id === selectedLayout) || instagramLayouts[0];
  };

  // Check if all grid slots are filled
  const isGridComplete = (currentGridImages = gridImages) => {
    const layout = getCurrentLayout();
    if (layout.id === 'single') return true;
    
    const filledSlots = Object.keys(currentGridImages).length;
    return filledSlots >= layout.gridCount;
  };
  // Get next empty grid slot
  const getNextEmptySlot = (currentGridImages = gridImages) => {
    const layout = getCurrentLayout();
    for (let i = 0; i < layout.gridCount; i++) {
      if (!currentGridImages[i]) return i;
    }
    return -1; // Return -1 if all filled (not last slot index)
  };

  // Focus and lifecycle management
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsActive(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsActive(false);
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [navigation]);

  // Check camera permissions
  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Instagram-style camera functions
  const switchCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    
    // Rotation animation for switch button
    Animated.timing(switchCameraRotation, {
      toValue: switchCameraRotation._value + 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleFlash = () => {
    const modes = ['auto', 'on', 'off'];
    const currentIndex = modes.indexOf(flash);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlash(modes[nextIndex]);

    // Flash animation
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
  };

  // Apply Instagram-style filter to image and fix front camera inversion
  const applyFilter = async (imageUri, filterType, isFrontCamera = false) => {
    try {
      let manipulations = [];

      // Fix front camera inversion by flipping horizontally
      if (isFrontCamera) {
        manipulations.push({ flip: ImageManipulator.FlipType.Horizontal });
      }

      switch (filterType) {
        case 'vivid':
          manipulations.push(
            { resize: { width: 1080 } },
            { brightness: 0.1 },
            { contrast: 0.2 },
            { saturation: 0.3 }
          );
          break;
        case 'warm':
          manipulations.push(
            { resize: { width: 1080 } },
            { brightness: 0.05 },
            { saturation: 0.15 }
          );
          break;
        case 'cool':
          manipulations.push(
            { resize: { width: 1080 } },
            { brightness: -0.05 },
            { contrast: 0.1 }
          );
          break;
        case 'vintage':
          manipulations.push(
            { resize: { width: 1080 } },
            { brightness: -0.1 },
            { contrast: 0.15 },
            { saturation: -0.2 }
          );
          break;
        case 'mono':
          manipulations.push(
            { resize: { width: 1080 } },
            { greyscale: {} },
            { contrast: 0.1 }
          );
          break;
        default:
          manipulations.push({ resize: { width: 1080 } });
      }

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        manipulations,
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      return result.uri;
    } catch (error) {
      console.error('Filter application error:', error);
      return imageUri;
    }
  };
  // Instagram-style photo capture
  const takePicture = async () => {
    if (!cameraRef.current || isTakingPhoto) return;

    setIsTakingPhoto(true);

    // Capture animation
    Animated.sequence([
      Animated.timing(captureScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(captureScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (photo?.uri) {
        const layout = getCurrentLayout();
        let processedPhotoUri = photo.uri;
        
        // Fix front camera inversion by flipping the image horizontally
        if (facing === 'front') {
          try {
            const flippedResult = await ImageManipulator.manipulateAsync(
              photo.uri,
              [{ flip: ImageManipulator.FlipType.Horizontal }],
              { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );
            processedPhotoUri = flippedResult.uri;
          } catch (error) {
            console.log('Error flipping front camera image:', error);
            // Continue with original image if flip fails
          }
        }
        
        if (layout.id === 'single') {
          // In single mode, we can show a preview screen
          setCapturedPhoto(processedPhotoUri);
          setLastPhoto(processedPhotoUri);
          setShowPreview(true);
          setIsActive(false);
        } else {
          // For grid mode, add the image directly to the current slot
          const currentSlot = activeGridIndex;
          const newGridImages = { ...gridImages, [currentSlot]: processedPhotoUri };
          setGridImages(newGridImages);
          setLastPhoto(processedPhotoUri);
          
          // Check if grid is complete with the new images
          if (isGridComplete(newGridImages)) {
            // All slots are filled, show the collage in the preview container
            setCapturedPhoto(processedPhotoUri);
            setShowPreview(true);
            setIsActive(false);
          } else {
            // Move to the next empty slot
            const nextEmptySlot = getNextEmptySlot(newGridImages);
            setActiveGridIndex(nextEmptySlot);
          }
        }
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      instagramError(
        'Camera Error',
        'Failed to take photo. Please try again.',
        () => takePicture(),
        null
      );
    } finally {
      setIsTakingPhoto(false);
    }
  };

  // Upload photo to Firebase with Instagram-style processing
  const uploadPhoto = async (photoUri) => {
    try {
      setIsUploading(true);

      // Apply selected filter
      const filteredUri = await applyFilter(photoUri, selectedFilter);
      
      // Create unique filename
      const timestamp = Date.now();
      const user = auth.currentUser;
      const userId = user?.uid || 'guest';
      const filename = `photos/${eventId || 'general'}/${userId}_${timestamp}.jpg`;

      // Convert to blob
      const response = await fetch(filteredUri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);      // Save metadata to Firestore
      const photoData = {
        url: downloadURL,
        filename,
        timestamp: serverTimestamp(),
        userId,
        username: user?.displayName || guestUsername || 'Guest',
        eventId: eventId || null,
        filter: selectedFilter,
        aspectRatio: '9:16',
        type: 'instagram_style'
      };

      await addDoc(collection(db, 'photos'), photoData);

      instagramSuccess(
        'Photo Saved!',
        'Your photo has been uploaded successfully.',
        () => {
          setShowPreview(false);
          setCapturedPhoto(null);
          setIsActive(true);
          setSelectedFilter('none');
        }
      );

    } catch (error) {
      console.error('Upload error:', error);
      instagramError(
        'Upload Failed',
        'Failed to upload photo. Please try again.',
        () => uploadPhoto(photoUri),
        () => {
          setShowPreview(false);
          setCapturedPhoto(null);
          setIsActive(true);
        }
      );
    } finally {
      setIsUploading(false);
    }
  };
  // Access gallery
  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Instagram portrait aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const layout = getCurrentLayout();
        let processedPhotoUri = result.assets[0].uri;
        
        // Apply the same front camera flip logic if this is replacing a front camera slot
        // Note: This is optional since gallery images aren't inherently "front camera" images
        // but it maintains consistency if the user is in front camera mode
        if (facing === 'front') {
          try {
            const flippedResult = await ImageManipulator.manipulateAsync(
              result.assets[0].uri,
              [{ flip: ImageManipulator.FlipType.Horizontal }],
              { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );
            processedPhotoUri = flippedResult.uri;
          } catch (error) {
            console.log('Error flipping gallery image:', error);
            // Continue with original image if flip fails
          }
        }
        
        if (layout.id === 'single') {
          setCapturedPhoto(processedPhotoUri);
          setShowPreview(true);
          setIsActive(false);
        } else {
          // For grid mode, add the image directly to the current slot
          const currentSlot = activeGridIndex;
          const newGridImages = { ...gridImages, [currentSlot]: processedPhotoUri };
          setGridImages(newGridImages);
          setLastPhoto(processedPhotoUri);
          
          // Check if grid is complete with the new images
          if (isGridComplete(newGridImages)) {
            // All slots are filled, show the collage in the preview container
            setCapturedPhoto(processedPhotoUri); // This will be the last image selected
            setShowPreview(true);
            setIsActive(false);
          } else {
            // Move to the next empty slot
            const nextEmptySlot = getNextEmptySlot(newGridImages);
            setActiveGridIndex(nextEmptySlot);
          }
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      instagramError(
        'Gallery Error',
        'Failed to access gallery. Please try again.',
        () => openGallery(),
        null
      );
    }
  };

  // Instagram Layout Functions
  const selectLayout = (layoutId) => {
    setSelectedLayout(layoutId);
    setGridImages({});
    setActiveGridIndex(0);
    setShowLayoutPicker(false);
    
    if (layoutId !== 'single') {
      setIsLayoutMode(true);
    } else {
      setIsLayoutMode(false);
    }
  };

  const clearGrid = () => {
    setGridImages({});
    setActiveGridIndex(0);
    setShowCollagePreview(false);
    setIsActive(true);
  };

  const removeGridImage = (index) => {
    const newGridImages = { ...gridImages };
    delete newGridImages[index];
    setGridImages(newGridImages);
    // After removing an image, the now-empty slot should become active.
    setActiveGridIndex(index);
  };

  // Create collage from grid images
  const createCollage = async () => {
    try {
      const layout = getCurrentLayout();
      
      // For now, we'll create a simple vertical or horizontal collage
      // In a real implementation, you'd use a more sophisticated image manipulation library
      
      // Get all the images
      const imageUris = [];
      for (let i = 0; i < layout.gridCount; i++) {
        if (gridImages[i]) {
          imageUris.push(gridImages[i]);
        }
      }
      
      if (imageUris.length === 0) return null;
      
      // For now, return the first image as the collage representation
      // In production, you would use ImageManipulator or similar to combine images
      return imageUris[0];
    } catch (error) {
      console.error('Collage creation error:', error);
      return null;
    }
  };

  // Render filter overlay
  const renderFilterOverlay = () => {
    if (selectedFilter === 'none') return null;

    const filter = instagramFilters.find(f => f.value === selectedFilter);
    if (!filter) return null;

    return (
      <LinearGradient
        colors={[...filter.gradient, 'transparent']}
        style={[styles.filterOverlay, { opacity: 0.3 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    );
  };

  // Render camera view
  const renderCamera = () => {
    const layout = getCurrentLayout();
  
    const cameraAndControls = (
      // This container has the final camera dimensions and acts as the boundary for controls
      <View style={[styles.camera, { overflow: 'hidden' }]}>
        {isLayoutMode ? (
          // GRID MODE
          <View style={styles.fullSize}>
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {layout.positions.map((position, index) => {
              const isActive = index === activeGridIndex;
              const isFilled = gridImages[index];
  
              const cellStyle = {
                position: 'absolute',
                left: `${position.x * 100}%`,
                top: `${position.y * 100}%`,
                width: `${position.width * 100}%`,
                height: `${position.height * 100}%`,
                padding: 2, // Add padding for spacing between cells
              };
  
              if (isActive) {
                return (
                  <View key={`grid-cell-${index}`} style={[cellStyle, styles.activeGridCell]}>
                    <View style={styles.activeGridCellInner}>
                      <CameraView
                        ref={cameraRef}
                        style={styles.fullSize}
                        facing={facing}
                        flash={flash}
                        scale="cover"
                      >
                        {renderFilterOverlay()}
                      </CameraView>
                    </View>
                  </View>
                );
              } else {
                return (
                  <TouchableOpacity
                    key={`grid-cell-${index}`}
                    style={cellStyle}
                    onPress={() => setActiveGridIndex(index)}
                    onLongPress={() => {
                      if (isFilled) {
                        // Show remove option on long press
                        Alert.alert(
                          'Remove Image',
                          'Do you want to remove this image?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', style: 'destructive', onPress: () => removeGridImage(index) }
                          ]
                        );
                      }
                    }}
                  >
                    {isFilled ? (
                      <View style={styles.filledGridCell}>
                        <Image source={{ uri: gridImages[index] }} style={styles.gridImage} />
                        <View style={styles.gridCellOverlay}>
                          <View style={styles.filledCellIndicator}>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                          </View>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.emptyGridCellContainer}
                        onPress={() => setActiveGridIndex(index)}
                      >
                        <View style={styles.emptyGridCellBackground}>
                          <View style={styles.emptyGridPlaceholder} />
                          <BlurView 
                            intensity={60} 
                            tint="dark"
                            style={styles.emptyGridBlur} 
                          />
                          <View style={styles.emptyGridOverlay} />
                        </View>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              }
            })}
          </View>
        ) : (
          // SINGLE PHOTO MODE
          <CameraView
            ref={cameraRef}
            style={styles.fullSize}
            facing={facing}
            flash={flash}
            scale="cover"
          >
            {renderFilterOverlay()}
          </CameraView>
        )}
  
        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <View style={styles.topCenterControls}>
            {/* Removed grid indicator for cleaner Instagram-like look */}
          </View>
          <View style={styles.topRightControls}>
            <TouchableOpacity style={styles.layoutButton} onPress={() => setShowLayoutPicker(true)}>
              <Ionicons name={getCurrentLayout().icon} size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.flashButton, { opacity: flashAnimation.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] }) }]}
              onPress={toggleFlash}
            >
              <Ionicons name={flash === 'on' ? 'flash' : flash === 'off' ? 'flash-off' : 'flash-outline'} size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
  
        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {/* Filter selection */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={styles.filterContent}>
            {instagramFilters.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterButton, selectedFilter === filter.value && styles.filterButtonActive]}
                onPress={() => {
                  setSelectedFilter(filter.value);
                  Animated.spring(filterScale, { toValue: 1.1, useNativeDriver: true }).start(() => {
                    Animated.spring(filterScale, { toValue: 1, useNativeDriver: true }).start();
                  });
                }}
              >
                <LinearGradient colors={filter.gradient} style={styles.filterGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <Text style={[styles.filterText, selectedFilter === filter.value && styles.filterTextActive]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
  
          {/* Camera controls */}
          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.galleryButton} onPress={openGallery}>
              {lastPhoto ? (
                <Image source={{ uri: lastPhoto }} style={styles.galleryPreview} />
              ) : (
                <Ionicons name="images-outline" size={24} color="white" />
              )}
            </TouchableOpacity>
            <Animated.View style={[styles.captureButtonContainer, { transform: [{ scale: captureScale }] }]}>
              <TouchableOpacity
                style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isTakingPhoto}
              >
                {isTakingPhoto ? <ActivityIndicator size="large" color="white" /> : <View style={styles.captureButtonInner} />}
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={{ transform: [{ rotateY: switchCameraRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
              <TouchableOpacity style={styles.switchButton} onPress={switchCamera}>
                <Ionicons name="camera-reverse-outline" size={28} color="white" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </View>
    );
  
    return (
      <View style={styles.cameraContainer}>
        {cameraAndControls}
      </View>
    );
  };

  // Render preview screen
  const renderPreview = () => {
    const layout = getCurrentLayout();
    const isGridMode = layout.id !== 'single';
    const gridComplete = isGridComplete(gridImages);
    
    return (
      <Modal visible={showPreview} animationType="slide">
        <View style={styles.previewContainer}>
          <StatusBar barStyle="light-content" />
          
          {/* Centered preview image with proper spacing */}
          <View style={styles.previewImageContainer}>
            <ViewShot ref={viewShotRef} style={styles.viewShotContainer}>
              {isGridMode && gridComplete ? (
                // Show collage layout when all slots are filled
                <View style={styles.collageContainer}>
                  {layout.positions.map((position, index) => (
                    <View
                      key={index}
                      style={[
                        styles.collageCell,
                        {
                          left: `${position.x * 100}%`,
                          top: `${position.y * 100}%`,
                          width: `${position.width * 100}%`,
                          height: `${position.height * 100}%`,
                        }
                      ]}
                    >
                      {gridImages[index] ? (
                        <Image 
                          source={{ uri: gridImages[index] }} 
                          style={styles.collageCellImage}
                        />
                      ) : (
                        <View style={styles.collageCellEmpty}>
                          <Ionicons name="add" size={24} color="white" />
                          <Text style={styles.emptySlotText}>Empty</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                // Show single image for single mode
                <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
              )}
              <View style={styles.previewFilterOverlayContainer}>
                {renderFilterOverlay()}
              </View>
            </ViewShot>
          </View>

          {/* Bottom controls positioned at screen bottom */}
          <View style={styles.previewControls}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => {
                setShowPreview(false);
                setCapturedPhoto(null);
                setIsActive(true);
                setSelectedFilter('none');
                
                // If in grid mode and completed, also clear the grid
                if (isGridMode && gridComplete) {
                  clearGrid();
                }
              }}
            >
              <Text style={styles.previewButtonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.previewButton, styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              onPress={async () => {
                if (isGridMode && gridComplete) {
                  // Create and upload collage
                  const collageUri = await createCollage();
                  if (collageUri) {
                    uploadPhoto(collageUri);
                  }
                } else {
                  // Upload single photo
                  uploadPhoto(capturedPhoto);
                }
              }}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[styles.previewButtonText, styles.uploadButtonText]}>Share</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
  // Render layout picker modal
  const renderLayoutPicker = () => (
    <Modal visible={showLayoutPicker} animationType="slide" transparent={true}>
      <View style={styles.layoutPickerOverlay}>
        <View style={styles.layoutPickerContainer}>
          <View style={styles.layoutPickerHeader}>
            <Text style={styles.layoutPickerTitle}>Choose Layout</Text>
            <TouchableOpacity 
              onPress={() => setShowLayoutPicker(false)}
              style={styles.layoutPickerCloseButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.layoutPickerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.layoutPickerContent}
          >
            {instagramLayouts.map((layout) => (
              <TouchableOpacity
                key={layout.id}
                style={[
                  styles.layoutPickerItem,
                  selectedLayout === layout.id && styles.layoutPickerItemActive
                ]}
                onPress={() => selectLayout(layout.id)}
              >
                <View style={styles.layoutIconContainer}>
                  <Ionicons 
                    name={layout.icon} 
                    size={30} 
                    color={selectedLayout === layout.id ? '#E1306C' : 'white'} 
                  />
                </View>
                <View style={styles.layoutTextContainer}>
                  <Text style={[
                    styles.layoutPickerItemText,
                    selectedLayout === layout.id && styles.layoutPickerItemTextActive
                  ]}>
                    {layout.name}
                  </Text>
                  <Text style={styles.layoutPickerItemSubtext}>
                    {layout.gridCount === 1 ? 'Single photo' : `${layout.gridCount} photos`}
                  </Text>
                </View>
                {selectedLayout === layout.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#E1306C" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );  // Render collage preview modal
  const renderCollagePreview = () => (
    <Modal visible={showCollagePreview} animationType="slide">
      <View style={styles.previewContainer}>
        <StatusBar barStyle="light-content" />
        
        {/* Collage preview */}
        <View style={styles.previewImageContainer}>
          <ViewShot ref={viewShotRef} style={styles.viewShotContainer}>
            <View style={styles.collageContainer}>
              {getCurrentLayout().positions.map((position, index) => (
                <View
                  key={index}
                  style={[
                    styles.collageCell,
                    {
                      left: position.x * FINAL_CAMERA_WIDTH,
                      top: position.y * FINAL_CAMERA_HEIGHT,
                      width: position.width * FINAL_CAMERA_WIDTH,
                      height: position.height * FINAL_CAMERA_HEIGHT,
                    }
                  ]}
                >
                  {gridImages[index] ? (
                    <Image 
                      source={{ uri: gridImages[index] }} 
                      style={styles.collageCellImage}
                    />
                  ) : (
                    <View style={styles.collageCellEmpty}>
                      <Ionicons name="add" size={24} color="white" />
                      <Text style={styles.emptySlotText}>Empty</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.previewFilterOverlayContainer}>
              {renderFilterOverlay()}
            </View>
          </ViewShot>
        </View>

        {/* Collage preview controls */}
        <View style={styles.previewControls}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => {
              setShowCollagePreview(false);
              setIsActive(true);
            }}
          >
            <Text style={styles.previewButtonText}>Edit More</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.previewButton}
            onPress={clearGrid}
          >
            <Text style={styles.previewButtonText}>Clear All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.previewButton, styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
            onPress={async () => {
              const collageUri = await createCollage();
              if (collageUri) {
                uploadPhoto(collageUri);
              }
            }}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[styles.previewButtonText, styles.uploadButtonText]}>Share</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderCamera()}
      {renderPreview()}
      {renderLayoutPicker()}
      {renderCollagePreview()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    width: CAMERA_WIDTH,
    height: FINAL_CAMERA_HEIGHT,
    alignSelf: 'center',
    position: 'relative',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: STATUS_BAR_HEIGHT,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  backButton: {
    padding: 8,
  },
  topCenterControls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutButton: {
    padding: 8,
    marginLeft: 16,
  },
  flashButton: {
    padding: 8,
    marginLeft: 16,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: SAFE_AREA_BOTTOM,
    paddingHorizontal: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  filterContent: {
    alignItems: 'center',
  },
  filterButton: {
    padding: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },
  filterButtonActive: {
    borderColor: '#E1306C',
  },
  filterGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  filterText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#E1306C',
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  galleryButton: {
    padding: 8,
  },
  captureButtonContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  captureButton: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    backgroundColor: '#E1306C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(225, 48, 108, 0.5)',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
  switchButton: {
    padding: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#E1306C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  viewShotContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewFilterOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    paddingBottom: SAFE_AREA_BOTTOM,
  },
  previewButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadButton: {
    backgroundColor: '#E1306C',
  },
  uploadButtonDisabled: {
    backgroundColor: 'rgba(225, 48, 108, 0.5)',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  layoutPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  layoutPickerContainer: {
    flex: 1,
    backgroundColor: 'black',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  layoutPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  layoutPickerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  layoutPickerCloseButton: {
    padding: 8,
  },
  layoutPickerScroll: {
    flex: 1,
  },
  layoutPickerContent: {
    paddingBottom: 32,
  },
  layoutPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  layoutPickerItemActive: {
    backgroundColor: 'rgba(225, 48, 108, 0.2)',
  },
  layoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  layoutTextContainer: {
    flex: 1,
  },
  layoutPickerItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  layoutPickerItemTextActive: {
    fontWeight: 'bold',
    color: '#E1306C',
  },
  layoutPickerItemSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  collageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  collageCell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  collageCellImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  collageCellOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  collageCellEmpty: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyGridCellContainer: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  emptyGridCellBackground: {
    flex: 1,
    position: 'relative',
  },
  emptyGridPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  emptyGridBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emptyGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  emptyGridCell: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyGridContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  filledGridCell: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridCellOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 6,
  },
  filledCellIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  activeGridCell: {
    borderWidth: 2,
    borderColor: '#E1306C',
    borderRadius: 6,
    shadowColor: '#E1306C',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    padding: 0,
  },
  activeGridCellInner: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
});

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

// Instagram's TRUE approach - Full screen immersive experience
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
  
  // Photo statesbhgiurrwre
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
  const isGridComplete = () => {
    const layout = getCurrentLayout();
    if (layout.id === 'single') return true;
    
    const filledSlots = Object.keys(gridImages).length;
    return filledSlots >= layout.gridCount;
  };
  // Get next empty grid slot
  const getNextEmptySlot = () => {
    const layout = getCurrentLayout();
    for (let i = 0; i < layout.gridCount; i++) {
      if (!gridImages[i]) return i;
    }
    return layout.gridCount - 1; // Return last slot if all filled
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

  // Apply Instagram-style filter to image
  const applyFilter = async (imageUri, filterType) => {
    try {
      let manipulations = [];

      switch (filterType) {
        case 'vivid':
          manipulations = [
            { resize: { width: 1080 } },
            { brightness: 0.1 },
            { contrast: 0.2 },
            { saturation: 0.3 }
          ];
          break;
        case 'warm':
          manipulations = [
            { resize: { width: 1080 } },
            { brightness: 0.05 },
            { saturation: 0.15 }
          ];
          break;
        case 'cool':
          manipulations = [
            { resize: { width: 1080 } },
            { brightness: -0.05 },
            { contrast: 0.1 }
          ];
          break;
        case 'vintage':
          manipulations = [
            { resize: { width: 1080 } },
            { brightness: -0.1 },
            { contrast: 0.15 },
            { saturation: -0.2 }
          ];
          break;
        case 'mono':
          manipulations = [
            { resize: { width: 1080 } },
            { greyscale: {} },
            { contrast: 0.1 }
          ];
          break;
        default:
          manipulations = [{ resize: { width: 1080 } }];
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
        
        if (layout.id === 'single') {
          // Single photo mode - show normal preview
          setCapturedPhoto(photo.uri);
          setLastPhoto(photo.uri);
          setShowPreview(true);
          setIsActive(false);        } else {
          // Grid layout mode - add to current active grid slot
          const currentSlot = activeGridIndex;
          const newGridImages = { ...gridImages, [currentSlot]: photo.uri };
          setGridImages(newGridImages);
          setLastPhoto(photo.uri);
          
          // Check if grid is complete
          if (Object.keys(newGridImages).length >= layout.gridCount) {
            // Grid is complete - show collage preview
            setShowCollagePreview(true);
            setIsActive(false);
          } else {
            // More photos needed - find next empty slot
            const nextEmptySlot = layout.gridCount;
            for (let i = 0; i < layout.gridCount; i++) {
              if (!newGridImages[i]) {
                setActiveGridIndex(i);
                break;
              }
            }
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
    try {      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const layout = getCurrentLayout();
        
        if (layout.id === 'single') {
          // Single photo mode
          setCapturedPhoto(result.assets[0].uri);
          setShowPreview(true);
          setIsActive(false);        } else {
          // Grid layout mode - add to current active grid slot
          const currentSlot = activeGridIndex;
          const newGridImages = { ...gridImages, [currentSlot]: result.assets[0].uri };
          setGridImages(newGridImages);
          setLastPhoto(result.assets[0].uri);
          
          // Check if grid is complete
          if (Object.keys(newGridImages).length >= layout.gridCount) {
            setShowCollagePreview(true);
            setIsActive(false);
          } else {
            // Find next empty slot
            for (let i = 0; i < layout.gridCount; i++) {
              if (!newGridImages[i]) {
                setActiveGridIndex(i);
                break;
              }
            }
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
    setActiveGridIndex(getNextEmptySlot());
  };

  // Create collage from grid images
  const createCollage = async () => {
    try {
      const layout = getCurrentLayout();
      const collageWidth = 1080;
      const collageHeight = 1920; // 9:16 aspect ratio
      
      // This would require a more complex implementation with image manipulation
      // For now, we'll use the first image as the main collage representation
      const firstImageUri = gridImages[0];
      return firstImageUri;
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
  const renderCamera = () => (
    <View style={styles.cameraContainer}>      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        ratio="9:16"      >
        {renderFilterOverlay()}
        {renderGridOverlay()}
        
        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.topCenterControls}>
            {isLayoutMode && (
              <View style={styles.gridIndicator}>
                <Text style={styles.gridIndicatorText}>
                  {Object.keys(gridImages).length}/{getCurrentLayout().gridCount}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.topRightControls}>
            <TouchableOpacity
              style={styles.layoutButton}
              onPress={() => setShowLayoutPicker(true)}
            >
              <Ionicons 
                name={getCurrentLayout().icon} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.flashButton, { opacity: flashAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.5]
              })}]}
              onPress={toggleFlash}
            >
              <Ionicons 
                name={flash === 'on' ? 'flash' : flash === 'off' ? 'flash-off' : 'flash-outline'} 
                size={28} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {/* Filter selection */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterContainer}
            contentContainerStyle={styles.filterContent}
          >
            {instagramFilters.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterButton,
                  selectedFilter === filter.value && styles.filterButtonActive
                ]}
                onPress={() => {
                  setSelectedFilter(filter.value);
                  Animated.spring(filterScale, {
                    toValue: 1.1,
                    useNativeDriver: true,
                  }).start(() => {
                    Animated.spring(filterScale, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                  });
                }}
              >
                <LinearGradient
                  colors={filter.gradient}
                  style={styles.filterGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={[
                  styles.filterText,
                  selectedFilter === filter.value && styles.filterTextActive
                ]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Camera controls */}
          <View style={styles.cameraControls}>
            {/* Gallery button */}
            <TouchableOpacity style={styles.galleryButton} onPress={openGallery}>
              {lastPhoto ? (
                <Image source={{ uri: lastPhoto }} style={styles.galleryPreview} />
              ) : (
                <Ionicons name="images-outline" size={24} color="white" />
              )}
            </TouchableOpacity>

            {/* Capture button */}
            <Animated.View style={[styles.captureButtonContainer, {
              transform: [{ scale: captureScale }]
            }]}>
              <TouchableOpacity
                style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
                onPress={takePicture}
                disabled={isTakingPhoto}
              >
                {isTakingPhoto ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Switch camera button */}
            <Animated.View style={{
              transform: [{
                rotateY: switchCameraRotation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg']
                })
              }]
            }}>
              <TouchableOpacity style={styles.switchButton} onPress={switchCamera}>
                <Ionicons name="camera-reverse-outline" size={28} color="white" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </CameraView>
    </View>
  );  // Render preview screen
  const renderPreview = () => (
    <Modal visible={showPreview} animationType="slide">
      <View style={styles.previewContainer}>
        <StatusBar barStyle="light-content" />
        
        {/* Centered preview image with proper spacing */}
        <View style={styles.previewImageContainer}>
          <ViewShot ref={viewShotRef} style={styles.viewShotContainer}>
            <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
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
            }}
          >
            <Text style={styles.previewButtonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.previewButton, styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
            onPress={() => uploadPhoto(capturedPhoto)}
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
    </Modal>  );
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
  );  // Render grid overlay - Instagram style
  const renderGridOverlay = () => {
    if (!isLayoutMode) return null;
    
    const layout = getCurrentLayout();
    const currentImageCount = Object.keys(gridImages).length;
    const activePosition = layout.positions[activeGridIndex];
    
    return (
      <View style={styles.gridOverlay}>
        {/* Create masked dark overlay - Instagram approach */}
        {/* Top section above active cell */}
        {activePosition.y > 0 && (
          <View style={[
            styles.darkOverlaySection,
            {
              top: 0,
              left: 0,
              right: 0,
              height: `${activePosition.y * 100}%`,
            }
          ]} />
        )}
        
        {/* Bottom section below active cell */}
        {(activePosition.y + activePosition.height) < 1 && (
          <View style={[
            styles.darkOverlaySection,
            {
              top: `${(activePosition.y + activePosition.height) * 100}%`,
              left: 0,
              right: 0,
              bottom: 0,
            }
          ]} />
        )}
        
        {/* Left section beside active cell */}
        {activePosition.x > 0 && (
          <View style={[
            styles.darkOverlaySection,
            {
              top: `${activePosition.y * 100}%`,
              left: 0,
              width: `${activePosition.x * 100}%`,
              height: `${activePosition.height * 100}%`,
            }
          ]} />
        )}
        
        {/* Right section beside active cell */}
        {(activePosition.x + activePosition.width) < 1 && (
          <View style={[
            styles.darkOverlaySection,
            {
              top: `${activePosition.y * 100}%`,
              left: `${(activePosition.x + activePosition.width) * 100}%`,
              right: 0,
              height: `${activePosition.height * 100}%`,
            }
          ]} />
        )}
        
        {/* Active cell border and indicator */}
        <View
          style={[
            styles.activeGridCell,
            {
              left: `${activePosition.x * 100}%`,
              top: `${activePosition.y * 100}%`,
              width: `${activePosition.width * 100}%`,
              height: `${activePosition.height * 100}%`,
            }
          ]}
        >
          {/* Active cell border - bright pink like Instagram */}
          <View style={styles.gridCellActiveBorder} />
          
          {/* Show counter only for active empty cell */}
          {!gridImages[activeGridIndex] && (
            <View style={styles.gridCellIndicator}>
              <Text style={styles.gridCellText}>
                {currentImageCount + 1}/{layout.gridCount}
              </Text>
            </View>
          )}
        </View>
        
        {/* Show preview images for filled cells that are not active */}
        {layout.positions.map((position, index) => {
          if (index === activeGridIndex || !gridImages[index]) return null;
          
          return (
            <View
              key={index}
              style={[
                styles.filledGridCell,
                {
                  left: `${position.x * 100}%`,
                  top: `${position.y * 100}%`,
                  width: `${position.width * 100}%`,
                  height: `${position.height * 100}%`,
                }
              ]}
            >
              <Image 
                source={{ uri: gridImages[index] }} 
                style={styles.gridCellImage}
              />
              <View style={styles.filledCellOverlay} />
            </View>
          );
        })}
      </View>
    );
  };

  // Render collage preview modal
  const renderCollagePreview = () => (
    <Modal visible={showCollagePreview} animationType="slide">
      <View style={styles.previewContainer}>
        <StatusBar barStyle="light-content" />
        
        {/* Collage preview */}
        <View style={styles.previewImageContainer}>
          <ViewShot ref={viewShotRef} style={styles.viewShotContainer}>
            <View style={styles.collageContainer}>
              {getCurrentLayout().positions.map((position, index) => (
                <TouchableOpacity
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
                  onPress={() => removeGridImage(index)}
                >
                  {gridImages[index] ? (
                    <>
                      <Image 
                        source={{ uri: gridImages[index] }} 
                        style={styles.collageCellImage}
                      />
                      <View style={styles.collageCellOverlay}>
                        <Ionicons name="close-circle" size={20} color="white" />
                      </View>
                    </>
                  ) : (
                    <View style={styles.collageCellEmpty}>
                      <Ionicons name="add" size={24} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
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
            onPress={clearGrid}
          >
            <Text style={styles.previewButtonText}>Clear</Text>
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
              <Text style={[styles.previewButtonText, styles.uploadButtonText]}>Share Collage</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      {isActive ? renderCamera() : null}
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#E1306C',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },camera: {
    width: FINAL_CAMERA_WIDTH,
    height: FINAL_CAMERA_HEIGHT,
    justifyContent: 'space-between',
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : StatusBar.currentHeight + 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  filterButton: {
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 8,
  },
  filterButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  filterGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextActive: {
    color: '#E1306C',
    fontWeight: '700',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  galleryPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  switchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },  previewImageContainer: {
    flex: 1,
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 110, // Reserve space for controls to prevent overlap
  },
  viewShotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: FINAL_CAMERA_WIDTH,
    height: FINAL_CAMERA_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    alignSelf: 'center',
  },previewImage: {
    width: FINAL_CAMERA_WIDTH,
    height: FINAL_CAMERA_HEIGHT,
    resizeMode: 'cover',
    borderRadius: 20,
  },
  previewFilterOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewFilterContainer: {
    marginVertical: 20,
  },
  previewFilterButton: {
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 8,
  },
  previewFilterGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewFilterText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  previewButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
    minWidth: 100,
    alignItems: 'center',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#E1306C',
    borderColor: '#E1306C',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },  uploadButtonText: {
    color: 'white',
  },  // Layout picker styles
  layoutPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  layoutPickerContainer: {
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '70%',
    minHeight: 400,
  },
  layoutPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  layoutPickerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  layoutPickerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  layoutPickerScroll: {
    flex: 1,
  },
  layoutPickerContent: {
    paddingBottom: 20,
  },
  layoutPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    minHeight: 70,
  },
  layoutPickerItemActive: {
    backgroundColor: 'rgba(225,48,108,0.1)',
  },
  layoutIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  layoutTextContainer: {
    flex: 1,
  },
  layoutPickerItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  layoutPickerItemTextActive: {
    color: '#E1306C',
  },
  layoutPickerItemSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  // Top controls styles
  topCenterControls: {
    flex: 1,
    alignItems: 'center',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  gridIndicator: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  gridIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },  // Grid overlay styles
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  // New Instagram-style grid overlay styles with masking
  darkOverlaySection: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1,
  },
  activeGridCell: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  filledGridCell: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
  },
  filledCellOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  // Legacy grid styles (kept for compatibility)
  gridCellDarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)', // Dark overlay for inactive cells only
    borderRadius: 8,
  },
  gridCell: {
    position: 'absolute',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridCellImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridCellIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  gridCellText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  gridCellActiveBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 4,
    borderColor: '#E1306C',
    borderRadius: 12,
    shadowColor: '#E1306C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 20,
  },
  // Collage styles
  collageContainer: {
    width: FINAL_CAMERA_WIDTH,
    height: FINAL_CAMERA_HEIGHT,
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  collageCell: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  collageCellImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  collageCellOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 2,
  },
  collageCellEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});

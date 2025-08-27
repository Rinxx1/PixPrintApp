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

// Instagram-style 16:9 aspect ratio calculations
const CAMERA_ASPECT_RATIO = 16 / 9;
const CAMERA_HEIGHT = width / CAMERA_ASPECT_RATIO;
const CAMERA_TOP_OFFSET = (height - CAMERA_HEIGHT - 200) / 2;

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
        setCapturedPhoto(photo.uri);
        setLastPhoto(photo.uri);
        setShowPreview(true);
        setIsActive(false);
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
      const downloadURL = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      const photoData = {
        url: downloadURL,
        filename,
        timestamp: serverTimestamp(),
        userId,
        username: user?.displayName || guestUsername || 'Guest',
        eventId: eventId || null,
        filter: selectedFilter,
        aspectRatio: '16:9',
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
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedPhoto(result.assets[0].uri);
        setShowPreview(true);
        setIsActive(false);
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
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        ratio="16:9"
      >
        {renderFilterOverlay()}
        
        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={28} color="white" />
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
  );

  // Render preview screen
  const renderPreview = () => (
    <Modal visible={showPreview} animationType="slide">
      <View style={styles.previewContainer}>
        <StatusBar barStyle="light-content" />
        
        {/* Preview image with filter */}
        <ViewShot ref={viewShotRef} style={styles.previewImageContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
          {renderFilterOverlay()}
        </ViewShot>

        {/* Filter selection for preview */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.previewFilterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {instagramFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.previewFilterButton,
                selectedFilter === filter.value && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <LinearGradient
                colors={filter.gradient}
                style={styles.previewFilterGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Text style={[
                styles.previewFilterText,
                selectedFilter === filter.value && styles.filterTextActive
              ]}>
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Preview controls */}
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
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      {isActive ? renderCamera() : null}
      {renderPreview()}
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
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    justifyContent: 'space-between',
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
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: width,
    height: CAMERA_HEIGHT,
    resizeMode: 'cover',
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
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 40,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
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
  },
  uploadButtonText: {
    color: 'white',
  },
});

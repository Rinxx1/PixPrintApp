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
  Alert,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../firebase'; // Make sure this import path is correct
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ route, navigation }) {
  // Get eventId from route params
  const { eventId } = route.params || {};
  
  const [cameraType, setCameraType] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showFilterTip, setShowFilterTip] = useState(true);
  const [filterIndex, setFilterIndex] = useState(0);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // New states for photo preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [previewFilterName, setPreviewFilterName] = useState('None');
  
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

  // Take photo function - updated to show preview modal
  const takePicture = async () => {
    if (isTakingPicture || !cameraRef.current) {
      return;
    }
    
    // Check if user is logged in first
    const user = auth.currentUser;
    if (!eventId && !user) {
      Alert.alert('Error', 'Please log in to take photos');
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
        // Apply the filter effect to the image using ImageManipulator
        processedPhoto = await applyFilterToImage(photo.uri, filterOptions[filterIndex].color);
      } else {
        // No filter, just resize for consistency
        processedPhoto = await applyFilterToImage(photo.uri, null);
      }
      
      // Set preview data and show modal
      setPreviewImageUri(processedPhoto.uri);
      setPreviewFilterName(filterOptions[filterIndex].name);
      setShowPreviewModal(true);
      
      // Animate modal appearance
      Animated.spring(modalAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsTakingPicture(false);
    }
  };

  // Handle save photo
  const handleSavePhoto = async () => {
    if (!previewImageUri) return;
    
    try {
      setIsUploading(true);
      
      // Store the captured image locally for thumbnail
      setLastCapturedImage(previewImageUri);
      
      // Upload the photo to Firebase Storage
      await uploadPhotoToStorage(previewImageUri);
      
      // Close modal after successful save
      handleClosePreview();
      
    } catch (error) {
      console.error("Error saving photo:", error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
      setIsUploading(false);
    }
  };

  // Handle print photo (placeholder function)
  const handlePrintPhoto = () => {
    Alert.alert(
      'Print Feature',
      'Print functionality will be available soon! Your photo has been saved to the gallery.',
      [
        {
          text: 'OK',
          onPress: () => {
            // For now, just save the photo
            handleSavePhoto();
          }
        }
      ]
    );
  };

  // Handle closing preview modal
  const handleClosePreview = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowPreviewModal(false);
      setPreviewImageUri(null);
      setPreviewFilterName('None');
      setIsUploading(false);
    });
  };

  // Retake photo
  const handleRetakePhoto = () => {
    handleClosePreview();
  };

  // Simplified applyFilterToImage function - just resize and compress
const applyFilterToImage = async (imageUri, filterColor) => {
  try {
    console.log('Applying filter:', filterColor);
    
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

    console.log('Filter applied successfully');
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

// Upload photo to Firebase Storage
  const uploadPhotoToStorage = async (imageUri) => {
    try {
      // Get the current user
      const user = auth.currentUser;
      
      // Check if user is logged in
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save photos.');
        return;
      }
      
      let storageRef;
      let firestoreData;
      const timestamp = new Date().getTime();
      
      // Get the actual filter color and name
      const currentFilter = filterOptions[filterIndex];
      const filterColor = currentFilter.color;
      const filterName = currentFilter.name;
      
      // Determine the storage path based on whether we have an event ID
      if (eventId) {
        // Event-specific photo
        const filename = `event_${eventId}_${timestamp}.jpg`;
        storageRef = ref(storage, `event-photos/${eventId}/${filename}`);
        
        firestoreData = {
          event_id: eventId,
          user_id: user.uid,
          username: user.displayName || 'Unknown User',
          photo_url: '', // Will be set after upload
          uploaded_at: serverTimestamp(),
          filter: filterColor,
          filter_name: filterName,
          likes: 0,
          comments: 0
        };
      } else {
        // User's personal photo
        const filename = `user_photo_${timestamp}.jpg`;
        storageRef = ref(storage, `user-photos/${user.uid}/${filename}`);
        
        firestoreData = {
          user_id: user.uid,
          username: user.displayName || 'Unknown User',
          photo_url: '', // Will be set after upload
          uploaded_at: serverTimestamp(),
          filter: filterColor,
          filter_name: filterName,
          is_personal: true,
          likes: 0,
          comments: 0
        };
      }
      
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Upload the image
      const snapshot = await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update the photo_url field with the actual URL
      firestoreData.photo_url = downloadURL;
      
      // Save photo info to Firestore
      const photoCollection = eventId ? 'photos_tbl' : 'user_photos_tbl';
      await addDoc(collection(db, photoCollection), firestoreData);
      
      console.log("Photo uploaded successfully:", downloadURL);
      
      // Show success message with different wording based on photo type
      const successMessage = eventId 
        ? 'Photo uploaded to event successfully!'
        : 'Photo saved to your personal collection!';
      
      Alert.alert('Success', successMessage);
      
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert('Upload Error', 'Failed to upload photo. Please try again.');
      throw error; // Re-throw to handle in calling function
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

  if (!permission) return <Text>Requesting camera permission...</Text>;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>We need your permission to access the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
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
              ]} 
            />
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
          onPress={() => navigation.navigate('Gallery', { eventId })}
          disabled={isTakingPicture || isUploading}
        >
          {lastCapturedImage ? (
            <Image
              source={{ uri: lastCapturedImage }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={styles.emptyThumbnail}>
              <Ionicons name="images-outline" size={24} color="#fff" />
            </View>
          )}
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

      {/* Photo Preview Modal */}
      <Modal
        visible={showPreviewModal}
        transparent={true}
        animationType="none"
        onRequestClose={handleClosePreview}
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
                <Image source={{ uri: previewImageUri }} style={styles.previewImage} />
                
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
            >
              <LinearGradient
                colors={['#FF8D76', '#FF6F61']}
                style={styles.printButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View style={styles.printButtonContent}>
                    <Ionicons name="print" size={24} color="#fff" />
                    <Text style={styles.printButtonText}>Print Photo</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity 
              style={styles.saveButtonSecondary}
              onPress={handleSavePhoto}
              disabled={isUploading}
            >
              <View style={styles.saveButtonContent}>
                {isUploading ? (
                  <ActivityIndicator size="small" color="#4CAF50" />
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
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModalContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  previewImageContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    width: width * 0.85,
    height: width * 0.85,
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
  filterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 30,
  },
  filterInfoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  retakeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    minWidth: 80,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  saveButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    minWidth: 100,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  printButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  printButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    minWidth: 100,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  previewHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  closePreviewButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  previewFilterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  previewFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  previewImageSection: {
    marginTop: 80,
    marginBottom: 20,
  },
  previewImageBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  previewBottomActions: {
    width: '100%',
    paddingHorizontal: 20,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  secondaryActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    minWidth: 80,
  },
  secondaryActionIcon: {
    marginBottom: 4,
  },
  secondaryActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  primaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  retakeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  printButtonPrimary: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  printButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    flexDirection: 'row',
    minWidth: 100,
  },
  printButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 20,
    minWidth: 80,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Professional Preview Modal Styles
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
    height: height * 0.52, // Adjusted height for better proportions
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
    gap: 10, // Reduced gap between buttons
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
});

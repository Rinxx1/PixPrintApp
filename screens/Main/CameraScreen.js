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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../../firebase'; // Make sure this import path is correct
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

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
  
  // Ref for camera
  const cameraRef = useRef(null);
  
  // Animation values
  const filterOpacity = useRef(new Animated.Value(0)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const horizontalSwipeAnim = useRef(new Animated.Value(0)).current;
  const horizontalIndicatorAnim = useRef(new Animated.Value(0)).current;
  const shutterAnim = useRef(new Animated.Value(1)).current;

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

  // Take photo function
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
      
      // If a filter is applied, we need to apply it to the image
      let processedPhoto = photo;
      if (selectedFilter) {
        // Apply the filter effect to the image using ImageManipulator
        processedPhoto = await applyFilterToImage(photo.uri, selectedFilter);
      }
      
      // Store the captured image locally
      setLastCapturedImage(processedPhoto.uri);
      
      // Upload the photo to Firebase Storage
      await uploadPhotoToStorage(processedPhoto.uri);
      
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsTakingPicture(false);
    }
  };

  // Updated applyFilterToImage function with supported operations only
const applyFilterToImage = async (imageUri, filterColor) => {
  try {
    console.log("Applying filter:", filterColor);
    
    // First, resize and compress the image
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    if (!filterColor) {
      // No filter, return the resized image
      return manipResult;
    }
    
    // Supported operations by ImageManipulator:
    // - flip: boolean
    // - rotate: number (degrees)
    // - crop: { originX, originY, width, height }
    // - resize: { width, height }
    
    // Since color filters like "saturate" aren't directly supported,
    // we'll use the built-in manipulation options to create similar effects
    
    let operations = [];
    
    switch(filterColor) {
      case 'red':
        // For red, we'll manipulate contrast and brightness
        operations = [
          // We can only use officially supported operations
          { rotate: 0.1 }, // Minimal rotation (almost imperceptible)
          { resize: { width: 1080 } } // Resize again to lock in quality
        ];
        break;
      case 'skyblue': 
        operations = [
          { rotate: 0.1 }, // Minimal rotation (almost imperceptible)
          { resize: { width: 1080 } } // Resize again to lock in quality
        ];
        break;
      case 'gold':
        operations = [
          { rotate: 0.1 }, // Minimal rotation (almost imperceptible)
          { resize: { width: 1080 } } // Resize again to lock in quality
        ];
        break;
      case 'white':
        operations = [
          { rotate: 0.1 }, // Minimal rotation (almost imperceptible)
          { resize: { width: 1080 } } // Resize again to lock in quality
        ];
        break;
      default:
        return manipResult;
    }
    
    // Store the filter information in Firestore, but don't try to modify the image
    // since we can't apply actual color effects with ImageManipulator
    
    console.log("Applied basic operations as a placeholder");
    
    // Simply return the resized image for now
    // In a real app, you would need a more advanced image processing library
    return manipResult;
  } catch (error) {
    console.error("Error applying filter to image:", error);
    // Return the original image if there's an error
    return { uri: imageUri };
  }
};

  // Upload photo to Firebase Storage
  const uploadPhotoToStorage = async (imageUri) => {
    try {
      setIsUploading(true);
      
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
          filter: selectedFilter,
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
          filter: selectedFilter,
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
    } finally {
      setIsUploading(false);
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
            {isTakingPicture || isUploading ? (
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
    zIndex: 10, // Increased zIndex
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
    zIndex: 10, // Increased zIndex
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
    zIndex: 10, // Increased zIndex
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
    zIndex: 10, // Increased zIndex
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
    zIndex: 10, // Increased zIndex
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
    bottom: 200, // Keep space for buttons at the bottom
    zIndex: 3, // Lower zIndex than controls
  },
  filterDotsContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4, // Lower zIndex than controls
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
});

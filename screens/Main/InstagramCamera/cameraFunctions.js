// Instagram Camera Functions
import { Platform, Animated } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { INSTAGRAM_FILTERS } from './constants';

// Switch camera with animation
export const switchCamera = (facing, setFacing, switchCameraRotation) => {
  setFacing(current => (current === 'back' ? 'front' : 'back'));
  
  // Rotation animation for switch button
  Animated.timing(switchCameraRotation, {
    toValue: switchCameraRotation._value + 1,
    duration: 300,
    useNativeDriver: true,
  }).start();
};

// Toggle flash modes
export const toggleFlash = (flash, setFlash, flashAnimation) => {
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

// Instagram-style filter swiping
export const changeFilter = (newIndex, setSelectedFilterIndex, setSelectedFilter, filterTransition) => {
  const maxIndex = INSTAGRAM_FILTERS.length - 1;
  const boundedIndex = Math.max(0, Math.min(maxIndex, newIndex));
  setSelectedFilterIndex(boundedIndex);
  setSelectedFilter(INSTAGRAM_FILTERS[boundedIndex].value);
  
  Animated.sequence([
    Animated.timing(filterTransition, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }),
    Animated.timing(filterTransition, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }),
  ]).start();
};

// Apply Instagram-style filter to image and fix front camera inversion
export const applyFilter = async (imageUri, filterType, isFrontCamera = false) => {
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

// Access gallery
export const openGallery = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16], // Instagram portrait aspect ratio
      quality: 0.8,
    });

    return result;
  } catch (error) {
    console.error('Gallery error:', error);
    throw error;
  }
};

// Enhanced camera refresh function for various scenarios
export const refreshCameraPreview = (setFacing, facing, delay = 20) => {
  if (Platform.OS === 'android') {
    setTimeout(() => {
      const currentFacing = facing;
      // Quick camera toggle to refresh preview
      setFacing(currentFacing === 'back' ? 'front' : 'back');
      
      setTimeout(() => {
        setFacing(currentFacing);
      }, 50);
    }, delay);
  }
};

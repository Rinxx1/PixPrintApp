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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function CameraScreen({ navigation }) {
  const [cameraType, setCameraType] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showFilterTip, setShowFilterTip] = useState(true);
  const [filterIndex, setFilterIndex] = useState(0);
  
  // Animation values
  const filterOpacity = useRef(new Animated.Value(0)).current;
  const tipOpacity = useRef(new Animated.Value(1)).current;
  const horizontalSwipeAnim = useRef(new Animated.Value(0)).current;
  const horizontalIndicatorAnim = useRef(new Animated.Value(0)).current;

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

  const toggleCameraType = () => {
    setCameraType((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing={cameraType} />

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
        <TouchableOpacity style={styles.switchButton} onPress={toggleCameraType}>
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Capture Button */}
        <TouchableOpacity 
          style={styles.shutterButton}
          onPress={() => console.log('Photo captured!')}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        {/* Thumbnail */}
        <TouchableOpacity 
          style={styles.thumbnailWrapper}
          onPress={() => navigation.navigate('Gallery')}
        >
          <Image
            source={require('../../assets/avatar.png')}
            style={styles.thumbnail}
          />
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
    backgroundColor: 'white',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Increased zIndex
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
});

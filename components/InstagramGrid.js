import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { optimizeImageUrl } from '../utils/imageOptimization';
import CachedImage from './CachedImage';

const { width } = Dimensions.get('window');

const OptimizedGridImage = ({ photo, style, onPress, onLongPress, selectionMode, isSelected, onToggleSelection }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const shimmerAnim = useState(new Animated.Value(0))[0];

  // Start shimmer animation when component mounts
  useEffect(() => {
    const shimmerLoop = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start(() => shimmerLoop());
    };
    
    if (loading) {
      shimmerLoop();
    }
    
    return () => shimmerAnim.stopAnimation();
  }, [loading]);

  const handleLoadEnd = () => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handlePress = () => {
    if (selectionMode) {
      onToggleSelection(photo.id);
    } else {
      onPress && onPress(photo);
    }
  };

  const handleLongPress = () => {
    if (!selectionMode) {
      onToggleSelection(photo.id);
    } else {
      onLongPress && onLongPress(photo);
    }
  };

  // Create shimmer effect
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-style.width || 100, style.width || 100],
  });

  return (
    <TouchableOpacity 
      style={[style, isSelected && styles.selectedPhotoContainer]} 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
    >
      {/* Enhanced skeleton loader with shimmer effect */}
      {loading && (
        <View style={[style, styles.imageSkeleton]}>
          <Animated.View 
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
              }
            ]} 
          />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonIconContainer}>
              <Ionicons name="image-outline" size={16} color="#E0E0E0" />
            </View>
          </View>
        </View>
      )}
       
      {/* Optimized thumbnail image */}
      <Animated.View style={[style, { opacity: fadeAnim }]}>
        <CachedImage
          source={{ 
            uri: error ? null : optimizeImageUrl(photo.imageUrl || photo.url, 'thumbnail')
          }}
          style={[style, styles.eventImage]}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          resizeMode="cover"
          fallbackSource={require('../assets/image.jpg')}
        />
      </Animated.View>
      
      {/* Selection overlay */}
      {selectionMode && (
        <View style={styles.selectionOverlay}>
          <View style={[styles.selectionCircle, isSelected && styles.selectedCircle]}>
            {isSelected && (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            )}
          </View>
        </View>
      )}
      
      {/* Type badge */}
      {!selectionMode && photo.type && (
        <View style={[styles.typeBadge, { backgroundColor: photo.type === 'event' ? '#4CAF50' : '#2196F3' }]}>
          <Ionicons 
            name={photo.type === 'event' ? 'people-outline' : 'person-outline'} 
            size={10} 
            color="#FFFFFF" 
          />
        </View>
      )}
      
      {/* Error fallback */}
      {error && (
        <View style={[style, styles.imageError]}>
          <Ionicons name="image-outline" size={16} color="#999" />
          <Text style={styles.errorText}>Failed to load</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function InstagramGrid({ 
  photos, 
  onPhotoPress, 
  onPhotoLongPress,
  showLoadingPlaceholders = false,
  placeholderCount = 6,
  viewMode = 'grid',
  selectionMode = false,
  selectedPhotos = new Set(),
  onToggleSelection = () => {}
}) {
  const renderPhoto = (photo, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const isFirstInRow = col === 0;
    const isLastInRow = col === 2;
    const isFirstRow = row === 0;
    const isLastRow = row === Math.floor((photos.length - 1) / 3);
    const isSelected = selectedPhotos.has(photo.id);
    const isLarge = viewMode === 'list' && index % 5 === 0;

    return (
      <OptimizedGridImage
        key={photo.id || index}
        photo={photo}
        style={[
          styles.instaEqualImage,
          isLarge && styles.largeImage,
          isFirstInRow && styles.edgeLeft,
          isLastInRow && styles.edgeRight,
          isFirstRow && styles.edgeTop,
          isLastRow && styles.edgeBottom,
        ]}
        onPress={() => onPhotoPress && onPhotoPress(photo, index)}
        onLongPress={() => onPhotoLongPress && onPhotoLongPress(photo, index)}
        selectionMode={selectionMode}
        isSelected={isSelected}
        onToggleSelection={onToggleSelection}
      />
    );
  };

  const renderLoadingPlaceholder = (index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const isFirstInRow = col === 0;
    const isLastInRow = col === 2;
    const isFirstRow = row === 0;

    return (
      <View
        key={`placeholder-${index}`}
        style={[
          styles.instaEqualImage,
          styles.imageSkeleton,
          isFirstInRow && styles.edgeLeft,
          isLastInRow && styles.edgeRight,
          isFirstRow && styles.edgeTop,
        ]}
      >
        <View style={styles.shimmerOverlay} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonIconContainer}>
            <Ionicons name="image-outline" size={16} color="#CCCCCC" />
          </View>
        </View>
      </View>
    );
  };

  if (showLoadingPlaceholders) {
    const placeholders = Array.from({ length: placeholderCount }, (_, index) => index);
    
    return (
      <View style={styles.instaGrid}>
        {placeholders.map((_, index) => {
          const row = Math.floor(index / 3);
          const col = index % 3;
          const isFirstInRow = col === 0;
          
          if (isFirstInRow) {
            return (
              <View key={`placeholder-row-${row}`} style={styles.instaGridRow}>
                {[0, 1, 2].map((colIndex) => {
                  const photoIndex = row * 3 + colIndex;
                  if (photoIndex < placeholderCount) {
                    return renderLoadingPlaceholder(photoIndex);
                  }
                  return null;
                })}
              </View>
            );
          }
          return null;
        })}
      </View>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <View style={styles.instaGrid}>
      {photos.map((photo, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const isFirstInRow = col === 0;
        
        if (isFirstInRow) {
          return (
            <View key={`row-${row}`} style={styles.instaGridRow}>
              {[0, 1, 2].map((colIndex) => {
                const photoIndex = row * 3 + colIndex;
                const currentPhoto = photos[photoIndex];
                
                if (currentPhoto) {
                  return renderPhoto(currentPhoto, photoIndex);
                }
                return null;
              })}
            </View>
          );
        }
        return null;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  instaGrid: {
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  instaGridRow: {
    flexDirection: 'row',
    height: width / 3,
    marginBottom: 2,
  },
  instaEqualImage: {
    flex: 1,
    marginHorizontal: 1,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // Edge styling for Instagram-like appearance
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
  },
  largeImage: {
    height: (width / 3) * 1.2,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  
  // Enhanced skeleton loader styles
  imageSkeleton: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    width: '100%',
    height: '100%',
  },
  skeletonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  skeletonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageError: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  errorText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Selection and overlay styles
  selectedPhotoContainer: {
    borderWidth: 2,
    borderColor: '#FF6F61',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: '#FF6F61',
    borderColor: '#FF6F61',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

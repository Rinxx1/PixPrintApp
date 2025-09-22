import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { optimizeImageUrl } from '../utils/imageOptimization';

const { width } = Dimensions.get('window');

// Animated Skeleton Placeholder Component
const AnimatedSkeletonPlaceholder = ({ style, index }) => {
  const shimmerAnim = useState(new Animated.Value(0))[0];
  
  useEffect(() => {
    const shimmerLoop = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: false,
        }),
      ]).start(() => shimmerLoop());
    };
    
    shimmerLoop();
    
    return () => shimmerAnim.stopAnimation();
  }, [shimmerAnim]);
  // Use dynamic shimmer width based on grid item width for consistent animation
  const gridItemWidth = (width - 44) / 3; // Match the actual grid item width
  const shimmerWidth = Math.min(120, Math.max(60, gridItemWidth * 0.7)); // Use 70% of grid item width, between 60-120px
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-shimmerWidth * 0.5, gridItemWidth + shimmerWidth * 0.3],
  });
    return (
    <View style={[style, styles.imageSkeleton]}>
      <Animated.View 
        style={[
          styles.shimmerOverlay,
          {
            width: shimmerWidth,
            height: '100%',
            transform: [{ translateX: shimmerTranslateX }],
          }
        ]} 
      />
    </View>
  );
};

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
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 800,
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
    }  };  // Create shimmer effect with dynamic sizing based on grid item width
  const gridItemWidth = (width - 44) / 3; // Match the actual grid item width
  const shimmerWidth = Math.min(120, Math.max(60, gridItemWidth * 0.7)); // Use 70% of grid item width, between 60-120px
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-shimmerWidth * 0.5, gridItemWidth + shimmerWidth * 0.3],
  });

  return (
    <TouchableOpacity 
      style={[style, isSelected && styles.selectedPhotoContainer]} 
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.8}
    >      {/* Enhanced skeleton loader with shimmer effect */}
      {loading && (
        <View style={[style, styles.imageSkeleton]}>
          <Animated.View 
            style={[
              styles.shimmerOverlay,
              {
                width: shimmerWidth,
                height: '100%',
                transform: [{ translateX: shimmerTranslateX }],
              }
            ]} 
          />
        </View>
      )}
       
      {/* Optimized thumbnail image */}
      <Animated.View style={[style, { opacity: fadeAnim }]}>
        <Image
          source={{ 
            uri: error ? null : optimizeImageUrl(photo.imageUrl || photo.url, 'thumbnail'),
            cache: 'force-cache'
          }}
          style={styles.eventImage}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          resizeMode="cover"
          // Performance optimizations
          fadeDuration={0}
          progressiveRenderingEnabled={true}
          removeClippedSubviews={true}
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
        </View>      )}
      
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
    const isLastRow = row === Math.floor((placeholderCount - 1) / 3);

    return (
      <AnimatedSkeletonPlaceholder
        key={`placeholder-${index}`}
        index={index}
        style={[
          styles.instaEqualImage,
          isFirstInRow && styles.edgeLeft,
          isLastInRow && styles.edgeRight,
          isFirstRow && styles.edgeTop,
          isLastRow && styles.edgeBottom,
        ]}
      />
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
    paddingHorizontal: 0, // No additional padding since GalleryScreen already has padding
    marginBottom: 20,
    alignItems: 'center',
  },
  instaGridRow: {
    flexDirection: 'row',
    height: width / 3,
    marginBottom: 2,
    justifyContent: 'center',
  },
  instaEqualImage: {
    width: (width - 44) / 3, // Screen width minus GalleryScreen padding (40px) and gaps (4px) = 44px total
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
    position: 'relative',
    overflow: 'hidden',
  },shimmerOverlay: {
    position: 'absolute',
    top: 0,    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
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
    borderColor: '#48C6EF',
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
  },  selectedCircle: {
    backgroundColor: '#48C6EF',
    borderColor: '#48C6EF',
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

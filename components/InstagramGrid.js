import React, { useState, useEffect, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import ProgressiveImage from './ProgressiveImage';
import imagePreloader from '../utils/imagePreloader';

const { width } = Dimensions.get('window');

// Instagram-style Grid Image with progressive loading
const OptimizedGridImage = React.memo(({ photo, style, onPress, onLongPress, selectionMode, isSelected, onToggleSelection, index, allPhotos }) => {
  const [isVisible, setIsVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Stagger animation for smooth appearance
    const delay = index * 30; // 30ms delay between images
    const timer = setTimeout(() => {
      setIsVisible(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }, delay);

    // Preload adjacent images
    if (allPhotos && allPhotos.length > 0) {
      imagePreloader.preloadAdjacentImages(allPhotos, index, 2);
    }

    return () => clearTimeout(timer);
  }, [index]);

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

  const gridImageWidth = (width - 10) / 3;

  // Generate thumbnail URL
  const thumbnailUrl = photo.imageUrl ? 
    `${photo.imageUrl.split('?')[0]}?alt=media&w=200` : 
    photo.url ? `${photo.url.split('?')[0]}?alt=media&w=200` : null;

  const imageUrl = photo.imageUrl || photo.url;

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }, isSelected && styles.selectedPhotoContainer]}>
      <TouchableOpacity 
        style={[style, styles.gridImageContainer]} 
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
      >
        {isVisible ? (
          <ProgressiveImage
            source={{ uri: imageUrl }}
            thumbnailSource={{ uri: thumbnailUrl }}
            style={[style, styles.gridImage]}
            resizeMode="cover"
            priority="normal"
          />
        ) : (
          <View style={[style, styles.gridImagePlaceholder]}>
            <SkeletonLoader width={gridImageWidth} height={gridImageWidth} borderRadius={8} />
          </View>
        )}
        
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
      </TouchableOpacity>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return prevProps.photo.id === nextProps.photo.id && 
         prevProps.index === nextProps.index &&
         prevProps.isSelected === nextProps.isSelected &&
         prevProps.selectionMode === nextProps.selectionMode;
});

// Simple skeleton loader component using LinearGradient
const SkeletonLoader = ({ width, height, borderRadius = 0, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[{ width, height, backgroundColor: '#E8E8E8', borderRadius, overflow: 'hidden' }, style]}>
      <Animated.View style={{ transform: [{ translateX }], width: '100%', height: '100%' }}>
        <LinearGradient
          colors={['#E8E8E8', '#F5F5F5', '#E8E8E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </View>
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
  // Preload first batch of images on mount
  useEffect(() => {
    if (photos && photos.length > 0) {
      const urlsToPreload = photos.slice(0, 12).map(photo => photo.imageUrl || photo.url).filter(Boolean);
      imagePreloader.preloadBatch(urlsToPreload, 'normal');
    }
  }, [photos]);

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
        index={index}
        allPhotos={photos}
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
    const gridImageWidth = (width - 10) / 3;

    return (
      <View
        key={`placeholder-${index}`}
        style={[
          styles.instaEqualImage,
          styles.gridImagePlaceholder,
          isFirstInRow && styles.edgeLeft,
          isLastInRow && styles.edgeRight,
          isFirstRow && styles.edgeTop,
        ]}
      >
        <SkeletonLoader width={gridImageWidth} height={gridImageWidth} borderRadius={8} />
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
  gridImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  
  // Selection and overlay styles
  selectedPhotoContainer: {
    borderWidth: 3,
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
  },
  selectedCircle: {
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

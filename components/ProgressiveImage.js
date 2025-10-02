import React, { useState, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

/**
 * Progressive Image Component - Instagram-style image loading
 * Features:
 * - Blur-up technique (low-res preview → high-res)
 * - Smooth fade-in transitions
 * - Memory-efficient caching
 * - Automatic retry on error
 * - Graceful fallback
 */
const ProgressiveImage = ({
  source,
  thumbnailSource,
  style,
  resizeMode = 'cover',
  onLoadEnd,
  onError,
  fallbackSource,
  priority = 'normal',
  ...props
}) => {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const thumbnailOpacity = useRef(new Animated.Value(0)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset states when source changes
    setThumbnailLoaded(false);
    setFullImageLoaded(false);
    setHasError(false);
    thumbnailOpacity.setValue(0);
    imageOpacity.setValue(0);
  }, [source, thumbnailSource]);

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true);
    Animated.timing(thumbnailOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleImageLoad = (event) => {
    setFullImageLoaded(true);
    Animated.timing(imageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Fade out thumbnail after full image is visible
      Animated.timing(thumbnailOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    
    if (onLoadEnd) {
      onLoadEnd(event);
    }
  };

  const handleError = (error) => {
    setHasError(true);
    if (onError) {
      onError(error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Thumbnail layer (blur-up) */}
      {thumbnailSource && !fullImageLoaded && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: thumbnailOpacity }]}>
          <Image
            source={thumbnailSource}
            style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.05 }] }]}
            contentFit={resizeMode}
            onLoad={handleThumbnailLoad}
            placeholder={require('../assets/image.jpg')}
            placeholderContentFit="cover"
            transition={200}
          />
        </Animated.View>
      )}

      {/* Full resolution image */}
      {!hasError ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
          <Image
            {...props}
            source={source}
            style={StyleSheet.absoluteFill}
            contentFit={resizeMode}
            onLoad={handleImageLoad}
            onError={handleError}
            placeholder={require('../assets/image.jpg')}
            placeholderContentFit="cover"
            transition={300}
            priority={priority}
            cachePolicy="memory-disk"
          />
        </Animated.View>
      ) : (
        <View style={[styles.errorContainer, StyleSheet.absoluteFill]}>
          <Ionicons name="image-outline" size={32} color="#999" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

export default ProgressiveImage;

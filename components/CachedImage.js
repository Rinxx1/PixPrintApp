import React, { useState, useEffect } from 'react';
import { Image, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import imageCache from '../utils/imageCache';

const CachedImage = ({ 
  source, 
  style, 
  fallbackSource, 
  onLoadEnd,
  onError,
  resizeMode = 'cover',
  ...props 
}) => {
  const [imageSource, setImageSource] = useState(fallbackSource);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadImage();
  }, [source]);

  const loadImage = async () => {
    try {
      setLoading(true);
      setError(false);
      
      // If source is a local asset (number), use it directly
      if (typeof source === 'number') {
        setImageSource(source);
        setLoading(false);
        handleLoadEnd();
        return;
      }

      // If source has URI, try to get cached version
      if (source && source.uri) {
        const cachedSource = await imageCache.getImageSource(source.uri, fallbackSource);
        setImageSource(cachedSource);
      } else {
        setImageSource(fallbackSource);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading cached image:', err);
      setError(true);
      setImageSource(fallbackSource);
      setLoading(false);
    }
  };

  const handleLoadEnd = () => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    if (onLoadEnd) {
      onLoadEnd();
    }
  };

  const handleError = (err) => {
    console.error('Image load error:', err);
    setError(true);
    setImageSource(fallbackSource);
    setLoading(false);
    
    if (onError) {
      onError(err);
    }
  };

  return (
    <View style={style}>
      {loading && (
        <View style={[
          style, 
          { 
            backgroundColor: '#F0F0F0', 
            justifyContent: 'center', 
            alignItems: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }
        ]}>
          <Ionicons name="image-outline" size={24} color="#CCC" />
        </View>
      )}
      
      <Animated.Image
        {...props}
        source={imageSource}
        style={[style, { opacity: fadeAnim }]}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode={resizeMode}
        fadeDuration={0} // Disable default fade to use our custom animation
      />
    </View>
  );
};

export default CachedImage;

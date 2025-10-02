import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressiveImage from './ProgressiveImage';
import imagePreloader from '../utils/imagePreloader';
const { width, height } = Dimensions.get('window');

// Instagram-style Modal Image with high-quality loading
const HighQualityModalImage = React.memo(({ imageUrl, index, allPhotos }) => {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Preload adjacent images in modal
    if (allPhotos && allPhotos.length > 0 && index !== undefined) {
      imagePreloader.preloadAdjacentImages(allPhotos, index, 1);
    }

    // Animate entrance
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  }, [imageUrl]);

  const handleLoad = (event) => {
    if (event?.source) {
      const { width: imgWidth, height: imgHeight } = event.source;
      if (imgWidth && imgHeight) {
        setImageDimensions({ width: imgWidth, height: imgHeight });
      }
    }
  };

  const getResponsiveImageStyle = () => {
    const maxWidth = width * 0.95;
    const maxHeight = height * 0.6;
    
    if (imageDimensions.width && imageDimensions.height) {
      const aspectRatio = imageDimensions.width / imageDimensions.height;
      
      if (aspectRatio > 1) {
        // Landscape image
        const calculatedWidth = Math.min(maxWidth, imageDimensions.width);
        const calculatedHeight = calculatedWidth / aspectRatio;
        return {
          width: calculatedWidth,
          height: Math.min(calculatedHeight, maxHeight),
          borderRadius: 12,
        };
      } else {
        // Portrait image
        const calculatedHeight = Math.min(maxHeight, imageDimensions.height);
        const calculatedWidth = calculatedHeight * aspectRatio;
        return {
          width: Math.min(calculatedWidth, maxWidth),
          height: calculatedHeight,
          borderRadius: 12,
        };
      }
    }
    
    return {
      width: Math.min(maxWidth, width * 0.9),
      height: Math.min(maxHeight, height * 0.6),
      borderRadius: 12,
    };
  };

  const imageStyle = getResponsiveImageStyle();
  const thumbnailUrl = imageUrl ? `${imageUrl.split('?')[0]}?alt=media&w=400` : null;

  return (
    <Animated.View 
      style={[
        imageStyle, 
        { 
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          overflow: 'hidden',
        }
      ]}
    >
      <ProgressiveImage
        source={{ uri: imageUrl }}
        thumbnailSource={{ uri: thumbnailUrl }}
        style={[imageStyle, { borderRadius: 12 }]}
        resizeMode="contain"
        onLoadEnd={handleLoad}
        priority="high"
      />
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return prevProps.imageUrl === nextProps.imageUrl;
});

export default function EnhancedPhotoModal({ 
  visible, 
  selectedPhoto, 
  selectedImage, 
  onClose, 
  onDelete,
  onPrint,
  onShare,
  onDownload,
  onToggleLike,
  canDeletePhoto = () => true,
  showUserInfo = true,
  showControls = true,
  deleting = false,
  photoIndex = 0,
  allPhotos = []
}) {  // Get the image URL from either selectedImage prop or selectedPhoto
  const imageUrl = selectedImage || (selectedPhoto && selectedPhoto.imageUrl);
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onClose}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.modalContainer}>
        {/* Enhanced close button with better positioning */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View style={styles.closeButtonBackground}>
            <Ionicons name="close" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        
        {/* Enhanced photo info overlay - positioned at top */}
        {selectedPhoto && imageUrl && showUserInfo && (
          <View style={styles.modalInfoOverlay}>
            <View style={styles.modalInfoContent}>
              <View style={styles.modalInfoRow}>
                <Ionicons name="person-circle-outline" size={16} color="#fff" />
                <Text style={styles.modalPhotoInfo}>
                  {selectedPhoto.username || 'Unknown User'}
                </Text>
              </View>
              {selectedPhoto.uploadedAt && (
                <View style={styles.modalInfoRow}>
                  <Ionicons name="time-outline" size={16} color="#fff" />
                  <Text style={styles.modalPhotoDate}>
                    {new Date(selectedPhoto.uploadedAt.toDate ? selectedPhoto.uploadedAt.toDate() : selectedPhoto.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {selectedPhoto.filterName && selectedPhoto.filterName !== 'None' && (
                <View style={styles.modalInfoRow}>
                  <Ionicons name="color-palette-outline" size={16} color="#fff" />
                  <Text style={styles.modalPhotoFilter}>
                    {selectedPhoto.filterName}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
          {/* High-quality modal image with responsive sizing */}
        {imageUrl && (
          <View style={styles.modalImageContainer}>
            <HighQualityModalImage
              imageUrl={imageUrl}
              index={photoIndex}
              allPhotos={allPhotos}
              style={styles.modalImage}
            />
          </View>
        )}
        
        {/* Enhanced modal controls with better spacing and responsive design */}
        {showControls && (
          <View style={styles.modalControls}>
            <TouchableOpacity 
              style={styles.modalControlButton}
              onPress={() => onToggleLike && onToggleLike(selectedPhoto)}
            >
              <View style={styles.controlButtonBackground}>
                <Ionicons name="heart-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalControlButton}
              onPress={() => onPrint && onPrint(selectedPhoto)}
            >
              <View style={styles.controlButtonBackground}>
                <Ionicons name="print-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalControlButton}
              onPress={() => onShare && onShare(selectedPhoto)}
            >
              <View style={styles.controlButtonBackground}>
                <Ionicons name="share-social-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalControlButton}
              onPress={() => onDownload && onDownload(selectedPhoto)}
            >
              <View style={styles.controlButtonBackground}>
                <Ionicons name="download-outline" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            {/* Delete button - only show if user can delete this photo */}
            {selectedPhoto && canDeletePhoto(selectedPhoto) && onDelete && (
              <TouchableOpacity 
                style={[styles.modalControlButton, deleting && styles.buttonDisabled]}
                onPress={() => !deleting && onDelete(selectedPhoto)}
                disabled={deleting}
              >
                <View style={[styles.controlButtonBackground, styles.deleteButtonBackground]}>
                  {deleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Enhanced Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  modalImage: {
    borderRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    right: 20,
    zIndex: 10,
  },
  closeButtonBackground: {
    width: Platform.OS === 'ios' ? 48 : 44,
    height: Platform.OS === 'ios' ? 48 : 44,
    borderRadius: Platform.OS === 'ios' ? 24 : 22,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalInfoOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  modalInfoContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPhotoInfo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalPhotoDate: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
    opacity: 0.9,
  },
  modalPhotoFilter: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
    opacity: 0.8,
  },
  modalControls: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexWrap: 'wrap',
    maxWidth: width * 0.9,
  },
  modalControlButton: {
    marginHorizontal: 6,
    marginVertical: 4,
  },
  controlButtonBackground: {
    width: Platform.OS === 'ios' ? 52 : 48,
    height: Platform.OS === 'ios' ? 52 : 48,
    borderRadius: Platform.OS === 'ios' ? 26 : 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteButtonBackground: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Modal image loading styles
  modalImageSkeleton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalShimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 100,
    height: '100%',
    borderRadius: 12,
  },
  modalSkeletonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalSkeletonIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSkeletonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  modalImageError: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  modalErrorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  modalErrorSubtext: {
    color: '#CCCCCC',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

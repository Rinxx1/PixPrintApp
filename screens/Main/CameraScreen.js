// Instagram Camera Screen - Modularized Version
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  ActivityIndicator,
  Platform,
  StatusBar,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import ViewShot from 'react-native-view-shot';

// Import modular components
import { 
  INSTAGRAM_FILTERS,
  CAMERA_WIDTH,
  FINAL_CAMERA_HEIGHT,
  STATUS_BAR_HEIGHT,
  SAFE_AREA_BOTTOM
} from './InstagramCamera/constants';
import { useInstagramAlert } from './InstagramCamera/hooks';
import { 
  getCurrentLayout, 
  isGridComplete, 
  getNextEmptySlot, 
  createCollage 
} from './InstagramCamera/layoutManager';
import { 
  switchCamera, 
  toggleFlash, 
  changeFilter, 
  applyFilter, 
  openGallery, 
  refreshCameraPreview 
} from './InstagramCamera/cameraFunctions';
import { uploadPhotoToStorage } from './InstagramCamera/uploadService';
import { styles } from './InstagramCamera/styles';
import { FilterCarousel } from './InstagramCamera/FilterCarousel';
import { LayoutPickerModal } from './InstagramCamera/LayoutPickerModal';
import { PreviewModal } from './InstagramCamera/PreviewModal';
import { GridCameraView } from './InstagramCamera/GridCameraView';

export default function InstagramCameraScreen({ route, navigation }) {
  const { eventId, username: guestUsername } = route.params || {};
  
  // Camera permission hook
  const [permission, requestPermission] = useCameraPermissions();
  
  // Camera states
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('auto');
  const [isActive, setIsActive] = useState(true);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  
  // Photo states
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lastPhoto, setLastPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Filter states
  const [selectedFilterIndex, setSelectedFilterIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');
  
  // Instagram Collage/Layout states
  const [isLayoutMode, setIsLayoutMode] = useState(false);
  const [selectedLayout, setSelectedLayout] = useState('single');
  const [gridImages, setGridImages] = useState({});
  const [showLayoutPicker, setShowLayoutPicker] = useState(false);
  const [activeGridIndex, setActiveGridIndex] = useState(0);
  const [showCollagePreview, setShowCollagePreview] = useState(false);
  
  // Animation values
  const flashAnimation = useRef(new Animated.Value(0)).current;
  const switchCameraRotation = useRef(new Animated.Value(0)).current;
  const captureScale = useRef(new Animated.Value(1)).current;
  const filterScale = useRef(new Animated.Value(1)).current;
  const filterTransition = useRef(new Animated.Value(0)).current;
  const gridTransitionOpacity = useRef(new Animated.Value(1)).current;
  const cameraScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Filter carousel refs
  const carouselRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const hasUserInteractedRef = useRef(false);
  const initialCarouselOffsetRef = useRef(null);

  // Camera and ViewShot refs
  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);
  
  // Hooks
  const { instagramAlert, instagramError, instagramSuccess } = useInstagramAlert();

  // Filter carousel sync effect
  useEffect(() => {
    if (isUserScrolling) return;
    if (carouselRef.current && typeof selectedFilterIndex === 'number') {
      try {
        const itemWidth = 54 + 26; // FILTER_SIZE + FILTER_SPACING
        const targetOffset = selectedFilterIndex * itemWidth;
        carouselRef.current.scrollToOffset({ offset: targetOffset, animated: true });
      } catch (_) {
        // ignore initial layout edge cases
      }
    }
  }, [selectedFilterIndex, isUserScrolling]);

  // Refresh camera when activeGridIndex changes
  useEffect(() => {
    if (isLayoutMode && Platform.OS === 'android') {
      refreshCameraPreview(setFacing, facing, 30);
    }
  }, [activeGridIndex, isLayoutMode]);

  // Focus and lifecycle management
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsActive(true);
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setIsActive(false);
    });

    return () => {
      unsubscribe();
      unsubscribeBlur();
    };
  }, [navigation]);

  // Check camera permissions
  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Layout management functions
  const selectLayout = (layoutId) => {
    setSelectedLayout(layoutId);
    setGridImages({});
    setActiveGridIndex(0);
    setShowLayoutPicker(false);
    
    if (layoutId !== 'single') {
      setIsLayoutMode(true);
      refreshCameraForGridLayout();
    } else {
      setIsLayoutMode(false);
      refreshCameraPreview(setFacing, facing, 30);
    }
  };

  const refreshCameraForGridLayout = () => {
    if (Platform.OS === 'android') {
      const currentFacing = facing;
      setFacing(currentFacing === 'back' ? 'front' : 'back');
      
      setTimeout(() => {
        setFacing(currentFacing);
      }, 50);
    }
  };

  const clearGrid = () => {
    setGridImages({});
    setActiveGridIndex(0);
    setShowCollagePreview(false);
    setIsActive(true);
    refreshCameraPreview(setFacing, facing, 50);
  };

  const removeGridImage = (index) => {
    const newGridImages = { ...gridImages };
    delete newGridImages[index];
    setGridImages(newGridImages);
    setActiveGridIndex(index);
  };

  // Instagram-style photo capture
  const takePicture = async () => {
    if (!cameraRef.current || isTakingPhoto) return;

    setIsTakingPhoto(true);

    // Capture animation
    Animated.sequence([
      Animated.timing(captureScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(captureScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });

      if (photo?.uri) {
        const layout = getCurrentLayout(selectedLayout);
        let processedPhotoUri = photo.uri;
        
        // Fix front camera inversion
        if (facing === 'front') {
          try {
            const flippedResult = await ImageManipulator.manipulateAsync(
              photo.uri,
              [{ flip: ImageManipulator.FlipType.Horizontal }],
              { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );
            processedPhotoUri = flippedResult.uri;
          } catch (error) {
            console.log('Error flipping front camera image:', error);
          }
        }

        if (layout.id === 'single') {
          setCapturedPhoto(processedPhotoUri);
          setLastPhoto(processedPhotoUri);
          setShowPreview(true);
          setIsActive(false);
        } else {
          const currentSlot = activeGridIndex;
          const newGridImages = { ...gridImages, [currentSlot]: processedPhotoUri };
          setGridImages(newGridImages);
          setLastPhoto(processedPhotoUri);
          
          if (isGridComplete(newGridImages, selectedLayout)) {
            setCapturedPhoto(processedPhotoUri);
            setShowPreview(true);
            setIsActive(false);
          } else {
            const nextEmptySlot = getNextEmptySlot(newGridImages, selectedLayout);
            setActiveGridIndex(nextEmptySlot);
            refreshCameraPreview(setFacing, facing, 50);
          }
        }
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      instagramError(
        'Camera Error',
        'Failed to take photo. Please try again.',
        () => takePicture(),
        null
      );
    } finally {
      setIsTakingPhoto(false);
    }
  };

  // Upload photo with Instagram-style processing
  const uploadPhoto = async (photoUri) => {
    try {
      setIsUploading(true);

      let finalImageUri = photoUri;
      
      if (viewShotRef.current) {
        try {
          const previewSnapshot = await viewShotRef.current.capture({
            format: 'jpg',
            quality: 0.8,
            result: 'tmpfile',
          });
          finalImageUri = previewSnapshot;
          console.log('Preview snapshot captured:', finalImageUri);
        } catch (captureError) {
          console.error('Error capturing preview snapshot:', captureError);
          finalImageUri = await applyFilter(photoUri, selectedFilter, facing === 'front');
        }
      } else {
        finalImageUri = await applyFilter(photoUri, selectedFilter, facing === 'front');
      }
      
      await uploadPhotoToStorage(finalImageUri, eventId, guestUsername, selectedFilter);

      instagramSuccess(
        'Photo Saved!',
        'Your photo has been uploaded successfully.',
        () => {
          setShowPreview(false);
          setCapturedPhoto(null);
          setIsActive(true);
          setSelectedFilter('none');
          refreshCameraPreview(setFacing, facing, 50);
        }
      );

    } catch (error) {
      console.error('Upload error:', error);
      instagramError(
        'Upload Failed',
        'Failed to upload photo. Please try again.',
        () => uploadPhoto(photoUri),
        () => {
          setShowPreview(false);
          setCapturedPhoto(null);
          setIsActive(true);
          refreshCameraPreview(setFacing, facing, 50);
        }
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Gallery access
  const handleOpenGallery = async () => {
    try {
      const result = await openGallery();

      if (!result.canceled && result.assets[0]) {
        const layout = getCurrentLayout(selectedLayout);
        let processedPhotoUri = result.assets[0].uri;
        
        if (facing === 'front') {
          try {
            const flippedResult = await ImageManipulator.manipulateAsync(
              result.assets[0].uri,
              [{ flip: ImageManipulator.FlipType.Horizontal }],
              { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
            );
            processedPhotoUri = flippedResult.uri;
          } catch (error) {
            console.log('Error flipping gallery image:', error);
          }
        }
        
        if (layout.id === 'single') {
          setCapturedPhoto(processedPhotoUri);
          setShowPreview(true);
          setIsActive(false);
        } else {
          const currentSlot = activeGridIndex;
          const newGridImages = { ...gridImages, [currentSlot]: processedPhotoUri };
          setGridImages(newGridImages);
          setLastPhoto(processedPhotoUri);
          
          if (isGridComplete(newGridImages, selectedLayout)) {
            setCapturedPhoto(processedPhotoUri);
            setShowPreview(true);
            setIsActive(false);
          } else {
            const nextEmptySlot = getNextEmptySlot(newGridImages, selectedLayout);
            setActiveGridIndex(nextEmptySlot);
          }
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      instagramError(
        'Gallery Error',
        'Failed to access gallery. Please try again.',
        () => handleOpenGallery(),
        null
      );
    }
  };

  // Renders the Instagram-style filter overlay
  const renderFilterOverlay = () => {
    const filter = INSTAGRAM_FILTERS[selectedFilterIndex];
    if (!filter || filter.value === 'none') return null;

    const shouldShowOverlay = isActive || showPreview || showCollagePreview;
    if (!shouldShowOverlay) {
      return null;
    }

    // Mono filter: overlay a semi-transparent dark layer
    if (filter.value === 'mono') {
      return (
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'rgba(40,40,40,0.25)',
            opacity: filterTransition.interpolate({ 
              inputRange: [0, 1], 
              outputRange: [1, 0.7] 
            }),
          }}
          pointerEvents="none"
        />
      );
    }

    // Gradient filters
    return (
      <Animated.View 
        style={[
          StyleSheet.absoluteFill, 
          { 
            opacity: filterTransition.interpolate({ 
              inputRange: [0, 1], 
              outputRange: [0.25, 0.15] 
            }) 
          }
        ]} 
        pointerEvents="none"
      >
        <LinearGradient
          colors={filter.gradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
    );
  };

  // Render camera view
  const renderCamera = () => {
    const layout = getCurrentLayout(selectedLayout);
    
    return (
      <View style={styles.cameraContainer}>
        <View style={[styles.camera, { overflow: 'hidden' }]}>
          {isLayoutMode ? (
            <GridCameraView
              layout={layout}
              activeGridIndex={activeGridIndex}
              setActiveGridIndex={setActiveGridIndex}
              gridImages={gridImages}
              removeGridImage={removeGridImage}
              cameraRef={cameraRef}
              facing={facing}
              flash={flash}
              renderFilterOverlay={renderFilterOverlay}
            />
          ) : (
            <>
              <CameraView
                ref={cameraRef}
                style={styles.fullSize}
                facing={facing}
                flash={flash}
                scale="cover"
              />
              {renderFilterOverlay()}
            </>
          )}

          {/* Top controls */}
          <View style={styles.topControls}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.topCenterControls}>
              {/* Removed grid indicator for cleaner Instagram-like look */}
            </View>
            <View style={styles.topRightControls}>
              <TouchableOpacity style={styles.layoutButton} onPress={() => setShowLayoutPicker(true)}>
                <Ionicons name="grid-outline" size={24} color="white" />
              </TouchableOpacity>
              <Animated.View style={{ 
                opacity: flashAnimation.interpolate({ 
                  inputRange: [0, 1], 
                  outputRange: [1, 0.5] 
                }) 
              }}>
                <TouchableOpacity
                  style={styles.flashButton}
                  onPress={() => toggleFlash(flash, setFlash, flashAnimation)}
                >
                  <Ionicons 
                    name={flash === 'on' ? 'flash' : flash === 'off' ? 'flash-off' : 'flash-outline'} 
                    size={28} 
                    color="white" 
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <View style={styles.cameraControlsRow}>
              <FilterCarousel
                selectedFilterIndex={selectedFilterIndex}
                changeFilter={(index) => changeFilter(index, setSelectedFilterIndex, setSelectedFilter, filterTransition)}
                isUserScrolling={isUserScrolling}
                setIsUserScrolling={setIsUserScrolling}
                carouselRef={carouselRef}
                hasUserInteractedRef={hasUserInteractedRef}
                initialCarouselOffsetRef={initialCarouselOffsetRef}
              />
              <Animated.View style={[
                styles.captureOverlay, 
                { transform: [{ scale: captureScale }] }
              ]}> 
                <View style={styles.captureButtonWrapper} pointerEvents="auto">
                  <TouchableOpacity
                    style={[styles.captureButton, isTakingPhoto && styles.captureButtonDisabled]}
                    onPress={takePicture}
                    disabled={isTakingPhoto}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={INSTAGRAM_FILTERS[selectedFilterIndex].gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.captureGradient}
                    >
                      {isTakingPhoto ? (
                        <ActivityIndicator size="large" color="white" />
                      ) : (
                        <View style={styles.captureButtonInner} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          </View>
        </View>
        
        {/* Bottom navigation controls */}
        <View style={styles.bottomNavigationControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={handleOpenGallery}>
            {lastPhoto ? (
              <Image source={{ uri: lastPhoto }} style={styles.galleryPreview} />
            ) : (
              <Ionicons name="images-outline" size={24} color="white" />
            )}
          </TouchableOpacity>
          <View style={styles.bottomBarCenter} pointerEvents="none">
            <Text style={styles.bottomBarFilterText}>
              {INSTAGRAM_FILTERS[selectedFilterIndex]?.name}
            </Text>
          </View>
          
          <Animated.View style={{ 
            transform: [{ 
              rotateY: switchCameraRotation.interpolate({ 
                inputRange: [0, 1], 
                outputRange: ['0deg', '180deg'] 
              }) 
            }] 
          }}>
            <TouchableOpacity 
              style={styles.switchButton} 
              onPress={() => switchCamera(facing, setFacing, switchCameraRotation)}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="white" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        {renderCamera()}
          <PreviewModal
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          capturedPhoto={capturedPhoto}
          setCapturedPhoto={setCapturedPhoto}
          setIsActive={setIsActive}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          selectedFilterIndex={selectedFilterIndex}
          isUploading={isUploading}
          uploadPhoto={uploadPhoto}
          refreshCameraPreview={(delay) => refreshCameraPreview(setFacing, facing, delay)}
          clearGrid={clearGrid}
          createCollage={() => createCollage(gridImages, selectedLayout)}
          renderFilterOverlay={renderFilterOverlay}
          viewShotRef={viewShotRef}
          isLayoutMode={isLayoutMode}
          gridComplete={isGridComplete(gridImages, selectedLayout)}
          layout={getCurrentLayout(selectedLayout)}
          gridImages={gridImages}
          eventId={eventId}
          guestUsername={guestUsername}
        />
        
        <LayoutPickerModal
          showLayoutPicker={showLayoutPicker}
          setShowLayoutPicker={setShowLayoutPicker}
          selectedLayout={selectedLayout}
          selectLayout={selectLayout}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// Preview Modal Component
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  Image, 
  ActivityIndicator,
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { INSTAGRAM_FILTERS } from './constants';
import { previewStyles } from './previewStyles';
import { gridStyles } from './gridStyles';
import { addToCartPrintQueue } from '../../../utils/printService';
import { useAlert } from '../../../context/AlertContext';
import { uploadPhotoToStorage } from './uploadService';

export const PreviewModal = ({
  showPreview,
  setShowPreview,
  capturedPhoto,
  setCapturedPhoto,
  setIsActive,
  selectedFilter,
  setSelectedFilter,
  selectedFilterIndex,
  isUploading,
  uploadPhoto,
  refreshCameraPreview,
  clearGrid,
  createCollage,
  renderFilterOverlay,
  viewShotRef,
  // Grid-related props
  isLayoutMode,
  gridComplete,
  layout,
  gridImages,
  // Print-related props
  eventId,
  guestUsername
}) => {
  const isGridMode = layout?.id !== 'single';
  const [isPrinting, setIsPrinting] = useState(false);
  const { showAlert, showError, showSuccess } = useAlert();

  const handleClose = () => {
    setShowPreview(false);
    setCapturedPhoto(null);
    setIsActive(true);
    setSelectedFilter('none');
    
    // If in grid mode and completed, also clear the grid
    if (isGridMode && gridComplete) {
      clearGrid();
    }
    
    // Refresh camera when returning from preview to prevent blank screen
    refreshCameraPreview(50);
  };
  const handleUpload = async () => {
    if (isGridMode && gridComplete) {
      // Create and upload collage
      const collageUri = await createCollage();
      if (collageUri) {
        uploadPhoto(collageUri);
      }
    } else {
      // Upload single photo
      uploadPhoto(capturedPhoto);
    }
  };  const handlePrint = async () => {
    if (!eventId || !capturedPhoto) {
      showError(
        'Print Error',
        'Unable to print photo. Please try again.',
        () => {},
        () => {}
      );
      return;
    }

    setIsPrinting(true);

    try {
      let photoUri = capturedPhoto;

      // If in grid mode, create collage first
      if (isGridMode && gridComplete) {
        const collageUri = await createCollage();
        if (collageUri) {
          photoUri = collageUri;
        } else {
          throw new Error('Failed to create collage');
        }
      }

      // If we have a viewShot ref, capture the filtered version
      if (viewShotRef.current) {
        try {
          const filteredSnapshot = await viewShotRef.current.capture({
            format: 'jpg',
            quality: 0.8,
            result: 'tmpfile',
          });
          photoUri = filteredSnapshot;
        } catch (captureError) {
          console.warn('Could not capture filtered preview, using original:', captureError);
        }
      }      // Upload the image first to get a Firebase URL
      console.log('Uploading photo for printing:', photoUri);
      const firebaseImageUrl = await uploadPhotoToStorage(photoUri, eventId, guestUsername, selectedFilter);
      
      if (!firebaseImageUrl) {
        throw new Error('Failed to upload image for printing');
      }

      // Create photo object for the print service with the Firebase URL
      const photo = {
        imageUrl: firebaseImageUrl,
        id: `preview_${Date.now()}`, // Temporary ID for preview photos
        filterName: INSTAGRAM_FILTERS[selectedFilterIndex]?.name || 'None',
        username: guestUsername || 'Unknown User',
        uploadedAt: new Date(),
        userId: null, // This is a preview photo, not yet uploaded
        isGuest: !!guestUsername,
        guestUsername: guestUsername
      };

      // Use the global print service
      const success = await addToCartPrintQueue(photo, eventId, showSuccess, showError);
      
      if (success) {
        console.log('Photo added to print queue from preview');
      }

    } catch (error) {
      console.error('Error printing photo from preview:', error);
      showError(
        '🖨️ Print Queue Error',
        'Failed to add photo to print queue. Please check your connection and try again.',
        () => handlePrint(), // Retry function
        () => {} // Cancel function
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Modal visible={showPreview} animationType="slide">
      <View style={previewStyles.previewContainer}>
        <StatusBar barStyle="light-content" />
        
        {/* Preview header with filter indicator */}
        <View style={previewStyles.previewHeader}>
          <TouchableOpacity
            style={previewStyles.closePreviewButton}
            onPress={handleClose}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Filter indicator */}
          {selectedFilter !== 'none' && (
            <View style={previewStyles.previewFilterIndicator}>
              <View style={previewStyles.filterDot} />
              <Text style={previewStyles.previewFilterText}>
                {INSTAGRAM_FILTERS[selectedFilterIndex]?.name || 'Original'}
              </Text>
            </View>
          )}
          
          <View style={previewStyles.previewHeaderSpacer} />
        </View>
        
        {/* Centered preview image with proper spacing */}
        <View style={previewStyles.previewImageContainer}>
          <ViewShot ref={viewShotRef} style={previewStyles.viewShotContainer}>
            {isGridMode && gridComplete ? (
              // Show collage layout when all slots are filled
              <View style={gridStyles.collageContainer}>
                {layout.positions.map((position, index) => (
                  <View
                    key={index}
                    style={[
                      gridStyles.collageCell,
                      {
                        left: `${position.x * 100}%`,
                        top: `${position.y * 100}%`,
                        width: `${position.width * 100}%`,
                        height: `${position.height * 100}%`,
                      }
                    ]}
                  >
                    {gridImages[index] ? (
                      <Image 
                        source={{ uri: gridImages[index] }} 
                        style={gridStyles.collageCellImage}
                      />
                    ) : (
                      <View style={gridStyles.collageCellEmpty}>
                        <Ionicons name="add" size={24} color="white" />
                        <Text style={gridStyles.emptySlotText}>Empty</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              // Show single image for single mode
              <Image source={{ uri: capturedPhoto }} style={previewStyles.previewImage} />
            )}
            <View style={previewStyles.previewFilterOverlayContainer}>
              {renderFilterOverlay()}
            </View>
          </ViewShot>
        </View>

        {/* Bottom controls positioned at screen bottom */}
        <View style={previewStyles.previewControls}>
          <TouchableOpacity
            style={previewStyles.previewButton}
            onPress={handleClose}
          >
            <Text style={previewStyles.previewButtonText}>Retake</Text>
          </TouchableOpacity>          <TouchableOpacity
            style={[
              previewStyles.previewButton,
              isPrinting && previewStyles.printButtonDisabled
            ]}
            onPress={handlePrint}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={previewStyles.previewButtonText}>Print</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              previewStyles.previewButton, 
              previewStyles.uploadButton, 
              isUploading && previewStyles.uploadButtonDisabled
            ]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={previewStyles.shareButtonContent}>
                <Text style={[previewStyles.previewButtonText, previewStyles.uploadButtonText]}>Share</Text>
                <Ionicons name="arrow-forward" size={16} color="white" style={previewStyles.shareArrow} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Preview Modal Component
import React from 'react';
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
  gridImages
}) => {
  const isGridMode = layout?.id !== 'single';

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
          </TouchableOpacity>

          <TouchableOpacity
            style={previewStyles.previewButton}
            onPress={() => {
              // TODO: Implement print functionality
              console.log('Print button pressed');
            }}
          >
            <Text style={previewStyles.previewButtonText}>Print</Text>
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

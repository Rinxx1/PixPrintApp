// Preview Modal Styles
import { StyleSheet, Dimensions, Platform } from 'react-native';
import { STATUS_BAR_HEIGHT, SAFE_AREA_BOTTOM } from './constants';

const { height } = Dimensions.get('window');

export const previewStyles = StyleSheet.create({
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  closePreviewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewFilterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E1306C',
    marginRight: 8,
  },
  previewFilterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  previewHeaderSpacer: {
    width: 40,
  },
  previewImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  viewShotContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewFilterOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    paddingBottom: SAFE_AREA_BOTTOM,
  },
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareArrow: {
    marginLeft: 8,
  },
  previewButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    marginHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  uploadButton: {
    backgroundColor: '#E1306C',
  },
  uploadButtonDisabled: {
    backgroundColor: 'rgba(225, 48, 108, 0.5)',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButtonText: {
    // Additional styles for upload button text if needed
  }
});

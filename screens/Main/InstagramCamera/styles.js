// Instagram Camera Styles
import { StyleSheet, Platform, StatusBar } from 'react-native';
import { 
  CAMERA_WIDTH, 
  FINAL_CAMERA_HEIGHT, 
  STATUS_BAR_HEIGHT, 
  SAFE_AREA_BOTTOM,
  FILTER_SIZE,
  FILTER_SPACING
} from './constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    width: CAMERA_WIDTH,
    height: FINAL_CAMERA_HEIGHT,
    alignSelf: 'center',
    position: 'relative',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: STATUS_BAR_HEIGHT,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  backButton: {
    padding: 8,
  },
  topCenterControls: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layoutButton: {
    padding: 8,
    marginLeft: 16,
  },
  flashButton: {
    padding: 8,
    marginLeft: 16,
  },  
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: SAFE_AREA_BOTTOM,
    paddingHorizontal: 16,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  cameraControlsRow: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
    justifyContent: 'center',
  },
  
  // Instagram-style filter carousel styles
  carouselContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  carouselItem: {
    width: FILTER_SIZE + FILTER_SPACING,
    alignItems: 'center',
    marginHorizontal: 0,
  },
  carouselItemActive: {
    // highlight active filter
  },
  carouselCircle: {
    width: FILTER_SIZE,
    height: FILTER_SIZE,
    borderRadius: FILTER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  carouselActiveBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: FILTER_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  
  // Camera controls
  captureOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  captureButtonWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  captureButton: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(225, 48, 108, 0.5)',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
  },
  
  // Bottom navigation
  bottomNavigationControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'android' ? 51 : SAFE_AREA_BOTTOM,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  bottomBarCenter: {
    flex: 1,
    alignItems: 'center',
  },
  bottomBarFilterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  galleryButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  galleryPreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  switchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  
  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#E1306C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

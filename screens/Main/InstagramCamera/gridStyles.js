// Grid Layout Styles
import { StyleSheet } from 'react-native';

export const gridStyles = StyleSheet.create({
  // Grid layout styles
  activeGridCell: {
    borderWidth: 2,
    borderColor: '#E1306C',
    borderRadius: 6,
    shadowColor: '#E1306C',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    padding: 0,
  },
  activeGridCellInner: {
    flex: 1,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  emptyGridCellContainer: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  emptyGridCellBackground: {
    flex: 1,
    position: 'relative',
  },
  emptyGridPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  emptyGridBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  emptyGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  filledGridCell: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridCellOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 6,
  },
  filledCellIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  
  // Collage styles
  collageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  collageCell: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  collageCellImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  collageCellOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  collageCellEmpty: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptySlotText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
});

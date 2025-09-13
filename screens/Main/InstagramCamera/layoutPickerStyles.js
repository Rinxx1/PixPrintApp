// Layout Picker Modal Styles
import { StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export const layoutPickerStyles = StyleSheet.create({
  layoutPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  layoutPickerContainer: {
    backgroundColor: 'black',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 16,
    paddingHorizontal: 16,
    height: Math.floor(height * 0.54),
  },
  layoutPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  layoutPickerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  layoutPickerCloseButton: {
    padding: 8,
  },
  layoutPickerScroll: {
    flex: 1,
  },
  layoutPickerContent: {
    paddingBottom: 32,
  },
  layoutPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  layoutPickerItemActive: {
    backgroundColor: 'rgba(225, 48, 108, 0.2)',
  },
  layoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  miniLayout: {
    position: 'relative',
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  miniCell: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
    borderRadius: 4,
  },
  layoutTextContainer: {
    flex: 1,
  },
  layoutPickerItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  layoutPickerItemTextActive: {
    fontWeight: 'bold',
    color: '#E1306C',
  },
  layoutPickerItemSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});

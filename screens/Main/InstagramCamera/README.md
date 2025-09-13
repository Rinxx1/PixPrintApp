# Instagram Camera Screen - Modular Architecture

This directory contains the modularized Instagram Camera Screen components, organized into a clean and maintainable structure.

## 📁 File Structure

```
InstagramCamera/
├── index.js                    # Module exports
├── constants.js                # App constants and configurations
├── hooks.js                    # Custom Instagram-style alert hooks
├── styles.js                   # Main camera styles
├── previewStyles.js            # Preview modal styles
├── layoutPickerStyles.js       # Layout picker modal styles
├── gridStyles.js               # Grid layout styles
├── layoutManager.js            # Layout and grid management functions
├── cameraFunctions.js          # Camera operations (capture, filters, etc.)
├── uploadService.js            # Firebase upload functionality
├── FilterCarousel.js           # Filter carousel component
├── LayoutPickerModal.js        # Layout selection modal
├── PreviewModal.js             # Photo preview modal
└── GridCameraView.js           # Grid camera view component
```

## 🔧 Modules Overview

### **constants.js**
- Screen dimensions and calculations
- Instagram aspect ratios
- Filter definitions and layouts
- Layout configurations for grid modes

### **hooks.js**
- `useInstagramAlert()` - Custom alert system with platform-specific styling
- Provides: `instagramAlert`, `instagramError`, `instagramSuccess`

### **layoutManager.js**
- `getCurrentLayout()` - Get active layout configuration
- `isGridComplete()` - Check if all grid slots are filled
- `getNextEmptySlot()` - Find next available grid position
- `createCollage()` - Combine grid images into collage

### **cameraFunctions.js**
- `switchCamera()` - Camera flip with animation
- `toggleFlash()` - Flash mode cycling
- `changeFilter()` - Instagram-style filter switching
- `applyFilter()` - Image manipulation and filtering
- `openGallery()` - Gallery access functionality
- `refreshCameraPreview()` - Android camera refresh fix

### **uploadService.js**
- `uploadPhotoToStorage()` - Firebase Storage upload
- Handles both event and personal photos
- Preserves filter metadata
- Guest user support

### **Styles**
- **styles.js** - Main camera interface styles
- **previewStyles.js** - Photo preview modal styles
- **layoutPickerStyles.js** - Layout selection modal styles
- **gridStyles.js** - Grid layout and collage styles

### **Components**
- **FilterCarousel.js** - Horizontal Instagram-style filter selector
- **LayoutPickerModal.js** - Modal for choosing photo layouts
- **PreviewModal.js** - Photo preview with edit/share options
- **GridCameraView.js** - Multi-photo grid camera interface

## 🚀 Benefits of Modular Architecture

1. **Maintainability** - Each module has a single responsibility
2. **Testability** - Individual functions can be unit tested
3. **Reusability** - Components can be reused across the app
4. **Readability** - Code is organized logically and easy to navigate
5. **Scalability** - Easy to add new features without affecting existing code
6. **Debugging** - Issues can be isolated to specific modules

## 📦 Usage

The main `InstagramCameraScreen.js` imports and orchestrates all modules:

```javascript
// Import modular components
import { 
  INSTAGRAM_FILTERS,
  useInstagramAlert,
  getCurrentLayout,
  switchCamera,
  uploadPhotoToStorage,
  styles,
  FilterCarousel,
  PreviewModal
} from './InstagramCamera';
```

## 🔄 Migration Notes

- Original 2052-line file broken into 12 focused modules
- All functionality preserved and enhanced
- Backward compatible with existing navigation
- No breaking changes to external APIs
- Original file backed up as `InstagramCameraScreen_backup_original.js`

## 🛠️ Development Guidelines

1. **Adding New Features**: Create focused modules or extend existing ones
2. **Style Changes**: Update relevant style files (styles.js, previewStyles.js, etc.)
3. **New Components**: Add to components directory with proper exports
4. **Constants**: Add to constants.js for reusability
5. **Testing**: Test individual modules before integration

This modular architecture provides a solid foundation for future Instagram Camera enhancements while maintaining clean, professional code organization.

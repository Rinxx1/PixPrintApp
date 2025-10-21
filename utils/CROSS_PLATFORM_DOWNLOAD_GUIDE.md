# Download Service - Cross-Platform Permission Guide

## Overview
The Download Service (`downloadService.js`) is fully compatible with both iOS and Android platforms, handling permissions and storage differently based on the operating system.

---

## iOS Support

### Permissions
- **Required Permission**: Photo Library Access
- **Handled By**: `expo-media-library`
- **Permission Dialog**: Native iOS permission prompt appears on first download attempt

### Storage Behavior
- ✅ Creates a dedicated "**PixPrint**" album in the Photos app
- ✅ All downloaded photos are organized in this album
- ✅ Photos also appear in the main "All Photos" view
- ✅ Album persists even if app is uninstalled (photos remain)

### Album Location
```
Photos App > Albums > PixPrint
```

### Permission Settings Path
```
Settings > PixPrint > Photos
```

### Supported iOS Versions
- iOS 11 and above (tested)
- Works with all modern iOS versions

---

## Android Support

### Permissions
- **Android < 10 (API < 29)**: `WRITE_EXTERNAL_STORAGE`
- **Android 10+ (API 29+)**: Scoped Storage (automatic, no special permission needed for own app files)
- **Handled By**: `expo-media-library` (automatically detects Android version)
- **Permission Dialog**: Native Android permission prompt appears on first download attempt

### Storage Behavior

#### Android 9 and Below (API 28-)
- ✅ Creates a dedicated "**PixPrint**" folder in the gallery
- ✅ All downloaded photos are organized in this folder
- ✅ Folder persists even if app is uninstalled (photos remain)
- 📁 Location: `/storage/emulated/0/Pictures/PixPrint/`

#### Android 10 and Above (API 29+) - Scoped Storage
- ✅ Photos saved to the device's media store
- ✅ "PixPrint" album reference created (may vary by device)
- ⚠️ Due to scoped storage, photos appear in main gallery
- ⚠️ Some Android launchers may show PixPrint album, others may not
- 📁 Location: MediaStore (varies by device manufacturer)

### Album Location
```
Gallery App > Albums > PixPrint (Android < 10)
Gallery App > All Photos (Android 10+, album may be visible depending on launcher)
```

### Permission Settings Path
```
Settings > Apps > PixPrint > Permissions > Storage
```

### Supported Android Versions
- Android 6.0 (API 23) and above
- Scoped storage handling for Android 10+ (API 29+)

---

## Permission Handling

### First Download
1. User taps download button
2. Native permission dialog appears
3. User grants or denies permission

### If Permission Granted
- Photo downloads immediately
- Saved to PixPrint album
- Success message shown with album location

### If Permission Denied
- Alert shown with platform-specific instructions
- "Open Settings" button provided
- User can manually enable permission in device settings

### Permission Request Code
```javascript
const { status } = await MediaLibrary.requestPermissionsAsync();

if (status !== 'granted') {
  // Show platform-specific alert with settings link
}
```

---

## Platform-Specific Differences

| Feature | iOS | Android < 10 | Android 10+ |
|---------|-----|--------------|-------------|
| Permission Type | Photo Library | External Storage | Scoped Storage |
| Album Creation | ✅ Yes | ✅ Yes | ⚠️ Reference Only |
| Album Persistence | ✅ Yes | ✅ Yes | ⚠️ Varies |
| Permission Dialog | Native iOS | Native Android | Native Android |
| Settings Link | `app-settings:` | `Linking.openSettings()` | `Linking.openSettings()` |

---

## Technical Implementation

### expo-media-library
The service uses Expo's `expo-media-library` package which:
- ✅ Automatically handles platform differences
- ✅ Provides unified API for both platforms
- ✅ Manages permission requests natively
- ✅ Handles scoped storage on Android 10+
- ✅ Creates albums on both platforms

### Cross-Platform Code Example
```javascript
// Works on both iOS and Android
const { status } = await MediaLibrary.requestPermissionsAsync();

if (status === 'granted') {
  const asset = await MediaLibrary.createAssetAsync(fileUri);
  
  let album = await MediaLibrary.getAlbumAsync('PixPrint');
  if (!album) {
    // Creates album on iOS and Android < 10
    // Creates reference on Android 10+
    await MediaLibrary.createAlbumAsync('PixPrint', asset, false);
  } else {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  }
}
```

---

## Testing Recommendations

### iOS Testing
1. Test on iOS Simulator (permission prompts work)
2. Test on physical device
3. Test permission denial and re-request flow
4. Verify album appears in Photos app

### Android Testing
1. Test on Android 9 emulator (traditional storage)
2. Test on Android 10+ emulator (scoped storage)
3. Test on physical devices (Samsung, Google Pixel, etc.)
4. Verify photos appear in gallery
5. Check if album is visible (varies by launcher)

---

## Common Issues & Solutions

### Issue: Permission Dialog Doesn't Appear
**Solution**: Make sure `expo-media-library` is installed:
```bash
npx expo install expo-media-library
```

### Issue: Photos Not Appearing in Album (Android 10+)
**Explanation**: This is expected behavior due to scoped storage. Photos are saved but album organization varies by device manufacturer.

### Issue: Permission Always Denied
**Solution**: User needs to manually enable in device settings. The "Open Settings" button handles this automatically.

### Issue: Album Not Created on Android 10+
**Explanation**: Scoped storage doesn't support traditional album creation. Photos are still saved to gallery successfully.

---

## App.json / app.config.js Configuration

### Required Permissions (Automatic with expo-media-library)

**iOS (Info.plist)**:
```json
{
  "ios": {
    "infoPlist": {
      "NSPhotoLibraryUsageDescription": "PixPrint needs access to your photo library to save downloaded photos.",
      "NSPhotoLibraryAddUsageDescription": "PixPrint needs permission to save photos to your library."
    }
  }
}
```

**Android (AndroidManifest.xml)**:
```json
{
  "android": {
    "permissions": [
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  }
}
```

These are automatically added by `expo-media-library` when you build the app.

---

## Summary

✅ **Full iOS Support** - Works perfectly on all iOS versions
✅ **Full Android Support** - Works on Android 6+ with automatic scoped storage handling
✅ **Native Permissions** - Uses platform-native permission dialogs
✅ **Automatic Detection** - Detects platform and API level automatically
✅ **Graceful Degradation** - Handles permission denial with helpful messages
✅ **Cross-Platform API** - Single codebase works on both platforms

The download service is production-ready for both iOS and Android! 📱✨

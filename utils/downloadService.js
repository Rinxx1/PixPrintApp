import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform, Linking } from 'react-native';

const PIXPRINT_ALBUM = 'PixPrint';

/**
 * Attempt to create or reuse the PixPrint album.
 * If the platform blocks album changes (Android 10+ scoped storage), we fall back silently.
 */
const tryEnsurePixPrintAlbum = async (asset) => {
  try {
    const existing = await MediaLibrary.getAlbumAsync(PIXPRINT_ALBUM);
    if (!existing) {
      await MediaLibrary.createAlbumAsync(PIXPRINT_ALBUM, asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], existing, false);
    }
    return true;
  } catch (albumError) {
    console.warn('PixPrint album unavailable, saving to default library instead:', albumError);
    return false;
  }
};

/**
 * Download Service - Handles photo downloads to device gallery
 * Saves photos to a dedicated "PixPrint" album
 * 
 * CROSS-PLATFORM SUPPORT:
 * ----------------------
 * iOS (All versions):
 * - Requests photo library access permission
 * - Creates dedicated "PixPrint" album in Photos app
 * - Photos appear in: Photos > Albums > PixPrint
 * 
 * Android (All versions):
 * - Requests storage/media permission (automatically handles scoped storage on Android 10+)
 * - On Android < 10: Creates dedicated "PixPrint" album
 * - On Android 10+: Photos saved to gallery with PixPrint reference (scoped storage)
 * - Photos appear in: Gallery > Albums > PixPrint (or main gallery on Android 10+)
 * 
 * PERMISSIONS:
 * -----------
 * - expo-media-library handles all permission requests automatically
 * - On first use, native permission dialog appears
 * - If denied, user is prompted to open settings
 * - Works with both READ_EXTERNAL_STORAGE (Android) and Photo Library (iOS)
 */

/**
 * Download a photo from URL and save it to device gallery
 * @param {Object} photo - Photo object containing imageUrl
 * @param {string} eventName - Event name for filename
 * @param {Function} showAlert - Alert function from useAlert hook
 * @param {Function} showSuccess - Success alert function from useAlert hook
 * @param {Function} showError - Error alert function from useAlert hook
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export const downloadPhotoToGallery = async (photo, eventName, showAlert, showSuccess, showError) => {
  if (!photo || !photo.imageUrl) {
    showError(
      'Download Error',
      'Unable to download this photo. Please try again.',
      () => {},
      () => {}
    );
    return false;
  }

  try {
    // Request media library permissions (handles both iOS and Android)
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      // Handle permission denial
      const permissionMessage = Platform.OS === 'ios' 
        ? 'PixPrint needs access to your photo library to save images. Please enable photo permissions in Settings > PixPrint > Photos.'
        : 'PixPrint needs storage permission to save images. Please enable storage access in Settings > Apps > PixPrint > Permissions.';
      
      showAlert({
        title: '📱 Permission Required',
        message: permissionMessage,
        type: 'warning',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            style: 'primary', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      });
      return false;
    }

    // Show downloading message
    showAlert({
      title: '⬇️ Downloading Photo',
      message: 'Your photo is being saved to your device. This may take a moment...',
      type: 'info',
      buttons: [{ text: 'OK', style: 'primary' }]
    });

    // Create a filename with event name and timestamp
    const timestamp = new Date().getTime();
    const sanitizedEventName = eventName ? eventName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') : 'Event';
    const filename = `PixPrint_${sanitizedEventName}_${timestamp}.jpg`;
    const fileUri = FileSystem.documentDirectory + filename;

    // Download the file
    const downloadResult = await FileSystem.downloadAsync(
      photo.imageUrl,
      fileUri
    );

    if (downloadResult.status !== 200) {
      throw new Error('Download failed');
    }

    // Save to media library and try to attach to PixPrint album when possible
    const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
    const albumLinked = await tryEnsurePixPrintAlbum(asset);

    // Show platform-specific success message with fallback location
    const albumLocation = Platform.OS === 'ios'
      ? (albumLinked ? 'Photos > Albums > PixPrint' : 'Photos app (Recent)')
      : (albumLinked ? 'Gallery > Albums > PixPrint' : 'Gallery (Recent)');

    // Show success message
    showSuccess(
      '✅ Photo Downloaded!',
      `Your photo has been successfully saved to your photo library in the "PixPrint" album.\n\n📁 Location: ${albumLocation}`,
      () => {}
    );

    return true;

  } catch (error) {
    console.error('Error downloading photo:', error);
    
    if (error.message.includes('permission')) {
      showError(
        'Permission Denied',
        'Unable to save photo. Please grant photo library access in your device settings and try again.',
        () => downloadPhotoToGallery(photo, eventName, showAlert, showSuccess, showError),
        () => {}
      );
    } else if (error.message.includes('network') || error.message.includes('Download failed')) {
      showError(
        'Download Failed',
        'Unable to download the photo due to network issues. Please check your internet connection and try again.',
        () => downloadPhotoToGallery(photo, eventName, showAlert, showSuccess, showError),
        () => {}
      );
    } else {
      showError(
        'Download Error',
        'There was an error downloading your photo. Please try again or contact support if the problem persists.',
        () => downloadPhotoToGallery(photo, eventName, showAlert, showSuccess, showError),
        () => {}
      );
    }
    
    return false;
  }
};

/**
 * Download multiple photos to gallery
 * @param {Array} photos - Array of photo objects
 * @param {string} eventName - Event name for filenames
 * @param {Function} showAlert - Alert function from useAlert hook
 * @param {Function} showSuccess - Success alert function from useAlert hook
 * @param {Function} showError - Error alert function from useAlert hook
 * @param {Function} onProgress - Optional callback for progress updates (current, total)
 * @returns {Promise<Object>} - Returns object with success count and failed count
 */
export const downloadMultiplePhotos = async (
  photos, 
  eventName, 
  showAlert, 
  showSuccess, 
  showError,
  onProgress = null
) => {
  if (!photos || photos.length === 0) {
    showError(
      'Download Error',
      'No photos selected for download.',
      () => {},
      () => {}
    );
    return { success: 0, failed: 0 };
  }

  try {
    // Request media library permissions first (handles both iOS and Android)
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      // Handle permission denial with platform-specific message
      const permissionMessage = Platform.OS === 'ios' 
        ? 'PixPrint needs access to your photo library to save images. Please enable photo permissions in Settings > PixPrint > Photos.'
        : 'PixPrint needs storage permission to save images. Please enable storage access in Settings > Apps > PixPrint > Permissions.';
      
      showAlert({
        title: '📱 Permission Required',
        message: permissionMessage,
        type: 'warning',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            style: 'primary', 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      });
      return { success: 0, failed: 0 };
    }

  let successCount = 0;
  let failedCount = 0;
  let albumLinkedForAll = true;

    // Download photos one by one
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      if (onProgress) {
        onProgress(i + 1, photos.length);
      }

      try {
        const timestamp = new Date().getTime() + i; // Add index to avoid filename conflicts
        const sanitizedEventName = eventName ? eventName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') : 'Event';
        const filename = `PixPrint_${sanitizedEventName}_${timestamp}.jpg`;
        const fileUri = FileSystem.documentDirectory + filename;

        const downloadResult = await FileSystem.downloadAsync(
          photo.imageUrl,
          fileUri
        );

        if (downloadResult.status === 200) {
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          const albumLinked = await tryEnsurePixPrintAlbum(asset);
          if (!albumLinked) {
            albumLinkedForAll = false;
          }

          successCount++;
        } else {
          failedCount++;
        }
      } catch (photoError) {
        console.error(`Error downloading photo ${i + 1}:`, photoError);
        failedCount++;
      }

      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Show result message
    if (successCount > 0 && failedCount === 0) {
      const locationHint = Platform.OS === 'ios'
        ? (albumLinkedForAll ? 'Photos > Albums > PixPrint' : 'Photos app (Recent)')
        : (albumLinkedForAll ? 'Gallery > Albums > PixPrint' : 'Gallery (Recent)');

      showSuccess(
        '✅ All Photos Downloaded!',
        `Successfully downloaded ${successCount} photo${successCount > 1 ? 's' : ''} to your library.
📁 Location: ${locationHint}`,
        () => {}
      );
    } else if (successCount > 0 && failedCount > 0) {
      showAlert({
        title: '⚠️ Partial Success',
        message: `Downloaded ${successCount} photo${successCount > 1 ? 's' : ''} successfully.\n${failedCount} photo${failedCount > 1 ? 's' : ''} failed to download.`,
        type: 'warning',
        buttons: [{ text: 'OK', style: 'primary' }]
      });
    } else {
      showError(
        'Download Failed',
        'Unable to download photos. Please check your connection and try again.',
        () => {},
        () => {}
      );
    }

    return { success: successCount, failed: failedCount };

  } catch (error) {
    console.error('Error in batch download:', error);
    showError(
      'Download Error',
      'There was an error downloading photos. Please try again.',
      () => {},
      () => {}
    );
    return { success: 0, failed: photos.length };
  }
};

export default {
  downloadPhotoToGallery,
  downloadMultiplePhotos
};

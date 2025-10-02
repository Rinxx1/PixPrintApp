// Print Service Utility
// Global print functionality that can be used across different screens

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Add a photo to the print queue
 * @param {Object} photo - Photo object containing imageUrl and other metadata
 * @param {string} eventId - Event ID
 * @param {Function} showSuccess - Success alert function
 * @param {Function} showError - Error alert function
 * @returns {Promise<boolean>} - Returns true if successful, false otherwise
 */
export const addToCartPrintQueue = async (photo, eventId, showSuccess, showError) => {
  // Validate required parameters
  if (!photo || !photo.imageUrl || !eventId) {
    if (showError) {
      showError(
        'Print Error',
        'Unable to print this photo. Missing required information.',
        () => {},
        () => {}
      );
    }
    return false;
  }

  try {
    // Create print queue entry
    const printQueue = {
      event_id: eventId,
      photo_url: photo.imageUrl,
      photo_id: photo.id || null,
      username: photo.username || 'Unknown User',
      created_at: new Date(),
      status: 'pending',
      // Additional metadata for better tracking
      filter_name: photo.filterName || 'None',
      uploaded_at: photo.uploadedAt || null,
      user_id: photo.userId || null,
      is_guest: photo.isGuest || false,
      guest_username: photo.guestUsername || null
    };

    // Add to Firestore collection
    const docRef = await addDoc(collection(db, 'que_print_tbl'), printQueue);
    
    console.log('Photo added to print queue successfully:', docRef.id);

    // Show success message
    if (showSuccess) {
      showSuccess(
        '🖨️ Added to Print Queue!',
        'Your photo has been successfully added to the print queue. It will be processed shortly.',
        () => {
          console.log('Print queue success callback executed');
        }
      );
    }

    return true;

  } catch (error) {
    console.error('Error adding photo to print queue:', error);
    
    // Show error message with retry option
    if (showError) {
      showError(
        '🖨️ Print Queue Error',
        'Failed to add photo to print queue. Please check your connection and try again.',
        () => addToCartPrintQueue(photo, eventId, showSuccess, showError), // Retry function
        () => {} // Cancel function
      );
    }

    return false;
  }
};

/**
 * Add multiple photos to print queue
 * @param {Array} photos - Array of photo objects
 * @param {string} eventId - Event ID
 * @param {Function} showSuccess - Success alert function
 * @param {Function} showError - Error alert function
 * @param {Function} onProgress - Progress callback function (optional)
 * @returns {Promise<Object>} - Returns object with success count and failed photos
 */
export const addMultipleToCartPrintQueue = async (photos, eventId, showSuccess, showError, onProgress = null) => {
  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    if (showError) {
      showError(
        'Print Error',
        'No photos selected for printing.',
        () => {},
        () => {}
      );
    }
    return { successCount: 0, failedPhotos: [] };
  }

  let successCount = 0;
  const failedPhotos = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    
    // Update progress if callback provided
    if (onProgress) {
      onProgress(i + 1, photos.length, photo);
    }

    try {
      const success = await addToCartPrintQueue(photo, eventId, null, null); // Don't show individual alerts
      if (success) {
        successCount++;
      } else {
        failedPhotos.push(photo);
      }
    } catch (error) {
      console.error(`Error adding photo ${photo.id} to print queue:`, error);
      failedPhotos.push(photo);
    }
  }

  // Show final result
  if (successCount > 0 && failedPhotos.length === 0) {
    // All successful
    if (showSuccess) {
      showSuccess(
        '🖨️ All Photos Added to Print Queue!',
        `Successfully added ${successCount} photo${successCount > 1 ? 's' : ''} to the print queue.`,
        () => {
          console.log(`${successCount} photos added to print queue successfully`);
        }
      );
    }
  } else if (successCount > 0 && failedPhotos.length > 0) {
    // Partial success
    if (showError) {
      showError(
        '⚠️ Partial Success',
        `Added ${successCount} photo${successCount > 1 ? 's' : ''} to print queue. ${failedPhotos.length} photo${failedPhotos.length > 1 ? 's' : ''} failed to add.`,
        () => addMultipleToCartPrintQueue(failedPhotos, eventId, showSuccess, showError, onProgress), // Retry failed photos
        () => {}
      );
    }
  } else {
    // All failed
    if (showError) {
      showError(
        '🖨️ Print Queue Error',
        'Failed to add photos to print queue. Please check your connection and try again.',
        () => addMultipleToCartPrintQueue(photos, eventId, showSuccess, showError, onProgress), // Retry all
        () => {}
      );
    }
  }

  return { successCount, failedPhotos };
};

/**
 * Quick print function for single photo (simplified version)
 * @param {Object} photo - Photo object
 * @param {string} eventId - Event ID
 * @returns {Promise<boolean>} - Returns true if successful
 */
export const quickPrint = async (photo, eventId) => {
  try {
    return await addToCartPrintQueue(photo, eventId, null, null);
  } catch (error) {
    console.error('Quick print error:', error);
    return false;
  }
};

/**
 * Check if a photo is already in the print queue
 * @param {string} photoId - Photo ID to check
 * @param {string} eventId - Event ID
 * @returns {Promise<boolean>} - Returns true if photo is already in queue
 */
export const isPhotoInPrintQueue = async (photoId, eventId) => {
  try {
    const { getDocs, query, where } = await import('firebase/firestore');
    
    const queueRef = collection(db, 'que_print_tbl');
    const q = query(
      queueRef,
      where('photo_id', '==', photoId),
      where('event_id', '==', eventId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
    
  } catch (error) {
    console.error('Error checking print queue:', error);
    return false;
  }
};

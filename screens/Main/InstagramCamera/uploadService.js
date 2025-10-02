// Firebase Storage and Upload Functions
import { storage, db, auth } from '../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { INSTAGRAM_FILTERS } from './constants';

// Upload photo to Firebase Storage
export const uploadPhotoToStorage = async (imageUri, eventId, guestUsername, selectedFilter) => {
  console.log('uploadPhotoToStorage called with:', imageUri);
  
  try {
    const user = auth.currentUser;
    
    // For non-event photos, require authentication
    if (!eventId && !user) {
      throw new Error('Authentication required for personal photos');
    }
    
    let storageRef;
    let firestoreData;
    const timestamp = new Date().getTime();
    
    // Get current filter information - this is crucial for preserving frame data
    const currentFilter = INSTAGRAM_FILTERS.find(f => f.value === selectedFilter) || INSTAGRAM_FILTERS[0];
    const filterColor = currentFilter?.color || null;
    const filterName = currentFilter?.name || 'Original';
    
    console.log('Saving photo with filter data:', {
      filterName,
      filterColor,
      imageUri // Add the actual image URI being uploaded
    });
    
    if (eventId) {
      // Event-specific photo (supports both authenticated users and guests)
      const filename = user ? 
        `event_${eventId}_user_${user.uid}_${timestamp}.jpg` :
        `event_${eventId}_guest_${guestUsername}_${timestamp}.jpg`;
      
      storageRef = ref(storage, `event-photos/${eventId}/${filename}`);
      
      firestoreData = {
        event_id: eventId,
        user_id: user ? user.uid : null, // null for guests
        username: user ? (user.displayName || 'Unknown User') : guestUsername,
        photo_url: '',
        uploaded_at: serverTimestamp(),
        filter: filterColor,
        filter_name: filterName,
        likes: 0,
        comments: 0,
        source: 'instagram_camera',
        is_guest: !user, // Mark as guest photo
        guest_username: !user ? guestUsername : null,
        aspect_ratio: '9:16'
      };
    } else {
      // Personal photo (requires authentication)
      const filename = `user_photo_${timestamp}.jpg`;
      storageRef = ref(storage, `user-photos/${user.uid}/${filename}`);
      
      firestoreData = {
        user_id: user.uid,
        username: user.displayName || 'Unknown User',
        photo_url: '',
        uploaded_at: serverTimestamp(),
        filter: filterColor,
        filter_name: filterName,
        is_personal: true,
        likes: 0,
        comments: 0,
        source: 'instagram_camera',
        aspect_ratio: '9:16'
      };
    }
    
    // iOS fix: Better blob conversion
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('Uploading blob size:', blob.size, 'bytes');

    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Photo uploaded successfully to:', downloadURL);

    firestoreData.photo_url = downloadURL;
    
    // Save photo info to Firestore
    const photoCollection = eventId ? 'photos_tbl' : 'user_photos_tbl';
    const docRef = await addDoc(collection(db, photoCollection), firestoreData);
    
    console.log('Firestore document created with ID:', docRef.id);
    console.log('Saved data includes frame info:', {
      filter_name: firestoreData.filter_name
    });
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading photo:", error);
    throw error;
  }
};

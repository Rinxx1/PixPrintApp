# Download Service Usage Guide

## Overview
The Download Service provides easy-to-use functions for downloading photos from your app to the user's device gallery. Photos are automatically saved to a dedicated "PixPrint" album.

## Import

```javascript
import { downloadPhotoToGallery, downloadMultiplePhotos } from '../utils/downloadService';
import { useAlert } from '../context/AlertContext';
```

## Usage Examples

### 1. Download Single Photo

```javascript
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { downloadPhotoToGallery } from '../utils/downloadService';
import { useAlert } from '../context/AlertContext';

export default function MyScreen() {
  const { showAlert, showSuccess, showError } = useAlert();
  
  const photo = {
    id: 'photo123',
    imageUrl: 'https://example.com/photo.jpg',
    username: 'John Doe'
  };
  
  const eventName = 'Birthday Party 2025';
  
  const handleDownload = async () => {
    const success = await downloadPhotoToGallery(
      photo, 
      eventName, 
      showAlert, 
      showSuccess, 
      showError
    );
    
    if (success) {
      console.log('Photo downloaded successfully!');
    }
  };
  
  return (
    <TouchableOpacity onPress={handleDownload}>
      <Text>Download Photo</Text>
    </TouchableOpacity>
  );
}
```

### 2. Download Multiple Photos with Progress

```javascript
import React, { useState } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { downloadMultiplePhotos } from '../utils/downloadService';
import { useAlert } from '../context/AlertContext';

export default function GalleryScreen() {
  const { showAlert, showSuccess, showError } = useAlert();
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  
  const photos = [
    { id: '1', imageUrl: 'https://example.com/photo1.jpg' },
    { id: '2', imageUrl: 'https://example.com/photo2.jpg' },
    { id: '3', imageUrl: 'https://example.com/photo3.jpg' }
  ];
  
  const eventName = 'Wedding 2025';
  
  const handleBatchDownload = async () => {
    const result = await downloadMultiplePhotos(
      photos,
      eventName,
      showAlert,
      showSuccess,
      showError,
      (current, total) => {
        // Progress callback
        setDownloadProgress({ current, total });
        console.log(`Downloading ${current} of ${total}`);
      }
    );
    
    console.log(`Success: ${result.success}, Failed: ${result.failed}`);
  };
  
  return (
    <View>
      <TouchableOpacity onPress={handleBatchDownload}>
        <Text>Download All Photos</Text>
      </TouchableOpacity>
      {downloadProgress.total > 0 && (
        <Text>
          Downloading {downloadProgress.current} of {downloadProgress.total}
        </Text>
      )}
    </View>
  );
}
```

### 3. Simple Download Button (Like in JoinEventScreenTwo)

```javascript
<TouchableOpacity 
  style={styles.downloadButton}
  onPress={() => selectedPhoto && downloadPhotoToGallery(
    selectedPhoto, 
    eventName, 
    showAlert, 
    showSuccess, 
    showError
  )}
>
  <Ionicons name="download-outline" size={24} color="#48C6EF" />
  <Text>Download</Text>
</TouchableOpacity>
```

## Function Parameters

### downloadPhotoToGallery(photo, eventName, showAlert, showSuccess, showError)

**Parameters:**
- `photo` (Object) - Photo object with `imageUrl` property
- `eventName` (String) - Event name for filename (will be sanitized)
- `showAlert` (Function) - Alert function from useAlert hook
- `showSuccess` (Function) - Success alert function from useAlert hook
- `showError` (Function) - Error alert function from useAlert hook

**Returns:**
- `Promise<boolean>` - Returns true if successful, false otherwise

---

### downloadMultiplePhotos(photos, eventName, showAlert, showSuccess, showError, onProgress)

**Parameters:**
- `photos` (Array) - Array of photo objects with `imageUrl` property
- `eventName` (String) - Event name for filenames
- `showAlert` (Function) - Alert function from useAlert hook
- `showSuccess` (Function) - Success alert function from useAlert hook
- `showError` (Function) - Error alert function from useAlert hook
- `onProgress` (Function, optional) - Callback for progress updates `(current, total) => {}`

**Returns:**
- `Promise<Object>` - Returns object: `{ success: number, failed: number }`

## Features

✅ **Automatic Permission Handling** - Requests and manages photo library permissions
✅ **Dedicated Album** - Creates a "PixPrint" album for organized storage
✅ **Smart Filenames** - Uses event name and timestamp for unique filenames
✅ **Error Recovery** - Offers retry functionality on failures
✅ **User Feedback** - Shows download progress, success, and error messages
✅ **Batch Downloads** - Support for downloading multiple photos with progress tracking
✅ **Cross-Platform** - Works on both iOS and Android

## Album Location

Photos are saved to:
- **iOS**: Photos > Albums > PixPrint
- **Android**: Gallery > Albums > PixPrint

## Error Handling

The service handles common errors automatically:
- Permission denied → Prompts user to enable permissions
- Network errors → Shows retry option
- Download failures → Shows detailed error message
- Invalid URLs → Shows appropriate error

All errors provide retry functionality through the alert system.

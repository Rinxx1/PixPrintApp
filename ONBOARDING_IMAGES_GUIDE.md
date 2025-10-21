# Onboarding Images Guide

## Images to Download from undraw.co

Visit [undraw.co](https://undraw.co) and download the following illustrations. Use the color **#48C6EF** (your app's primary color) when customizing.

### 1. **onboarding-capture.png**
- **Search terms**: "Mobile photography" OR "Taking photos" OR "Camera"
- **Recommended illustration**: "Mobile photography" or "Photo session"
- **Description**: Shows someone taking photos with a mobile device
- **Where to save**: `assets/onboarding-capture.png`

### 2. **onboarding-share.png**
- **Search terms**: "Share" OR "Photo sharing" OR "Social sharing"
- **Recommended illustration**: "Social share" or "Uploading"
- **Description**: Shows sharing or uploading content
- **Where to save**: `assets/onboarding-share.png`

### 3. **onboarding-print.png**
- **Search terms**: "Printing" OR "Photo album" OR "Photos"
- **Recommended illustration**: "Photo album" or "Printing invoices"
- **Description**: Shows printing or photo memories
- **Where to save**: `assets/onboarding-print.png`

## Download Instructions

1. Go to [https://undraw.co/illustrations](https://undraw.co/illustrations)
2. Search for each illustration using the search terms above
3. Click on the illustration you like
4. Change the color to **#48C6EF** (your app's blue theme)
5. Download as PNG
6. Rename the file according to the names above
7. Place all three files in the `assets/` folder

## Alternative Illustrations

If you prefer different styles, here are alternatives:

### For Capture Screen:
- "Selfie time"
- "Mobile marketing"
- "Taking photos"

### For Share Screen:
- "Uploading"
- "Share online"
- "Social media"

### For Print Screen:
- "Images"
- "Photo"
- "Memories"

## File Requirements

- **Format**: PNG (transparent background)
- **Color**: #48C6EF (will be set in undraw.co customizer)
- **Size**: Original size from undraw.co is fine (they're optimized)
- **Location**: All files must be in `/assets/` folder

## Testing the Onboarding

After adding the images:

1. The onboarding will show automatically on first app launch
2. To test again, clear app data or use this code in your terminal:
   ```javascript
   // In React Native Debugger console:
   AsyncStorage.removeItem('hasSeenOnboarding');
   ```

3. Or reinstall the app

## Features

✅ Auto-shows on first launch
✅ Never shows again after completion
✅ Beautiful animations
✅ Swipeable slides
✅ Skip button
✅ Pagination dots
✅ Get Started button on last slide
✅ Matches app's blue theme

## Customization

If you want to change the onboarding content, edit:
- `/components/OnboardingModal.js`
- Modify the `onboardingData` array with your own titles, descriptions, and icons

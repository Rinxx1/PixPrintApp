# Snapture Build Instructions

## Prerequisites
1. Node.js (v16 or higher)
2. Expo CLI
3. EAS CLI
4. Apple Developer Account
5. Xcode (for iOS builds)

## Setup Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Build Tools
```bash
npm install -g @expo/eas-cli
npm install -g expo-cli
```

### 3. Login to Expo
```bash
eas login
expo login
```

## Build Process

### For TestFlight (iOS)
```bash
# Configure build (first time only)
eas build:configure

# Build for iOS production
eas build --platform ios --profile production

# Alternative: Build and auto-submit to TestFlight
eas build --platform ios --profile production --auto-submit
```

### For Development Testing
```bash
# iOS Simulator build
eas build --platform ios --profile preview

# Android APK for testing
eas build --platform android --profile preview
```

### For Production Release
```bash
# Build for both platforms
eas build --platform all --profile production
```

## Configuration Files Updated

### app.json
- ✅ Bundle Identifier: `com.pixprintstudio.snapture`
- ✅ Proper permissions for camera and photo library
- ✅ Background processing capabilities
- ✅ Associated domains for deep linking

### eas.json
- ✅ Production build configuration
- ✅ Resource allocation for builds
- ✅ Auto-increment build numbers
- ✅ Submit configuration for App Store

## Next Steps

1. **Update Team ID**: Replace `your-team-id` in `eas.json` with your Apple Developer Team ID
2. **Update App ID**: Replace `your-app-store-connect-app-id` with your App Store Connect app ID
3. **Run Build**: Execute `eas build --platform ios --profile production`
4. **Monitor Build**: Check build status at https://expo.dev/builds
5. **TestFlight**: Build will automatically appear in TestFlight after processing

## Troubleshooting

### Common Issues:
- **Bundle ID conflicts**: Ensure bundle ID matches your Apple Developer account
- **Certificate issues**: Run `eas credentials` to manage certificates
- **Build failures**: Check build logs in Expo dashboard
- **Permission issues**: Verify all required capabilities are enabled in Apple Developer portal

### Build Status:
Check your builds at: https://expo.dev/accounts/rinxx14/projects/snapturex/builds
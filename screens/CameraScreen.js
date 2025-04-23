import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen({ navigation }) {
  const [cameraType, setCameraType] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedFilter, setSelectedFilter] = useState(null);

  const filterColors = {
    red: 'rgba(255, 0, 0, 0.15)',
    skyblue: 'rgba(135, 206, 250, 0.15)',
    gold: 'rgba(255, 215, 0, 0.15)',
    white: 'rgba(255, 255, 255, 0.15)',
  };

  if (!permission) return <Text>Requesting camera permission...</Text>;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>We need your permission to access the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraType = () => {
    setCameraType((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} facing={cameraType} />

      {/* Filter Overlay */}
      {selectedFilter && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: filterColors[selectedFilter], zIndex: 1 },
          ]}
        />
      )}

      {/* Controls Layer */}
      <View style={styles.controls} pointerEvents="box-none">
        {/* Back Button */}
        <TouchableOpacity style={styles.backArrow} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Filter Buttons */}
        <View style={styles.filters}>
          {Object.keys(filterColors).map((color) => (
            <TouchableOpacity
              key={color}
              onPress={() =>
                setSelectedFilter((prev) => (prev === color ? null : color))
              }
              style={[
                styles.filterCircle,
                {
                  backgroundColor: color,
                  borderColor: selectedFilter === color ? '#FF6F61' : '#fff',
                },
              ]}
            />
          ))}
        </View>

        {/* Switch Camera */}
        <TouchableOpacity style={styles.switchButton} onPress={toggleCameraType}>
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Capture Button */}
        <TouchableOpacity style={styles.shutterButton}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        {/* Thumbnail */}
        <TouchableOpacity  onPress={() => navigation.navigate('Gallery')}>
        <View style={styles.thumbnailWrapper}>
          <Image
            source={require('../assets/avatar.png')}
            style={styles.thumbnail}
          />
        </View>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backArrow: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#00000055',
    borderRadius: 20,
    padding: 6,
    zIndex: 2,
  },
  filters: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    flexDirection: 'row',
    zIndex: 2,
  },
  filterCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
  },
  switchButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: '#00000055',
    borderRadius: 24,
    padding: 8,
    zIndex: 2,
  },
  shutterButton: {
    alignSelf: 'center',
    marginBottom: 40,
    width: 70,
    height: 70,
    backgroundColor: '#fff',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FF6F61',
    zIndex: 2,
  },
  shutterInner: {
    width: 50,
    height: 50,
    backgroundColor: '#FF6F61',
    borderRadius: 25,
  },
  thumbnailWrapper: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 2,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

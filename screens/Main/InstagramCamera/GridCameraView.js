// Grid Camera View Component
import React from 'react';
import { View, TouchableOpacity, Image, Alert, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './styles';
import { gridStyles } from './gridStyles';

export const GridCameraView = ({
  layout,
  activeGridIndex,
  setActiveGridIndex,
  gridImages,
  removeGridImage,
  cameraRef,
  facing,
  flash,
  renderFilterOverlay
}) => {
  return (
    <View style={styles.fullSize}>
      <LinearGradient
        colors={[
          'rgba(0,0,0,0.1)', 
          'rgba(0,0,0,0.3)', 
          'rgba(0,0,0,0.1)'
        ]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {layout.positions.map((position, index) => {
        const isActive = index === activeGridIndex;
        const isFilled = gridImages[index];

        const cellStyle = {
          position: 'absolute',
          left: `${position.x * 100}%`,
          top: `${position.y * 100}%`,
          width: `${position.width * 100}%`,
          height: `${position.height * 100}%`,
          padding: 2, // Add padding for spacing between cells
        };

        if (isActive) {
          return (
            <View key={`grid-cell-${index}`} style={[cellStyle, gridStyles.activeGridCell]}>
              <View style={gridStyles.activeGridCellInner}>
                <CameraView
                  ref={cameraRef}
                  style={styles.fullSize}
                  facing={facing}
                  flash={flash}
                  scale="cover"
                />
              </View>
            </View>
          );
        } else {
          return (
            <TouchableOpacity
              key={`grid-cell-${index}`}
              style={cellStyle}
              onPress={() => setActiveGridIndex(index)}
              onLongPress={() => {
                if (isFilled) {
                  // Show remove option on long press
                  Alert.alert(
                    'Remove Image',
                    'Do you want to remove this image?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeGridImage(index) }
                    ]
                  );
                }
              }}
            >
              {isFilled ? (
                <View style={gridStyles.filledGridCell}>
                  <Image source={{ uri: gridImages[index] }} style={gridStyles.gridImage} />
                  <View style={gridStyles.gridCellOverlay}>
                    <View style={gridStyles.filledCellIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={gridStyles.emptyGridCellContainer}
                  onPress={() => setActiveGridIndex(index)}
                >
                  <View style={gridStyles.emptyGridCellBackground}>
                    <View style={gridStyles.emptyGridPlaceholder} />
                    <BlurView 
                      intensity={60} 
                      tint="dark"
                      style={gridStyles.emptyGridBlur} 
                    />
                    <View style={gridStyles.emptyGridOverlay} />
                  </View>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        }
      })}
      
      {/* Filter overlay for grid mode */}
      {renderFilterOverlay()}
    </View>
  );
};

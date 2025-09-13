// Layout Picker Modal Component
import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INSTAGRAM_LAYOUTS } from './constants';
import { layoutPickerStyles } from './layoutPickerStyles';

export const LayoutPickerModal = ({ 
  showLayoutPicker, 
  setShowLayoutPicker, 
  selectedLayout, 
  selectLayout 
}) => {
  return (
    <Modal visible={showLayoutPicker} animationType="slide" transparent={true}>
      <View style={layoutPickerStyles.layoutPickerOverlay}>
        <View style={layoutPickerStyles.layoutPickerContainer}>
          <View style={layoutPickerStyles.layoutPickerHeader}>
            <Text style={layoutPickerStyles.layoutPickerTitle}>Choose Layout</Text>
            <TouchableOpacity 
              onPress={() => setShowLayoutPicker(false)}
              style={layoutPickerStyles.layoutPickerCloseButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={layoutPickerStyles.layoutPickerScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={layoutPickerStyles.layoutPickerContent}
          >
            {INSTAGRAM_LAYOUTS.map((layout) => (
              <TouchableOpacity
                key={layout.id}
                style={[
                  layoutPickerStyles.layoutPickerItem,
                  selectedLayout === layout.id && layoutPickerStyles.layoutPickerItemActive
                ]}
                onPress={() => selectLayout(layout.id)}
              >
                <View style={layoutPickerStyles.layoutIconContainer}>
                  <View style={layoutPickerStyles.miniLayout}>
                    {layout.positions.map((p, idx) => (
                      <View
                        key={`mini-${layout.id}-${idx}`}
                        style={[
                          layoutPickerStyles.miniCell,
                          {
                            left: `${p.x * 100}%`,
                            top: `${p.y * 100}%`,
                            width: `${p.width * 100}%`,
                            height: `${p.height * 100}%`,
                            backgroundColor: selectedLayout === layout.id 
                              ? 'rgba(225,48,108,0.9)' 
                              : 'rgba(255,255,255,0.9)'
                          }
                        ]}
                      />
                    ))}
                  </View>
                </View>
                <View style={layoutPickerStyles.layoutTextContainer}>
                  <Text style={[
                    layoutPickerStyles.layoutPickerItemText,
                    selectedLayout === layout.id && layoutPickerStyles.layoutPickerItemTextActive
                  ]}>
                    {layout.name}
                  </Text>
                  <Text style={layoutPickerStyles.layoutPickerItemSubtext}>
                    {layout.gridCount === 1 ? 'Single photo' : `${layout.gridCount} photos`}
                  </Text>
                </View>
                {selectedLayout === layout.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#E1306C" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

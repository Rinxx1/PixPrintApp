import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import HeaderBar from '../../components/HeaderBar';

const mockFrames = [
  require('../../assets/frame1.png'),
  require('../../assets/frame1.png'),
  require('../../assets/frame1.png'),
  require('../../assets/frame1.png'),
];

export default function ChooseFrameScreen({ navigation }) {
  const [selected, setSelected] = useState([]);

  const toggleSelect = (index) => {
    if (selected.includes(index)) {
      setSelected(selected.filter(i => i !== index));
    } else {
      setSelected([...selected, index]);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      <Text style={styles.title}>Choose Your Frames</Text>
      <FlatList
        data={mockFrames}
        keyExtractor={(_, i) => i.toString()}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[
              styles.frameBox,
              selected.includes(index) && styles.selectedFrame
            ]}
            onPress={() => toggleSelect(index)}
          >
            <Image source={item} style={styles.frameImage} />
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.doneText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5', paddingTop: 80 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#2D2A32' },
  frameBox: {
    width: '45%',
    margin: '2.5%',
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: '#ddd',
    borderWidth: 2,
  },
  frameImage: { width: '100%', height: 150, resizeMode: 'cover' },
  selectedFrame: {
    borderColor: '#FF6F61',
    borderWidth: 3,
  },
  doneButton: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#FF6F61',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
  },
  doneText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

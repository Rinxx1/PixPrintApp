import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import HeaderBar from '../components/HeaderBar';

const images = new Array(9).fill(require('../assets/avatar.png'));
const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 94) / 3;

export default function GalleryScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.imageWrapper}>
      <Image source={item} style={styles.image} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      <View style={styles.content}>
      <Text style={styles.title}>Gallery</Text>
      <Text style={styles.subtitle}>Your captured moments</Text>

      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        numColumns={3}
        contentContainerStyle={styles.grid}
      />

      <Text style={styles.footer}>Tap an image to preview or print</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 26,
    paddingTop: 100, // 👈 Leave space for floating header
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#7B7B7B',
    marginLeft: 8,
    marginBottom: 12,
  },
  grid: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  imageWrapper: {
    margin: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
  },
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: 16,
  },
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});

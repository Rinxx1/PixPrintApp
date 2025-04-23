import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import HeaderBar from '../components/HeaderBar';

export default function PersonalInfoScreen({ navigation }) {
  const [name, setName] = useState('Lia');
  const [email, setEmail] = useState('lia@email.com');
  const [address, setAddress] = useState('Davao City');
  const [profileImage, setProfileImage] = useState(null);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [1, 1],
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      <View style={styles.content}>
      <Text style={styles.title}>Personal Information</Text>

      {/* Profile Image */}
      <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require('../assets/avatar.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.changePhoto}>Change Photo</Text>
      </TouchableOpacity>

      {/* Input Fields */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />

      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />

      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveText}>Save Changes</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 32,
  },
  content:{
    paddingTop: 104,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#2D2A32',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  changePhoto: {
    color: '#FF6F61',
    fontWeight: '500',
  },
  label: {
    fontSize: 14,
    color: '#2D2A32',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#DDD',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

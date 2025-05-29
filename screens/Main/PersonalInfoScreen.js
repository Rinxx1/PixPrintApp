import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../context/authContext';
import { auth, db } from '../../firebase'; 
import { doc, setDoc } from 'firebase/firestore'; 
import HeaderBar from '../../components/HeaderBar';

const { width } = Dimensions.get('window');

export default function PersonalInfoScreen({ navigation }) {
  const { userData, setUserData } = useContext(AuthContext);
  const [firstName, setFirstName] = useState(userData?.user_firstname || '');
  const [lastName, setLastName] = useState(userData?.user_lastname || '');
  const [email, setEmail] = useState(userData?.user_email || '');
  const [address, setAddress] = useState(userData?.user_address || '');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  
  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    if (userData) {
      setFirstName(userData.user_firstname || '');
      setLastName(userData.user_lastname || '');
      setEmail(userData.user_email || '');
      setAddress(userData.user_address || '');
      setProfileImage(userData.user_profile_image || null);
    }
  }, [userData]);

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your profile picture.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [1, 1],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const saveChanges = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return;
    }
    
    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return;
    }
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'user_tbl', user.uid);
        await setDoc(userRef, {
          user_firstname: firstName,
          user_lastname: lastName,
          user_email: email,
          user_address: address,
          user_profile_image: profileImage || '',
        }, { merge: true });

        // Update user data in context
        setUserData({ 
          ...userData, 
          user_firstname: firstName, 
          user_lastname: lastName, 
          user_email: email, 
          user_address: address,
          user_profile_image: profileImage || '' 
        });

        Alert.alert(
          'Profile Updated', 
          'Your information has been successfully updated.',
          [{ text: 'Great!' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Personal Information</Text>
          <Text style={styles.subtitle}>Update your profile details below</Text>
        </Animated.View>
        
        {/* Profile Image Section */}
        <Animated.View 
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={profileImage ? { uri: profileImage } : require('../../assets/avatar.png')}
              style={styles.avatar}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
              <LinearGradient
                colors={['#FF8D76', '#FF6F61']}
                style={styles.cameraGradient}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>
            {firstName || lastName ? `${firstName} ${lastName}` : 'Add Your Name'}
          </Text>
          
          <Text style={styles.profileEmail}>
            {email || 'Add your email address'}
          </Text>
        </Animated.View>
        
        {/* Form Section */}
        <Animated.View 
          style={[
            styles.formSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={firstName} 
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#AAAAAA"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="people-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={lastName} 
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  placeholderTextColor="#AAAAAA"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={email} 
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholder="Enter your email address"
                  placeholderTextColor="#AAAAAA"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={address} 
                  onChangeText={setAddress}
                  placeholder="Enter your address (optional)"
                  placeholderTextColor="#AAAAAA"
                />
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* Save Button */}
        <Animated.View 
          style={[
            styles.buttonSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
            onPress={saveChanges}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ['#CCCCCC', '#AAAAAA'] : ['#FF8D76', '#FF6F61']}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <Text style={styles.saveText}>Updating...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.saveText}>Save Changes</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.footer}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={16} color="#666666" />
            <Text style={styles.helpText}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 141, 118, 0.06)',
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 104,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  cameraGradient: {
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#777777',
  },
  formSection: {
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  buttonSection: {
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    shadowOpacity: 0.1,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  helpText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
});

import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView,
  Animated,
  Dimensions,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../context/authContext';
import { auth, db } from '../../firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import HeaderBar from '../../components/HeaderBar';
import { useAlert } from '../../context/AlertContext'; // Add this import

const { width } = Dimensions.get('window');

export default function PersonalInfoScreen({ navigation }) {
  const { userData, setUserData } = useContext(AuthContext);
  const [firstName, setFirstName] = useState(userData?.user_firstname || '');
  const [lastName, setLastName] = useState(userData?.user_lastname || '');
  const [email, setEmail] = useState(userData?.user_email || '');
  const [address, setAddress] = useState(userData?.user_address || '');
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add alert hook
  const { showAlert, showError, showSuccess, showConfirm } = useAlert();
  
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

  // Enhanced email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Enhanced name validation function
  const isValidName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name.trim());
  };

  const pickImage = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!granted) {
        showAlert({
          title: 'Photo Access Required 📸',
          message: 'PixPrint needs access to your photo library to update your profile picture. This helps personalize your account and makes it easier for others to recognize you in events.',
          type: 'warning',
          buttons: [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              style: 'primary', 
              onPress: () => Linking.openSettings() 
            }
          ]
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [1, 1],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        
        // Show confirmation for profile picture change
        showConfirm(
          'Update Profile Picture?',
          'Would you like to use this image as your new profile picture?\n\n📸 This will be visible to other event participants\n✨ You can change it anytime in your profile settings\n💾 Don\'t forget to save your changes!',
          () => {
            setProfileImage(selectedImage.uri);
            showAlert({
              title: 'Profile Picture Updated! 🎉',
              message: 'Your new profile picture looks great! Remember to tap "Save Changes" to make it permanent.',
              type: 'success',
              buttons: [
                { text: 'Got It!', style: 'primary' }
              ]
            });
          },
          () => {
            console.log('Profile picture change cancelled');
          }
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showError(
        'Image Selection Failed',
        'Unable to access your photo library. This could be due to device restrictions or app permissions. Please try again or check your device settings.',
        () => pickImage(), // Retry function
        () => {} // Cancel function
      );
    }
  };

  const validateForm = () => {
    // Enhanced validation with better error messages
    if (!firstName.trim()) {
      showAlert({
        title: 'First Name Required',
        message: 'Please enter your first name. This helps identify you in events and makes your profile more personal.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return false;
    }

    if (!isValidName(firstName)) {
      showAlert({
        title: 'Invalid First Name',
        message: 'Please enter a valid first name:\n\n✓ At least 2 characters long\n✓ Contains only letters, spaces, hyphens, or apostrophes\n✓ No numbers or special symbols',
        type: 'warning',
        buttons: [
          { text: 'Fix It', style: 'primary' }
        ]
      });
      return false;
    }
    
    if (!lastName.trim()) {
      showAlert({
        title: 'Last Name Required',
        message: 'Please enter your last name. This completes your profile and helps others recognize you in shared events.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return false;
    }

    if (!isValidName(lastName)) {
      showAlert({
        title: 'Invalid Last Name',
        message: 'Please enter a valid last name:\n\n✓ At least 2 characters long\n✓ Contains only letters, spaces, hyphens, or apostrophes\n✓ No numbers or special symbols',
        type: 'warning',
        buttons: [
          { text: 'Fix It', style: 'primary' }
        ]
      });
      return false;
    }
    
    if (!email.trim()) {
      showAlert({
        title: 'Email Address Required',
        message: 'Please enter your email address. This is used for account verification, notifications, and password recovery.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return false;
    }

    if (!isValidEmail(email.trim())) {
      showAlert({
        title: 'Invalid Email Address',
        message: 'Please enter a valid email address in the correct format:\n\n✓ Example: user@example.com\n✓ Must contain @ symbol\n✓ Must have valid domain\n✓ No spaces allowed',
        type: 'error',
        buttons: [
          { text: 'Fix Email', style: 'primary' }
        ]
      });
      return false;
    }

    return true;
  };

  const saveChanges = async () => {
    // Validate form first
    if (!validateForm()) {
      return;
    }

    // Show confirmation dialog with preview of changes
    const changes = [];
    if (firstName !== (userData?.user_firstname || '')) changes.push(`✓ First Name: ${firstName}`);
    if (lastName !== (userData?.user_lastname || '')) changes.push(`✓ Last Name: ${lastName}`);
    if (email !== (userData?.user_email || '')) changes.push(`✓ Email: ${email}`);
    if (address !== (userData?.user_address || '')) changes.push(`✓ Address: ${address || 'Not provided'}`);
    if (profileImage !== (userData?.user_profile_image || null)) changes.push('✓ Profile Picture: Updated');

    if (changes.length === 0) {
      showAlert({
        title: 'No Changes to Save',
        message: 'Your profile information hasn\'t changed. Make some updates to your details and then save your changes.',
        type: 'info',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return;
    }

    showConfirm(
      'Save Profile Changes?',
      `You're about to update the following information:\n\n${changes.join('\n')}\n\n💾 Changes will be saved to your account\n🔄 Updates will sync across all devices\n✨ Your new info will be visible in events\n\nProceed with saving these changes?`,
      async () => {
        await processSaveChanges();
      },
      () => {
        console.log('Save changes cancelled');
      }
    );
  };

  const processSaveChanges = async () => {
    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        showError(
          'Authentication Error',
          'Unable to verify your identity. Please sign in again to save your profile changes.',
          () => navigation.navigate('SignIn'), // Navigate to sign in
          () => setIsLoading(false) // Cancel function
        );
        return;
      }

      // Prepare the updated data
      const updatedData = {
        user_firstname: firstName.trim(),
        user_lastname: lastName.trim(),
        user_email: email.trim().toLowerCase(),
        user_address: address.trim(),
        user_profile_image: profileImage || '',
        updated_at: new Date().toISOString(), // Add timestamp for tracking
      };

      // Save to Firestore
      const userRef = doc(db, 'user_tbl', user.uid);
      await setDoc(userRef, updatedData, { merge: true });

      // Update user data in context
      setUserData({ 
        ...userData, 
        ...updatedData
      });

      // Show detailed success message
      showSuccess(
        'Profile Updated Successfully! 🎉',
        'Your personal information has been securely saved and updated across all your devices.\n\n✅ Your profile is now up to date\n🔄 Changes will appear in all events\n📱 Information synced across devices\n🔒 Data safely stored in your account\n\nYour updated profile looks great!',
        () => {
          // Optional: Navigate back or refresh
          console.log('Profile update completed');
        }
      );

    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Enhanced error handling
      if (error.code === 'permission-denied') {
        showError(
          'Permission Denied',
          'You don\'t have permission to update this profile. This could be due to account restrictions or security settings.',
          () => processSaveChanges(), // Retry function
          () => setIsLoading(false) // Cancel function
        );
      } else if (error.code === 'network-request-failed') {
        showError(
          'Network Connection Error',
          'Unable to save your profile due to network issues. Please check your internet connection and try again.',
          () => processSaveChanges(), // Retry function
          () => setIsLoading(false) // Cancel function
        );
      } else if (error.message.includes('quota')) {
        showError(
          'Storage Limit Reached',
          'Unable to save your profile due to storage limitations. Please try again later or contact support if the problem persists.',
          () => processSaveChanges(), // Retry function
          () => setIsLoading(false) // Cancel function
        );
      } else {
        showError(
          'Save Failed',
          'There was an unexpected error while saving your profile. This could be due to server issues or connectivity problems. Please try again.',
          () => processSaveChanges(), // Retry function
          () => setIsLoading(false) // Cancel function
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced help function
  const handleHelp = () => {
    showAlert({
      title: 'Profile Help 💡',
      message: 'Having trouble with your profile? Here are some tips:\n\n📸 Profile Picture: Tap the camera icon to change\n✍️ Names: Use only letters, spaces, and hyphens\n📧 Email: Must be a valid email format\n🏠 Address: Optional but helps with event location features\n💾 Save: Don\'t forget to save your changes!\n\nNeed more help? Contact our support team.',
      type: 'info',
      buttons: [
        { text: 'Got It!', style: 'primary' },
        { 
          text: 'Contact Support', 
          style: 'secondary', 
          onPress: () => {
            // You can add support contact functionality here
            showAlert({
              title: 'Contact Support',
              message: 'Support feature coming soon! For now, you can reach us at support@pixprint.com',
              type: 'info',
              buttons: [{ text: 'OK', style: 'primary' }]
            });
          }
        }
      ]
    });
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
              <Text style={styles.label}>First Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={firstName} 
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#AAAAAA"
                  maxLength={50}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="people-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={lastName} 
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  placeholderTextColor="#AAAAAA"
                  maxLength={50}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
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
                  maxLength={100}
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address (Optional)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input} 
                  value={address} 
                  onChangeText={setAddress}
                  placeholder="Enter your address"
                  placeholderTextColor="#AAAAAA"
                  maxLength={200}
                />
              </View>
            </View>

            {/* Required fields note */}
            <View style={styles.requiredNote}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.requiredText}>* Required fields</Text>
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
          <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
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
  requiredNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  requiredText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontStyle: 'italic',
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

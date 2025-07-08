import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, updateProfile } from 'firebase/auth';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useAlert } from '../context/AlertContext';
import { AuthContext } from '../context/authContext'; // Add this import

const { width, height } = Dimensions.get('window');

export default function SignUpScreen({ route, navigation }) {
  // Get guest info from route params
  const { guestUsername, eventId, fromGuestSettings } = route.params || {};

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Renamed this variable
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState(guestUsername || '');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add alert hook
  const { showAlert, showError, showSuccess, showConfirm } = useAlert();
  const { markAccountCreated } = useContext(AuthContext); // Add this

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  React.useEffect(() => {
    // Start entrance animations
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
  }, []);

  // Enhanced email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Enhanced name validation
  const isValidName = (name) => {
    return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name.trim());
  };

  // Enhanced password strength validation
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    return strength;
  };

  // Check if the email is already registered
  const checkIfEmailExists = async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Enhanced validation function
  const validateInputs = () => {
    // First Name validation
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

    // Last Name validation
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

    // Email validation
    if (!email.trim()) {
      showAlert({
        title: 'Email Address Required',
        message: 'Please enter your email address. This will be used for:\n\n📧 Account verification and login\n🔔 Important notifications\n🔒 Account recovery and security\n📱 Communication about your events',
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
        message: 'Please enter a valid email address in the correct format:\n\n✓ Example: user@example.com\n✓ Must contain @ symbol\n✓ Must have valid domain extension\n✓ No spaces allowed\n\nThis email will be your login username.',
        type: 'error',
        buttons: [
          { text: 'Fix Email', style: 'primary' }
        ]
      });
      return false;
    }

    // Address validation
    if (!address.trim()) {
      showAlert({
        title: 'Address Required',
        message: 'Please enter your address. This information helps with:\n\n📍 Location-based event features\n📦 Potential delivery services\n🎯 Personalized event recommendations\n🔒 Your address is kept private and secure',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return false;
    }

    if (address.trim().length < 5) {
      showAlert({
        title: 'Address Too Short',
        message: 'Please enter a more complete address. Include at least your street and city for better accuracy.',
        type: 'warning',
        buttons: [
          { text: 'Add More Details', style: 'primary' }
        ]
      });
      return false;
    }

    // Password validation
    if (!password.trim()) {
      showAlert({
        title: 'Password Required',
        message: 'Please create a password to secure your account. Your password protects all your photos, events, and personal information.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return false;
    }

    if (password.length < 6) {
      showAlert({
        title: 'Password Too Short 🔒',
        message: 'Your password must be at least 6 characters long for security. Consider making it even stronger with:\n\n✓ 8+ characters (recommended)\n✓ Mix of letters and numbers\n✓ Special characters (!@#$%)\n✓ Both uppercase and lowercase letters',
        type: 'warning',
        buttons: [
          { text: 'Create Stronger Password', style: 'primary' }
        ]
      });
      return false;
    }

    const passwordStrength = getPasswordStrength(password);
    if (passwordStrength < 2) {
      showAlert({
        title: 'Weak Password 🔒',
        message: 'Your password could be stronger for better security. Consider adding:\n\n' +
                 `${password.length >= 8 ? '✅' : '❌'} At least 8 characters\n` +
                 `${/\d/.test(password) ? '✅' : '❌'} At least one number\n` +
                 `${/[A-Z]/.test(password) ? '✅' : '❌'} At least one uppercase letter\n` +
                 `${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✅' : '❌'} At least one special character\n\n` +
                 'A strong password protects your memories and personal data!',
        type: 'warning',
        buttons: [
          { text: 'Use This Password', style: 'secondary' },
          { text: 'Make It Stronger', style: 'primary' }
        ]
      });
      return false;
    }

    // Password confirmation validation
    if (!confirmPassword.trim()) {
      showAlert({
        title: 'Confirm Your Password',
        message: 'Please re-enter your password to confirm it\'s correct. This prevents typos and ensures you can sign in later.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return false;
    }

    if (password !== confirmPassword) {
      showAlert({
        title: 'Passwords Don\'t Match ❌',
        message: 'The passwords you entered don\'t match. Please make sure both password fields contain exactly the same password.\n\n💡 Tip: Use the eye icon to reveal your passwords and check they match.',
        type: 'error',
        buttons: [
          { text: 'Fix Passwords', style: 'primary' }
        ]
      });
      return false;
    }

    return true;
  };

  // Handle sign-up logic with enhanced error handling
  const handleSignUp = async () => {
    if (isLoading) return;

    if (!validateInputs()) return;

    // Show confirmation dialog before creating account
    showConfirm(
      'Create Your PixPrint Account?',
      `You're about to create an account with:\n\n👤 Name: ${firstName} ${lastName}\n📧 Email: ${email}\n📍 Address: ${address}\n\n🎉 You'll be able to:\n• Create and join photo events\n• Capture and share memories\n• Access your photos anywhere\n• Connect with friends and family\n\nReady to get started?`,
      async () => {
        await processSignUp();
      },
      () => {
        console.log('Sign up cancelled');
      }
    );
  };

  const processSignUp = async () => {
    setIsLoading(true);

    try {
      // Check if the email already exists
      const emailExists = await checkIfEmailExists(email);
      if (emailExists) {
        showAlert({
          title: 'Email Already Registered 📧',
          message: `An account with the email "${email}" already exists.\n\n🔑 If this is your email, try signing in instead\n🤔 Forgot your password? Use the password reset option\n📝 Want to use a different email? Go back and change it`,
          type: 'warning',
          buttons: [
            { text: 'Try Different Email', style: 'cancel' },
            { 
              text: 'Sign In Instead', 
              style: 'primary', 
              onPress: () => navigation.navigate('SignIn') 
            }
          ]
        });
        return;
      }

      // Create the account
      const response = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = response.user;

      // Update user profile with displayName
      await updateProfile(currentUser, {
        displayName: `${firstName.trim()} ${lastName.trim()}`
      });

      // Add user profile to Firestore
      await setDoc(doc(db, 'user_tbl', currentUser.uid), {
        user_email: email.toLowerCase().trim(),
        user_firstname: firstName.trim(),
        user_lastname: lastName.trim(),
        user_password: password,
        user_address: address.trim(),
        user_id: currentUser.uid,
        created_at: new Date().toISOString(),
        profile_completed: true,
        // Add guest conversion info if applicable
        ...(guestUsername && {
          converted_from_guest: true,
          original_guest_username: guestUsername,
          conversion_date: new Date()
        })
      });

      // If converting from guest, update their photos and event participation
      if (guestUsername && eventId) {
        await convertGuestToUser(currentUser.uid, guestUsername, eventId);
      }

      // Mark that account was just created (instead of signing out)
      markAccountCreated();

      // Show success message and navigate directly to Dashboard
      showSuccess(
        guestUsername ? 'Account Converted Successfully! 🎉' : 'Welcome to PixPrint! 🎉',
        guestUsername ? 
          `Your guest account has been converted to a full PixPrint account!\n\n✅ Account: ${firstName} ${lastName}\n📧 Email: ${email}\n🎯 Your event participation has been preserved\n\nYou're now signed in and ready to explore your dashboard!` :
          `Your account has been created successfully!\n\n✅ Account: ${firstName} ${lastName}\n📧 Email: ${email}\n🔐 You're now signed in and ready to start capturing memories!`,
        () => {
          // Navigate directly to Dashboard since user is already signed in
          navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs' }],
          });
        }
      );

    } catch (error) {
      console.error('Sign up error:', error);
      
      // Enhanced error handling with specific messages
      if (error.code === 'auth/email-already-in-use') {
        showAlert({
          title: 'Email Already in Use',
          message: 'This email address is already registered with another account. Please sign in or use a different email address.',
          type: 'warning',
          buttons: [
            { text: 'Try Different Email', style: 'cancel' },
            { 
              text: 'Sign In', 
              style: 'primary', 
              onPress: () => navigation.navigate('SignIn') 
            }
          ]
        });
      } else if (error.code === 'auth/weak-password') {
        showAlert({
          title: 'Password Too Weak',
          message: 'The password you entered doesn\'t meet Firebase security requirements. Please create a stronger password with at least 6 characters.',
          type: 'warning',
          buttons: [
            { text: 'Create Stronger Password', style: 'primary' }
          ]
        });
      } else if (error.code === 'auth/invalid-email') {
        showAlert({
          title: 'Invalid Email Format',
          message: 'The email address format is not valid. Please check your email and make sure it\'s in the correct format (example@domain.com).',
          type: 'error',
          buttons: [
            { text: 'Fix Email', style: 'primary' }
          ]
        });
      } else if (error.code === 'auth/network-request-failed') {
        showError(
          'Network Connection Error',
          'Unable to create your account due to network issues. Please check your internet connection and try again.',
          () => processSignUp(), // Retry function
          () => setIsLoading(false) // Cancel function
        );
      } else if (error.code === 'auth/too-many-requests') {
        showAlert({
          title: 'Too Many Attempts',
          message: 'Too many failed sign-up attempts. Please wait a few minutes before trying again for security reasons.',
          type: 'warning',  
          buttons: [
            { text: 'OK', style: 'primary' }
          ]
        });
      } else {
        showError(
          'Account Creation Failed',
          'There was an unexpected error while creating your account. This could be due to server issues or connectivity problems. Please try again.',
          () => processSignUp(), // Retry function
          () => setIsLoading(false) // Cancel function
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to convert guest data to user account
  const convertGuestToUser = async (userId, guestUsername, eventId) => {
    try {
      console.log(`Converting guest ${guestUsername} to user ${userId} for event ${eventId}`);
      
      // Update joined_tbl entry
      const joinedRef = collection(db, 'joined_tbl');
      const q = query(
        joinedRef,
        where('event_id', '==', eventId),
        where('username', '==', guestUsername)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} joined entries for guest`);
      
      if (!querySnapshot.empty) {
        const joinedDoc = querySnapshot.docs[0];
        const joinedData = joinedDoc.data();
        
        // Only update if it's actually a guest entry (no user_id or user_id is null)
        if (!joinedData.user_id) {
          await updateDoc(joinedDoc.ref, {
            user_id: userId,
            converted_from_guest: true,
            conversion_date: new Date()
          });
          console.log('Successfully updated joined_tbl entry');
        }
      }

      // Update photos_tbl entries
      const photosRef = collection(db, 'photos_tbl');
      const photosQuery = query(
        photosRef,
        where('event_id', '==', eventId),
        where('guest_username', '==', guestUsername),
        where('is_guest', '==', true)
      );
      
      const photosSnapshot = await getDocs(photosQuery);
      console.log(`Found ${photosSnapshot.size} photos for guest conversion`);
      
      if (!photosSnapshot.empty) {
        const batch = writeBatch(db);
        
        photosSnapshot.forEach((photoDoc) => {
          batch.update(photoDoc.ref, {
            user_id: userId,
            is_guest: false,
            converted_from_guest: true,
            conversion_date: new Date()
          });
        });
        
        await batch.commit();
        console.log('Successfully updated photos_tbl entries');
      }
      
    } catch (error) {
      console.error('Error converting guest to user:', error);
      // Don't throw error as account creation was successful
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={['#FFF9F8', '#FFFFFF', '#F8F9FA']}
          style={styles.container}
        >
          {/* Decorative Background Elements */}
          <View style={styles.backgroundElements}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
          </View>

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
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/icon-pix-print.png')} 
                style={styles.logo} 
              />
            </View>
            <Text style={styles.welcomeTitle}>
              {guestUsername ? `Welcome, ${guestUsername}!` : 'Join PixPrint!'}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {guestUsername ? 
                'Create your account to save your events and memories' :
                'Create your account to start capturing memories'
              }
            </Text>
          </Animated.View>

          {/* Guest conversion info banner */}
          {guestUsername && (
            <Animated.View 
              style={[
                styles.guestConversionBanner,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <Ionicons name="arrow-up-circle" size={20} color="#4CAF50" />
              <Text style={styles.guestConversionText}>
                Converting guest account to full PixPrint account
              </Text>
            </Animated.View>
          )}

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
              {/* First Name Input - Now standalone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="person-outline" size={20} color="#AAAAAA" />
                  </View>
                  <TextInput
                    placeholder="Enter first name"
                    placeholderTextColor="#AAAAAA"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                    editable={!isLoading}
                    maxLength={50}
                  />
                </View>
              </View>

              {/* Last Name Input - Now standalone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="person-outline" size={20} color="#AAAAAA" />
                  </View>
                  <TextInput
                    placeholder="Enter last name"
                    placeholderTextColor="#AAAAAA"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                    editable={!isLoading}
                    maxLength={50}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="mail-outline" size={20} color="#AAAAAA" />
                  </View>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#AAAAAA"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    maxLength={100}
                  />
                </View>
              </View>

              {/* Address Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="location-outline" size={20} color="#AAAAAA" />
                  </View>
                  <TextInput
                    placeholder="Enter your address"
                    placeholderTextColor="#AAAAAA"
                    value={address}
                    onChangeText={setAddress}
                    style={styles.input}
                    editable={!isLoading}
                    maxLength={200}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Create a password"
                    placeholderTextColor="#AAAAAA"
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    maxLength={128}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#AAAAAA" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Confirm your password"
                    placeholderTextColor="#AAAAAA"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                    maxLength={128}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#AAAAAA" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#FFB0A8', '#FFB0A8'] : ['#FF8D76', '#FF6F61']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.signUpButtonText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer Section */}
          <Animated.View 
            style={[
              styles.footerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.signInContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('SignIn')}
                disabled={isLoading}
              >
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: height,
    position: 'relative',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    top: -width * 0.3,
    right: -width * 0.3,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 141, 118, 0.06)',
    bottom: -width * 0.2,
    left: -width * 0.2,
  },
  circle3: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 111, 97, 0.05)',
    top: height * 0.5,
    right: -width * 0.1,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    marginBottom: 30,
    position: 'relative',
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
    width: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333333',
    textAlignVertical: 'center',
  },
  eyeIcon: {
    paddingVertical: 14,
    padding: 4,
  },
  signUpButton: {
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  footerSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#666666',
  },
  signInText: {
    fontSize: 15,
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  guestConversionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 24,
    marginBottom: 20,
  },
  guestConversionText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});

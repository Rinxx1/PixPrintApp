import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAlert } from '../context/AlertContext';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get alert methods from context
  const { showAlert, showSuccess, showError } = useAlert();
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
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
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email exists in user_tbl collection
  const checkIfEmailExistsInUserTable = async (email) => {
    try {
      const userRef = collection(db, 'user_tbl');
      const q = query(userRef, where('user_email', '==', email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email in user_tbl:', error);
      return false;
    }
  };

  const handleResetPassword = async () => {
    if (isSubmitting) return;

    // Basic validation
    if (!email.trim()) {
      showAlert({
        title: 'Email Required',
        message: 'Please enter your email address to receive password reset instructions.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return;
    }

    if (!isValidEmail(email.trim())) {
      showAlert({
        title: 'Invalid Email',
        message: 'Please enter a valid email address in the correct format (example@domain.com).',
        type: 'error',
        buttons: [
          { text: 'Fix Email', style: 'primary' }
        ]
      });
      return;
    }    setIsSubmitting(true);

    try {
      // First check if email exists in user_tbl collection
      const emailExistsInUserTable = await checkIfEmailExistsInUserTable(email.trim());
      
      if (!emailExistsInUserTable) {
        showAlert({
          title: 'Account Not Found',
          message: 'No PixPrint account found with this email address. Only registered users with complete profiles can reset their password.',
          type: 'warning',
          buttons: [
            { text: 'Try Different Email', style: 'cancel' },
            { 
              text: 'Create Account', 
              style: 'primary', 
              onPress: () => navigation.navigate('SignUp')
            }
          ]
        });
        setIsSubmitting(false);
        return;
      }

      // If email exists in user_tbl, proceed with Firebase password reset
      await sendPasswordResetEmail(auth, email.trim());
      
      showSuccess(
        'Reset Link Sent! 📧',
        `We've sent password reset instructions to ${email.trim()}.\n\nPlease check your email (including spam folder) and follow the link to reset your password.\n\n💡 The link will expire in 1 hour for security.`,
        () => {
          // Navigate back to sign in screen
          navigation.navigate('SignIn');
        }
      );
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      let title = 'Reset Failed';
      let errorMessage = 'Unable to send password reset email. Please try again.';
        switch (error.code) {
        case 'auth/user-not-found':
          title = 'Account Not Found';
          errorMessage = 'This email is not associated with a Firebase account, even though it exists in our user database. Please contact support for assistance.';
          showAlert({
            title,
            message: errorMessage,
            type: 'warning',
            buttons: [
              { text: 'Contact Support', style: 'primary', onPress: () => handleContactSupport() },
              { text: 'Try Different Email', style: 'cancel' }
            ]
          });
          return;
          
        case 'auth/invalid-email':
          title = 'Invalid Email';
          errorMessage = 'Please enter a valid email address.';
          break;
          
        case 'auth/network-request-failed':
          title = 'Connection Error';
          errorMessage = 'Please check your internet connection and try again.';
          showError(
            title,
            errorMessage,
            () => handleResetPassword(), // Retry function
            () => {} // Cancel function
          );
          return;
          
        case 'auth/too-many-requests':
          title = 'Too Many Attempts';
          errorMessage = 'Too many password reset attempts. Please wait a few minutes before trying again.';
          break;
          
        default:
          errorMessage = 'An unexpected error occurred. Please try again or contact support.';
      }
      
      showAlert({
        title,
        message: errorMessage,
        type: 'error',
        buttons: [
          { text: 'Try Again', style: 'primary' }
        ]
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSupport = () => {
    showAlert({
      title: 'Contact Support',
      message: 'You can reach our support team at support@pixprint.com or through the Help & Support section in the app.',
      type: 'info',
      buttons: [
        { text: 'OK', style: 'primary' }
      ]
    });
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
              <LinearGradient
                colors={['#FF8D76', '#FF6F61']}
                style={styles.logoGradient}
              >
                <Ionicons name="mail" size={40} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.welcomeTitle}>Forgot Password?</Text>
            <Text style={styles.welcomeSubtitle}>
              No worries! Enter your email and we'll send you reset instructions
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
              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={[
                  styles.inputContainer,
                  !email.trim() && isSubmitting && styles.inputError
                ]}>
                  <Ionicons name="mail-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your email address"
                    placeholderTextColor="#AAAAAA"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isSubmitting}
                    autoFocus={true}
                  />
                </View>
              </View>

              {/* Info Box */}              
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#4A90E2" />
                <Text style={styles.infoText}>
                  We'll verify your account and send a secure reset link to your email. Only registered PixPrint users can reset their password.
                </Text>
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity
                style={[styles.resetButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={isSubmitting ? ['#FFB0A8', '#FFB0A8'] : ['#FF8D76', '#FF6F61']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.loadingText}>Sending...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.resetButtonText}>Send Reset Link</Text>
                      <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Help Section */}
              <View style={styles.helpSection}>
                <TouchableOpacity 
                  style={styles.helpButton}
                  onPress={handleContactSupport}
                  disabled={isSubmitting}
                >
                  <Ionicons name="help-circle-outline" size={16} color="#666666" />
                  <Text style={styles.helpText}>Need Help?</Text>
                </TouchableOpacity>
              </View>
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
            <View style={styles.backToSignInContainer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('SignIn')}
                disabled={isSubmitting}
              >
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
            >
              <Ionicons name="chevron-back" size={20} color="#777" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
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
    top: height * 0.6,
    right: -width * 0.1,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
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
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333333',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 8,
    lineHeight: 20,
  },
  resetButton: {
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    shadowOpacity: 0.1,
  },
  buttonGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  helpSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  footerSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backToSignInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666666',
  },
  signInText: {
    fontSize: 16,
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backText: {
    fontSize: 16,
    color: '#777777',
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#FF5252',
    borderWidth: 2,
  },
});
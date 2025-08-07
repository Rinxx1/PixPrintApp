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
import Logo from '../assets/icon-pix-print.png';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { useAlert } from '../context/AlertContext';

const { width, height } = Dimensions.get('window');

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nav = useNavigation();
  
  // Get alert methods from context
  const { showAlert, showError, showSuccess } = useAlert();
  
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

  const handleSignIn = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    if (!email.trim() || !password.trim()) {
      showAlert({
        title: 'Missing Information',
        message: 'Please fill in all fields to continue.',
        type: 'warning',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert({
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        type: 'error',
        buttons: [
          { text: 'OK', style: 'primary' }
        ]
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Navigate immediately after successful authentication
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      });
      
      // Show success message without navigation callback
      showSuccess(
        'Welcome Back!',
        'Successfully signed in to your account.'
      );
      
    } catch (error) {
      // Remove the console.error to prevent showing Firebase errors
      // console.error('Sign in error:', error);
      
      let title = 'Sign In Failed';
      let errorMessage = 'An error occurred during sign in';
      
      switch (error.code) {
        case 'auth/user-not-found':
          title = 'Account Not Found';
          errorMessage = 'No account found with this email address. Would you like to create a new account?';
          showAlert({
            title,
            message: errorMessage,
            type: 'warning',
            buttons: [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Sign Up', 
                style: 'primary', 
                onPress: () => navigation.navigate('SignUp')
              }
            ]
          });
          return;
          
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          title = 'Incorrect Password';
          errorMessage = 'The password you entered is incorrect. Please try again or reset your password.';
          showAlert({
            title,
            message: errorMessage,
            type: 'error',
            buttons: [
              { text: 'Try Again', style: 'primary' }
            ]
          });
          return;
          
        case 'auth/invalid-email':
          title = 'Invalid Email';
          errorMessage = 'Please enter a valid email address.';
          break;
          
        case 'auth/user-disabled':
          title = 'Account Disabled';
          errorMessage = 'This account has been disabled. Please contact support for assistance.';
          showAlert({
            title,
            message: errorMessage,
            type: 'error',
            buttons: [
              { text: 'OK', style: 'primary' },
              { text: 'Contact Support', style: 'default', onPress: () => handleContactSupport() }
            ]
          });
          return;
          
        case 'auth/too-many-requests':
          title = 'Too Many Attempts';
          errorMessage = 'Too many failed sign-in attempts. Please wait a few minutes before trying again.';
          break;
          
        case 'auth/network-request-failed':
          title = 'Connection Error';
          errorMessage = 'Please check your internet connection and try again.';
          showError(
            title,
            errorMessage,
            () => handleSignIn(), // Retry function
            () => {} // Cancel function
          );
          return;
          
        default:
          errorMessage = 'Please check your email and password and try again.';
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
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
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
              <Image source={Logo} style={styles.logo} />
            </View>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to continue capturing memories</Text>
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
                    placeholder="Enter your email"
                    placeholderTextColor="#AAAAAA"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={[
                  styles.inputContainer,
                  !password.trim() && isSubmitting && styles.inputError
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#AAAAAA" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Enter your password"
                    placeholderTextColor="#AAAAAA"
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    secureTextEntry={secureText}
                    editable={!isSubmitting}
                  />
                  <TouchableOpacity 
                    onPress={() => setSecureText(!secureText)}
                    style={styles.eyeIcon}
                    disabled={isSubmitting}
                  >
                    <Ionicons 
                      name={secureText ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#AAAAAA" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={handleForgotPassword}
                disabled={isSubmitting}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[styles.signInButton, isSubmitting && styles.buttonDisabled]}
                onPress={handleSignIn}
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
                      <Text style={styles.loadingText}>Signing In...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.signInButtonText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Alternative Sign In Options */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue as</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.guestButton}
                onPress={() => navigation.navigate('ContinueAsGuest')}
                disabled={isSubmitting}
              >
                <Ionicons name="person-outline" size={20} color="#FF6F61" />
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
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
            <View style={styles.signUpContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('SignUp')}
                disabled={isSubmitting}
              >
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('Main')}
              disabled={isSubmitting}
            >
              <Ionicons name="chevron-back" size={20} color="#777" />
              <Text style={styles.backText}>Back to Home</Text>
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
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
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
  eyeIcon: {
    padding: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '500',
  },
  signInButton: {
    borderRadius: 12,
    marginBottom: 24,
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
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  dividerText: {
    fontSize: 14,
    color: '#888888',
    marginHorizontal: 16,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.2)',
  },
  guestButtonText: {
    fontSize: 16,
    color: '#FF6F61',
    fontWeight: '600',
    marginLeft: 8,
  },
  footerSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666666',
  },
  signUpText: {
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
});

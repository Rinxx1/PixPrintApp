import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar, 
  Dimensions, 
  ImageBackground,
  Animated
} from 'react-native';
import { auth } from '../firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function MainScreen({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // If the user is logged in, navigate directly to the "Tabs" screen
        setIsLoggedIn(true);
        navigation.replace('Tabs');  // Automatically go to Tabs if logged in
      } else {
        // If no user is logged in, stay on the MainScreen
        setIsLoggedIn(false);
      }
    });

    // Start animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [navigation, fadeAnim, slideAnim]);

  if (isLoggedIn) return null; // Avoid showing MainScreen while redirecting

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Background with subtle pattern */}
      <ImageBackground 
        source={require('../assets/icon-pix-print.png')} 
        style={styles.backgroundPattern}
        imageStyle={styles.backgroundImage}
      >
        {/* Overlay gradient */}
        <LinearGradient
          colors={['rgba(255, 111, 97, 0.1)', 'rgba(255, 141, 118, 0.2)']}
          style={styles.gradient}
        />
      </ImageBackground>

      {/* Main content */}
      <View style={styles.contentContainer}>
        {/* Logo and branding */}
        <Animated.View 
          style={[
            styles.logoContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.logoWrapper}>
            <Image source={require('../assets/icon-pix-print.png')} style={styles.logo} />
          </View>
          <Text style={styles.title}>PixPrint</Text>
          <Text style={styles.subtitle}>Capture. Print. Celebrate</Text>
        </Animated.View>

        {/* Feature highlights */}
        <Animated.View 
          style={[
            styles.featuresContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="camera-outline" size={22} color="#FF6F61" />
            </View>
            <Text style={styles.featureText}>Create photo events</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="people-outline" size={22} color="#FF6F61" />
            </View>
            <Text style={styles.featureText}>Share with everyone</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="print-outline" size={22} color="#FF6F61" />
            </View>
            <Text style={styles.featureText}>Print your memories</Text>
          </View>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SignIn')}
          >
            <LinearGradient
              colors={['#FF8D76', '#FF6F61']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Sign In</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ContinueAsGuest')}
          >
            <Text style={styles.secondaryButtonText}>Continue as guest</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.footerText}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.linkText}>Create one now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Decorative elements */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundPattern: {
    position: 'absolute',
    width: width * 2,
    height: height * 2,
    top: -height * 0.5,
    left: -width * 0.5,
    opacity: 0.05,
  },
  backgroundImage: {
    resizeMode: 'repeat',
    opacity: 0.05,
    transform: [{ rotate: '45deg' }]
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  featuresContainer: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 16,
    color: '#444444',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  button: {
    width: '100%',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    overflow: 'hidden', // Required for iOS gradient to work with rounded corners
  },
  buttonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 8,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
  },
  secondaryButtonText: {
    color: '#FF6F61',
    fontWeight: '600',
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 15,
    color: '#666666',
    marginRight: 6,
  },
  linkText: {
    color: '#FF6F61',
    fontWeight: 'bold',
    fontSize: 15,
  },
  // Decorative elements
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 111, 97, 0.05)',
    bottom: -150,
    right: -150,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    top: -100,
    left: -100,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 141, 118, 0.06)',
    top: height * 0.4,
    left: -75,
  },
});

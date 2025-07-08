import React, { useEffect, useState, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  
  // Enhanced animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatingAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setIsLoggedIn(true);
        navigation.replace('Tabs');
      } else {
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    });

    // Enhanced entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true
      })
    ]).start();

    // Continuous floating animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(floatingAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();

    // Subtle rotation animation for decorative elements
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true
      })
    ).start();

    // Pulse animation for call-to-action
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true
        })
      ])
    ).start();

    return () => unsubscribe();
  }, [navigation]);

  if (isLoading || isLoggedIn) return null;

  const handleSignUpNavigation = () => {
    console.log('Navigating to SignUp...');
    navigation.navigate('SignUp');
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Enhanced Background */}
      <View style={styles.backgroundContainer}>
        {/* Animated background pattern */}
        <Animated.View 
          style={[
            styles.backgroundPattern,
            {
              transform: [{
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }
          ]}
        >
          <Image 
            source={require('../assets/icon-pix-print.png')} 
            style={styles.patternImage}
          />
        </Animated.View>

        {/* Enhanced gradient overlay */}
        <LinearGradient
          colors={[
            'rgba(255, 111, 97, 0.02)',
            'rgba(255, 141, 118, 0.05)',
            'rgba(255, 111, 97, 0.08)',
            'rgba(255, 180, 162, 0.03)'
          ]}
          style={styles.gradient}
          locations={[0, 0.3, 0.7, 1]}
        />

        {/* Floating geometric shapes */}
        <Animated.View 
          style={[
            styles.floatingShape1,
            {
              transform: [
                { translateY: floatingAnim },
                { rotate: '15deg' }
              ]
            }
          ]}
        />
        <Animated.View 
          style={[
            styles.floatingShape2,
            {
              transform: [
                { 
                  translateY: floatingAnim.interpolate({
                    inputRange: [-10, 0],
                    outputRange: [5, -5]
                  })
                },
                { rotate: '-20deg' }
              ]
            }
          ]}
        />
      </View>

      {/* Main content container - No ScrollView */}
      <View style={styles.contentContainer}>
        {/* Compact Hero Section */}
        <Animated.View 
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
                { translateY: floatingAnim }
              ]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoGlow} />
            <View style={styles.logoWrapper}>
              <Image source={require('../assets/icon-pix-print.png')} style={styles.logo} />
            </View>
          </View>
          
          <Text style={styles.brandTitle}>PixPrint</Text>
          <Text style={styles.brandTagline}>Capture. Create. Celebrate.</Text>
          <Text style={styles.brandDescription}>
            Transform your special moments into lasting memories
          </Text>
        </Animated.View>

        {/* Compact Features - Horizontal Cards */}
        <Animated.View 
          style={[
            styles.featuresSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <Ionicons name="camera" size={20} color="#FF6F61" />
              <Text style={styles.featureText}>Smart Events</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={20} color="#4CAF50" />
              <Text style={styles.featureText}>Live Sharing</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="print" size={20} color="#9C27B0" />
              <Text style={styles.featureText}>Premium Prints</Text>
            </View>
          </View>
        </Animated.View>

        {/* Compact CTA Section */}
        <Animated.View 
          style={[
            styles.ctaSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Primary CTA Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('SignIn')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF8D76', '#FF6F61', '#FF5722']}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                  <View style={styles.buttonIconContainer}>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Guest Access Button */}
          <TouchableOpacity
            style={styles.guestButton}
            onPress={() => navigation.navigate('ContinueAsGuest')}
            activeOpacity={0.7}
          >
            <View style={styles.guestButtonContent}>
              <Ionicons name="person-outline" size={18} color="#FF6F61" />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </View>
          </TouchableOpacity>

          {/* Sign Up Prompt */}
          <View style={styles.signupPrompt}>
            <Text style={styles.signupText}>New to PixPrint?</Text>
            <TouchableOpacity 
              onPress={handleSignUpNavigation}
              style={styles.signupLink}
              activeOpacity={0.7}
            >
              <Text style={styles.signupLinkText}>Create free account</Text>
              <Ionicons name="chevron-forward" size={14} color="#FF6F61" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Enhanced decorative elements */}
      <View style={styles.decorativeElements}>
        <Animated.View 
          style={[
            styles.circle1,
            {
              transform: [
                { 
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg']
                  })
                }
              ]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.circle2,
            {
              transform: [
                { 
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['360deg', '315deg']
                  })
                }
              ]
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backgroundPattern: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 200,
    height: 200,
    opacity: 0.03,
  },
  patternImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  floatingShape1: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    top: height * 0.15,
    right: 30,
  },
  floatingShape2: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.06)',
    top: height * 0.6,
    left: 20,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    justifyContent: 'space-evenly', // Changed to distribute content evenly
  },
  heroSection: {
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20, // Reduced
  },
  logoGlow: {
    position: 'absolute',
    width: 100, // Reduced
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    top: -5,
    left: -5,
  },
  logoWrapper: {
    width: 90, // Reduced
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    width: 55, // Reduced
    height: 55,
    resizeMode: 'contain',
  },
  brandTitle: {
    fontSize: 36, // Reduced
    fontWeight: '800',
    color: '#2D2A32',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 16, // Reduced
    color: '#FF6F61',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  brandDescription: {
    fontSize: 14, // Reduced
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  featuresSection: {
    alignItems: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  ctaSection: {
    alignItems: 'center',
  },
  primaryButton: {
    borderRadius: 25,
    marginBottom: 16,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
    width: width * 0.8, // Make button wider - 80% of screen width
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%', // Take full width of parent container
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 3,
  },
  guestButton: {
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.15)',
    width: width * 0.8, // Make button wider - 80% of screen width
  },
  guestButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Remove all stats-related styles
  // socialProofSection: { ... } - REMOVED
  // statsContainer: { ... } - REMOVED
  // statItem: { ... } - REMOVED
  // statNumber: { ... } - REMOVED
  // statLabel: { ... } - REMOVED
  // statDivider: { ... } - REMOVED
  
  signupPrompt: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  signupLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  signupLinkText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '600',
    marginRight: 3,
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  circle1: {
    position: 'absolute',
    width: 150, // Reduced
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 111, 97, 0.05)',
    top: -30,
    right: -30,
  },
  circle2: {
    position: 'absolute',
    width: 120, // Reduced
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(76, 175, 80, 0.04)',
    bottom: 80,
    left: -40,
  },
});

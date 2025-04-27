import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { auth } from '../firebase'; // Import Firebase auth

export default function MainScreen({ navigation }) {

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // If the user is logged in, navigate directly to the "Tabs" screen
        navigation.replace('Tabs');
      }
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/icon-pix-print.png')} style={styles.logo} />
      <Text style={styles.title}>PixPrint</Text>
      <Text style={styles.subtitle}>Capture. Print. Celebrate</Text>

      <View style={styles.spacer} />

      {/* Sign In Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('SignIn')}
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Continue as Guest Button */}
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('ContinueAsGuest')}
      >
        <Text style={styles.buttonText}>Continue as guest</Text>
      </TouchableOpacity>

      {/* Sign Up Link */}
      <Text style={styles.footerText}>
        You don’t have an account?{' '}
        <Text
          style={styles.linkText}
          onPress={() => navigation.navigate('SignUp')}
        >
          Sign up
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: -5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#807E84',
    marginBottom: 48,
  },
  spacer: {
    height: 32,
  },
  button: {
    backgroundColor: '#FF6F61',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 36,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#2D2A32',
  },
  linkText: {
    color: '#FF6F61',
    fontWeight: '500',
  },
});

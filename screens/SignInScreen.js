import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../assets/icon-pix-print.png';
import { auth } from '../firebase'; // Import Firebase auth
import { signInWithEmailAndPassword } from 'firebase/auth'; // Firebase authentication method
import { useNavigation } from '@react-navigation/native'; // For navigation

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  
  const nav = useNavigation(); // To navigate to tabs after successful login

  // Check if the user is already logged in when the screen loads
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // If the user is logged in, navigate to the Tabs screen
        nav.navigate('Tabs');
      }
    });
    
    // Clean up the subscription when the component is unmounted
    return unsubscribe;
  }, [nav]);

  // Handle sign-in logic
  const handleSignIn = async () => {
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('Success', 'You have successfully logged in!');
        nav.navigate('Tabs'); // Navigate to the main app screen
      } catch (error) {
        Alert.alert('Sign In Error', 'Invalid email or password. Please try again.');
      }
    } else {
      Alert.alert('Input Error', 'Please enter both email and password.');
    }
  };

  return (
    <View style={styles.container}>
      <Image source={Logo} style={styles.logoImage} />
      <Text style={styles.title}>PixPrint</Text>
      <Text style={styles.subtitle}>Capture. Print. Celebrate</Text>

      {/* Email input */}
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Password with eye toggle */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Password"
          secureTextEntry={secureText}
          style={styles.inputInner}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Ionicons
            name={secureText ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footerText}>
        Don’t have an account?{' '}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: -5,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D2A32',
  },
  subtitle: {
    fontSize: 14,
    color: '#807E84',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    fontSize: 16,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF6F61',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 60,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    marginTop: 16,
    fontSize: 14,
    color: '#807E84',
  },
  linkText: {
    color: '#FF6F61',
    fontWeight: '500',
  },
});

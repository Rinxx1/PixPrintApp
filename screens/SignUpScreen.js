import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase'; // Importing Firebase services
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import HeaderBar from '../components/HeaderBar';

export default function SignUpScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');

  // Check if the email is already registered
  const checkIfEmailExists = async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        return true; // Email already exists
      }
      return false; // Email is not registered
    } catch (error) {
      console.error(error);
      return false; // If error occurs, assume the email is not registered
    }
  };

  // Handle sign-up logic
  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    // Check if the email already exists
    const emailExists = await checkIfEmailExists(email);
    if (emailExists) {
      Alert.alert('Sign Up Error', 'An account with this email address already exists. Please try logging in or use a different email.');
      return;
    }

    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = response.user;

      // Add user profile to Firestore (Storing in 'user_tbl')
      await setDoc(doc(db, 'user_tbl', currentUser.uid), {
        user_email: email,
        user_firstname: firstName,
        user_lastname: lastName,
        user_password: password,  // Storing password, ensure that this is encrypted/hashed if needed
        user_address: address,
        user_id: currentUser.uid,
      });

      Alert.alert('Success', 'Account created successfully!');
      navigation.navigate('SignIn');
    } catch (error) {
      Alert.alert('Sign Up Error', 'An account with this email address already exists. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <HeaderBar navigation={navigation} showBack={false} />

      {/* Title */}
      <Text style={styles.title}>Sign Up</Text>

      {/* First Name */}
      <TextInput
        placeholder="First Name"
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />

      {/* Last Name */}
      <TextInput
        placeholder="Last Name"
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
      />

      {/* Email */}
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      {/* Address */}
      <TextInput
        placeholder="Address"
        style={styles.input}
        value={address}
        onChangeText={setAddress}
      />

      {/* Password Field */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          style={styles.inputInner}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password Field */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Confirm Password"
          secureTextEntry={!showConfirm}
          style={styles.inputInner}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
          <Ionicons
            name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footerText}>
        Already have an account?{' '}
        <Text
          style={styles.linkText}
          onPress={() => navigation.navigate('SignIn')}
        >
          Log in
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#2D2A32',
  },
  input: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    fontSize: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  inputInner: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#FF6F61',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
    color: '#2D2A32',
  },
  linkText: {
    color: '#FF6F61',
    fontWeight: '500',
  },
});

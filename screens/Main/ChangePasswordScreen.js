import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../../components/HeaderBar';
import { auth, db } from '../../firebase'; // Firebase auth import
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth'; // For password update
import { doc, updateDoc } from 'firebase/firestore'; // For Firestore update

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Error state

  const handleChangePassword = async () => {
    // Clear previous error message
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match!');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      try {
        // Reauthenticate the user with the current password
        await reauthenticateWithCredential(user, credential);

        // Proceed with updating the password
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Password updated successfully!');
        
        // Update password in Firestore as well
        const userRef = doc(db, 'user_tbl', user.uid);
        await updateDoc(userRef, {
          user_password: newPassword, // Update user_password field in Firestore
        });

        setErrorMessage('');  // Clear error message
        navigation.goBack();  // Go back to the previous screen
      } catch (error) {
        console.log(error);
        if (error.code === 'auth/wrong-password') {
          setErrorMessage('Incorrect current password! Please try again.');
        } else if (error.code === 'auth/weak-password') {
          setErrorMessage('The new password is too weak. Please choose a stronger password.');
        } else {
          setErrorMessage('Error updating password. Please try again later.');
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      <Text style={styles.title}>Change Password</Text>

      {/* Current Password */}
      <Text style={styles.label}>Current Password</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          secureTextEntry={!showPassword}
          placeholder="Enter current password"
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* New Password */}
      <Text style={styles.label}>New Password</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          secureTextEntry={!showPassword}
          placeholder="Enter new password"
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
        />
      </View>

      {/* Confirm Password */}
      <Text style={styles.label}>Confirm New Password</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          secureTextEntry={!showPassword}
          placeholder="Confirm new password"
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      {/* Display error message */}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleChangePassword}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 32,
    paddingTop: 104,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#2D2A32',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 12,
  },
});

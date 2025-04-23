import React, { useState } from 'react';
import HeaderBar from '../components/HeaderBar';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen({ navigation }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <HeaderBar navigation={navigation} showBack={false} />

      {/* Title */}
      <Text style={styles.title}>Sign Up</Text>

      {/* Input Fields */}
      <TextInput placeholder="Full name" style={styles.input} />
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Address" style={styles.input} />

      {/* Password Field */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          style={styles.inputInner}
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
      <TouchableOpacity style={styles.button}>
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

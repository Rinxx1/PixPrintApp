import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HeaderBar from '../components/HeaderBar';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

      <TouchableOpacity style={styles.button}>
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
});

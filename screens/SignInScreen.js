import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../assets/icon-pix-print.png';

export default function SignInScreen({ navigation }) {
  const [secureText, setSecureText] = useState(true);

  return (
    <View style={styles.container}>
      <Image source={Logo} style={styles.logoImage} />
      <Text style={styles.title}>PixPrint</Text>
      <Text style={styles.subtitle}>Capture. Print. Celebrate</Text>

      <TextInput placeholder="Email" style={styles.input} />

      {/* Password with eye toggle */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Password"
          secureTextEntry={secureText}
          style={styles.inputInner}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Ionicons
            name={secureText ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Tabs')}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <Text style={styles.footerText} onPress={() => navigation.navigate('SignUp')}>
        Don’t have an account?{' '}
        <Text style={styles.linkText}>Sign up</Text>
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

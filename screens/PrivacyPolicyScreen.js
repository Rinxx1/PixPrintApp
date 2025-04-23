import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import HeaderBar from '../components/HeaderBar';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />

      <Text style={styles.title}>Privacy Policy</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-shield.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Information Collection</Text>
          </View>
          <Text style={styles.text}>
            We collect basic personal details like name, email, and event activity to personalize your PixPrint experience.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-settings.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Use of Data</Text>
          </View>
          <Text style={styles.text}>
            Your data is used to operate and improve our services. We never sell or share your personal information with third parties.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-alert.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          <Text style={styles.text}>
            We implement standard security measures to protect your information, including encryption and secure storage.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-check.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Your Consent</Text>
          </View>
          <Text style={styles.text}>
            By using PixPrint, you consent to the terms outlined in this Privacy Policy. You can update your preferences at any time.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-camera.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Photos and Media</Text>
          </View>
          <Text style={styles.text}>
            Photos taken within the app are stored securely and are only accessible to event participants and planners.
          </Text>
        </View>

        <Text style={styles.footer}>
          For more information or data requests, contact us at privacy@pixprint.com.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingTop: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D2A32',
  },
  text: {
    fontSize: 14,
    color: '#4B4B4B',
    lineHeight: 22,
  },
  footer: {
    fontSize: 13,
    textAlign: 'center',
    color: '#807E84',
    marginTop: 16,
    marginBottom: 24,
  },
});

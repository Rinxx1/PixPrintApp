import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import HeaderBar from '../components/HeaderBar';

export default function TermsAndConditionsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />

      <Text style={styles.title}>Terms & Conditions</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-check.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
          </View>
          <Text style={styles.text}>
            By accessing or using PixPrint, you agree to be bound by these Terms and all applicable laws and regulations.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-camera.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Use of Service</Text>
          </View>
          <Text style={styles.text}>
            You may use PixPrint for personal or event-based photography services only. Unauthorized use may result in suspension.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-shield.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Intellectual Property</Text>
          </View>
          <Text style={styles.text}>
            All designs, trademarks, and assets belong to PixPrint. Reproduction or redistribution is prohibited without prior written consent.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-alert.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Limitation of Liability</Text>
          </View>
          <Text style={styles.text}>
            PixPrint shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the app.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Image source={require('../assets/icon-settings.png')} style={styles.icon} />
            <Text style={styles.sectionTitle}>Modifications</Text>
          </View>
          <Text style={styles.text}>
            We reserve the right to update or modify these terms at any time. Continued use of the app constitutes acceptance of any changes.
          </Text>
        </View>

        <Text style={styles.footer}>
          For any questions or concerns, please contact our support team at support@pixprint.com.
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

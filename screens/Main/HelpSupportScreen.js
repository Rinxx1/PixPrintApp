import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import HeaderBar from '../../components/HeaderBar';

export default function HelpSupportScreen({ navigation }) {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@pixprint.com');
  };

  const handleCallPress = () => {
    Linking.openURL('tel:+1234567890');
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      <Text style={styles.title}>Help & Support</Text>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 💡 FAQ Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.q}>How do I join an event?</Text>
            <Text style={styles.a}>
              Go to the Join Event screen and enter the event code provided by the planner.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.q}>Where are my photos saved?</Text>
            <Text style={styles.a}>
              All photos are securely saved under the event and can be accessed via the Gallery.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.q}>How can I contact support?</Text>
            <Text style={styles.a}>
              Use the contact options below or email us at support@pixprint.com.
            </Text>
          </View>
        </View>

        {/* 📬 Contact Support */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Us</Text>

          <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
            <Image
              source={require('../../assets/icon-email.png')}
              style={styles.icon}
            />
            <Text style={styles.label}>Email Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactItem} onPress={handleCallPress}>
            <Image
              source={require('../../assets/icon-phone.png')}
              style={styles.icon}
            />
            <Text style={styles.label}>Call Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Our team is available from 9 AM to 6 PM, Monday to Friday.
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
  content: {
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 10,
  },
  faqItem: {
    marginBottom: 12,
  },
  q: {
    fontWeight: '600',
    fontSize: 14,
    color: '#2D2A32',
    marginBottom: 2,
  },
  a: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 12,
    resizeMode: 'contain',
  },
  label: {
    fontSize: 16,
    color: '#2D2A32',
  },
  footer: {
    fontSize: 13,
    textAlign: 'center',
    color: '#807E84',
    marginTop: 12,
  },
});

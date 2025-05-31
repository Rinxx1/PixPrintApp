import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';

export default function TermsAndConditionsScreen({ navigation }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [scrollY] = useState(new Animated.Value(0));

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const termsData = [
    {
      id: 'acceptance',
      icon: 'checkmark-circle',
      title: 'Acceptance of Terms',
      content: `By downloading, accessing, or using the PixPrint mobile application, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you and PixPrint.

If you do not agree with any part of these terms, please discontinue use of our service immediately.`,
      color: '#4CAF50',
    },
    {
      id: 'service',
      icon: 'camera',
      title: 'Use of Service',
      content: `PixPrint is designed for personal and event-based photography services. You may use our platform to:

• Create and manage photo events
• Capture and share memories with friends and family
• Print and customize your favorite photos
• Join events created by others

Prohibited uses include commercial redistribution, spam, harassment, or any illegal activities. Violation may result in account suspension or termination.`,
      color: '#FF6F61',
    },
    {
      id: 'privacy',
      icon: 'shield-checkmark',
      title: 'Privacy & Data Protection',
      content: `We take your privacy seriously. Your personal information and photos are protected by industry-standard encryption. We collect only necessary data to provide our services:

• Account information (name, email)
• Photos you choose to upload
• Event participation data
• App usage analytics (anonymized)

We never sell your personal data to third parties. For detailed information, please review our Privacy Policy.`,
      color: '#2196F3',
    },
    {
      id: 'intellectual',
      icon: 'library',
      title: 'Intellectual Property',
      content: `All PixPrint branding, designs, logos, and proprietary features are owned by PixPrint Inc. You retain ownership of your uploaded photos, but grant us license to:

• Display your photos within the app
• Process and optimize images for printing
• Provide sharing features within events

You may not reproduce, distribute, or create derivative works from our proprietary content without written permission.`,
      color: '#9C27B0',
    },
    {
      id: 'liability',
      icon: 'warning',
      title: 'Limitation of Liability',
      content: `PixPrint provides services "as is" without warranty. While we strive for reliability, we cannot guarantee:

• Uninterrupted service availability
• Error-free operation
• Complete data backup protection

Our liability is limited to the amount you've paid for our services in the past 12 months. We are not liable for indirect, consequential, or punitive damages.`,
      color: '#FF9800',
    },
    {
      id: 'modifications',
      icon: 'settings',
      title: 'Terms Modifications',
      content: `We reserve the right to update these terms as our service evolves. Changes will be communicated through:

• In-app notifications
• Email notifications to registered users
• Updates posted on our website

Continued use of PixPrint after changes constitutes acceptance of new terms. For significant changes, we may require explicit consent.`,
      color: '#607D8B',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderBar navigation={navigation} showBack={true} />

      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#FF8D76', '#FF6F61']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Ionicons name="document-text" size={28} color="#FFFFFF" />
            <Text style={styles.title}>Terms & Conditions</Text>
            <Text style={styles.subtitle}>Last updated: December 2024</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Welcome to PixPrint</Text>
          <Text style={styles.introText}>
            These terms govern your use of our photo sharing and printing platform. 
            We've made them as clear and straightforward as possible.
          </Text>
        </View>

        {/* Terms Sections */}
        {termsData.map((section, index) => (
          <View key={section.id} style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.iconContainer, { backgroundColor: section.color + '20' }]}>
                  <Ionicons name={section.icon} size={20} color={section.color} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionNumber}>Section {index + 1}</Text>
                </View>
              </View>
              <Ionicons 
                name={expandedSections[section.id] ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666666" 
              />
            </TouchableOpacity>

            {expandedSections[section.id] && (
              <View style={styles.cardContent}>
                <View style={styles.divider} />
                <Text style={styles.contentText}>{section.content}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Quick Summary */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#F8F9FA', '#FFFFFF']}
            style={styles.summaryGradient}
          >
            <Ionicons name="bulb" size={24} color="#FF6F61" style={styles.summaryIcon} />
            <Text style={styles.summaryTitle}>Quick Summary</Text>
            <Text style={styles.summaryText}>
              • Use PixPrint responsibly for personal and event photography{'\n'}
              • Your photos remain yours, but we need permission to process them{'\n'}
              • We protect your privacy and don't sell your data{'\n'}
              • Terms may change, but we'll always notify you
            </Text>
          </LinearGradient>
        </View>

        {/* Contact Section */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Ionicons name="mail" size={20} color="#FF6F61" />
            <Text style={styles.contactTitle}>Questions or Concerns?</Text>
          </View>
          <Text style={styles.contactText}>
            Our legal team is here to help. Contact us at{' '}
            <Text style={styles.emailLink}>legal@pixprint.com</Text> or through our 
            in-app support system.
          </Text>
          
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    marginTop: 100,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  headerGradient: {
    padding: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  sectionNumber: {
    fontSize: 12,
    color: '#999999',
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 22,
  },
  summaryCard: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  summaryGradient: {
    padding: 20,
    alignItems: 'center',
  },
  summaryIcon: {
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    textAlign: 'left',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 16,
  },
  emailLink: {
    color: '#FF6F61',
    fontWeight: '500',
  },
  supportButton: {
    backgroundColor: '#FF6F61',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomSpacing: {
    height: 20,
  },
});

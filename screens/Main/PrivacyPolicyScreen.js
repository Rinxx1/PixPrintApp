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

export default function PrivacyPolicyScreen({ navigation }) {
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

  const privacyData = [
    {
      id: 'collection',
      icon: 'shield-checkmark',
      title: 'Information We Collect',
      summary: 'Basic personal details and app usage data',
      content: `We collect only the information necessary to provide you with the best PixPrint experience:

Personal Information:
• Name and email address
• Profile photo (optional)
• Account preferences and settings

Usage Data:
• Photos you upload to events
• Event participation and creation
• App feature usage (anonymized)
• Device information for optimization

Photo Data:
• Images captured through our app
• Event-specific metadata
• Sharing preferences per photo

We never collect sensitive information like passwords in plain text, financial data, or location without your explicit consent.`,
      color: '#4CAF50',
    },
    {
      id: 'usage',
      icon: 'settings',
      title: 'How We Use Your Data',
      summary: 'To improve your experience and provide our services',
      content: `Your data helps us deliver and enhance our services:

Service Delivery:
• Creating and managing your account
• Enabling photo sharing within events
• Processing print orders
• Customer support assistance

Personalization:
• Customizing your app experience
• Suggesting relevant features
• Improving photo quality algorithms
• Event recommendations

Communication:
• Important service updates
• New feature announcements
• Support responses
• Marketing (with your consent)

We use advanced analytics to understand usage patterns and improve our app, but all analytics data is anonymized and cannot be traced back to individual users.`,
      color: '#FF6F61',
    },
    {
      id: 'sharing',
      icon: 'people',
      title: 'Data Sharing & Third Parties',
      summary: 'We never sell your personal information',
      content: `Your privacy is our priority. Here's how we handle data sharing:

We DO NOT:
• Sell your personal information to anyone
• Share photos outside your chosen events
• Provide data to advertisers
• Use your content for marketing without permission

We MAY share data only when:
• Required by law or legal process
• Protecting our users' safety
• With service providers (under strict agreements)
• During business transfers (with privacy protection)

Trusted Partners:
• Cloud storage providers (encrypted data)
• Payment processors (for purchases)
• Customer support tools
• Analytics services (anonymized data only)

All third-party partners are bound by strict privacy agreements and cannot use your data for their own purposes.`,
      color: '#2196F3',
    },
    {
      id: 'security',
      icon: 'lock-closed',
      title: 'Security & Protection',
      summary: 'Enterprise-grade security for your photos and data',
      content: `We implement multiple layers of security to protect your information:

Data Encryption:
• End-to-end encryption for photo uploads
• Secure data transmission (TLS/SSL)
• Encrypted storage of personal information
• Secure backup systems

Access Controls:
• Multi-factor authentication support
• Regular security audits
• Employee access restrictions
• Automatic session timeouts

Photo Security:
• Private event access only
• Secure sharing links
• Automatic deletion options
• Download restrictions per event

While we implement industry-leading security measures, no system is 100% secure. We continuously monitor and update our security practices to protect against new threats.`,
      color: '#FF9800',
    },
    {
      id: 'rights',
      icon: 'hand-left',
      title: 'Your Privacy Rights',
      summary: 'You have full control over your data',
      content: `You have complete control over your personal information:

Data Access:
• View all data we have about you
• Download your information anytime
• See how your data is being used
• Review sharing permissions

Data Control:
• Edit or update your information
• Delete specific photos or data
• Opt-out of communications
• Change privacy settings

Account Management:
• Export your photos and data
• Delete your account completely
• Transfer data to other services
• Pause data collection

Legal Rights (where applicable):
• Right to be forgotten
• Data portability
• Correction of inaccurate data
• Restriction of processing

To exercise these rights, contact us through the app or email privacy@pixprint.com. We'll respond within 30 days.`,
      color: '#9C27B0',
    },
    {
      id: 'updates',
      icon: 'refresh',
      title: 'Policy Updates',
      summary: 'How we handle changes to this policy',
      content: `Transparency is important to us. Here's how we handle policy changes:

Notification Methods:
• In-app notifications for major changes
• Email alerts to all users
• Website announcements
• Version history available

Types of Changes:
• Legal requirement updates
• New feature privacy implications
• Enhanced protection measures
• Clarifications based on user feedback

Your Options:
• Review changes before they take effect
• Contact us with questions or concerns
• Adjust your privacy settings
• Delete your account if you disagree

We'll never make changes that significantly reduce your privacy rights without your explicit consent. Minor clarifications may take effect immediately, but substantial changes will have a notice period.`,
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
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
            <Text style={styles.title}>Privacy Policy</Text>
            <Text style={styles.subtitle}>Your privacy matters to us</Text>
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
          <View style={styles.introHeader}>
            <Ionicons name="information-circle" size={24} color="#FF6F61" />
            <Text style={styles.introTitle}>Our Commitment to You</Text>
          </View>
          <Text style={styles.introText}>
            At PixPrint, your privacy isn't just a policy—it's a promise. We've designed our 
            platform with privacy at its core, ensuring your memories remain yours while 
            giving you the tools to share them safely.
          </Text>
          <View style={styles.lastUpdated}>
            <Ionicons name="calendar" size={16} color="#666666" />
            <Text style={styles.lastUpdatedText}>Last updated: December 15, 2024</Text>
          </View>
        </View>

        {/* Quick Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Quick Overview</Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
              <Text style={styles.overviewText}>No data selling</Text>
            </View>
            <View style={styles.overviewItem}>
              <Ionicons name="lock-closed" size={20} color="#FF6F61" />
              <Text style={styles.overviewText}>Encrypted storage</Text>
            </View>
            <View style={styles.overviewItem}>
              <Ionicons name="hand-left" size={20} color="#2196F3" />
              <Text style={styles.overviewText}>Full control</Text>
            </View>
            <View style={styles.overviewItem}>
              <Ionicons name="eye-off" size={20} color="#9C27B0" />
              <Text style={styles.overviewText}>Private by default</Text>
            </View>
          </View>
        </View>

        {/* Privacy Sections */}
        {privacyData.map((section, index) => (
          <View key={section.id} style={styles.card}>
            <TouchableOpacity 
              style={styles.cardHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.iconContainer, { backgroundColor: section.color + '20' }]}>
                  <Ionicons name={section.icon} size={22} color={section.color} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionSummary}>{section.summary}</Text>
                </View>
              </View>
              <View style={styles.expandIcon}>
                <Ionicons 
                  name={expandedSections[section.id] ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666666" 
                />
              </View>
            </TouchableOpacity>

            {expandedSections[section.id] && (
              <View style={styles.cardContent}>
                <View style={styles.divider} />
                <Text style={styles.contentText}>{section.content}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Contact Section */}
        <View style={styles.contactCard}>
          <LinearGradient
            colors={['#FF6F61', '#FF8D76']}
            style={styles.contactGradient}
          >
            <Ionicons name="mail" size={24} color="#FFFFFF" style={styles.contactIcon} />
            <Text style={styles.contactTitle}>Questions About Your Privacy?</Text>
            <Text style={styles.contactText}>
              Our privacy team is here to help. We're committed to transparency 
              and will respond to your inquiries within 24 hours.
            </Text>
            
            <View style={styles.contactMethods}>
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="mail-outline" size={16} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>privacy@pixprint.com</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.contactButton}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>Live Chat Support</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Data Rights Summary */}
        <View style={styles.rightsCard}>
          <Text style={styles.rightsTitle}>Your Data Rights at a Glance</Text>
          <View style={styles.rightsList}>
            {[
              { icon: 'eye', text: 'Access your data anytime' },
              { icon: 'create', text: 'Edit or correct information' },
              { icon: 'download', text: 'Export your photos and data' },
              { icon: 'trash', text: 'Delete your account completely' },
              { icon: 'close-circle', text: 'Opt-out of communications' },
              { icon: 'settings', text: 'Control sharing preferences' }
            ].map((right, index) => (
              <View key={index} style={styles.rightItem}>
                <Ionicons name={right.icon} size={16} color="#FF6F61" />
                <Text style={styles.rightText}>{right.text}</Text>
              </View>
            ))}
          </View>
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
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerGradient: {
    padding: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
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
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 12,
  },
  introText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 16,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  lastUpdatedText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  overviewCard: {
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
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  overviewText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    fontWeight: '500',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  sectionSummary: {
    fontSize: 13,
    color: '#888888',
  },
  expandIcon: {
    padding: 4,
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
    lineHeight: 24,
  },
  contactCard: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6F61',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  contactGradient: {
    padding: 24,
    alignItems: 'center',
  },
  contactIcon: {
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  contactText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  contactMethods: {
    width: '100%',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  rightsCard: {
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
  rightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  rightsList: {
    
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rightText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
    flex: 1,
  },
  bottomSpacing: {
    height: 20,
  },
});

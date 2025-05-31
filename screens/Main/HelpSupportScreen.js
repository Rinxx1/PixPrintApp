import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';

export default function HelpSupportScreen({ navigation }) {
  const [expandedFAQ, setExpandedFAQ] = useState({});
  const [scrollY] = useState(new Animated.Value(0));

  const toggleFAQ = (id) => {
    setExpandedFAQ(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@pixprint.com').catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleCallPress = () => {
    Linking.openURL('tel:+1234567890').catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleChatPress = () => {
    Alert.alert('Live Chat', 'Live chat feature coming soon!');
  };

  const handleTicketPress = () => {
    Alert.alert('Support Ticket', 'Redirecting to support portal...');
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const faqData = [
    {
      id: 'join',
      question: 'How do I join an event?',
      answer: 'Simply go to the "Join Event" section from your dashboard and enter the unique event code provided by the event organizer. You\'ll instantly gain access to the event gallery and can start sharing photos!',
      icon: 'people-circle'
    },
    {
      id: 'photos',
      question: 'Where are my photos saved?',
      answer: 'All your photos are securely stored in the cloud and organized by event. You can access them anytime through the Gallery section. Photos are automatically backed up and synced across all your devices.',
      icon: 'images'
    },
    {
      id: 'download',
      question: 'Can I download my photos?',
      answer: 'Absolutely! You can download individual photos or entire event albums. High-resolution versions are available for printing, and you can also share photos directly from the app.',
      icon: 'download'
    },
    {
      id: 'privacy',
      question: 'Are my photos private and secure?',
      answer: 'Yes! Your photos are protected with enterprise-grade encryption. Only people with the event code can view photos from that specific event. You have full control over your privacy settings.',
      icon: 'shield-checkmark'
    },
    {
      id: 'print',
      question: 'How do I order prints?',
      answer: 'Select any photo and tap the print icon. Choose your preferred size and finish, then proceed to checkout. We offer various print options including standard prints, canvas, and photo books.',
      icon: 'print'
    },
    {
      id: 'account',
      question: 'How do I delete my account?',
      answer: 'You can delete your account from Settings > Account > Delete Account. This will permanently remove all your data. If you need help, contact our support team first.',
      icon: 'person-remove'
    }
  ];

  const contactOptions = [
    {
      id: 'email',
      title: 'Email Support',
      subtitle: 'Get detailed help via email',
      icon: 'mail',
      color: '#4CAF50',
      action: handleEmailPress,
      availability: '24/7 response within 4 hours'
    },
    {
      id: 'phone',
      title: 'Phone Support',
      subtitle: 'Speak with our team directly',
      icon: 'call',
      color: '#FF6F61',
      action: handleCallPress,
      availability: 'Mon-Fri, 9 AM - 6 PM EST'
    },
    {
      id: 'chat',
      title: 'Live Chat',
      subtitle: 'Instant messaging support',
      icon: 'chatbubble-ellipses',
      color: '#2196F3',
      action: handleChatPress,
      availability: 'Mon-Fri, 9 AM - 9 PM EST'
    },
    {
      id: 'ticket',
      title: 'Support Ticket',
      subtitle: 'Track your support requests',
      icon: 'ticket',
      color: '#9C27B0',
      action: handleTicketPress,
      availability: 'Submit anytime'
    }
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HeaderBar navigation={navigation} showBack={true} />

      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['#4CAF50', '#45a049']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Ionicons name="help-circle" size={32} color="#FFFFFF" />
            <Text style={styles.title}>Help & Support</Text>
            <Text style={styles.subtitle}>We're here to help you</Text>
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
        {/* Quick Help */}
        <View style={styles.quickHelpCard}>
          <View style={styles.quickHelpHeader}>
            <Ionicons name="flash" size={24} color="#FF6F61" />
            <Text style={styles.quickHelpTitle}>Quick Help</Text>
          </View>
          <Text style={styles.quickHelpText}>
            Need immediate assistance? Check our most common solutions below or contact 
            our support team directly.
          </Text>
          <View style={styles.quickHelpStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>4hrs</Text>
              <Text style={styles.statLabel}>Response Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>99.9%</Text>
              <Text style={styles.statLabel}>Satisfaction</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Availability</Text>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle-outline" size={24} color="#FF6F61" />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          
          {faqData.map((faq) => (
            <View key={faq.id} style={styles.faqCard}>
              <TouchableOpacity 
                style={styles.faqHeader}
                onPress={() => toggleFAQ(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeaderLeft}>
                  <View style={styles.faqIconContainer}>
                    <Ionicons name={faq.icon} size={18} color="#FF6F61" />
                  </View>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                </View>
                <Ionicons 
                  name={expandedFAQ[faq.id] ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#666666" 
                />
              </TouchableOpacity>
              
              {expandedFAQ[faq.id] && (
                <View style={styles.faqContent}>
                  <View style={styles.faqDivider} />
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Options */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="headset" size={24} color="#FF6F61" />
            <Text style={styles.sectionTitle}>Contact Our Team</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Choose the best way to reach us. Our support team is ready to help!
          </Text>
          
          <View style={styles.contactGrid}>
            {contactOptions.map((option) => (
              <TouchableOpacity 
                key={option.id}
                style={styles.contactCard}
                onPress={option.action}
                activeOpacity={0.8}
              >
                <View style={[styles.contactIconContainer, { backgroundColor: option.color + '20' }]}>
                  <Ionicons name={option.icon} size={24} color={option.color} />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                  <View style={styles.availabilityBadge}>
                    <Ionicons name="time" size={12} color="#666666" />
                    <Text style={styles.availabilityText}>{option.availability}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Resources */}
        <View style={styles.resourcesCard}>
          <LinearGradient
            colors={['#F8F9FA', '#FFFFFF']}
            style={styles.resourcesGradient}
          >
            <Ionicons name="library" size={24} color="#FF6F61" style={styles.resourcesIcon} />
            <Text style={styles.resourcesTitle}>Additional Resources</Text>
            
            <View style={styles.resourcesList}>
              <TouchableOpacity style={styles.resourceItem}>
                <Ionicons name="document-text" size={18} color="#666666" />
                <Text style={styles.resourceText}>User Guide & Tutorials</Text>
                <Ionicons name="open" size={16} color="#CCCCCC" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resourceItem}>
                <Ionicons name="play-circle" size={18} color="#666666" />
                <Text style={styles.resourceText}>Video Tutorials</Text>
                <Ionicons name="open" size={16} color="#CCCCCC" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resourceItem}>
                <Ionicons name="chatbubbles" size={18} color="#666666" />
                <Text style={styles.resourceText}>Community Forum</Text>
                <Ionicons name="open" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Emergency Contact */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="warning" size={20} color="#FF6B6B" />
            <Text style={styles.emergencyTitle}>Emergency Support</Text>
          </View>
          <Text style={styles.emergencyText}>
            For urgent technical issues or account security concerns, contact us immediately:
          </Text>
          <TouchableOpacity style={styles.emergencyButton} onPress={handleEmailPress}>
            <Ionicons name="call" size={16} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>Emergency Hotline</Text>
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
    shadowColor: '#4CAF50',
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
  quickHelpCard: {
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
  quickHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickHelpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 12,
  },
  quickHelpText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 20,
  },
  quickHelpStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6F61',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  sectionCard: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  faqCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  faqContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
  },
  contactGrid: {
    
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  availabilityText: {
    fontSize: 11,
    color: '#666666',
    marginLeft: 4,
  },
  resourcesCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  resourcesGradient: {
    padding: 20,
  },
  resourcesIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  resourcesList: {
    
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  resourceText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    marginLeft: 12,
  },
  emergencyCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  emergencyButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomSpacing: {
    height: 20,
  },
});

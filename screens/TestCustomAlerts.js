import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlert } from '../context/AlertContext';

export default function TestCustomAlerts({ navigation }) {
  const { showAlert, showSuccess, showError, showConfirm, showWarning } = useAlert();

  const testBasicAlert = () => {
    showAlert({
      title: 'Basic Info Alert',
      message: 'This is a basic information alert with default styling.',
      type: 'info',
      buttons: [{ text: 'Got it!', style: 'default' }]
    });
  };

  const testSuccessAlert = () => {
    showSuccess(
      'Operation Successful! 🎉',
      'Your action has been completed successfully. Everything is working perfectly!',
      () => console.log('Success acknowledged')
    );
  };

  const testErrorAlert = () => {
    showError(
      'Something Went Wrong',
      'An unexpected error occurred while processing your request. Please try again.',
      () => console.log('Retry pressed'),
      () => console.log('Cancel pressed')
    );
  };

  const testConfirmAlert = () => {
    showConfirm(
      'Confirm Your Action',
      'Are you sure you want to proceed with this action? This cannot be undone.',
      () => console.log('User confirmed'),
      () => console.log('User cancelled')
    );
  };

  const testWarningAlert = () => {
    showWarning(
      'Important Warning ⚠️',
      'This action may have serious consequences. Please make sure you understand the implications before proceeding.',
      () => console.log('User proceeded'),
      () => console.log('User cancelled')
    );
  };

  const testComplexAlert = () => {
    showAlert({
      title: 'Custom Multi-Button Alert',
      message: 'This alert demonstrates multiple button styles and functionality.',
      type: 'confirm',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => console.log('Cancelled') },
        { text: 'Save Draft', style: 'default', onPress: () => console.log('Draft saved') },
        { text: 'Publish', style: 'primary', onPress: () => console.log('Published') },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Deleted') },
      ]
    });
  };

  const testLongTextAlert = () => {
    showAlert({
      title: 'Long Content Test',
      message: 'This is a test alert with a much longer message to demonstrate how the custom alert handles text overflow and wrapping. The alert should gracefully handle longer content while maintaining its beautiful design and readability across different screen sizes.',
      type: 'info',
      buttons: [{ text: 'Understood', style: 'primary' }]
    });
  };

  const alertTests = [
    {
      title: 'Basic Info Alert',
      description: 'Simple information alert',
      icon: 'information-circle',
      color: '#2196F3',
      onPress: testBasicAlert,
    },
    {
      title: 'Success Alert',
      description: 'Success confirmation with callback',
      icon: 'checkmark-circle',
      color: '#4CAF50',
      onPress: testSuccessAlert,
    },
    {
      title: 'Error Alert',
      description: 'Error alert with retry option',
      icon: 'close-circle',
      color: '#FF5252',
      onPress: testErrorAlert,
    },
    {
      title: 'Confirmation Alert',
      description: 'Yes/No confirmation dialog',
      icon: 'help-circle',
      color: '#9C27B0',
      onPress: testConfirmAlert,
    },
    {
      title: 'Warning Alert',
      description: 'Warning with proceed/cancel',
      icon: 'warning',
      color: '#FF9800',
      onPress: testWarningAlert,
    },
    {
      title: 'Multi-Button Alert',
      description: 'Complex alert with multiple actions',
      icon: 'options',
      color: '#607D8B',
      onPress: testComplexAlert,
    },
    {
      title: 'Long Text Alert',
      description: 'Alert with longer content',
      icon: 'document-text',
      color: '#795548',
      onPress: testLongTextAlert,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FF6F61" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Custom Alert System Test</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="bulb" size={24} color="#FF6F61" />
          <Text style={styles.infoText}>
            Test the enhanced custom alert system. These alerts work consistently across iOS and Android with beautiful animations and designs.
          </Text>
        </View>

        {alertTests.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={styles.testCard}
            onPress={test.onPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[`${test.color}15`, `${test.color}05`]}
              style={styles.testCardGradient}
            >
              <View style={[styles.testIcon, { backgroundColor: `${test.color}20` }]}>
                <Ionicons name={test.icon} size={24} color={test.color} />
              </View>
              <View style={styles.testContent}>
                <Text style={styles.testTitle}>{test.title}</Text>
                <Text style={styles.testDescription}>{test.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </LinearGradient>
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 Each alert type demonstrates different visual styles, animations, and interaction patterns optimized for both platforms.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2A32',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  testCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  testCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  testIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  testContent: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2A32',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: '#666666',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

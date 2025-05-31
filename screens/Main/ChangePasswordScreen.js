import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';
import { auth, db } from '../../firebase'; // Firebase auth import
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth'; // For password update
import { doc, updateDoc } from 'firebase/firestore'; // For Firestore update

const { width } = Dimensions.get('window');

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  useEffect(() => {
    // Calculate password strength
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    // Length check
    if (newPassword.length >= 8) strength += 1;
    // Contains number check
    if (/\d/.test(newPassword)) strength += 1;
    // Contains special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength += 1;
    // Contains uppercase check
    if (/[A-Z]/.test(newPassword)) strength += 1;
    
    setPasswordStrength(strength);
  }, [newPassword]);

  const renderPasswordStrength = () => {
    if (!newPassword) return null;
    
    const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['#FF6961', '#FFB347', '#77DD77', '#50C878'];
    
    return (
      <View style={styles.strengthContainer}>
        <View style={styles.strengthBars}>
          {[0, 1, 2, 3].map(index => (
            <View 
              key={index}
              style={[
                styles.strengthBar, 
                { 
                  backgroundColor: index < passwordStrength 
                    ? strengthColors[passwordStrength - 1] 
                    : '#E0E0E0'
                }
              ]}
            />
          ))}
        </View>
        <Text style={[
          styles.strengthText, 
          { color: passwordStrength > 0 ? strengthColors[passwordStrength - 1] : '#666' }
        ]}>
          {passwordStrength === 0 ? 'Too weak' : strengthLabels[passwordStrength - 1]}
        </Text>
      </View>
    );
  };

  const handleChangePassword = async () => {
    // Clear previous error message
    setErrorMessage('');
    
    if (!currentPassword.trim()) {
      setErrorMessage('Current password is required.');
      return;
    }

    if (!newPassword.trim()) {
      setErrorMessage('New password is required.');
      return;
    }
    
    if (passwordStrength < 2) {
      setErrorMessage('Please choose a stronger password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match!');
      return;
    }
    
    setLoading(true);

    const user = auth.currentUser;
    if (user) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      try {
        // Reauthenticate the user with the current password
        await reauthenticateWithCredential(user, credential);

        // Proceed with updating the password
        await updatePassword(user, newPassword);
        
        // Update password in Firestore as well
        const userRef = doc(db, 'user_tbl', user.uid);
        await updateDoc(userRef, {
          user_password: newPassword, // Update user_password field in Firestore
        });

        setErrorMessage('');  // Clear error message
        Alert.alert(
          'Success', 
          'Your password has been updated successfully!',
          [{ text: 'Great!', onPress: () => navigation.goBack() }]
        );
      } catch (error) {
        console.log(error);
        if (error.code === 'auth/wrong-password') {
          setErrorMessage('Incorrect current password! Please try again.');
        } else if (error.code === 'auth/weak-password') {
          setErrorMessage('The new password is too weak. Please choose a stronger password.');
        } else {
          setErrorMessage('Error updating password. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>Update your password to keep your account secure</Text>
        </Animated.View>
        
        {/* Security Icon */}
        <Animated.View 
          style={[
            styles.iconSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#FF8D76', '#FF6F61']}
              style={styles.iconGradient}
            >
              <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </Animated.View>
        
        {/* Form Section */}
        <Animated.View 
          style={[
            styles.formSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.formCard}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={[
                styles.inputContainer,
                errorMessage.includes('current password') && styles.inputError
              ]}>
                <Ionicons name="key-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput
                  secureTextEntry={!showCurrentPassword}
                  placeholder="Enter your current password"
                  placeholderTextColor="#AAAAAA"
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Ionicons
                    name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={[
                styles.inputContainer,
                errorMessage.includes('New') && styles.inputError
              ]}>
                <Ionicons name="lock-closed-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput
                  secureTextEntry={!showNewPassword}
                  placeholder="Create a strong password"
                  placeholderTextColor="#AAAAAA"
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Ionicons
                    name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
              {renderPasswordStrength()}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={[
                styles.inputContainer,
                errorMessage.includes('match') && styles.inputError
              ]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#AAAAAA" style={styles.inputIcon} />
                <TextInput
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Confirm your new password"
                  placeholderTextColor="#AAAAAA"
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Display error message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            
            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={newPassword.length >= 8 ? "checkmark-circle" : "ellipse-outline"} 
                  size={14} 
                  color={newPassword.length >= 8 ? "#50C878" : "#AAAAAA"} 
                />
                <Text style={styles.requirementText}>At least 8 characters</Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={/\d/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                  size={14} 
                  color={/\d/.test(newPassword) ? "#50C878" : "#AAAAAA"} 
                />
                <Text style={styles.requirementText}>At least one number</Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={/[A-Z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                  size={14} 
                  color={/[A-Z]/.test(newPassword) ? "#50C878" : "#AAAAAA"} 
                />
                <Text style={styles.requirementText}>At least one uppercase letter</Text>
              </View>
              <View style={styles.requirementRow}>
                <Ionicons 
                  name={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"}
                  size={14}
                  color={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "#50C878" : "#AAAAAA"}
                />
                <Text style={styles.requirementText}>At least one special character</Text>
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* Save Button */}
        <Animated.View 
          style={[
            styles.buttonSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleChangePassword}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#CCCCCC', '#AAAAAA'] : ['#FF8D76', '#FF6F61']}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={styles.saveText}>Updating...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.saveText}>Update Password</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.forgotButton} onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot current password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    top: -width * 0.1,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    backgroundColor: 'rgba(255, 141, 118, 0.06)',
    bottom: width * 0.1,
    left: -width * 0.05,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 104,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    padding: 3,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    height: 52,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 8,
  },
  strengthContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  strengthBars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requirementsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 10,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 8,
  },
  buttonSection: {
    marginBottom: 20,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    shadowOpacity: 0.1,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  forgotButton: {
    paddingVertical: 10,
  },
  forgotText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '500',
  },
});

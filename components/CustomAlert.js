// Simple iOS-compatible CustomAlert component
import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  buttons = [],
  onClose,
}) {
  // For iOS debugging - let's temporarily fall back to native alerts
  if (Platform.OS === 'ios') {
    useEffect(() => {
      if (visible && title && message) {
        if (buttons.length === 0) {
          Alert.alert(title, message, [{ text: 'OK', onPress: onClose }]);
        } else if (buttons.length === 2) {
          Alert.alert(
            title,
            message,
            [
              { text: buttons[0].text, style: 'cancel', onPress: () => { buttons[0].onPress?.(); onClose?.(); } },
              { text: buttons[1].text, style: 'default', onPress: () => { buttons[1].onPress?.(); onClose?.(); } },
            ]
          );
        } else {
          Alert.alert(title, message, [{ text: 'OK', onPress: onClose }]);
        }
      }
    }, [visible, title, message, buttons, onClose]);
    
    return null; // Don't render custom alert on iOS for now
  }

  // Android - use custom alert
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const getAlertConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#4CAF50',
          gradientColors: ['rgba(76, 175, 80, 0.15)', 'rgba(76, 175, 80, 0.05)'],
          borderColor: 'rgba(76, 175, 80, 0.4)',
          iconBg: 'rgba(76, 175, 80, 0.15)',
        };
      case 'error':
        return {
          icon: 'close-circle',
          iconColor: '#FF5252',
          gradientColors: ['rgba(255, 82, 82, 0.15)', 'rgba(255, 82, 82, 0.05)'],
          borderColor: 'rgba(255, 82, 82, 0.4)',
          iconBg: 'rgba(255, 82, 82, 0.15)',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#FF9800',
          gradientColors: ['rgba(255, 152, 0, 0.15)', 'rgba(255, 152, 0, 0.05)'],
          borderColor: 'rgba(255, 152, 0, 0.4)',
          iconBg: 'rgba(255, 152, 0, 0.15)',
        };
      case 'confirm':
        return {
          icon: 'help-circle',
          iconColor: '#9C27B0',
          gradientColors: ['rgba(156, 39, 176, 0.15)', 'rgba(156, 39, 176, 0.05)'],
          borderColor: 'rgba(156, 39, 176, 0.4)',
          iconBg: 'rgba(156, 39, 176, 0.15)',
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: '#2196F3',
          gradientColors: ['rgba(33, 150, 243, 0.15)', 'rgba(33, 150, 243, 0.05)'],
          borderColor: 'rgba(33, 150, 243, 0.4)',
          iconBg: 'rgba(33, 150, 243, 0.15)',
        };
    }
  };

  const config = getAlertConfig();

  // Animation handling
  useEffect(() => {
    if (visible) {
      setIsModalVisible(true);
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isModalVisible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleBackdropPress = useCallback(() => {
    if (buttons.length === 0) {
      handleClose();
    }
  }, [buttons.length, handleClose]);

  const handleButtonPress = useCallback((button) => {
    return () => {
      try {
        if (button.onPress) {
          button.onPress();
        }
      } catch (error) {
        console.warn('Error in button press handler:', error);
      } finally {
        handleClose();
      }
    };
  }, [handleClose]);

  if (!isModalVisible) {
    return null;
  }

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <Animated.View 
          style={[
            styles.backdropOverlay,
            { opacity: opacityAnim }
          ]}
        />
      </TouchableOpacity>
      
      <View style={styles.alertWrapper}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={config.gradientColors}
            style={[styles.alertContent, { borderColor: config.borderColor }]}
          >
            <View style={styles.backgroundPattern}>
              <View style={[styles.patternCircle, styles.patternCircle1]} />
              <View style={[styles.patternCircle, styles.patternCircle2]} />
              <View style={[styles.patternCircle, styles.patternCircle3]} />
            </View>

            <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
              <View style={[styles.iconInner, { backgroundColor: config.iconColor + '20' }]}>
                <Ionicons name={config.icon} size={36} color={config.iconColor} />
              </View>
            </View>

            <View style={styles.contentContainer}>
              <Text style={styles.alertTitle} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.alertMessage} numberOfLines={4}>
                {message}
              </Text>
            </View>

            {buttons.length > 0 ? (
              <View style={[
                styles.buttonContainer,
                buttons.length === 1 && styles.singleButtonContainer,
              ]}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={`button-${index}`}
                    style={[
                      styles.button,
                      button.style === 'destructive' && styles.destructiveButton,
                      button.style === 'cancel' && styles.cancelButton,
                      button.style === 'default' && styles.defaultButton,
                      button.style === 'primary' && styles.primaryButton,
                    ]}
                    onPress={handleButtonPress(button)}
                    activeOpacity={0.8}
                  >
                    {button.style === 'destructive' ? (
                      <LinearGradient
                        colors={['#FF5252', '#E53935']}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.destructiveButtonText}>{button.text}</Text>
                      </LinearGradient>
                    ) : button.style === 'primary' ? (
                      <LinearGradient
                        colors={['#FF8D76', '#FF6F61']}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.primaryButtonText}>{button.text}</Text>
                      </LinearGradient>
                    ) : button.style === 'default' ? (
                      <LinearGradient
                        colors={['#4CAF50', '#43A047']}
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.defaultButtonText}>{button.text}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.cancelButtonContent}>
                        <Text style={styles.cancelButtonText}>{button.text}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.okButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.okButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  alertWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 380,
  },
  alertContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#000',
  },
  patternCircle1: {
    width: 100,
    height: 100,
    top: -30,
    right: -30,
  },
  patternCircle2: {
    width: 60,
    height: 60,
    bottom: -20,
    left: -20,
  },
  patternCircle3: {
    width: 40,
    height: 40,
    top: '50%',
    left: -15,
  },
  iconContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2A32',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
    lineHeight: 28,
  },
  alertMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.3,
    maxWidth: 280,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  singleButtonContainer: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 50,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  defaultButton: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  destructiveButton: {
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonContent: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  defaultButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  destructiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  okButton: {
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 111, 97, 0.3)',
  },
  okButtonText: {
    color: '#FF6F61',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
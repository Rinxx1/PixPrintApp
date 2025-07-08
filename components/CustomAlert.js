import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
  buttons = [],
  onClose,
  animationValue = new Animated.Value(0),
}) {
  
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

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animationValue, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (buttons.length === 0) {
      onClose && onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]} />
        )}
        
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
          style={styles.alertWrapper}
        >
          <Animated.View
            style={[
              styles.alertContainer,
              {
                transform: [
                  {
                    scale: animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                  {
                    translateY: animationValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
                opacity: animationValue,
              },
            ]}
          >
            <LinearGradient
              colors={config.gradientColors}
              style={[styles.alertContent, { borderColor: config.borderColor }]}
            >
              {/* Background Pattern */}
              <View style={styles.backgroundPattern}>
                <View style={[styles.patternCircle, styles.patternCircle1]} />
                <View style={[styles.patternCircle, styles.patternCircle2]} />
                <View style={[styles.patternCircle, styles.patternCircle3]} />
              </View>

              {/* Icon Container */}
              <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
                <View style={[styles.iconInner, { backgroundColor: config.iconColor + '20' }]}>
                  <Ionicons name={config.icon} size={36} color={config.iconColor} />
                </View>
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <Text style={styles.alertTitle}>{title}</Text>
                <Text style={styles.alertMessage}>{message}</Text>
              </View>

              {/* Buttons */}
              {buttons.length > 0 ? (
                <View style={styles.buttonContainer}>
                  {buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        button.style === 'destructive' && styles.destructiveButton,
                        button.style === 'cancel' && styles.cancelButton,
                        button.style === 'default' && styles.defaultButton,
                        button.style === 'primary' && styles.primaryButton,
                        buttons.length === 1 && styles.singleButton,
                        buttons.length === 2 && index === 0 && styles.leftButton,
                        buttons.length === 2 && index === 1 && styles.rightButton,
                      ]}
                      onPress={() => {
                        button.onPress && button.onPress();
                        onClose && onClose();
                      }}
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
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.okButtonText}>OK</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertWrapper: {
    width: width * 0.9,
    maxWidth: 380,
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
  },
  alertContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
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
  button: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  singleButton: {
    flex: 1,
  },
  leftButton: {
    marginRight: 6,
  },
  rightButton: {
    marginLeft: 6,
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
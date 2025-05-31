import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info', // 'success', 'error', 'warning', 'info'
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
          gradientColors: ['rgba(76, 175, 80, 0.1)', 'rgba(76, 175, 80, 0.05)'],
          borderColor: 'rgba(76, 175, 80, 0.3)',
        };
      case 'error':
        return {
          icon: 'alert-circle',
          iconColor: '#FF5252',
          gradientColors: ['rgba(255, 82, 82, 0.1)', 'rgba(255, 82, 82, 0.05)'],
          borderColor: 'rgba(255, 82, 82, 0.3)',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#FF9800',
          gradientColors: ['rgba(255, 152, 0, 0.1)', 'rgba(255, 152, 0, 0.05)'],
          borderColor: 'rgba(255, 152, 0, 0.3)',
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: '#2196F3',
          gradientColors: ['rgba(33, 150, 243, 0.1)', 'rgba(33, 150, 243, 0.05)'],
          borderColor: 'rgba(33, 150, 243, 0.3)',
        };
    }
  };

  const config = getAlertConfig();

  React.useEffect(() => {
    if (visible) {
      Animated.spring(animationValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
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
                    outputRange: [50, 0],
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
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${config.iconColor}15` }]}>
              <Ionicons name={config.icon} size={32} color={config.iconColor} />
            </View>

            {/* Title */}
            <Text style={styles.alertTitle}>{title}</Text>

            {/* Message */}
            <Text style={styles.alertMessage}>{message}</Text>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'destructive' && styles.destructiveButton,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'default' && styles.defaultButton,
                    index === 0 && buttons.length > 1 && styles.buttonMarginRight,
                  ]}
                  onPress={() => {
                    button.onPress && button.onPress();
                    onClose && onClose();
                  }}
                >
                  {button.style === 'destructive' ? (
                    <LinearGradient
                      colors={['#FF5252', '#FF1744']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.destructiveButtonText}>{button.text}</Text>
                    </LinearGradient>
                  ) : button.style === 'default' ? (
                    <LinearGradient
                      colors={['#4CAF50', '#45A049']}
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
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 350,
  },
  alertContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  alertMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    letterSpacing: 0.3,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
  },
  buttonMarginRight: {
    marginRight: 6,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultButton: {
    // Handled by gradient
  },
  destructiveButton: {
    // Handled by gradient
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonContent: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  destructiveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
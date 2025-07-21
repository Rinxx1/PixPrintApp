import React, { useState, useRef, useCallback } from 'react';
import { Animated, Platform } from 'react-native';
import CustomAlert from '../components/CustomAlert';

export default function useCustomAlert() {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });
  
  const animationValue = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);

  const showAlert = useCallback(({ title, message, type = 'info', buttons = [] }) => {
    // Prevent multiple alerts from showing simultaneously
    if (isAnimatingRef.current) {
      return;
    }
    
    isAnimatingRef.current = true;
    setAlertConfig({
      visible: true,
      title: title || 'Alert',
      message: message || '',
      type,
      buttons,
    });
  }, []);

  const hideAlert = useCallback(() => {
    if (isAnimatingRef.current) {
      // Add a small delay to allow animations to complete
      setTimeout(() => {
        isAnimatingRef.current = false;
      }, 300);
    }
    setAlertConfig(prev => ({ ...prev, visible: false }));
  }, []);
  // Quick access methods for common alert types
  const showSuccess = useCallback((title, message, onOk) => {
    showAlert({
      title: title || 'Success',
      message: message || 'Operation completed successfully.',
      type: 'success',
      buttons: onOk ? [{ text: 'Great!', style: 'default', onPress: onOk }] : [{ text: 'OK', style: 'default' }],
    });
  }, [showAlert]);

  const showError = useCallback((title, message, onRetry, onCancel) => {
    const buttons = [];
    if (onRetry) buttons.push({ text: 'Retry', style: 'primary', onPress: onRetry });
    if (onCancel) buttons.push({ text: 'Cancel', style: 'cancel', onPress: onCancel });
    if (buttons.length === 0) buttons.push({ text: 'OK', style: 'cancel' });

    showAlert({
      title: title || 'Error',
      message: message || 'Something went wrong. Please try again.',
      type: 'error',
      buttons,
    });
  }, [showAlert]);

  const showConfirm = useCallback((title, message, onYes, onNo) => {
    showAlert({
      title: title || 'Confirm Action',
      message: message || 'Are you sure you want to continue?',
      type: 'confirm',
      buttons: [
        { text: 'No', style: 'cancel', onPress: onNo },
        { text: 'Yes', style: 'primary', onPress: onYes },
      ],
    });
  }, [showAlert]);

  const showWarning = useCallback((title, message, onProceed, onCancel) => {
    showAlert({
      title: title || 'Warning',
      message: message || 'This action may have unintended consequences.',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Proceed', style: 'destructive', onPress: onProceed },
      ],
    });
  }, [showAlert]);
  const AlertComponent = useCallback(() => (
    <CustomAlert
      {...alertConfig}
      onClose={hideAlert}
      animationValue={animationValue}
    />
  ), [alertConfig, hideAlert, animationValue]);

  return {
    showAlert,
    showSuccess,
    showError,
    showConfirm,
    showWarning,
    hideAlert,
    AlertComponent,
    isVisible: alertConfig.visible,
  };
}
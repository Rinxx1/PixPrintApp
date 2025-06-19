import React, { useState, useRef } from 'react';
import { Animated } from 'react-native';
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

  const showAlert = ({ title, message, type = 'info', buttons = [] }) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  // Quick access methods for common alert types
  const showSuccess = (title, message, onOk) => {
    showAlert({
      title,
      message,
      type: 'success',
      buttons: onOk ? [{ text: 'Great!', style: 'default', onPress: onOk }] : [],
    });
  };

  const showError = (title, message, onRetry, onCancel) => {
    const buttons = [];
    if (onRetry) buttons.push({ text: 'Retry', style: 'primary', onPress: onRetry });
    if (onCancel) buttons.push({ text: 'Cancel', style: 'cancel', onPress: onCancel });
    if (buttons.length === 0) buttons.push({ text: 'OK', style: 'cancel' });

    showAlert({
      title,
      message,
      type: 'error',
      buttons,
    });
  };

  const showConfirm = (title, message, onYes, onNo) => {
    showAlert({
      title,
      message,
      type: 'confirm',
      buttons: [
        { text: 'No', style: 'cancel', onPress: onNo },
        { text: 'Yes', style: 'primary', onPress: onYes },
      ],
    });
  };

  const showWarning = (title, message, onProceed, onCancel) => {
    showAlert({
      title,
      message,
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Proceed', style: 'destructive', onPress: onProceed },
      ],
    });
  };

  const AlertComponent = () => (
    <CustomAlert
      {...alertConfig}
      onClose={hideAlert}
      animationValue={animationValue}
    />
  );

  return {
    showAlert,
    showSuccess,
    showError,
    showConfirm,
    showWarning,
    hideAlert,
    AlertComponent,
  };
}
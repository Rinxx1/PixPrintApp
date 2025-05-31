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

  const AlertComponent = () => (
    <CustomAlert
      {...alertConfig}
      onClose={hideAlert}
      animationValue={animationValue}
    />
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
}
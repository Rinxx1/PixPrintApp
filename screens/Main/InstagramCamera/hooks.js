// Instagram-style alert hooks
import { Platform, Alert } from 'react-native';
import { useAlert } from '../../../context/AlertContext';

export const useInstagramAlert = () => {
  const { showAlert, showError, showSuccess } = useAlert();
  
  const instagramAlert = (title, message, buttons = []) => {
    if (Platform.OS === 'ios') {
      Alert.alert(title, message, buttons);
    } else {
      showAlert({
        title,
        message,
        type: 'info',
        buttons: buttons.map(btn => ({
          text: btn.text,
          style: btn.style || 'default',
          onPress: btn.onPress
        }))
      });
    }
  };

  const instagramError = (title, message, onRetry, onCancel) => {
    if (Platform.OS === 'ios') {
      const buttons = [];
      if (onRetry) buttons.push({ text: 'Retry', onPress: onRetry });
      if (onCancel) buttons.push({ text: 'Cancel', style: 'cancel', onPress: onCancel });
      if (buttons.length === 0) buttons.push({ text: 'OK' });
      Alert.alert(title, message, buttons);
    } else {
      showError(title, message, onRetry, onCancel);
    }
  };

  const instagramSuccess = (title, message, onOk) => {
    if (Platform.OS === 'ios') {
      Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    } else {
      showSuccess(title, message, onOk);
    }
  };

  return { instagramAlert, instagramError, instagramSuccess };
};

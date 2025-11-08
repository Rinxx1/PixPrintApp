import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
  Platform
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../context/AlertContext';

const EventQrModal = ({
  visible,
  onClose,
  eventName,
  eventCode,
  eventWebsite
}) => {
  const viewShotRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showSuccess, showError } = useAlert();

  const handleSave = async () => {
    if (!viewShotRef.current) {
      return;
    }

    try {
      setIsSaving(true);
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        showError(
          'Permission Required',
          'Allow photo library access to save this QR code.'
        );
        return;
      }

      const uri = await viewShotRef.current.capture?.({
        format: 'png',
        quality: 1,
        result: 'tmpfile'
      });

      if (!uri) {
        throw new Error('QR capture failed');
      }

      const fileName = `pixprint-event-${eventCode || 'code'}-${Date.now()}.png`;
      const destination = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: uri, to: destination });

      const asset = await MediaLibrary.createAssetAsync(destination);
      if (asset) {
        showSuccess(
          'QR Saved',
          'The event QR code is now available in your photo library.'
        );
      }
    } catch (error) {
      console.error('Error saving QR:', error);
      showError(
        'Save Failed',
        'Unable to save the QR code. Please try again later.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: eventWebsite,
        url: Platform.OS === 'ios' ? eventWebsite : undefined,
        title: eventName
      });
    } catch (error) {
      console.error('Error sharing QR:', error);
      showError(
        'Share Failed',
        'Unable to share the event link right now.'
      );
    }
  };

  if (!eventWebsite) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Event QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          <Text style={styles.eventName}>{eventName}</Text>
          <Text style={styles.eventCode}>Code: {eventCode}</Text>

          <ViewShot ref={viewShotRef} style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={eventWebsite}
                size={220}
                backgroundColor="transparent"
                color="#1F2933"
              />
            </View>
          </ViewShot>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.outlineButton]}
              onPress={handleShare}
            >
              <Ionicons name="share-social-outline" size={20} color="#48C6EF" />
              <Text style={styles.actionText}>Share Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.primaryText}>
                {isSaving ? 'Saving...' : 'Save QR'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EventQrModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2933',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  eventCode: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#48C6EF',
    marginRight: 12,
  },
  primaryButton: {
    backgroundColor: '#48C6EF',
  },
  actionText: {
    color: '#48C6EF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryLink: {
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});

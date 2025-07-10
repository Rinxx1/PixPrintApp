import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

export default function HeaderBar({ navigation, showBack = false }) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 32 }} /> // spacer to align brand center
      )}

      <View style={styles.brandWrapper}>
        <Image
          source={require('../assets/icon-pix-print.png')}
          style={styles.logo}
        />
        <Text style={styles.brand}>PixPrint</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute', // 🔥 Make it float
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 100,
    backgroundColor: '#FAF8F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 32, // status bar space
  },
  backArrow: {
    fontSize: 22,
    paddingHorizontal: 12,
    paddingVertical: 4,
    color: '#2D2A32',
  },
  brandWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  logo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  brand: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 6,
    color: '#2D2A32',
  },
});

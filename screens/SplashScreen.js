import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync(); // Keep native splash up

export default function SplashScreenComponent({ onFinish }) {
  const bounceAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showBounce = async () => {
      // Small pause to guarantee visible start
      await new Promise((res) => setTimeout(res, 300));

      Animated.parallel([
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 20,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        await new Promise((res) => setTimeout(res, 1000));
        await SplashScreen.hideAsync();
        onFinish();
      });
    };

    showBounce();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/icon-pix-print.png')}
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{ scale: bounceAnim }],
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
});

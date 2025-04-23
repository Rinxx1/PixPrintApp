import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

export default function SplashAnimation({ onDone }) {
  const bounceAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo bounce and fade
    Animated.parallel([
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Fade in text after logo finishes
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          onDone(); // move to main app
        }, 1000);
      });
    });
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

      <Animated.Text style={[styles.text, { opacity: textFadeAnim }]}>
        PixPrint
      </Animated.Text>
      <Animated.Text style={[styles.subtitle, { opacity: textFadeAnim }]}>
       Capture. Print. Celebrate
      </Animated.Text>
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
  text: {
    marginTop: -10,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2A32',
  },
  subtitle: {
    fontSize: 14,
    color: '#807E84',
    marginBottom: 32,
  },
});

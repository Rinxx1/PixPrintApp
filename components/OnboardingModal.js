import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Import images statically
const images = {
  capture: require('../assets/onboarding-capture.png'),
  share: require('../assets/onboarding-share.png'),
  print: require('../assets/onboarding-print.png'),
};

const onboardingData = [
  {
    id: 1,
    title: 'Capture Every Moment',
    description: 'Create events and capture special moments with friends and family in real-time',
    image: images.capture, // Download: "Mobile photography" or "Taking photos" from undraw.co
    icon: 'camera',
    color: '#48C6EF',
  },
  {
    id: 2,
    title: 'Share Instantly',
    description: 'Share photos instantly with all event participants. Everyone stays connected',
    image: images.share, // Download: "Photo sharing" or "Share" from undraw.co
    icon: 'share-social',
    color: '#0060DF',
  },
  {
    id: 3,
    title: 'Print Your Memories',
    description: 'Order premium quality prints delivered to your doorstep. Keep memories alive',
    image: images.print, // Download: "Printing" or "Photo album" from undraw.co
    icon: 'print',
    color: '#48C6EF',
  },
];

export default function OnboardingModal({ visible, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, currentIndex]);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: width * nextIndex,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleDotPress = (index) => {
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: width * index,
      animated: true,
    });
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#FFFFFF', '#F8FCFF', '#FFFFFF']}
          style={styles.gradient}
        />

        {/* Skip Button */}
        {currentIndex < onboardingData.length - 1 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Onboarding Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {onboardingData.map((item, index) => (
            <Animated.View
              key={item.id}
              style={[
                styles.slide,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Icon Badge */}
              <View style={[styles.iconBadge, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={32} color={item.color} />
              </View>

              {/* Image Container */}
              <View style={styles.imageContainer}>
                <View style={styles.imagePlaceholder}>
                  {/* Replace with actual image once downloaded */}
                  <Image
                    source={item.image}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Bottom Section */}
        <View style={styles.bottomContainer}>
          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {onboardingData.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleDotPress(index)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.dot,
                    currentIndex === index && styles.activeDot,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Next/Get Started Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#48C6EF', '#0060DF']}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex === onboardingData.length - 1
                  ? 'Get Started'
                  : 'Next'}
              </Text>
              <Ionicons
                name={
                  currentIndex === onboardingData.length - 1
                    ? 'checkmark'
                    : 'arrow-forward'
                }
                size={20}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    width: width * 0.8,
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D2A32',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  bottomContainer: {
    paddingHorizontal: 32,
    paddingBottom: 50,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 6,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#48C6EF',
  },
  nextButton: {
    width: '100%',
    borderRadius: 25,
    shadowColor: '#48C6EF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(72, 198, 239, 0.05)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 96, 223, 0.04)',
    bottom: 100,
    left: -40,
  },
});

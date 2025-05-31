import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Animated, 
  Dimensions 
} from 'react-native';
import HeaderBar from '../../components/HeaderBar';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AddMoreCreditsScreen({ navigation }) {
  const [selectedCredits, setSelectedCredits] = useState(null);
  const [userCredits, setUserCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  React.useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Enhanced credit options with better styling
  const creditOptions = [
    { 
      credits: 50, 
      price: 200, 
      discount: 0.5, 
      label: '50 Credits', 
      displayPrice: '₱200', 
      discountLabel: '50% OFF', 
      icon: 'diamond-outline', 
      mostPopular: false,
      originalPrice: '₱400',
      color: '#4CAF50'
    },
    { 
      credits: 80, 
      price: 320, 
      discount: 0.2, 
      label: '80 Credits', 
      displayPrice: '₱320', 
      discountLabel: '20% OFF', 
      icon: 'star-outline', 
      mostPopular: false,
      originalPrice: '₱400',
      color: '#FF9800'
    },
    { 
      credits: 120, 
      price: 480, 
      discount: 0.3, 
      label: '120 Credits', 
      displayPrice: '₱480', 
      discountLabel: '30% OFF', 
      icon: 'trophy-outline', 
      mostPopular: true,
      originalPrice: '₱686',
      color: '#FF6F61'
    },
  ];

  const handleSelectCredit = (option) => {
    setSelectedCredits(option);
  };

  const handleBuyNow = async () => {
    if (!selectedCredits) {
      Alert.alert('Error', 'Please select a credit package.');
      return;
    }

    setIsLoading(true);

    // Get the current logged-in user
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You need to be logged in to purchase credits.');
      setIsLoading(false);
      return;
    }

    try {
      // Get user data from the credits table
      const creditsRef = doc(db, 'credits_tbl', `${user.uid}`);
      const userCreditsDoc = await getDoc(creditsRef);

      if (userCreditsDoc.exists()) {
        // If user has credits already, update the credits value by adding the selected credits
        const currentCredits = userCreditsDoc.data().credits || 0;
        const updatedCredits = currentCredits + selectedCredits.credits;

        // Update the document with new credits value
        await updateDoc(creditsRef, {
          credits: updatedCredits,
        });

        setUserCredits(updatedCredits);
        Alert.alert('Success', `You have successfully purchased ${selectedCredits.credits} credits for ${selectedCredits.displayPrice}.`);
        navigation.goBack();
      } else {
        // If user doesn't have any credits yet, create a new document
        await setDoc(creditsRef, {
          credits_id: `${user.uid}_${selectedCredits.credits}`,
          credits: selectedCredits.credits,
          user_id: user.uid,
        });

        setUserCredits(selectedCredits.credits);
        Alert.alert('Success', `You have successfully purchased ${selectedCredits.credits} credits for ${selectedCredits.displayPrice}.`);
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'There was an issue processing your purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced showWhyCreditsInfo function with better design
  const showWhyCreditsInfo = () => {
    Alert.alert(
      '💎 Why Credits?', 
      '• Print high-quality photos instantly\n• Create and manage your own events\n• Access premium features and filters\n• Share unlimited photos with friends\n• Get priority customer support\n\nCredits make it easy to manage your printing budget while unlocking all PixPrint features!',
      [
        { text: 'Learn More', onPress: () => {
          Alert.alert(
            '📖 Credit Usage',
            '• Photo Printing: 2-5 credits per photo\n• Event Creation: 10 credits per event\n• Premium Filters: 1 credit per use\n• Priority Support: Included free\n\nCredits never expire and can be shared with family!',
            [{ text: 'Got it!', style: 'default' }]
          );
        }},
        { text: 'Got it!', style: 'default' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Add More Credits</Text>
          <Text style={styles.subtitle}>Choose your credit bundle and start printing!</Text>
        </Animated.View>

        {/* Enhanced benefits section with more items */}
        <Animated.View 
          style={[
            styles.benefitsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.benefitItem}>
            <Ionicons name="print-outline" size={20} color="#FF6F61" />
            <Text style={styles.benefitText}>Print high-quality photos</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="flash-outline" size={20} color="#FF6F61" />
            <Text style={styles.benefitText}>Instant photo delivery</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#FF6F61" />
            <Text style={styles.benefitText}>Secure transactions</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="people-outline" size={20} color="#FF6F61" />
            <Text style={styles.benefitText}>Share with friends</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="star-outline" size={20} color="#FF6F61" />
            <Text style={styles.benefitText}>Access premium features</Text>
          </View>
        </Animated.View>

        {/* Credit Options */}
        <View style={styles.creditsSection}>
          {creditOptions.map((option, index) => (
            <Animated.View
              key={index}
              style={[
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.creditCard,
                  selectedCredits && selectedCredits.credits === option.credits && styles.selectedCard,
                  option.mostPopular && styles.popularCard
                ]}
                onPress={() => handleSelectCredit(option)}
              >
                {option.mostPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.cardContent}>
                  <View style={styles.creditHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                      <Ionicons name={option.icon} size={24} color={option.color} />
                    </View>
                    <View style={styles.creditInfo}>
                      <Text style={styles.creditLabel}>{option.label}</Text>
                      <View style={styles.priceContainer}>
                        <Text style={styles.originalPrice}>{option.originalPrice}</Text>
                        <Text style={styles.currentPrice}>{option.displayPrice}</Text>
                      </View>
                    </View>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{option.discountLabel}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.perCreditText}>
                      ₱{(option.price / option.credits).toFixed(1)} per credit
                    </Text>
                    {selectedCredits && selectedCredits.credits === option.credits && (
                      <Ionicons name="checkmark-circle" size={20} color="#FF6F61" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Info Section */}
        <Animated.View 
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity style={styles.whyCreditsButton} onPress={showWhyCreditsInfo}>
            <Ionicons name="help-circle-outline" size={18} color="#FF6F61" />
            <Text style={styles.whyCreditsText}>Why do I need credits?</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Fixed Bottom Section */}
      <Animated.View 
        style={[
          styles.bottomSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {selectedCredits && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedText}>
              Selected: {selectedCredits.label} for {selectedCredits.displayPrice}
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.buyButton, (!selectedCredits || isLoading) && styles.buyButtonDisabled]} 
          onPress={handleBuyNow}
          disabled={!selectedCredits || isLoading}
        >
          <LinearGradient
            colors={(!selectedCredits || isLoading) ? ['#CCCCCC', '#AAAAAA'] : ['#FF8D76', '#FF6F61']}
            style={styles.buyButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <Text style={styles.buyButtonText}>Processing...</Text>
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buyButtonText}>Buy Now</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 141, 118, 0.06)',
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  headerSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    fontWeight: '500',
  },
  creditsSection: {
    marginBottom: 24,
  },
  creditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  selectedCard: {
    borderColor: '#FF6F61',
    shadowColor: '#FF6F61',
    shadowOpacity: 0.2,
  },
  popularCard: {
    borderColor: '#FF6F61',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6F61',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 8,
    zIndex: 1,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 20,
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  creditInfo: {
    flex: 1,
  },
  creditLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  discountBadge: {
    backgroundColor: '#FFE5E2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  discountText: {
    fontSize: 12,
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  perCreditText: {
    fontSize: 12,
    color: '#999',
  },
  infoSection: {
    alignItems: 'center',
  },
  whyCreditsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  whyCreditsText: {
    color: '#FF6F61',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  selectedInfo: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buyButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import HeaderBar from '../../components/HeaderBar';
import { db, auth } from '../../firebase'; // Import Firebase
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'; // Firebase Firestore methods
import { v4 as uuidv4 } from 'uuid'; // Import UUID to generate a random id

export default function AddMoreCreditsScreen({ navigation }) {
  const [selectedCredits, setSelectedCredits] = useState(null);
  const [userCredits, setUserCredits] = useState(0); // Store user's current credits

  // Credit options and prices
  const creditOptions = [
    { credits: 50, price: 200, discount: 0.5, label: '50 Credits', displayPrice: '₱200', discountLabel: '50% OFF', icon: '🪙', mostPopular: false },
    { credits: 80, price: 320, discount: 0.2, label: '80 Credits', displayPrice: '₱320', discountLabel: '20% OFF', icon: '🪙', mostPopular: false },
    { credits: 120, price: 480, discount: 0.3, label: '120 Credits', displayPrice: '₱480', discountLabel: '30% OFF', icon: '🪙', mostPopular: true },
  ];

  const handleSelectCredit = (credits, price, label, discountLabel, displayPrice, icon, mostPopular) => {
    setSelectedCredits({ credits, price, label, discountLabel, displayPrice, icon, mostPopular });
  };

  const handleBuyNow = async () => {
    if (!selectedCredits) {
      Alert.alert('Error', 'Please select a credit package.');
      return;
    }

    // Get the current logged-in user
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You need to be logged in to purchase credits.');
      return;
    }

    try {
      // Get user data from the credits table
      const creditsRef = doc(db, 'credits_tbl', `${user.uid}`);
      const userCreditsDoc = await getDoc(creditsRef);

      if (userCreditsDoc.exists()) {
        // If user has credits already, update the credits value by adding the selected credits
        const currentCredits = userCreditsDoc.data().credits || 0; // Ensure existing credits are not null
        const updatedCredits = currentCredits + selectedCredits.credits;

        // Update the document with new credits value
        await updateDoc(creditsRef, {
          credits: updatedCredits, // Update existing credits
        });

        // Update the state
        setUserCredits(updatedCredits);

        Alert.alert('Success', `You have successfully purchased ${selectedCredits.credits} credits for ${selectedCredits.displayPrice}.`);
        navigation.goBack(); // Go back to the previous screen
      } else {
        // If user doesn't have any credits yet, create a new document
        await setDoc(creditsRef, {
          credits_id: `${user.uid}_${selectedCredits.credits}`,
          credits: selectedCredits.credits,
          user_id: user.uid,
        });

        // Update the state
        setUserCredits(selectedCredits.credits);

        Alert.alert('Success', `You have successfully purchased ${selectedCredits.credits} credits for ${selectedCredits.displayPrice}.`);
        navigation.goBack(); // Go back to the previous screen
      }
    } catch (error) {
      Alert.alert('Error', 'There was an issue processing your purchase. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      <Text style={styles.title}>Add More Credits</Text>
      <Text style={styles.subtitle}>Choose your credit bundle below</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {creditOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.creditCard,
              selectedCredits && selectedCredits.credits === option.credits && styles.selectedCard,
            ]}
            onPress={() => handleSelectCredit(option.credits, option.price, option.label, option.discountLabel, option.displayPrice, option.icon, option.mostPopular)}
          >
            {option.mostPopular && <Text style={styles.mostPopular}>Most Popular</Text>}
            <View style={styles.creditRow}>
              <Text style={styles.icon}>{option.icon}</Text>
              <View style={styles.creditInfo}>
                <Text style={styles.creditLabel}>{option.label}</Text>
                <Text style={styles.discount}>{option.discountLabel}</Text>
              </View>
              <Text style={styles.price}>{option.displayPrice}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Why Credits Button */}
      <TouchableOpacity style={styles.whyCreditsButton} onPress={() => Alert.alert('Why Credits?', 'Credits are used to purchase additional features, services, or premium content within the app. By purchasing credits, you can unlock exclusive functionalities, get discounts, and make the most of what our app has to offer!')}>
        <Text style={styles.whyCreditsText}>Why Credits?</Text>
      </TouchableOpacity>

      {/* Buy Now Button */}
      <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
        <Text style={styles.buyButtonText}>Buy Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 32,
    paddingTop: 104,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#807E84',
    marginBottom: 24,
  },
  creditCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    borderColor: '#ddd',
    borderWidth: 1,
    position: 'relative',
    flexDirection: 'row', // Align items in a row
    alignItems: 'center', // Center items vertically
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  icon: {
    fontSize: 24,
    color: '#FF6F61',
  },
  creditInfo: {
    flex: 1,
    marginLeft: 10,
  },
  creditLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2A32',
  },
  discount: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '500',
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    color: '#FF6F61',
    fontWeight: 'bold',
    marginLeft: 16,
  },
  mostPopular: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF6F61',
    paddingVertical: 6,
    paddingHorizontal: 12,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    borderRadius: 4,
  },
  selectedCard: {
    borderColor: '#FF6F61',
    borderWidth: 2,
  },
  buyButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 15,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  whyCreditsButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  whyCreditsText: {
    color: '#FF6F61',
    fontSize: 14,
    fontWeight: '500',
  },
});

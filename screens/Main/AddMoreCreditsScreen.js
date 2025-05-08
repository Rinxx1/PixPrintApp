import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import HeaderBar from '../../components/HeaderBar'; // assuming you have this component

export default function AddMoreCreditsScreen({ navigation }) {
  const [selectedCredits, setSelectedCredits] = useState(null);

  // Credit options and prices
  const creditOptions = [
    { credits: 50, price: 200, discount: 0.5, label: '50 Credits - 50% OFF', icon: require('../../assets/icon-check.png') },
    { credits: 80, price: 320, discount: 0.2, label: '80 Credits', icon: require('../../assets/icon-check.png') },
    { credits: 120, price: 480, discount: 0.3, label: '120 Credits', icon: require('../../assets/icon-check.png') },
  ];

  const handleSelectCredit = (credits, price, label, discount) => {
    setSelectedCredits({ credits, price, label, discount });
  };

  const handleBuyNow = () => {
    if (!selectedCredits) {
      Alert.alert('Error', 'Please select a credit package.');
    } else {
      Alert.alert('Success', `You have successfully purchased ${selectedCredits.credits} credits for ₱${selectedCredits.price}.`);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      <Text style={styles.title}>Add More Credits</Text>
      <Text style={styles.subtitle}>Select a package to add credits</Text>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {creditOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.creditCard,
              selectedCredits && selectedCredits.credits === option.credits && styles.selectedCard,
            ]}
            onPress={() => handleSelectCredit(option.credits, option.price, option.label, option.discount)}
          >
            <View style={styles.cardContent}>
              <Image source={option.icon} style={styles.creditIcon} />
              <Text style={styles.creditLabel}>{option.label}</Text>
              <Text style={styles.price}>₱{option.price}</Text>
              {option.discount > 0 && (
                <Text style={styles.discount}>{option.discount * 100}% OFF</Text>
              )}
              {selectedCredits && selectedCredits.credits === option.credits && (
                <Text style={styles.selectedText}>Selected</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    padding: 20,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#807E84',
    marginBottom: 24,
  },
  scrollContainer: {
    paddingBottom: 100, // Space for Buy Now button
  },
  creditCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  selectedCard: {
    borderColor: '#FF6F61',
    borderWidth: 2,
  },
  cardContent: {
    alignItems: 'center',
  },
  creditIcon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  creditLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2A32',
  },
  price: {
    fontSize: 16,
    color: '#FF6F61',
    marginTop: 8,
  },
  discount: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '500',
    marginTop: 4,
  },
  selectedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 8,
  },
  buyButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});


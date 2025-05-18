import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image, ScrollView, Alert } from 'react-native';
import { auth, db } from '../../firebase'; // Import Firebase auth and Firestore
import HeaderBar from '../../components/HeaderBar';
import { signOut } from 'firebase/auth'; // Import the signOut method from Firebase
import { collection, query, where, getDocs, onSnapshot, doc } from 'firebase/firestore'; // Firestore methods for querying data

export default function SettingsScreen({ navigation }) {
  const [credits, setCredits] = useState(0); // To store the user's credits
  let unsubscribe; // Declare the unsubscribe variable

  useEffect(() => {
    // Firestore real-time listener to fetch user's credits based on their user_id
    const fetchCredits = async () => {
      const user = auth.currentUser;
      if (user) {
        const creditsRef = collection(db, 'credits_tbl');
        const q = query(creditsRef, where('user_id', '==', user.uid));

        unsubscribe = onSnapshot(q, (querySnapshot) => {
          let totalCredits = 0;
          querySnapshot.forEach(doc => {
            totalCredits += doc.data().credits; // Summing up the credits for the user
          });
          setCredits(totalCredits); // Update the credits state
        });
      }
    };

    fetchCredits(); // Start the listener

    // Clean up the listener when the component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe(); // Unsubscribe from the Firestore listener
      }
    };
  }, []); // Run only once when the component mounts

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Logged Out', 'You have been logged out successfully.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
    } catch (error) {
      Alert.alert('Error', 'There was an issue logging out. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={false} />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Display user's credits */}
        <View style={styles.cardHighlight}>
          <View style={styles.creditsHeader}>
            <Image source={require('../../assets/icon-pix-print.png')} style={styles.creditsIcon} />
            <Text style={styles.creditsText}>
              Pix Credits: <Text style={styles.creditsAmount}>{credits}</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.addCreditsBtn} onPress={() => navigation.navigate('AddMoreCredits')}>
            <Text style={styles.addCreditsText}>Add More Credits</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('PersonalInfo')}>
            <Text style={styles.label}>Profile Information</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('ChangePassword')}>
            <Text style={styles.label}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.itemRow}>
            <Text style={styles.label}>Dark Mode</Text>
            <Switch value={false} />
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.label}>Push Notifications</Text>
            <Switch value={true} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Terms&Condition')}>
            <Text style={styles.label}>Terms & Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('PrivacyPolicy')}>
            <Text style={styles.label}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('HelpSupport')}>
            <Text style={styles.label}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContainer: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  cardHighlight: {
    backgroundColor: '#FFF1EE',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    borderColor: '#FF6F61',
    borderWidth: 1,
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  creditsIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  creditsText: {
    fontSize: 16,
    color: '#2D2A32',
    fontWeight: '600',
  },
  creditsAmount: {
    color: '#FF6F61',
    fontWeight: 'bold',
  },
  addCreditsBtn: {
    backgroundColor: '#FF6F61',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addCreditsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  item: {
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    color: '#2D2A32',
  },
  logoutButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

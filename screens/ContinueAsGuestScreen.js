import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { db } from '../firebase';  // Import Firebase services
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'; // Firestore methods for querying data

export default function ContinueAsGuestScreen({ navigation }) {
  const [eventCode, setEventCode] = useState('');
  const [username, setUsername] = useState('');

  // Function to check if the user has already joined the event
  const checkIfAlreadyJoined = async (eventId, username) => {
    const joinedRef = collection(db, 'joined_tbl');
    const usernameQuery = query(joinedRef, where('event_id', '==', eventId), where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);

    return !usernameSnapshot.empty;
  };

  useEffect(() => {
    const checkUserEvent = async () => {
      if (eventCode.trim() === '') return;

      // Fetch the event using the event code
      const eventRef = collection(db, 'event_tbl');
      const eventQuery = query(eventRef, where('event_code', '==', eventCode));
      const eventSnapshot = await getDocs(eventQuery);

      if (!eventSnapshot.empty) {
        const eventId = eventSnapshot.docs[0].id;
        
        // Check if the user already joined
        if (username.trim() !== '') {
          const isAlreadyJoined = await checkIfAlreadyJoined(eventId, username);
          
          if (isAlreadyJoined) {
            // If already joined, navigate to the event screen directly
            navigation.navigate('JoinEventTwo', { eventId, eventCode, username });
          }
        }
      }
    };

    checkUserEvent(); // Call the function to check if the user is already joined

  }, [eventCode, username, navigation]);

  const handleJoin = async () => {
    if (eventCode.trim() === '') {
      Alert.alert('Error', 'Please enter the event code');
      return;
    }

    // Check if event code is valid in event_tbl
    const eventRef = collection(db, 'event_tbl');
    const q = query(eventRef, where('event_code', '==', eventCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      Alert.alert('Error', 'Invalid event code');
      return;
    }

    // If event code is valid, check if the username is entered
    if (username.trim() === '') {
      Alert.alert('Error', 'Please enter your username');
      return;
    }

    // Get the event ID from the query result
    const eventId = querySnapshot.docs[0].id;

    // Check if the username already exists in joined_tbl for this event
    const joinedRef = collection(db, 'joined_tbl');
    const usernameQuery = query(joinedRef, where('event_id', '==', eventId), where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);

    if (!usernameSnapshot.empty) {
      Alert.alert('Error', 'You have already joined this event with this username');
      return;
    }

    // Add the user to the "joined_tbl" if username is not found
    const newEntry = {
      event_id: eventId,
      joined: true,
      username: username, // Save username if guest
    };

    // Add the document to the "joined_tbl"
    await addDoc(joinedRef, newEntry);

    // Navigate to the JoinEventScreenTwo with event details
    navigation.navigate('JoinEventTwo', { eventId, eventCode, username });
  };

  return (
    <View style={styles.container}>
      {/* Branding */}
      <Image source={require('../assets/icon-pix-print.png')} style={styles.logo} />
      <Text style={styles.title}>PixPrint</Text>
      <Text style={styles.subtitle}>Capture. Print. Celebrate</Text>

      <View style={styles.spacer} />

      {/* Guest Event Join Form */}
      <Text style={styles.heading}>Join Event as Guest</Text>

      <TextInput
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TextInput
        placeholder="Enter Event Code"
        value={eventCode}
        onChangeText={setEventCode}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleJoin}>
        <Text style={styles.buttonText}>Join Event</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: -5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#807E84',
    marginBottom: 48,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderColor: '#DDD',
    borderWidth: 1,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#FF6F61',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    marginTop: 12,
  },
  backText: {
    color: '#807E84',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  spacer: {
    marginVertical: 30,
  },
});

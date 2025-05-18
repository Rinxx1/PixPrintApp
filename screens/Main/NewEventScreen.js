import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import HeaderBar from '../../components/HeaderBar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { auth, db } from '../../firebase'; // Import Firebase services
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from 'firebase/firestore'; // Firestore methods

export default function NewEventScreen({ navigation }) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(null);
  const [eventDescription, setEventDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal for price info
  const [eventPrice, setEventPrice] = useState(50); // Price in credits for the event

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date) => {
    setEventDate(date);
    hideDatePicker();
  };

  const handleChooseFrames = () => {
    // You can replace this with navigation to a "ChooseFrameScreen"
    alert('Open frame selection here!');
  };

  // Fetch user credits from Firestore when the screen loads
  useEffect(() => {
    const fetchUserCredits = async () => {
      const user = auth.currentUser;
      if (user) {
        // Fetch the user's credits from credits_tbl based on their user_id
        const creditsRef = collection(db, 'credits_tbl');
        const q = query(creditsRef, where('user_id', '==', user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          querySnapshot.forEach(doc => {
            setUserCredits(doc.data().credits); // Assuming the field is 'credits'
          });
        } else {
          console.log('No credits data available for this user!');
        }
      }
    };
    fetchUserCredits();
  }, []);

  const handleCreateEvent = async () => {
    if (userCredits >= eventPrice) {
      // Proceed to create event logic here
      Alert.alert('Event Created!', `Event '${eventName}' has been created.`);
      
      // Optionally: Save the event to Firestore
      const user = auth.currentUser;
      if (user) {
        await createEventInFirestore(eventName, eventDate, eventDescription, accessCode, user.uid);

        // Deduct the credits from the user's account after the event is successfully created
        await updateCredits(user.uid, userCredits - eventPrice); // Subtract credits from the user

        navigation.navigate('Tabs');
      }

    } else {
      Alert.alert('Insufficient Credits', 'You don\'t have enough credits to create this event.');
    }
  };

  const createEventInFirestore = async (eventName, eventDate, eventDescription, accessCode, userId) => {
    try {
      // Add the event to the Firestore database
      const eventRef = collection(db, 'event_tbl');
      await addDoc(eventRef, {
        event_name: eventName,
        event_date: eventDate,
        event_description: eventDescription, // Save the description
        user_id: userId,
        event_code: generateEventCode(), // Optional, for generating event code
      });
    } catch (e) {
      console.error('Error creating event: ', e);
    }
  };

  const generateEventCode = () => {
    // Generate a random code or use any logic you prefer for the event code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const updateCredits = async (userId, newCredits) => {
    try {
      const creditsRef = collection(db, 'credits_tbl');
      const q = query(creditsRef, where('user_id', '==', userId));
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach(async (docSnapshot) => {
        const creditDocRef = doc(db, 'credits_tbl', docSnapshot.id); // Get document reference
        await updateDoc(creditDocRef, {
          credits: newCredits, // Update the user's credits
        });
        console.log(`Credits updated for user ${userId}`);
      });
    } catch (e) {
      console.error('Error updating credits: ', e);
    }
  };

  const handleShowModal = () => {
    setIsModalVisible(true); // Show the price modal
  };

  const handleCloseModal = () => {
    setIsModalVisible(false); // Close the price modal
  };

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      <Text style={styles.title}>New Event</Text>
      <Text style={styles.subtitle}>Choose your event details</Text>

      <Text style={styles.label}>Event Name</Text>
      <TextInput
        placeholder="Enter event"
        style={styles.input}
        value={eventName}
        onChangeText={setEventName}
      />

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity onPress={showDatePicker} style={styles.inputWithIcon}>
        <Text style={styles.inputInner}>
          {eventDate ? eventDate.toLocaleDateString() : 'MM/DD/YYYY'}
        </Text>
        <Ionicons name="calendar-outline" size={22} color="#999" />
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />

      <Text style={styles.label}>Event Description</Text>
      <TextInput
        placeholder="Enter event description"
        style={styles.input}
        value={eventDescription}
        onChangeText={setEventDescription}
      />

      <Text style={styles.label}>Access Code</Text>
      <View style={styles.inputWithIcon}>
        <TextInput
          placeholder="Enter code"
          secureTextEntry={secureText}
          style={styles.inputInner}
          value={accessCode}
          onChangeText={setAccessCode}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Ionicons
            name={secureText ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color="#999"
          />
        </TouchableOpacity>
      </View>

      {/* Price Info Button */}
      <TouchableOpacity style={styles.infoButton} onPress={handleShowModal}>
        <Text style={styles.infoText}>How much will this cost?</Text>
      </TouchableOpacity>

      {/* Price Modal */}
      {isModalVisible && (
        <View style={styles.modal}>
          <Text style={styles.modalText}>Event Price: {eventPrice} Credits</Text>
          <Text style={styles.modalText}>Your Credits: {userCredits}</Text>
          <TouchableOpacity style={styles.closeModalButton} onPress={handleCloseModal}>
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleCreateEvent}>
        <Text style={styles.buttonText}>Create Event</Text>
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
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#807E84',
    marginBottom: 24,
  },
  label: {
    color: '#2D2A32',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  inputWithIcon: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputInner: {
    flex: 1,
    fontSize: 16,
  },
  infoButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  infoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modal: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    zIndex: 1,
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2A32',
    marginBottom: 10,
  },
  closeModalButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

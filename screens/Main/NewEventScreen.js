import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import HeaderBar from '../../components/HeaderBar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function NewEventScreen({ navigation }) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(null);
  const [accessCode, setAccessCode] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

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

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={true} />
      <Text style={styles.title}>New Event</Text>

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

      {/* Frame Selection */}
      <TouchableOpacity style={styles.chooseFrameBtn} onPress={() => navigation.navigate('ChooseFrame')}>
        <Ionicons name="images-outline" size={20} color="#FF6F61" />
        <Text style={styles.chooseFrameText}>Choose Frame(s)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
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
  chooseFrameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 16,
  },
  chooseFrameText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF6F61',
    fontWeight: '500',
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

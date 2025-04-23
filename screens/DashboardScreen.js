import React, { useState } from 'react';
import HeaderBar from '../components/HeaderBar';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';

export default function DashboardScreen({ navigation }) {
  const [eventCode, setEventCode] = useState('');
  const username = 'Isay';

  const joinedEvents = [
    {
      id: 1,
      name: "Alice & Bob’s Wedding",
      date: "July 21, 2024",
      image: require('../assets/event-wedding.png'),
    },
    {
      id: 2,
      name: "Rose & John Wedding",
      date: "June 11, 2024",
      image: require('../assets/event-wedding.png'),
    },
    {
      id: 3,
      name: "Rose & John Wedding",
      date: "June 11, 2024",
      image: require('../assets/event-wedding.png'),
    },
    {
      id: 4,
      name: "Rose & John Wedding",
      date: "June 11, 2024",
      image: require('../assets/event-wedding.png'),
    },
    {
      id: 5,
      name: "Rose & John Wedding",
      date: "June 11, 2024",
      image: require('../assets/event-wedding.png'),
    },
    {
      id: 6,
      name: "Rose & John Wedding",
      date: "June 11, 2024",
      image: require('../assets/event-wedding.png'),
    },
  ];

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={false} />

      <View style={styles.content}>
        {/* Greeting */}
        <View style={styles.profileRow}>
          <Image
            source={require('../assets/avatar.png')}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{username}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Create / Join */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('NewEvent')}
        >
          <Text style={styles.primaryText}>Create New Event</Text>
        </TouchableOpacity>

        <Text style={styles.or}>OR</Text>

        <TextInput
          placeholder="Enter Event Code"
          style={styles.input}
          value={eventCode}
          onChangeText={setEventCode}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('JoinEvent')}
        >
          <Text style={styles.primaryText}>Join Event</Text>
        </TouchableOpacity>

        {/* Event List */}
        <Text style={styles.sectionTitle}>Your Events</Text>

        <ScrollView style={styles.eventList} showsVerticalScrollIndicator={false}>
          {joinedEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Image source={event.image} style={styles.eventIcon} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventDate}>{event.date}</Text>
              </View>
              <TouchableOpacity style={styles.checkBtn}>
                <Text style={styles.checkText}>Open</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingTop: 100, // 👈 Leave space for floating header
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#807E84',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D2A32',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  primaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  or: {
    color: '#807E84',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderColor: '#DDD',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginTop: 24,
    marginBottom: 12,
  },
  eventList: {
    paddingBottom: 32,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  eventIcon: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderRadius: 10,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D2A32',
  },
  eventDate: {
    fontSize: 12,
    color: '#807E84',
  },
  checkBtn: {
    backgroundColor: '#FF6F61',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  checkText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

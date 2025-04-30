import React, { useState, useEffect } from 'react';
import HeaderBar from '../../components/HeaderBar';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Animated } from 'react-native';
import { auth, db } from '../../firebase';  // Import Firebase services
import { doc, getDoc } from 'firebase/firestore';  // Add this to fetch user data from Firestore

export default function DashboardScreen({ navigation }) {
  const [eventCode, setEventCode] = useState('');
  const [username, setUsername] = useState('');  // Username state to display
  const [loading, setLoading] = useState(true); // State to handle loading screen
  const rotateAnim = useState(new Animated.Value(0))[0];  // Create animated value for rotation
  
  const joinedEvents = [
    { id: 1, name: "Alice & Bob’s Wedding", date: "July 21, 2024", image: require('../../assets/event-wedding.png') },
    { id: 2, name: "Rose & John Wedding", date: "June 11, 2024", image: require('../../assets/event-wedding.png') },
  ];

  
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'user_tbl', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUsername(docSnap.data().user_firstname); 
        } else {
          console.log('No such document!');
        }
        setLoading(false); 
      }
    };

    fetchUserData();
    
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.Image
          source={require('../../assets/icon-pix-print.png')} 
          style={[
            styles.loadingIcon,
            {
              transform: [
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'], 
                  }),
                },
              ],
            },
          ]}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={false} />
      
      <View style={styles.content}>

        <View style={styles.profileRow}>
          <Image
            source={require('../../assets/avatar.png')}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{username || 'User'}</Text>  
          </View>
        </View>

        <View style={styles.divider} />


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
    paddingTop: 100, 
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
  },
  loadingIcon: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 18,
    color: '#FF6F61',
  },
});


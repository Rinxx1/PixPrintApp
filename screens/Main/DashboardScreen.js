import React, { useState, useEffect } from 'react';
import HeaderBar from '../../components/HeaderBar';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Animated, Alert } from 'react-native';
import { auth, db } from '../../firebase';  // Import Firebase services
import { collection, query, where, getDocs, doc, getDoc, signOut } from 'firebase/firestore'; // Added missing imports

export default function DashboardScreen({ navigation }) {
  const [eventCode, setEventCode] = useState('');
  const [username, setUsername] = useState('');  // Username state to display
  const [userEvents, setUserEvents] = useState([]); // State to store user's events
  const [loading, setLoading] = useState(true); // State to handle loading screen
  const rotateAnim = useState(new Animated.Value(0))[0];  // Create animated value for rotation

  // Fetch user data and user events from Firebase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Fetch username from user_tbl
          const userRef = doc(db, 'user_tbl', user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setUsername(docSnap.data().user_firstname);
          } else {
            console.log('No such document!');
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    const fetchUserEvents = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Fetch events created by the user from event_tbl
          const eventsRef = collection(db, 'event_tbl');
          const q = query(eventsRef, where('user_id', '==', user.uid)); // Query based on user_id
          const querySnapshot = await getDocs(q);

          const events = [];
          querySnapshot.forEach(doc => {
            const data = doc.data();
            // Convert Firestore timestamp to string if it's a timestamp object
            let formattedDate = data.event_date;
            
            // Check if the date is a Firestore timestamp object
            if (data.event_date && typeof data.event_date.toDate === 'function') {
              const dateObj = data.event_date.toDate();
              formattedDate = dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
            }
            
            events.push({
              id: doc.id, // Event ID
              name: data.event_name,
              date: formattedDate,
              image: require('../../assets/event-wedding.png'), // Use the same image or replace dynamically
            });
          });
          setUserEvents(events); // Update state with the fetched events
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false); // Always set loading to false regardless of success or failure
      }
    };

    // Start animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Fetch data
    Promise.all([fetchUserData(), fetchUserEvents()])
      .catch(error => {
        console.error("Error in data fetching:", error);
        setLoading(false); // Ensure loading state is turned off if there's an error
      });
  }, []); // Fetch data on component mount

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

      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.profileRow}>
            <Image source={require('../../assets/avatar.png')} style={styles.avatar} />
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.username}>{username || 'User'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('NewEvent')}>
            <Text style={styles.primaryText}>Create New Event</Text>
          </TouchableOpacity>

          <Text style={styles.or}>OR</Text>

          <TextInput
            placeholder="Enter Event Code"
            style={styles.input}
            value={eventCode}
            onChangeText={setEventCode}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('JoinEvent')}>
            <Text style={styles.primaryText}>Join Event</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Your Events</Text>

          <View style={styles.eventListContainer}>
            {userEvents.length > 0 ? (
              userEvents.map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <Image source={event.image} style={styles.eventIcon} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={styles.eventDate}>{event.date}</Text>
                  </View>
                  <TouchableOpacity
                  style={styles.checkBtn}
                  onPress={() => navigation.navigate('JoinEventTwo', { eventId: event.id })}
                >
                  <Text style={styles.checkText}>Open</Text>
                </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noEventsText}>You haven't created any events yet.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  mainScrollView: {
    flex: 1,
    marginTop: 100,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
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
  eventListContainer: {
    marginBottom: 20,
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
  noEventsText: {
    fontSize: 16,
    color: '#807E84',
    textAlign: 'center',
    marginTop: 20,
  },
});
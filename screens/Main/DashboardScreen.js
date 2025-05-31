import React, { useState, useEffect } from 'react';
import HeaderBar from '../../components/HeaderBar';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Animated,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
  ImageBackground
} from 'react-native';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, signOut, addDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;

export default function DashboardScreen({ navigation }) {
  const [eventCode, setEventCode] = useState('');
  const [username, setUsername] = useState('');
  const [createdEvents, setCreatedEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // Enhanced but minimal animation values for loading
  const rotateAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const fadeInAnim = useState(new Animated.Value(0))[0];
  const dotsAnim = useState(new Animated.Value(0))[0];
  const scrollY = useState(new Animated.Value(0))[0];

  // Animation values
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  // Function to count attendees for a specific event
  const getEventAttendeeCount = async (eventId) => {
    try {
      const joinedRef = collection(db, 'joined_tbl');
      const q = query(joinedRef, where('event_id', '==', eventId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size; // Returns the number of documents (attendees)
    } catch (error) {
      console.error("Error counting attendees:", error);
      return 0;
    }
  };

  // Fetch user data and events from Firebase
  useEffect(() => {
    // Start minimal loading animations
    Animated.parallel([
      // Gentle rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        })
      ),
      // Gentle scale breathing
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
      // Simple dots animation
      Animated.loop(
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ),
      // Fade in
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, 'user_tbl', user.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setUsername(docSnap.data().user_firstname);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    // Updated fetchCreatedEvents function with real attendee count
    const fetchCreatedEvents = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const eventsRef = collection(db, 'event_tbl');
          const q = query(eventsRef, where('user_id', '==', user.uid));
          const querySnapshot = await getDocs(q);

          const events = [];
          
          // Create array of promises to fetch attendee counts
          const eventPromises = [];
          
          querySnapshot.forEach(doc => {
            const data = doc.data();
            const eventId = doc.id;
            
            // Create promise for each event to get attendee count
            const eventPromise = getEventAttendeeCount(eventId).then(attendeeCount => {
              // Format start date
              let formattedStartDate = 'No date specified';
              let startDateObj = null;
              
              if (data.event_start_date && typeof data.event_start_date.toDate === 'function') {
                startDateObj = data.event_start_date.toDate();
                formattedStartDate = startDateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }
              
              // Format end date
              let formattedEndDate = '';
              let dateRangeText = '';
              
              if (data.event_end_date && typeof data.event_end_date.toDate === 'function') {
                const endDateObj = data.event_end_date.toDate();
                
                formattedEndDate = endDateObj.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                
                // Get year from start date
                const eventYear = startDateObj ? startDateObj.getFullYear() : new Date().getFullYear();
                
                // Create a formatted date range
                if (formattedStartDate === formattedEndDate) {
                  // Single day event
                  dateRangeText = `${formattedStartDate}, ${eventYear}`;
                } else {
                  // Multi-day event
                  dateRangeText = `${formattedStartDate} - ${formattedEndDate}, ${eventYear}`;
                }
              } else {
                // Only start date available
                if (startDateObj) {
                  dateRangeText = `${formattedStartDate}, ${startDateObj.getFullYear()}`;
                } else {
                  dateRangeText = formattedStartDate;
                }
              }
              
              return {
                id: eventId,
                name: data.event_name,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                dateRange: dateRangeText,
                code: data.event_code,
                description: data.event_description || 'No description available',
                image: require('../../assets/event-wedding.png'),
                attendees: attendeeCount, // Real attendee count from joined_tbl
              };
            });
            
            eventPromises.push(eventPromise);
          });
          
          // Wait for all attendee counts to be fetched
          const eventsWithAttendees = await Promise.all(eventPromises);
          setCreatedEvents(eventsWithAttendees);
        }
      } catch (error) {
        console.error("Error fetching created events:", error);
      }
    };

    // Updated fetchJoinedEvents function with real attendee count
    const fetchJoinedEvents = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const joinedRef = collection(db, 'joined_tbl');
          const q = query(joinedRef, where('user_id', '==', user.uid));
          const querySnapshot = await getDocs(q);

          const eventPromises = [];
          
          querySnapshot.forEach(joinedDoc => {
            const joinedData = joinedDoc.data();
            const eventId = joinedData.event_id;
            
            const eventPromise = getDoc(doc(db, 'event_tbl', eventId))
              .then(async eventDoc => {
                if (eventDoc.exists()) {
                  const eventData = eventDoc.data();
                  
                  // Get real attendee count for this event
                  const attendeeCount = await getEventAttendeeCount(eventId);
                  
                  // Format start date
                  let formattedStartDate = 'No date specified';
                  let startDateObj = null;
                  
                  if (eventData.event_start_date && typeof eventData.event_start_date.toDate === 'function') {
                    startDateObj = eventData.event_start_date.toDate();
                    formattedStartDate = startDateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }
                  
                  // Format end date
                  let formattedEndDate = '';
                  let dateRangeText = '';
                  
                  if (eventData.event_end_date && typeof eventData.event_end_date.toDate === 'function') {
                    const endDateObj = eventData.event_end_date.toDate();
                    
                    formattedEndDate = endDateObj.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                    
                    // Get year from start date
                    const eventYear = startDateObj ? startDateObj.getFullYear() : new Date().getFullYear();
                    
                    // Create a formatted date range
                    if (formattedStartDate === formattedEndDate) {
                      // Single day event
                      dateRangeText = `${formattedStartDate}, ${eventYear}`;
                    } else {
                      // Multi-day event
                      dateRangeText = `${formattedStartDate} - ${formattedEndDate}, ${eventYear}`;
                    }
                  } else {
                    // Only start date available
                    if (startDateObj) {
                      dateRangeText = `${formattedStartDate}, ${startDateObj.getFullYear()}`;
                    } else {
                      dateRangeText = formattedStartDate;
                    }
                  }
                  
                  return {
                    id: eventDoc.id,
                    name: eventData.event_name,
                    startDate: formattedStartDate,
                    endDate: formattedEndDate,
                    dateRange: dateRangeText,
                    code: eventData.event_code,
                    description: eventData.event_description || 'No description available',
                    image: require('../../assets/event-wedding.png'),
                    joinedId: joinedDoc.id,
                    attendees: attendeeCount, // Real attendee count from joined_tbl
                  };
                }
                return null;
              });
            
            eventPromises.push(eventPromise);
          });
          
          const eventResults = await Promise.all(eventPromises);
          const validEvents = eventResults.filter(event => event !== null);
          
          setJoinedEvents(validEvents);
        }
      } catch (error) {
        console.error("Error fetching joined events:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch data
    Promise.all([fetchUserData(), fetchCreatedEvents(), fetchJoinedEvents()])
      .catch(error => {
        console.error("Error in data fetching:", error);
        setLoading(false);
      });
  }, []);

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

  const handleJoinEvent = async () => {
    if (eventCode.trim() === '') {
      Alert.alert('Error', 'Please enter the event code');
      return;
    }

    try {
      const eventRef = collection(db, 'event_tbl');
      const q = query(eventRef, where('event_code', '==', eventCode));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Error', 'Invalid event code');
        return;
      }

      const eventId = querySnapshot.docs[0].id;

      const joinedRef = collection(db, 'joined_tbl');
      const joinedQuery = query(
        joinedRef, 
        where('event_id', '==', eventId), 
        where('user_id', '==', auth.currentUser.uid)
      );
      const joinedSnapshot = await getDocs(joinedQuery);

      if (!joinedSnapshot.empty) {
        Alert.alert('Already Joined', 'You have already joined this event');
        return;
      }

      const newEntry = {
        event_id: eventId,
        user_id: auth.currentUser.uid,
        username: username || 'Guest',
        joined: true,
      };

      await addDoc(joinedRef, newEntry);
      
      // Success animation or feedback
      Alert.alert('Success', 'You have successfully joined the event!');
      
      // Navigate to the event
      navigation.navigate('JoinEventTwo', { eventId, eventCode });
      
      // Clear the input
      setEventCode('');
      
      // Refresh joined events (optional)
      fetchJoinedEvents();
      
    } catch (error) {
      console.error("Error joining event:", error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const getDisplayedEvents = () => {
    switch (activeTab) {
      case 'created':
        return createdEvents;
      case 'joined':
        return joinedEvents;
      case 'all':
      default:
        return [...createdEvents, ...joinedEvents];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#FFFFFF" />
        
        {/* Minimalist Loading Content */}
        <Animated.View 
          style={[
            styles.loadingContent,
            {
              opacity: fadeInAnim,
            }
          ]}
        >
          {/* Logo with subtle animation */}
          <View style={styles.logoWrapper}>
            <Animated.View
              style={[
                styles.logoGlow,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: 0.1,
                }
              ]}
            />
            <Animated.Image
              source={require('../../assets/icon-pix-print.png')}
              style={[
                styles.loadingIcon,
                {
                  transform: [
                    { scale: scaleAnim },
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }
              ]}
            />
          </View>

          {/* Brand name with elegant typography */}
          <Text style={styles.brandName}>PixPrint</Text>

          {/* Loading text with animated dots */}
          <View style={styles.loadingTextContainer}>
            <Text style={styles.loadingText}>Loading your events</Text>
            <View style={styles.dotsContainer}>
              <Animated.View 
                style={[
                  styles.dot,
                  {
                    opacity: dotsAnim.interpolate({
                      inputRange: [0, 0.25, 0.5, 1],
                      outputRange: [0.3, 1, 0.3, 0.3],
                    }),
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.dot,
                  {
                    opacity: dotsAnim.interpolate({
                      inputRange: [0, 0.25, 0.75, 1],
                      outputRange: [0.3, 0.3, 1, 0.3],
                    }),
                  }
                ]}
              />
              <Animated.View 
                style={[
                  styles.dot,
                  {
                    opacity: dotsAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 0.3, 1],
                    }),
                  }
                ]}
              />
            </View>
          </View>

          {/* Minimal progress indicator */}
          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressDot,
                {
                  transform: [
                    {
                      scaleX: dotsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 8],
                      }),
                    }
                  ],
                }
              ]}
            />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <HeaderBar navigation={navigation} showBack={false} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Welcome Header Section */}
        <Animated.View 
          style={[
            styles.welcomeHeader,
            {
              opacity: headerOpacity,
              transform: [{ scale: headerScale }]
            }
          ]}
        >
          <LinearGradient
            colors={['#FF8D76', '#FF6F61']}
            style={styles.welcomeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.welcomeContent}>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.usernameText}>{username || 'User'}</Text>
                <Text style={styles.welcomeSubtext}>Ready to capture more memories?</Text>
              </View>
              <View style={styles.avatarContainer}>
                <Image source={require('../../assets/avatar.png')} style={styles.avatarLarge} />
                <View style={styles.statusDot}></View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions Section */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('NewEvent')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add-circle-outline" size={24} color="#FF6F61" />
            </View>
            <Text style={styles.actionButtonText}>Create Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Camera')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="camera-outline" size={24} color="#FF6F61" />
            </View>
            <Text style={styles.actionButtonText}>Take Photos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="print-outline" size={24} color="#FF6F61" />
            </View>
            <Text style={styles.actionButtonText}>My Prints</Text>
          </TouchableOpacity>
        </View>

        {/* Join Event Section */}
        <View style={styles.joinEventSection}>
          <Text style={styles.sectionTitle}>Join an Event</Text>
          
          <View style={styles.joinEventForm}>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                placeholder="Enter Event Code"
                style={styles.codeInput}
                value={eventCode}
                onChangeText={setEventCode}
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={handleJoinEvent}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Events Tabs */}
        <View style={styles.eventTabsContainer}>
          <TouchableOpacity
            style={[styles.eventTab, activeTab === 'all' && styles.activeEventTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text 
              style={[
                styles.eventTabText, 
                activeTab === 'all' && styles.activeEventTabText
              ]}
            >
              All Events
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.eventTab, activeTab === 'created' && styles.activeEventTab]}
            onPress={() => setActiveTab('created')}
          >
            <Text 
              style={[
                styles.eventTabText, 
                activeTab === 'created' && styles.activeEventTabText
              ]}
            >
              Created
            </Text>
            {createdEvents.length > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{createdEvents.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.eventTab, activeTab === 'joined' && styles.activeEventTab]}
            onPress={() => setActiveTab('joined')}
          >
            <Text 
              style={[
                styles.eventTabText, 
                activeTab === 'joined' && styles.activeEventTabText
              ]}
            >
              Joined
            </Text>
            {joinedEvents.length > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{joinedEvents.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Events List */}
        <View style={styles.eventsContainer}>
          {getDisplayedEvents().length === 0 ? (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={64} color="#DDD" />
              <Text style={styles.noEventsTitle}>No events found</Text>
              <Text style={styles.noEventsText}>
                {activeTab === 'created' 
                  ? "You haven't created any events yet. Create your first event to get started!"
                  : activeTab === 'joined'
                    ? "You haven't joined any events yet. Join an event using an event code!"
                    : "No events found. Create or join an event to get started!"
                }
              </Text>
              {activeTab === 'created' && (
                <TouchableOpacity 
                  style={styles.createEventButton}
                  onPress={() => navigation.navigate('NewEvent')}
                >
                  <Text style={styles.createEventButtonText}>Create Event</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            getDisplayedEvents().map((event) => (
              <TouchableOpacity 
                key={`${event.id}-${event.joinedId || 'created'}`}
                style={styles.eventCard}
                onPress={() => navigation.navigate('JoinEventTwo', { eventId: event.id })}
              >
                <ImageBackground 
                  source={event.image} 
                  style={styles.eventImageBackground}
                  imageStyle={styles.eventImageStyle}
                >
                  <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
                    style={styles.eventGradient}
                  >
                    <View style={styles.eventTypeTag}>
                      <Text style={styles.eventTypeText}>
                        {event.joinedId ? 'Joined' : 'Created'}
                      </Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
                
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <TouchableOpacity style={styles.moreButton}>
                      <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                  
                  <Text numberOfLines={2} style={styles.eventDescription}>
                    {event.description}
                  </Text>
                  
                  {/* Update this section in the event card */}
                  <View style={styles.eventDetailsRow}>
                    <View style={styles.eventDetail}>
                      <Ionicons name="calendar-outline" size={14} color="#FF6F61" />
                      <Text style={styles.eventDetailText}>{event.dateRange}</Text>
                    </View>
                    
                    <View style={styles.eventDetail}>
                      <Ionicons name="people-outline" size={14} color="#FF6F61" />
                      <Text style={styles.eventDetailText}>{event.attendees} Attendees</Text>
                    </View>
                  </View>
                  
                  <View style={styles.eventFooter}>
                    <View style={styles.codeContainer}>
                      <Text style={styles.codeLabel}>CODE:</Text>
                      <Text style={styles.codeText}>{event.code}</Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.viewButton}
                      onPress={() => navigation.navigate('JoinEventTwo', { eventId: event.id })}
                    >
                      <Text style={styles.viewButtonText}>View</Text>
                      <Ionicons name="chevron-forward" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Floating Create Button (optional) */}
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => navigation.navigate('NewEvent')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Minimalist Loading Styles - Adjusted spacing
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 20, // Reduced from 32
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6F61',
  },
  loadingIcon: {
    width: 64,
    height: 64,
    tintColor: '#FF6F61',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '300',
    color: '#333333',
    marginBottom: 24, // Reduced from 40
    letterSpacing: 1,
  },
  loadingTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // Reduced from 32
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF6F61',
    marginHorizontal: 2,
  },
  progressContainer: {
    width: 80,
    height: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 1,
    overflow: 'hidden',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  progressDot: {
    width: 10,
    height: 2,
    backgroundColor: '#FF6F61',
    borderRadius: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 30,
  },
  welcomeHeader: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  welcomeGradient: {
    padding: 20,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: 'white',
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.65,
    elevation: 2,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  // Join Event Section
  joinEventSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  joinEventForm: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    marginRight: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  codeInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  joinButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Event Tabs
  eventTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    padding: 5,
    marginBottom: 20,
  },
  eventTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    flexDirection: 'row',
  },
  activeEventTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.5,
    elevation: 2,
  },
  eventTabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  activeEventTabText: {
    color: '#333',
    fontWeight: '600',
  },
  badgeContainer: {
    backgroundColor: '#FF6F61',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 6,
  },
  // Events List
  eventsContainer: {
    marginHorizontal: 20,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventImageBackground: {
    height: 140,
  },
  eventImageStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  eventGradient: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 12,
  },
  eventTypeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  eventTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  eventDetailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  eventDetailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
    marginRight: 4,
  },
  codeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6F61',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 4,
  },
  // No Events
  noEventsContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noEventsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noEventsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createEventButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  createEventButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#FF6F61',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  // Add these styles to the StyleSheet
  eventDateDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  calendarIcon: {
    marginRight: 6,
    color: '#FF6F61',
  },
  dateContainer: {
    flexDirection: 'column',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
  },
  dateSubtext: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  durationBadge: {
    backgroundColor: 'rgba(255, 111, 97, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  durationText: {
    fontSize: 10,
    color: '#FF6F61',
    fontWeight: '500',
  },
});

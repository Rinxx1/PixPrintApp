import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Image,
  Animated,
  Dimensions,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';
import JoinEventBottomNavigator from '../../components/JoinEventBottomNavigator';
import { db, auth } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useAlert } from '../../context/AlertContext';

const { width } = Dimensions.get('window');

export default function JoinEventSettings({ route, navigation }) {
  // Extract eventId and guest info from route params
  const { eventId, username: guestUsername } = route.params || {};
  
  // State variables
  const [activeTab, setActiveTab] = useState('settings');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoDownloadEnabled, setAutoDownloadEnabled] = useState(false);
  const [highQualityEnabled, setHighQualityEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Event and user data
  const [eventData, setEventData] = useState(null);
  const [isEventCreator, setIsEventCreator] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [eventMembers, setEventMembers] = useState([]);
  const [currentPhotographers, setCurrentPhotographers] = useState([]); // Changed from single to array
  const [showPhotographerModal, setShowPhotographerModal] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
    // Alert hook
  const { showAlert, showSuccess, showError, showConfirm, showWarning } = useAlert();

  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Initialize data
    if (eventId) {
      initializeEventData();
    } else {
      console.warn('JoinEventSettings: No eventId provided in route params');
      setLoading(false);
    }
  }, [eventId]);

  // Initialize event data and check user permissions
  const initializeEventData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;

      // For guests, we still need to fetch event data even without authentication
      if (!user && !guestUsername) {
        console.warn('No authenticated user and no guest username');
        return;
      }

      if (user) {
        setCurrentUser(user);
      }

      // Fetch event data - this should work for both authenticated users and guests
      const eventRef = doc(db, 'event_tbl', eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        setEventData(data);
        
        // Check if current user is the event creator (only for authenticated users)
        if (user) {
          const isCreator = data.user_id === user.uid;
          setIsEventCreator(isCreator);
          
          if (isCreator) {
            // Fetch event members for photographer selection
            await fetchEventMembers();
            await fetchCurrentPhotographers();
          }
        }      } else {
        showError('Event Not Found', 'The requested event could not be found.');
      }
    } catch (error) {
      console.error('Error initializing event data:', error);
      showError('Error', 'Failed to load event data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch event members from joined_tbl
  const fetchEventMembers = async () => {
    try {
      const joinedRef = collection(db, 'joined_tbl');
      const q = query(
        joinedRef,
        where('event_id', '==', eventId),
        where('joined', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const members = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const joinedData = docSnapshot.data();
        
        // Include all members (both registered users and guests)
        if (joinedData.user_id) {
          // Registered user - fetch from user_tbl
          try {
            const userRef = doc(db, 'user_tbl', joinedData.user_id);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              
              members.push({
                id: docSnapshot.id,
                userId: joinedData.user_id,
                username: joinedData.username || `${userData.user_firstname} ${userData.user_lastname}`,
                email: userData.user_email,
                profileImage: userData.user_profile_image || null,
                isPhotographer: joinedData.isPhotographer || false,
                joinedAt: joinedData.joined_at,
                type: 'registered'
              });
            } else {
              console.warn('User document not found for user_id:', joinedData.user_id);
              // Still add the member with limited info
              members.push({
                id: docSnapshot.id,
                userId: joinedData.user_id,
                username: joinedData.username || 'Unknown User',
                email: 'No email available',
                profileImage: null,
                isPhotographer: joinedData.isPhotographer || false,
                joinedAt: joinedData.joined_at,
                type: 'registered'
              });
            }
          } catch (userError) {
            console.error('Error fetching user data for:', joinedData.user_id, userError);
            // Still add the member with error info
            members.push({
              id: docSnapshot.id,
              userId: joinedData.user_id,
              username: joinedData.username || 'Error Loading User',
              email: 'Error loading email',
              profileImage: null,
              isPhotographer: joinedData.isPhotographer || false,
              joinedAt: joinedData.joined_at,
              type: 'registered'
            });
          }
        } else if (joinedData.username) {
          // Guest user - only has username
          members.push({
            id: docSnapshot.id,
            userId: null,
            username: joinedData.username,
            email: 'Guest user',
            profileImage: null,
            isPhotographer: joinedData.isPhotographer || false,
            joinedAt: joinedData.joined_at,
            type: 'guest'
          });
        }
      }
      
      setEventMembers(members);    } catch (error) {
      console.error('Error fetching event members:', error);
      showError('Error', 'Failed to load event members. Please try again.');
    }
  };

  // Fetch current photographers (multiple)
  const fetchCurrentPhotographers = async () => {
    try {
      const joinedRef = collection(db, 'joined_tbl');
      const q = query(
        joinedRef,
        where('event_id', '==', eventId),
        where('isPhotographer', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const photographers = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const photographerData = docSnapshot.data();
        
        // Fetch photographer user details
        if (photographerData.user_id) {
          try {
            const userRef = doc(db, 'user_tbl', photographerData.user_id);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              photographers.push({
                id: docSnapshot.id,
                userId: photographerData.user_id,
                username: photographerData.username || `${userData.user_firstname} ${userData.user_lastname}`,
                email: userData.user_email,
                profileImage: userData.user_profile_image || null
              });
            }
          } catch (error) {
            console.error('Error fetching photographer user data:', error);
          }
        }
      }
      setCurrentPhotographers(photographers);
    } catch (error) {
      console.error('Error fetching current photographers:', error);
    }
  };
  // Assign photographer
  const assignPhotographer = async (member) => {
    try {      // Check if member is already a photographer
      const isAlreadyPhotographer = currentPhotographers.some(p => p.userId === member.userId);
      
      if (isAlreadyPhotographer) {
        showAlert({
          title: 'Already Assigned',
          message: `${member.username} is already assigned as a photographer for this event.`,
          type: 'info',
          buttons: [{ text: 'OK', style: 'default' }]
        });
        return;
      }

      showConfirm(
        'Add Photographer',
        `Are you sure you want to add ${member.username} as an event photographer?\n\nThis will give them special photography privileges for this event.`,
        async () => {
          setLoading(true);
          
          try {
            // Assign new photographer (don't remove existing ones)
            const memberRef = doc(db, 'joined_tbl', member.id);
            await updateDoc(memberRef, {
              isPhotographer: true
            });
            
            // Update local state - add to photographers array
            const newPhotographer = {
              id: member.id,
              userId: member.userId,
              username: member.username,
              email: member.email,
              profileImage: member.profileImage
            };
            
            setCurrentPhotographers(prev => [...prev, newPhotographer]);
            
            // Update event members state
            setEventMembers(prevMembers => 
              prevMembers.map(m => 
                m.id === member.id ? { ...m, isPhotographer: true } : m
              )
            );
            
            setShowPhotographerModal(false);
            
            showSuccess(
              'Photographer Added! 🎉',
              `${member.username} has been added as an event photographer!`
            );
            
          } catch (error) {
            console.error('Error assigning photographer:', error);
            showError(
              'Assignment Failed',
              'Failed to assign photographer. Please try again.'
            );
          } finally {
            setLoading(false);
          }
        }
      );
    } catch (error) {
      console.error('Error in assignPhotographer:', error);
    }
  };  // Remove photographer
  const removePhotographer = async (photographer) => {
    console.log('removePhotographer called with:', photographer);
    showWarning(
      'Remove Photographer',
      `Are you sure you want to remove ${photographer.username} as an event photographer?`,
      async () => {
        console.log('User confirmed removal of photographer:', photographer.username);
        try {
          setLoading(true);
          
          const photographerRef = doc(db, 'joined_tbl', photographer.id);
          console.log('Updating photographer document:', photographer.id);
          await updateDoc(photographerRef, {
            isPhotographer: false
          });
          console.log('Successfully updated photographer document');
          
          // Update local state - remove from photographers array
          setCurrentPhotographers(prev => {
            const updated = prev.filter(p => p.id !== photographer.id);
            console.log('Updated photographers list:', updated);
            return updated;
          });
          
          // Update event members state
          setEventMembers(prevMembers => 
            prevMembers.map(m => 
              m.id === photographer.id ? { ...m, isPhotographer: false } : m
            )
          );
          
          showSuccess(
            'Photographer Removed',
            `${photographer.username} has been removed as a photographer.`
          );
          
        } catch (error) {
          console.error('Error removing photographer:', error);
          showError(
            'Removal Failed',
            'Failed to remove photographer. Please try again.'
          );
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Render photographer selection modal - Updated for better sizing
  const renderPhotographerModal = () => (
    <Modal
      visible={showPhotographerModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPhotographerModal(false)}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Photographers</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPhotographerModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Subtitle */}
          <View>
            <Text style={styles.modalSubtitle}>
              Choose members to assign as event photographers
            </Text>
            {/* {currentPhotographers.length > 0 && (
              <Text style={styles.modalInfo}>
                Currently assigned: {currentPhotographers.length} photographer{currentPhotographers.length !== 1 ? 's' : ''}
              </Text>
            )} */}
          </View>
          
          {/* Members List */}
          <FlatList
            data={eventMembers.filter(member => {
              const isNotCurrentUser = member.userId !== currentUser?.uid;
              const isRegistered = member.type === 'registered';
              const isNotAlreadyPhotographer = !currentPhotographers.some(p => p.userId === member.userId);
              
              return isNotCurrentUser && isRegistered && isNotAlreadyPhotographer;
            })}
            keyExtractor={(item) => item.id}
            style={styles.membersList}
            contentContainerStyle={{ flexGrow: 1 }} // Ensure content grows
            showsVerticalScrollIndicator={true}
            renderItem={({ item: member }) => (
              <TouchableOpacity
                style={styles.memberItem}
                onPress={() => assignPhotographer(member)}
                activeOpacity={0.7} // Add touch feedback
              >
                <Image
                  source={
                    member.profileImage 
                      ? { uri: member.profileImage }
                      : require('../../assets/avatar.png')
                  }
                  style={styles.memberAvatar}
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.username}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Ionicons name="people-outline" size={48} color="#CCC" />
                <Text style={styles.emptyListText}>
                  {currentPhotographers.length === eventMembers.filter(m => m.type === 'registered' && m.userId !== currentUser?.uid).length 
                    ? 'All members are photographers'
                    : 'No available members'
                  }
                </Text>
                <Text style={styles.emptyListSubtext}>
                  {currentPhotographers.length === eventMembers.filter(m => m.type === 'registered' && m.userId !== currentUser?.uid).length 
                    ? 'All registered members have already been assigned as photographers.'
                    : 'Only registered users can be assigned as photographers.'
                  }
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );  // Handle create account for guests
  const handleCreateAccount = () => {
    showConfirm(
      'Create Your PixPrint Account',
      `Hi ${guestUsername}! Create an account to:\n\n✓ Save events\n✓ Access your photos\n✓ Manage your events\n✓ Track your memories\n\nYour current info is safe.`,
      () => {
        navigation.navigate('SignUp', { 
          guestUsername, 
          eventId,
          fromGuestSettings: true 
        });
      }
    );
  };

  // Add other action handlers
  const handleDownloadPhotos = () => {
    navigation.navigate('DownloadPhotos', { eventId });
  };

  const handleShareEvent = () => {
    navigation.navigate('ShareEvent', { eventId });
  };

  const handleOrderPrints = () => {
    navigation.navigate('OrderPrints', { eventId });
  };
  const handleLeaveEvent = () => {
    showWarning(
      'Leave Event',
      'Are you sure you want to leave this event?',
      () => {
        navigation.navigate('Events');
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Loading event settings...</Text>
      </View>
    );
  }

  const isGuest = guestUsername && !auth.currentUser;

  return (
    <View style={styles.container}>
      <HeaderBar 
        navigation={navigation} 
        showBack={false}
        showDashboard={true}
        guestUsername={guestUsername}
      />
      
      {/* Background Elements */}
      <View style={styles.backgroundElements}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.profileContainer}>
            <Image 
              source={require('../../assets/avatar.png')} 
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {currentUser?.displayName || guestUsername || 'User'}
              </Text>
              <View style={[
                styles.statusBadge,
                isGuest && styles.guestStatusBadge
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isGuest ? '#FF9800' : '#4CD964' }
                ]} />
                <Text style={[
                  styles.statusText,
                  isGuest && styles.guestStatusText
                ]}>
                  {isGuest ? 'Guest User' : 
                   isEventCreator ? 'Event Creator' : 'Event Attendee'}
                </Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.title}>Event Settings</Text>
          <Text style={styles.eventName}>
            {eventData?.event_name || 'Event Name'}
          </Text>
        </Animated.View>

        {/* Guest Account Creation Section */}
        {isGuest && (
          <Animated.View 
            style={[
              styles.settingsCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.settingHeader}>
              <Ionicons name="person-add" size={22} color="#FF6F61" />
              <Text style={styles.settingTitle}>Create Your Account</Text>
            </View>
            
            <View style={styles.accountCreationSection}>
              <View style={styles.guestInfoContainer}>
                <Ionicons name="information-circle" size={32} color="#FF9800" />
                <View style={styles.guestInfoText}>
                  <Text style={styles.guestInfoTitle}>You're browsing as a guest</Text>
                  <Text style={styles.guestInfoDescription}>
                    Create an account to save this event to your dashboard and access all your photos anytime!
                  </Text>
                </View>
              </View>
              
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>Save events to your personal dashboard</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>Access your photos from any device</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>Create and manage your own events</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.benefitText}>Keep all your memories organized</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={handleCreateAccount}
              >
                <LinearGradient
                  colors={['#FF8D76', '#FF6F61']}
                  style={styles.createAccountGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="person-add" size={20} color="#FFFFFF" />
                  <Text style={styles.createAccountButtonText}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <Text style={styles.guestContinueText}>
                You can continue as a guest, but your event access will be limited to this session.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Event Creator Section - Photographer Management */}
        {isEventCreator && (
          <Animated.View 
            style={[
              styles.settingsCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.settingHeader}>
              <Ionicons name="camera" size={22} color="#FF6F61" />
              <View style={styles.titleContainer}>
                <Text style={styles.settingTitle}>Photographer Management</Text>
                {currentPhotographers.length > 0 && (
                  <View style={styles.photographerCount}>
                    {/* <Text style={styles.photographerCountText}>
                      {currentPhotographers.length} assigned
                    </Text> */}
                  </View>
                )}
              </View>
            </View>
            
            {currentPhotographers.length > 0 ? (
              <View style={styles.photographerSection}>
                <Text style={styles.sectionLabel}>
                  Current Photographers ({currentPhotographers.length})
                </Text>
                
                {/* List all photographers */}
                {currentPhotographers.map((photographer, index) => (
                  <View key={photographer.id} style={styles.currentPhotographer}>
                    <Image
                      source={
                        photographer.profileImage 
                          ? { uri: photographer.profileImage }
                          : require('../../assets/avatar.png')
                      }
                      style={styles.photographerAvatar}
                    />
                    <View style={styles.photographerInfo}>
                      <Text style={styles.photographerName}>
                        {photographer.username}
                      </Text>
                      <Text style={styles.photographerEmail}>
                        {photographer.email}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removePhotographer(photographer)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noPhotographer}>
                <Ionicons name="camera-outline" size={32} color="#CCC" />
                <Text style={styles.noPhotographerText}>No photographers assigned</Text>
                <Text style={styles.noPhotographerSubtext}>
                  Add photographers to help capture your event
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => setShowPhotographerModal(true)}
            >
              <Ionicons name="person-add" size={20} color="#FF6F61" />
              <Text style={styles.assignButtonText}>
                {currentPhotographers.length > 0 ? 'Add More Photographers' : 'Assign Photographers'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        
        {/* Notification Settings */}
        <Animated.View 
          style={[
            styles.settingsCard,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }],
              marginTop: isEventCreator ? 16 : 0
            }
          ]}
        >
          <View style={styles.settingHeader}>
            <Ionicons name="notifications" size={22} color="#FF6F61" />
            <Text style={styles.settingTitle}>Notifications</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Event Updates</Text>
              <Text style={styles.settingDescription}>Get notified about changes to this event</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => setNotificationsEnabled(value)}
              trackColor={{ false: '#E5E5E5', true: 'rgba(255, 111, 97, 0.4)' }}
              thumbColor={notificationsEnabled ? '#FF6F61' : '#F5F5F5'}
            />
          </View>
        </Animated.View>
        
        {/* Media Settings */}
        <Animated.View 
          style={[
            styles.settingsCard,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }],
              marginTop: 16 
            }
          ]}
        >
          <View style={styles.settingHeader}>
            <Ionicons name="image" size={22} color="#FF6F61" />
            <Text style={styles.settingTitle}>Media</Text>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Auto-Download Photos</Text>
              <Text style={styles.settingDescription}>Automatically save photos to your gallery</Text>
            </View>
            <Switch
              value={autoDownloadEnabled}
              onValueChange={(value) => setAutoDownloadEnabled(value)}
              trackColor={{ false: '#E5E5E5', true: 'rgba(255, 111, 97, 0.4)' }}
              thumbColor={autoDownloadEnabled ? '#FF6F61' : '#F5F5F5'}
            />
          </View>
          
          <View style={[styles.settingRow, styles.borderTop]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>High Quality Images</Text>
              <Text style={styles.settingDescription}>Download full resolution photos (uses more data)</Text>
            </View>
            <Switch
              value={highQualityEnabled}
              onValueChange={(value) => setHighQualityEnabled(value)}
              trackColor={{ false: '#E5E5E5', true: 'rgba(255, 111, 97, 0.4)' }}
              thumbColor={highQualityEnabled ? '#FF6F61' : '#F5F5F5'}
            />
          </View>
        </Animated.View>
        
        {/* Quick Actions */}
        <Animated.View 
          style={[
            styles.settingsCard,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }],
              marginTop: 16 
            }
          ]}
        >
          <View style={styles.settingHeader}>
            <Ionicons name="flash" size={22} color="#FF6F61" />
            <Text style={styles.settingTitle}>Quick Actions</Text>
          </View>
          
          {!isGuest && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={handleDownloadPhotos}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="download-outline" size={22} color="#555555" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>Download All Photos</Text>
                  <Text style={styles.actionDescription}>Save all event photos to your gallery</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, styles.borderTop]} onPress={handleShareEvent}>
                <View style={styles.actionIconContainer}>
                  <Ionicons name="share-social-outline" size={22} color="#555555" />
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionLabel}>Share Event</Text>
                  <Text style={styles.actionDescription}>Invite others to join this event</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
              </TouchableOpacity>
            </>
          )}
          
          {isGuest && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCreateAccount}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="person-add-outline" size={22} color="#555555" />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionLabel}>Create Account</Text>
                <Text style={styles.actionDescription}>Save this event and access more features</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {/* Event Options */}
        <Animated.View 
          style={[
            styles.settingsCard,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }],
              marginTop: 16 
            }
          ]}
        >
          <View style={styles.settingHeader}>
            <Ionicons name="options" size={22} color="#FF6F61" />
            <Text style={styles.settingTitle}>Event Options</Text>
          </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleOrderPrints}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="print-outline" size={22} color="#555555" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Order Prints</Text>
              <Text style={styles.actionDescription}>Get physical copies of your photos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.borderTop]} 
            onPress={handleLeaveEvent}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>Leave Event</Text>
              <Text style={styles.actionDescription}>Remove yourself from this event</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#AAAAAA" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Bottom padding for scroll view */}
        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Bottom Navigation */}
      <JoinEventBottomNavigator 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        eventId={eventId}
        navigation={navigation}
        guestUsername={guestUsername} // Pass guest info
      />

      {/* Photographer Selection Modal */}
      {renderPhotographerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle1: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(255, 111, 97, 0.08)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(255, 141, 118, 0.06)',
    bottom: width * 0.1,
    left: -width * 0.1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CD964',
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#2E8540',
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  eventName: {
    fontSize: 16,
    color: '#666',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingTitle: {
    marginLeft: 8,
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    paddingRight: 20,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: '#888',
  },
  
  // Photographer Management Styles
  photographerSection: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  currentPhotographer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  photographerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  photographerInfo: {
    flex: 1,
  },
  photographerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  photographerEmail: {
    fontSize: 13,
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
  noPhotographer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  noPhotographerText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0EF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  assignButtonText: {
    fontSize: 16,
    color: '#FF6F61',
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Modal Styles - Fixed for proper full size
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40, // Add vertical padding
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%', // Increased from 70% to 85%
    minHeight: '60%', // Add minimum height
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden', // Ensure content doesn't overflow
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15, // Increased padding
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF', // Ensure header has background
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
    backgroundColor: '#F6F6F6',
    borderRadius: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 15, // Increased padding
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
    backgroundColor: '#FFFFFF', // Ensure subtitle has background
  },
  membersList: {
    flex: 1, // Take remaining space
    backgroundColor: '#FFFFFF',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15, // Increased padding
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  memberItemActive: {
    backgroundColor: '#FFF8F7',
  },
  memberAvatar: {
    width: 50, // Slightly larger
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600', // Slightly bolder
    color: '#333',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14, // Slightly larger
    color: '#666',
  },
  photographerBadge: {
    backgroundColor: '#FFF0EF',
    borderRadius: 16,
    padding: 8, // Increased padding
    marginRight: 12,
  },
  emptyList: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60, // Increased padding
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyListSubtext: {
    fontSize: 14,
    color: '#AAA',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Add guest badge style if missing
  guestBadge: {
    fontSize: 12,
    color: '#FF6F61',
    backgroundColor: '#FFF0EF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  guestStatusBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
  },
  guestStatusText: {
    color: '#F57C00',
  },
  accountCreationSection: {
    padding: 20,
  },
  guestInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.2)',
  },
  guestInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  guestInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  guestInfoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  benefitsList: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  createAccountButton: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createAccountGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  guestContinueText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
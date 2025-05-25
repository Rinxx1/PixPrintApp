import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Modal,
  Animated,
  Dimensions,
  ImageBackground
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function JoinEventScreenTwo({ route, navigation }) {
  // State variables
  const [eventName, setEventName] = useState(''); 
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('person');
  const [activeTab, setActiveTab] = useState('gallery');
  const [eventCode, setEventCode] = useState('');
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.6],
    extrapolate: 'clamp'
  });
  
  // Image grids for different categories
  const personImages = [
    { id: 1, imageUrl: require('../../assets/avatar.png') },
    { id: 2, imageUrl: require('../../assets/avatar.png') },
    { id: 3, imageUrl: require('../../assets/avatar.png') },
    { id: 4, imageUrl: require('../../assets/avatar.png') },
    { id: 5, imageUrl: require('../../assets/avatar.png') },
    { id: 6, imageUrl: require('../../assets/avatar.png') },
    { id: 7, imageUrl: require('../../assets/avatar.png') },
    { id: 8, imageUrl: require('../../assets/avatar.png') },
    { id: 9, imageUrl: require('../../assets/avatar.png') },
  ];

  const cameraImages = [
    { id: 1, imageUrl: require('../../assets/avatar.png') },
    { id: 2, imageUrl: require('../../assets/avatar.png') },
    { id: 3, imageUrl: require('../../assets/avatar.png') },
    { id: 4, imageUrl: require('../../assets/avatar.png') },
    { id: 5, imageUrl: require('../../assets/avatar.png') },
    { id: 6, imageUrl: require('../../assets/avatar.png') },
    { id: 7, imageUrl: require('../../assets/avatar.png') },
    { id: 8, imageUrl: require('../../assets/avatar.png') },
    { id: 9, imageUrl: require('../../assets/avatar.png') },
  ];

  const groupImages = [
    { id: 1, imageUrl: require('../../assets/avatar.png') },
    { id: 2, imageUrl: require('../../assets/avatar.png') },
    { id: 3, imageUrl: require('../../assets/avatar.png') },
    { id: 4, imageUrl: require('../../assets/avatar.png') },
    { id: 5, imageUrl: require('../../assets/avatar.png') },
    { id: 6, imageUrl: require('../../assets/avatar.png') },
    { id: 7, imageUrl: require('../../assets/avatar.png') },
    { id: 8, imageUrl: require('../../assets/avatar.png') },
    { id: 9, imageUrl: require('../../assets/avatar.png') },
  ];

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Fetch event details from Firestore
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const { eventId } = route.params;
        
        if (!eventId) {
          console.error("No event ID provided");
          setLoading(false);
          return;
        }

        const eventRef = doc(db, 'event_tbl', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          
          setEventName(eventData.event_name || 'Unnamed Event');
          setEventCode(eventData.event_code || ''); // Added this line to get the event code
          
          if (eventData.event_date && typeof eventData.event_date.toDate === 'function') {
            const dateObj = eventData.event_date.toDate();
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
            setEventDate(formattedDate);
          } else {
            setEventDate(eventData.event_date || 'No date specified');
          }
          
          setEventDescription(eventData.event_description || 'No description available');
        } else {
          console.log('No such event document!');
          setEventName('Event Not Found');
          setEventDate('');
          setEventDescription('The requested event could not be found.');
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [route.params]);

  // Determine which set of images to display based on selected category
  let images = [];
  let galleryTitle = '';

  if (selectedCategory === 'person') {
    images = personImages;
    galleryTitle = 'People';
  } else if (selectedCategory === 'camera') {
    images = cameraImages;
    galleryTitle = 'Photos';
  } else if (selectedCategory === 'group') {
    images = groupImages;
    galleryTitle = 'Groups';
  }

  // Handle the image click
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalVisible(true);
  };

  // Close the modal
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
  };

  // Update tab selection
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'camera') {
      navigation.navigate('Camera');
    } else if (tab === 'list') {
      // Handle list view or navigation
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={false} />

      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Event Cover with Animated Parallax Effect */}
        <Animated.View style={[styles.coverContainer, { opacity: imageOpacity }]}>
          <ImageBackground
            source={require('../../assets/avatar.png')}
            style={styles.coverImage}
            resizeMode="cover"
          >
            <View style={styles.coverOverlay}>
              <View style={styles.eventStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active Event</Text>
              </View>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* Event Info Card */}
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{eventName}</Text>
              {eventCode && (
                <View style={styles.eventCodeBadge}>
                  <Ionicons name="key-outline" size={14} color="#FF6F61" />
                  <Text style={styles.eventCodeText}>{eventCode}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-social" size={20} color="#FF6F61" />
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color="#FF6F61" />
            <Text style={styles.date}>{eventDate}</Text>
          </View>

          <View style={styles.separator} />
          
          <Text style={styles.description}>{eventDescription}</Text>

          <View style={styles.eventStats}>
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={18} color="#FF6F61" />
              <Text style={styles.statValue}>California</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={18} color="#FF6F61" />
              <Text style={styles.statValue}>254 Going</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#FF6F61" />
              <Text style={styles.statValue}>7PM - 11PM</Text>
            </View>
          </View>
        </View>

        {/* Gallery Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Event Gallery</Text>
          <Text style={styles.photosCount}>{images.length} Photos</Text>
        </View>

        {/* Category Selector */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity 
            style={[styles.categoryTab, selectedCategory === 'person' && styles.selectedCategoryTab]}
            onPress={() => handleCategoryChange('person')}
          >
            <Ionicons 
              name="grid-outline" 
              size={20} 
              color={selectedCategory === 'person' ? '#FFFFFF' : '#666666'} 
            />
            <Text 
              style={[
                styles.categoryText, 
                selectedCategory === 'person' && styles.selectedCategoryText
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.categoryTab, selectedCategory === 'camera' && styles.selectedCategoryTab]}
            onPress={() => handleCategoryChange('camera')}
          >
            <Ionicons 
              name="camera" 
              size={20} 
              color={selectedCategory === 'camera' ? '#FFFFFF' : '#666666'} 
            />
            <Text 
              style={[
                styles.categoryText, 
                selectedCategory === 'camera' && styles.selectedCategoryText
              ]}
            >
              Photographer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.categoryTab, selectedCategory === 'group' && styles.selectedCategoryTab]}
            onPress={() => handleCategoryChange('group')}
          >
            <Ionicons 
              name="person" 
              size={20} 
              color={selectedCategory === 'group' ? '#FFFFFF' : '#666666'} 
            />
            <Text 
              style={[
                styles.categoryText, 
                selectedCategory === 'group' && styles.selectedCategoryText
              ]}
            >
              Me
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gallery Title */}
        <View style={styles.galleryHeader}>
          <Text style={styles.galleryTitle}>{galleryTitle}</Text>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="chevron-forward" size={16} color="#FF6F61" />
          </TouchableOpacity>
        </View>

        {/* Image Gallery Grid - Instagram Style */}
        <View style={styles.instaGrid}>
          {[0, 3, 6].map((rowStart, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.instaGridRow}>
              {rowStart === 0 ? (
                // First row with one large and two small
                <>
                  <TouchableOpacity
                    style={styles.instaMainImage}
                    onPress={() => images[0]?.imageUrl && handleImageClick(images[0].imageUrl)}
                  >
                    <Image 
                      source={images[0]?.imageUrl} 
                      style={styles.eventImage}
                      resizeMode="cover" 
                    />
                  </TouchableOpacity>
                  <View style={styles.instaSecondaryColumn}>
                    <TouchableOpacity
                      style={styles.instaSecondaryImage}
                      onPress={() => images[1]?.imageUrl && handleImageClick(images[1].imageUrl)}
                    >
                      <Image 
                        source={images[1]?.imageUrl} 
                        style={styles.eventImage} 
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.instaSecondaryImage}
                      onPress={() => images[2]?.imageUrl && handleImageClick(images[2].imageUrl)}
                    >
                      <Image 
                        source={images[2]?.imageUrl} 
                        style={styles.eventImage} 
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // Other rows with three equal images
                <>
                  {[0, 1, 2].map((colIndex) => {
                    const imageIndex = rowStart + colIndex;
                    return (
                      <TouchableOpacity
                        key={`image-${imageIndex}`}
                        style={styles.instaEqualImage}
                        onPress={() => 
                          images[imageIndex]?.imageUrl && 
                          handleImageClick(images[imageIndex].imageUrl)
                        }
                      >
                        <Image 
                          source={images[imageIndex]?.imageUrl} 
                          style={styles.eventImage} 
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </View>
          ))}
        </View>

        {/* Bottom Space for Navigator */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={closeModal}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={selectedImage} style={styles.modalImage} />
          
          <View style={styles.modalControls}>
            <TouchableOpacity style={styles.modalControlButton}>
              <Ionicons name="heart-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalControlButton, styles.modalControlButton]}>
              <Ionicons name="print-outline" size={24} color="#fff" />
 
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalControlButton}>
              <Ionicons name="share-social-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalControlButton}>
              <Ionicons name="download-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Enhanced Floating Bottom Navigator - Icon Only */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          {/* Gallery Tab */}
          <TouchableOpacity 
            style={styles.navTab} 
            onPress={() => handleTabChange('gallery')}
          >
            <View style={[styles.navIcon, activeTab === 'gallery' && styles.activeNavIcon]}>
              <Ionicons 
                name="images" 
                size={24} 
                color={activeTab === 'gallery' ? '#FF6F61' : '#8E8E93'} 
              />
            </View>
            {activeTab === 'gallery' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          {/* Camera Tab - Special Highlighted Design */}
          <TouchableOpacity 
            style={styles.cameraTab} 
            onPress={() => handleTabChange('camera')}
          >
            <LinearGradient
              colors={['#FF8D76', '#FF6F61']}
              style={styles.cameraButton}
            >
              <Ionicons 
                name="camera" 
                size={26} 
                color="#FFFFFF" 
              />
            </LinearGradient>
            {activeTab === 'camera' && <View style={styles.cameraIndicator} />}
          </TouchableOpacity>

          {/* Settings Tab */}
          <TouchableOpacity 
            style={styles.navTab} 
            onPress={() => handleTabChange('settings')}
          >
            <View style={[styles.navIcon, activeTab === 'settings' && styles.activeNavIcon]}>
              <Ionicons 
                name="settings" 
                size={24} 
                color={activeTab === 'settings' ? '#FF6F61' : '#8E8E93'} 
              />
            </View>
            {activeTab === 'settings' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 104,
  },
  scrollContent: {
    paddingTop: 10,
  },
  // Cover Image Styles
  coverContainer: {
    height: 220,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  coverImage: {
    height: '100%',
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    justifyContent: 'flex-end',
    padding: 15,
  },
  eventStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CD964',
    marginRight: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Event Card Styles
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  eventCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  eventCodeText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '600',
    marginLeft: 5,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    marginBottom: 16,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    marginLeft: 6,
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E5E5E5',
  },
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  photosCount: {
    fontSize: 14,
    color: '#888',
  },
  // Category Selector Styles
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#F0F2F5',
    borderRadius: 30,
    padding: 4,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
    flex: 1,
  },
  selectedCategoryTab: {
    backgroundColor: '#FF6F61',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Gallery Header Styles
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  galleryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '500',
  },
  // Image Grid Styles
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  imageContainer: {
    width: (width - 48) / 3,
    aspectRatio: 1,
    marginRight: 4,
    marginBottom: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  largeImageContainer: {
    width: (width - 44) / 2,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  largeEventImage: {
    height: '100%',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalControls: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 30,
    justifyContent: 'center',
  },
  modalControlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  // Loading
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
  
  // Keeping the original bottom navigator styles
  bottomNavContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 66,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeNavIcon: {
    backgroundColor: 'rgba(255, 111, 97, 0.12)',
    transform: [{ scale: 1.1 }],
  },
  cameraTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative',
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6F61',
  },
  cameraIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6F61',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  // Instagram-style grid
  instaGrid: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  instaGridRow: {
    flexDirection: 'row',
    height: width * 0.3,
    marginBottom: 4,
  },
  instaMainImage: {
    width: '66%',
    height: '100%',
    borderRadius: 12,
    marginRight: 4,
    overflow: 'hidden',
  },
  instaSecondaryColumn: {
    width: '33%',
    height: '100%',
    justifyContent: 'space-between',
  },
  instaSecondaryImage: {
    width: '100%',
    height: '49%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  instaEqualImage: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0', // Placeholder color
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  printText: {
    color: '#fff',
    marginLeft: 5,
  },
});

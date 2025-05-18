import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import HeaderBar from '../../components/HeaderBar';
import { db } from '../../firebase';  // Import Firebase services
import { doc, getDoc } from 'firebase/firestore'; // Firestore methods for querying data

export default function JoinEventScreenTwo({ route, navigation }) {
  // State for event details
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // State to store selected image for full view
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility for full image view
  const [selectedCategory, setSelectedCategory] = useState('person'); // State to track selected category

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

  // State for selected category (person, camera, group)
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // Fetch event details from Firestore using the event ID from route params
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        // Get the event ID from route params
        const { eventId } = route.params;
        
        if (!eventId) {
          console.error("No event ID provided");
          setLoading(false);
          return;
        }

        // Fetch event details from Firestore
        const eventRef = doc(db, 'event_tbl', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          
          // Set event details
          setEventName(eventData.event_name || 'Unnamed Event');
          
          // Format date if it's a timestamp
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
  let galleryTitle = 'Event Gallery'; // Default title for "person" category

  if (selectedCategory === 'person') {
    images = personImages;
    galleryTitle = 'Person Gallery'; // Title for the "person" category
  } else if (selectedCategory === 'camera') {
    images = cameraImages;
    galleryTitle = 'Camera Gallery'; // Title for the "camera" category
  } else if (selectedCategory === 'group') {
    images = groupImages;
    galleryTitle = 'Group Gallery'; // Title for the "group" category
  }

  // Handle the image click to show in full width
  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);  // Set the selected image for modal
    setIsModalVisible(true);     // Show modal
  };

  // Close the modal
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedImage(null);
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
      <HeaderBar navigation={navigation} showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{eventName}</Text>
          <Text style={styles.date}>{eventDate}</Text>
          <Text style={styles.description}>{eventDescription}</Text>
        </View>

        {/* Category Icons */}
        <View style={styles.iconRow}>
          <TouchableOpacity 
            style={[styles.iconContainer, selectedCategory === 'person' && styles.selectedIconContainer]}
            onPress={() => handleCategoryChange('person')}
          >
            <Image source={require('../../assets/icon-alert.png')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconContainer, selectedCategory === 'camera' && styles.selectedIconContainer]}
            onPress={() => handleCategoryChange('camera')}
          >
            <Image source={require('../../assets/icon-camera.png')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconContainer, selectedCategory === 'group' && styles.selectedIconContainer]}
            onPress={() => handleCategoryChange('group')}
          >
            <Image source={require('../../assets/icon-check.png')} style={styles.icon} />
          </TouchableOpacity>
        </View>

        {/* Display dynamic gallery title */}
        <Text style={styles.attendeesTitle}>{galleryTitle}</Text>

        <View style={styles.imageGrid}>
          {images.map((image) => (
            <TouchableOpacity
              key={image.id}
              style={styles.imageContainer}
              onPress={() => handleImageClick(image.imageUrl)} // Open image in modal
            >
              <Image source={image.imageUrl} style={styles.eventImage} />
            </TouchableOpacity>
          ))}
        </View>

  
      </ScrollView>

      {/* Full Image Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={closeModal}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Image source={selectedImage} style={styles.modalImage} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingTop: 104,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#807E84',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#807E84',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  iconContainer: {
    marginHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#FF6F61',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIconContainer: {
    backgroundColor: '#E54B3C',
    transform: [{ scale: 1.1 }],
  },
  icon: {
    width: 30,
    height: 30,
  },
  attendeesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 10,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageContainer: {
    width: '31%',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  joinButton: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#807E84',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 20,
    backgroundColor: '#FF6F61',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 50,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

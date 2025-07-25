import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  StatusBar,
  Animated,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '../../components/HeaderBar';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function GalleryScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // State for different photo categories
  const [allPhotos, setAllPhotos] = useState([]);
  const [eventPhotos, setEventPhotos] = useState([]);
  const [personalPhotos, setPersonalPhotos] = useState([]);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [favoritePhotos, setFavoritePhotos] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalEvents: 0,
    printedPhotos: 0
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    fetchAllPhotos();
  }, []);

  const fetchAllPhotos = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching all photos for user:', currentUser.uid);

      // Fetch photos from events (photos_tbl)
      const eventPhotosRef = collection(db, 'photos_tbl');
      const eventQuery = query(
        eventPhotosRef,
        where('user_id', '==', currentUser.uid)
      );
      
      // Fetch personal photos (user_photos_tbl) - if you have this collection
      const personalPhotosRef = collection(db, 'user_photos_tbl');
      const personalQuery = query(
        personalPhotosRef,
        where('user_id', '==', currentUser.uid)
      );

      const [eventSnapshot, personalSnapshot] = await Promise.all([
        getDocs(eventQuery),
        getDocs(personalQuery)
      ]);

      const eventPhotosData = [];
      const personalPhotosData = [];
      const uniqueEvents = new Set();

      // Process event photos
      eventSnapshot.forEach((doc) => {
        const photoData = doc.data();
        const photo = {
          id: doc.id,
          imageUrl: photoData.photo_url,
          username: photoData.username || 'Unknown User',
          uploadedAt: photoData.uploaded_at,
          filter: photoData.filter || 'none',
          filterName: photoData.filter_name || 'None',
          likes: photoData.likes || 0,
          comments: photoData.comments || 0,
          userId: photoData.user_id,
          eventId: photoData.event_id,
          type: 'event',
          isPrinted: photoData.is_printed || false
        };
        
        eventPhotosData.push(photo);
        if (photoData.event_id) {
          uniqueEvents.add(photoData.event_id);
        }
      });

      // Process personal photos
      personalSnapshot.forEach((doc) => {
        const photoData = doc.data();
        const photo = {
          id: doc.id,
          imageUrl: photoData.photo_url,
          username: photoData.username || 'Unknown User',
          uploadedAt: photoData.uploaded_at,
          filter: photoData.filter || 'none',
          filterName: photoData.filter_name || 'None',
          likes: photoData.likes || 0,
          comments: photoData.comments || 0,
          userId: photoData.user_id,
          type: 'personal',
          isPrinted: photoData.is_printed || false
        };
        
        personalPhotosData.push(photo);
      });

      // Combine all photos
      const allPhotosData = [...eventPhotosData, ...personalPhotosData];

      // Sort by upload date (newest first)
      const sortedPhotos = allPhotosData.sort((a, b) => {
        if (!a.uploadedAt && !b.uploadedAt) return 0;
        if (!a.uploadedAt) return 1;
        if (!b.uploadedAt) return -1;
        
        const dateA = a.uploadedAt.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
        const dateB = b.uploadedAt.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
        
        return dateB.getTime() - dateA.getTime();
      });

      // Get recent photos (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentPhotosData = sortedPhotos.filter(photo => {
        if (!photo.uploadedAt) return false;
        const photoDate = photo.uploadedAt.toDate ? photo.uploadedAt.toDate() : new Date(photo.uploadedAt);
        return photoDate >= thirtyDaysAgo;
      });

      // Get printed photos
      const printedPhotosData = sortedPhotos.filter(photo => photo.isPrinted);

      // Update state
      setAllPhotos(sortedPhotos);
      setEventPhotos(eventPhotosData);
      setPersonalPhotos(personalPhotosData);
      setRecentPhotos(recentPhotosData);
      setFavoritePhotos([]); // You can implement favorites later

      // Update stats
      setStats({
        totalPhotos: sortedPhotos.length,
        totalEvents: uniqueEvents.size,
        printedPhotos: printedPhotosData.length
      });

      console.log(`Found ${sortedPhotos.length} total photos from ${uniqueEvents.size} events`);

    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllPhotos();
    setRefreshing(false);
  };

  const openImageModal = (photo, index) => {
    setSelectedImage({ photo, index });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const getImageSize = () => {
    if (viewMode === 'grid') {
      return (screenWidth - 80) / 3;
    }
    return (screenWidth - 60) / 2;
  };

  const getNumColumns = () => {
    return viewMode === 'grid' ? 3 : 2;
  };

  const getFilteredPhotos = () => {
    switch (activeFilter) {
      case 'All':
        return allPhotos;
      case 'Recent':
        return recentPhotos;
      case 'Events':
        return eventPhotos;
      case 'Personal':
        return personalPhotos;
      case 'Favorites':
        return favoritePhotos;
      case 'Printed':
        return allPhotos.filter(photo => photo.isPrinted);
      default:
        return allPhotos;
    }
  };

  const renderGridItem = ({ item, index }) => {
    const imageSize = getImageSize();
    const isLarge = viewMode === 'list' && index % 5 === 0;
    
    return (
      <TouchableOpacity 
        style={[
          styles.imageWrapper,
          {
            width: isLarge ? (screenWidth - 60) : imageSize,
            height: isLarge ? imageSize * 1.2 : imageSize,
            marginBottom: viewMode === 'list' ? 12 : 8,
          }
        ]}
        onPress={() => openImageModal(item, index)}
      >
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        
        {/* Filter indicator */}
        {item.filterName && item.filterName !== 'None' && (
          <View style={styles.filterIndicator}>
            <Text style={styles.filterIndicatorText}>{item.filterName}</Text>
          </View>
        )}
        
        {/* Event/Personal badge */}
        <View style={[styles.typeBadge, { backgroundColor: item.type === 'event' ? '#4CAF50' : '#2196F3' }]}>
          <Ionicons 
            name={item.type === 'event' ? 'people-outline' : 'person-outline'} 
            size={10} 
            color="#FFFFFF" 
          />
        </View>
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)']}
          style={styles.imageOverlay}
        >
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            {item.isPrinted && (
              <View style={styles.printedBadge}>
                <Ionicons name="print" size={12} color="#4CAF50" />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats.totalPhotos}</Text>
        <Text style={styles.statLabel}>Photos</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats.totalEvents}</Text>
        <Text style={styles.statLabel}>Events</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{stats.printedPhotos}</Text>
        <Text style={styles.statLabel}>Printed</Text>
      </View>
    </View>
  );

  const filterOptions = [
    { key: 'All', label: 'All', icon: 'grid-outline' },
    { key: 'Recent', label: 'Recent', icon: 'time-outline' },
    { key: 'Events', label: 'Events', icon: 'people-outline' },
    { key: 'Personal', label: 'Personal', icon: 'person-outline' },
    { key: 'Favorites', label: 'Favorites', icon: 'heart-outline' },
    { key: 'Printed', label: 'Printed', icon: 'print-outline' }
  ];

  const filteredPhotos = getFilteredPhotos();

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderBar navigation={navigation} showBack={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Loading your photos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBar navigation={navigation} showBack={false} />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6F61']}
            tintColor="#FF6F61"
          />
        }
      >
        {/* Header Section */}
        <Animated.View style={[styles.headerSection, { opacity: fadeAnim }]}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Gallery</Text>
            <Text style={styles.subtitle}>Your captured moments</Text>
          </View>
          
          {/* View Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'grid' && styles.toggleActive]}
              onPress={() => setViewMode('grid')}
            >
              <Ionicons 
                name="grid-outline" 
                size={18} 
                color={viewMode === 'grid' ? '#FFFFFF' : '#666'} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleActive]}
              onPress={() => setViewMode('list')}
            >
              <Ionicons 
                name="list-outline" 
                size={18} 
                color={viewMode === 'list' ? '#FFFFFF' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Card */}
        <Animated.View style={[{ opacity: fadeAnim }]}>
          {renderStatsCard()}
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View style={[styles.filterContainer, { opacity: fadeAnim }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterOptions.map((filter) => (
              <TouchableOpacity 
                key={filter.key} 
                style={[styles.filterTab, activeFilter === filter.key && styles.filterActive]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Ionicons 
                  name={filter.icon} 
                  size={16} 
                  color={activeFilter === filter.key ? '#FFFFFF' : '#666'} 
                  style={styles.filterIcon}
                />
                <Text style={[styles.filterText, activeFilter === filter.key && styles.filterActiveText]}>
                  {filter.label}
                </Text>
                {filter.key === 'Recent' && recentPhotos.length > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{recentPhotos.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Current filter info */}
        <Animated.View style={[styles.filterInfoContainer, { opacity: fadeAnim }]}>
          <Text style={styles.filterInfoText}>
            {filteredPhotos.length} {activeFilter.toLowerCase()} photo{filteredPhotos.length !== 1 ? 's' : ''}
          </Text>
        </Animated.View>

        {/* Gallery Grid */}
        {filteredPhotos.length > 0 ? (
          <Animated.View style={[styles.galleryContainer, { opacity: fadeAnim }]}>
            <FlatList
              data={filteredPhotos}
              renderItem={renderGridItem}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              numColumns={getNumColumns()}
              key={`${viewMode}-${getNumColumns()}`}
              contentContainerStyle={styles.grid}
              scrollEnabled={false}
            />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
            <Ionicons name="images-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No {activeFilter.toLowerCase()} photos</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'All' 
                ? 'Start capturing memories by joining events!' 
                : `You don't have any ${activeFilter.toLowerCase()} photos yet.`
              }
            </Text>
            {activeFilter === 'All' && (
              <TouchableOpacity 
                style={styles.joinEventButton}
                onPress={() => navigation.navigate('JoinEvent')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF6F61" />
                <Text style={styles.joinEventText}>Join an Event</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Footer */}
        {filteredPhotos.length > 0 && (
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Tap an image to preview or print</Text>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => navigation.navigate('JoinEvent')}
            >
              <Ionicons name="camera-outline" size={20} color="#FF6F61" />
              <Text style={styles.uploadText}>Capture More</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
          <TouchableOpacity style={styles.modalBackground} onPress={closeModal}>
            <View style={styles.modalContent}>
              {selectedImage && (
                <>
                  <Image source={{ uri: selectedImage.photo.imageUrl }} style={styles.modalImage} />
                  
                  {/* Photo info */}
                  <View style={styles.modalInfo}>
                    <Text style={styles.modalInfoText}>
                      {selectedImage.photo.type === 'event' ? 'Event Photo' : 'Personal Photo'}
                    </Text>
                    {selectedImage.photo.filterName !== 'None' && (
                      <Text style={styles.modalFilterText}>
                        Filter: {selectedImage.photo.filterName}
                      </Text>
                    )}
                  </View>
                </>
              )}
              
              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalActionButton}>
                  <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalActionButton}>
                  <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalActionButton}>
                  <Ionicons name="print-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalActionButton}>
                  <Ionicons name="download-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingTop: 110,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D2A32',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  toggleActive: {
    backgroundColor: '#FF6F61',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 20,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  filterActive: {
    backgroundColor: '#FF6F61',
    borderColor: '#FF6F61',
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterActiveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#FF8A80',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  filterInfoContainer: {
    marginBottom: 16,
  },
  filterInfoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  galleryContainer: {
    marginBottom: 20,
  },
  grid: {
    paddingBottom: 20,
  },
  imageWrapper: {
    margin: 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  filterIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  filterIndicatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
  printedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderRadius: 10,
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  joinEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  joinEventText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '600',
    marginLeft: 6,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  uploadText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '600',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    alignItems: 'center',
  },
  modalImage: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.9,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  modalInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalInfoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalFilterText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  modalActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

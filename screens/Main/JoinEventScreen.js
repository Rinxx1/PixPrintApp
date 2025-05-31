import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import HeaderBar from '../../components/HeaderBar';
import { Ionicons } from '@expo/vector-icons';

export default function JoinEventScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <HeaderBar navigation={navigation} showBack={true} />

      {/* Content */}
      <View style={styles.content}>
        <Image
          source={require('../../assets/event-wedding.png')}
          style={styles.image}
        />

        <Text style={styles.title}>Join Event</Text>
        <Text style={styles.subtitle}>
          You have successfully joined the event!{'\n'}
          Choose what you'd like to do next.
        </Text>

        {/* Camera Button */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Camera')}
        >
          <Ionicons name="camera-outline" size={28} color="#FF6F61" style={styles.icon} />
          <Text style={styles.cardText}>Go to Camera</Text>
        </TouchableOpacity>

        {/* Gallery Button */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Gallery')}
        >
          <Ionicons name="images-outline" size={28} color="#FF6F61" style={styles.icon} />
          <Text style={styles.cardText}>View Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    paddingTop: 104,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginTop: 24,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2D2A32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#807E84',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  icon: {
    marginRight: 16,
  },
  cardText: {
    fontSize: 16,
    color: '#2D2A32',
    fontWeight: '600',
  },
});

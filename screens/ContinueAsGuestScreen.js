import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function ContinueAsGuestScreen({ navigation }) {
  const [eventCode, setEventCode] = useState('');

  const handleJoin = () => {
    if (eventCode.trim() !== '') {
      // navigate to event (replace with real logic)
      navigation.navigate('Dashboard', { eventCode }); 
    }
  };

  return (
    <View style={styles.container}>
     {/* Branding */}
      <Image source={require('../assets/icon-pix-print.png')} style={styles.logo} />
      <Text style={styles.title}>PixPrint</Text>
      <Text style={styles.subtitle}>Capture. Print. Celebrate</Text>

      <View style={styles.spacer} />
       {/* Guest Event Join Form */}
       <Text style={styles.heading}>Join Event as Guest</Text>

      <TextInput
        placeholder="Enter Event Code"
        value={eventCode}
        onChangeText={setEventCode}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleJoin}>
        <Text style={styles.buttonText}>Join Event</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAF8F5',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: -5,
      },
      title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2D2A32',
        marginBottom: 1,
      },
      subtitle: {
        fontSize: 14,
        color: '#807E84',
        marginBottom: 48,
      },
    heading: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#2D2A32',
      marginBottom: 24,
    },
    input: {
      width: '100%',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 14,
      borderColor: '#DDD',
      borderWidth: 1,
      marginBottom: 16,
    },
    button: {
      width: '100%',
      backgroundColor: '#FF6F61',
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    buttonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    backText: {
      color: '#807E84',
      fontSize: 14,
    },
  });
  
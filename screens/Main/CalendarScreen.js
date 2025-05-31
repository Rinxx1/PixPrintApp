import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import HeaderBar from '../../components/HeaderBar';
import BottomNavBar from '../../components/BottomNavbar';

export default function CalendarScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar navigation={navigation} showBack={false} />
      <View style={styles.content}>
        <Text style={styles.title}>Calendar</Text>

        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{
            [selectedDate]: {
              selected: true,
              marked: true,
              selectedColor: '#FF6F61',
            },
          }}
          theme={{
            backgroundColor: '#FAF8F5',
            calendarBackground: '#FAF8F5',
            todayTextColor: '#FF6F61',
            arrowColor: '#FF6F61',
            selectedDayBackgroundColor: '#FF6F61',
            selectedDayTextColor: '#fff',
            textDayFontWeight: '500',
            textMonthFontWeight: 'bold',
            textDayHeaderFontWeight: '500',
          }}
          style={styles.calendar}
        />

        <Text style={styles.note}>
          {selectedDate ? (
            <>
              📌 You selected: <Text style={styles.selected}>{selectedDate}</Text>
            </>
          ) : (
            'Tap a date to view details'
          )}
        </Text>
      </View>

    </SafeAreaView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2D2A32',
  },
  calendar: {
    borderRadius: 12,
    padding: 10,
    elevation: 2,
  },
  note: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
    color: '#807E84',
  },
  selected: {
    fontWeight: 'bold',
    color: '#FF6F61',
  },
});

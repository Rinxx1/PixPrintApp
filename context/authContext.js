import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Import Firebase auth and firestore
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from 'firebase/firestore'; // Import firestore methods

// Create a context to manage user data
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // This will hold the logged-in user
  const [userData, setUserData] = useState(null); // Store additional user data (e.g., name, email, etc.)
  const navigation = useNavigation();

  // Check if the user is logged in when the app is loaded
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser); // Set the user on auth state change
      if (currentUser) {
        // Fetch user data if logged in
        const fetchUserData = async () => {
          const userRef = doc(db, 'user_tbl', currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data()); // Set the user's profile data
          } else {
            console.log('No such document!');
          }
        };
        fetchUserData();
        navigation.navigate('Tabs'); // If the user is logged in, navigate to the Tabs screen
      } else {
        // If the user is not logged in, navigate to the SignIn screen
        navigation.navigate('SignIn');
      }
    });

    // Clean up the subscription
    return unsubscribe;
  }, [navigation]);

  return (
    <AuthContext.Provider value={{ user, userData, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

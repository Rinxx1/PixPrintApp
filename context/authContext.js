import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Create a context to manage user data
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [justCreatedAccount, setJustCreatedAccount] = useState(false); // Add this flag

  // Check if the user is logged in when the app is loaded
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch user data if logged in
        try {
          const userRef = doc(db, 'user_tbl', currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            console.log('No user document found!');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null); // Clear user data when logged out
      }
      
      setIsLoading(false); // Set loading to false after auth check
    });

    // Clean up the subscription
    return unsubscribe;
  }, []);

  // Function to mark that user just created account
  const markAccountCreated = () => {
    setJustCreatedAccount(true);
  };

  // Function to clear the account creation flag
  const clearAccountCreatedFlag = () => {
    setJustCreatedAccount(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      setUserData, 
      isLoading, 
      justCreatedAccount,
      markAccountCreated,
      clearAccountCreatedFlag
    }}>
      {children}
    </AuthContext.Provider>
  );
};

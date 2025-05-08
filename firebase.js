// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBC0Ld15pfJ457vfC24tKld__TAFUKjP2U",
  authDomain: "pixprintapp.firebaseapp.com",
  databaseURL: "https://pixprintapp.firebaseio.com",
  projectId: "pixprintapp",
  storageBucket: "pixprintapp.firebasestorage.app",
  messagingSenderId: "315145642881",
  appId: "1:315145642881:android:ad319802eeea13c24c7e80",
  measurementId: "YOUR_MEASUREMENT_ID", // Ensure you replace this with the actual measurement ID if required
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

export { auth, db, storage };
       
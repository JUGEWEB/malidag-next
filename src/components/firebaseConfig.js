// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import the authentication module

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQTUPmJ4G7h-xKA-hbE5kwchRVsDut6io",
  authDomain: "benege-93e7c.firebaseapp.com",
  projectId: "benege-93e7c",
  storageBucket: "benege-93e7c.appspot.com",
  messagingSenderId: "798630560882",
  appId: "1:798630560882:web:207d1f6f22634b5fb5eeeb",
  measurementId: "G-G4C2XL3N4H",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export storage and auth
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

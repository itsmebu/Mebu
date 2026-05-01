import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, GoogleAuthProvider, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyACh0Lr7HCA4kgd49NuMJqGTCZJcKgPah4",
  authDomain: "akon-app-f0af8.firebaseapp.com",
  projectId: "akon-app-f0af8",
  storageBucket: "akon-app-f0af8.firebasestorage.app",
  messagingSenderId: "501749092855",
  appId: "1:501749092855:web:d239a289c1b9d73eafdef2"
};

// Initialize Firebase app only if it hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence - check if already initialized
let auth;
try {
  // Try to get existing auth instance
  auth = getAuth(app);
} catch (error) {
  // If not initialized, initialize it
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

// Initialize Google Provider
const googleProvider = new GoogleAuthProvider();

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, googleProvider, storage };
export default app;
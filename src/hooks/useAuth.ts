import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../../config/firebase';

export interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  createdAt: Date;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh user profile
  const refreshUserProfile = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Check if username exists
  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const usernameRef = doc(db, 'usernames', username.toLowerCase());
      const usernameDoc = await getDoc(usernameRef);
      return usernameDoc.exists();
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  // Sign up with username
  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      // Check if username already exists
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        return { success: false, error: 'Username is already taken. Please choose another one.' };
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // Update display name in Firebase Auth
      await updateProfile(userCredential.user, { displayName: fullName });
      
      // Save username mapping to usernames collection
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        userId: userId,
        username: username.toLowerCase(),
        createdAt: new Date(),
      });
      
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', userId), {
        fullName: fullName,
        username: username.toLowerCase(),
        email: email,
        createdAt: new Date(),
      });
      
      await sendEmailVerification(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      let errorMessage = 'Signup failed. ';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your connection.';
      } else {
        errorMessage += error.message;
      }
      return { success: false, error: errorMessage };
    }
  };

  // Sign in with email/username and password
  const signIn = async (identifier: string, password: string) => {
    try {
      let email = identifier;
      
      console.log('Attempting login with identifier:', identifier);
      
      // Check if identifier is a username (doesn't contain @)
      if (!identifier.includes('@')) {
        console.log('Looking up username:', identifier.toLowerCase());
        
        // Method 1: Direct document lookup
        const usernameRef = doc(db, 'usernames', identifier.toLowerCase());
        const usernameDoc = await getDoc(usernameRef);
        
        if (usernameDoc.exists()) {
          const userData = usernameDoc.data();
          console.log('Found user via direct lookup:', userData?.userId);
          
          const userDoc = await getDoc(doc(db, 'users', userData.userId));
          if (userDoc.exists()) {
            email = userDoc.data().email;
            console.log('Found email:', email);
          }
        } else {
          // Method 2: Query as fallback
          console.log('Direct lookup failed, trying query...');
          const usernamesRef = collection(db, 'usernames');
          const q = query(usernamesRef, where('username', '==', identifier.toLowerCase()));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            console.log('Found user via query:', userData.userId);
            
            const userDoc = await getDoc(doc(db, 'users', userData.userId));
            if (userDoc.exists()) {
              email = userDoc.data().email;
              console.log('Found email via query:', email);
            }
          } else {
            return { success: false, error: 'Invalid username or password.' };
          }
        }
      }
      
      console.log('Attempting Firebase sign in with email:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        await signOut(auth);
        return { success: false, error: 'Please verify your email before logging in. Check your inbox for the verification link.' };
      }
      
      console.log('Login successful!');
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('Sign in error details:', error.code, error.message);
      let errorMessage = 'Login failed. ';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email/username or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your internet connection.';
      } else {
        errorMessage += error.message;
      }
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return { 
    user, 
    userProfile, 
    loading, 
    signUp, 
    signIn, 
    logout, 
    checkUsernameExists,
    refreshUserProfile 
  };
};
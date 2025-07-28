
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: 'paytracker-gfw4j',
  appId: '1:766910851675:web:4f9c1445e69fb1fc576d7e',
  storageBucket: 'paytracker-gfw4j.firebasestorage.app',
  apiKey: 'AIzaSyD-fbIQ9nMxnfxjCXRg1vy8jAaopvht0Jw',
  authDomain: 'paytracker-gfw4j.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '766910851675',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence enabled
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
});

export { db };

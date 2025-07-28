// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

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
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled
      // in one tab at a time.
      console.warn("Firestore persistence failed: multiple tabs open.");
    } else if (err.code == 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
      console.warn("Firestore persistence not supported in this browser.");
    }
  });


export { db };

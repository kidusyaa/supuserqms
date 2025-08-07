// Test file to verify Firebase imports
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

console.log('Firebase imports successful!');

const firebaseConfig = {
  apiKey: "AIzaSyCzE5lOlOyrqwIsu7VOI3JseHVGisHUGFk",
  authDomain: "qms-queuesystem.firebaseapp.com",
  projectId: "qms-queuesystem",
  storageBucket: "qms-queuesystem.firebasestorage.app",
  messagingSenderId: "775966134076",
  appId: "1:775966134076:web:28b59d9e5edbee20a79839"
};

// Test initialization
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log('Firebase initialized successfully!');

export { app, db, auth }; 
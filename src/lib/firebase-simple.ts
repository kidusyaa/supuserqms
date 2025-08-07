// Simple Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCzE5lOlOyrqwIsu7VOI3JseHVGisHUGFk",
  authDomain: "qms-queuesystem.firebaseapp.com",
  projectId: "qms-queuesystem",
  storageBucket: "qms-queuesystem.firebasestorage.app",
  messagingSenderId: "775966134076",
  appId: "1:775966134076:web:28b59d9e5edbee20a79839"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app; 
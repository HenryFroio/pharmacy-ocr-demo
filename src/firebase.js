import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// DEMO CONFIGURATION - Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "demo-api-key-replace-with-your-actual-key",
    authDomain: "your-project-demo.firebaseapp.com",
    projectId: "your-project-demo",
    storageBucket: "your-project-demo.firebasestorage.app",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:demo-app-id",
    measurementId: "G-DEMO12345"
  };
  
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

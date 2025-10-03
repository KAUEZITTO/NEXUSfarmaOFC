
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
// We check if the app is already initialized to avoid errors on hot reloads
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { firebaseApp };

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyATmNkH6fqrPbkrRC5H-FVt21U5t_Je4mI",
  authDomain: "nexusfarma-ofc.firebaseapp.com",
  projectId: "nexusfarma-ofc",
  storageBucket: "nexusfarma-ofc.appspot.com",
  messagingSenderId: "861616691631",
  appId: "1:861616691631:web:71f3a1f3e2b14b1caaf75a",
  measurementId: "G-C3NBYCEGKR"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const storage = getStorage(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

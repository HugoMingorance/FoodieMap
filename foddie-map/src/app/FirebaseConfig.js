// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgBSgFoljKtNlUHDZwdOgl9JAC07NJdro",
  authDomain: "foddiemap.firebaseapp.com",
  projectId: "foddiemap",
  storageBucket: "foddiemap.firebasestorage.app",
  messagingSenderId: "532697116926",
  appId: "1:532697116926:web:ce26acfe2e6014172275af",
  measurementId: "G-F644M9STTJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
// Importar las funciones necesarias del SDK de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBgBSgFoljKtNlUHDZwdOgl9JAC07NJdro",
  authDomain: "foddiemap.firebaseapp.com",
  projectId: "foddiemap",
  storageBucket: "foddiemap.firebasestorage.app",
  messagingSenderId: "532697116926",
  appId: "1:532697116926:web:ce26acfe2e6014172275af",
  measurementId: "G-F644M9STTJ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Exportar Firebase app y Firestore
export { app, db };
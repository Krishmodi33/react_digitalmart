// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAcWaJbrO2cPuZRVFiBOYm2kMEVqG43Lsw",
  authDomain: "react-2d497.firebaseapp.com",
  projectId: "react-2d497",
  storageBucket: "react-2d497.appspot.com", // ✅ fix: ".app" → ".appspot.com"
  messagingSenderId: "849578272822",
  appId: "1:849578272822:web:24f1ac54493bfaf82d5097",
  measurementId: "G-B77ZREF56Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

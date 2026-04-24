// File: src/firebase.js

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Ini tambahan penting untuk Realtime DB

// Konfigurasi rahasia milik QuizzizKu
const firebaseConfig = {
  apiKey: "AIzaSyAnsm0SlkJ9GGbiaiOZfLslt9RvmyIcxgg",
  authDomain: "quizzizku.firebaseapp.com",
  databaseURL: "https://quizzizku-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quizzizku",
  storageBucket: "quizzizku.firebasestorage.app",
  messagingSenderId: "886012787835",
  appId: "1:886012787835:web:57b556f28c778b832ff6de"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor koneksi database agar bisa dipanggil oleh App.jsx nanti
export const db = getDatabase(app);
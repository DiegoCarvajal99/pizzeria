import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  runTransaction,
  serverTimestamp 
} from "firebase/firestore";

// Priorizar variables de entorno (.env), con fallback a localStorage
const getSavedFirebaseConfig = () => {
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
  };

  // Si las variables de entorno están presentes y son válidas, usarlas de forma prioritaria
  if (envConfig.apiKey && envConfig.projectId && !envConfig.apiKey.includes('tu_api_key')) {
    return envConfig;
  }

  try {
    const custom = localStorage.getItem('pizzeria_firebase_config');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error leyendo configuración personalizada de Firebase:", e);
  }

  return envConfig;
};

const firebaseConfig = getSavedFirebaseConfig();

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== "AIzaSyDemo-PizzeriaInventoryKey"
);

let app = null;
let db = null;

try {
  if (isFirebaseConfigured) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("🔥 Firebase inicializado con éxito");
  } else {
    console.log("ℹ️ Usando almacenamiento local inteligente (agrega tus credenciales de Firebase para sincronizar en vivo con Firestore)");
  }
} catch (error) {
  console.warn("No se pudo conectar a Firebase, usando respaldo local:", error);
}

export const guardarConfiguracionFirebase = (nuevaConfig) => {
  try {
    localStorage.setItem('pizzeria_firebase_config', JSON.stringify(nuevaConfig));
    window.location.reload();
  } catch (e) {
    console.error("Error guardando configuración de Firebase:", e);
  }
};

export const desconectarFirebase = () => {
  try {
    localStorage.removeItem('pizzeria_firebase_config');
    window.location.reload();
  } catch (e) {
    console.error(e);
  }
};

export { app, db, firebaseConfig };

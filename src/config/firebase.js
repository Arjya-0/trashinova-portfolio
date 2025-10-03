import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// IMPORTANT: All Firebase credentials now loaded from environment variables.
// For local dev, create a .env file with REACT/VITE prefixed keys depending on tooling.
// For Vite, variables must start with VITE_. We'll support both to ease migration.
const getEnv = (key) => import.meta?.env?.[key] || process.env[key];

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || getEnv('REACT_APP_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || getEnv('REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || getEnv('REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || getEnv('REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID') || getEnv('REACT_APP_FIREBASE_APP_ID')
};

// Basic runtime safeguard to help during development if env vars are missing
if (!firebaseConfig.apiKey) {
  // eslint-disable-next-line no-console
  console.error('Firebase config env vars are missing. Did you create your .env file?');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
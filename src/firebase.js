import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Guard analytics so tests (no env vars / no window) don't crash
let analytics; // eslint-disable-line import/no-mutable-exports
try {
  if (typeof window !== 'undefined' && firebaseConfig.projectId && firebaseConfig.measurementId) {
    analytics = getAnalytics(app); // optional; not exported currently
  }
} catch (e) {
  // Silently ignore analytics init errors in non-browser environments
}

export default db;

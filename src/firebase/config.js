// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Values can be overridden per deployment with REACT_APP_FIREBASE_* env vars
// (see .env.example). They default to the HPAIR deliverable project that
// shipped with the starter. These are public web-client identifiers; access is
// governed by Firebase security rules, not by keeping them secret.
const env = (key, fallback) => process.env[`REACT_APP_FIREBASE_${key}`] || fallback;

const firebaseConfig = {
  apiKey: env('API_KEY', 'AIzaSyBffq1ANXUapIjK-wG2yGFwg2-44e3A8Pc'),
  authDomain: env('AUTH_DOMAIN', 'hpair-deliv-6443a.firebaseapp.com'),
  projectId: env('PROJECT_ID', 'hpair-deliv-6443a'),
  storageBucket: env('STORAGE_BUCKET', 'hpair-deliv-6443a.firebasestorage.app'),
  messagingSenderId: env('MESSAGING_SENDER_ID', '908480646127'),
  appId: env('APP_ID', '1:908480646127:web:e8861bd5881b714a4d041a'),
  measurementId: env('MEASUREMENT_ID', 'G-5KKED2YT25'),
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const projectId = firebaseConfig.projectId;

export default app;

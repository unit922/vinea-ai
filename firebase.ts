import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Check if Firebase is configured (not placeholder)
let isFirebaseConfigured = !!(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('TODO'));

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
  } catch (e) {
    console.error("Vinetelligence: Firebase initialization failed", e);
    isFirebaseConfigured = false;
  }
}

export { app, db, auth, isFirebaseConfigured };
export default app;

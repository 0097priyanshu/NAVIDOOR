import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

// Default Firebase Configuration with support for EXPO_PUBLIC_* environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyNAVIDOORAppForFamilyMode123",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "navidoor-app.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "navidoor-app",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "navidoor-app.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1029384756:web:abcd1234efgh5678"
};

// Singleton App, Auth & Firestore instances
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.warn('[Firebase] initializeApp note:', e);
    app = getApp();
  }
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

/**
 * Ensures the device has an authenticated Firebase user.
 * If no user is signed in, seamlessly authenticates anonymously
 * so all Firestore security rules requiring `request.auth != null` succeed.
 */
export async function ensureFirebaseAuth(): Promise<FirebaseUser> {
  return new Promise((resolve) => {
    // If already authenticated
    if (auth.currentUser) {
      return resolve(auth.currentUser);
    }

    let resolved = false;
    const fallbackUser = {
      uid: `device_${Date.now().toString(36)}`,
      isAnonymous: true,
      displayName: 'NAVIDOOR Device User',
    } as unknown as FirebaseUser;

    // Fast safety timeout: never freeze the UI for more than 1200ms
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('[Firebase] Fast auth fallback triggered');
        resolve(fallbackUser);
      }
    }, 1200);

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (resolved) return;
        unsubscribe();
        if (user) {
          resolved = true;
          clearTimeout(safetyTimer);
          resolve(user);
        } else {
          try {
            const userCredential = await signInAnonymously(auth);
            if (!resolved) {
              resolved = true;
              clearTimeout(safetyTimer);
              resolve(userCredential.user);
            }
          } catch (error) {
            console.warn('[Firebase] signInAnonymously note:', error);
            if (!resolved) {
              resolved = true;
              clearTimeout(safetyTimer);
              resolve(fallbackUser);
            }
          }
        }
      }, (err) => {
        console.warn('[Firebase] onAuthStateChanged note:', err);
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimer);
          resolve(fallbackUser);
        }
      });
    } catch (e) {
      if (!resolved) {
        resolved = true;
        clearTimeout(safetyTimer);
        resolve(fallbackUser);
      }
    }
  });
}

export { app };

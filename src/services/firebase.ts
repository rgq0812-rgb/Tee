import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Firebase initialization failed:", e);
  // Create a dummy app object to prevent app.settings errors, or handle later
  app = { name: '[DEFAULT]', options: {}, automaticDataCollectionEnabled: false };
}

// Valider la config pour éviter les erreurs silencieuses sur les remixes
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('INSERT')) {
  console.error("CRITICAL: Firebase API Key is missing or invalid. Please check firebase-applet-config.json");
}

let db: any = null;
let auth: any = null;

try {
  if (app && app.options && Object.keys(app.options).length > 0) {
    // Initialiser Firestore standard (WebSocket) pour de meilleures performances (latence)
    // Sauf si l'utilisateur est dans un environnement très restrictif
    db = getFirestore(app as any, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app as any);
  }
} catch (e) {
  console.error("Firebase services initialization failed:", e);
}

export { db, auth };
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  console.log("Starting Google Sign-In with popup...");
  if (!auth) throw new Error("FIREBASE_AUTH_NOT_READY");
  try {
    // Explicitly set language
    auth.languageCode = 'fr';
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Sign-In successful:", result.user.email);
    return result;
  } catch (error: any) {
    console.error("Firebase Sign-In Error:", error.code, error.message);
    if (error.code === 'auth/popup-blocked') {
      throw new Error("POPUP_BLOCKED");
    }
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      throw new Error("POPUP_CANCELLED");
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error("Ce domaine n'est pas autorisé. Contactez l'administrateur.");
    }
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(result.user, { displayName: name });
  return result;
};

export const logout = () => auth ? signOut(auth) : Promise.resolve();

async function testConnection(retries = 3) {
  if (!db) {
    console.error("[Firebase] Firestore DB not initialized, skipping connection test.");
    return;
  }
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Firebase] Testing connection to Firestore (Attempt ${i + 1}/${retries})...`);
      // Use the specially allowed test path with a timeout
      const connectionTest = getDocFromServer(doc(db, 'test', 'connection'));
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000));
      
      await Promise.race([connectionTest, timeout]);
      console.log("[Firebase] Firestore connection healthy.");
      return; // Success
    } catch (error: any) {
      console.warn(`[Firebase] Connection attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
      } else {
        console.error("Firebase connection failed after multiple attempts. The database might still be initializing or the project needs re-provisioning.");
      }
    }
  }
}

// Lancer le test après un court délai pour laisser le temps aux services de s'initialiser
setTimeout(() => testConnection(), 2000);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const isQuotaExceeded = error instanceof Error && (error.message.includes('quota') || error.message.includes('resource-exhausted'));
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // If it's a quota error, we don't want to throw and crash the entire app
  // but we should still inform the user in the console or via a non-blocking UI
  if (isQuotaExceeded) {
    console.warn("Firestore Quota Exceeded. The application may have limited functionality.");
    return;
  }

  // We log but don't throw to avoid white screen of death in critical loops
  console.warn("Recoverable Firestore Error occurred. Application continues.");
}

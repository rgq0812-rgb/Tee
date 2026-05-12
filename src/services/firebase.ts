import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Valider la config pour éviter les erreurs silencieuses sur les remixes
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('INSERT')) {
  console.error("CRITICAL: Firebase API Key is missing or invalid. Please check firebase-applet-config.json");
}

// Initialiser Firestore avec Long Polling pour une meilleure stabilité dans les environnements restreints
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  console.log("Starting Google Sign-In with popup...");
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

export const logout = () => signOut(auth);

async function testConnection(retries = 3) {
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
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // If it's a quota error, we don't want to throw and crash the entire app
  // but we should still inform the user in the console or via a non-blocking UI
  if (isQuotaExceeded) {
    console.warn("Firestore Quota Exceeded. The application may have limited functionality (e.g. historical data or custom photos may be missing).");
    return; // Don't throw for quota errors
  }

  throw new Error(JSON.stringify(errInfo));
}

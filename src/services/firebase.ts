import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
      throw new Error("Le pop-up a été bloqué par votre navigateur. Veuillez autoriser les pop-ups pour ce site.");
    }
    if (error.code === 'auth/unauthorized-domain') {
      throw new Error("Ce domaine n'est pas autorisé pour l'authentification Google. Veuillez contacter l'administrateur.");
    }
    throw error;
  }
};
export const logout = () => signOut(auth);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

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

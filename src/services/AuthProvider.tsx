import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasPaid: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, hasPaid: false });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check for success param first (optimistic/refresh)
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('payment_status');
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        if (status === 'success') {
          // Note: In production, the Webhook handles the database update.
          // We set local state to true for immediate UX, then refresh.
          setHasPaid(true);
        } else {
          // Normal check
          try {
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              setHasPaid(userDoc.data().subscriptionStatus === 'active');
            } else {
              // Try client-side initialization first (now allowed by rules)
              try {
                await setDoc(userDocRef, {
                  displayName: firebaseUser.displayName || 'ONYX Cadet',
                  handicap: 18,
                  email: firebaseUser.email,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  subscriptionStatus: 'none'
                });
              } catch (clientErr) {
                // If it's a permission denied we might want to know why
                if (clientErr instanceof Error && clientErr.message.includes('permission-denied')) {
                   handleFirestoreError(clientErr, OperationType.CREATE, `users/${firebaseUser.uid}`);
                }
                
                console.error("Client-side init failed, falling back to server:", clientErr);
                // Fallback to server sync
                fetch('/api/auth/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName
                  })
                }).catch(err => console.error("Sync trigger failed:", err));
              }
              
              setHasPaid(false);
            }
          } catch (error) {
            console.error("Auth sync check error:", error);
            // If getDoc fails (permission denied during sync), we can still fallback.
            // We set paid to false for now and let the user in (if rules allow).
            setHasPaid(false);
          }
        }
      } else {
        setHasPaid(false);
      }
      
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, hasPaid }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

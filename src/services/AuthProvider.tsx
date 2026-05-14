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
    if (!auth) {
      console.warn("[ONYX] Auth service not available");
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Check for success param first (optimistic/refresh)
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('payment_status');
        
        const userDocRef = db ? doc(db, 'users', firebaseUser.uid) : null;
        
        if (status === 'success') {
          // Note: In production, the Webhook handles the database update.
          // We set local state to true for immediate UX, then refresh.
          setHasPaid(true);
        } else if (userDocRef) {
          // Normal check with safety timeout
          try {
            const docPromise = getDoc(userDocRef);
            const timeoutPromise = new Promise((_, reject) => 
               setTimeout(() => reject(new Error("TIMEOUT")), 8000)
            );
            
            const userDoc = await Promise.race([docPromise, timeoutPromise]) as any;
            
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
                console.error("Client-side init failed:", clientErr);
              }
              setHasPaid(false);
            }
          } catch (error) {
            console.error("Auth sync check error or timeout:", error);
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

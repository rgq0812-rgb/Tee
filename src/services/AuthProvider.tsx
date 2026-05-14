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

    // Safety fallback to ensure UI is never blocked indefinitely
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safetyTimer);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setLoading(false); // Set loading false immediately when user is found
        
        // Check for success param first (optimistic/refresh)
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('payment_status');
        
        const userDocRef = db ? doc(db, 'users', firebaseUser.uid) : null;
        
        if (status === 'success') {
          setHasPaid(true);
        } else if (userDocRef) {
          // Normal check with safety timeout
          try {
            const docPromise = getDoc(userDocRef);
            const timeoutPromise = new Promise((_, reject) => 
               setTimeout(() => reject(new Error("TIMEOUT")), 5000)
            );
            
            const userDoc = await Promise.race([docPromise, timeoutPromise]) as any;
            
            if (userDoc.exists()) {
              setHasPaid(userDoc.data().subscriptionStatus === 'active');
            } else {
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
                // Silently fail in production
              }
              setHasPaid(false);
            }
          } catch (error) {
            setHasPaid(false);
          }
        }
      } else {
        setHasPaid(false);
        setLoading(false); // Also false if no user (Guest mode)
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, hasPaid }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

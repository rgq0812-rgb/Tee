import { collection, onSnapshot, query, FirestoreError, deleteDoc, doc, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

export interface HoleAsset {
  id: string;
  holeNumber: number;
  imageData: string;
  updatedAt: any;
  courseId: string;
  userId: string;
  type?: 'lie' | 'green' | 'draw' | 'scan';
}

type AssetCallback = (assets: HoleAsset[]) => void;
type ErrorCallback = (error: FirestoreError) => void;

class AssetService {
  private assets: HoleAsset[] = [];
  private listeners: Set<AssetCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private unsubscribe: (() => void) | null = null;
  private isInitializing = false;
  private quotaExceeded = false;

  subscribe(callback: AssetCallback, onError?: ErrorCallback) {
    this.listeners.add(callback);
    if (onError) this.errorListeners.add(onError);

    if (this.assets.length > 0) {
      callback(this.assets);
    }
    
    if (this.quotaExceeded && onError) {
      const error = { message: 'quota exceeded' } as FirestoreError;
      onError(error);
    }

    if (!this.unsubscribe && !this.isInitializing && !this.quotaExceeded) {
       // Wait for auth before init
       const unsubscribeAuth = auth.onAuthStateChanged((user) => {
         if (user) {
           if (!this.unsubscribe && !this.isInitializing) {
             this.init();
           }
         } else {
           // User logged out, clean up
           if (this.unsubscribe) {
             this.unsubscribe();
             this.unsubscribe = null;
             this.assets = [];
             this.listeners.forEach(cb => cb([]));
           }
         }
       });
    }

    return () => {
      this.listeners.delete(callback);
      if (onError) this.errorListeners.delete(onError);
    };
  }

  private init() {
    if (!auth.currentUser) return;
    this.isInitializing = true;
    
    // CRITICAL: Filter by userId to save quota and respect privacy
    // Order by updatedAt to ensure latest assets are prioritized
    const q = query(
      collection(db, 'hole_assets'), 
      where('userId', '==', auth.currentUser.uid)
    );
    
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      // ... same processing ...
      const rawAssets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HoleAsset[];

      this.assets = rawAssets.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || (typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() / 1000 : 0);
        const timeB = b.updatedAt?.seconds || (typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() / 1000 : 0);
        return timeB - timeA;
      });
      
      this.listeners.forEach(cb => cb(this.assets));
      this.isInitializing = false;
      this.quotaExceeded = false;
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, 'hole_assets');
      }
      if (error.message?.includes('quota') || (error as any).code === 'resource-exhausted') {
        this.quotaExceeded = true;
      }
      this.errorListeners.forEach(cb => cb(error as FirestoreError));
      this.isInitializing = false;
      
      if (this.quotaExceeded && this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    });
  }

  async saveAsset(asset: Omit<HoleAsset, 'id' | 'updatedAt' | 'userId'>) {
    if (!auth.currentUser) throw new Error("Authentication required");
    
    try {
      const docRef = await addDoc(collection(db, 'hole_assets'), {
        ...asset,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'hole_assets');
      throw error;
    }
  }

  async deleteAsset(assetId: string) {
    try {
      await deleteDoc(doc(db, 'hole_assets', assetId));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `hole_assets/${assetId}`);
      return false;
    }
  }

  getAssets() {
    return this.assets;
  }

  isQuotaExceeded() {
    return this.quotaExceeded;
  }
}

export const assetService = new AssetService();

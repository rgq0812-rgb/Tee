import { collection, onSnapshot, query, FirestoreError, deleteDoc, doc, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

export interface HoleAsset {
  id: string;
  holeNumber: number;
  imageData: string;
  updatedAt: string;
  courseId: string;
  userId: string;
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
       if (auth.currentUser) {
         this.init();
       } else {
         const unsubscribeAuth = auth.onAuthStateChanged((user) => {
           if (user && !this.unsubscribe && !this.isInitializing) {
             this.init();
             unsubscribeAuth();
           }
         });
       }
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
    const q = query(
      collection(db, 'hole_assets'), 
      where('userId', '==', auth.currentUser.uid)
    );
    
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.assets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HoleAsset[];
      
      this.listeners.forEach(cb => cb(this.assets));
      this.isInitializing = false;
      this.quotaExceeded = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'hole_assets');
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

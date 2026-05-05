import { collection, onSnapshot, query, FirestoreError, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

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
      this.init();
    }

    return () => {
      this.listeners.delete(callback);
      if (onError) this.errorListeners.delete(onError);
    };
  }

  private init() {
    this.isInitializing = true;
    const q = query(collection(db, 'hole_assets'));
    
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.assets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as HoleAsset[];
      
      this.listeners.forEach(cb => cb(this.assets));
      this.isInitializing = false;
      this.quotaExceeded = false;
    }, (error) => {
      console.error("AssetService Error:", error);
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

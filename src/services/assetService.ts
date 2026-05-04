import { collection, onSnapshot, query, FirestoreError } from 'firebase/firestore';
import { db } from './firebase';

export interface HoleAsset {
  id: string;
  hole: number;
  imageData: string;
  timestamp: any;
}

type AssetCallback = (assets: HoleAsset[]) => void;
type ErrorCallback = (error: FirestoreError) => void;

class AssetService {
  private assets: HoleAsset[] = [];
  private listeners: Set<AssetCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private unsubscribe: (() => void) | null = null;
  private isInitializing = false;

  subscribe(callback: AssetCallback, onError?: ErrorCallback) {
    this.listeners.add(callback);
    if (onError) this.errorListeners.add(onError);

    // If we already have data, push it immediately
    if (this.assets.length > 0) {
      callback(this.assets);
    }

    if (!this.unsubscribe && !this.isInitializing) {
      this.init();
    }

    return () => {
      this.listeners.delete(callback);
      if (onError) this.errorListeners.delete(onError);
      // We keep the connection alive even if no one is listening to keep the cache warm
      // or we could close it if listeners.size === 0. Given the quota issue, 
      // keeping ONE shared connection is better than many.
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
    }, (error) => {
      console.error("AssetService Error:", error);
      this.errorListeners.forEach(cb => cb(error as FirestoreError));
      this.isInitializing = false;
    });
  }

  getAssets() {
    return this.assets;
  }
}

export const assetService = new AssetService();

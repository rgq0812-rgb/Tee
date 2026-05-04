import { useState, useEffect } from 'react';
import { assetService, HoleAsset } from '../services/assetService';
import { FirestoreError } from 'firebase/firestore';

export function useHoleAssets() {
  const [assets, setAssets] = useState<HoleAsset[]>(assetService.getAssets());
  const [loading, setLoading] = useState(assetService.getAssets().length === 0);
  const [error, setError] = useState<FirestoreError | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const unsubscribe = assetService.subscribe(
      (newAssets) => {
        setAssets(newAssets);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
        if (err.message.includes('quota')) {
          setQuotaExceeded(true);
        }
      }
    );

    return unsubscribe;
  }, []);

  return { assets, loading, error, quotaExceeded };
}

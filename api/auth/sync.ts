import { VercelRequest, VercelResponse } from '@vercel/node';
import { db, admin } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { uid, email, displayName } = req.body || {};
  
  if (!uid || !email) {
    return res.status(400).json({ error: 'UID and Email are required' });
  }

  try {
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      await userDocRef.set({
        displayName: displayName || 'ONYX Cadet',
        handicap: 18,
        email: email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        subscriptionStatus: 'none'
      });
    }
    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[AUTH SYNC ERROR]', err);
    res.status(200).json({ success: false, error: err.message });
  }
}

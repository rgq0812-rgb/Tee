import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { GoogleGenAI } from "@google/genai";
import firebaseConfig from '../../firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase Admin
try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        })
      });
      console.log('Firebase Admin initialized successfully.');
    } else {
      console.warn('Firebase Admin: Missing credentials (PROJECT_ID, CLIENT_EMAIL or PRIVATE_KEY). Some features may not work.');
    }
  }
} catch (err: any) {
  console.error('Firebase Admin Init Error:', err.message);
}

export const adminApp = admin.apps.length > 0 ? admin.app() : null;
export const db = (adminApp && firebaseConfig.firestoreDatabaseId)
  ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
  : (adminApp ? getFirestore(adminApp) : null);

export const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
export { admin };

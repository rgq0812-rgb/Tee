import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const adminApp = admin.app();
const projectId = adminApp.options.projectId || firebaseConfig.projectId;
console.log(`[FIREBASE] Admin App initialized for project: ${projectId}`);

// Get Firestore instance
// Use the specific database ID from config if available, otherwise default
const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(adminApp);

console.log(`[FIREBASE] Firestore instance created (databaseId: ${firebaseConfig.firestoreDatabaseId || 'default'})`);

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // IMPORTANT: Webhook MUST be before express.json() to get raw body
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const stripe = getStripe();
      if (!stripeWebhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not set');
      }

      const sig = req.headers['stripe-signature'];
      const event = stripe.webhooks.constructEvent(req.body, sig!, stripeWebhookSecret);

      // Handle the event
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
          console.log(`[WEBHOOK] Payment successful for user ${userId}. Updating subscription...`);
          try {
            await db.collection('users').doc(userId).set({
              subscriptionStatus: 'active',
              updatedAt: FieldValue.serverTimestamp(),
              stripeCustomerId: session.customer as string,
              lastPaymentId: session.payment_intent as string
            }, { merge: true });
            console.log(`[WEBHOOK] User ${userId} successfully upgraded to ACTIVE.`);
          } catch (dbError) {
            console.error('[WEBHOOK DB ERROR]', dbError);
            return res.status(500).send('Database update failed');
          }
        } else {
          console.warn('[WEBHOOK] No userId found in session metadata');
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error(`[WEBHOOK ERROR] ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  app.use(express.json());

  // Sync/Initialize User Profile (Secure via Admin SDK)
  app.post('/api/auth/sync', async (req, res) => {
    const { uid, email, displayName } = req.body || {};
    
    if (!uid || !email) {
      return res.status(400).json({ error: 'UID and Email are required' });
    }

    console.log(`[AUTH SYNC] Attempting sync for ${uid} (${email}) on db: ${firebaseConfig.firestoreDatabaseId || 'default'}`);

    try {
      const userDocRef = db.collection('users').doc(uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        console.log(`[AUTH] Initializing new profile for ${email}`);
        await userDocRef.set({
          displayName: displayName || 'ONYX Cadet',
          handicap: 18,
          email: email,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          subscriptionStatus: 'none'
        });
      } else {
        console.log(`[AUTH] Profile exists for ${email}`);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error('[AUTH SYNC FATAL ERROR]', {
        message: err.message,
        code: err.code,
        details: err.details,
        stack: err.stack,
        projectId: admin.app().options.projectId,
        databaseId: firebaseConfig.firestoreDatabaseId
      });
      // Return 200 but success false to avoid client-side error states if we can help it
      res.status(200).json({ success: false, error: err.message });
    }
  });

  // Stripe Checkout Session
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const stripe = getStripe();
      const { plan, userId } = req.body;
      const host = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const origin = `${protocol}://${host}`;

      const amount = plan === 'yearly' ? 7900 : 999;
      const name = plan === 'yearly' ? 'THE CHOSE - ELITE PASS (ANNUEL)' : 'THE CHOSE - ELITE PASS (MENSUEL)';
      const description = plan === 'yearly' ? 'Accès premium illimité pendant 1 an.' : 'Accès premium illimité pendant 1 mois.';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: name,
                description: description,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment', // Simplifié pour la démo, passer en "subscription" si des Price ID sont créés dans Stripe
        success_url: `${origin}/?payment_status=success`,
        cancel_url: `${origin}/?payment_status=cancel`,
        metadata: {
          userId: userId,
          plan: plan
        }
      });

      res.json({ id: session.id, url: session.url });
    } catch (err: any) {
      console.error('[STRIPE ERROR]', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Spotify Auth URL Construction
  app.get('/api/auth/spotify/url', (req, res) => {
    const client_id = process.env.SPOTIFY_CLIENT_ID;
    if (!client_id) {
       return res.status(500).json({ error: 'SPOTIFY_CLIENT_ID missing' });
    }

    // Use a fixed path for callback
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const origin = `${protocol}://${host}`;
    const redirectUri = `${origin}/auth/spotify/callback`;
    
    const params = new URLSearchParams({
      client_id: client_id,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'user-read-private user-read-email playlist-read-private',
      show_dialog: 'true'
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // YouTube / Google Auth URL Construction
  app.get('/api/auth/youtube/url', (req, res) => {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    if (!client_id) {
       return res.status(500).json({ error: 'GOOGLE_CLIENT_ID missing' });
    }

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const origin = `${protocol}://${host}`;
    const redirectUri = `${origin}/auth/youtube/callback`;
    
    const params = new URLSearchParams({
      client_id: client_id,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url: authUrl });
  });

  // YouTube Callback Handler
  app.get(['/auth/youtube/callback', '/auth/youtube/callback/'], async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      return res.send(`
        <html>
          <body style="background: #000; color: #ff5555; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'YOUTUBE_AUTH_ERROR', error: '${error}' }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
            <div>
              <h2>Erreur YouTube</h2>
              <p>${error}</p>
            </div>
          </body>
        </html>
      `);
    }
    
    res.send(`
      <html>
        <body style="background: #000; color: #FF0000; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'YOUTUBE_AUTH_SUCCESS', code: '${code}' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              window.location.href = '/';
            }
          </script>
          <div>
            <h2 style="color: #FF0000;">✓ YouTube Connecté</h2>
            <p style="color: #fff; opacity: 0.6;">Synchronisation avec Onyx en cours...</p>
          </div>
        </body>
      </html>
    `);
  });

  // Spotify Callback Handler
  app.get(['/auth/spotify/callback', '/auth/spotify/callback/'], async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      return res.send(`
        <html>
          <body style="background: #000; color: #ff5555; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'SPOTIFY_AUTH_ERROR', error: '${error}' }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
            <div>
              <h2>Erreur d'authentification</h2>
              <p>${error}</p>
              <p>Cette fenêtre va se fermer...</p>
            </div>
          </body>
        </html>
      `);
    }

    // In a real app, you would exchange the code for an access token here server-side
    // to keep the client_secret hidden. 
    // We'll pass the code back to the client for the "Connected" UI state.
    
    res.send(`
      <html>
        <body style="background: #000; color: #1DB954; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', code: '${code}' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              window.location.href = '/';
            }
          </script>
          <div>
            <h2 style="color: #1DB954;">✓ Spotify Connecté</h2>
            <p style="color: #fff; opacity: 0.6;">Synchronisation avec Onyx en cours...</p>
          </div>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeClient = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Stripe Checkout Session
  app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripeClient) {
      return res.status(503).json({ error: 'Stripe service unavailable - check environment variables' });
    }

    try {
      const host = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const origin = `${protocol}://${host}`;

      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'ONYX ACCESS (Full Pass)',
                description: 'Accès illimité au moteur tactique ONYX et Adam Counselor.',
              },
              unit_amount: 1900, // 19.00€
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/profile?payment_status=success`,
        cancel_url: `${origin}/profile?payment_status=cancel`,
      });

      res.json({ id: session.id });
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

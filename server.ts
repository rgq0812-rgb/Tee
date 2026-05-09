import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Import Vercel handlers
import generateHandler from './api/ai/generate.js';
import chatHandler from './api/ai/chat.js';
import syncHandler from './api/auth/sync.js';
import checkoutHandler from './api/create-checkout-session.js';
import webhookHandler from './api/webhook.js';
import spotifyUrlHandler from './api/auth/spotify/url.js';
import spotifyCallbackHandler from './api/auth/spotify/callback.js';
import youtubeUrlHandler from './api/auth/youtube/url.js';
import youtubeCallbackHandler from './api/auth/youtube/callback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic body parsing
  app.use(express.json());

  // Helper to wrap Vercel handlers for Express
  const wrap = (handler: any) => async (req: any, res: any) => {
    try {
      // Vercel handlers expect req.query and res.status().json() etc.
      // Express matches this closely enough for these handlers.
      await handler(req, res);
    } catch (err: any) {
      console.error('Handler Error:', err);
      res.status(500).json({ error: err.message });
    }
  };

  // API Routes (must match vercel.json rewrites)
  app.post('/api/ai/generate', wrap(generateHandler));
  app.post('/api/ai/chat', wrap(chatHandler));
  app.post('/api/auth/sync', wrap(syncHandler));
  app.post('/api/create-checkout-session', wrap(checkoutHandler));
  app.post('/api/webhook', wrap(webhookHandler));
  app.get('/api/auth/spotify/url', wrap(spotifyUrlHandler));
  app.get('/api/auth/spotify/callback', wrap(spotifyCallbackHandler));
  app.get('/api/auth/youtube/url', wrap(youtubeUrlHandler));
  app.get('/api/auth/youtube/callback', wrap(youtubeCallbackHandler));
  
  // Custom rewrites from vercel.json
  app.get('/auth/spotify/callback', wrap(spotifyCallbackHandler));
  app.get('/auth/youtube/callback', wrap(youtubeCallbackHandler));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Development server running at http://localhost:${PORT}`);
    console.log('ONYX V2 intelligence bridge active.');
  });
}

startServer();

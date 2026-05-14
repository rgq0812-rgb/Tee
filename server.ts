import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3000;

// Resolve __dirname safely for both ESM and CJS
const getDirname = () => {
  try {
    if (typeof __dirname !== 'undefined') return __dirname;
    return path.dirname(fileURLToPath(import.meta.url));
  } catch (e) {
    return process.cwd();
  }
};

const currentDir = getDirname();

// Static imports for API handlers
import webhookHandler from './api/webhook';
import syncHandler from './api/auth/sync';
import checkoutHandler from './api/create-checkout-session';
import spotifyUrlHandler from './api/auth/spotify/url';
import spotifyCallbackHandler from './api/auth/spotify/callback';
import youtubeUrlHandler from './api/auth/youtube/url';
import youtubeCallbackHandler from './api/auth/youtube/callback';

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', production: isProduction });
  });

  // Webhook handler - Must be before express.json()
  app.post('/api/webhook', async (req: any, res: any) => {
    try {
      await webhookHandler(req, res);
    } catch (err: any) {
      console.error('Webhook Error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.use(express.json());

  const handle = (handler: any) => async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error('API Error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  // API Routes
  app.all('/api/auth/sync', handle(syncHandler));
  app.all('/api/create-checkout-session', handle(checkoutHandler));
  app.all('/api/auth/spotify/url', handle(spotifyUrlHandler));
  app.all('/api/auth/spotify/callback', handle(spotifyCallbackHandler));
  app.all('/api/auth/youtube/url', handle(youtubeUrlHandler));
  app.all('/api/auth/youtube/callback', handle(youtubeCallbackHandler));
  
  app.get('/auth/spotify/callback', handle(spotifyCallbackHandler));
  app.get('/auth/youtube/callback', handle(youtubeCallbackHandler));

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, server.cjs is in dist/, so assets are in the same directory (.)
    // In development, the file is in the root, so assets are in ./dist
    const distPath = isProduction ? currentDir : path.join(currentDir, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Static assets not found. Build may be incomplete.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app };

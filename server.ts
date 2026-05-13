import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Static imports for API handlers to ensure they are bundled by esbuild
// Note: These imports will be resolved by esbuild during the build step
import webhookHandler from './api/webhook';
import syncHandler from './api/auth/sync';
import checkoutHandler from './api/create-checkout-session';
import spotifyUrlHandler from './api/auth/spotify/url';
import spotifyCallbackHandler from './api/auth/spotify/callback';
import youtubeUrlHandler from './api/auth/youtube/url';
import youtubeCallbackHandler from './api/auth/youtube/callback';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Resolve dist path
  const distPath = path.join(process.cwd(), 'dist');

  // Health check for deployment monitoring
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      mode: process.env.NODE_ENV,
      port: PORT,
      timestamp: new Date().toISOString()
    });
  });

  // Webhook handler - IMPORTANT: Must be defined BEFORE express.json()
  // as it needs to consume the raw request stream for Stripe signature verification.
  app.post('/api/webhook', async (req: any, res: any) => {
    try {
      // The handler in api/webhook.ts uses its own buffer logic to read req stream
      await webhookHandler(req, res);
    } catch (err: any) {
      console.error('Webhook Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });

  // JSON Body Parser for other routes
  app.use(express.json());

  // Helper for API routes to handle errors consistently
  const handle = (handler: any) => async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error('API Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  };

  // API Routes
  app.all('/api/auth/sync', handle(syncHandler));
  app.all('/api/create-checkout-session', handle(checkoutHandler));
  app.all('/api/auth/spotify/url', handle(spotifyUrlHandler));
  app.all('/api/auth/spotify/callback', handle(spotifyCallbackHandler));
  app.all('/api/auth/youtube/url', handle(youtubeUrlHandler));
  app.all('/api/auth/youtube/callback', handle(youtubeCallbackHandler));
  
  // SEO/Legacy rewrites for OAuth callbacks
  app.get('/auth/spotify/callback', handle(spotifyCallbackHandler));
  app.get('/auth/youtube/callback', handle(youtubeCallbackHandler));

  // Mode-specific configuration
  if (process.env.NODE_ENV !== 'production') {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false 
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode serving static assets from dist/
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback: send index.html for any unknown routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to 0.0.0.0 for container accessibility
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

// Global error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

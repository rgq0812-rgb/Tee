import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';

// Fix for __filename and __dirname
let __filename = '';
let __dirname = '';

if (typeof import.meta !== 'undefined' && import.meta.url) {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
}

// Static imports for API handlers to ensure they are bundled by esbuild
// Note: These imports will be resolved by esbuild during the build step
import webhookHandler from './api/webhook';
import syncHandler from './api/auth/sync';
import checkoutHandler from './api/create-checkout-session';
import spotifyUrlHandler from './api/auth/spotify/url';
import spotifyCallbackHandler from './api/auth/spotify/callback';
import youtubeUrlHandler from './api/auth/youtube/url';
import youtubeCallbackHandler from './api/auth/youtube/callback';

export const app = express();
const PORT = 3000;

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  // In production, the file is in dist/server.cjs, so assets are in the same folder (.)
  // In development, the file is in the root, so assets are in dist/
  const distPath = isProduction ? __dirname : path.join(process.cwd(), 'dist');

  // Health check for deployment monitoring
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      mode: process.env.NODE_ENV,
      port: PORT,
      timestamp: new Date().toISOString(),
      isProduction,
      distPath
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
      appType: 'custom', // Use 'custom' when we handle the HTML themselves
    });
    app.use(vite.middlewares);

    // Serve index.html for non-API requests
    app.get('*', async (req, res, next) => {
      // Exclude API routes and files with extensions (assets) from being served as index.html
      // This prevents syntax errors when assets fall through Vite middleware
      if (req.url.startsWith('/api') || req.url.includes('.')) {
        return next();
      }

      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (!fs.existsSync(indexPath)) {
          return res.status(404).send('index.html not found');
        }
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production mode serving static assets from the current directory
    // as the bundled server.cjs is located inside dist/
    const distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      console.warn(`Warning: distPath ${distPath} does not exist. Serving from CWD.`);
    }
    app.use(express.static(distPath));
    // SPA fallback: send index.html for any unknown routes
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  // Bind to 0.0.0.0 for container accessibility
  // In Vercel, the app is exported, but here we need to listen.
  const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
  
  if (!isVercel) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
    });
  }
}

// Global error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

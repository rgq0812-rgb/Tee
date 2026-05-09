import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helper to wrap dynamic Vercel handlers for Express
  const wrap = (pathStr: string) => async (req: any, res: any) => {
    try {
      const module = await import(pathStr);
      const handler = module.default;
      if (!handler) throw new Error(`Handler not found at ${pathStr}`);
      await handler(req, res);
    } catch (err: any) {
      console.error(`Handler Error [${pathStr}]:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || 'Internal Server Error' });
      }
    }
  };

  // Webhook FIRST without express.json()
  app.post('/api/webhook', wrap('./api/webhook.ts'));

  app.use(express.json());

  // Essential API Routes (Non-AI)
  app.post('/api/auth/sync', wrap('./api/auth/sync.ts'));
  app.post('/api/create-checkout-session', wrap('./api/create-checkout-session.ts'));
  app.get('/api/auth/spotify/url', wrap('./api/auth/spotify/url.ts'));
  app.get('/api/auth/spotify/callback', wrap('./api/auth/spotify/callback.ts'));
  app.get('/api/auth/youtube/url', wrap('./api/auth/youtube/url.ts'));
  app.get('/api/auth/youtube/callback', wrap('./api/auth/youtube/callback.ts'));
  
  // Custom rewrites from vercel.json
  app.get('/auth/spotify/callback', wrap('./api/auth/spotify/callback.ts'));
  app.get('/auth/youtube/callback', wrap('./api/auth/youtube/callback.ts'));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false 
      },
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
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();

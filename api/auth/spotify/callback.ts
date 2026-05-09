import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query;

  if (error) {
    return res.status(200).send(`
      <html>
        <body style="background: #000; color: #ff5555; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'SPOTIFY_AUTH_ERROR', error: '${error}' }, '*');
              setTimeout(() => window.close(), 3000);
            }
          </script>
          <div>
            <h2>Erreur Spotify</h2>
            <p>${error}</p>
          </div>
        </body>
      </html>
    `);
  }
  
  res.status(200).send(`
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
}

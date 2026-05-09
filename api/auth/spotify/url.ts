import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  const client_id = process.env.SPOTIFY_CLIENT_ID;
  if (!client_id) {
    return res.status(500).json({ error: 'SPOTIFY_CLIENT_ID missing' });
  }

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
  res.status(200).json({ url: authUrl });
}

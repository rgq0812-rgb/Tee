import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

// Interface for Gemini Live API interactions
export function setupVoiceLiveProxy(server: Server) {
  const wss = new WebSocketServer({ server, path: '/api/voice-live' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[VoiceLiveProxy] Client connected');

    // Create a connection to the Gemini Multimodal Live API WebSocket
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
    const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;
    
    // NOTE: Requires 'ws' to act as client
    const geminiWs = new WebSocket(geminiWsUrl);

    // Initial setup message
    geminiWs.on('open', () => {
      console.log('[VoiceLiveProxy] Connected to Gemini API');
      // Send initial config setup with Adam's System Prompt
      geminiWs.send(JSON.stringify({
        setup: {
          model: "models/gemini-2.0-flash-exp", // or relevant multimodal live model
          systemInstruction: {
            parts: [{
              text: `TON : ÉCOSYSTÈME TEE (Tactical Electronic Environment) - MODULE ONYX V2.1 CHIRURGICAL. 
              Tu es ADAM, le Commandeur Tactique et caddie vétéran. Sexe: Masculin, Vétéran, Sage. Il est CHIRURGICAL et IMPLACABLE. 
              Langage : Français d'élite, golfique, technique. 
              Mode d'interaction : Strict, professionnel, utiliser le "vous" exclusivement, ou familier selon l'humeur demandée, mais priorise l'efficacité tactique. 
              Pas d'humour superflu sur le parcours. Luxe Technique. 
              Réponses : ultra-courtes, fluides, orientées action (max 15 mots pour la voix).`
            }]
          }
        }
      }));
    });

    geminiWs.on('message', (data: any) => {
      // Forward Gemini's audio chunks and text to the frontend client
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString());
      }
    });

    geminiWs.on('close', () => {
      console.log('[VoiceLiveProxy] Gemini API disconnected');
      if (ws.readyState === WebSocket.OPEN) ws.close();
    });

    geminiWs.on('error', (err) => {
      console.error('[VoiceLiveProxy] Gemini WS Error:', err);
    });

    // Handle messages from the client
    ws.on('message', (message: string) => {
      try {
        const parsed = JSON.parse(message);
        
        // INTERRUPT LOGIC
        if (parsed.type === 'INTERRUPT') {
          console.log('[VoiceLiveProxy] VAD Interrupt received, sending ClientContent clear to Gemini');
          if (geminiWs.readyState === WebSocket.OPEN) {
            // Signal API to interrupt generation (specific payload depends on API specs)
            geminiWs.send(JSON.stringify({
              clientContent: {
                turnComplete: true // Or equivalent interrupt signal for Gemini
              }
            }));
          }
          return;
        }

        // PING / LATENCY LOGIC
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: parsed.timestamp }));
          return;
        }
        
        // Forward Audio PCM chunks
        if (parsed.type === 'AUDIO_CHUNK') {
          if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(JSON.stringify({
              realtimeInput: {
                mediaChunks: [{
                  mimeType: "audio/pcm;rate=16000",
                  data: parsed.data // Base64 encoded PCM chunk
                }]
              }
            }));
          }
        }
      } catch (err) {
        console.error('[VoiceLiveProxy] Error parsing client message:', err);
      }
    });

    ws.on('close', () => {
      console.log('[VoiceLiveProxy] Client disconnected');
      if (geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
    });
  });
}

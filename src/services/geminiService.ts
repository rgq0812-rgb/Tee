import { GoogleGenAI, Modality } from "@google/genai";
import { GOLF_RULES } from "../constants";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("ERREUR CRITIQUE: GEMINI_API_KEY est manquante dans l'environnement.");
      throw new Error("L'API Key Gemini n'est pas configurée. Veuillez l'ajouter dans les paramètres du projet.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function analyzeSwing(videoThumbnailUrl: string, userNotes?: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `You are a professional PGA golf coach. Analyze this swing image/video frame.
          User notes: ${userNotes || "None"}
          
          Provide feedback in JSON format with:
          - feedback: detailed technical advice
          - score: performance score from 1-100
          - focal_points: 3 bullet points for improvement`
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Swing Analysis Error:", error);
    throw error;
  }
}

export async function getTacticalAdvice(caddie: any, hole: any, distance: number, wind: any, arsenal: any[], form: string, handicap: number) {
  try {
    const ai = getAI();
    const clubsContext = arsenal.map(c => `${c.name} (${c.dist}m)`).join(', ');
    const formLabel = form === 'cold' ? 'Froid/Rigide' : form === 'pure' ? 'Toucher exceptionnel' : 'En forme';
    
    const prompt = `Tu es ${caddie.name}, ${caddie.title}. 
${caddie.personality}

RÈGLES OFFICIELLES DU GOLF (À RESPECTER ET À CITER SI NÉCESSAIRE) :
${GOLF_RULES.map(s => `[${s.title}]\n${s.rules.join('\n')}`).join('\n\n')}

DIRECTIVES D'ÉLITE (STYLE MASTERS) :
- Analyse le vent avec une précision chirurgicale (impact exact en mètres et en clubs).
- Identifie la "Safe Zone" (où rater sans danger) et la "Danger Zone".
- Suggère une forme de coup si nécessaire (Draw, Fade, trajectoire haute/basse).
- Sois décisif. Pas de "peut-être". Un grand caddie aux Masters donne une direction claire.

CONTEXTE TACTIQUE :
- Trou : n°${hole.number} (${hole.name}), Par ${hole.par}, Handicap du trou ${hole.handicap}.
- Index (Handicap) du Joueur : ${handicap}.
- Distance réelle : ${distance} mètres.
- Conditions : Vent de ${wind.speed}km/h venant du ${wind.direction}.
- Sac de Golf (Arsenal) : ${clubsContext}.
- État du joueur (Toucher) : ${formLabel}.

INSTRUCTIONS DE RÉPONSE :
1. Analyse l'effet du vent sur la distance ressentie (ex: "Le vent de face rajoute 12m, ça joue comme 162m").
2. Choisis le club exact de l'arsenal.
3. Donne un point de visée précis (ex: "Vise le bord gauche du bunker" ou "Vise 5m à droite du drapeau").
4. Ton ton : ${caddie.personality.includes('ADAM') ? 'Vétéran calme, précis, focalisé sur la gestion du risque comme aux Masters' : caddie.personality.includes('ANTONI') ? 'Analyste technique, presque poétique sur la physique de la balle' : caddie.personality.includes('ARNOLD') ? 'Direct, agressif, pousse à l\'exploit, cherche le birdie' : 'Froid, mathématique et efficace'}.

REPONSE (Format: ${caddie.name} : "[TON CONSEIL EN 2 PHRASES MAX]") :`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text || `${caddie.name} : "Calcul tactique impossible. Vise le milieu."`;
  } catch (err) {
    console.error("AI Advice Error:", err);
    return `${caddie.name} : "Calcul tactique impossible. Vise le milieu."`;
  }
}

export async function generateSpeech(text: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview", 
      contents: [{ parts: [{ text: `Parle avec un ton de coach de golf professionnel et encourageant en FRANÇAIS: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' } 
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData && p.inlineData.data);
    const base64Audio = audioPart?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
}

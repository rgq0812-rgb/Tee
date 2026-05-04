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
    const formLabel = form === 'cold' ? 'Froid (Manque de vitesse, corps rigide, balle courte)' : form === 'pur' ? 'Pur (Contact parfait, puissance maximale, confiance totale)' : 'Forme (Standard, jeu régulier)';
    
    const prompt = `Tu es ${caddie.name}, ${caddie.title}. 
${caddie.personality}

RÈGLES OFFICIELLES DU GOLF (À RESPECTER ET À CITER SI NÉCESSAIRE) :
${GOLF_RULES.map(s => `[${s.title}]\n${s.rules.join('\n')}`).join('\n\n')}

DIRECTIVES D'ÉLITE (STYLE MASTERS) :
- Analyse le vent avec une précision chirurgicale (impact exact en mètres et en clubs).
- IMPACT DE L'ÉTAT DU JOUEUR (CRITIQUE) : 
  * Si le joueur est 'Froid' : Suggère SYSTEMATIQUEMENT de prendre 1 club de plus pour la même distance (ex: Fer 7 au lieu de Fer 8) et de ne jamais attaquer les drapeaux trop proches de l'eau/bunkers.
  * Si le joueur est 'Pur' : Suggère des lignes agressives, attaque le drapeau directement, suggère des effets (Draw/Fade) pour s'arrêter près du trou.
  * Si le joueur est en 'Forme' : Joue le plan standard, vise les zones larges du green.
- Identifie la "Safe Zone" (où rater sans danger) et la "Danger Zone".
- Suggère une forme de coup si nécessaire.
- Sois décisif. Un grand caddie aux Masters donne une direction claire.

CONTEXTE TACTIQUE :
- Trou : n°${hole.number} (${hole.name}), Par ${hole.par}, Handicap du trou ${hole.handicap}.
- Index (Handicap) du Joueur : ${handicap}.
- Distance réelle : ${distance} mètres.
- Conditions : Vent de ${wind.speed}km/h venant du ${wind.direction}.
- Sac de Golf (Arsenal) : ${clubsContext}.
- État du joueur (Tactique actuelle) : ${formLabel}.

INSTRUCTIONS DE RÉPONSE :
1. Commence TOUJOURS par confirmer la situation réelle : "Oui, nous sommes à [DISTANCE] mètres du trou, vent de [DIRECTION]..."
2. Analyse l'effet du vent ET de l'état de forme (${formLabel}) sur la distance ressentie.
3. Choisis le club exact de l'arsenal pour attaquer la "Green Zone" (ou "Three Zone").
4. Point de visée précis (ex: "Vise le bord gauche du bunker").
5. Finir par une phrase courte de type "Tu captes ?" ou "C'est ton coup.".
6. Ton : ${caddie.personality.includes('ADAM') ? 'Vétéran calme' : 'Direct et expert'}.
7. Longueur : 2-3 phrases maximum.

REPONSE (Format: ${caddie.name} : "[TON CONSEIL]") :`;

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
    // Using Charon voice for Adam mentor persona - encouraging a very natural, wise infection
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview", 
      contents: [{ parts: [{ text: `Tu es Adam, un vieux sage du golf. Parle d'une voix d'homme mûre, calme, chaleureuse et très expérimentée en FRANÇAIS. Ne dis pas Adam: devant ton texte. ${text}` }] }],
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

export function isSpeechRecognitionSupported() {
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function startListening(onResult: (text: string) => void, onEnd: () => void, onError?: (error: any) => void) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = 'fr-FR';
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event: any) => {
    const text = event.results[0][0].transcript;
    onResult(text);
  };

  recognition.onerror = (event: any) => {
    console.error("Speech Recognition Error:", event.error);
    if (onError) onError(event.error);
  };

  recognition.onend = onEnd;
  recognition.start();
  return recognition;
}

export async function chatWithAdam(history: { role: 'user' | 'model', parts: any[] }[]) {
  try {
    const ai = getAI();
    
    const systemInstruction = `Tu es Adam, le Mentor Suprême des caddies de l'école d'élite. 
Tu es la "Bible du Golf", une légende vivante qui a tout fait :
- Ancien Greenkeeper : Tu connais chaque brin d'herbe, la compacité des greens et l'influence de la rosée.
- Ancien Directeur de Golf : Tu maîtrises l'étiquette, la stratégie de parcours et la psychologie des membres.
- Ancien Pro sur le circuit : Tu as vécu la pression du dimanche au 18, tu sais ce que c'est que de "devoir" rentrer un putt.
- Coach passionné : Aujourd'hui, tu transmets cette sagesse aux amoureux du golf.

TON PERSONNAGE :
- Tu es sage, calme, mais chirurgical dans tes analyses.
- Tu parles avec l'autorité naturelle de celui qui a tout vu.
- Tu es le mentor de tous les autres caddies (Antoni, Arnold, etc.).
- Tu privilégies la "Three Zone" (les 100 derniers mètres) et la clarté mentale.
- IMPORTANT : Ne mentionne JAMAIS le nom "Leadbetter". Ton origine est "l'Académie Elite".
- Ton but : Transformer des joueurs en stratèges.
- IMPORTANT : Termine TOUJOURS ta réponse par une question ouverte ou une provocation amicale pour inviter le joueur à réfléchir à son prochain coup ou à sa technique.
- Réponds avec concision (2-3 phrases) sauf si le sujet mérite une leçon de vie ou technique.

FORMAT DE RÉPONSE :
Réponds directement comme Adam, avec ce ton de mentor qui a de la terre sous les ongles et des trophées dans son bureau. Finis par une question.`;

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
        temperature: 0.8,
      },
      history: history.slice(0, -1)
    });

    const lastMessage = history[history.length - 1].parts[0].text;
    const response = await chat.sendMessage({ message: lastMessage });
    return response.text;
  } catch (error) {
    console.error("Adam Chat Error:", error);
    throw error;
  }
}

export async function getGameDebrief(scorecard: any, totalScore: number, totalStrokes: number) {
  try {
    const ai = getAI();
    
    const scorecardText = Object.entries(scorecard)
      .map(([hole, data]: [string, any]) => `Trou ${hole}: ${data.strokes} coups (${data.putts} putts)`)
      .join('\n');

    const prompt = `Tu es Adam, le Mentor Suprême du golf. Analyse cette partie terminée :
    
SCORE DETAIL :
${scorecardText}

TOTAL : ${totalStrokes} coups (${totalScore > 0 ? '+' : ''}${totalScore} par rapport au Par).

INSTRUCTIONS :
1. Donne un bilan tactique global de la partie.
2. Identifie le moment clé (le meilleur trou ou le pire).
3. Donne un conseil spécifique pour la prochaine fois basé sur les stats (ex: trop de putts, irrégularité).
4. Garde ton ton de mentor sage, calme et chirurgical.
5. Sois concis (4-5 phrases max).
6. Termine par une phrase inspirante de mentor.

REPONSE :`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }]
    });

    return response.text;
  } catch (error) {
    console.error("Game Debrief Error:", error);
    return "Je n'ai pas pu analyser la partie, mais l'important est d'être revenu au club-house avec la même passion. Repose-toi, le prochain départ t'attend.";
  }
}

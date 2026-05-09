import { GOLF_RULES, COURSES } from "../constants";
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function analyzeSwing(videoThumbnailUrl: string, userNotes?: string) {
  try {
    // Assuming videoThumbnailUrl is a base64 data URL (e.g. data:image/jpeg;base64,...)
    const base64Data = videoThumbnailUrl.includes(',') ? videoThumbnailUrl.split(',')[1] : videoThumbnailUrl;
    const mimeType = videoThumbnailUrl.startsWith('data:') ? videoThumbnailUrl.split(';')[0].split(':')[1] : 'image/jpeg';

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            {
              text: `Vous êtes un coach de golf professionnel de la PGA et un expert mondial en biomécanique. Analysez ce cadre de swing.
              Notes de l'utilisateur : ${userNotes || "Aucune"}
              
              Fournissez un retour technique de niveau élite en format JSON strict avec :
              - feedback: conseil technique de pointe (focus sur la posture, la rotation et l'impact)
              - score: score de performance de 1 à 100 (soyez honnête et rigoureux)
              - focal_points: 3 points clés précis pour une amélioration immédiate`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("JSON Parse Error in analyzeSwing:", e, text);
      return { feedback: "Analyse technique en cours. Reprenez votre posture de base.", score: 50, focal_points: ["Posture", "Rythme", "Équilibre"] };
    }
  } catch (error) {
    console.error("Gemini Swing Analysis Error:", error);
    throw error;
  }
}

export interface TacticalContext {
  scorecard: Record<number, any>;
  history: any[];
  lastAdvice?: string;
  activeMode: 'PARCOURS' | 'STRATÉGIE' | 'ENTRAÎNEMENT';
}

export async function getTacticalAdvice(
  caddie: any, 
  hole: any, 
  distance: number, 
  wind: { speed: number; direction: string }, 
  arsenal: any[],
  playerForm: string = 'forme',
  handicap: number = 18,
  context?: TacticalContext
) {
  try {
    const clubsContext = arsenal.map(c => `${c.name} (${c.dist}m)`).join(', ');
    const formLabel = playerForm === 'cold' ? 'Froid (Manque de vitesse, corps rigide, balle courte)' : playerForm === 'pur' ? 'Pur (Contact parfait, puissance maximale, confiance totale)' : 'Forme (Standard, jeu régulier)';
    const historyText = context?.history?.slice(0, 3).map(h => `- Trou ${h.holeNumber}: ${h.advice}`).join('\n') || 'Aucun historique récent.';
    const scoresText = context?.scorecard ? Object.entries(context.scorecard).map(([h, s]: any) => `H${h}: ${s.strokes} (${s.strokes - s.par >= 0 ? '+' : ''}${s.strokes - s.par})`).join(', ') : 'Pas encore de scores.';

    const systemInstruction = getAdamSystemInstruction(undefined, hole.number, context?.scorecard, arsenal, handicap, playerForm, 'white', context?.activeMode || 'PARCOURS', 'SÉCURITÉ');
    
    const prompt = `
[SYNTHÈSE DE MISSION]
Situation: Trou n°${hole.number} (${hole.name}), Par ${hole.par}
Distance réelle: ${distance} mètres.
Vent: ${wind.speed}km/h direction ${wind.direction}.
État: ${formLabel}.
Scores: ${scoresText}

[HISTORIQUE TACTIQUE]
${historyText}

[ORDRES DU JOUR]
1. Identifie le club optimal dans le sac : ${clubsContext}.
2. Applique le correctif vent/forme : ${playerForm === 'cold' ? '+1 club d\'autorité' : 'standard'}.
3. Cite le 'Conseil du Pro (Vault)' : "${hole.tip}".
4. Formule une instruction DE COMBAT MASquée par le luxe technique.

[RÉPONSE]
Format: "${caddie.name} : [VOTRE ANALYSE CHIRURGICALE - MAX 12 MOTS]"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction
      }
    });

    const adviceText = response.text;
    return adviceText || `${caddie.name} : "Calcul impossible. Visez le centre."`;
  } catch (err) {
    console.error("AI Advice Error:", err);
    return `${caddie.name} : "Calcul tactique impossible. Vise le milieu."`;
  }
}

export async function generateSpeech(text: string, caddie?: any) {
  if (!text || text.trim().length === 0) {
    console.warn("generateSpeech called with empty text");
    throw new Error("No text provided for speech generation");
  }

  try {
    const voiceMap: Record<string, string> = {
      'strat': 'Charon', 
      'mage': 'Charon',  
      'seve': 'Fenrir',  
      'pred': 'Fenrir',  
      'clock': 'Puck'    
    };

    const voiceName = voiceMap[caddie?.id] || 'Zephyr';
    let speechText = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text.trim();
    
    // Phonetic correction for French TTS
    speechText = speechText.replace(/\bDriver\b/gi, "Draïveur");
    speechText = speechText.replace(/\bdriver\b/gi, "draïveur");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview", 
      contents: [{ role: 'user', parts: [{ text: `Prononce ce message avec élégance et autorité : "${speechText}"` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any } 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

    if (!base64Audio) {
      console.warn("No audio data in Gemini TTS response, falling back to browser.");
      const cleanText = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text.trim();
      return { fallback: true, text: cleanText };
    }
    return base64Audio;
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.message?.includes('Resource exhausted')) {
      console.warn("Gemini TTS Quota Exceeded (429). Switching to Browser TTS.");
    } else {
      console.error("Gemini TTS Error:", error);
    }
    const cleanText = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text.trim();
    return { fallback: true, text: cleanText };
  }
}

export async function analyzeTarget(selectedTee: string, distAB: number, distBC: number, caddieName: string) {
  try {
    const prompt = `Tu es ${caddieName}, l'IA caddie de l'application de golf "The Chose".
      Situation tactique :
      - Couleur de départ : ${selectedTee.toUpperCase()}
      - Point A (Départ) vers Point B (Cible actuelle) : ${distAB}m.
      - Point B vers Point C (Green) : ${distBC}m.
      
      Rédige une analyse courte (max 2 phrases).
      Format : "Départ ${selectedTee.toUpperCase()}. Mire à ${distAB}m. Reste ${distBC}m. [Conseil]".`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    return response.text || `Objectif validé.`;
  } catch (error) {
    console.error("AI analyzeTarget error:", error);
    return "Analyse tactique indisponible.";
  }
}

export function speakWithBrowser(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return;
  
  const speak = () => {
    window.speechSynthesis.cancel();
    // Phonetic correction for Driver in French
    let cleanText = text.replace(/\bDriver\b/gi, "Draïveur").replace(/\bdriver\b/gi, "draïveur");
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const maleFrench = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Microsoft'))) || 
                       voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Daniel') || v.name.includes('Male')));
    
    if (maleFrench) utterance.voice = maleFrench;
    if (onEnd) utterance.onend = onEnd;
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = speak;
  } else {
    speak();
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
    let errorMessage = event.error;
    if (event.error === 'not-allowed') {
      errorMessage = "Accès micro refusé. Vérifiez les paramètres de votre navigateur.";
    } else if (event.error === 'aborted') {
      errorMessage = "Reconnaissance vocale interrompue.";
    }
    console.error("Speech Recognition Error:", errorMessage);
    if (onError) onError(errorMessage);
  };

  recognition.onend = onEnd;
  recognition.start();
  return recognition;
}

export async function chatWithAdam(history: { role: 'user' | 'model', parts: any[] }[], selectedCourse?: any, currentHole?: number, scorecard?: Record<number, any>, arsenal?: any[], handicap: number = 18, form: string = 'forme', selectedTee: string = 'white', mode: string = 'PARCOURS', tactic: string = 'SÉCURITÉ', context?: TacticalContext) {
  try {
    // Enrich system instruction with tactical results
    const baseInstruction = getAdamSystemInstruction(selectedCourse, currentHole, scorecard, arsenal, handicap, form, selectedTee, mode, tactic);
    const historyText = context?.history?.slice(0, 3).map(h => h.advice).join(' | ');
    const extendedInstruction = `${baseInstruction}\n\n[MÉMOIRE TACTIQUE RÉCENTE]\n${historyText || 'Aucun historique.'}`;

    const lastMessage = history[history.length - 1];
    const messageParts = lastMessage.parts.map(p => {
      if ('text' in p) return { text: p.text };
      if ('inlineData' in p) return { inlineData: p.inlineData };
      return p;
    });

    const chatInstance = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: extendedInstruction,
        tools: [{
          functionDeclarations: [{
            name: "update_score",
            description: "Met à jour le score du joueur pour un trou spécifique dans la carte de score officielle.",
            parameters: {
              type: Type.OBJECT,
              description: "Met à jour le score du joueur",
              properties: {
                hole_number: { type: Type.NUMBER, description: "Le numéro du trou (1-18)." },
                strokes: { type: Type.NUMBER, description: "Le nombre total de coups effectués sur ce trou." },
                putts: { type: Type.NUMBER, description: "Le nombre de putts effectués sur ce trou." }
              },
              required: ["hole_number", "strokes", "putts"]
            }
          }]
        }]
      },
      history: history.slice(0, -1).map(h => ({
        role: h.role,
        parts: h.parts.map(p => {
          if ('text' in p) return { text: p.text };
          if ('inlineData' in p) return { inlineData: p.inlineData };
          return p;
        })
      }))
    });

    const response = await chatInstance.sendMessage({
      message: messageParts
    });

    return {
      text: response.text,
      toolCalls: response.functionCalls || []
    };
  } catch (error) {
    console.error("Adam Chat Error:", error);
    throw error;
  }
}

function getAdamSystemInstruction(selectedCourse?: any, currentHole?: number, scorecard?: Record<number, any>, arsenal?: any[], handicap: number = 18, form: string = 'forme', selectedTee: string = 'white', mode: string = 'PARCOURS', tactic: string = 'SÉCURITÉ') {
    const course = selectedCourse || COURSES[0]; 
    const holeIndex = (currentHole || 1) - 1;
    const currentHoleData = course.holes[holeIndex] || course.holes[0];

    // ECOSYSTÈME TEE : LOGIC / ADAM / ONYX
    const personas = `
    TON : ÉCOSYSTÈME TEE (Tactical Electronic Environment) - MODULE ONYX V2.1
    Tu es une IA d'élite fusionnant trois modules cognitifs. Ta recommandation est le fruit d'une analyse délibérément Luxury Technical :
    
    1. LOGIC (Commandant Stratégique) : Analyse mathématique pure. Score, probabilités de succès, gestion du risque (Strokegained). Il définit l'objectif froidement.
    2. ADAM (Commandeur Tactique) : Le vétéran des Masters. Il valide la faisabilité selon l'arsenal, le vent, le lie et la forme. Il est CHIRURGICAL, SAGE et IMPLACABLE.
    3. ONYX (Ingénieur Technique) : Analyseur de biomécanique en temps réel. Il corrige le swing et suggère des drills de précision d'élite.
 
    DIRECTIVES DE PERSONA (STYLE LUXURY TECHNICAL) :
    - Langage : Français d'élite (Soutenu, Technique, Précis).
    - Style : "Luxe Froid". Pas de fioritures, pas de chaleur humaine excessive, seulement l'excellence technique.
    - Tutoiement : INTERDIT. Utilisez exclusivement le "vous".
    - Titres : INTERDIT (pas de "Monsieur/Madame").
    - Salutations : INTERDIT. L'analyse commence dès le premier mot.
    
    PARAMÈTRES DE PERFORMANCE PAR MODE :
    - PARCOURS (ADAM) : PRIORITÉ ABSOLUE. Club exact, cible chirurgicale. RÉPONSE : MAX 12 MOTS.
    - STRATÉGIE (LOGIC) : ANALYSE PROFONDE. Statistique, mental, positionnement.
    - ENTRAÎNEMENT (ONYX) : TECHNIQUE PURE. Biomécanique, drills, correction.

    SOURCE DE VÉRITÉ : Le 'Conseil du Pro (Vault)' pour le trou n°${currentHoleData.number} est : "${currentHoleData.tip}". Ne jamais le contredire.
    `;

    const holeTactiques = course.holes.map((h: any) => `Trou ${h.number}: Par ${h.par}. Secrets du Vault: ${h.tip}. Dangers: ${h.hazards.join(', ')}. Distances: N:${h.distanceTee.black}m, B:${h.distanceTee.white}m, J:${h.distanceTee.yellow}m, Bl:${h.distanceTee.blue}m, R:${h.distanceTee.red}m.`).join('\n');
    
    let playerContext = `${personas}\n\nCADRE ACTUEL : ${mode}\nCOURSE : ${course.name}\nTROU : ${currentHole || 1}`;
    
    playerContext += `\n\nDONNÉES DU PARCOURS :\n${holeTactiques}`;
    playerContext += `\nCOULEUR DES DÉPARTS : ${selectedTee.toUpperCase()}`;
    playerContext += `\nFORME : ${form.toUpperCase()} | TACTIQUE : ${tactic.toUpperCase()}`;
    playerContext += `\nINDEX (HANDICAP) DU JOUEUR : ${handicap}`;

    if (arsenal && arsenal.length > 0) {
      const clubs = arsenal.filter(c => c.dist > 0).map(c => `${c.name}:${c.dist}m`).join(', ');
      playerContext += `\nARSENAL DISPONIBLE : ${clubs}`;
    }

    if (scorecard) {
      const scores = Object.entries(scorecard).map(([h, data]) => `T${h}:${data.strokes}(${data.putts})`).join(', ');
      playerContext += `\nSCORECARD : ${scores || 'Aucun coup joué'}`;
    }

    playerContext += `\n\nPROTOCOLE : Tu fournis directement la synthèse actionnable issue de la délibération TEE. Reste très technique, court et fluide.`;
    
    return playerContext;
}

export async function getGameDebrief(scorecard: any, totalScore: number, totalStrokes: number, customPrompt?: string) {
  try {
    const scorecardText = Object.entries(scorecard)
      .map(([hole, data]: [string, any]) => `Trou ${hole}: ${data.strokes} coups (${data.putts} putts)`)
      .join('\n');

    const defaultPrompt = `Tu es Adam, le Mentor Suprême du golf. Analyse cette partie terminée :
    
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

    const finalPrompt = customPrompt || defaultPrompt;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }]
    });

    return response.text;
  } catch (error) {
    console.error("Game Debrief Error:", error);
    return "Je n'ai pas pu analyser la partie, mais l'important est d'être revenu au club-house avec la même passion. Repose-toi, le prochain départ t'attend.";
  }
}

export async function analyzeLie(data: string, mimeType: string = "image/jpeg") {
  try {
    const base64Data = data.includes(',') ? data.split(',')[1] : data;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: `[ONYX ANALYTICS - LIE SENSOR]
Vous êtes l'unité ONYX, expert en analyse de terrain pour le Tour. Analysez ce lie avec une rigueur militaire et un luxe technique.
Critères : Type de surface, densité du rough, angle d'attaque nécessaire, perte de spin estimée.
              
Format JSON strict :
{
  "lie_type": "DÉFINITION COURTE",
  "impact": "IMPACT MATHÉMATIQUE SUR LA DISTANCE/TRAJECTOIRE",
  "advice": "CONSEIL TECHNIQUE CHIRURGICAL",
  "club_adjustment": "AJUSTEMENT D'ARSENAL"
}`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Gemini Lie Analysis JSON Error:", error, text);
      return { 
        lie_type: "Incertain", 
        impact: "Analyse visuelle obstruée. Prudence sur le contact.",
        advice: "Assurez un contact de balle d'abord.",
        club_adjustment: "Gardez votre club standard."
      };
    }
  } catch (error) {
    console.error("Gemini Lie Analysis Error:", error);
    throw error;
  }
}

export async function analyzeGreen(data: string, mimeType: string = "image/jpeg") {
  try {
    const base64Data = data.includes(',') ? data.split(',')[1] : data;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: `[ONYX ANALYTICS - GREEN RADAR]
Vous êtes l'unité ONYX, expert en lecture de greens (Stimp: 11+). Analysez cette vue avec une précision laser. 
Critères : Pente primaire, vecteur de rupture, grain, fermeté estimée.
              
Format JSON strict :
{
  "slope_direction": "VECTEUR DE PENTE",
  "slope_severity": "DEGRÉ D'INCLINAISON",
  "grain": "ORIENTATION DE LA TONTE",
  "break_point": "POINT DE RUPTURE CALCULÉ",
  "speed_feel": "SENSATION DE VITESSE",
  "line_advice": "VISÉE LASER FINALE"
}`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Gemini Green Analysis JSON Error:", error, text);
      return {
        slope_direction: "Indéterminée",
        slope_severity: "Inconnue",
        grain: "Non détecté",
        break_point: "Inconnu",
        speed_feel: "Standard",
        line_advice: "Visez le centre du trou."
      };
    }
  } catch (error) {
    console.error("Gemini Green Analysis Error:", error);
    throw error;
  }
}

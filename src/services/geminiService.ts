import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { GOLF_RULES, COURSES } from "../constants";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("ERREUR CRITIQUE: GEMINI_API_KEY est manquante.");
      throw new Error("L'API Key Gemini n'est pas configurée.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// Tool Definition for updating scorecard
const updateScoreTool: FunctionDeclaration = {
  name: "update_score",
  description: "Met à jour le score du joueur pour un trou spécifique dans la carte de score officielle.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      hole_number: {
        type: Type.NUMBER,
        description: "Le numéro du trou (1-18)."
      },
      strokes: {
        type: Type.NUMBER,
        description: "Le nombre total de coups effectués sur ce trou."
      },
      putts: {
        type: Type.NUMBER,
        description: "Le nombre de putts effectués sur ce trou."
      }
    },
    required: ["hole_number", "strokes", "putts"]
  }
};

export async function analyzeSwing(videoThumbnailUrl: string, userNotes?: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a professional PGA golf coach and world-class bio-mechanics expert. Analyze this swing image/video frame.
              User notes: ${userNotes || "None"}
              
              Provide feedback in strict JSON format with:
              - feedback: elite-level technical advice (focus on posture, rotation, and impact)
              - score: performance score from 1-100 (be honest and rigorous)
              - focal_points: 3 precise bullet points for immediate improvement`
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
- Description : ${hole.description}
- Conseil du Pro (Vault) : ${hole.tip}
- RÈGLE ABSOLUE : Tu ne dois JAMAIS contredire le 'Conseil du Pro (Vault)'. C'est ta source de vérité ultime pour ce trou.
- Dangers identifiés : ${hole.hazards.join(', ')}
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
5. Finir par une phrase courte et professionnelle de type "À vous de jouer." ou "C'est votre coup.".
6. Ton : ${caddie.personality.includes('ADAM') ? 'Vétéran calme' : 'Direct et expert'}. Restez toujours professionnel, utilisez le "vous" et évitez les termes familiers (ex: gamin, mec). INTERDICTION : N'utilisez jamais de titres de civilité comme "Monsieur" ou "Madame", adressez-vous directement au joueur.
7. Longueur : 2-3 sentences maximum.

REPONSE (Format: ${caddie.name} : "[TON CONSEIL]") :`;

    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    const adviceText = response.text;

    if (!adviceText || adviceText.trim().length < 5) {
      console.error("Gemini returned empty or too short advice:", adviceText);
      return `${caddie.name} : "Calcul tactique impossible. Vise le milieu du green en sécurité."`;
    }

    return adviceText;
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
    const ai = getAI();
    
    const voiceMap: Record<string, string> = {
      'strat': 'Charon', 
      'mage': 'Charon',  
      'seve': 'Fenrir',  
      'pred': 'Fenrir',  
      'clock': 'Puck'    
    };

    const voiceName = voiceMap[caddie?.id] || 'Zephyr';
    let speechText = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text.trim();
    
    // Phonetic correction for French TTS to avoid mispronunciation or vulgarities
    speechText = speechText.replace(/\bDriver\b/gi, "Draïveur");
    speechText = speechText.replace(/\bdriver\b/gi, "draïveur");

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview", 
      contents: [{ role: 'user', parts: [{ text: `Prononce ce message avec élégance et autorité : "${speechText}"` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName } 
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No candidates returned from Gemini TTS");
    
    const audioPart = candidate.content?.parts?.find(p => p.inlineData);
    const base64Audio = audioPart?.inlineData?.data;

    if (!base64Audio) {
      console.warn("No audio data in Gemini TTS response, falling back to browser.");
      const cleanText = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text.trim();
      return { fallback: true, text: cleanText };
    }
    return base64Audio;
  } catch (error: any) {
    // If it's a quota error, we log it but don't crash, the UI will use browser TTS
    if (error?.message?.includes('429') || error?.message?.includes('Resource exhausted')) {
      console.warn("Gemini TTS Quota Exceeded (429). Switching to Browser TTS.");
    } else {
      console.error("Gemini TTS Error:", error);
    }
    const cleanText = text.includes(':') ? text.split(':').slice(1).join(':').trim() : text.trim();
    return { fallback: true, text: cleanText };
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

export async function chatWithAdam(history: { role: 'user' | 'model', parts: any[] }[], selectedCourse?: any, currentHole?: number, scorecard?: Record<number, any>, arsenal?: any[], handicap: number = 18, form: string = 'forme', selectedTee: string = 'white', mode: string = 'PARCOURS', tactic: string = 'SÉCURITÉ') {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: "gemini-flash-latest", 
      config: {
        systemInstruction: getAdamSystemInstruction(selectedCourse, currentHole, scorecard, arsenal, handicap, form, selectedTee, mode, tactic),
        tools: [{ functionDeclarations: [updateScoreTool] }]
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

    const lastMessage = history[history.length - 1];
    const messageParts = lastMessage.parts.map(p => {
      if ('text' in p) return { text: p.text };
      if ('inlineData' in p) return { inlineData: p.inlineData };
      return p;
    });

    const response = await chat.sendMessage({ 
      message: messageParts
    });

    const responseText = response.text;
    const toolCalls = response.functionCalls;

    return {
      text: responseText,
      toolCalls: toolCalls || []
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
    TON : ÉCOSYSTÈME TEE (Tactical Electronic Environment)
    Tu es une IA de combat fusionnant trois modules. Ta recommandation est la synthèse d'une délibération interne (non affichée) :

    1. LOGIC (Stratège) : Analyse le score et le Risk/Reward. Il définit l'objectif (ex: "Le Par est obligatoire").
    2. ADAM (Tactique) : Valide la faisabilité physique (distances, vent, lie). S'il doute, il "passe la main" à ONYX.
    3. ONYX (Entraînement) : C'est le cœur du mode ENTRAÎNEMENT. Sa mission est de transformer les doutes d'ADAM ou les erreurs du joueur en exercices (drills) concrets à faire sur le champ.

    DIRECTIVE DE RÉPONSE PAR MODE :
    - ENTRAÎNEMENT : ONYX est le leader absolu. Ne parle que de technique, de drills et de sensation. Ignore le score global. Si le joueur mentionne un problème tactique, transforme-le en drill technique immédiat.
    - STRATÉGIE (LOGIC) : Focus sur la gestion de parcours, le placement et le mental. Évalue le Risk/Reward.
    - PARCOURS (ADAM) : Focus sur le coup immédiat, la cible et le club. CHIRURGICAL, COURT (MAX 15 MOTS). Ne salue pas, ne fais pas de politesse. Va droit au but.

    INTERACTION TEE :
    Si ADAM (Parcours) identifie un risque trop élevé pour l'Arsenal du joueur, il doit suggérer une stratégie de repli, et ONYX doit AUTOMATIQUEMENT proposer un exercice pour corriger ce manque technique plus tard.

    PROTOCOLE DE RÉPONSE : 
    - Ne montre PAS le dialogue interne.
    - OBLIGATOIRE : Commence par [ONYX], [LOGIC] ou [ADAM] selon qui prend le leadership du conseil final.
    - Ton : Vétéran, chirurgical, sans markdown. Adressez-vous au joueur par "vous". Interdiction : N'utilisez JAmais "Monsieur" ou "Madame".
    - SOURCE DE VÉRITÉ : Pour le trou actuel (${currentHoleData.number}), tu dois respecter ABSOLUMENT le 'Conseil du Pro (Vault)' : "${currentHoleData.tip}". C'est une directive de parcours non négociable.
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
    const ai = getAI();
    
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
      model: "gemini-flash-latest",
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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            },
            {
              text: `Tu es un expert caddie de tournoi. Analyse cette ${mimeType.includes('video') ? 'séquence vidéo' : 'image'} montrant la position de la balle de golf dans l'herbe (le "lie"). Soyez extrêmement professionnel, utilisez le "vous" et évitez absolument tout langage familier. N'utilisez JAMAIS "Monsieur" ou "Madame".

              Fournis une analyse technique en JSON with :
              - lie_type: (ex: Fairway, Rough épais, Divot, Sable, Herbe couchée)
              - impact: (l'effet sur le contact et la distance, ex: "La balle va sortir avec peu de spin et rouler beaucoup")
              - advice: (conseil technique pour jouer le coup, ex: "Mets la balle un peu plus à droite dans ton stance")
              - club_adjustment: (ex: "Prends un club de plus car l'herbe va freiner la tête de club")`
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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            },
            {
              text: `Tu es un expert caddie de tournoi spécialisé dans la lecture de greens. Analyse cette ${mimeType.includes('video') ? 'séquence vidéo' : 'image'} du green devant le joueur. Soyez professionnel et courtois, utilisez le "vous". N'utilisez JAMAIS de titres comme "Monsieur" ou "Madame".

              Fournis une analyse technique en JSON with :
              - slope_direction: (ex: "Légère pente de gauche à droite", "Remontée franche")
              - slope_severity: (ex: "Faible", "Modérée", "Sévère")
              - grain: (ex: "Grain vers le trou", "Grain latéral")
              - break_point: (ex: "Le point de rupture est à mi-chemin sur la gauche")
              - speed_feel: (ex: "Le green semble rapide, joue la balle avec douceur")
              - line_advice: (conseil précis sur où viser, ex: "Vise 2 cups à gauche du trou")`
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

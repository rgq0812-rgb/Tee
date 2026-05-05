import { GoogleGenAI, Modality } from "@google/genai";
import { GOLF_RULES, COURSES } from "../constants";

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
- Description : ${hole.description}
- Conseil du Pro (Vault) : ${hole.tip}
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
6. Ton : ${caddie.personality.includes('ADAM') ? 'Vétéran calme' : 'Direct et expert'}. Restez toujours professionnel, utilisez le "vous" et évitez les termes familiers (ex: gamin, mec).
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

export async function generateSpeech(text: string, caddie?: any) {
  if (!text || text.trim().length === 0) {
    console.warn("generateSpeech called with empty text");
    throw new Error("No text provided for speech generation");
  }

  try {
    const ai = getAI();
    
    // Voice mapping based on caddie
    const voiceMap: Record<string, string> = {
      'adam': 'Charon',
      'antoni': 'Aoede',
      'arnold': 'Fenrir',
      'josh': 'Puck'
    };

    const caddieName = caddie?.name || 'Adam';
    const voiceName = voiceMap[caddie?.id] || 'Charon';
    const caddieRole = caddie?.title || 'Mentor de golf';

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview", 
      contents: [{ 
        parts: [{ 
          text: `Tu es ${caddieName}, ${caddieRole}. Parle d'une voix qui correspond à ta personnalité. Prononce ceci : ${text}` 
        }] 
      }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName } 
          },
        },
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini TTS");
    }

    const firstCandidate = candidates[0];
    const parts = firstCandidate.content?.parts;
    
    if (!parts) {
      console.error("No parts in candidate content:", firstCandidate);
      throw new Error("No content parts returned from Gemini TTS");
    }

    const audioPart = parts.find(p => p.inlineData && p.inlineData.data);
    const base64Audio = audioPart?.inlineData?.data;

    if (!base64Audio) {
      const textPart = parts.find(p => p.text);
      if (textPart) {
        console.warn("Gemini returned text instead of audio. Text:", textPart.text);
        throw new Error(`Model returned text instead of audio: ${textPart.text}`);
      }
      console.error("Full response parts for debugging:", JSON.stringify(parts));
      throw new Error("No audio data returned in any part of the response");
    }

    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error, falling back to Browser TTS:", error);
    // Fallback: This will return null or special signal so the caller knows to use Browser TTS
    // Actually, it's better to implement the browser fallback here or return a indicator
    return { fallback: true, text };
  }
}

export function speakWithBrowser(text: string, onEnd?: () => void) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = 0.9;
  utterance.pitch = 0.85;
  
  const voices = window.speechSynthesis.getVoices();
  const maleFrench = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Daniel') || v.name.includes('Male')));
  if (maleFrench) utterance.voice = maleFrench;
  
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
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

export async function chatWithAdam(history: { role: 'user' | 'model', parts: any[] }[], selectedCourse?: any, currentHole?: number) {
  try {
    const ai = getAI();
    
    const course = selectedCourse || COURSES[0]; // Pont Royal par défaut
    const holeTactiques = course.holes.map((h: any) => `Trou ${h.number} (${h.name}): ${h.description}. Conseil: ${h.tip}. Dangers: ${h.hazards.join(', ')}.`).join('\n');
    const playerContext = currentHole ? `Le joueur se trouve sur le trou n°${currentHole} du parcours ${course.name}.` : `Le joueur est sur le parcours ${course.name}.`;

    const systemInstruction = `Tu es Adam, le Mentor Suprême des caddies de l'école d'élite. 
Tu es la "Bible du Golf", une légende vivante qui a tout fait :
- Ancien Greenkeeper : Tu connais chaque brin d'herbe.
- Ancien Directeur de Golf : Tu maîtrises l'étiquette et la stratégie.
- Ancien Pro sur le circuit : Tu as vécu la pression du dimanche au 18.
- Coach passionné : Aujourd'hui, tu transmets cette sagesse.

${playerContext}

CONNAISSANCES DU TERRAIN (${course.name} - VAULT TACTIQUE) :
Voici les détails stratégiques du parcours que tu connais par cœur :
${holeTactiques}

TON PERSONNAGE :
- Tu es sage, calme, mais chirurgical dans tes analyses.
- Tu parles avec l'autorité naturelle de celui qui a tout vu.
- Tu es le mentor de tous les autres caddies (Antoni, Arnold, etc.).
- Tu privilégies la "Three Zone" (les 100 derniers mètres) et la clarté mentale.
- IMPORTANT : Ne mentionne JAMAIS le nom "Leadbetter". Ton origine est "l'Académie Elite".
- Ton but : Transformer des joueurs en stratèges.
- IMPORTANT : Termine TOUJOURS ta réponse par une question ouverte ou un défi professionnel pour inviter le joueur à réfléchir à son prochain coup ou à sa technique.
- Réponds avec concision (2-3 phrases) sauf si le sujet mérite une leçon de vie ou technique.
- LANGAGE : Utilisez toujours le "vous". Soyez extrêmement respectueux et professionnel. Interdiction formelle d'utiliser des termes familiers.

FORMAT DE RÉPONSE :
Réponds directement comme Adam, avec ce ton de mentor sage et hautement respecté des parcours. Finis par une question.`;

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

export async function analyzeLie(data: string, mimeType: string = "image/jpeg") {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            },
            {
              text: `Tu es un expert caddie de tournoi. Analyse cette ${mimeType.includes('video') ? 'séquence vidéo' : 'image'} montrant la position de la balle de golf dans l'herbe (le "lie"). Soyez extrêmement professionnel, utilisez le "vous" et évitez absolument tout langage familier.
              
              Fournis une analyse technique en JSON avec :
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Lie Analysis Error:", error);
    throw error;
  }
}

export async function analyzeGreen(data: string, mimeType: string = "image/jpeg") {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: data
              }
            },
            {
              text: `Tu es un expert caddie de tournoi spécialisé dans la lecture de greens. Analyse cette ${mimeType.includes('video') ? 'séquence vidéo' : 'image'} du green devant le joueur. Soyez professionnel et courtois, utilisez le "vous".
              
              Fournis une analyse technique en JSON avec :
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

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Green Analysis Error:", error);
    throw error;
  }
}

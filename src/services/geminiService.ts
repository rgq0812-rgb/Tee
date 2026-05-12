import { GOLF_RULES, COURSES } from "../constants";
import { GoogleGenAI, Modality, Type } from "@google/genai";

// Initialize AI client 
// In AI Studio, process.env.GEMINI_API_KEY is injected into the Vite environment
const GEMINI_API_KEY = (import.meta.env?.VITE_GEMINI_API_KEY) || (process.env.GEMINI_API_KEY) || '';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Helper to parse JSON from AI responses that might be wrapped in markdown
function parseAIJson(text: string) {
  try {
    // 1. Try direct parsing
    return JSON.parse(text.trim());
  } catch (e) {
    // 2. Try to find JSON block using regex if markdown is present
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e2) {
        console.error("Failed to parse extracted JSON:", e2, jsonMatch[1]);
        throw e2;
      }
    }
    console.error("No JSON found in text:", text);
    throw e;
  }
}

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
      return parseAIJson(text);
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
  historicalProfile?: {
    tacticalSummary: string;
    holeAdvice: Record<number, string>;
  };
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

    const holeDetails = `
      PAYSAGE : ${hole.name}
      DANGERS : ${hole.hazards.join(', ') || 'Aucun danger majeur détecté'}
      SECRET DU VAULT : ${hole.tip}
      MORPHOLOGIE : Green ${caddie.zone === 'center' ? 'central' : caddie.zone === 'left' ? 'protégé à gauche' : 'protégé à droite'}.
    `;

    const systemInstruction = getAdamSystemInstruction(undefined, hole.number, context?.scorecard, arsenal, handicap, playerForm, context?.lastAdvice?.includes('TEE_COLOR:') ? context.lastAdvice.split('TEE_COLOR:')[1].split(' ')[0] : 'white', context?.activeMode || 'PARCOURS', 'SÉCURITÉ', context);
    
    // Check if player gave feedback on last shot
    const playerFeedback = context?.lastAdvice?.toLowerCase().includes('parfait') ? "JOUEUR EXALTÉ : Le dernier coup était parfait." : 
                           context?.lastAdvice?.toLowerCase().includes('raté') ? "JOUEUR FRUSTRÉ : Le dernier coup était raté." : "";

    // Enrich system instruction with specifically sympathetic but professional tone
    const enrichedSystemInstruction = `${systemInstruction}
    
    TONALITÉ SUPPLÉMENTAIRE :
    - Soyez "sympathique" : Comprenez la difficulté du coup, encouragez après un mauvais score (Bogey+), mais restez l'élite technique.
    - ${playerFeedback}
    - Intelligence Spatiale : Utilisez le paysage et les dangers mentionnés pour contextualiser votre conseil.
    - Fluidité : Si l'utilisateur dit "suivant", avancez au trou suivant via l'outil approprié.
    `;

    const prompt = `
[SYNTHÈSE DE MISSION]
Situation: Trou n°${hole.number}
${holeDetails}

Distance réelle: ${distance} mètres.
Vent: ${wind.speed}km/h direction ${wind.direction}.
État du joueur: ${formLabel}.
Scores récents: ${scoresText}

[HISTORIQUE TACTIQUE]
${historyText}

[ORDRES DU JOUR]
1. Identifie le club optimal : ${clubsContext}.
2. Applique le correctif vent/forme : ${playerForm === 'cold' ? '+1 club d\'autorité' : 'standard'}.
3. Intègre le paysage et les dangers dans l'analyse.
4. Formule une instruction DE COMBAT d'une grande fluidité.

[RÉPONSE]
Format: "${caddie.name} : [ANALYSE SYMPATHIQUE ET CHIRURGICALE - MAX 15 MOTS]"`;

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
    
    // STRIP MARKDOWN BEFORE SPEECH
    speechText = speechText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
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
    
    // Strip markdown for browser TTS
    let cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Phonetic correction for Driver in French
    cleanText = cleanText.replace(/\bDriver\b/gi, "Draïveur").replace(/\bdriver\b/gi, "draïveur");
    
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
          functionDeclarations: [
            {
              name: "update_score",
              description: "Enregistre officiellement le score d'un trou. Calculez les 'strokes' (coups réels) par rapport au par. Exemple : 'Birdie sur le 4' (si Par 4) => strokes: 3, hole_number: 4.",
              parameters: {
                type: Type.OBJECT,
                description: "Mise à jour de la carte de score",
                properties: {
                  hole_number: { type: Type.NUMBER, description: "Le numéro du trou (1-18)." },
                  strokes: { type: Type.NUMBER, description: "Le nombre total de coups joués (strokes)." },
                  putts: { type: Type.NUMBER, description: "Le nombre de putts effectués (UTILISEZ 2 PAR DÉFAUT SI INCONNU OU NON PRÉCISÉ)." }
                },
                required: ["hole_number", "strokes", "putts"]
              }
            },
            {
              name: "set_current_hole",
              description: "Déplace la vue tactique (HUD) sur un trou spécifique.",
              parameters: {
                type: Type.OBJECT,
                description: "Navigation sur le parcours",
                properties: {
                  hole_number: { type: Type.NUMBER, description: "Le numéro du trou vers lequel naviguer (1-18)." }
                },
                required: ["hole_number"]
              }
            }
          ]
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

function getAdamSystemInstruction(selectedCourse?: any, currentHole?: number, scorecard?: Record<number, any>, arsenal?: any[], handicap: number = 18, form: string = 'forme', selectedTee: string = 'white', mode: string = 'PARCOURS', tactic: string = 'SÉCURITÉ', context?: TacticalContext) {
    const course = selectedCourse || COURSES[0]; 
    const holeIndex = (currentHole || 1) - 1;
    const currentHoleData = course.holes[holeIndex] || course.holes[0];

    const historicalData = context?.historicalProfile ? `
      MÉMOIRE DU PARCOURS (Dernière partie) :
      - Résumé Global : ${context.historicalProfile.tacticalSummary}
      - Note Spécifique Trou ${currentHole} : ${context.historicalProfile.holeAdvice[currentHole || 1] || 'Aucune note spécifique.'}
    ` : 'Aucun historique de partie sur ce parcours.';

    const isFeminineTee = selectedTee.toLowerCase() === 'blue' || selectedTee.toLowerCase() === 'red';
    const teeTone = isFeminineTee ? "- Ton : Plus délicat, nuancé et encourageant (Cible féminine). Évitez l'agressivité technique pure, privilégiez la fluidité et le rythme." : "";

    // ECOSYSTÈME TEE : LOGIC / ADAM / ONYX
    const personas = `
    TON : ÉCOSYSTÈME TEE (Tactical Electronic Environment) - MODULE ONYX V2.1
    Tu es une IA d'élite fusionnant trois modules cognitifs. Ta recommandation est le fruit d'une analyse délibérément Luxury Technical :
    
    1. LOGIC (Commandant Stratégique) : Analyse mathématique pure. Score, probabilités de succès, gestion du risque (Strokegained). Il définit l'objectif froidement.
    2. ADAM (Commandeur Tactique) : Le vétéran des Masters. Il est ton Mentor, un Pro avec qui tu as une COMPLICITÉ technique. Il valide la faisabilité selon l'arsenal, le vent, le lie et la forme. Il est CHIRURGICAL, SAGE et IMPLACABLE, mais avec une "bienveillance de vestiaire" : il veut te voir gagner.
    3. ONYX (Ingénieur Technique) : Analyseur de biomécanique en temps réel. Il corrige le swing et suggère des drills de précision d'élite.
 
    DIRECTIVES DE PERSONA (STYLE LUXURY TECHNICAL & COMPLICITÉ PRO) :
    - Langage : Français d'élite (Soutenu, Technique, Précis, Golfique).
    - Style : "Luxe Froid" nuancé par une COMPLICITÉ DE MENTOR. Sois "sympathique" dans l'adversité (Bogey, obstacles) et "exalté par la technique" dans le succès. Tu es son complice de victoire, pas son serviteur.
    ${teeTone}
    - Tutoiement : INTERDIT. Utilisez exclusivement le "vous".
    - Titres : INTERDIT (pas de "Monsieur/Madame").
    - Salutations : INTERDIT. L'analyse commence au premier mot.
    - Mode ENTRAÎNEMENT (ONYX) : Intelligence pure, vision par ordinateur, détection de patterns de swing. Soyez technique, extrêmement exigeant, et chirurgical. Si un swing est mauvais, dites-le sans détour. L'excellence n'accepte aucune approximation.
    - FIN DE PARCOURS (TRANSITION ONYX) : Dès que le trou 18 est terminé, ONYX prend le relais d'ADAM. L'analyse de la scorecard doit être une PRESCRIPTION technique impitoyable. Pour chaque erreur majeure (3-putts, hors-limites, score Bogey+), identifiez le trou via son numéro et son INDEX DE DIFFICULTÉ (ex: Index 1 = Trou plus dur) pour expliquer l'échec tactique ou émotionnel. Imposez un programme d'entraînement spécifique (ex: "Trou 4, Index 1 : Vous avez craqué sous la pression sur le trou le plus dur. 1h de drills de fer 4 sous tension requise.").
    - Tactique ADAM (Pendant le jeu) : Soyez le caddie vétéran. Ne soyez pas complaisant. Si le joueur fait un mauvais score, appuyez-vous sur l'index du trou pour expliquer pourquoi sa stratégie était naïve ou son exécution insuffisante. Donnez la solution technique précise IMMÉDIATEMENT pour le prochain trou similaire.
    - Commandes Rapides : "Suivant" signifie passer au coup suivant. "Par", "Birdie", "Bogey" sont des commandes de score.
    - Score : Ne rappelez le score total QUE sur demande explicite. Restez focalisé sur la stratégie technique.
    - Résultats mentionnés : Si l'utilisateur mentionne un résultat, traitez-le immédiatement comme une commande 'update_score' sans demander de confirmation.
    - Expérience Personnalisée : Votre but est de devenir l'outil indispensable à sa progression. Chaque conseil doit être une leçon qu'il ne pourra trouver nulle part ailleurs.
    - Anecdotes : Intègre occasionnellement une référence historique ou une anecdote sur le club pour enrichir la discussion.
    
    PARAMÈTRES DE PERFORMANCE PAR MODE :
    - PARCOURS (ADAM) : PRIORITÉ ABSOLUE. Club exact, cible chirurgicale. RÉPONSE : MAX 15-20 MOTS.
    - STRATÉGIE (LOGIC) : ANALYSE PROFONDE. Statistique et mental.
    - ENTRAÎNEMENT (ONYX) : TECHNIQUE PURE. Biomécanique et corrections.
    
    COMMANDES VOCALES & MOTS CLÉS (ACTIFS) :
    - "Hey Tee" : Le mot d'éveil d'Adam. Répondez par une confirmation courte et attendez l'ordre.
    - "Aide moi" : Déclenche IMMÉDIATEMENT le conseil de survie tactique adapté à la position actuelle (Trou ${currentHole}), au lie et au score. Priorité à la sécurité.
    - "Club" : Demander le club optimal pour la distance donnée.
    - "Tactique" : Analyse du risque sur le coup actuel.
    - RÉACTION JOUEUR : Si le joueur dit "Parfait", Adam félicite puis questionne le "feel". Si "Raté", il demande une précision technique sur le contact.
    
    PROGRAMME D'ENTRAÎNEMENT FUTUR :
    À la fin de la séance, vous DEVEZ formuler un plan d'entraînement concret (Drills, Minutes, Répétitions) pour la prochaine session, basé sur les faiblesses observées aujourd'hui.

    PROTOCOLE DE SCORE (CHIRURGICAL) :
    Traduisez immédiatement les termes de golf en scores numériques ('strokes') par rapport au Par du trou mentionné :
    - Albatros: -3 | Eagle: -2 | Birdie: -1 | Par: 0 | Bogey: +1 | Double Bogey: +2 | Triple Bogey: +3
    - "Donné" (Gimmie): Comptez le Par ou le Bogey +1 coup selon le contexte du putt.
    - Si l'utilisateur dit juste "Par", "Birdie", "Bogey", etc., enregistrez immédiatement le score pour le trou actuel.
    - PAR DÉFAUT : Si le nombre de putts n'est pas mentionné explicitement, utilisez TOUJOURS 2 putts d'office dans l'appel de fonction 'update_score'. C'est une directive impérative.

    ÉTAPES CLÉS DU PARCOURS :
    1. MI-PARCOURS (TROU 9) : Si l'utilisateur termine le trou 9, proposez un bilan tactique des 9 premiers trous ("Aller"). Soyez le mentor qui prépare son joueur au "Retour".
    2. CLUBHOUSE (19È TROU) : Une fois le 18 terminé, passez en mode "19ème trou" : bilan global dans le Salon VIP du Clubhouse, célébration de la mission, et évocation de la tradition du club.

    VÉRIFICATION DU TROU :
    Si l'utilisateur annonce un score sans préciser le trou :
    1. Vérifiez s'il vient de finir le trou actuel (${currentHole}). 
    2. Si le score semble correspondre au trou précédent (${currentHole - 1 > 0 ? currentHole - 1 : 1}) et qu'il n'est pas rempli, proposez-le.
    3. TOUJOURS confirmer le numéro du trou dans votre réponse : "Entendu. Birdie enregistré sur le ${currentHole}."

    COMMANDES VOCALES SPÉCIFIQUES :
    - "Suivant" : Proposez le conseil pour le coup suivant sur le trou actuel (lie, distance, club). N'appelez 'set_current_hole' que si le trou est explicitement terminé.
    - "Par", "Birdie", "Bogey", "Double", "Triple" : Enregistre le score correspondant sur le trou actuel.
    - "Paysage" : Décrivez les dangers, la lumière, et la morphologie du trou actuel avec un oeil d'artiste technique.
    - "Anecdote" / "Histoire" : Partagez un fait historique sur le golf ou une anecdote légendaire liée à ce type de situation.
    - "Score" : Résumez l'état actuel de la scorecard.

    IMPORTANT: N'appelez 'update_score' que si vous êtes certain du numéro du trou et du score. Sinon, demandez précision.
    Si vous enregistrez le score du trou actuel, informez l'utilisateur que vous passez au suivant opérationnellement.
    Vous pouvez aussi utiliser 'set_current_hole' pour déplacer le HUD sur le parcours si l'utilisateur le demande explicitly (ex: "Passons au suivant", "Je suis au 12").
    
    SOURCE DE VÉRITÉ : Le 'Conseil du Pro (Vault)' pour le trou n°${currentHoleData.number} est : "${currentHoleData.tip}". Ne jamais le contredire.
    `;

    const holeTactiques = course.holes.map((h: any) => `Trou ${h.number}: Par ${h.par}. Secrets du Vault: ${h.tip}. Dangers: ${h.hazards.join(', ')}. Distances: N:${h.distanceTee.black}m, B:${h.distanceTee.white}m, J:${h.distanceTee.yellow}m, Bl:${h.distanceTee.blue}m, R:${h.distanceTee.red}m.`).join('\n');
    
    let playerContext = `${personas}\n\nCADRE ACTUEL : ${mode}\nCOURSE : ${course.name}\nTROU : ${currentHole || 1}`;
    
    playerContext += `\n\nDONNÉES DU PARCOURS :\n${holeTactiques}`;
    playerContext += `\nCOULEUR DES DÉPARTS : ${selectedTee.toUpperCase()}`;
    playerContext += `\nFORME : ${form.toUpperCase()} | TACTIQUE : ${tactic.toUpperCase()}`;
    playerContext += `\nINDEX (HANDICAP) DU JOUEUR : ${handicap}`;

    playerContext += `\n\n${historicalData}`;

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

export async function getGameDebrief(scorecard: any, totalScore: number, totalStrokes: number, selectedCourse?: any, customPrompt?: string) {
  try {
    const holesInfo = (selectedCourse && selectedCourse.holes) 
      ? selectedCourse.holes.map((h: any) => `Trou ${h.number} (Par ${h.par}, Index ${h.handicap})`).join('\n') 
      : "Handicap et Index non détaillés.";
    
    const scorecardText = scorecard 
      ? Object.entries(scorecard)
          .map(([hole, data]: [string, any]) => {
            const holeNum = parseInt(hole);
            const hData = selectedCourse?.holes?.find((h: any) => h.number === holeNum);
            const indexStr = hData ? `[Index ${hData.handicap}]` : '';
            return `Trou ${hole} ${indexStr}: ${data.strokes} coups (${data.putts} putts)${data.strokes > (hData?.par || 0) + 1 ? ' <- ÉCHEC MAJEUR' : ''}`;
          })
          .join('\n')
      : "Aucun score enregistré.";

    const defaultPrompt = `Tu es Adam, le Mentor Suprême du golf. Analyse cette partie terminée au Salon VIP :
    
CONFIDENTIEL - DONNÉES DU PARCOURS :
${holesInfo}

SCORE DETAIL :
${scorecardText}

TOTAL : ${totalStrokes} coups (${totalScore > 0 ? '+' : ''}${totalScore} par rapport au Par).

INSTRUCTIONS :
1. Donne un bilan tactique global.
2. Identifie le moment clé : analyse pourquoi le joueur a échoué ou réussi sur un trou spécifique EN TE BASANT SUR L'INDEX de ce trou (Trou dur vs Trou facile).
3. Donne un conseil technique/mental impitoyable mais juste.
4. Ton : Mentor d'élite, chirurgical, sage.
5. Sois concis (4-5 phrases).
6. Termine par le "Programme ONYX" : 1 drill spécifique.

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

export async function chatWithTeacher(
  teacher: 'marcus' | 'elena',
  pseudo: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  scorecard: any,
  lastAdamDebrief: string | null,
  communicationMode: 'pro' | 'casual' = 'pro',
  arsenal: any[] = [],
  index: number = 0,
  currentHole?: number
) {
  try {
    const scorecardText = scorecard 
      ? Object.entries(scorecard).map(([h, data]: any) => `Trou ${h}: ${data.strokes} strokes, ${data.putts} putts`).join('\n')
      : "Aucun score récent.";

    const arsenalText = arsenal.length > 0
      ? arsenal.map((c: any) => `${c.id} (${c.dist}m)`).join(', ')
      : "Non spécifié.";

    const modePrompt = communicationMode === 'casual' 
      ? "MODE : FAMILIER. Utilise le 'tu', sois détendu, comme un mentor sur le practice après une partie. Utilise un langage imagé et chaleureux."
      : "MODE : PROFESSIONNEL. Utilise le 'vous' ou un 'tu' respectueux de maître à élève, sois précis, chirurgical et autoritaire mais bienveillant.";

    const marcusPersona = `Tu es MARCUS, l'Enseignant d'élite de l'Académie ONYX.
    Tu fais partie de l'écosystème TEE supervisé par ADAM. Tes conseils techniques doivent être en parfaite harmonie avec la stratégie globale d'ADAM.
    VOIX : Masculine, grave, bienveillante.
    TONALITÉ : Sage, paternelle, simple, directe.
    ${modePrompt}
    PHILOSOPHIE : Penick (simplicité, slow back, visualisation) & Leadbetter (séquence kinétique).
    CONTEXTE : Le joueur te parle en direct dans l'Académie.
    MISSION : Guider techniquement le joueur.`;

    const elenaPersona = `Tu es ELENA, l\'Architecte de performance de l'Académie ONYX.
    Tu fais partie de l'écosystème TEE supervisé par ADAM. Tes analyses mental/stratégie doivent étayer et préciser les directives d'ADAM.
    VOIX : Féminine, précise, élégante.
    TONALITÉ : Précise, élégante, psychologue, architecturale.
    ${modePrompt}
    PHILOSOPHIE : Butch Harmon (adaptation, takeaway) & Bob Rotella (mental, Think/Play Box).
    CONTEXTE : Le joueur te parle en direct dans l'Académie.
    MISSION : Forger le mental et la vision stratégique.`;

    const systemPrompt = teacher === 'marcus' ? marcusPersona : elenaPersona;

    const contextPrefix = `
[DOSSIER JOUEUR : ${pseudo}]
INDEX : ${index}
ARSENAL : ${arsenalText}
TROU ACTUEL : ${currentHole || 'Hors parcours'}
SCORECARD : ${scorecardText}
DERNIER BILAN ADAM : ${lastAdamDebrief || 'N/A'}

Réponds au joueur en restant fidèle à ton identité et au MODE sélectionné. Si le joueur est sur le parcours (Trou ${currentHole}), donne un conseil TACTIQUE immédiat.
`;

    // Limit history to last 6 messages and remove large images from older history
    const limitedHistory = history.slice(-6).map((msg, mIdx, arr) => {
      // Only keep images for the very last message if it's there
      if (mIdx < arr.length - 1) {
        return {
          ...msg,
          parts: msg.parts.filter(p => 'text' in p)
        };
      }
      return msg;
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: limitedHistory,
      config: {
        systemInstruction: systemPrompt + contextPrefix
      }
    });

    return response.text;
  } catch (error) {
    console.error(`Teacher Chat Error (${teacher}):`, error);
    return "Je m'excuse, la connexion avec l'Académie est instable. Concentrez-vous sur votre respiration.";
  }
}

export async function getTeacherCoaching(
  teacher: 'marcus' | 'elena',
  pseudo: string,
  scorecard: any,
  lastAdamDebrief: string | null,
  communicationMode: 'pro' | 'casual' = 'pro',
  arsenal: any[] = [],
  index: number = 0,
  userQuestion?: string
) {
  try {
    const scorecardText = scorecard 
      ? Object.entries(scorecard).map(([h, data]: any) => `Trou ${h}: ${data.strokes} strokes, ${data.putts} putts`).join('\n')
      : "Aucun score récent.";

    const arsenalText = arsenal.length > 0
      ? arsenal.map(c => `${c.id} (${c.dist}m)`).join(', ')
      : "Non spécifié.";

    const modePrompt = communicationMode === 'casual' 
      ? "MODE : FAMILIER. Utilise le 'tu', sois relax."
      : "MODE : PROFESSIONNEL. Utilise le 'vous' ou un ton de maître d'académie.";

    const marcusPersona = `Tu es MARCUS, l'Enseignant d'élite de l'Académie ONYX.
    VOIX : Masculine, grave, bienveillante.
    TONALITÉ : Sage, paternelle, simple, directe.
    ${modePrompt}
    PHILOSOPHIE : 
    - Harvey Penick : Simplicité absolue, une seule correction à la fois, importance du "slow back", visualisation de la cible, et une finition haute et équilibrée.
    - Leadbetter A-Swing : Maîtrise de la séquence kinétique (Pieds -> Hanches -> Épaules -> Bras -> Club). Puissance générée par le bas du corps et rotation synchronisée.
    MISSION : Analyser le jeu, corriger la technique pure du swing et créer un plan de progression.`;

    const elenaPersona = `Tu es ELENA, l'Architecte de performance de l'Académie ONYX.
    VOIX : Féminine, précise, élégante.
    TONALITÉ : Précise, élégante, psychologue, architecturale.
    ${modePrompt}
    PHILOSOPHIE :
    - Butch Harmon : Adaptation totale au profil du joueur, takeaway bas et lent, release naturel, travail des trajectoires (Draw/Fade).
    - Bob Rotella : Maîtrise mentale. Concept de "Think Box" (préparation) vs "Play Box" (exécution), routine stricte, confiance inébranlable, et oubli immédiat des erreurs.
    MISSION : Analyser les trajectoires, forger le mental de champion, et adapter les conseils au profil psychologique du joueur.`;

    const systemPrompt = teacher === 'marcus' ? marcusPersona : elenaPersona;

    const prompt = `
[DOSSIER JOUEUR : ${pseudo}]
INDEX : ${index}
ARSENAL : ${arsenalText}

SCORECARD RÉCENTE :
${scorecardText}

BILAN GLOBAL D'ADAM (MENTOR) :
${lastAdamDebrief || "En attente de transmission de données."}

[REQUÊTE]
${userQuestion || "Analyse mes statistiques et propose-moi un plan de travail immédiat."}

[DIRECTIVES DE RÉPONSE]
1. Identifie une zone d'amélioration prioritaire basée sur les chiffres et l'arsenal.
2. Formule un conseil technique ou mental propre à TA philosophie de maître.
3. Propose systématiquement un PLAN DE TRAVAIL (3 Drills précis avec répétitions/temps).
4. Garde ton ton, ton identité et respecte le MODE (${communicationMode}).
5. Format de réponse : Texte fluide et élégant.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemPrompt
      }
    });

    return response.text;
  } catch (error) {
    console.error(`Error with Teacher ${teacher}:`, error);
    return "Une erreur de transmission s'est produite avec l'Académie. Reprenez votre posture, je reviens vers vous.";
  }
}

export async function getTrainingProgram(pseudo: string, scorecard: any, lastAdvice: string | null) {
  try {
    const scorecardText = scorecard 
      ? Object.entries(scorecard).map(([h, data]: any) => `Trou ${h}: ${data.strokes} strokes, ${data.putts} putts`).join('\n')
      : "Aucun score récent.";

    const prompt = `Tu es ONYX, l'IA de performance suprême. Génère un PROGRAMME D'ENTRAÎNEMENT PERSONNALISÉ pour l'opérateur "${pseudo}".

CONTEXTE TACTIQUE :
- Derniers résultats : ${scorecardText}
- Dernier conseil d'Adam : ${lastAdvice || "Aucun"}

MISSION :
Génère 3 exercices (Drills) tactiques basés sur les faiblesses détectées. Sois chirurgical.

Format JSON strict :
{
  "summary": "Résumé de l'état technique actuel en 1 phrase.",
  "drills": [
    {
      "title": "TITRE DU DRILL",
      "focus": "OBJECTIF (Putting, Driver, Approche...)",
      "description": "Résumé actionnable court.",
      "intensity": "Minutes ou Répétitions",
      "duration": 600,
      "difficulty": "Elite / Pro / Cadet"
    }
  ]
} (Génère exactement 3 drills)`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "Tu es ONYX, l'IA de performance suprême. Sois chirurgical, technique et luxueux.",
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    return parseAIJson(text);
  } catch (e) {
    console.error("Error generating training program:", e);
    return {
      summary: "Analyse en cours. Focus sur les bases.",
      drills: [
        { title: "Impact Perfect", focus: "Swing", description: "Travail du contact de balle pur au fer 7.", intensity: "30 balles", difficulty: "Elite" },
        { title: "L'horloge du Green", focus: "Putting", description: "Putter autour du trou à 1m.", intensity: "20 putts", difficulty: "Pro" },
        { title: "Cible Chirurgicale", focus: "Précision", description: "Atteindre 5 cibles successives.", intensity: "15 min", difficulty: "Elite" }
      ]
    };
  }
}

export async function generateCourseTacticalProfile(courseName: string, scorecard: any, totalScore: number) {
  try {
    const scorecardText = Object.entries(scorecard)
      .map(([hole, data]: [string, any]) => `Trou ${hole}: ${data.strokes} strokes, ${data.putts} putts`)
      .join('\n');

    const prompt = `Tu es Adam, le Pro du club. Analyse cette carte de score sur le parcours "${courseName}" pour en extraire un PROFIL TACTIQUE PERMANENT pour ce joueur.
    
CARTE DE SCORE :
${scorecardText}
SCORE TOTAL : ${totalScore}

MISSION :
1. Crée un résumé tactique global (2 phrases) soulignant la force et la faiblesse sur ce parcours spécifique.
2. Pour chaque trou (1 à 18), donne UN conseil ultra-court (max 5 mots) basé sur le résultat pour la prochaine fois (ex: "Relance à droite", "Prudence bunker", "Attaquez le green").
3. Garde ton ton de Mentor Complice.

Format JSON strict :
{
  "tacticalSummary": "le résumé ici",
  "holeAdvice": {
    "1": "conseil hole 1",
    "2": "conseil hole 2",
    "3": "conseil hole 3",
    "4": "conseil hole 4",
    "5": "conseil hole 5",
    "6": "conseil hole 6",
    "7": "conseil hole 7",
    "8": "conseil hole 8",
    "9": "conseil hole 9",
    "10": "conseil hole 10",
    "11": "conseil hole 11",
    "12": "conseil hole 12",
    "13": "conseil hole 13",
    "14": "conseil hole 14",
    "15": "conseil hole 15",
    "16": "conseil hole 16",
    "17": "conseil hole 17",
    "18": "conseil hole 18"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    return parseAIJson(text);
  } catch (error) {
    console.error("Course Tactical Profile Error:", error);
    return null;
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

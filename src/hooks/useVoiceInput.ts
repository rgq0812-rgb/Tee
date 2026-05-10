import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceInput = (onResult: (text: string, isFinal: boolean) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Cette variable permet de savoir si on doit relancer le micro automatiquement
  const isAutoRestarting = useRef(false);
  const durationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stopListening = useCallback(() => {
    isAutoRestarting.current = false;
    if (durationTimeoutRef.current) {
      clearTimeout(durationTimeoutRef.current);
      durationTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        // Supprimer le onend pour éviter les boucles de redémarrage lors de l'arrêt volontaire
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback((continuousMode = false, timeoutMs?: number) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    // Reset potential previous instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      // Toujours utiliser le mode continu pour éviter que le mobile ne coupe le flux trop vite
      recognition.continuous = true; 
      recognition.interimResults = true; 
      recognition.maxAlternatives = 3; 

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        let interimTranscript = '';
        
        for (let i = 0; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            fullTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        const currentText = (fullTranscript + interimTranscript).trim();
        const isSomeFinal = event.results[event.results.length - 1].isFinal;
        
        if (currentText && onResultRef.current) {
          // Pass the combined text and whether the very last part is final
          onResultRef.current(currentText, isSomeFinal);
        }
      };

      recognition.onerror = (event: any) => {
        const errorType = event.error;
        console.error("[ONYX] Speech Recognition Error:", errorType);
        
        if (errorType === 'not-allowed') {
          setError("Accès Micro Refusé - Vérifiez les réglages");
          setIsListening(false);
          isAutoRestarting.current = false;
        } else if (errorType === 'network') {
          setError("Erreur Réseau - Connexion instable");
          setIsListening(false);
          isAutoRestarting.current = false;
        } else if (errorType === 'no-speech') {
          // Keep it quiet for no-speech, just log it
          console.log("[ONYX] Aucun son détecté, maintien de la session...");
        } else {
          setError(`Erreur: ${errorType}`);
          setIsListening(false);
          isAutoRestarting.current = false;
        }
      };

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        if (window.navigator?.vibrate) window.navigator.vibrate(20);
      };

      recognition.onend = () => {
        // Redémarrage automatique si mobile timeout ou no-speech
        if (isAutoRestarting.current || (isListening && !error)) {
          setTimeout(() => {
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                // Already started or failed
              }
            }
          }, 200);
        } else {
          setIsListening(false);
        }
      };

      isAutoRestarting.current = continuousMode;
      recognitionRef.current = recognition;
      
      // On mobile, start() MUST be called directly in the touch start handler
      // which Dashboard does (onClick calling startListening)
      recognition.start();

      if (timeoutMs) {
        if (durationTimeoutRef.current) clearTimeout(durationTimeoutRef.current);
        durationTimeoutRef.current = setTimeout(() => {
          stopListening();
        }, timeoutMs);
      }
    } catch (err) {
      console.error("Speech Recognition Start Failed:", err);
      setError("Échec démarrage micro");
      setIsListening(false);
    }
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { isListening, startListening, stopListening, error };
};

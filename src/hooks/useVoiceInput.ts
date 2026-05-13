import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceInput = (onResult: (text: string, isFinal: boolean) => void) => {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  const updateIsListening = (val: boolean) => {
    setIsListening(val);
    isListeningRef.current = val;
  };

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
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      recognitionRef.current = null;
    }
    updateIsListening(false);
  }, []);

  const startListening = useCallback((continuousMode = false, timeoutMs?: number) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    // Proactive cleanup to avoid "already started" errors
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
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
        const lastResult = event.results[event.results.length - 1];
        const isSomeFinal = lastResult.isFinal;
        
        if (currentText && onResultRef.current) {
          onResultRef.current(currentText, isSomeFinal);
        }
      };

      recognition.onerror = (event: any) => {
        const errorType = String(event.error || '').toLowerCase();
        
        if (errorType === 'aborted') {
          console.warn("[ONYX] Speech recognition aborted.");
          return;
        }

        console.error("[ONYX] Speech Recognition Error:", errorType);
        
        if (errorType === 'not-allowed') {
          setError("Accès Micro Refusé - Cliquez ici ou autorisez dans la barre d'adresse");
          updateIsListening(false);
          isAutoRestarting.current = false;
        } else if (errorType === 'network') {
          setError("Erreur Réseau - Connexion instable");
          updateIsListening(false);
          isAutoRestarting.current = false;
        } else if (errorType === 'no-speech') {
          console.log("[ONYX] Aucun son détecté.");
        } else {
          setError(`Erreur: ${errorType}`);
          updateIsListening(false);
          isAutoRestarting.current = false;
        }
      };

      recognition.onstart = () => {
        updateIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        // Essential: if we are supposed to be listening but the browser stopped us (e.g. Android timeout)
        // we RECREATE the instance in the next startListening call
        if (isAutoRestarting.current || (isListeningRef.current && !error)) {
          console.log("[ONYX] Automatic restart triggered by onend");
          setTimeout(() => {
            // Re-call startListening to get a FRESH instance
            if (isListeningRef.current) startListening(isAutoRestarting.current, timeoutMs);
          }, 300);
        } else {
          updateIsListening(false);
        }
      };

      isAutoRestarting.current = continuousMode;
      recognitionRef.current = recognition;
      
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
      updateIsListening(false);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return { isListening, startListening, stopListening, error };
};

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
    if (recognitionRef.current) {
      isAutoRestarting.current = false;
      if (durationTimeoutRef.current) {
        clearTimeout(durationTimeoutRef.current);
        durationTimeoutRef.current = null;
      }
      try {
          recognitionRef.current.stop();
      } catch (e) {
          // Already stopped
      }
      setIsListening(false);
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false; 
    recognition.interimResults = true; // Permet de détecter le mot-clé plus vite

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      const isFinal = event.results[last].isFinal;
      
      if (transcript && onResultRef.current) {
        // Transmission au parent si c'est final ou si on veut gérer l'intermédiaire
        onResultRef.current(transcript, isFinal);
      }
    };

    recognition.onerror = (event: any) => {
      const errorType = event.error;
      
      // We don't want to flood the console with expected "errors"
      if (errorType !== 'no-speech' && errorType !== 'aborted') {
        console.error("Erreur vocale:", errorType);
      }
      
      let msg = "";
      if (errorType === 'not-allowed') {
        msg = "Micro bloqué : Autorisez l'accès dans votre navigateur.";
      } else if (errorType === 'no-speech') {
        // Souvent normal en mode continu
      } else if (errorType === 'aborted') {
        // Souvent normal lors d'une interruption manuelle
      } else {
        msg = `Erreur micro: ${errorType}`;
      }
      
      if (msg) setError(msg);

      // 'no-speech' et 'aborted' ne sont pas vraiment des erreurs fatales en mode auto
      if (errorType !== 'no-speech' && errorType !== 'aborted') {
        if (!isAutoRestarting.current) {
          setIsListening(false);
        }
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      // C'est ici que la magie opère : si on est en mode "Chat", on relance direct
      if (isAutoRestarting.current) {
        setTimeout(() => {
          if (isAutoRestarting.current) {
            try {
              recognition.start();
            } catch (e) {
              // Déjà démarré
            }
          } else {
            setIsListening(false);
          }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        isAutoRestarting.current = false;
        recognitionRef.current.stop();
      }
    };
  }, []); // Re-run only on mount

  const startListening = useCallback((continuousMode = false, timeoutMs?: number) => {
    if (recognitionRef.current) {
      isAutoRestarting.current = continuousMode;
      recognitionRef.current.continuous = continuousMode;
      setError(null);
      
      if (timeoutMs) {
        if (durationTimeoutRef.current) clearTimeout(durationTimeoutRef.current);
        durationTimeoutRef.current = setTimeout(() => {
          stopListening();
        }, timeoutMs);
      }

      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Déjà en cours, on s'assure juste que l'état est synchro
        setIsListening(true);
      }
    }
  }, [stopListening]);

  return { isListening, startListening, stopListening, error };
};

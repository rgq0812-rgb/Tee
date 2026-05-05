import { useState, useEffect, useCallback, useRef } from 'react';

export const useVoiceInput = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Cette variable permet de savoir si on doit relancer le micro automatiquement
  const isAutoRestarting = useRef(false);

  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false; // On gère le "continu" nous-mêmes pour plus de contrôle
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      // Pour le mode continu, on prend le dernier résultat
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      
      if (transcript && onResultRef.current && event.results[last].isFinal) {
        onResultRef.current(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Erreur vocale:", event.error);
      // 'no-speech' et 'aborted' ne sont pas vraiment des erreurs fatales en mode auto
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
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

  const startListening = useCallback((continuousMode = false) => {
    if (recognitionRef.current) {
      isAutoRestarting.current = continuousMode;
      recognitionRef.current.continuous = continuousMode;
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Déjà en cours, on s'assure juste que l'état est synchro
        setIsListening(true);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      isAutoRestarting.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { isListening, startListening, stopListening, error };
};

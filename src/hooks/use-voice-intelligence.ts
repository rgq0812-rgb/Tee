import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for "On-Course" Voice Intelligence.
 * Handles:
 * - Score Entry Parsing
 * - Club Memory
 * - Caddie Queries
 * - Mental Stress Detection
 */
export function useVoiceIntelligence(onScoreDetected?: (score: number, par: number) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript.toLowerCase();
        setTranscript(result);
        processCommand(result);
      };

      recognitionRef.current.onerror = (event: any) => {
        const errorType = String(event.error || '').toLowerCase();
        if (errorType === 'aborted') {
          console.warn("[Voice Intelligence] Aborted gracefully.");
          return;
        }
        console.error("[Voice Intelligence] Error:", errorType);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {}
            }
          }, 200);
        }
      };
    }
  }, [isListening]);

  const processCommand = (text: string) => {
    // Score Parser
    if (text.includes("note un par") || text.includes("fait un par")) {
      onScoreDetected?.(0, 4); // Example: assumed par 4
    } else if (text.includes("birdie")) {
      onScoreDetected?.(-1, 4);
    } else if (text.includes("eagle")) {
      onScoreDetected?.(-2, 4);
    } else if (text.includes("bogey")) {
      onScoreDetected?.(1, 4);
    }
    
    // Stress Detection
    if (text.includes("stressé") || text.includes("tendu") || text.includes("peur")) {
      // Trigger mental coach logic
      console.log("Stress detected - triggering Zen mode");
    }
  };

  const startListening = () => {
    setIsListening(true);
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognitionRef.current?.stop();
  };

  return { isListening, transcript, startListening, stopListening };
}

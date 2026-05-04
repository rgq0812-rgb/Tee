import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, Loader2, Sparkles, Brain, Shield, Target, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeLie, analyzeGreen, generateSpeech } from '../services/geminiService';
import { playRawPcm } from '../lib/audioUtils';

interface LieScannerProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
}

type ScanMode = 'LIE' | 'GREEN';

export default function LieScanner({ isOpen, onClose, isMuted }: LieScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('LIE');

  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  }, []);

  const startRecording = () => {
    if (!stream) return;
    
    setIsRecording(true);
    setRecordingProgress(0);
    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setCapturedImage(URL.createObjectURL(blob)); // Use for preview
        handleAnalyze(base64, 'video/mp4');
      };
      reader.readAsDataURL(blob);
    };
    
    mediaRecorder.start();
    
    const duration = 5000;
    const interval = 50;
    let elapsed = 0;
    
    const timer = setInterval(() => {
      elapsed += interval;
      setRecordingProgress((elapsed / duration) * 100);
      
      if (elapsed >= duration) {
        clearInterval(timer);
        mediaRecorder.stop();
        setIsRecording(false);
      }
    }, interval);
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
        handleAnalyze(dataUrl.split(',')[1]);
      }
    }
  };

  const handleAnalyze = async (base64: string, mimeType: string = 'image/jpeg') => {
    stopCamera();
    setAnalyzing(true);
    setResult(null);
    setError(null);
    try {
      let data;
      let textToSpeak = "";

      if (scanMode === 'LIE') {
        data = await analyzeLie(base64, mimeType);
        textToSpeak = `Lie identifiée : ${data.lie_type}. ${data.impact}. Mon conseil : ${data.advice}.`;
      } else {
        data = await analyzeGreen(base64, mimeType);
        textToSpeak = `Analyse du green : ${data.slope_direction}. Fermeté : ${data.slope_severity}. Mon conseil : ${data.line_advice}.`;
      }
      
      setResult(data);
      
      if (!isMuted) {
        const audioData = await generateSpeech(textToSpeak);
        if (audioData) {
          await playRawPcm(audioData);
        }
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Erreur lors de l'analyse. Réessayez.");
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setIsRecording(false);
    setRecordingProgress(0);
    startCamera();
  };

  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black flex flex-col font-sans"
    >
      {/* HUD Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute inset-0 border-[1px] border-white/5 grid grid-cols-6 grid-rows-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-[#c9964a]/10 border border-[#c9964a]/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="text-[#c9964a]" size={24} />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">
                {scanMode === 'LIE' ? 'Lie Intelligence' : 'Green Intelligence'}
              </h2>
              <div className="bg-red-600 px-1 py-0.5 rounded-sm">
                <span className="text-[7px] font-black text-white uppercase italic">v2.0</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Neural Engine Active // {scanMode === 'LIE' ? 'Optic-1' : 'Optic-2'}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
        >
          <X size={24} />
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="absolute top-24 left-0 right-0 z-50 flex justify-center px-6">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex gap-1 w-full max-w-xs shadow-2xl">
          <button 
            onClick={() => setScanMode('LIE')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${scanMode === 'LIE' ? 'bg-[#c9964a] text-black font-black' : 'text-white/40 hover:text-white'}`}
          >
            <Waves size={14} />
            <span className="text-[10px] uppercase">Scanner Lie</span>
          </button>
          <button 
            onClick={() => setScanMode('GREEN')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${scanMode === 'GREEN' ? 'bg-[#c9964a] text-black font-black' : 'text-white/40 hover:text-white'}`}
          >
            <Target size={14} />
            <span className="text-[10px] uppercase">Lire Green</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {!capturedImage ? (
          <div className="w-full h-full relative">
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover grayscale-[0.2] contrast-125"
            />
            
            {/* HUD Overlay */}
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              {/* Corner Brackets */}
              <div className="absolute top-10 left-10 w-12 h-12 border-t-2 border-l-2 border-[#c9964a]/40" />
              <div className="absolute top-10 right-10 w-12 h-12 border-t-2 border-r-2 border-[#c9964a]/40" />
              <div className="absolute bottom-32 left-10 w-12 h-12 border-b-2 border-l-2 border-[#c9964a]/40" />
              <div className="absolute bottom-32 right-10 w-12 h-12 border-b-2 border-r-2 border-[#c9964a]/40" />

              {/* Scanning Target */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-t-2 border-b-2 border-[#c9964a]/20 rounded-full"
                />
                <div className="w-48 h-48 border border-[#c9964a]/10 rounded-full flex items-center justify-center">
                  <div className="w-1 h-32 bg-gradient-to-b from-transparent via-[#c9964a]/20 to-transparent animate-pulse" />
                  <div className="h-1 w-32 bg-gradient-to-r from-transparent via-[#c9964a]/20 to-transparent absolute animate-pulse" />
                </div>
              </div>

              {/* Side Data Panels */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-8">
                 {[...Array(4)].map((_, i) => (
                   <div key={`data-${i}`} className="flex flex-col">
                     <div className="w-4 h-[1px] bg-[#c9964a]/40 mb-1" />
                     <span className="text-[6px] font-mono text-[#c9964a]/40">0x00{i}F</span>
                   </div>
                 ))}
              </div>

              {/* Scrolling Text Elements */}
              <div className="absolute bottom-36 left-0 right-0 px-10 flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-[7px] font-mono text-[#c9964a] uppercase">Scanning Matrix...</div>
                  <div className="text-[10px] font-black text-white uppercase italic tracking-tighter">
                    {scanMode === 'LIE' ? 'Position de la balle' : 'Relief du Green'}
                  </div>
                </div>
                <div className="text-[7px] font-mono text-emerald-500/60 uppercase text-right">
                  Latitude: 45.4215<br />
                  Longitude: -75.6972
                </div>
              </div>
            </div>
            
            {/* Capture Button Container */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-center px-10 gap-4 pb-12">
              {isRecording && (
                <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${recordingProgress}%` }}
                    className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                  />
                </div>
              )}
              
              <div className="w-full relative flex items-center justify-center">
                <button 
                  onClick={isRecording ? undefined : startRecording}
                  onContextMenu={(e) => { e.preventDefault(); capture(); }}
                  className={`relative group active:scale-95 transition-all outline-none ${isRecording ? 'opacity-50' : ''}`}
                >
                  <div className="w-20 h-20 rounded-full bg-white/5 border border-white/20 flex items-center justify-center backdrop-blur-xl">
                    <div className={`w-14 h-14 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-600 scale-75 rounded-lg' : 'bg-white border-[4px] border-black scale-100 rounded-full'}`} />
                  </div>
                  {/* Decorative Rings */}
                  <motion.div 
                    animate={isRecording ? { scale: [1, 1.2, 1], opacity: [0.1, 0.5, 0.1] } : { scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: isRecording ? 1 : 2, repeat: Infinity }}
                    className={`absolute -inset-2 rounded-full border ${isRecording ? 'border-red-600' : 'border-white'}`}
                  />
                </button>
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">
                {isRecording ? "Enregistrement du clip (5s)..." : "Appuie pour un clip 5s // Clic droit (PC) pour photo"}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            <img src={capturedImage} className="w-full h-full object-cover filter brightness-[0.4] saturate-[0.2]" alt="Captured" />
            
            {/* Analysis UI Container */}
            <div className="absolute inset-0 flex flex-col justify-center p-8 bg-black/20 backdrop-blur-[2px]">
              <AnimatePresence mode="wait">
                {analyzing ? (
                  <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8 max-w-sm mx-auto w-full"
                  >
                    <div className="relative">
                      <div className="w-32 h-32 mx-auto relative flex items-center justify-center">
                         <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-t-2 border-r-2 border-[#c9964a] rounded-full"
                        />
                        <motion.div 
                          animate={{ rotate: -360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-2 border-b-2 border-l-2 border-white/20 rounded-full"
                        />
                        <Brain className="text-[#c9964a] animate-pulse" size={40} />
                      </div>
                    </div>
                    
                    <div className="space-y-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c9964a]/10 border border-[#c9964a]/20 rounded-full">
                           <Loader2 size={12} className="text-[#c9964a] animate-spin" />
                           <span className="text-[10px] font-black text-[#c9964a] uppercase tracking-widest">Processing</span>
                        </div>
                        <h3 className="text-3xl font-black italic text-white uppercase italic tracking-tighter leading-none">DÉCHIFFREMENT</h3>
                        <div className="h-0.5 w-12 bg-[#c9964a] mx-auto" />
                        <p className="text-[10px] text-white/40 uppercase font-mono tracking-[0.2em] max-w-[200px] mx-auto">
                          {scanMode === 'LIE' ? "Analyse de la densité de l'herbe et de l'humidité du sol..." : "Calcul des gradients de pente et direction du grain..."}
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                       {[1, 2, 3].map(i => (
                         <div key={`stat-${i}`} className="h-1 bg-white/5 relative overflow-hidden rounded-full">
                           <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 1 + i*0.5, repeat: Infinity }}
                            className="absolute inset-0 bg-[#c9964a]"
                           />
                         </div>
                       ))}
                    </div>
                  </motion.div>
                ) : result ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-sm mx-auto space-y-6"
                  >
                    {scanMode === 'LIE' ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="w-1 h-12 bg-[#c9964a]" />
                              <div>
                                <span className="text-[10px] font-black text-[#c9964a] uppercase tracking-[0.3em] block">LIE REPORT</span>
                                <h4 className="text-4xl font-black italic text-white uppercase tracking-tighter">{result.lie_type}</h4>
                              </div>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <Shield size={64} className="text-white" />
                            </div>
                            <span className="text-[8px] font-black text-[#c9964a] uppercase tracking-[0.2em] block mb-2">Comportement de l'Impact</span>
                            <p className="text-lg font-bold text-white/90 leading-tight italic">"{result.impact}"</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#c9964a] p-6 rounded-[2rem] shadow-xl shadow-[#c9964a]/20">
                              <span className="text-[8px] font-black text-black/60 uppercase tracking-[0.2em] block mb-2">Conseil Pro</span>
                              <p className="text-sm font-black italic text-black leading-snug">{result.advice}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col justify-center backdrop-blur-xl">
                              <span className="text-[8px] font-black text-[#c9964a] uppercase tracking-[0.2em] block mb-2">Correction</span>
                              <span className="text-xs font-black text-white uppercase tracking-tighter">{result.club_adjustment}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                         <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="w-1 h-12 bg-[#c9964a]" />
                              <div>
                                <span className="text-[10px] font-black text-[#c9964a] uppercase tracking-[0.3em] block">GREEN DATA</span>
                                <h4 className="text-3xl font-black italic text-white uppercase tracking-tighter">{result.slope_direction}</h4>
                              </div>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
                            <div className="flex justify-between items-start mb-4">
                               <div>
                                  <span className="text-[8px] font-black text-[#c9964a] uppercase tracking-[0.2em] block mb-1">Point de Rupture</span>
                                  <p className="text-lg font-bold text-white italic leading-none">{result.break_point}</p>
                               </div>
                               <div className="text-right">
                                  <span className="text-[8px] font-black text-[#c9964a] uppercase tracking-[0.2em] block mb-1">Gravité</span>
                                  <p className="text-lg font-bold text-white italic leading-none">{result.slope_severity}</p>
                               </div>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                               <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] block mb-2">Texture / Grain</span>
                               <p className="text-sm text-white/80">{result.grain}</p>
                            </div>
                          </div>

                          <div className="bg-[#c9964a] p-6 rounded-[2rem] shadow-xl shadow-[#c9964a]/20">
                            <span className="text-[8px] font-black text-black/60 uppercase tracking-[0.2em] block mb-2">Ligne de Put</span>
                            <p className="text-base font-black italic text-black leading-snug">"{result.line_advice}"</p>
                            <div className="mt-3 pt-3 border-t border-black/10 flex justify-between items-center">
                               <span className="text-[10px] font-black text-black/40 uppercase">Vitesse suggérée</span>
                               <span className="text-[10px] font-black text-black uppercase">{result.speed_feel}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col gap-3 mt-4">
                       <button 
                        onClick={onClose}
                        className="w-full py-5 bg-white text-black font-black uppercase text-xs rounded-2xl hover:bg-[#c9964a] transition-all flex items-center justify-center gap-2 group shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                       >
                         Calculer l'Alignement <CheckCircle2 size={16} />
                       </button>
                       <button 
                        onClick={reset}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/60 font-black uppercase text-[10px] rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-2"
                       >
                         <RefreshCw size={14} /> Scanner à nouveau
                       </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-12 text-center text-red-500 space-y-6">
            <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <div>
              <p className="text-xl font-black uppercase italic italic">Erreur de Système</p>
              <p className="text-xs text-red-500/60 font-mono mt-2">{error}</p>
            </div>
            <button 
              onClick={startCamera} 
              className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-xs"
            >
              Hardware Reset
            </button>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}

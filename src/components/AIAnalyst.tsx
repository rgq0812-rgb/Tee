import { useState, useEffect, useRef } from 'react';
import { analyzeSwing, generateSpeech, chatWithAdam, speakWithBrowser } from '../services/geminiService';
import { playRawPcm } from '../lib/audioUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Video, Sparkles, AlertCircle, ChevronRight, CheckCircle2, Volume2, Loader2, Mic, Send, X, Brain } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useAmbientSound } from '../hooks/use-ambient-sound';
import AudioVisualizer from './AudioVisualizer';

export default function AIAnalyst() {
  const { playPing } = useAmbientSound();
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isListening, startListening, stopListening } = useVoiceInput((text) => {
    if (playPing) playPing(800, 'sine', 0.05);
    handleSendChat(text);
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory, isChatLoading]);

  const handleSendChat = async (textOverride?: string) => {
    const text = textOverride || chatInput;
    if (!text.trim() || isChatLoading) return;

    if (playPing) playPing(600, 'sine', 0.03);
    const userMsg = { id: `user-${Date.now()}-${Math.random()}`, role: 'user', parts: [{ text }] };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const historyForApi = newHistory.map(m => ({ role: m.role, parts: m.parts }));
      const response = await chatWithAdam(historyForApi);
      const adamMsg = { id: `adam-${Date.now()}-${Math.random()}`, role: 'model', parts: [{ text: response }] };
      setChatHistory(prev => [...prev, adamMsg]);
      
      // Auto-speak the response
      if (response) {
        const result = await generateSpeech(response);
        if (typeof result === 'object' && result.fallback) {
          speakWithBrowser(result.text);
        } else if (typeof result === 'string') {
          await playRawPcm(result);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const initChat = () => {
    if (!result) return;
    setShowChat(true);
    setChatHistory([
      { id: 'analyst-init', role: 'model', parts: [{ text: `Bonjour ! J'ai analysé votre swing. Score : ${result.score}/100. "${result.feedback}" Que voulez-vous savoir de plus sur votre technique ?` }] }
    ]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const mockResult = await analyzeSwing("placeholder_url", "Working on my backswing rotation.");
      setResult(mockResult);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!result || playingAudio) return;
    setPlayingAudio(true);
    try {
      const textToSpeak = `${result.feedback}. Points clés: ${result.focal_points.join(", ")}`;
      const resultData = await generateSpeech(textToSpeak);
      if (typeof resultData === 'object' && resultData.fallback) {
        speakWithBrowser(resultData.text);
      } else if (typeof resultData === 'string') {
        await playRawPcm(resultData);
      }
    } catch (err) {
      console.error("Audio playback error:", err);
    } finally {
      setPlayingAudio(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-sans font-bold tracking-tight mb-2">AI Swing Coach</h2>
        <p className="text-gray-500 font-medium">Upload a video of your swing for instant professional feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Card */}
        <div className="space-y-4">
          <label className="block w-full border-2 border-dashed border-gray-300 bg-white rounded-3xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group">
            <input 
              type="file" 
              className="hidden" 
              accept="video/*,image/*" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                <Video size={32} />
              </div>
              <div>
                <p className="font-bold text-lg text-gray-900">{file ? file.name : "Select Swing Video"}</p>
                <p className="text-sm text-gray-500">Fast analysis within 10 seconds</p>
              </div>
            </div>
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || analyzing}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              !file || analyzing 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
            }`}
          >
            {analyzing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Sparkles size={20} />
                </motion.div>
                Analyzing your mechanics...
              </>
            ) : (
              <>
                <Upload size={20} />
                Start Analysis
              </>
            )}
          </button>
        </div>

        {/* Results Pane */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <AnimatePresence mode='wait'>
            {result ? (
              <motion.div
                key="ai-analyst-result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 space-y-6 flex-1"
              >
                <div className="flex justify-between items-start">
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={12} /> Analysis Complete
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none">Swing Score</p>
                    <p className="text-4xl font-sans font-black text-emerald-600 leading-tight">{result.score}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                    <h4 className="flex items-center gap-2 font-bold mb-2 text-gray-900">
                      <Sparkles size={16} className="text-emerald-600" />
                      Coach Feedback
                    </h4>
                    <button 
                      onClick={handlePlayAudio}
                      disabled={playingAudio}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full border border-gray-100 text-emerald-600 shadow-sm hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {playingAudio ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                    </button>
                    <p className="text-gray-600 text-sm leading-relaxed pr-8">{result.feedback}</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-gray-900 uppercase tracking-widest">Key Focal Points</h4>
                    {result.focal_points?.map((point: string, i: number) => (
                      <div key={`focal-point-${point.substring(0,10)}-${i}`} className="flex gap-3 items-start group">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          {i + 1}
                        </div>
                        <p className="text-sm font-medium text-gray-700">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 mt-auto">
                    <button 
                      onClick={() => { setResult(null); setFile(null); }}
                      className="flex-1 text-gray-400 font-bold border-2 border-gray-50 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      New Swing
                    </button>
                    <button 
                      onClick={initChat}
                      className="flex-[2] bg-[#c9964a] text-black font-black uppercase text-xs tracking-widest py-3 rounded-xl shadow-lg shadow-[#c9964a]/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <Brain size={16} />
                      Tactical Chat
                    </button>
                </div>

                {/* Tactical Chat Overlay */}
                <AnimatePresence>
                  {showChat && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-6 rounded-3xl"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#c9964a] rounded-xl flex items-center justify-center text-black">
                            <Brain size={20} />
                          </div>
                          <h3 className="font-black italic uppercase tracking-tighter text-white">Coach Link</h3>
                        </div>
                        <button onClick={() => { setShowChat(false); stopListening(); }} className="text-white/40 hover:text-white">
                          <X size={24} />
                        </button>
                      </div>

                      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-hide">
                        {chatHistory.map((msg) => (
                           <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-white/10 text-white' : 'bg-[#c9964a]/10 text-[#c9964a] italic border border-[#c9964a]/20'}`}>
                                {msg.parts[0].text}
                              </div>
                           </div>
                        ))}
                        {isChatLoading && <div className="flex justify-start"><Loader2 size={16} className="text-[#c9964a] animate-spin" /></div>}
                      </div>

                      <div className="flex items-center gap-3">
                        <motion.button
                           whileTap={{ scale: 0.9 }}
                           onClick={() => isListening ? stopListening() : startListening(true)}
                           className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-[#c9964a]'} text-black`}
                        >
                          <Mic size={20} />
                        </motion.button>
                        <div className="flex-1 relative">
                          <input 
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                            placeholder="Ask Adam..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9964a]/50"
                          />
                          {chatInput.trim() && (
                            <button onClick={() => handleSendChat()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#c9964a]">
                              <Send size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 text-gray-400">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                  <AlertCircle size={40} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-bold text-gray-600">No analysis yet</p>
                  <p className="text-xs px-6">Upload your swing and our AI coach will provide expert feedback on your mechanics.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

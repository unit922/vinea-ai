
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TRAINING_MODULES, INITIAL_SHIFTS } from '../constants';
import { geminiService } from '../services/geminiService';
import CocktailSearch from './CocktailSearch';
import { StaffShift, TrainingSession, FlashDrill, IntelligenceFeed, IntelligenceItem } from '../types';
import { LiveServerMessage, Modality } from '@google/genai';

const ROLES = ['Sommelier', 'Mixologist', 'Server', 'Manager'] as const;

const FlashDrillComponent: React.FC<{ role: string, onComplete: () => void }> = ({ role, onComplete }) => {
  const [drill, setDrill] = useState<FlashDrill | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setSelectedIdxShowExplanation] = useState(false);

  useEffect(() => {
    geminiService.getFlashDrill(role).then(d => {
      setDrill(d);
      setLoading(false);
    });
  }, [role]);

  if (loading) return <div className="p-8 text-center animate-pulse text-stone-400 font-black uppercase text-[10px]">Loading Alpha Drill...</div>;
  if (!drill) return null;

  const isCorrect = selectedIdx === drill.correctIndex;

  return (
    <div className="bg-stone-950 p-8 rounded-[3rem] border border-amber-500/20 shadow-2xl space-y-6 animate-in zoom-in-95">
       <div className="flex justify-between items-center">
          <span className="bg-amber-500 text-stone-950 text-[8px] font-black uppercase px-2 py-0.5 rounded">Tactical Drill</span>
          <span className="text-[8px] font-black uppercase text-stone-500 tracking-widest">{drill.category}</span>
       </div>
       <h4 className="text-xl font-serif font-bold text-white leading-tight italic">"{drill.question}"</h4>
       <div className="grid grid-cols-1 gap-2">
          {drill.options.map((opt, i) => (
            <button 
              key={i} 
              disabled={showExplanation}
              onClick={() => { setSelectedIdx(i); setSelectedIdxShowExplanation(true); }}
              className={`p-4 rounded-2xl border-2 text-left transition-all text-sm font-bold ${
                showExplanation 
                  ? i === drill.correctIndex ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : i === selectedIdx ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/5 border-white/5 text-stone-600'
                  : 'bg-white/5 border-white/10 text-stone-300 hover:border-amber-500/50'
              }`}
            >
              {opt}
            </button>
          ))}
       </div>
       {showExplanation && (
         <div className="p-5 bg-white/5 rounded-2xl border border-white/10 space-y-3 animate-in slide-in-from-top-2">
            <p className={`text-[10px] font-black uppercase ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>{isCorrect ? 'Technical Success' : 'Drill Incomplete'}</p>
            <p className="text-xs text-stone-400 leading-relaxed italic">{drill.explanation}</p>
            <button onClick={onComplete} className="w-full py-3 bg-white text-stone-900 rounded-xl font-black text-[9px] uppercase tracking-widest mt-2 shadow-lg">Next Deployment</button>
         </div>
       )}
    </div>
  );
};

const LiveAudioCoach: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const nextStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const getEdition = () => {
    const profileStr = localStorage.getItem('vinea_profile');
    if (!profileStr) return 'demo';
    return JSON.parse(profileStr).edition;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const encodeBase64 = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const stopAllSources = () => {
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsCoachSpeaking(false);
  };

  const startSession = async () => {
    if (isInitializing) return;
    setErrorMsg(null);

    if (getEdition() === 'demo') {
      setIsInitializing(true);
      setTimeout(() => {
        setIsInitializing(false);
        setErrorMsg("Live AI Multimodal coaching requires a 'Visionary' or 'Architect' tier connection. Explorer tier is restricted to local sandbox intelligence.");
      }, 1500);
      return;
    }
    
    if ((window as any).aistudio?.hasSelectedApiKey) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setIsInitializing(true);
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const sessionPromise = geminiService.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsInitializing(false);
            
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const base64 = encodeBase64(new Uint8Array(int16.buffer));
              sessionPromise.then(s => s.sendRealtimeInput({ 
                media: { data: base64, mimeType: 'audio/pcm;rate=16000' } 
              }));
            };
            source.connect(processor);
            processor.connect(inputAudioContextRef.current!.destination);

            frameIntervalRef.current = window.setInterval(() => {
              if (videoRef.current && canvasRef.current && isCameraActive) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                  canvasRef.current.width = videoRef.current.videoWidth / 2;
                  canvasRef.current.height = videoRef.current.videoHeight / 2;
                  ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                  const base64 = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionPromise.then(s => s.sendRealtimeInput({
                    media: { data: base64, mimeType: 'image/jpeg' }
                  }));
                }
              }
            }, 1000);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              setIsCoachSpeaking(true);
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsCoachSpeaking(false);
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              stopAllSources();
            }

            if (message.serverContent?.outputTranscription) {
              setTranscript(prev => [...prev.slice(-3), message.serverContent!.outputTranscription!.text]);
            }
          },
          onerror: (e) => {
            console.error("Vinea Audio Error", e);
            setIsInitializing(false);
            setIsActive(false);
          },
          onclose: () => {
            setIsActive(false);
            setIsInitializing(false);
            stopAllSources();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: "You are the Vinea Live AI Multimodal Sommelier. You provide real-time verbal technical coaching on wines, spirits, and mixology. You can see the user via their camera. Observe their drink preparation technique (shaking, stirring, garnishing) and service posture. Provide immediate, professional feedback and encouragement. If they are prepping a specific drink, offer tips on technical precision. Be concise and responsive.",
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Audio/Video Access Denied", err);
      setIsInitializing(false);
      alert("Microphone and Camera access are required for the Live Sommelier session.");
    }
  };

  const handleTerminate = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
    }
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    stopAllSources();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-500 overflow-y-auto">
       <div className="w-full max-w-4xl bg-stone-900 rounded-[4rem] p-8 md:p-12 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row gap-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/5">
            <div className={`h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] transition-all duration-[30s] ease-linear ${isActive ? 'w-full' : 'w-0'}`}></div>
          </div>
          
          <div className="flex-1 flex flex-col gap-6">
            <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border-2 border-white/5 shadow-2xl group">
               <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-20'}`} />
               <canvas ref={canvasRef} className="hidden" />
               
               <div className="absolute top-6 left-6 flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-stone-700'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                    {isActive ? 'AI Vision Operational' : 'Sensor Offline'}
                  </span>
               </div>

               {isCoachSpeaking && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex items-end gap-1 h-20">
                       {[...Array(8)].map((_, i) => (
                         <div key={i} className="w-2 bg-amber-500/60 rounded-full animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 100}ms` }}></div>
                       ))}
                    </div>
                 </div>
               )}

               {errorMsg && (
                 <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-12 text-center animate-in fade-in">
                    <div className="space-y-6">
                       <i className="fas fa-shield-halved text-5xl text-amber-500"></i>
                       <p className="text-stone-300 text-sm font-bold leading-relaxed">{errorMsg}</p>
                       <button onClick={() => setErrorMsg(null)} className="px-8 py-3 bg-white text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest">Acknowledge</button>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsCameraActive(!isCameraActive)}
                className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border ${isCameraActive ? 'bg-white/5 text-white border-white/10' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}
              >
                <i className={`fas ${isCameraActive ? 'fa-video' : 'fa-video-slash'}`}></i>
                {isCameraActive ? 'Camera Active' : 'AI Blinded'}
              </button>
              <button 
                className="flex-1 py-4 bg-white/5 text-stone-500 border border-white/10 rounded-2xl font-black text-[9px] uppercase tracking-widest cursor-not-allowed"
              >
                <i className="fas fa-microchip mr-2"></i>
                Haptic Feedback Off
              </button>
            </div>
          </div>

          <div className="lg:w-80 flex flex-col gap-6">
            <div className="space-y-2">
               <h3 className="text-3xl font-serif font-bold text-white tracking-tight italic">Live Sommelier</h3>
               <p className="text-stone-500 text-[9px] font-black uppercase tracking-[0.3em]">Alpha Coaching Node 4.1</p>
            </div>

            <div className="flex-1 bg-black/50 rounded-[2.5rem] p-6 min-h-[200px] flex flex-col border border-white/5 shadow-inner overflow-hidden">
               <h4 className="text-[8px] font-black uppercase text-stone-600 mb-4 tracking-widest border-b border-white/5 pb-2">Intelligence Relay</h4>
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                 {transcript.length > 0 ? (
                   transcript.map((t, i) => (
                     <p key={i} className="text-amber-100/90 text-sm font-medium leading-relaxed italic animate-in fade-in slide-in-from-bottom-2">
                       "{t}"
                     </p>
                   ))
                 ) : (
                   <p className="text-stone-700 text-[10px] font-bold uppercase tracking-widest leading-relaxed text-center pt-10">
                     {isInitializing ? 'Establishing Link...' : isActive ? 'Observing technique & listening...' : 'Link Authorization Required'}
                   </p>
                 )}
               </div>
            </div>

            <div className="flex flex-col gap-3">
               {!isActive && (
                 <button 
                   onClick={startSession} 
                   disabled={isInitializing} 
                   className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_20px_50px_rgba(245,158,11,0.2)] transition-all disabled:opacity-50 active:scale-95"
                 >
                   {isInitializing ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-bolt-lightning mr-2"></i>}
                   {isInitializing ? 'Syncing...' : 'Initialize Live Session'}
                 </button>
               )}
               <button onClick={handleTerminate} className="w-full py-5 bg-stone-800 hover:bg-rose-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 border border-white/5">
                 Terminate & Exit
               </button>
            </div>
          </div>
       </div>
    </div>
  );
};

interface IntelligenceAcademyProps {
  searchQuery?: string;
  userRole?: StaffShift['role'];
}

const IntelligenceAcademy: React.FC<IntelligenceAcademyProps> = ({ searchQuery = '', userRole = 'Manager' }) => {
  const [activeTab, setActiveTab] = useState<'academy' | 'intelligence' | 'simulator' | 'mixology' | 'signature' | 'roster' | 'guide'>('academy');
  const [messages, setMessages] = useState<{role: 'user' | 'vinea', text: string}[]>([{ role: 'vinea', text: `Vinea Academy operational. System tuned for ${userRole} level technical coaching.` }]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showLive, setShowLive] = useState(false);
  const [showDrill, setShowDrill] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [selectedModule, setSelectedModule] = useState<TrainingSession | null>(null);
  const [moduleCurriculum, setModuleCurriculum] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const [staffList, setStaffList] = useState<StaffShift[]>(() => {
    const saved = localStorage.getItem('vinea_staff_list');
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffShift['role']>('Server');

  const [simScenario, setSimScenario] = useState("A VIP guest is asking for a rare vintage from the reserve list that isn't showing in the digital cellar inventory.");
  const [simHistory, setSimHistory] = useState<{role: 'staff' | 'guest', content: string, score?: number}[]>([]);
  const [simInput, setSimInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const [theme, setTheme] = useState('');
  const [isGeneratingSpecial, setIsGeneratingSpecial] = useState(false);
  const [specialResult, setSpecialResult] = useState<any>(null);

  const [intelFeed, setIntelFeed] = useState<IntelligenceFeed | null>(null);
  const [isLoadingIntel, setIsLoadingIntel] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('vinea_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    if (activeTab === 'intelligence' && !intelFeed) {
      handleFetchIntelligence();
    }
  }, [activeTab]);

  const handleFetchIntelligence = async () => {
    setIsLoadingIntel(true);
    try {
      const data = await geminiService.getGlobalIntelligence();
      setIntelFeed(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingIntel(false);
    }
  };

  const handleStartModule = (module: TrainingSession) => {
    setSelectedModule(module);
    setModuleCurriculum(null);
    setCurrentStep(0);
    setShowQuiz(false);
    setQuizData(null);
    setQuizScore(null);
    setIsThinking(true);
    geminiService.getModuleCurriculum(module.topic).then(c => {
      setModuleCurriculum(c);
      setIsThinking(false);
    });
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const msg = input; setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsThinking(true);
    try {
      const response = await geminiService.getTrainingResponse(msg, []);
      setMessages(prev => [...prev, { role: 'vinea', text: response }]);
    } catch (e) { console.error(e); }
    finally { setIsThinking(false); }
  };

  const handleStartSimulator = async () => {
    setIsSimulating(true);
    const firstTurn = await geminiService.runServiceSimulator(simScenario, "Begin Scenario");
    setSimHistory([{ role: 'guest', content: firstTurn.guestResponse }]);
    setIsSimulating(false);
  };

  const handleSimulatorTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInput.trim()) return;
    const userInput = simInput; setInput('');
    setIsSimulating(true);
    const result = await geminiService.runServiceSimulator(simScenario, userInput);
    setSimHistory(prev => [
      ...prev, 
      { role: 'staff', content: userInput, score: result.score }, 
      { role: 'guest', content: result.guestResponse }
    ]);
    setIsSimulating(false);
  };

  const handleStartQuiz = async () => {
    if (!selectedModule) return;
    setIsThinking(true);
    try {
      const data = await geminiService.generateModuleQuiz(selectedModule.topic);
      setQuizData(data);
      setQuizAnswers([]);
      setShowQuiz(true);
    } catch (e) { console.error(e); }
    finally { setIsThinking(false); }
  };

  const handleCompleteQuiz = () => {
    let score = 0;
    quizData.questions.forEach((q: any, i: number) => {
      if (quizAnswers[i] === q.correctIndex) score++;
    });
    setQuizScore(score);
    if (score >= 2 && selectedModule) {
      setStaffList(prev => prev.map(s => {
        if (s.role === userRole) { 
          const assigned = s.assignedModules || [];
          return { ...s, assignedModules: assigned.map(m => m.moduleId === selectedModule.id ? { ...m, completed: true } : m) };
        }
        return s;
      }));
    }
  };

  const handleGenerateSpecial = async () => {
    if (!theme.trim()) return;
    setIsGeneratingSpecial(true);
    setSpecialResult(null);
    try {
      const result = await geminiService.generateSignatureSpecial(theme);
      setSpecialResult(result);
    } catch (err) { console.error(err); }
    finally { setIsGeneratingSpecial(false); }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    const ns: StaffShift = {
      id: `st-${Date.now()}`,
      name: newStaffName,
      role: newStaffRole,
      startTime: '17:00',
      endTime: '23:00',
      performanceScore: 80,
      accessStatus: 'Active',
      assignedModules: []
    };
    setStaffList([...staffList, ns]);
    setNewStaffName('');
    setShowAddStaff(false);
  };

  const toggleModuleAssignment = (staffId: string, moduleId: string) => {
    setStaffList(prev => prev.map(s => {
      if (s.id !== staffId) return s;
      const assigned = s.assignedModules || [];
      const exists = assigned.find(m => m.moduleId === moduleId);
      if (exists) return { ...s, assignedModules: assigned.filter(m => m.moduleId !== moduleId) };
      return { ...s, assignedModules: [...assigned, { moduleId, completed: false }] };
    }));
  };

  return (
    <div className="space-y-4 h-full flex flex-col overflow-hidden relative">
      <div className="flex justify-between items-center border-b border-stone-200 shrink-0 pr-4">
        <div className="flex gap-4 overflow-x-auto custom-scrollbar">
          {(['academy', 'intelligence', 'simulator', 'mixology', 'signature', 'roster', 'guide'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => { setActiveTab(t); setSelectedModule(null); }} 
              className={`pb-4 text-[11px] uppercase tracking-widest font-black transition-all px-2 ${activeTab === t ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pb-4">
          <button onClick={() => setShowDrill(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all border border-stone-200">
             <i className="fas fa-bolt text-amber-500"></i> Flash Drill
          </button>
          <button onClick={() => setShowLive(true)} className="flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all border border-amber-500/20 shadow-lg">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]"></span>
            AI Sommelier
          </button>
        </div>
      </div>

      {showDrill && (
        <div className="fixed inset-0 z-[300] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-md">
              <FlashDrillComponent role={userRole} onComplete={() => setShowDrill(false)} />
           </div>
        </div>
      )}

      {showLive && <LiveAudioCoach onClose={() => setShowLive(false)} />}

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'academy' && (
          selectedModule ? (
            <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
               <div className="lg:col-span-3 bg-white rounded-3xl border border-stone-200 p-6 flex flex-col shadow-sm overflow-hidden">
                  <button onClick={() => setSelectedModule(null)} className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 mb-6 flex items-center gap-2"><i className="fas fa-arrow-left"></i> Exit Classroom</button>
                  <h3 className="text-xl font-serif font-black text-stone-900 mb-6 leading-tight">{selectedModule.topic}</h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {moduleCurriculum?.sections?.map((s: any, i: number) => (
                      <button key={i} onClick={() => { setCurrentStep(i); setShowQuiz(false); }} className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${currentStep === i && !showQuiz ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-stone-50 border-transparent text-stone-500 hover:bg-stone-100'}`}>
                         <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border-2 ${currentStep === i && !showQuiz ? 'bg-amber-50 border-amber-400 text-stone-900' : 'bg-white border-stone-200 text-stone-400'}`}>{i + 1}</span>
                         <span className="text-xs font-bold truncate">{s.heading}</span>
                      </button>
                    ))}
                    {moduleCurriculum?.sections?.length > 0 && (
                      <button onClick={handleStartQuiz} className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 mt-6 ${showQuiz ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-amber-50 border-dashed border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
                         <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black border-2 ${showQuiz ? 'bg-amber-500 border-amber-400 text-stone-900' : 'bg-white border-stone-200 text-stone-400'}`}><i className="fas fa-graduation-cap"></i></span>
                         <span className="text-xs font-bold">Assessment</span>
                      </button>
                    )}
                  </div>
               </div>
               <div className="lg:col-span-9 bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col relative">
                  {isThinking ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                      <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 animate-pulse">Syncing Academy Intelligence...</p>
                    </div>
                  ) : showQuiz ? (
                    <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar">
                        <div className="max-w-2xl mx-auto space-y-12">
                           <div className="text-center space-y-3">
                              <span className="bg-amber-500 text-stone-900 text-[10px] font-black uppercase px-6 py-2 rounded-full shadow-lg">Final Verification</span>
                              <h4 className="text-5xl font-serif font-bold text-stone-900 tracking-tight italic">Technical Mastery Quiz</h4>
                           </div>
                           {quizScore !== null ? (
                             <div className="text-center py-20 bg-stone-900 rounded-[4rem] text-white space-y-10 border border-white/5 shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                                <div className="text-[10rem] font-black text-amber-500 leading-none">{quizScore}/{quizData?.questions?.length || 0}</div>
                                <h5 className="text-2xl font-serif italic text-stone-300">Grade: {quizScore >= 2 ? 'Mastery Confirmed' : 'Sync Incomplete'}</h5>
                                <button onClick={() => setSelectedModule(null)} className="px-14 py-6 bg-amber-500 text-stone-900 rounded-2xl font-black uppercase text-xs tracking-[0.4em] hover:bg-amber-400 transition-all">Return to Hub</button>
                             </div>
                           ) : (
                             <div className="space-y-12 pb-20">
                                {quizData?.questions?.map((q: any, i: number) => (
                                  <div key={i} className="space-y-8 animate-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 150}ms` }}>
                                     <div className="flex gap-6"><span className="shrink-0 w-10 h-10 rounded-2xl bg-stone-900 text-amber-500 flex items-center justify-center font-black text-sm shadow-lg">{i+1}</span><p className="text-2xl font-bold text-stone-800 leading-tight">{q.question}</p></div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-16">
                                        {q.options.map((opt: string, optIdx: number) => (
                                          <button key={optIdx} onClick={() => { const next = [...quizAnswers]; next[i] = optIdx; setQuizAnswers(next); }} className={`p-8 rounded-[2rem] border-2 text-left transition-all font-bold text-base ${quizAnswers[i] === optIdx ? 'bg-amber-500 border-amber-500 text-stone-900 shadow-xl scale-[1.02]' : 'bg-white border-stone-100 text-stone-600 hover:border-amber-200'}`}>
                                            {opt}
                                          </button>
                                        ))}
                                     </div>
                                  </div>
                                ))}
                                <button onClick={handleCompleteQuiz} disabled={quizAnswers.length < (quizData?.questions?.length || 0)} className="w-full py-8 bg-stone-900 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.5em] hover:bg-stone-800 transition-all flex items-center justify-center gap-6 disabled:opacity-30 shadow-2xl">Submit for Evaluation</button>
                             </div>
                           )}
                        </div>
                    </div>
                  ) : moduleCurriculum?.sections?.length > 0 ? (
                    <div className="flex-1 overflow-y-auto p-12 lg:p-20 space-y-16 custom-scrollbar scroll-smooth">
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 pb-12 border-b border-stone-100">
                          <div className="space-y-3">
                             <div className="flex items-center gap-4"><span className="bg-stone-900 text-amber-500 text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg">Module Unit {currentStep + 1}</span></div>
                             <h4 className="text-5xl font-serif font-bold text-stone-900 tracking-tighter italic">{moduleCurriculum?.sections[currentStep].heading}</h4>
                          </div>
                          <div className="flex gap-3">
                             <button onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} disabled={currentStep === 0} className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center hover:bg-stone-200 disabled:opacity-30 transition-all shadow-sm"><i className="fas fa-chevron-left"></i></button>
                             <button onClick={() => { if (currentStep < moduleCurriculum.sections.length - 1) { setCurrentStep(prev => prev + 1); } else { handleStartQuiz(); } }} className="px-10 h-16 rounded-3xl bg-stone-900 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-xl">{currentStep < moduleCurriculum.sections.length - 1 ? 'Next Unit' : 'Assessment'}</button>
                          </div>
                       </div>
                       <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 items-start pb-20">
                          <div className="xl:col-span-8 space-y-12">
                             <p className="text-2xl text-stone-700 leading-[1.8] font-medium whitespace-pre-wrap selection:bg-amber-100 first-letter:text-7xl first-letter:font-serif first-letter:mr-4 first-letter:float-left first-letter:text-amber-600 first-letter:italic">
                               {moduleCurriculum?.sections[currentStep].content}
                             </p>
                             <div className="p-10 bg-stone-50 border-2 border-stone-100 rounded-[3rem] space-y-6">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 italic">Practical Lab Exercise</h5>
                                <p className="text-lg font-bold text-stone-800 leading-relaxed italic">"{moduleCurriculum?.sections[currentStep].labDrill}"</p>
                             </div>
                          </div>
                          <div className="xl:col-span-4 space-y-10 sticky top-10">
                             <div className="bg-stone-900 text-white p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-microscope text-8xl"></i></div>
                                <h5 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 mb-8 border-b border-white/10 pb-6">Standard Protocol</h5>
                                <div className="space-y-6">
                                   {moduleCurriculum?.sections[currentStep].keySpecs.map((spec: string, idx: number) => (
                                     <div key={idx} className="flex gap-5 items-start group/spec">
                                        <span className="shrink-0 w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black text-[10px] group-hover/spec:bg-amber-500 group-hover/spec:text-stone-950 transition-all">{idx + 1}</span>
                                        <p className="text-sm font-bold text-stone-300 leading-relaxed pt-1.5">{spec}</p>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20 grayscale opacity-40">
                       <i className="fas fa-book-open-reader text-6xl"></i>
                       <p className="font-serif italic text-xl">"Retrieving curriculum from the Scholar Node..."</p>
                    </div>
                  )}
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
              <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
                <div className="bg-stone-900 text-white p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden shrink-0 group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-graduation-cap text-6xl"></i></div>
                  <h3 className="text-2xl font-bold font-serif italic tracking-tight mb-8">Scholarly Hub</h3>
                  <button onClick={() => setShowLive(true)} className="w-full py-5 bg-amber-500 text-stone-900 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_15px_40px_rgba(245,158,11,0.2)] hover:bg-amber-400 active:scale-95 transition-all"><i className="fas fa-microphone-lines mr-2"></i> Start AI Sommelier</button>
                </div>
                <div className="px-2 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                   <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 italic">Academic Modules</h4>
                   <div className="space-y-4 pb-20">
                      {TRAINING_MODULES.map(m => (
                        <button key={m.id} onClick={() => handleStartModule(m)} className="w-full text-left bg-white p-6 rounded-[2.5rem] border border-stone-200 hover:border-amber-500 transition-all group shadow-sm flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-4">
                            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full bg-stone-50 text-stone-500 mb-2 inline-block">{m.difficulty}</span>
                            <h4 className="font-bold text-stone-800 group-hover:text-amber-600 text-base truncate transition-colors italic">{m.topic}</h4>
                          </div>
                          <i className="fas fa-chevron-right text-stone-100 group-hover:text-amber-500 transition-colors text-xs"></i>
                        </button>
                      ))}
                   </div>
                </div>
              </div>
              <div className="lg:col-span-9 bg-white rounded-[3.5rem] border border-stone-200 flex flex-col overflow-hidden shadow-sm relative">
                <div className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-500 flex items-center justify-center shadow-lg"><i className="fas fa-robot"></i></div>
                      <div>
                        <p className="text-sm font-bold text-stone-900 italic">Coach Intelligence Node</p>
                        <p className="text-[9px] font-black text-stone-400 uppercase">Archive Retrieval System v4.1</p>
                      </div>
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-stone-50/20">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                       <div className={`max-w-[80%] p-8 rounded-[2.5rem] shadow-sm ${m.role === 'user' ? 'bg-stone-900 text-white rounded-br-none shadow-stone-900/10' : 'bg-white text-stone-800 rounded-bl-none border border-stone-100 shadow-stone-900/5'}`}>
                          <p className="text base leading-relaxed font-medium">{m.text}</p>
                       </div>
                    </div>
                  ))}
                  {isThinking && (<div className="flex justify-start"><div className="bg-white p-6 rounded-3xl border border-stone-100 flex gap-3 shadow-sm"><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-75"></div><div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce delay-150"></div></div></div>)}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSend} className="p-8 bg-white border-t border-stone-100 flex gap-4 items-center">
                  <div className="flex-1 flex gap-2 items-center bg-stone-50 border-2 border-stone-100 rounded-[2rem] px-4 py-2 shadow-inner focus-within:ring-4 focus-within:ring-amber-500/10 transition-all">
                    <button type="button" onClick={() => setIsListening(!isListening)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-stone-200 text-stone-500'}`}><i className={`fas ${isListening ? 'fa-microphone' : 'fa-microphone-slash'} text-lg`}></i></button>
                    <input value={input} onChange={e => setInput(e.target.value)} placeholder={isListening ? "Listening..." : "Inquire technical specs, cultural pairings, or service logic..."} className="flex-1 bg-transparent border-none py-3 text-base outline-none font-bold placeholder:text-stone-300" />
                  </div>
                  <button type="submit" className="w-16 h-16 bg-stone-900 text-white rounded-[1.8rem] hover:bg-stone-800 transition-all shadow-xl flex items-center justify-center active:scale-95"><i className="fas fa-paper-plane text-xl"></i></button>
                </form>
              </div>
            </div>
          )
        )}

        {activeTab === 'intelligence' && (
          <div className="h-full flex flex-col space-y-6 overflow-hidden animate-in fade-in duration-500">
             <div className="flex justify-between items-center px-4 shrink-0">
                <div className="space-y-1">
                   <h3 className="text-2xl font-serif font-bold text-stone-900">Intelligence Brief</h3>
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Global Industry Synthesis</span>
                      {intelFeed?.isCached && (
                        <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">Resilient Cache Active (2-Week Recall)</span>
                      )}
                   </div>
                </div>
                <button 
                  onClick={handleFetchIntelligence} 
                  disabled={isLoadingIntel}
                  className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg flex items-center gap-2"
                >
                  {isLoadingIntel ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-rotate mr-2"></i>}
                  Refresh Intel
                </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-10 pb-20">
                {isLoadingIntel ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 animate-pulse">Scanning Global Market News & Trends...</p>
                  </div>
                ) : intelFeed ? (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                     <div className="xl:col-span-7 space-y-8">
                        <div className="space-y-4">
                           <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
                              <i className="fas fa-fire"></i> Emerging Trends
                           </h4>
                           <div className="grid grid-cols-1 gap-4">
                              {intelFeed.trends.map((trend) => (
                                <div key={trend.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm hover:shadow-md transition-all group">
                                   <div className="flex justify-between items-start mb-4">
                                      <h5 className="text-xl font-serif font-black italic text-stone-900 group-hover:text-amber-600 transition-colors leading-tight">{trend.title}</h5>
                                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded border ${trend.impact === 'High' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-stone-50 text-stone-400 border-stone-100'}`}>{trend.impact} Impact</span>
                                   </div>
                                   <p className="text-sm font-bold text-stone-700 leading-relaxed mb-4">"{trend.message}"</p>
                                   <p className="text-xs text-stone-400 italic leading-relaxed mb-6">Rationale: {trend.rationale}</p>
                                   <div className="flex flex-wrap gap-2">
                                      {trend.tags.map(tag => (
                                        <span key={tag} className="text-[8px] font-black uppercase bg-stone-50 text-stone-400 px-2.5 py-1 rounded-lg">#{tag}</span>
                                      ))}
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
                              <i className="fas fa-newspaper"></i> Industry News
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {intelFeed.news.map((n) => (
                                <div key={n.id} className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm hover:border-blue-500/30 transition-all flex flex-col justify-between">
                                   <div>
                                      <h5 className="text-sm font-black text-stone-900 mb-2 leading-tight">{n.title}</h5>
                                      <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 mb-4">{n.message}</p>
                                   </div>
                                   <div className="flex justify-between items-center pt-4 border-t border-stone-50">
                                      <div className="flex flex-wrap gap-1">
                                        {n.tags.slice(0,2).map(tag => (
                                          <span key={tag} className="text-[7px] font-black uppercase text-stone-300">#{tag}</span>
                                        ))}
                                      </div>
                                      <i className="fas fa-arrow-right text-stone-200 text-xs"></i>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="xl:col-span-5 space-y-8">
                        <div className="bg-stone-900 text-white p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><i className="fas fa-link text-8xl"></i></div>
                           <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-500 mb-8 border-b border-white/10 pb-6 italic">Grounding Sources</h4>
                           <div className="space-y-6">
                              {intelFeed.sources.map((src, i) => (
                                <a 
                                  key={i} 
                                  href={src.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-start gap-4 group/src p-4 rounded-2xl hover:bg-white/5 transition-all"
                                >
                                   <div className="shrink-0 w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black text-[10px] group-hover/src:bg-amber-500 group-hover/src:text-stone-950 transition-all">{i + 1}</div>
                                   <div>
                                      <p className="text-sm font-bold text-stone-200 leading-tight group-hover/src:text-amber-400 transition-colors">{src.title}</p>
                                      <p className="text-[9px] text-stone-500 font-mono mt-1 truncate max-w-[200px]">{src.uri}</p>
                                   </div>
                                </a>
                              ))}
                           </div>
                        </div>

                        <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded-[3rem] space-y-4">
                           <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 italic">Analyst Pro-Tip</h5>
                           <p className="text-base font-bold text-amber-900 leading-relaxed italic">
                             "The current surge in {intelFeed.trends[0]?.title || 'low-intervention wines'} suggests a facility-wide inventory audit to capitalize on early Q2 margin boosts. Prepare the team for technical questions on regionality."
                           </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6">Synthesis Telemetry</h4>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                                 <span>Last Sync:</span>
                                 <span className="text-stone-400 font-mono">{new Date(intelFeed.timestamp).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                                 <span>Recall Status:</span>
                                 <span className="text-emerald-600 uppercase tracking-widest text-[10px]">Optimal</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 grayscale opacity-40">
                     <i className="fas fa-radar text-6xl mb-4"></i>
                     <p className="font-serif italic text-xl">"Awaiting Global Intelligence Pulse..."</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'simulator' && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
             <div className="lg:col-span-4 bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col gap-10 overflow-hidden relative">
                <div className="absolute bottom-0 right-0 p-10 opacity-5 pointer-events-none"><i className="fas fa-theater-masks text-[10rem]"></i></div>
                <div className="space-y-4 relative z-10">
                   <span className="bg-amber-500 text-stone-900 text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg">Scenario Setup</span>
                   <h3 className="text-4xl font-serif font-bold italic tracking-tight leading-none">Service simulator</h3>
                   <p className="text-stone-400 font-medium italic">"Test your hospitality intuition against our AI guest profiles."</p>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                   <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-3">
                      <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Active Scenario Brief</p>
                      <p className="text-sm font-bold text-white leading-relaxed">"{simScenario}"</p>
                   </div>
                   <button onClick={handleStartSimulator} className="w-full py-5 bg-white text-stone-900 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-amber-500 transition-all active:scale-95 shadow-xl">Initialize Scenario</button>
                </div>
             </div>
             <div className="lg:col-span-8 bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                   {simHistory.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-20 grayscale">
                        <i className="fas fa-face-laugh-beam text-6xl mb-6"></i>
                        <p className="text-xs font-black uppercase tracking-[0.4em]">Awaiting Scenario Pulse</p>
                     </div>
                   ) : (
                     simHistory.map((h, i) => (
                       <div key={i} className={`flex ${h.role === 'staff' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                          <div className={`max-w-[85%] p-6 rounded-[2rem] space-y-3 ${h.role === 'staff' ? 'bg-stone-900 text-white rounded-br-none' : 'bg-stone-100 text-stone-800 rounded-bl-none italic font-medium'}`}>
                             <p>{h.content}</p>
                             {h.score !== undefined && (
                               <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                                  <span className="text-[9px] font-black uppercase text-amber-500">Service Score:</span>
                                  <span className="text-sm font-black">{h.score}%</span>
                               </div>
                             )}
                          </div>
                       </div>
                     ))
                   )}
                   {isSimulating && <div className="flex justify-start"><div className="bg-stone-100 p-4 rounded-full flex gap-2 animate-pulse"><div className="w-1.5 h-1.5 bg-stone-400 rounded-full"></div><div className="w-1.5 h-1.5 bg-stone-400 rounded-full"></div><div className="w-1.5 h-1.5 bg-stone-400 rounded-full"></div></div></div>}
                </div>
                <form onSubmit={handleSimulatorTurn} className="p-8 bg-stone-50 border-t border-stone-200 flex gap-4">
                   <input value={simInput} onChange={e => setSimInput(e.target.value)} placeholder="Type your service response..." className="flex-1 px-8 py-5 bg-white border border-stone-200 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/10 shadow-inner" />
                   <button type="submit" disabled={isSimulating} className="px-10 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 disabled:opacity-30">Send Turn</button>
                </form>
             </div>
          </div>
        )}

        {activeTab === 'mixology' && <CocktailSearch />}
        
        {activeTab === 'signature' && (
          <div className="space-y-8 max-w-5xl mx-auto py-4 overflow-y-auto h-full custom-scrollbar pr-2 pb-20">
             <div className="bg-white p-10 rounded-[2.5rem] border border-stone-200 shadow-xl space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-serif font-bold text-stone-900">Creative Signature Lab</h3>
                  <p className="text-stone-500">Input a concept to generate a professional recipe and high-quality AI visual profile.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. Vintage Tokyo Sunset, Alpine Winter Cabin..." className="flex-1 px-8 py-5 bg-stone-50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold" />
                  <button onClick={handleGenerateSpecial} disabled={isGeneratingSpecial || !theme.trim()} className="px-10 py-5 bg-stone-900 text-white rounded-2xl font-bold shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {isGeneratingSpecial ? <i className="fas fa-magic fa-spin text-amber-500"></i> : <i className="fas fa-sparkles text-amber-500"></i>}
                    Generate Special
                  </button>
                </div>
             </div>
             {isGeneratingSpecial && (
               <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 animate-pulse">Brewing Intelligence & Visualizing Concept...</p>
               </div>
             )}
             {specialResult && (
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in zoom-in-95 duration-500 pb-20">
                  <div className="bg-stone-900 rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/5 aspect-square">
                     <img src={specialResult.imageUrl} alt={specialResult.recipe.name} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                     <div className="absolute bottom-10 left-10 right-10">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full border border-amber-500/30 backdrop-blur-md mb-4 inline-block">AI Generated Visual Profile (4K Ready)</span>
                        <h4 className="text-4xl font-serif font-bold text-white leading-tight">{specialResult.recipe.name}</h4>
                     </div>
                  </div>
                  <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-xl space-y-10 overflow-y-auto">
                     <div className="space-y-4"><h5 className="text-[10px] font-black uppercase tracking-widest text-amber-600">The Concept Story</h5><p className="text-base text-stone-600 italic leading-relaxed">"{specialResult.recipe.story}"</p></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Composition</h5>
                          <ul className="space-y-3">{specialResult.recipe.ingredients.map((ing: string, i: number) => (<li key={i} className="text-sm font-bold text-stone-800 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>{ing}</li>))}</ul>
                        </div>
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Standards</h5>
                          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100"><p className="text-[9px] font-black uppercase text-stone-400 mb-1">Glassware</p><p className="text-sm font-bold text-stone-800">{specialResult.recipe.glassware}</p></div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-600">Execution</h5>
                        <div className="space-y-4">{specialResult.recipe.instructions.map((step: string, i: number) => (<div key={i} className="flex gap-4 group"><span className="shrink-0 w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-black text-stone-500 group-hover:bg-amber-600 group-hover:text-white transition-all">{i+1}</span><p className="text-sm text-stone-700 font-medium leading-relaxed pt-1">{step}</p></div>))}</div>
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="h-full overflow-y-auto custom-scrollbar pr-4 space-y-12 animate-in fade-in duration-500 pb-24 max-w-5xl mx-auto">
             <div className="bg-stone-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 p-12 opacity-5"><i className="fas fa-book-sparkles text-[12rem]"></i></div>
                <div className="relative z-10 space-y-4">
                   <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.6em] mb-4 inline-block">Official Documentation</span>
                   <h2 className="text-5xl font-serif font-black italic tracking-tighter">Operational & Implementation Guide</h2>
                   <p className="text-stone-400 text-lg font-medium italic max-w-2xl">"Bridging technical scholarship with high-velocity hospitality operations."</p>
                </div>
             </div>

             <section className="space-y-8">
                <div className="flex items-center gap-4">
                   <span className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-900 flex items-center justify-center font-black">1</span>
                   <h3 className="text-2xl font-serif font-bold text-stone-900">User Guide: The Modules</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-4 group hover:border-amber-500 transition-all">
                      <h4 className="font-bold text-stone-800 flex items-center gap-3"><i className="fas fa-chart-line text-amber-500"></i> Executive Command</h4>
                      <p className="text-sm text-stone-500 leading-relaxed italic">Monitor real-time revenue velocity and predictive shift focus. Use the <strong>Investor Protocol</strong> to share equity-grade performance metrics with stakeholders.</p>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-4 group hover:border-amber-500 transition-all">
                      <h4 className="font-bold text-stone-800 flex items-center gap-3"><i className="fas fa-brain text-amber-500"></i> Scholar Node</h4>
                      <p className="text-sm text-stone-500 leading-relaxed italic">The facility's master knowledge archive. Use the <strong>AI Sommelier</strong> for verbal coaching or <strong>Flash Drills</strong> for rapid technical verification.</p>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-4 group hover:border-amber-500 transition-all">
                      <h4 className="font-bold text-stone-800 flex items-center gap-3"><i className="fas fa-barcode text-amber-500"></i> Yield Alpha</h4>
                      <p className="text-sm text-stone-500 leading-relaxed italic">Perform <strong>Vision Audits</strong> to identify brands and fill levels automatically. AI predicts supply needs based on upcoming cover count trends.</p>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-4 group hover:border-amber-500 transition-all">
                      <h4 className="font-bold text-stone-800 flex items-center gap-3"><i className="fas fa-fingerprint text-amber-500"></i> Guest Journey</h4>
                      <p className="text-sm text-stone-500 leading-relaxed italic">AI-powered <strong>Palate Mapping</strong> decodes preferences into actionable service briefs. Automate pre-arrival outreach and personalized pairing suggestions.</p>
                   </div>
                </div>
             </section>

             {/* HOSPITALITY INVESTOR ECOSYSTEM SECTION */}
             <section className="space-y-8">
                <div className="flex items-center gap-4">
                   <span className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-black">2</span>
                   <h3 className="text-2xl font-serif font-bold text-stone-900">Hospitality Investor Ecosystem</h3>
                </div>
                <div className="bg-white border-2 border-stone-200 rounded-[3rem] p-10 space-y-12">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <h4 className="font-black text-xs uppercase text-stone-400 tracking-widest border-b border-stone-100 pb-2">Target VC Focus</h4>
                         <p className="text-sm text-stone-600 leading-relaxed italic">
                           Vinea is architected to align with the core priorities of top-tier hospitality VCs, including <strong>Thayer Ventures</strong>, <strong>Derive Ventures</strong>, and <strong>GroundForce Capital</strong>.
                         </p>
                         <div className="space-y-4">
                            {[
                              { label: 'Operational Efficiency', desc: 'Automation of inventory, waste reduction, and service velocity.' },
                              { label: 'Revenue Growth', desc: 'Direct ROI through up-selling alpha and check-size optimization.' },
                              { label: 'Hyper-Personalization', desc: 'Utilizing guest palate data to create unique, high-value experiences.' },
                              { label: 'Scalability', desc: 'Demonstrable 300% YoY growth potential and high EBITDA forecasts.' }
                            ].map((item, i) => (
                              <div key={i} className="flex gap-4">
                                 <i className="fas fa-check-circle text-emerald-500 mt-1"></i>
                                 <div>
                                    <p className="text-xs font-black text-stone-800 uppercase tracking-tighter">{item.label}</p>
                                    <p className="text-[10px] text-stone-500 italic">{item.desc}</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                      <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100 space-y-6">
                         <h4 className="font-black text-[10px] uppercase text-stone-400 tracking-[0.3em]">Equity Alpha Brief</h4>
                         <p className="text-lg font-serif font-bold text-stone-800 italic leading-tight">
                           "Highlighting how the software specifically improves inventory accuracy and creates new revenue streams for stakeholders."
                         </p>
                         <div className="pt-4 border-t border-stone-200">
                            <p className="text-[9px] font-black uppercase text-stone-400 mb-2">Investment Metrics</p>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="bg-white p-4 rounded-xl shadow-sm"><p className="text-[8px] font-black uppercase text-stone-400">EBITDA Pulse</p><p className="text-xl font-black text-stone-900">+18%</p></div>
                               <div className="bg-white p-4 rounded-xl shadow-sm"><p className="text-[8px] font-black uppercase text-stone-400">Churn Index</p><p className="text-xl font-black text-stone-900">0.4%</p></div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </section>

             {/* NEW FEATURE AUDIT SECTION */}
             <section className="space-y-8">
                <div className="flex items-center gap-4">
                   <span className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-900 flex items-center justify-center font-black">3</span>
                   <h3 className="text-2xl font-serif font-bold text-stone-900">AI Feature Integrity Audit</h3>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-[3rem] p-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                         <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest italic border-b border-stone-200 pb-2">Currently Operational (Live)</h4>
                         <div className="space-y-4">
                            {[
                              { t: 'Predictive Inventory', d: 'Demand analysis reducing spoilage by 10-15%.' },
                              { t: 'Beverage Personalization', d: 'Taste evaluation algorithms and "Signature Lab" creation.' },
                              { t: 'AI Chatbots & Virtual Concierges', d: '24/7 assistants handling technical inquiries & bookings.' },
                              { t: 'Dynamic Pricing', d: 'Real-time menu adjustments based on scarcity & demand.' },
                              { t: 'Staff Optimization', d: 'Efficiency audits comparing floor performance to global benchmarks.' }
                            ].map((f, i) => (
                              <div key={i} className="flex gap-4">
                                 <i className="fas fa-check-double text-emerald-500 mt-1"></i>
                                 <div>
                                    <p className="text-xs font-bold text-stone-800 uppercase">{f.t}</p>
                                    <p className="text-[10px] text-stone-500 italic leading-relaxed">{f.d}</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-8">
                         <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-widest italic border-b border-stone-200 pb-2">System Roadmap (V5.0)</h4>
                         <div className="space-y-4">
                            {[
                              { t: 'Smart Kitchen Automation', d: 'Consistency monitoring via robotic chef & oven telemetry.' },
                              { t: 'Smart Room Technology', d: 'Voice-activated ambiance control & energy monitoring.' },
                              { t: 'Facial Recognition Check-in', d: 'Arrival speed optimization via biometric verification.' },
                              { t: 'Predictive Maintenance', d: 'Equipment failure alerts preventing emergency revenue loss.' },
                              { t: 'Automated Dispensers', d: 'Precision bar-tap integration for zero-waste pouring.' }
                            ].map((f, i) => (
                              <div key={i} className="flex gap-4">
                                 <i className="fas fa-clock text-amber-500 mt-1"></i>
                                 <div>
                                    <p className="text-xs font-bold text-stone-400 uppercase">{f.t}</p>
                                    <p className="text-[10px] text-stone-400 italic leading-relaxed opacity-60">{f.d}</p>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </section>

             <section className="space-y-8">
                <div className="flex items-center gap-4">
                   <span className="w-10 h-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-black">4</span>
                   <h3 className="text-2xl font-serif font-bold text-stone-900">Production Deployment</h3>
                </div>
                
                <div className="bg-stone-50 border border-stone-200 rounded-[3rem] p-10 space-y-10">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em]">Step 1: Environment Sync</p>
                      <p className="text-sm text-stone-700 leading-relaxed">Provision a <strong>Supabase</strong> instance and execute the provided <code>database_schema.sql</code>. Set the following variables in your deployment environment:</p>
                      <div className="bg-stone-900 text-amber-400 p-6 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner">
                         API_KEY=your_gemini_key<br/>
                         NEXT_PUBLIC_SUPABASE_URL=your_project_url<br/>
                         NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <h5 className="text-[10px] font-black uppercase text-stone-900 tracking-widest">Activation Protocol</h5>
                         <ul className="space-y-2 text-xs text-stone-500 list-disc pl-4 italic">
                            <li>Launch app to trigger the Onboarding Wizard.</li>
                            <li>Invite staff nodes via the <strong>Venue Admin</strong> panel.</li>
                            <li>Generate the <strong>Public Booking Link</strong> in the Concierge hub.</li>
                         </ul>
                      </div>
                      <div className="space-y-3">
                         <h5 className="text-[10px] font-black uppercase text-stone-900 tracking-widest">Technical Resilience</h5>
                         <p className="text-xs text-stone-500 leading-relaxed italic">
                           Vinea employs a <strong>14-day Resilient Cache</strong> for global news and news intelligence. This minimizes API dependency and ensures operational continuity during signal degradation.
                         </p>
                      </div>
                   </div>
                </div>
             </section>

             <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] flex gap-6 items-center">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-stone-900 shrink-0 shadow-lg"><i className="fas fa-lightbulb"></i></div>
                <p className="text-sm text-amber-900 font-bold italic">"Pro Tip: For optimal Vision Audit accuracy, ensure the bar silhouette is clear. The AI handles complex glassware distortion automatically."</p>
             </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="h-full flex flex-col space-y-6 overflow-hidden">
             <div className="flex justify-between items-center px-4 shrink-0">
                <div className="space-y-1">
                   <h3 className="text-2xl font-serif font-bold text-stone-900">Operator Roster</h3>
                   <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Unified Registry & Upskilling Control</p>
                </div>
                <button onClick={() => setShowAddStaff(!showAddStaff)} className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg active:scale-95 flex items-center gap-2"><i className={`fas ${showAddStaff ? 'fa-times' : 'fa-user-plus'} text-amber-500`}></i>{showAddStaff ? 'Cancel' : 'Authorize Operator'}</button>
             </div>

             <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden flex flex-col">
                {showAddStaff && (
                  <form onSubmit={handleAddStaff} className="p-8 border-b border-stone-100 bg-stone-50/30 flex gap-4 items-end animate-in slide-in-from-top-4">
                     <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black uppercase text-stone-500 ml-1">Full Name</label>
                        <input value={newStaffName} onChange={e => setNewStaffName(e.target.value)} required className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm" placeholder="Elena Rossi" />
                     </div>
                     <div className="w-48 space-y-2">
                        <label className="text-[9px] font-black uppercase text-stone-500 ml-1">Tier Assignment</label>
                        <select value={newStaffRole} onChange={e => setNewStaffRole(e.target.value as any)} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm appearance-none">
                           {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                     </div>
                     <button type="submit" className="h-12 px-10 bg-amber-500 text-stone-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Commit Registry</button>
                  </form>
                )}
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                   <table className="w-full text-left">
                      <thead className="sticky top-0 bg-white border-b border-stone-100 z-10">
                         <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                            <th className="px-8 py-5">Operator</th>
                            <th className="px-8 py-5">Role</th>
                            <th className="px-8 py-5">Mastery Sync</th>
                            <th className="px-8 py-5">Index</th>
                            <th className="px-8 py-5 text-right">Control</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                         {staffList.map(s => {
                            const completed = s.assignedModules?.filter(m => m.completed).length || 0;
                            const activeAssignments = s.assignedModules?.filter(m => !m.completed) || [];
                            const total = s.assignedModules?.length || 0;
                            const progress = total === 0 ? 0 : (completed / total) * 100;
                            return (
                              <React.Fragment key={s.id}>
                                <tr className={`hover:bg-stone-50 transition-all ${expandedStaffId === s.id ? 'bg-amber-50/50' : ''}`}>
                                   <td className="px-8 py-6">
                                      <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-500 flex items-center justify-center font-black text-xs">{s.name[0]}</div>
                                         <div className="min-w-0">
                                            <p className="text-sm font-bold text-stone-900 truncate">{s.name}</p>
                                            {activeAssignments.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {activeAssignments.map(am => {
                                                  const m = TRAINING_MODULES.find(mod => mod.id === am.moduleId);
                                                  return m ? (
                                                    <span key={m.id} className="text-[7px] font-black uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200 shadow-sm whitespace-nowrap">
                                                      {m.topic}
                                                    </span>
                                                  ) : null;
                                                })}
                                              </div>
                                            )}
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6"><span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${s.role === 'Sommelier' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-stone-100 text-stone-600 border-stone-200'}`}>{s.role}</span></td>
                                   <td className="px-8 py-6">
                                      <div className="w-32 space-y-1.5">
                                         <div className="flex justify-between text-[9px] font-black text-stone-400 uppercase"><span>{completed}/{total}</span><span>{Math.round(progress)}%</span></div>
                                         <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${progress}%` }}></div></div>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6"><span className="text-sm font-black text-stone-700">{s.performanceScore}%</span></td>
                                   <td className="px-8 py-6 text-right">
                                      <button 
                                        onClick={() => setExpandedStaffId(expandedStaffId === s.id ? null : s.id)} 
                                        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${expandedStaffId === s.id ? 'bg-amber-500 text-stone-900 shadow-lg' : 'bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200'}`}
                                        title="Manage Assignments"
                                      >
                                        <i className={`fas ${expandedStaffId === s.id ? 'fa-angle-up' : 'fa-user-gear'} text-xs`}></i>
                                      </button>
                                   </td>
                                </tr>
                                {expandedStaffId === s.id && (
                                  <tr>
                                     <td colSpan={5} className="bg-stone-50/50 p-8 border-y border-stone-100 animate-in slide-in-from-top-4">
                                        <div className="space-y-6">
                                           <div className="flex justify-between items-center">
                                              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 italic">Academy Assignments Control</h5>
                                              <p className="text-[9px] font-black text-stone-500 bg-stone-200 px-2 py-1 rounded">Assigning to {s.name}</p>
                                           </div>
                                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                              {TRAINING_MODULES.map(m => {
                                                const assigned = !!s.assignedModules?.find(am => am.moduleId === m.id);
                                                const done = !!s.assignedModules?.find(am => am.moduleId === m.id)?.completed;
                                                return (
                                                  <button key={m.id} onClick={() => toggleModuleAssignment(s.id, m.id)} className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all ${assigned ? 'bg-white border-amber-500 shadow-md' : 'bg-stone-100 border-transparent opacity-50 grayscale hover:grayscale-0 hover:opacity-100'}`}>
                                                     <div className="min-w-0 pr-4">
                                                        <p className="text-[11px] font-bold text-stone-800 truncate">{m.topic}</p>
                                                        <span className="text-[8px] font-black uppercase text-stone-400">{m.difficulty}</span>
                                                     </div>
                                                     {done ? <i className="fas fa-check-circle text-emerald-500"></i> : assigned ? <i className="fas fa-circle-check text-amber-500"></i> : <i className="fas fa-plus text-stone-300"></i>}
                                                  </button>
                                                );
                                              })}
                                           </div>
                                        </div>
                                     </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                         })}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligenceAcademy;

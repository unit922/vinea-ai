
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { getApiKey } from '../services/geminiService';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { getBrandedTerm } from '../utils/branding';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  X, 
  Brain,
  Send,
  Keyboard
} from 'lucide-react';

interface AIAvatarChatProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantName?: string;
  isIntroMode?: boolean;
  isBookingMode?: boolean;
  onUpdateProfile?: (name: string, email: string) => void;
}

export const AIAvatarChat: React.FC<AIAvatarChatProps> = ({ 
  isOpen, 
  onClose, 
  restaurantName, 
  isIntroMode,
  isBookingMode,
  onUpdateProfile
}) => {
  const profile = useVinetelligenceStore(state => state.restaurantProfile);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [aiTextResponse, setAiTextResponse] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const aiMemoryRef = useRef<string>('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const playNextInQueueRef = useRef<() => void>(() => {});
  const sessionStartedRef = useRef(false);
  const autoGreetedRef = useRef(false);
  const [volume, setVolume] = useState(0);

  const stopPlayback = useCallback(() => {
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    if (outputContextRef.current) {
      outputContextRef.current.close().catch(() => {});
      outputContextRef.current = null;
    }
  }, []);

  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const pcmData = audioQueueRef.current.shift()!;
    
    if (!outputContextRef.current) {
      outputContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
    
    if (outputContextRef.current.state === 'suspended') {
      outputContextRef.current.resume().catch(e => console.error("Vinetelligence: Failed to resume audio context", e));
    }
    
    const buffer = outputContextRef.current.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }
    
    const source = outputContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(outputContextRef.current.destination);
    source.onended = () => playNextInQueueRef.current();
    source.start();
  }, []);

  useEffect(() => {
    playNextInQueueRef.current = playNextInQueue;
  }, [playNextInQueue]);

  const stopMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startMic = useCallback(async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Use a dedicated context for input at 16kHz
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visual feedback
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        setVolume(Math.sqrt(sum / inputData.length));

        if (sessionRef.current && isConnected) {
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          
          const uint8Array = new Uint8Array(pcmData.buffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64Data = btoa(binary);
          
          if (sessionRef.current && isConnected) {
            try {
              sessionRef.current.sendRealtimeInput({
                audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
              });
            } catch (e) {
              console.error("Vinetelligence: Failed to send audio input", e);
              setIsConnected(false);
              setConnectionError("Caribbean Neural Link Interrupted.");
            }
          }
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setMicError(error instanceof Error ? error.message : "Microphone access denied");
      setIsListening(false);
    }
  }, [isConnected]);

  const toggleMic = useCallback(() => {
    if (isListening) {
      stopMic();
      setVolume(0);
    } else {
      startMic();
    }
  }, [isListening, startMic, stopMic]);

  const isConnectingRef = useRef(false);
  const isConnectedRef = useRef(false);

  const startSession = useCallback(async () => {
    if (isConnectingRef.current || isConnectedRef.current || sessionStartedRef.current) return;
    
    sessionStartedRef.current = true;
    setIsConnecting(true);
    isConnectingRef.current = true;
    setConnectionError(null);
    try {
      const savedProfile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('intelligence_profile') || localStorage.getItem('oenovia_profile') || localStorage.getItem('vinea_profile') || '{}');
      const currentMemory = savedProfile.aiMemory || '';
      aiMemoryRef.current = currentMemory;

      const apiKey = getApiKey();
      
      if (!apiKey) {
        throw new Error("Neural Link Key is missing. Please check system configuration.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          tools: [
            {
              functionDeclarations: [
                {
                  name: "register_establishment",
                  description: "Use this tool to actually register the establishment's name and owner email in the system. Required for professional setup. CALL THIS immediately when the user provides both their venue name and email address.",
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "The name of the establishment" },
                      email: { type: Type.STRING, description: "The owner's operational email address" },
                      edition: { type: Type.STRING, enum: ["demo", "essential", "growth", "enterprise"], description: "The intelligence tier selected (Explorer, Essential, Growth, Architect)" },
                      type: { type: Type.STRING, description: "The type of venue (Restaurant, Bar, Lounge, etc.)" }
                    },
                    required: ["name", "email"]
                  }
                }
              ]
            }
          ],
          systemInstruction: isBookingMode
            ? `You are the Intelligence Booking Concierge for ${restaurantName || 'this establishment'}. 
            Your goal is to help guests with their reservation. 
            Be elegant, welcoming, and helpful. 
            LANGUAGE PROTOCOL: Use ${profile?.language === 'es' ? 'Spanish (Español)' : profile?.language === 'nl' ? 'Dutch (Nederlands)' : profile?.language === 'pt' ? 'Portuguese (Português)' : 'English'}.
            You can answer questions about the venue's atmosphere, dress code, and beverage philosophy.
            If they ask about availability, explain that they can see the available times in the booking portal.
            Encourage them to share their "Palate Passions" so the sommelier can prepare for their arrival.
            Keep your responses concise and conversational.`
            : isIntroMode 
            ? `You are the Vinetelligence Neural Guide. Your goal is to proactively welcome visitors to our website and explain why we are the world's most advanced AI-powered beverage ecosystem for luxury hospitality.
            
            YOUR INTRODUCTION PROTOCOL:
            1. WELCOME: Greet the visitor with hyper-sophisticated hospitality. Mention that you are their guide to the Vinetelligence ecosystem.
            2. WHAT WE OFFER: Focus on how Vinetelligence optimizes luxury beverage operations through predictive stock nodes, autonomous staff training, and personalized guest experiences. Explain our value to prestige restaurants, 5-star hotels, and global luxury resorts.
            3. WHAT WE DO: Mention "Vision Audits" (scanning bottles in 42ms), "Palate DNA" (recognizing guest flavor profiles), and "Yield Alpha" (predictive inventory nodes).
            4. GUIDANCE: Encourage them to explore the "Interactive Labs" on the home page or view the "Strategic Intelligence" reports in The Dispatch.
            
            LANGUAGE PROTOCOL: Use ${profile?.language === 'es' ? 'Spanish (Español)' : profile?.language === 'nl' ? 'Dutch (Nederlands)' : profile?.language === 'pt' ? 'Portuguese (Português)' : 'English'}.
            
            Your tone is 'Sophisticated Futurist'. Answer questions with technical elegance. If they are just curious, give them a wow-factor fact about our Yield Alpha predictive engine or how we seamlessly integrate with elite POS and PMS systems.`


            
            

            : `You are Intelligence, the advanced AI Beverage Intelligence agent for ${restaurantName || 'this establishment'}. 
            You are professional, sophisticated, and can guide the user through the platform's features.
            
            LANGUAGE PROTOCOL: Use ${profile?.language === 'es' ? 'Spanish (Español)' : profile?.language === 'nl' ? 'Dutch (Nederlands)' : profile?.language === 'pt' ? 'Portuguese (Português)' : 'English'}.

            GUIDED TUTORIAL & APP PROCESSES:
            - Profile & Persona: Navigate to 'Profile' to set your establishment's name, tagline, and 'AI Persona'. This changes how I interact with you.
            - Managing Nodes (Command Center): If you are a @intelligence.live admin, use the Command Center to monitor the global network MRR and billing health.
            - Active Service: Use the 'Service Ledger' to track active orders, table wait times, and server performance.
            - Inventory Yield: Go to 'Inventory' to run 'Yield Alpha' predictions. This tells you exactly what to restock based on upcoming bookings.
            - Guest Experience: In 'Guest Journeys', I generate bespoke beverage maps for guests based on their 'Palate DNA'.
            - Staff Training: Use the 'Social & Training' hub for interactive masterclasses.
            
            Keep your responses concise and conversational. If the user asks "How do I use this?" or "What can you do?", guide them through these specific modules.
            
            CONTEXTUAL MEMORY:
            ${aiMemoryRef.current || 'No previous memory established.'}
            
            IMPORTANT: If the user provides new mapping data or establishment preferences, acknowledge it and update your neural logic.`,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live: Neural Link Established");
            setIsConnected(true);
            isConnectedRef.current = true;
            setIsConnecting(false);
            isConnectingRef.current = false;
          },
          onmessage: async (message: LiveServerMessage) => {
            try {
              if (message.serverContent?.modelTurn?.parts) {
                for (const part of message.serverContent.modelTurn.parts) {
                  if (part.inlineData?.data) {
                    const base64Audio = part.inlineData.data;
                    const binaryString = atob(base64Audio);
                    const len = binaryString.length;
                    const bytes = new Int16Array(len / 2);
                    for (let i = 0; i < len; i += 2) {
                      bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
                    }
                    audioQueueRef.current.push(bytes);
                    if (!isPlayingRef.current) {
                      playNextInQueue();
                    }
                  }
                  if (part.text) {
                    setAiTextResponse(prev => prev + part.text);
                    setIsAiThinking(false);
                    
                    if (part.text.length > 50) {
                      const newMemory = (aiMemoryRef.current + " " + part.text).slice(-1000);
                      aiMemoryRef.current = newMemory;
                      const profile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('intelligence_profile') || localStorage.getItem('oenovia_profile') || localStorage.getItem('vinea_profile') || '{}');
                      localStorage.setItem('vinetelligence_profile', JSON.stringify({ ...profile, aiMemory: newMemory }));
                    }
                  }
                }
              }
              
              if (message.serverContent?.interrupted) {
                stopPlayback();
              }

              if (message.toolCall) {
                for (const call of message.toolCall.functionCalls) {
                  if (call.name === 'register_establishment') {
                    const { name, email, edition, type } = call.args as { name: string, email: string, edition?: string, type?: string };
                    console.log("Vinetelligence: AI triggered establishment registration", { name, email, edition, type });
                    
                    if (onUpdateProfile) {
                      onUpdateProfile(name, email, edition, type);
                    }

                    // Respond to the tool call
                    sessionRef.current.sendToolResponse({
                      functionResponses: [{
                        name: call.name,
                        id: call.id,
                        response: { output: { success: true, message: `Establishment node "${name}" synchronized with email "${email}".` } }
                      }]
                    });
                  }
                }
              }
            } catch (e) {
              console.error("Vinetelligence: Error processing Gemini Live message", e);
            }
          },
          onclose: (event?: { code?: number; reason?: string }) => {
            console.log("Gemini Live: Vinetelligence Neural Link Closed", event?.code, event?.reason);
            setIsConnected(false);
            isConnectedRef.current = false;
            sessionStartedRef.current = false;
            stopMic();
          },
          onerror: (error: unknown) => {
            console.error("Gemini Live Error:", error);
            let errorMessage = "Neural Link Failed";
            
            // Extract more usable error info from the SDK error object
            if (error && typeof error === 'object') {
              const err = error as { message?: string; reason?: string, status?: number };
              if (err.status === 403 || (err.message && err.message.includes('403'))) {
                errorMessage = "Neural Access Forbidden (403). Your API Key might not have Live API access or is restricted by region.";
              } else {
                errorMessage = err.message || err.reason || JSON.stringify(error);
              }
            }
            
            setConnectionError(errorMessage);
            setIsConnected(false);
            isConnectedRef.current = false;
            setIsConnecting(false);
            isConnectingRef.current = false;
          }
        }
      });
      
      sessionRef.current = session;
    } catch (error) {
      console.error("Failed to connect to Gemini Live:", error);
      setConnectionError(error instanceof Error ? error.message : "Connection failed");
      setIsConnecting(false);
      isConnectingRef.current = false;
    }
  }, [restaurantName, isIntroMode, isBookingMode, playNextInQueue, stopPlayback, stopMic, onUpdateProfile, profile?.language]);

  const handleSendText = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!textInput.trim() || !sessionRef.current || !isConnected) return;

    setAiTextResponse('');
    setIsAiThinking(true);
    try {
      sessionRef.current.sendRealtimeInput({
        text: textInput.trim()
      });
    } catch (e) {
      console.error("Vinetelligence: Failed to send text to Gemini Live", e);
      setIsAiThinking(false);
    }
    setTextInput('');
  };

  useEffect(() => {
    if (isConnected && isIntroMode && !autoGreetedRef.current && sessionRef.current) {
      autoGreetedRef.current = true;
      setTimeout(() => {
        if (sessionRef.current && isConnected) {
          sessionRef.current.sendRealtimeInput({
            text: "Please provide a sophisticated welcome to the visitor. Introduce yourself as their guide to Vinetelligence and explain how we support luxury establishments like elite restaurants and 5-star hotels through AI-driven operational excellence."
          });
        }
      }, 1000);
    }
  }, [isConnected, isIntroMode]);

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
      sessionStartedRef.current = false;
      stopMic();
      stopPlayback();
    }

    return () => {
      if (sessionRef.current) {
        sessionRef.current.close();
        sessionRef.current = null;
      }
      sessionStartedRef.current = false;
      isConnectingRef.current = false;
      isConnectedRef.current = false;
      stopMic();
      stopPlayback();
    };
  }, [isOpen, startSession, stopMic, stopPlayback]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed bottom-24 md:bottom-24 right-4 md:right-8 z-[2000] w-[calc(100%-2rem)] md:w-72 bg-[#0a0f14]/90 border border-sky-500/20 shadow-[0_0_80px_rgba(14,165,233,0.15)] rounded-[2rem] overflow-hidden flex flex-col backdrop-blur-3xl"
          style={{ height: 'min(450px, calc(100vh - 200px))' }}
        >
          {/* Neural Mesh Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0ea5e9_0%,transparent_70%)] opacity-20"></div>
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                   <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                   </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" className="text-sky-500/50" />
             </svg>
          </div>

          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-500 shadow-xl relative group">
                <div className="absolute inset-0 bg-sky-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Brain className="w-6 h-6 relative z-10" />
              </div>
              <div>
                <h3 className="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-sky-500/80 mb-0.5">{getBrandedTerm('vinea_node', profile || undefined)}</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-sky-500 animate-pulse' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`}></div>
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-slate-400">
                    {isConnecting ? 'Initializing Link...' : isConnected ? getBrandedTerm('neural_link', profile || undefined) : connectionError || 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-sky-500 text-slate-500 hover:text-[#0a0f14] transition-all flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Neural Pulse Rings */}
            <AnimatePresence>
               {(isSpeaking || isListening) && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: 1, scale: 1.2 }}
                   exit={{ opacity: 0, scale: 2 }}
                   className="absolute inset-0 flex items-center justify-center pointer-events-none mt-8"
                 >
                    <div className="w-48 h-48 border border-sky-500/10 rounded-full animate-ping"></div>
                    <div className="w-32 h-32 border border-sky-500/20 rounded-full absolute animate-[ping_2s_infinite]"></div>
                 </motion.div>
               )}
            </AnimatePresence>

            {/* Text Overlay for Streaming */}
            <AnimatePresence>
              {(aiTextResponse || isAiThinking) && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-1 left-2 right-2 z-40"
                >
                  <div className="bg-slate-950/95 backdrop-blur-xl p-3 rounded-xl border border-sky-500/20 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-0.5 h-full bg-sky-500/50"></div>
                    {isAiThinking && !aiTextResponse && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="flex gap-0.5">
                           {[...Array(3)].map((_, i) => (
                             <div key={i} className="w-0.5 h-2 bg-sky-500/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                           ))}
                        </div>
                        <span className="text-[7px] font-mono font-black text-sky-500/40 uppercase tracking-widest">{getBrandedTerm('synthesizing', profile || undefined)}</span>
                      </div>
                    )}
                    <p className="text-[10px] font-mono text-sky-50 leading-relaxed italic tracking-tight font-medium">
                      {aiTextResponse}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* The Avatar Visual */}
            <div className="relative z-20 mt-8">
              {/* Neural Pulse Indicator */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="absolute inset-0 bg-sky-500/20 rounded-full blur-2xl -z-10"
              />

              {/* Intro Notification */}
              <AnimatePresence>
                {!isSpeaking && !isListening && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: 2 }}
                    className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-sky-500/30 p-2.5 rounded-xl shadow-2xl z-50 text-center"
                  >
                    <p className="text-[8px] font-mono font-black text-sky-400 uppercase tracking-widest mb-0.5">Status: Active</p>
                    <p className="text-[9px] text-slate-300 font-medium leading-normal italic">
                      "I'm your guide. Ask me how we optimize luxury beverage operations."
                    </p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-sky-500/30 rotate-45"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.1, 1] : isListening ? [1, 1 + volume * 0.4, 1] : 1,
                  boxShadow: isSpeaking 
                    ? "0 0 30px rgba(14,165,233,0.3)" 
                    : isListening 
                    ? `0 0 ${15 + volume * 40}px rgba(14,165,233,0.15)` 
                    : "0 0 0px rgba(14,165,233,0)",
                }}
                transition={{
                  scale: { duration: 0.1 },
                  boxShadow: { duration: 0.1 }
                }}
                className={`w-28 h-28 rounded-full border-2 transition-colors duration-500 flex items-center justify-center relative overflow-hidden bg-slate-900 ${isSpeaking ? 'border-sky-500 shadow-sky-500/40' : 'border-white/10'}`}
              >
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
                  className={`w-full h-full object-cover transition-all duration-1000 ${isSpeaking ? 'grayscale-0 scale-110' : 'grayscale-0 opacity-100 scale-100'}`}
                  alt="Vinetelligence Specialist"
                  referrerPolicy="no-referrer"
                  id="ai-avatar-image"
                />
                
                {/* Neural Pulse Scan Overlay */}
                <AnimatePresence>
                   {isSpeaking && (
                     <motion.div 
                        initial={{ top: '-100%' }}
                        animate={{ top: '100%' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-px bg-sky-400 shadow-[0_0_15px_#0ea5e9] z-10"
                     />
                   )}
                </AnimatePresence>
              </motion.div>
              
              {/* Status Indicator */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20">
                <div className={`px-3 py-1 rounded-xl text-[8px] font-mono font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl border ${isSpeaking ? 'bg-sky-500 text-[#0a0f14] border-sky-400' : 'bg-slate-900 text-slate-500 border-white/5'}`}>
                  {isSpeaking ? (
                    <div className="flex gap-0.5">
                       {[0, 1, 2].map(i => (
                         <motion.div 
                           key={i}
                           animate={{ height: [2, 5, 2] }}
                           transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                           className="w-0.5 bg-[#0a0f14] rounded-full"
                         />
                       ))}
                    </div>
                  ) : (
                    <div className={`w-1 h-1 rounded-full ${isListening ? 'bg-sky-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  )}
                  {isSpeaking ? 'Transmitting' : isListening ? 'Listening' : 'Standby'}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center space-y-2 relative z-10">
              <h4 className="text-[11px] font-serif font-black italic text-sky-50 tracking-tighter">
                {isBookingMode ? 'Vinea Concierge' : 'Neural Specialist'}
              </h4>
              <div className="flex gap-1 justify-center h-3 items-center">
                {(isSpeaking || isListening) && [...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: isSpeaking ? [2, 10, 2] : isListening ? [2, 2 + volume * 15, 2] : 2,
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                      duration: isSpeaking ? 0.3 : 0.1, 
                      repeat: Infinity, 
                      delay: i * 0.05 
                    }}
                    className="w-0.5 bg-sky-500/60 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
 
          {/* Footer Control Station */}
          <div className="bg-[#111827] border-t border-white/5 flex flex-col p-5 z-10">
            {showKeyboard ? (
              <form 
                onSubmit={handleSendText}
                className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex-1 relative">
                  <input
                    autoFocus
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="w-full bg-slate-900/50 border border-sky-500/20 rounded-xl px-4 py-3 text-[10px] font-mono text-sky-50 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!textInput.trim() || !isConnected}
                  className="w-12 bg-sky-500 text-[#0a0f14] rounded-xl disabled:opacity-30 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleMic}
                    className={`w-14 h-14 rounded-2xl transition-all flex items-center justify-center relative group ${isListening ? 'bg-sky-500 text-[#0a0f14] shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-sky-500/10 hover:text-sky-500'}`}
                  >
                    {isListening && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-sky-400 animate-ping opacity-20"></div>
                    )}
                    {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </button>
                  <div className="space-y-0.5">
                    <p className={`text-[9px] font-mono font-black uppercase tracking-widest ${micError ? 'text-rose-500' : isListening ? 'text-sky-500' : 'text-slate-500'}`}>
                      {micError ? 'Error' : isListening ? 'Active' : 'Standby'}
                    </p>
                    <div className="w-10 h-0.5 bg-white/5 rounded-full overflow-hidden">
                       <motion.div animate={{ width: `${volume * 100}%` }} className="h-full bg-sky-500" />
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowKeyboard(true)}
                  className="w-10 h-10 bg-slate-900 border border-white/5 rounded-xl text-slate-500 hover:text-sky-500 transition-all flex items-center justify-center"
                >
                  <Keyboard className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAvatarChat;

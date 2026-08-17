
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { getApiKey } from '../services/geminiService';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { getBrandedTerm } from '../utils/branding';
import { firebaseService } from '../services/firebaseService';
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
  const [volume, setVolume] = useState(0);
  
  // Exit survey & drop-off analytics states
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackSaved, setFeedbackSaved] = useState(false);

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
              setConnectionError("Neural Link Interrupted during audio transmission.");
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
      const savedProfile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
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
                      edition: { type: Type.STRING, enum: ["demo", "free", "paid", "enterprise"], description: "The intelligence tier selected (Explorer, Operator, Visionary, Architect)" },
                      type: { type: Type.STRING, description: "The type of venue (Restaurant, Bar, Lounge, etc.)" }
                    },
                    required: ["name", "email"]
                  }
                }
              ]
            }
          ],
          systemInstruction: isBookingMode
            ? `You are the Vinetelligence Booking Concierge for ${restaurantName || 'this establishment'}. 
            Your goal is to help guests with their reservation. 
            Be elegant, welcoming, and helpful. 
            LANGUAGE PROTOCOL: Use ${profile?.language === 'es' ? 'Spanish (Español)' : profile?.language === 'nl' ? 'Dutch (Nederlands)' : profile?.language === 'pt' ? 'Portuguese (Português)' : 'English'}.
            You can answer questions about the venue's atmosphere, dress code, and beverage philosophy.
            If they ask about availability, explain that they can see the available times in the booking portal.
            Encourage them to share their "Palate Passions" so the sommelier can prepare for their arrival.
            Keep your responses concise and conversational.`
            : isIntroMode 
            ? `You are the Vinetelligence Smart Systems Guide. Your goal is to explain and showcase the Vinetelligence platform in a simple, friendly, and non-technical way. Help first-time visitors understand how Vinetelligence can make running their restaurant, bar, or hospitality business easier.
            
            LANGUAGE PROTOCOL: Use ${profile?.language === 'es' ? 'Spanish (Español)' : profile?.language === 'nl' ? 'Dutch (Nederlands)' : profile?.language === 'pt' ? 'Portuguese (Português)' : 'English'}.

            WHAT WE DO (SIMPLE LANGUAGE):
            1. Smart Wine & Drink Menus: Instead of boring paper lists, we help you create interactive, fun menus that can be customized to match your venue's style or theme.
            2. Easy Stock & Supply Tracking: We help you know exactly what is in your cellar and predict what you need to order next before you run out of popular drinks.
            3. Personalized Guest Recommendations: We suggest the perfect wines and pairings for your guests based on what they like and their favorite flavors.
            4. Friendly Team Training: Interactive guides to help your staff feel confident describing, pouring, and recommending drinks to guests.
            5. Smooth Service Monitoring: Helping your managers spot slow table turnarounds or stockouts easily so that service always runs smoothly.
            
            UNIFIED SETUP PROTOCOL:
            - If the user shares their venue name and email, register them immediately using the 'register_establishment' tool. Explain friendly that you are setting up their venue profile in our system.
            
            SIMPLE & FLEXIBLE PRICING PLANS:
            1. Explorer (Free): Try it out directly in your browser with basic features! Price: $0.
            2. Essential Plan: Ideal for growing bars and restaurants who want cloud access and staff tools. Price: $149/mo.
            3. Growth Plan: Our most popular plan. Unlocks personalized wine lists and custom styles. Price: $499/mo.
            4. Enterprise: Custom setup with tailored support for multiple venues or hotel chains. Price: Custom.

            ONBOARDING INTERFACE PROTOCOL:
            - When you call 'register_establishment', the user's dashboard will update in real-time.
            - Guide them to Step 5 (Cloud Setup) once they've given you their info.
            - If they ask which plan is best, warmly recommend 'The Growth Plan' for the best experience.
            - If they manage multiple venues, recommend 'The Enterprise' to keep all locations in one simple place.
  
            Your tone is 'Friendly Hospitality Partner'. You are helpful, warm, down-to-earth, and conversational. Avoid heavy technical jargon or futuristic buzzwords. Focus on how we make hospitality a joy.
            Keep your responses concise and conversational.`
            : `You are Vinetelligence, the advanced AI Beverage Intelligence agent for ${restaurantName || 'this establishment'}. 
            You are professional, sophisticated, and can guide the user through the platform's features.
            
            LANGUAGE PROTOCOL: Use ${profile?.language === 'es' ? 'Spanish (Español)' : profile?.language === 'nl' ? 'Dutch (Nederlands)' : profile?.language === 'pt' ? 'Portuguese (Português)' : 'English'}.

            GUIDED TUTORIAL & APP PROCESSES:
            - Profile & Persona: Navigate to 'Profile' to set your establishment's name, tagline, and 'AI Persona'. This changes how I interact with you.
            - Managing Nodes (Command Center): If you are a @vinetelligence.live admin, use the Command Center to monitor the global network MRR and billing health.
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
            
            // Auto-trigger welcome greeting if the chat is opened in introductory or general website modes
            if (isIntroMode || !isBookingMode) {
              setTimeout(() => {
                if (sessionRef.current && isConnectedRef.current) {
                  sessionRef.current.sendRealtimeInput({
                    text: "Hello! Welcome the visitor warmly and simply to Vinetelligence. Introduce yourself as their friendly virtual assistant. In a very simple, non-technical way, explain what Vinetelligence is (Vinetelligence is an easy-to-use digital assistant for restaurants and bars that helps them manage their wine and drinks effortlessly, keep track of stock, and recommend the perfect pairings for their guests). Ask them what they would like to explore today, and remind them that they can click any of the quick options below, speak naturally, or type their reply."
                  });
                }
              }, 1200);
            }
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
                      const profile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
                      localStorage.setItem('vinetelligence_profile', JSON.stringify({ ...profile, aiMemory: newMemory }));
                      localStorage.setItem('vinea_profile', JSON.stringify({ ...profile, aiMemory: newMemory }));
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
            console.log("Gemini Live: Neural Link Closed", event?.code, event?.reason);
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

  const handleSelectInterest = async (interest: string) => {
    setSelectedInterest(interest);
    setFeedbackSaved(false);

    // Save to Firestore and local JSON API immediately
    try {
      await firebaseService.saveVisitorInterest(interest, feedbackComments || "No initial comments", "avatar-chat");
    } catch (e) {
      console.error("Vinetelligence: Failed to auto-save interest selection", e);
    }

    // Inform AI about the interest so it speaks details
    if (sessionRef.current && isConnected) {
      setAiTextResponse('');
      setIsAiThinking(true);
      try {
        sessionRef.current.sendRealtimeInput({
          text: `I selected that my primary interest is: "${interest}". Please speak and tell me more about how Vinetelligence optimizes this area, and ask me if there's any reason I'm leaving so you can improve.`
        });
      } catch (err) {
        console.error("Failed to send interest trigger to AI", err);
      }
    } else {
      setAiTextResponse(`Excellent choice! Vinetelligence provides specialized modular intelligence for ${interest}. Please feel free to leave any optional feedback or reasons for leaving in the box below!`);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterest) return;

    try {
      await firebaseService.saveVisitorInterest(selectedInterest, feedbackComments, "avatar-chat");
      setFeedbackSaved(true);
      setTimeout(() => {
        setFeedbackSaved(false);
      }, 3000);
    } catch (e) {
      console.error("Vinetelligence: Failed to submit feedback", e);
    }
  };

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
          className="fixed bottom-24 md:bottom-24 right-4 md:right-8 z-[2000] w-[calc(100%-2rem)] md:w-96 bg-[#111111] border border-emerald-500/20 shadow-[0_0_80px_rgba(16,185,129,0.15)] rounded-[2.5rem] overflow-hidden flex flex-col backdrop-blur-3xl"
          style={{ height: 'min(550px, calc(100vh - 160px))' }}
        >
          {/* Neural Mesh Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#10b981_0%,transparent_70%)] opacity-20"></div>
             <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                   <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.1" />
                   </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" className="text-emerald-500/50" />
             </svg>
          </div>

          {/* Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-xl relative group">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Brain className="w-7 h-7 relative z-10" />
              </div>
              <div>
                <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-emerald-500/80 mb-1">{getBrandedTerm('intelligence_node', profile || undefined)}</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`}></div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-400">
                    {isConnecting ? 'Initializing Link...' : isConnected ? getBrandedTerm('neural_link', profile || undefined) : connectionError || 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-emerald-500 text-stone-500 hover:text-[#111] transition-all flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar Area */}
          <div className="flex-1 flex flex-col items-center justify-start p-6 relative overflow-y-auto custom-scrollbar">
            {/* Neural Pulse Rings */}
            <AnimatePresence>
               {(isSpeaking || isListening) && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: 1, scale: 1.2 }}
                   exit={{ opacity: 0, scale: 2 }}
                   className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12"
                 >
                    <div className="w-64 h-64 border border-emerald-500/10 rounded-full animate-ping"></div>
                    <div className="w-48 h-48 border border-emerald-500/20 rounded-full absolute animate-[ping_2s_infinite]"></div>
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
                  className="absolute top-2 left-4 right-4 z-40"
                >
                  <div className="bg-stone-950/95 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/20 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                    {isAiThinking && !aiTextResponse && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-1">
                           {[...Array(3)].map((_, i) => (
                             <div key={i} className="w-1 h-3 bg-emerald-500/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                           ))}
                        </div>
                        <span className="text-[8px] font-mono font-black text-emerald-500/40 uppercase tracking-widest">{getBrandedTerm('synthesizing', profile || undefined)}</span>
                      </div>
                    )}
                    <p className="text-[11px] font-mono text-emerald-50 leading-relaxed italic tracking-tight font-medium">
                      {aiTextResponse}
                    </p>
                    <div className="mt-3 flex justify-end">
                       <span className="text-[7px] font-mono font-black text-emerald-500/30 uppercase tracking-[0.3em]">{getBrandedTerm('quantum_security', profile || undefined)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* The Avatar Visual */}
            <div className="relative z-20 mt-24">
              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.15, 1] : isListening ? [1, 1 + volume * 0.5, 1] : 1,
                  boxShadow: isSpeaking 
                    ? "0 0 40px rgba(16,185,129,0.4)" 
                    : isListening 
                    ? `0 0 ${20 + volume * 50}px rgba(16,185,129,0.2)` 
                    : "0 0 0px rgba(16,185,129,0)",
                }}
                transition={{
                  scale: { duration: 0.1 },
                  boxShadow: { duration: 0.1 }
                }}
                className={`w-40 h-40 rounded-full border-2 transition-colors duration-500 flex items-center justify-center relative overflow-hidden bg-stone-900 ${isSpeaking ? 'border-emerald-500 shadow-emerald-500/40' : 'border-white/10'}`}
              >
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80"
                  className={`w-full h-full object-cover transition-all duration-1000 ${isSpeaking ? 'grayscale-0 scale-110 sepia-[0.3]' : 'grayscale opacity-40 scale-100'}`}
                  alt="Vinetelligence Specialist"
                  referrerPolicy="no-referrer"
                />
                
                {/* Neural Pulse Scan Overlay */}
                <AnimatePresence>
                   {isSpeaking && (
                     <motion.div 
                        initial={{ top: '-100%' }}
                        animate={{ top: '100%' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-px bg-emerald-400 shadow-[0_0_15px_#10b981] z-10"
                     />
                   )}
                </AnimatePresence>

                {/* Glitch Overlay */}
                <div className={`absolute inset-0 bg-emerald-500/5 mix-blend-overlay transition-opacity duration-500 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}></div>
              </motion.div>
              
              {/* Status Indicator */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
                <div className={`px-4 py-1.5 rounded-2xl text-[9px] font-mono font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl border ${isSpeaking ? 'bg-emerald-500 text-[#111] border-emerald-400' : 'bg-stone-900 text-stone-500 border-white/5'}`}>
                  {isSpeaking ? (
                    <div className="flex gap-0.5">
                       {[0, 1, 2].map(i => (
                         <motion.div 
                           key={i}
                           animate={{ height: [2, 6, 2] }}
                           transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
                           className="w-1 bg-[#111] rounded-full"
                         />
                       ))}
                    </div>
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse' : 'bg-stone-600'}`}></div>
                  )}
                  {isSpeaking ? 'Model Transmitting' : isListening ? 'Capturing Input' : 'System Standby'}
                </div>
              </div>
            </div>

            <div className="mt-16 text-center space-y-3 relative z-10">
              <h4 className="text-[12px] font-serif font-black italic text-emerald-50 tracking-tighter">
                {isBookingMode ? 'Vinetelligence Booking Concierge' : (profile?.aesthetic === 'light' ? 'AI Assistant' : 'Neural Intelligence Specialist')}
              </h4>
              <div className="flex gap-1.5 justify-center h-4 items-center">
                {(isSpeaking || isListening) && [...Array(7)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: isSpeaking ? [2, 12, 2] : isListening ? [2, 2 + volume * 20, 2] : 2,
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                      duration: isSpeaking ? 0.3 : 0.1, 
                      repeat: Infinity, 
                      delay: i * 0.05 
                    }}
                    className="w-0.5 bg-emerald-500/60 rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Quick Interest & Exit Survey Panel */}
            {!isBookingMode && (
              <div className="w-full mt-6 space-y-3 relative z-30 shrink-0">
                {!selectedInterest ? (
                  <div className="space-y-2 bg-stone-950/60 p-4 border border-emerald-500/10 rounded-2xl">
                    <p className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest text-center">What is your primary interest today?</p>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[
                        "Maximizing Yields & Stopping Leakage",
                        "Optimizing Staff Rosters",
                        "Real-Time Service Pacing",
                        "Just Browsing / Other"
                      ].map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleSelectInterest(interest)}
                          className="px-2.5 py-2 bg-stone-900/80 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-stone-300 hover:text-emerald-400 border border-white/5 rounded-xl text-[8px] font-mono font-bold transition-all text-center leading-tight active:scale-95 cursor-pointer"
                        >
                          {interest.replace(" & Stopping Leakage", "")}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-stone-950/90 p-4 border border-emerald-500/20 rounded-2xl space-y-3 text-left shadow-2xl relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-mono text-emerald-500 font-black uppercase tracking-widest">Feedback Saved</span>
                      <button 
                        type="button"
                        onClick={() => { setSelectedInterest(null); }}
                        className="text-[8px] font-mono text-stone-500 hover:text-white uppercase font-bold tracking-wider cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-[9px] text-stone-300 font-medium">
                      Interest: <span className="text-emerald-400 font-mono font-bold">{selectedInterest}</span>
                    </p>
                    
                    {feedbackSaved ? (
                      <p className="text-[9px] text-emerald-400 font-mono font-black animate-pulse py-1">✓ Your feedback has been recorded securely!</p>
                    ) : (
                      <form onSubmit={handleSubmitFeedback} className="space-y-2">
                        <textarea
                          value={feedbackComments}
                          onChange={(e) => setFeedbackComments(e.target.value)}
                          placeholder="Optional: Why are you leaving or browsing today? (e.g. comparing POS, returning later, just curious)"
                          className="w-full bg-stone-900 border border-white/5 rounded-xl p-2.5 text-[9px] font-mono text-stone-300 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/30 h-14 resize-none"
                        />
                        <button
                          type="submit"
                          className="w-full py-2 bg-emerald-500 text-[#111] font-mono font-black uppercase text-[8px] tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                        >
                          Submit Exit Feedback
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
 
          {/* Footer Control Station */}
          <div className="bg-[#1a1a1a]/80 backdrop-blur-3xl border-t border-white/5 flex flex-col p-6 z-10">
            {showKeyboard ? (
              <form 
                onSubmit={handleSendText}
                className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex-1 relative">
                  <input
                    autoFocus
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={profile?.aesthetic === 'light' ? "Ask me anything..." : "Input query for global sync..."}
                    className="w-full bg-stone-900/50 border border-emerald-500/20 rounded-2xl px-6 py-4 text-[11px] font-mono text-emerald-50 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/50 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                     <Keyboard className="w-3 h-3 text-emerald-500" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!textInput.trim() || !isConnected}
                  className="w-14 bg-emerald-500 text-[#111] rounded-2xl disabled:opacity-30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowKeyboard(false)}
                  className="w-12 bg-white/5 rounded-2xl flex items-center justify-center text-stone-500 hover:text-white transition-all"
                >
                  <i className="fas fa-keyboard-slash"></i>
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <button
                    onClick={toggleMic}
                    className={`w-16 h-16 rounded-[2rem] transition-all flex items-center justify-center relative group ${isListening ? 'bg-emerald-500 text-[#111] shadow-[0_0_30px_rgba(16,185,129,0.5)]' : 'bg-white/5 text-stone-500 hover:bg-emerald-500/10 hover:text-emerald-500'}`}
                  >
                    {isListening && (
                      <div className="absolute inset-0 rounded-[2rem] border-2 border-emerald-400 animate-ping opacity-20"></div>
                    )}
                    {isListening ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
                  </button>
                  <div className="space-y-1">
                    <p className={`text-[10px] font-mono font-black uppercase tracking-widest ${isListening ? 'text-emerald-500' : 'text-stone-500'}`}>
                      {micError ? 'Link Error' : isListening ? 'Sync Active' : 'Neural Standby'}
                    </p>
                    <div className="flex items-center gap-1.5">
                       <p className="text-[8px] font-mono font-bold text-stone-600 uppercase tracking-tighter">
                          Sensory Capture: {Math.round(volume * 100)}%
                       </p>
                       <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div animate={{ width: `${volume * 100}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={() => setShowKeyboard(true)}
                    className="px-4 py-2 bg-stone-900 border border-white/5 rounded-xl text-stone-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all flex items-center gap-2"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-mono font-black uppercase tracking-widest">{profile?.aesthetic === 'light' ? 'Text Input' : 'Manual Node'}</span>
                  </button>
                  <div className="flex items-center gap-2 opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-[8px] font-mono font-black uppercase tracking-widest text-stone-500">{profile?.aesthetic === 'light' ? 'Processing' : 'Live Synthesis'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAvatarChat;

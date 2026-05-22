import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Wine, Info, Star, Sparkles, X } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface VisionPitchProps {
  onClose: () => void;
}

export const VisionPitch: React.FC<VisionPitchProps> = ({ onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pitchData, setPitchData] = useState<{
    brandName: string;
    pitch: string;
    tastingNotes: string[];
    pairing: string;
    trivia: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const base64Data = base64Image.split(',')[1];
      const pitch = await geminiService.getIntelligencePitch(base64Data, 'image/jpeg');
      setPitchData(pitch);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze bottle. Please try again.";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setPitchData(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-stone-950">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 w-12 h-12 rounded-full bg-stone-900/50 border border-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-stone-800 transition-all z-50 group"
      >
        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <div className="w-full max-w-4xl bg-stone-900 rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/5">
        {!image ? (
          <div className="p-16 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
            
            <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/20 mb-2 rotate-3 group hover:rotate-0 transition-transform duration-500">
              <Camera size={44} className="text-stone-950" />
            </div>
            
            <div className="space-y-4 max-w-md">
              <h2 className="text-4xl font-serif font-black italic text-white tracking-tight">Vision Sentinel</h2>
              <p className="text-stone-400 text-sm font-medium leading-relaxed">
                Empower your service with instant expertise. Scan any label to synthesize a bespoke narrative that resonates with the vintage and brand.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 w-full max-w-xs">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 bg-stone-100 text-stone-950 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                <Camera size={16} />
                Activate Sentinel
              </button>
              <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest italic flex items-center justify-center gap-2">
                <Sparkles size={10} className="text-amber-500" />
                Real-time Sommelier AI Active
              </p>
            </div>

            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleCapture}
            />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row min-h-[600px]">
            {/* Visual Column */}
            <div className="w-full md:w-5/12 relative bg-stone-950 flex flex-col">
              <div className="flex-1 relative overflow-hidden group">
                <img 
                  src={image} 
                  alt="Captured label" 
                  className={`w-full h-full object-cover transition-all duration-1000 ${isAnalyzing ? 'scale-110 blur-sm brightness-50' : 'scale-100 brightness-75 group-hover:scale-105 duration-[10s]'}`} 
                />
                
                {/* Scanning line animation */}
                {isAnalyzing && (
                  <motion.div 
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_15px_#f59e0b] z-20"
                  />
                )}
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/20">
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                      <div className="w-20 h-20 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                      <div className="space-y-2">
                        <span className="block text-amber-500 font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Scanning Optics</span>
                        <span className="block text-white/40 font-bold text-[9px] uppercase tracking-widest">Mining Historical Ledger</span>
                      </div>
                    </motion.div>
                  )}
                  
                  {!isAnalyzing && (
                    <div className="mt-auto w-full">
                       <button 
                        onClick={reset}
                        className="w-full py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={12} />
                        Re-Scan Node
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Narrative Column */}
            <div className="w-full md:w-7/12 p-12 overflow-y-auto bg-stone-900 custom-scrollbar relative flex flex-col">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Wine size={200} />
              </div>

              <AnimatePresence mode="wait">
                {error ? (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                      <X size={32} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-white font-serif font-black italic text-xl italic">Optics Failure</h4>
                      <p className="text-stone-500 text-xs font-medium max-w-xs">{error}</p>
                    </div>
                    <button 
                      onClick={reset} 
                      className="px-8 py-3 bg-stone-800 text-white font-black uppercase text-[9px] tracking-widest rounded-xl hover:bg-stone-700 transition-all"
                    >
                      Initialize Diagnostic
                    </button>
                  </motion.div>
                ) : pitchData ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-10"
                  >
                    {/* Brand Header */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-[1px] bg-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 italic">Intelligence Pitch</span>
                      </div>
                      <h3 className="text-4xl md:text-5xl font-serif font-black text-white leading-none tracking-tighter italic">
                        {pitchData.brandName}
                      </h3>
                    </motion.div>

                    {/* The Hook / Pitch */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative p-10 bg-white/5 rounded-[3rem] border border-white/5 italic"
                    >
                      <Sparkles className="absolute -top-4 -right-4 text-amber-500 animate-pulse" size={24} />
                      <p className="text-xl md:text-2xl font-serif text-stone-200 leading-tight">
                        "{pitchData.pitch}"
                      </p>
                    </motion.div>

                    {/* Technical Grid */}
                    <div className="grid grid-cols-1 gap-6">
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                      >
                        <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500">Technical Profile</h5>
                        <div className="flex flex-wrap gap-2">
                          {pitchData.tastingNotes.map((note, i) => (
                            <span 
                              key={i} 
                              className="px-4 py-2 bg-stone-800/50 rounded-full text-[10px] font-bold text-stone-300 border border-white/5"
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      </motion.div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="space-y-4"
                        >
                          <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 flex items-center gap-2">
                            <Star size={10} className="text-amber-500" />
                            Pairing Rationale
                          </h5>
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-xs text-stone-400 leading-relaxed italic font-medium">
                              {pitchData.pairing}
                            </p>
                          </div>
                        </motion.div>

                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="space-y-4"
                        >
                          <h5 className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 flex items-center gap-2">
                            <Info size={10} className="text-amber-500" />
                            Curated Wisdom
                          </h5>
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-xs text-stone-400 leading-relaxed font-medium">
                              {pitchData.trivia}
                            </p>
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="pt-6"
                    >
                      <button 
                        onClick={onClose}
                        className="w-full py-5 bg-amber-500 text-stone-950 font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 active:scale-95"
                      >
                        Commit to Memory
                      </button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-[1px] bg-stone-800 animate-pulse" />
                    <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Awaiting Neural Link</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

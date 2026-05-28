
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import VinetelligenceLogo from '../VinetelligenceLogo';
import { MessageSquare, BookOpen, ChevronRight, X } from 'lucide-react';

interface WelcomeBriefingProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManual: () => void;
  onOpenAIChat: () => void;
  userName?: string;
}

const WelcomeBriefing: React.FC<WelcomeBriefingProps> = ({ 
  isOpen, 
  onClose, 
  onOpenManual, 
  onOpenAIChat,
  userName = "Operator" 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-[#141414] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left Decor Panel */}
            <div className="hidden md:flex w-1/3 bg-stone-950 p-10 flex-col justify-between border-r border-white/5">
                <VinetelligenceLogo withText={false} size="md" />
                <div className="space-y-4">
                  <div className="w-8 h-1 bg-amber-500"></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 leading-relaxed">
                    Neural Synchronization Initiated
                  </p>
                </div>
            </div>

            {/* Content Panel */}
            <div className="flex-1 p-10 md:p-14 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Authentication Success</h4>
                  <h2 className="text-3xl font-serif font-bold text-white tracking-tight">Welcome, {userName}</h2>
                </div>
                <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <p className="text-stone-400 text-lg leading-relaxed italic">
                  "The bridge between technical raw data and hospitality mastery is built on intelligence. To maximize your Node's potential, we recommend a brief neural alignment."
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={onOpenManual}
                    className="w-full group p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-6 hover:bg-white/10 hover:border-amber-500/50 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg leading-none mb-2">Operations Manual</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Master the Vinetelligence Ecosystem</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-amber-500 transition-colors" />
                  </button>

                  <button 
                    onClick={onOpenAIChat}
                    className="w-full group p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-6 hover:bg-white/10 hover:border-emerald-500/50 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg leading-none mb-2">Neural Concierge</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Instant AI Setup & Support</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-stone-700 group-hover:text-emerald-500 transition-colors" />
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={onClose}
                  className="px-10 py-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all active:scale-95"
                >
                  Enter Command Center
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeBriefing;


import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, ShieldCheck, Clock, X } from 'lucide-react';
import VinetelligenceLogo from '../VinetelligenceLogo';

interface DemoExitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (tier: 'essential' | 'growth') => void;
  onLater: () => void;
}

const DemoExitModal: React.FC<DemoExitModalProps> = ({ isOpen, onClose, onProceed, onLater }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-950/90 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-stone-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] relative z-10"
          >
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 text-stone-500 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="p-10 md:p-14 space-y-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <VinetelligenceLogo size="md" withText={false} />
                <h2 className="text-3xl md:text-4xl font-serif font-black text-white italic tracking-tight">
                  Session Synthesized.
                </h2>
                <p className="text-stone-400 text-sm md:text-base leading-relaxed max-w-md">
                  You've experienced the neural edge. Ready to initialize your own establishment node?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Tier */}
                <button 
                  onClick={() => onProceed('essential')}
                  className="group p-6 bg-stone-800/50 border border-white/5 rounded-3xl text-left hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-stone-300 hover:text-white"
                >
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-stone-400 group-hover:bg-emerald-500 group-hover:text-stone-900 transition-all">
                        <Rocket size={20} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest">Essential Tier</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2">Initial Setup</h3>
                  <p className="text-[10px] text-stone-500 leading-normal">
                    Real-time inventory mapping and AI assistance for your first location.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-emerald-500">
                    <span className="text-[10px] font-black uppercase tracking-widest">Get Started Free</span>
                    <i className="fas fa-arrow-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </button>

                {/* Paid Tier */}
                <button 
                  onClick={() => onProceed('growth')}
                  className="group p-6 bg-stone-800/50 border border-white/5 rounded-3xl text-left hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-stone-300 hover:text-white"
                >
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-stone-400 group-hover:bg-indigo-500 group-hover:text-stone-900 transition-all">
                        <ShieldCheck size={20} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest">Growth Tier</span>
                  </div>
                  <h3 className="text-xl font-serif font-bold mb-2">Full Optimization</h3>
                  <p className="text-[10px] text-stone-500 leading-normal">
                    Global multi-unit sync, predictive ordering, and advanced hospitality intelligence.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-indigo-500 font-bold">
                    <span className="text-[10px] font-black uppercase tracking-widest">Elite Onboarding</span>
                    <i className="fas fa-arrow-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </button>
              </div>

              <div className="pt-6 flex justify-center">
                <button 
                  onClick={onLater}
                  className="flex items-center gap-2 text-stone-500 hover:text-white transition-colors group"
                >
                  <Clock size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Maybe Later</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DemoExitModal;

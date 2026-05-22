
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Shield, Scale, Info } from 'lucide-react';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-[#141414] border border-emerald-500/30 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-emerald-500/10 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-black text-white italic tracking-tight">Legal Protocols</h3>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500/60 font-bold">Terms of Service v3.1.0</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-emerald-500/10 rounded-full transition-colors text-emerald-500/60 hover:text-emerald-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 font-serif leading-relaxed text-stone-300">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Shield className="w-4 h-4" />
                  <h4 className="text-xs font-mono font-black uppercase tracking-widest">01. Neural Sovereignty</h4>
                </div>
                <p className="text-sm italic">
                  By initializing a System Node, you acknowledge that all "Palate DNA" and "Fluid Logic" generated within your local instance remains the intellectual property of the Intelligence Services. However, your specific inventory data is cryptographically siloed and accessible only via your authenticated establishment key.
                </p>
              </section>

              <section className="space-y-4 text-sm opacity-80">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Scale className="w-4 h-4" />
                  <h4 className="text-xs font-mono font-black uppercase tracking-widest">02. Operational Limits</h4>
                </div>
                <p>
                  Free "Explorer" instances are provided for demonstration purposes only. Commercial use requires a valid "Operator" or "Visionary" license. We reserve the right to throttle bandwidth to Explorer nodes during high-load periods on the Cloud Registry.
                </p>
              </section>

              <section className="space-y-4 text-sm opacity-80">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Info className="w-4 h-4" />
                  <h4 className="text-xs font-mono font-black uppercase tracking-widest">03. AI Governance</h4>
                </div>
                <p>
                  Neural Coaching is an advisory system. Final operational decisions, especially those involving alcohol safety and legal compliance, remain the sole responsibility of the establishment's human leadership. The platform accepts no liability for "hallucinated" beverage recommendations.
                </p>
              </section>

              <section className="space-y-4 text-sm opacity-80">
                <p>
                  Privacy Policy: We do not sell your guest journey data. We use aggregated, anonymized "Market Intelligence" to improve the global Yield Alpha models for all participants in the intelligence network.
                </p>
              </section>
            </div>

            {/* Footer */}
            <div className="p-8 bg-emerald-500/5 border-t border-emerald-500/10 flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-emerald-500 text-stone-950 rounded-xl font-mono font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
              >
                Acknowledge Protocol
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TermsOfService;

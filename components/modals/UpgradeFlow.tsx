
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Zap, 
  Shield, 
  Cpu, 
  Globe, 
  Check, 
  ArrowRight, 
  Sparkles,
  Search,
  Eye,
  Lock
} from 'lucide-react';

interface UpgradeFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planId: string) => void;
  currentEdition?: string;
}

const PLANS = [
  {
    id: 'operator',
    name: 'The Essential',
    tagline: 'Essential Cloud Intelligence',
    price: '$149',
    description: 'Perfect for established venues shifting to data-driven operations.',
    features: [
      'Cloud Profile Synchronization',
      'Advanced Inventory Tracking',
      'Basic Neural Coach Access',
      'Staff Performance Metrics',
      'Secure Cloud Backups'
    ],
    accent: 'emerald',
    icon: Shield
  },
  {
    id: 'visionary',
    name: 'The Growth',
    tagline: 'Professional AI Suite',
    price: '$499',
    description: 'The industry standard for high-volume, luxury establishments.',
    features: [
      'Predictive Yield Alpha Analytics',
      'Guest Journey "Palate DNA"',
      'Multimodal Vision Audits',
      'Signature Lab Simulator',
      'Global Roster Sync'
    ],
    accent: 'indigo',
    icon: Zap,
    popular: true
  },
  {
    id: 'enterprise',
    name: 'The Enterprise',
    tagline: 'Private Network Silos',
    price: 'Custom',
    description: 'Custom-tuned intelligence for multi-unit groups and hotels.',
    features: [
      'Private Data Silos',
      'Custom Model Tuning',
      'White-label Management Portal',
      'Dedicated Neural Support',
      'API Command Access'
    ],
    accent: 'indigo',
    icon: Globe
  }
];

export const UpgradeFlow: React.FC<UpgradeFlowProps> = ({ isOpen, onClose, onUpgrade, currentEdition }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'confirmation'>('selection');

  const handleSelect = (planId: string) => {
    setSelectedPlan(planId);
    setStep('confirmation');
  };

  const planData = PLANS.find(p => p.id === selectedPlan);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-950/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-5xl bg-[#141414] border border-emerald-500/20 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row min-h-[600px]"
          >
            {/* Left Rail: Benefits/Context */}
            <div className="w-full md:w-80 bg-emerald-500/5 p-10 flex flex-col justify-between border-r border-emerald-500/10">
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-serif font-black text-white italic tracking-tight">Upgrade</h2>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-emerald-500">Neural Efficiency</h3>
                    <p className="text-xs text-stone-400 leading-relaxed font-serif italic text-balance">
                      Unlocking higher tiers establishes a tighter link with Vinetelligence's global intelligence network, significantly reducing inventory drift.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { icon: Sparkles, label: 'No Operational Caps' },
                      { icon: Eye, label: 'Vision Audits' },
                      { icon: Lock, label: 'Encrypted Silos' },
                      { icon: Search, label: 'Deep Analytics' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-stone-500">
                        <item.icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-emerald-500/10">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-stone-900 overflow-hidden">
                        <img 
                          src={`https://picsum.photos/seed/${i + 20}/50/50`} 
                          alt="User"
                          className="w-full h-full object-cover grayscale"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] font-mono font-bold text-stone-500 uppercase tracking-tighter">
                    Joined by <span className="text-emerald-500">1.2k+</span> establishments globally.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Main Interaction Area */}
            <div className="flex-1 p-10 md:p-14 flex flex-col relative overflow-hidden">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full transition-colors text-stone-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                {step === 'selection' ? (
                  <motion.div
                    key="selection"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="mb-10 text-center md:text-left">
                      <h3 className="text-3xl font-serif font-black text-white italic mb-2">Initialize Your Growth Tier</h3>
                      <p className="text-stone-500 text-sm font-serif">Select the operational intensity that fits your establishment's vision.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-stretch">
                      {PLANS.map((plan) => {
                        const isCurrent = currentEdition?.toLowerCase() === plan.id;
                        return (
                          <button
                            key={plan.id}
                            disabled={isCurrent}
                            onClick={() => handleSelect(plan.id)}
                            className={`group relative text-left p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col h-full bg-stone-900/50 backdrop-blur-sm
                              ${plan.popular ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'border-emerald-500/5 hover:border-emerald-500/30'}
                              ${isCurrent ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105'}
                            `}
                          >
                            {plan.popular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-stone-950 px-4 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-widest shadow-lg">
                                Most Popular Protocol
                              </div>
                            )}
                            
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-500
                              ${plan.accent === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-stone-950' : 
                                plan.accent === 'indigo' ? 'bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-stone-950' : 
                                'bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-stone-950'}
                            `}>
                              <plan.icon className="w-6 h-6" />
                            </div>

                            <div className="space-y-1 mb-4">
                              <h4 className="text-lg font-serif font-black text-white italic leading-tight">{plan.name}</h4>
                              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500 group-hover:text-stone-400 transition-colors uppercase">{plan.tagline}</p>
                            </div>

                            <div className="mb-6">
                              <span className="text-2xl font-mono font-black text-white">{plan.price}</span>
                              <span className="text-xs text-stone-500 ml-1">/mo</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                              {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-[10px] text-stone-400 font-serif leading-tight">
                                  <Check className={`w-3 h-3 flex-shrink-0 ${plan.accent === 'emerald' ? 'text-emerald-500' : plan.accent === 'indigo' ? 'text-indigo-500' : 'text-indigo-500'}`} />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>

                            <div className={`mt-auto pt-6 flex items-center justify-between group-hover:translate-x-1 transition-transform
                              ${plan.accent === 'emerald' ? 'text-emerald-500' : plan.accent === 'indigo' ? 'text-indigo-500' : 'text-indigo-500'}
                            `}>
                              <span className="text-[10px] font-mono font-black uppercase tracking-widest">
                                {isCurrent ? 'Active Node' : 'Select Tier'}
                              </span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="confirmation"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12"
                  >
                    <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl
                      ${planData?.accent === 'emerald' ? 'bg-emerald-500 text-stone-950' : 
                        planData?.accent === 'indigo' ? 'bg-indigo-500 text-stone-950' : 
                        'bg-indigo-500 text-stone-950'}
                    `}>
                      {planData?.icon && <planData.icon className="w-10 h-10" />}
                    </div>

                    <h3 className="text-4xl font-serif font-black text-white italic mb-4">Neural Handshake Required</h3>
                    <p className="text-stone-400 text-lg font-serif mb-12 leading-relaxed">
                      You are about to upgrade to the <span className="text-white italic">{planData?.name}</span> tier at {planData?.price}/mo. 
                      This will initialize real-time cloud synchronization and unlock the full breadth of Vinetelligence's predictive engines.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full px-12">
                      <button
                        onClick={() => setStep('selection')}
                        className="flex-1 py-5 bg-stone-900 text-stone-400 rounded-[1.5rem] font-mono font-black text-[10px] uppercase tracking-widest border border-stone-800 hover:bg-stone-800 transition-all active:scale-95"
                      >
                        Change Protocol
                      </button>
                      <button
                        onClick={() => selectedPlan && onUpgrade(selectedPlan)}
                        className={`flex-1 py-5 rounded-[1.5rem] font-mono font-black text-[10px] uppercase tracking-widest text-[#141414] shadow-2xl transition-all hover:scale-105 active:scale-95
                          ${planData?.accent === 'emerald' ? 'bg-emerald-500 shadow-emerald-500/20' : 
                            planData?.accent === 'indigo' ? 'bg-indigo-500 shadow-indigo-500/20' : 
                            'bg-indigo-500 shadow-indigo-500/20'}
                        `}
                      >
                        Confirm Upgrade
                      </button>
                    </div>

                    <p className="mt-8 text-[9px] font-mono text-stone-600 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-3 h-3" />
                      Encrypted Payment Processing via Vinetelligence Vault (Stripe)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeFlow;

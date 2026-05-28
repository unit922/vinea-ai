import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, ShieldCheck, Mail, Building2, User } from 'lucide-react';
import VinetelligenceLogo from './VinetelligenceLogo';

import BlogSection from './BlogSection';

interface LandingProps {
  onLogin: () => void;
}

const ComparisonRow = ({ label, others }: { label: string, others: boolean | string }) => (
  <div className="grid grid-cols-3 py-6 border-b border-stone-100 items-center">
    <div className="text-[10px] font-black uppercase tracking-widest text-stone-500">{label}</div>
    <div className="flex justify-center">
      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
        <Check className="w-3.5 h-3.5" />
      </div>
    </div>
    <div className="flex justify-center">
      {others === true ? (
        <Check className="w-3.5 h-3.5 text-stone-300" />
      ) : others === false ? (
        <X className="w-3.5 h-3.5 text-stone-300" />
      ) : (
        <span className="text-[8px] font-black uppercase text-stone-400">{others}</span>
      )}
    </div>
  </div>
);

const PublicLanding: React.FC<LandingProps> = ({ onLogin }) => {
  const [activeModal, setActiveModal] = useState<'demo' | 'contact' | null>(null);
  const [voted, setVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Sandbox State
  const [sandboxFood, setSandboxFood] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pairingResult, setPairingResult] = useState<{ wine: string, script: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  const pairingData: Record<string, { wine: string, script: string }> = {
    "Mushroom Risotto": {
      wine: "2018 Nebbiolo d'Alba",
      script: "The earthy profile of the mushrooms mirrors the forest floor notes in this Nebbiolo, while the tannins cut through the creamy base."
    },
    "Grilled Ribeye": {
      wine: "2016 Cabernet Sauvignon, Napa",
      script: "Bold black fruit and structured tannins harmonize perfectly with the marbled fat of the ribeye."
    },
    "Oysters Rockefeller": {
      wine: "Chablis Premier Cru",
      script: "The intense minerality and sharp acidity cleanse the palate between these rich, saline bites."
    },
    "Spicy Pad Thai": {
      wine: "Off-dry Riesling Spätlese",
      script: "Low alcohol and natural residual sugar provide a necessary cooling counterpoint to the heat and spice."
    }
  };

  const handleSandboxSelect = (food: string) => {
    setSandboxFood(food);
    setIsAnalyzing(true);
    setPairingResult(null);
    
    // Simulate Neural Processing
    setTimeout(() => {
      setIsAnalyzing(false);
      setPairingResult(pairingData[food]);
    }, 1500);
  };

  const pollOptions = [
    { id: 1, label: "Staff Training Gap", percent: 42, icon: "fa-users-class" },
    { id: 2, label: "Inventory Atrophy", percent: 28, icon: "fa-wine-bottle" },
    { id: 3, label: "Revenue Leakage", percent: 18, icon: "fa-money-bill-trend-up" },
    { id: 4, label: "Guest Consistency", percent: 12, icon: "fa-face-smile" }
  ];

  return (
    <div className="min-h-screen bg-[#FDF8F0] text-[#1E1E1E] font-sans selection:bg-indigo-100">
      {/* Interactive Modal */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-8 right-8 text-stone-400 hover:text-stone-900 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="grid md:grid-cols-5 h-full">
                <div className="md:col-span-2 bg-indigo-600 p-12 text-white space-y-8">
                  <VinetelligenceLogo size="sm" withText={false} className="text-white" />
                  <div className="space-y-4">
                    <h4 className="text-2xl font-serif font-black leading-tight">
                      {activeModal === 'demo' ? 'Experience the Intelligence' : 'Connect with Strategic Support'}
                    </h4>
                    <p className="text-indigo-100 text-xs font-medium opacity-80 leading-relaxed">
                      {activeModal === 'demo' 
                        ? 'Step into the neural operating system for premium establishments and explore our core intelligence.' 
                        : 'Learn how Vinetelligence scales across enterprise-grade properties.'}
                    </p>
                  </div>
                  <div className="space-y-4 pt-10 text-[9px] font-black uppercase tracking-widest opacity-80">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><Check className="w-3" /></div>
                      Instant Demo Access
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><Check className="w-3" /></div>
                      Interactive Sandbox
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 p-12 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        <input type="text" className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all" placeholder="John Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        <input type="email" className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all" placeholder="john@establishment.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Establishment</label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                        <input type="text" className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all" placeholder="Luxury Hotel Group" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {activeModal === 'demo' && (
                      <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest text-center">
                        After submission, you will be instantly directed to our Interactive Demo Lab.
                      </p>
                    )}
                    <button 
                      onClick={() => {
                          window.location.href = '/?mode=demo';
                      }}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                      {activeModal === 'demo' ? 'Enter Interactive Demo' : 'Contact Support'}
                    </button>
                    
                    {activeModal === 'demo' && (
                      <div className="pt-2 text-center text-[10px]">
                        <span className="text-stone-400 font-medium tracking-tight">Prefer a personal walkthrough? </span>
                        <button 
                          onClick={() => setActiveModal('contact')}
                          className="text-indigo-600 font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                        >
                          Schedule 1-to-1 Session
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <VinetelligenceLogo size="sm" withText={false} className="text-indigo-600" />
            <span className="text-xl font-serif font-black tracking-tighter">Vinetelligence</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => document.getElementById('sandbox')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-400 transition-colors flex items-center gap-2">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
               </span>
               Interactive Labs
            </button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Process</button>
            <button id="nav-outcomes" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Outcomes</button>
            <button onClick={() => document.getElementById('guest-experience')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Experience</button>
            <button onClick={() => document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Intel</button>
            <button onClick={() => document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">About</button>
            <button id="nav-advantage" onClick={() => document.getElementById('advantage')?.scrollIntoView({ behavior: 'smooth' })} className="text-[10px] font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">The Advantage</button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveModal('demo')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
            >
              Request Early Access
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-full h-full opacity-5">
           <div className="absolute inset-0 bg-gradient-to-l from-indigo-100 to-transparent"></div>
           <div className="grid grid-cols-6 gap-2 rotate-12 -translate-y-20">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-indigo-900 rounded-2xl"></div>
              ))}
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              <i className="fas fa-sparkles"></i>
              Revenue-First Hospitality AI
            </div>
            <h1 className="text-6xl md:text-7xl font-serif font-black leading-[1.1] tracking-tighter text-stone-900">
              Vinetelligence AI — <br />
              <span className="text-indigo-600 italic">Beverage & Staff Training Hub.</span>
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed max-w-xl font-medium">
              Increase wine sales by 30% and train your team in days, not months. The outcome-driven AI suite designed for luxury hotels and high-volume restaurants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => setActiveModal('demo')}
                className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 flex items-center justify-center gap-3"
              >
                Request Early Access
                <ArrowRight className="w-3.5 h-3.5 text-white/50" />
              </button>
              <div className="flex flex-col justify-center px-4">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
                  <Check className="w-3 h-3" />
                  Live in 24 Hours
                </div>
                <div className="flex items-center gap-2 text-stone-400 font-bold text-[10px] uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" />
                  No Code Integration
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[3rem] bg-stone-900 border-4 border-white shadow-2xl relative overflow-hidden group">
               <img 
                 src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop" 
                 alt="Luxury Wine Cellar"
                 className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent"></div>
               
               <div className="absolute inset-0 flex flex-col justify-end p-12">
                  <div className="relative w-full bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 p-8 shadow-2xl translate-y-6 group-hover:translate-y-0 transition-transform duration-700">
                    <div className="flex items-center justify-between mb-8">
                       <VinetelligenceLogo size="sm" withText={false} className="text-white" />
                       <div className="text-right">
                          <p className="text-[10px] font-black text-white/50 uppercase">Projected Uplift</p>
                          <p className="text-3xl font-serif font-black text-white">+32.4%</p>
                       </div>
                    </div>
                    {/* Simulated Thought Process */}
                    <div className="space-y-3 mb-6 font-mono text-[9px] uppercase tracking-widest">
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="flex items-center gap-2 text-indigo-300"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                        Neural Scan: Beverage Inventory Complete
                      </motion.div>
                      <p className="text-white/60">Optimizing Duck Confit pairings... 42 matching varietals found.</p>
                    </div>

                    <div className="space-y-4">
                       <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: '85%' }}
                            transition={{ duration: 2, delay: 0.5 }}
                            className="h-full bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                             <p className="text-[8px] font-black text-white/40 uppercase mb-1">Automation</p>
                             <p className="text-lg font-serif font-bold text-white">92%</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                             <p className="text-[8px] font-black text-white/40 uppercase mb-1">Efficiency</p>
                             <p className="text-lg font-serif font-bold text-white">30m/day</p>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
               <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl opacity-20"></div>
               <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-400 rounded-full blur-3xl opacity-20"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem/Solution Section - NEW */}
      <section className="py-24 px-6 bg-[#FDF8F0] border-y border-stone-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 p-12 bg-white rounded-[4rem] border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <h4 className="text-3xl font-serif font-black leading-tight text-stone-900">
                    Staff knowledge is inconsistent. <br />
                    <span className="text-red-500 italic underline decoration-red-100 underline-offset-8">Inventory sits. Revenue leaks.</span>
                </h4>
                <p className="text-stone-500 font-medium leading-relaxed">
                    Fragmented training leads to missed upselling opportunities and inconsistent guest experiences. Without synthesized intelligence, your sommelier expertise never leaves the office.
                </p>
                <div className="flex items-center gap-4 pt-4 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                   <div className="text-[10px] font-black uppercase tracking-widest text-stone-400">Common Losses:</div>
                   <div className="flex gap-4">
                      <i className="fas fa-wine-bottle"></i>
                      <i className="fas fa-receipt"></i>
                      <i className="fas fa-users-slash"></i>
                   </div>
                </div>
            </div>
            
            <div className="space-y-8 p-12 bg-indigo-600 rounded-[4rem] shadow-3xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                    <Check className="w-6 h-6" />
                </div>
                <h4 className="text-3xl font-serif font-black leading-tight">
                    Every server, a Sommelier. <br />
                    <span className="text-indigo-200 italic underline decoration-indigo-400/30 underline-offset-8">Real-time revenue uplift.</span>
                </h4>
                <p className="text-indigo-100/80 font-medium leading-relaxed">
                    Vinetelligence puts an AI Sommelier in every staff pocket. Real-time pairing suggestions, dynamic selling scripts, and gamified mastery ensure your beverage program scales instantly.
                </p>
                <div className="pt-4 flex items-center gap-6">
                   <div className="flex -space-x-3">
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-indigo-400 flex items-center justify-center text-[10px] font-black">JS</div>
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-indigo-500 flex items-center justify-center text-[10px] font-black">MK</div>
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 bg-indigo-300 flex items-center justify-center text-[10px] font-black">TR</div>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">+32% Average Staff Upsell</p>
                </div>
            </div>
        </div>
      </section>

      {/* Social Proof - CLEANED */}
      <div className="bg-stone-900 py-10 overflow-hidden relative border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-opacity">
          <div className="flex items-center gap-3 text-white">
            <i className="fas fa-hotel text-2xl"></i>
            <span className="text-sm font-black uppercase tracking-widest text-white/80 shrink-0 italic">Global Hotel Alliance</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <i className="fas fa-wine-glass-alt text-2xl"></i>
            <span className="text-sm font-black uppercase tracking-widest text-white/80 shrink-0 italic">Luxe Dining Network</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <i className="fas fa-crown text-2xl"></i>
            <span className="text-sm font-black uppercase tracking-widest text-white/80 shrink-0 italic">Estates Portfolio</span>
          </div>
        </div>
      </div>

      {/* Stats Matrix - NEW */}
      <section className="py-24 bg-white border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            <div className="space-y-2">
                <p className="text-4xl md:text-5xl font-serif font-black italic text-indigo-600">42ms</p>
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">AI Latency</p>
            </div>
            <div className="space-y-2">
                <p className="text-4xl md:text-5xl font-serif font-black italic text-indigo-600">50k+</p>
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Labels Mapped</p>
            </div>
            <div className="space-y-2">
                <p className="text-4xl md:text-5xl font-serif font-black italic text-indigo-600">14.2%</p>
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Yield Alpha</p>
            </div>
            <div className="space-y-2">
                <p className="text-4xl md:text-5xl font-serif font-black italic text-indigo-600">99.8%</p>
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Uptime Index</p>
            </div>
        </div>
      </section>

      {/* About Us / Vision Section */}
      <section id="about-us" className="py-32 px-6 bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Our Vision</h2>
               <h3 className="text-5xl font-serif font-black leading-tight">Bridging the gap between data & hospitality.</h3>
            </div>
            <div className="space-y-6 text-white/60 leading-relaxed font-medium">
               <p>
                 Vinetelligence was born from a singular realization: Hospitality buyers care about **revenue first**, and AI second. Most tools in the market focus on technology for technology's sake. We focus on the business outcomes that matter.
               </p>
               <p>
                 By synthesizing massive beverage databases with neural staff enablement modules, we ensure your team—from the floor sommelier to the head of operations—has a "Revenue Engine" in their pocket.
               </p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
               <div>
                  <p className="text-3xl font-serif font-black text-indigo-400">0.02s</p>
                  <p className="text-[9px] font-black uppercase tracking-widest mt-2">Staff Response Time</p>
               </div>
               <div>
                  <p className="text-3xl font-serif font-black text-indigo-400">30%+</p>
                  <p className="text-[9px] font-black uppercase tracking-widest mt-2">Avg. Revenue Uplift</p>
               </div>
            </div>
          </div>
          <div className="relative">
             <div className="aspect-square rounded-[3rem] overflow-hidden rotate-3 shadow-2xl border-8 border-white/5">
                <img src="https://images.unsplash.com/photo-1574096079513-d8259312b785?q=80&w=1974&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-60" alt="Sommelier Training" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 to-transparent"></div>
             </div>
             <div className="absolute -top-10 -right-10 bg-indigo-600 p-8 rounded-3xl shadow-3xl text-sm font-black uppercase italic tracking-widest -rotate-6">
                Outcome-Driven <br /> Intelligence
             </div>
          </div>
        </div>
      </section>

      {/* Detailed System Description */}
      <section id="features" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-xl space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">The Architecture</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-black text-stone-900 leading-tight">
                An Ecosystem <br /> for High-Yield Beverage.
              </h3>
            </div>
            <p className="text-stone-500 text-sm max-w-sm font-medium leading-relaxed">
              Our system solves the "Staff Knowledge Gap" by mapping real-time inventory to guest palates through three core neural nodes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
             <div className="p-12 rounded-[3.5rem] bg-stone-50 border border-stone-100 space-y-6 group hover:bg-stone-900 hover:text-white transition-all">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                   <i className="fas fa-brain text-2xl"></i>
                </div>
                <h4 className="text-2xl font-serif font-black">Staff Hub</h4>
                <p className="text-stone-500 text-sm leading-relaxed group-hover:text-stone-400">Gamified training & real-time "Pocket Sommelier" tools. Turn every staff member into your best salesperson in days.</p>
                <div className="pt-6">
                   <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-600 group-hover:text-indigo-400">
                      <Check className="w-3" /> Quiz-Based Progress
                   </div>
                </div>
             </div>
             <div className="p-12 rounded-[3.5rem] bg-stone-50 border border-stone-100 space-y-6 group hover:bg-stone-900 hover:text-white transition-all">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                   <i className="fas fa-chart-line text-2xl"></i>
                </div>
                <h4 className="text-2xl font-serif font-black">Yield Alpha</h4>
                <p className="text-stone-500 text-sm leading-relaxed group-hover:text-stone-400">Sales analytics that track which wines sell best with which dishes. Predictive inventory prevents "Inventory Leaks".</p>
                <div className="pt-6">
                   <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-600 group-hover:text-indigo-400">
                      <Check className="w-3" /> Real-time POS Sync
                   </div>
                </div>
             </div>
             <div className="p-12 rounded-[3.5rem] bg-stone-50 border border-stone-100 space-y-6 group hover:bg-stone-900 hover:text-white transition-all">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                   <i className="fas fa-camera text-2xl"></i>
                </div>
                <h4 className="text-2xl font-serif font-black">Vision Audit</h4>
                <p className="text-stone-500 text-sm leading-relaxed group-hover:text-stone-400">Scan labels and menus with neural accuracy. Instant data entry for 50k+ mapped beverage profiles. Sub-42ms latency ensures your operations never slow down.</p>
                <div className="grid grid-cols-2 gap-4 pt-6">
                   <img src="https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=2070&auto=format&fit=crop" className="rounded-xl aspect-square object-cover border border-stone-200 group-hover:border-white/10" alt="Audit 1" referrerPolicy="no-referrer" />
                   <img src="https://images.unsplash.com/photo-1547595628-c61a29f496f0?q=80&w=1974&auto=format&fit=crop" className="rounded-xl aspect-square object-cover border border-stone-200 group-hover:border-white/10" alt="Audit 2" referrerPolicy="no-referrer" />
                </div>
                <div className="pt-6">
                   <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-600 group-hover:text-indigo-400">
                      <Check className="w-3" /> Sub-42ms Latency
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>
      
      {/* Guest Experience Section - THE HUMAN SIDE */}
      <section id="guest-experience" className="py-32 px-6 bg-[#FDF8F0] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl relative border-8 border-white group">
              <img 
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                alt="Dining Experience"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent"></div>
              
              <div className="absolute bottom-10 left-10 right-10">
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   className="p-8 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20 text-white"
                 >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                        <i className="fas fa-fingerprint"></i>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest">Palate DNA Syncing...</p>
                    </div>
                    <p className="text-xl font-serif font-black italic">"I remember your preference for high-altitude Malbecs from our last encounter in London."</p>
                    <div className="mt-6 flex items-center justify-between">
                       <span className="text-[8px] font-black uppercase tracking-[3px] opacity-60">Neural Persona Match</span>
                       <span className="text-indigo-400 font-bold">98.2%</span>
                    </div>
                 </motion.div>
              </div>
            </div>
            
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-400 rounded-full blur-[100px] opacity-20"></div>
          </div>

          <div className="space-y-12 order-1 lg:order-2">
            <div className="space-y-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600">The Guest Symphony</h2>
              <h3 className="text-5xl md:text-6xl font-serif font-black text-stone-900 leading-[1.1] tracking-tighter">
                Hospitality, <br /> 
                <span className="text-indigo-600 italic">Synthesized.</span>
              </h3>
            </div>

            <div className="space-y-8">
               <div className="flex gap-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <i className="fas fa-heart text-lg"></i>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-serif font-black">Palate DNA Recognition</h4>
                    <p className="text-stone-500 text-sm font-medium leading-relaxed">Cross-property intelligence remembers every preference, allergy, and 'Palate Passion'. Give regular guests a reason to never dine anywhere else.</p>
                  </div>
               </div>
               
               <div className="flex gap-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <i className="fas fa-wand-magic-sparkles text-lg"></i>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-serif font-black">Invisible Intelligence</h4>
                    <p className="text-stone-500 text-sm font-medium leading-relaxed">Staff are alerted to a guest's favorite bottle as they cross the threshold. Service transitions from reactive to predictive in a single heartbeat.</p>
                  </div>
               </div>

               <div className="flex gap-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <i className="fas fa-book-open text-lg"></i>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-serif font-black">The Storyteller Node</h4>
                    <p className="text-stone-500 text-sm font-medium leading-relaxed">Equip your team with the historical narrative of every vintage. Turn a simple transaction into an organoleptic journey they won't forget.</p>
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-stone-200 flex items-center gap-12">
               <div className="space-y-1">
                 <p className="text-2xl font-serif font-black text-stone-900">2.4x</p>
                 <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Guest Retention</p>
               </div>
               <div className="space-y-1">
                 <p className="text-2xl font-serif font-black text-stone-900">18.5%</p>
                 <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Sentiment Lift</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Labs - THE INTERACTIVE TASTE */}
      <section id="sandbox" className="py-32 px-6 bg-stone-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto space-y-20 relative z-10">
          <div className="text-center space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400">Interactive Labs</h2>
            <h3 className="text-5xl font-serif font-black text-white italic">Experience the Intelligence.</h3>
            <p className="text-white/40 font-medium max-w-xl mx-auto">Interact with live modules of our core engine. No account required—just pure beverage intelligence.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
             {/* Pairing Lab Widget */}
             <div className="p-12 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col justify-between min-h-[500px]">
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="px-4 py-1.5 bg-indigo-500/20 rounded-full border border-indigo-400/30 text-indigo-400 text-[8px] font-black uppercase tracking-widest">Live: Module 1.04_Pairing_Engine</div>
                      <i className="fas fa-wine-glass-alt text-indigo-400"></i>
                   </div>
                   <h4 className="text-2xl font-serif font-black text-white">Interactive Pairing Lab</h4>
                   <p className="text-stone-400 text-sm italic">Simulate a guest request and see how the "Pocket Sommelier" return values help your staff sell.</p>
                   
                   <div className="grid grid-cols-2 gap-4">
                      {Object.keys(pairingData).map((food) => (
                         <button 
                            key={food}
                            onClick={() => {
                              console.log("Analyzing food pairing for:", food);
                              handleSandboxSelect(food);
                            }}
                            className={`p-4 border rounded-2xl text-[10px] text-white font-black uppercase tracking-widest transition-all text-center active:scale-95 ${
                               sandboxFood === food 
                               ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
                               : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20'
                            }`}
                         >
                            {food}
                         </button>
                      ))}
                   </div>

                   <div className="relative min-h-[160px]">
                      <AnimatePresence mode="wait">
                         {isAnalyzing ? (
                            <motion.div 
                               key="analyzing"
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               exit={{ opacity: 0 }}
                               className="absolute inset-0 p-8 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center space-y-4"
                            >
                               <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Neural Sync in Progress...</p>
                            </motion.div>
                         ) : pairingResult ? (
                            <motion.div 
                               key="result"
                               initial={{ opacity: 0, scale: 0.95, y: 10 }}
                               animate={{ opacity: 1, scale: 1, y: 0 }}
                               className="p-8 bg-indigo-600/10 rounded-3xl border border-indigo-500/30 space-y-4"
                            >
                               <div className="space-y-1">
                                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Optimal Alpha Match</p>
                                  <h5 className="text-xl font-serif font-black text-white">{pairingResult.wine}</h5>
                               </div>
                               <p className="text-xs text-white/70 italic leading-relaxed font-medium">
                                  "{pairingResult.script}"
                               </p>
                            </motion.div>
                         ) : (
                           <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Select an item to analyze</p>
                           </div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>
                <div className="pt-10 flex items-center justify-between border-t border-white/5 mt-auto">
                   <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                      {isAnalyzing ? 'Processing Nodes...' : pairingResult ? 'Extraction Complete' : 'Waiting for selection...'}
                   </p>
                   <button onClick={() => setActiveModal('demo')} className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors underline underline-offset-4">Get Full Access</button>
                </div>
             </div>

             {/* Vision Audit Widget */}
             <div className="p-12 rounded-[3.5rem] bg-white/5 border border-white/10 backdrop-blur-xl group overflow-hidden relative min-h-[500px]">
                <div className="relative z-10 space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="px-4 py-1.5 bg-emerald-500/20 rounded-full border border-emerald-400/30 text-emerald-400 text-[8px] font-black uppercase tracking-widest">Live: Module 2.11_Vision_Audit</div>
                      <i className="fas fa-camera text-emerald-400"></i>
                   </div>
                   <h4 className="text-2xl font-serif font-black text-white">Neural Vision Audit</h4>
                   <p className="text-stone-400 text-sm italic">Scan labels with sub-42ms latency. Our neural mesh maps label art to 50k+ global SKUs instantly.</p>
                   
                   <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 group/scan cursor-pointer"
                        onClick={() => {
                          console.log("Vision Scan: Initialized");
                          setIsScanning(true);
                          setScanComplete(false);
                          setTimeout(() => {
                            setIsScanning(false);
                            setScanComplete(true);
                          }, 1200);
                        }}>
                      <img src="https://images.unsplash.com/photo-1547595628-c61a29f496f0?q=80&w=1974&auto=format&fit=crop" 
                           className={`w-full h-full object-cover transition-all duration-1000 ${scanComplete ? 'grayscale-0 brightness-100' : 'grayscale brightness-50 group-hover:brightness-75'}`} 
                           alt="Label Scan" referrerPolicy="no-referrer" />
                      
                      {/* Scanning Line */}
                      {isScanning && (
                        <motion.div 
                          initial={{ top: "-10%" }}
                          animate={{ top: "110%" }}
                          transition={{ duration: 1.2, ease: "linear" }}
                          className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)] z-30"
                        />
                      )}

                      {/* Interactive Trigger */}
                      {!isScanning && !scanComplete && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 group-hover/scan:bg-black/0 transition-colors">
                           <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 animate-pulse">
                              <i className="fas fa-expand text-white"></i>
                           </div>
                           <p className="mt-4 text-[8px] font-black uppercase tracking-[0.3em] text-white">Click to Initiate Scan</p>
                        </div>
                      )}

                      {/* Extraction Data Overlay */}
                      <AnimatePresence>
                        {scanComplete && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-6 left-6 right-6 p-6 bg-black/80 backdrop-blur-md rounded-2xl border border-emerald-500/30"
                          >
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                   <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mb-1">Detected Producer</p>
                                   <p className="text-xs font-serif font-black text-white">Domenico Clerico</p>
                                </div>
                                <div>
                                   <p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest mb-1">Neural ID</p>
                                   <p className="text-xs font-serif font-black text-white">#BAR-9982-X</p>
                                </div>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                   </div>
                </div>
                <div className="pt-10 flex items-center justify-between border-t border-white/5 mt-auto">
                   <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      {isScanning ? 'Extracting SKU Map...' : scanComplete ? 'Scan Verified' : 'Camera Ready'}
                   </p>
                   <button onClick={() => {setScanComplete(false); setIsScanning(false);}} className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Reset Cam</button>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Yield Alpha Estimator */}
      <section className="py-32 px-6 bg-[#FDF8F0]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Yield Alpha Estimator</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-black text-stone-900 leading-tight">
              Calculate your <br /> <span className="italic">Revenue Recovery.</span>
            </h3>
            <p className="text-stone-500 font-medium leading-relaxed max-w-sm">
              Our neural models typically unlock an additional 12% to 32% in beverage margins. See the impact on your monthly bottom line.
            </p>
            
            <div className="space-y-10 pt-8">
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-400">
                  <span>Monthly Beverage Revenue</span>
                  <span className="text-stone-900">$100,000 / mo</span>
                </div>
                <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-indigo-600"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-white rounded-3xl border border-stone-100 shadow-sm">
                  <p className="text-[8px] font-black uppercase tracking-widest text-indigo-600 mb-2">Projected Monthly Gain</p>
                  <p className="text-3xl font-serif font-black text-stone-900">+$14,200</p>
                </div>
                <div className="p-8 bg-white rounded-3xl border border-stone-100 shadow-sm">
                  <p className="text-[8px] font-black uppercase tracking-widest text-indigo-600 mb-2">Efficiency Savings</p>
                  <p className="text-3xl font-serif font-black text-stone-900">22h / mo</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="aspect-video rounded-[3rem] bg-stone-900 shadow-3xl overflow-hidden relative group">
               <img src="https://images.unsplash.com/photo-1551218808-94e220e03102?q=80&w=2074&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700" alt="Dashboard Preview" referrerPolicy="no-referrer" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform">
                     <i className="fas fa-play"></i>
                  </div>
               </div>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 text-center mt-6 italic">Visual Intelligence Dashboard: V3.14 Alpha Build</p>
          </div>
        </div>
      </section>

      {/* Integration Core - NEW */}
      <section className="py-24 bg-white border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Neural Core</h2>
             <h3 className="text-3xl font-serif font-black">Syncing the Hospitality Silos.</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
             <div className="flex flex-col items-center gap-3">
                <i className="fas fa-cash-register text-3xl"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">POS Integration</span>
             </div>
             <div className="flex flex-col items-center gap-3">
                <i className="fas fa-bed text-3xl"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">PMS Cloud</span>
             </div>
             <div className="flex flex-col items-center gap-3">
                <i className="fas fa-database text-3xl"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">CRM Palate Map</span>
             </div>
             <div className="flex flex-col items-center gap-3">
                <i className="fas fa-tablet-screen-button text-3xl"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">In-Room Hub</span>
             </div>
             <div className="flex flex-col items-center gap-3">
                <i className="fas fa-message text-3xl"></i>
                <span className="text-[9px] font-black uppercase tracking-widest">SMS Concierge</span>
             </div>
          </div>
        </div>
      </section>

      {/* Advantage Section - THE UNIQUE EDGE */}
      <section id="advantage" className="py-32 px-6 bg-[#FDF8F0] overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div className="space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">The Vinetelligence Choice</h2>
                <h3 className="text-4xl md:text-5xl font-serif font-black text-stone-900 leading-[1.1] tracking-tighter">
                  Stop buying tools. <br /> 
                  <span className="italic underline decoration-indigo-600/30 underline-offset-8">Start buying revenue.</span>
                </h3>
              </div>
              <p className="text-stone-500 text-lg leading-relaxed font-medium">
                Hospitality buyers care about **revenue first**. While others offer "Voice AI" (missed calls) or "Messaging Bots" (website traffic), Vinetelligence offers end-to-end beverage intelligence.
              </p>
              
              {/* Defense Highlight */}
              <div className="p-8 bg-white rounded-[2.5rem] border border-stone-100 shadow-sm space-y-4">
                <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Competitive Defense</p>
                <p className="text-stone-700 text-sm font-medium leading-relaxed italic">
                  "Generic bots communicate technology. Vinetelligence communicates outcomes."
                </p>
              </div>

              <div className="bg-stone-950 p-10 md:p-14 rounded-[3.5rem] shadow-3xl text-white relative">
                <div className="absolute top-0 right-0 p-8">
                   <div className="px-4 py-1.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-[8px] font-black uppercase tracking-widest">Defense Grid</div>
                </div>
                <div className="grid grid-cols-3 mb-10 pb-6 border-b border-white/5">
                  <div className="text-[10px] font-black uppercase text-white/30">Strategic Pillar</div>
                  <div className="text-[10px] font-black uppercase text-indigo-400 text-center">Vinetelligence</div>
                  <div className="text-[10px] font-black uppercase text-white/30 text-center">Competitors</div>
                </div>
                <ComparisonRow label="Revenue Narrative" others="Tool-First" />
                <ComparisonRow label="Staff Training Hub" others={false} />
                <ComparisonRow label="Predictive Upselling" others="Passive" />
                <ComparisonRow label="Unified CRM Sync" others={true} />
                <ComparisonRow label="Go-Live in 24h" others="Weeks" />
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl relative group border-4 border-stone-100">
                <img 
                  src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=2070&auto=format&fit=crop" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 grayscale-[0.2]" 
                  alt="Staff Engagement"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-stone-900/10"></div>
              </div>
              {/* Floating Stat */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -right-10 bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-3xl space-y-1"
              >
                 <p className="text-[8px] font-black uppercase tracking-widest text-indigo-200">Revenue Uplift</p>
                 <p className="text-4xl font-serif font-black">+32%</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Step Flow */}
      <section id="how-it-works" className="py-32 bg-stone-900 text-white px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="max-w-2xl">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6">Execution Path</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-black leading-tight">
              Go live in 24 hours. <br />
              Zero technical debt.
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-16 relative">
            <div className="hidden lg:block absolute top-[1.5rem] left-[20%] right-[20%] h-px bg-white/10"></div>
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-serif font-black text-xl mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all transform duration-300">01</div>
              <h4 className="text-xl font-serif font-black mb-4">Connect Systems</h4>
              <p className="text-white/50 text-sm leading-relaxed font-medium">
                Sync your existing PMS, booking engines, and menu databases. Vinetelligence integrates seamlessly without infrastructure overhaul.
              </p>
            </div>
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-serif font-black text-xl mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all transform duration-300">02</div>
              <h4 className="text-xl font-serif font-black mb-4">Train Your AI</h4>
              <p className="text-white/50 text-sm leading-relaxed font-medium">
                Upload your brand guidelines and property knowledge. Our engine learns your unique voice and inventory nuances in minutes.
              </p>
            </div>
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-serif font-black text-xl mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all transform duration-300">03</div>
              <h4 className="text-xl font-serif font-black mb-4">Launch & Scale</h4>
              <p className="text-white/50 text-sm leading-relaxed font-medium">
                Deploy across your website, SMS, and property tablets. Monitor real-time performance through the Operator Command Center.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Gallery */}
      <section id="case-studies" className="py-32 px-6 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="max-w-xl space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Cognitive Hospitality</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-black text-stone-900 leading-tight">
                Neural accuracy meets <br /> five-star service.
              </h3>
            </div>
            <div className="space-y-4">
               <p className="text-stone-500 text-sm max-w-sm font-medium italic">
                 Vinetelligence bridges the gap between massive beverage data and the human connection at the table.
               </p>
               <button 
                  onClick={() => setActiveModal('contact')}
                  className="px-6 py-2 border-2 border-indigo-600 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-md"
               >
                  New Case Studies Pending — Notify Me
               </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 h-[600px]">
             <div className="rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
                <img src="https://images.unsplash.com/photo-1506377247377-2a5b3b0ca7ef?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Sommelier Client Study" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-stone-950/60 group-hover:bg-stone-950/20 transition-all flex flex-col justify-end p-8">
                   <p className="text-indigo-400 text-[8px] font-black uppercase tracking-[0.2em] mb-2 text-center bg-black/40 py-1 rounded-full">New Study (uploading...)</p>
                   <p className="text-white text-[10px] font-black uppercase tracking-widest">Global Hotel Group Sync</p>
                </div>
             </div>
             <div className="lg:col-span-2 rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
                <img src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Sommelier Intelligence" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-stone-950/40 group-hover:bg-stone-950/10 transition-all flex items-end p-10">
                   <p className="text-white text-[10px] font-black uppercase tracking-widest text-lg font-serif">The Ritz Carlton Protocol</p>
                </div>
             </div>
             <div className="rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
                <img src="https://images.unsplash.com/photo-1582719478250-c89cae4df85b?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Boutique Study" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-stone-950/60 group-hover:bg-stone-950/20 transition-all flex flex-col justify-end p-8">
                   <p className="text-indigo-400 text-[8px] font-black uppercase tracking-[0.2em] mb-2 text-center bg-black/40 py-1 rounded-full">New Study (uploading...)</p>
                   <p className="text-white text-[10px] font-black uppercase tracking-widest">Boutique Estate Scaling</p>
                </div>
             </div>
             <div className="hidden lg:block rounded-[2.5rem] overflow-hidden relative group shadow-2xl">
                <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="Luxury Service" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-stone-950/40 group-hover:bg-stone-950/10 transition-all flex items-end p-10">
                   <p className="text-white text-[10px] font-black uppercase tracking-widest font-mono">Service Synthesis</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Community Intelligence Poll - NEW */}
      <section className="py-32 px-6 bg-[#1A1A1A] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Community Intelligence</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-black text-white italic">What's your primary bottleneck?</h3>
            <p className="text-white/50 font-medium max-w-lg mx-auto">Join the hospitality consensus. Our neural aggregate maps real-world challenges to drive system updates.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {!voted ? (
              pollOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedOption(opt.id);
                    setTimeout(() => setVoted(true), 600);
                  }}
                  className={`p-8 rounded-[2.5rem] border transition-all text-left flex items-center gap-6 group relative overflow-hidden ${
                    selectedOption === opt.id 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${
                    selectedOption === opt.id ? 'bg-white/20 text-white' : 'bg-white/10 text-indigo-400 group-hover:text-white'
                  }`}>
                    <i className={`fas ${opt.icon}`}></i>
                  </div>
                  <span className="text-lg font-serif font-black">{opt.label}</span>
                  {selectedOption === opt.id && (
                    <motion.div 
                      layoutId="poll-check"
                      className="absolute right-8"
                    >
                      <Check className="w-6 h-6 text-white" />
                    </motion.div>
                  )}
                </button>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full bg-white/5 border border-white/10 rounded-[3.5rem] p-12 space-y-10"
              >
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Consensus Result</p>
                    <h4 className="text-3xl font-serif font-black text-white">The Neural Map</h4>
                  </div>
                  <button 
                    onClick={() => {setVoted(false); setSelectedOption(null);}}
                    className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
                  >
                    Reset & Recalculate
                  </button>
                </div>
                
                <div className="space-y-8">
                  {pollOptions.map((opt) => (
                    <div key={opt.id} className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className={selectedOption === opt.id ? 'text-indigo-400' : 'text-white/60'}>
                          {opt.label} {selectedOption === opt.id && '(Your Vote)'}
                        </span>
                        <span className="text-white">{opt.percent}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${opt.percent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${selectedOption === opt.id ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/20'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <p className="text-xs text-white/40 italic font-medium">3,142 Strategic decisions mapped via Vinetelligence Hub</p>
                  <button 
                    onClick={() => setActiveModal('demo')}
                    className="px-8 py-3 bg-white text-stone-950 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all active:scale-95"
                  >
                    Discuss My Bottlenecks
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* System Protocols - PRICING TIERS */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">System Protocols</h2>
            <h3 className="text-4xl md:text-5xl font-serif font-black text-stone-900 leading-tight">Intelligence Tier Architectures</h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* The Explorer */}
            <div className="bg-[#FDF8F0] p-10 rounded-[3rem] border border-stone-100 flex flex-col justify-between hover:shadow-xl transition-all group">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i className="fas fa-vial"></i>
                </div>
                <h5 className="text-xl font-serif font-black">The Explorer</h5>
                <p className="text-xs text-stone-500 leading-relaxed italic">Localized session storage. Designed for rapid operational prototyping and staff training nodes.</p>
                <ul className="space-y-4 pt-4">
                  <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <Check className="w-3 h-3 text-indigo-600" /> Local Sandbox
                  </li>
                  <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <Check className="w-3 h-3 text-indigo-600" /> Academy Access
                  </li>
                </ul>
              </div>
              <div className="pt-10 space-y-6">
                <p className="text-4xl font-serif font-black italic">Free</p>
                <button 
                  onClick={() => setActiveModal('demo')}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg active:scale-95"
                >
                  Start Prototyping
                </button>
              </div>
            </div>

            {/* The Operator */}
            <div className="bg-[#FDF8F0] p-10 rounded-[3rem] border border-stone-100 flex flex-col justify-between hover:shadow-xl transition-all group">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i className="fas fa-seedling"></i>
                </div>
                <h5 className="text-xl font-serif font-black">The Operator</h5>
                <p className="text-xs text-stone-500 leading-relaxed italic">Cloud-synched profiles with managed backups. Resilient for professional hospitality units.</p>
                <ul className="space-y-4 pt-4">
                  <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <Check className="w-3 h-3 text-indigo-600" /> Cloud Profiles
                  </li>
                  <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <Check className="w-3 h-3 text-indigo-600" /> POS Interface
                  </li>
                </ul>
              </div>
              <div className="pt-10 space-y-6">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-serif font-black italic">$149</p>
                  <p className="text-[10px] font-black uppercase text-stone-400">/mo</p>
                </div>
                <button 
                  onClick={() => setActiveModal('demo')}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg active:scale-95"
                >
                  Deploy Node
                </button>
              </div>
            </div>

            {/* The Visionary */}
            <div className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col justify-between shadow-2xl scale-105 relative z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-indigo-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Recommended</div>
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                  <i className="fas fa-crown"></i>
                </div>
                <h5 className="text-xl font-serif font-black">The Visionary</h5>
                <p className="text-xs text-indigo-100 leading-relaxed font-medium italic opacity-80">The complete predictive suite. Multimodal Vision audits and yield analytics enabled.</p>
                <ul className="space-y-4 pt-4">
                  <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-100">
                    <Check className="w-3 h-3 text-white" /> Predictive Alpha
                  </li>
                  <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-100">
                    <Check className="w-3 h-3 text-white" /> Vision Audits
                  </li>
                </ul>
              </div>
              <div className="pt-10 space-y-6">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-serif font-black italic">$499</p>
                  <p className="text-[10px] font-black uppercase text-indigo-200">/mo</p>
                </div>
                <button 
                  onClick={() => setActiveModal('demo')}
                  className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-all shadow-xl active:scale-95"
                >
                  Scale Intelligence
                </button>
              </div>
            </div>

            {/* The Architect */}
            <div className="bg-[#FDF8F0] p-10 rounded-[3rem] border border-stone-100 flex flex-col justify-between hover:shadow-xl transition-all group">
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i className="fas fa-building-shield"></i>
                </div>
                <h5 className="text-xl font-serif font-black">The Architect</h5>
                <p className="text-xs text-stone-500 leading-relaxed italic">Enterprise-grade security. Dedicated silos, custom model tuning, and multi-unit command.</p>
                <ul className="space-y-4 pt-4">
                  <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <Check className="w-3 h-3 text-indigo-600" /> Private Silos
                  </li>
                  <li className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    <Check className="w-3 h-3 text-indigo-600" /> Global Sync
                  </li>
                </ul>
              </div>
              <div className="pt-10 space-y-6">
                <p className="text-4xl font-serif font-black italic">Custom</p>
                <button 
                  onClick={() => setActiveModal('contact')}
                  className="w-full py-4 border-2 border-stone-900 text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all active:scale-95"
                >
                  Contact HQ
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BlogSection onAction={() => setActiveModal('demo')} />

      {/* CTA Section */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto rounded-[4rem] bg-indigo-600 p-12 md:p-32 text-center text-white relative overflow-hidden shadow-3xl">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 opacity-10"></div>
           <div className="relative z-10 space-y-12">
              <h3 className="text-5xl md:text-7xl font-serif font-black leading-tight tracking-tighter">
                Ready to optimize <br /> your beverage legacy?
              </h3>
              <p className="text-xl text-indigo-100 max-w-2xl mx-auto font-medium opacity-80">
                Join the luxury hospitality leaders who have already automated their guest experience and staff mastery. No risk, just intelligence.
              </p>
              <div className="flex flex-col items-center gap-10 pt-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <button 
                    onClick={() => setActiveModal('demo')}
                    className="px-14 py-7 bg-white text-indigo-600 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-stone-50 transition-all shadow-3xl active:scale-95 flex items-center gap-4"
                  >
                    Start Free Demo
                    <ArrowRight className="w-4 h-4 text-indigo-600/40" />
                  </button>
                  <button 
                    onClick={() => setActiveModal('contact')}
                    className="px-14 py-7 bg-indigo-900/30 text-white border-2 border-white/20 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-indigo-900/50 transition-all active:scale-95"
                  >
                    Contact Sales
                  </button>
                </div>
                <div className="flex items-center gap-10 text-[10px] font-black uppercase tracking-widest opacity-40 font-mono">
                   <span className="flex items-center gap-3"><ShieldCheck className="w-3.5" /> ISO-Secure Core</span>
                   <span className="flex items-center gap-3"><Check className="w-3.5" /> Setup in 24h</span>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-6 border-t border-stone-200">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-16">
          <div className="col-span-2 lg:col-span-2 space-y-10">
            <div className="flex items-center gap-2">
              <VinetelligenceLogo size="sm" withText={false} className="text-indigo-600" />
              <span className="text-2xl font-serif font-black tracking-tighter">Vinetelligence</span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed max-w-xs font-medium">
              Revolutionizing hospitality through integrated beverage intelligence and neural staff enablement modules.
            </p>
            <div className="flex gap-10 opacity-30">
               <div className="text-xl"><i className="fab fa-linkedin-in"></i></div>
               <div className="text-xl"><i className="fab fa-instagram"></i></div>
               <div className="text-xl"><i className="fab fa-twitter"></i></div>
            </div>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-10">Intelligence</h5>
            <div className="flex flex-col gap-6 text-sm font-bold text-stone-400">
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-left hover:text-indigo-600 transition-colors">AI Sommelier</button>
              <button onClick={() => document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' })} className="text-left hover:text-indigo-600 transition-colors">Staff Hub</button>
              <button onClick={() => document.getElementById('advantage')?.scrollIntoView({ behavior: 'smooth' })} className="text-left hover:text-indigo-600 transition-colors">Yield Alpha</button>
            </div>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-10">Company</h5>
            <div className="flex flex-col gap-6 text-sm font-bold text-stone-400">
              <button onClick={() => document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' })} className="text-left hover:text-indigo-600 transition-colors">About Us</button>
              <button onClick={() => document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' })} className="text-left hover:text-indigo-600 transition-colors">Client Studies</button>
              <button onClick={() => document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' })} className="text-left hover:text-indigo-600 transition-colors">The Dispatch (Blog)</button>
              <button onClick={() => setActiveModal('contact')} className="text-left hover:text-indigo-600 transition-colors">Strategic Support</button>
            </div>
          </div>
          <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-900 mb-10">System</h5>
            <div className="flex flex-col gap-6 text-sm font-bold text-stone-400">
              <button onClick={onLogin} className="text-left hover:text-indigo-600 transition-colors">Operator Login</button>
              <button onClick={() => setActiveModal('contact')} className="text-left hover:text-indigo-600 transition-colors">API Protocols</button>
              <button onClick={() => setActiveModal('contact')} className="text-left hover:text-indigo-600 transition-colors">Enterprise SLA</button>
              <button onClick={() => document.getElementById('advantage')?.scrollIntoView({ behavior: 'smooth' })} className="text-left hover:text-indigo-600 transition-colors">Competitive Alpha</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-10">
           <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest font-mono">© 2026 Vinetelligence AI Silo. ALL RIGHTS RESERVED.</p>
           <div className="flex gap-10 text-[10px] font-black uppercase text-stone-400 tracking-widest font-mono italic">
              <button onClick={() => setActiveModal('contact')} className="hover:text-indigo-600">PRIVACY PROTOCOL</button>
              <button onClick={() => setActiveModal('contact')} className="hover:text-indigo-600">TERMS OF INTEL</button>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;

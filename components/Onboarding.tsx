
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { supabaseSync, getSupabaseConfig, isLocalEnvironment } from '../services/supabaseClient';

interface OnboardingProps {
  onComplete: (profile: any) => void;
  onSelectAuth: (mode: 'login' | 'signup') => void;
}

const PRIMARY_VENUE_TYPES = [
  { id: 'Restaurant', icon: 'fa-utensils', label: 'Restaurant' },
  { id: 'Bar', icon: 'fa-glass-whiskey', label: 'Bar' },
  { id: 'Cafe', icon: 'fa-coffee', label: 'Cafe' },
  { id: 'Wine Bar', icon: 'fa-wine-bottle', label: 'Wine Bar' },
  { id: 'Cocktail Lounge', icon: 'fa-cocktail', label: 'Lounge' },
  { id: 'Hotel Bar', icon: 'fa-hotel', label: 'Hotel Bar' },
  { id: 'Speakeasy', icon: 'fa-key', label: 'Speakeasy' },
  { id: 'Other', icon: 'fa-plus-circle', label: 'Other' },
];

const EDITIONS = [
  {
    id: 'demo',
    title: 'The Explorer',
    badge: 'Local Demo',
    desc: 'Full intelligence suite using local session persistence. Strictly anonymous, no account required.',
    price: 'Free',
    icon: 'fa-vial',
    features: ['No Sign-Up Required', 'Local Data Storage', 'Full AI Academy', 'Bar Station Control'],
    accent: 'border-stone-500'
  },
  {
    id: 'free',
    title: 'The Operator',
    badge: 'Standard',
    desc: 'Essential AI for small teams with cloud backups and authenticated access.',
    price: '$0/mo',
    icon: 'fa-seedling',
    features: ['Cloud Profiles', 'Basic Inventory AI', 'Standard Coach'],
    accent: 'border-emerald-500/30'
  },
  {
    id: 'paid',
    title: 'The Visionary',
    badge: 'Pro',
    desc: 'Advanced predictive suite for professional venues. Includes multimodal vision audits.',
    price: '$199/mo',
    icon: 'fa-crown',
    features: ['Predictive Analytics', 'Signature Lab', 'Guest Journey AI'],
    accent: 'border-amber-500 shadow-amber-500/20'
  },
  {
    id: 'enterprise',
    title: 'The Architect',
    badge: 'Secure Auth',
    desc: 'Private data silos and enterprise-grade authentication with custom model tuning.',
    price: 'Custom',
    icon: 'fa-building-shield',
    features: ['Managed Supabase Sync', 'Dedicated Auth Layer', 'Admin User Controls'],
    accent: 'border-blue-500 shadow-blue-500/20'
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSelectAuth }) => {
  const [step, setStep] = useState(0); 
  
  // Custom Branding from Environment Variables
  const [branding, setBranding] = useState({
    name: process.env.NEXT_PUBLIC_ESTABLISHMENT_NAME || 'Vinea',
    tagline: process.env.NEXT_PUBLIC_ESTABLISHMENT_TAGLINE || 'Beverage Intelligence Platform',
    heroImage: process.env.NEXT_PUBLIC_HERO_IMAGE || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=2000&q=90',
    description: process.env.NEXT_PUBLIC_ESTABLISHMENT_DESC || "The world's most advanced AI ecosystem for high-end hospitality—mapping palates, predicting supply, and coaching mastery."
  });

  const [profile, setProfile] = useState({
    id: 'demo-id',
    name: branding.name + ' Sandbox',
    type: 'Restaurant',
    customType: '',
    focus: 'Wine & Spirits',
    description: 'Experimental local sandbox environment.',
    edition: 'demo',
    supabaseUrl: '',
    supabaseAnonKey: '',
    aiPersona: 'technical'
  });

  const [isInitializing, setIsInitializing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isProductionMode, setIsProductionMode] = useState(false);
  const [isLocalSiloBypass, setIsLocalSiloBypass] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const devClickCount = useRef(0);

  const [dbStatus, setDbStatus] = useState<{
    loading: boolean, 
    error?: string, 
    success?: boolean, 
    needsRegistration?: boolean,
    alreadyExists?: boolean,
    isEnvManaged?: boolean
  }>({loading: false});

  const isDemoMode = profile.edition === 'demo';

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      }
    };
    checkKey();

    // Determine if we are in "Online Production" or "Local Managed" mode
    const envConfig = getSupabaseConfig();
    if (envConfig && envConfig.source === 'env') {
      setIsProductionMode(true);
      
      // If we are on localhost with .env.local keys, we activate the bypass
      if (isLocalEnvironment()) {
        setIsLocalSiloBypass(true);
      }

      if (!isDemoMode) {
        setProfile(prev => ({
          ...prev,
          supabaseUrl: envConfig.url,
          supabaseAnonKey: envConfig.anonKey
        }));
        setDbStatus(prev => ({ ...prev, isEnvManaged: true }));
      }
    }
  }, [isDemoMode]);

  const handleLogoClick = () => {
    devClickCount.current += 1;
    if (devClickCount.current >= 5) {
      setShowDevTools(true);
      alert("Silo Override: Developer Deployment Tools Enabled.");
    }
  };

  const handleLaunchDemo = () => {
    const demoProfile = {
      ...profile,
      name: branding.name + ' Local Sandbox',
      edition: 'demo'
    };
    onComplete(demoProfile);
  };

  const handleNext = () => {
    localStorage.setItem('vinea_profile', JSON.stringify(profile));
    
    // Logic for jumping steps based on environment
    if (step === 3) {
      if (isDemoMode) {
        setStep(5);
        return;
      }
      // If local .env.local bypass is active, skip Step 4 (Silo Config)
      if (isLocalSiloBypass) {
        setStep(5);
        return;
      }
    }
    
    setStep(s => s + 1);
  };
  
  const handleBack = () => {
    if (step === 5) {
      if (isDemoMode) {
        setStep(3);
        return;
      }
      if (isLocalSiloBypass) {
        setStep(3);
        return;
      }
    }
    setStep(s => s - 1);
  };

  const validateAndProvision = async () => {
    setDbStatus(prev => ({ ...prev, loading: true, error: undefined }));
    localStorage.setItem('vinea_profile', JSON.stringify(profile));
    await new Promise(r => setTimeout(r, 200));

    try {
      const schemaResult = await supabaseSync.verifySchema();
      if (!schemaResult.success) throw new Error(schemaResult.message);

      const existing = await supabaseSync.checkEstablishmentExists(profile.name);
      if (existing) {
        setProfile(prev => ({ ...prev, id: existing.id }));
        setDbStatus(prev => ({ ...prev, loading: false, success: true, alreadyExists: true }));
      } else {
        setDbStatus(prev => ({ ...prev, loading: false, success: true, needsRegistration: true, alreadyExists: false }));
      }
    } catch (e: any) {
      setDbStatus(prev => ({ ...prev, loading: false, error: e.message }));
    }
  };

  const handleRegisterEstablishment = async () => {
    setDbStatus(prev => ({ ...prev, loading: true }));
    try {
      const data = await supabaseSync.registerEstablishment(profile);
      setProfile(prev => ({ ...prev, id: data.id }));
      setDbStatus(prev => ({ ...prev, loading: false, success: true, needsRegistration: false, alreadyExists: false }));
      setTimeout(handleNext, 1000);
    } catch (e: any) {
      setDbStatus(prev => ({ ...prev, loading: false, error: e.message }));
    }
  };

  const startInitialization = async () => {
    setIsInitializing(true);
    setStep(7);
    try {
      const finalType = profile.type === 'Other' ? (profile.customType || 'Unique Establishment') : profile.type;
      await geminiService.getWelcomeBrief({ ...profile, type: finalType });
      setTimeout(() => setIsInitializing(false), 2500);
    } catch (error) {
      console.error(error);
      setIsInitializing(false);
    }
  };

  const handleSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: 
        return (
          <div className="w-full min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-500/30 selection:text-white overflow-x-hidden">
            <nav className="fixed top-0 left-0 right-0 z-[120] px-8 py-6 flex justify-between items-center bg-gradient-to-b from-stone-950 to-transparent backdrop-blur-sm lg:backdrop-blur-none">
              <div className="flex items-center gap-2 cursor-default select-none" onClick={handleLogoClick}>
                <span className="font-serif text-3xl font-black text-amber-500 tracking-tighter italic uppercase">{branding.name}</span>
              </div>
              <div className="flex gap-4">
                <button onClick={() => onSelectAuth('login')} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-white transition-colors">Sign In</button>
                {(!isProductionMode || showDevTools) && (
                  <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-white text-stone-950 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl">Deploy System</button>
                )}
              </div>
            </nav>

            {/* Hero Section */}
            <section className="relative h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
               <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-stone-950/70 z-10 backdrop-blur-[1px]"></div>
                  <img src={branding.heroImage} className="w-full h-full object-cover" alt="Venue Experience" />
               </div>
               
               <div className="relative z-20 max-w-5xl space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                  <span className="text-amber-500 text-[11px] font-black uppercase tracking-[0.8em] inline-block mb-4">{branding.tagline}</span>
                  <h1 className="text-6xl md:text-9xl font-serif font-black italic tracking-tighter text-white leading-tight">
                    Hospitality,<br/><span className="text-stone-400">Synthesized.</span>
                  </h1>
                  <p className="text-lg md:text-2xl text-stone-300 max-w-2xl mx-auto font-medium italic leading-relaxed opacity-80">
                    "{branding.description}"
                  </p>
                  <div className="flex flex-col md:flex-row gap-6 justify-center pt-8">
                     {isProductionMode ? (
                       <>
                         <button 
                          onClick={() => window.location.href = `${window.location.origin}${window.location.pathname}?view=book`}
                          className="px-14 py-6 bg-amber-500 text-stone-950 rounded-full font-black text-xs uppercase tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_40px_rgba(245,158,11,0.3)] active:scale-95"
                         >
                           Guest Experience
                         </button>
                         <button 
                          onClick={() => onSelectAuth('login')}
                          className="px-14 py-6 border border-white/20 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] hover:bg-white/10 transition-all active:scale-95"
                         >
                           Staff Portal
                         </button>
                       </>
                     ) : (
                       <>
                         <button onClick={handleLaunchDemo} className="px-14 py-6 bg-amber-500 text-stone-950 rounded-full font-black text-xs uppercase tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_40px_rgba(245,158,11,0.3)] active:scale-95">Enter Sandbox</button>
                         <button onClick={() => setStep(1)} className="px-14 py-6 border border-white/20 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] hover:bg-white/10 transition-all active:scale-95">Architect Facility</button>
                       </>
                     )}
                  </div>
               </div>

               <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 animate-bounce text-stone-500">
                  <i className="fas fa-chevron-down text-xl"></i>
               </div>
            </section>

            {/* Strategic Offerings Section */}
            <section className="py-40 px-8 max-w-7xl mx-auto space-y-40">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                  <div className="space-y-10 order-2 lg:order-1">
                     <div className="space-y-4">
                        <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em]">Knowledge Repository</span>
                        <h2 className="text-6xl font-serif font-black italic text-white tracking-tighter leading-none">The Scholar Node</h2>
                     </div>
                     <p className="text-stone-400 text-xl leading-relaxed font-medium italic">
                        Access a real-time, high-fidelity knowledge base covering global wine regions, spirit distillation techniques, and mixology origins. Vinea bridges technical scholarship with daily floor operations.
                     </p>
                     <ul className="space-y-6">
                        {[
                          'Hyper-accurate regional discovery with 50,000+ labels',
                          'Terroir-based pairing logic for complex menu structures',
                          'Role-specific training flash drills for continuous upskilling'
                        ].map((item, i) => (
                          <li key={i} className="flex items-center gap-5 text-stone-300 text-sm font-bold uppercase tracking-widest">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]"></div>
                             {item}
                          </li>
                        ))}
                     </ul>
                  </div>
                  <div className="relative order-1 lg:order-2 rounded-[4rem] overflow-hidden shadow-2xl border border-white/10 aspect-square group">
                     <img src="https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s]" alt="AI Visualization" />
                     <div className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]"></div>
                     <div className="absolute bottom-10 left-10 p-6 bg-black/60 backdrop-blur-md rounded-3xl border border-white/10">
                        <p className="text-[10px] font-black uppercase text-amber-500">Retrieving archives...</p>
                        <p className="text-2xl font-serif font-black italic">Cognitive Sommelier Active</p>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                  <div className="relative rounded-[4rem] overflow-hidden shadow-2xl border border-white/10 aspect-square group">
                     <img src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[4s]" alt="Inventory Logistics" />
                     <div className="absolute inset-0 bg-stone-900/10"></div>
                  </div>
                  <div className="space-y-10">
                     <div className="space-y-4">
                        <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em]">Yield Optimization</span>
                        <h2 className="text-6xl font-serif font-black italic text-white tracking-tighter leading-none">Yield Alpha</h2>
                     </div>
                     <p className="text-stone-400 text-xl leading-relaxed font-medium italic">
                        Stop reacting to depletion. Vinea's AI Demand Forecast analyzes regional trends and historical consumption velocity to optimize your inventory ledger automatically.
                     </p>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-8 bg-white/5 border border-white/5 rounded-3xl space-y-2">
                           <p className="text-4xl font-serif font-black text-amber-500">22%</p>
                           <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Shrinkage Detection</p>
                           <p className="text-[9px] text-stone-600 font-medium italic">Via Multimodal Vision Audits</p>
                        </div>
                        <div className="p-8 bg-white/5 border border-white/5 rounded-3xl space-y-2">
                           <p className="text-4xl font-serif font-black text-amber-500">14.2%</p>
                           <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Profit Increase</p>
                           <p className="text-[9px] text-stone-600 font-medium italic">Through Dynamic Pricing</p>
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            {/* Operational Command Section */}
            <section className="py-40 bg-stone-100 text-stone-900 overflow-hidden border-y border-stone-200">
               <div className="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row gap-24 items-center">
                  <div className="lg:w-1/2 space-y-10">
                     <h2 className="text-7xl font-serif font-black italic tracking-tighter leading-none">Operational Speed.</h2>
                     <p className="text-stone-600 text-xl leading-relaxed italic font-medium">
                        "The {branding.name} interface doesn't just display data—it simplifies complex decisions during your busiest rounds. Precision and scholarship, delivered in milliseconds."
                     </p>
                     <div className="flex gap-6 items-center">
                        <div className="space-y-1">
                           <p className="text-4xl font-serif font-black italic">42ms</p>
                           <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">AI Latency</p>
                        </div>
                        <div className="w-[1px] h-12 bg-stone-300"></div>
                        <div className="space-y-1">
                           <p className="text-4xl font-serif font-black italic">99.8%</p>
                           <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Uptime Index</p>
                        </div>
                     </div>
                  </div>
                  <div className="lg:w-1/2 relative">
                     <div className="absolute -inset-10 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                     <div className="relative rounded-[5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.2)] border-8 border-white group">
                        <img src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[5s]" alt="High Velocity Ops" />
                     </div>
                  </div>
               </div>
            </section>

            {/* RESTORED: System Protocols (Tiers) Showcase */}
            <section className="py-40 px-8">
               <div className="max-w-6xl mx-auto space-y-20">
                  <div className="text-center space-y-4">
                     <h2 className="text-6xl font-serif font-black italic text-white tracking-tight">System Protocols</h2>
                     <p className="text-stone-500 text-sm uppercase tracking-[0.4em] font-black">Intelligence Tier Architectures</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {EDITIONS.map((ed) => (
                      <div key={ed.id} className="bg-white/5 backdrop-blur-sm p-10 rounded-[3rem] border border-white/5 flex flex-col space-y-10 group hover:border-amber-500/30 transition-all hover:bg-white/[0.07] shadow-2xl">
                         <div className="flex justify-between items-start">
                            <i className={`fas ${ed.icon} text-amber-500 text-3xl`}></i>
                            <span className="text-[8px] font-black uppercase text-stone-500 tracking-[0.3em] bg-white/5 px-2 py-1 rounded">{ed.badge}</span>
                         </div>
                         <div className="space-y-4 flex-1">
                            <h4 className="text-2xl font-serif font-bold text-white italic">{ed.title}</h4>
                            <p className="text-xs text-stone-400 leading-relaxed italic">{ed.desc}</p>
                         </div>
                         <div className="space-y-4">
                            {ed.features.slice(0, 3).map((f, i) => (
                              <div key={i} className="flex items-center gap-3 text-[10px] font-black text-stone-500 group-hover:text-stone-300">
                                 <div className="w-1 h-1 rounded-full bg-stone-800 group-hover:bg-amber-500 transition-colors"></div>
                                 {f}
                              </div>
                            ))}
                         </div>
                         <button 
                          onClick={() => { 
                            if (!isProductionMode || showDevTools) {
                              setProfile({...profile, edition: ed.id}); 
                              setStep(1); 
                            }
                          }} 
                          className="w-full py-5 bg-white/5 rounded-2xl group-hover:bg-amber-500 group-hover:text-stone-900 transition-all font-black text-[10px] uppercase tracking-widest text-stone-400"
                         >
                           {(!isProductionMode || showDevTools) ? 'Initialize Node' : 'Protocol Details'}
                         </button>
                      </div>
                    ))}
                  </div>
               </div>
            </section>

            {/* Premium Footer */}
            <footer className="py-32 px-8 border-t border-white/5 text-center">
               <div className="max-w-md mx-auto space-y-16">
                  <div className="space-y-4">
                    <h1 className="font-serif text-6xl font-black text-amber-500 italic tracking-tighter uppercase">{branding.name}</h1>
                    <p className="text-stone-500 text-sm font-medium leading-relaxed italic">"The integrated intelligence layer for the modern beverage program."</p>
                  </div>
                  <div className="space-y-4 pt-10">
                    <p className="text-stone-800 text-[10px] font-black uppercase tracking-[0.5em]">© 2025 {branding.name} SUITE</p>
                    <p className="text-stone-900 text-[8px] font-black uppercase tracking-[0.2em]">Designed for hospitality mastery.</p>
                  </div>
               </div>
            </footer>
          </div>
        );
      case 1:
        return (
          <div className="text-center space-y-6 md:space-y-10 animate-in fade-in zoom-in duration-700 max-w-2xl px-6">
            <div className="w-20 h-20 bg-amber-500 text-stone-950 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl transform rotate-12 mb-8"><i className="fas fa-hammer text-3xl"></i></div>
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight tracking-tighter italic">Facility Architect</h2>
            <p className="text-stone-400 text-lg md:text-xl font-medium leading-relaxed italic">
              "Initializing establishment architecture. Secure your operational identity and select your intelligence tier."
            </p>
            <div className="pt-10 flex gap-6 justify-center">
              <button onClick={() => setStep(0)} className="px-10 py-5 border border-white/10 text-stone-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all">Back</button>
              <button 
                onClick={handleNext}
                className="group px-14 py-5 bg-white text-stone-900 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all hover:bg-amber-500 hover:text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 flex items-center gap-4"
              >
                Choose Tier
                <i className="fas fa-chevron-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full max-w-6xl space-y-12 animate-in slide-in-from-right-10 duration-500 px-6">
            <div className="text-center space-y-3">
              <h3 className="text-4xl md:text-5xl font-serif font-black text-white italic tracking-tight">Select Protocol Tier</h3>
              <p className="text-stone-500 italic text-sm">Cloud tiers require authentication for resilient data synchronization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {EDITIONS.map((ed) => (
                <button
                  key={ed.id}
                  onClick={() => setProfile({...profile, edition: ed.id})}
                  className={`flex flex-col text-left p-10 rounded-[3rem] border-4 transition-all duration-500 relative group overflow-hidden h-full ${
                    profile.edition === ed.id 
                      ? `${ed.accent} bg-white/5 shadow-2xl ring-4 ring-amber-500/10` 
                      : 'bg-white/0 border-white/5 hover:border-white/20 hover:bg-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${profile.edition === ed.id ? 'bg-amber-500 text-stone-950 shadow-xl' : 'bg-white/5 text-stone-700'}`}>
                      <i className={`fas ${ed.icon} text-2xl`}></i>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${profile.edition === ed.id ? 'bg-amber-500 text-stone-900 border-amber-400' : 'bg-white/5 border-white/10 text-stone-600'}`}>
                      {ed.badge}
                    </span>
                  </div>

                  <h4 className="text-2xl font-serif font-bold text-white mb-3 italic">{ed.title}</h4>
                  <p className="text-xs text-stone-500 leading-relaxed mb-10 h-12 overflow-hidden">{ed.desc}</p>
                  
                  <div className="space-y-4 mb-12 flex-1">
                    {ed.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <i className={`fas fa-check-circle text-xs ${profile.edition === ed.id ? 'text-amber-500' : 'text-stone-800'}`}></i>
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-end justify-between pt-8 border-t border-white/10">
                     <span className="text-3xl font-serif font-black italic text-white">{ed.price}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-10">
              <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Back</button>
              <button 
                onClick={handleNext}
                className="px-14 py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-2xl"
              >
                Proceed to Setup
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="w-full max-w-3xl space-y-10 animate-in slide-in-from-right-10 duration-500 px-6">
            <div className="space-y-2">
              <h3 className="text-5xl font-serif font-bold text-white italic tracking-tighter">Venue Designation</h3>
              <p className="text-stone-500 text-lg italic">"Map your establishment's unique operational identity."</p>
            </div>

            <div className="space-y-10">
              <div className="group">
                <label className="block text-[11px] font-black text-stone-500 uppercase tracking-[0.4em] mb-4 ml-1">Facility Registry Name</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-white/5 border-b-2 border-white/10 py-6 text-4xl text-white font-serif focus:outline-none focus:border-amber-500 transition-all placeholder:text-stone-800 italic"
                  placeholder="The Gilded Shaker..."
                />
              </div>

              <div className="space-y-4">
                <label className="block text-[11px] font-black text-stone-500 uppercase tracking-[0.4em] mb-4 ml-1">Service Core Category</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {PRIMARY_VENUE_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setProfile({...profile, type: type.id})}
                      className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 transition-all gap-4 ${
                        profile.type === type.id 
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xl' 
                          : 'bg-white/5 border-white/5 hover:border-white/10 text-stone-500 hover:text-white'
                      }`}
                    >
                      <i className={`fas ${type.icon} text-3xl`}></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-16">
              <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Back</button>
              <button 
                onClick={handleNext}
                disabled={!profile.name}
                className="px-16 py-5 bg-amber-600 hover:bg-amber-50 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all"
              >
                {isDemoMode ? 'Proceed to Tuning' : 'Proceed to Cloud Tuning'}
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full max-w-2xl space-y-10 animate-in slide-in-from-right-10 duration-500 px-6">
             <div className="space-y-2">
              <h3 className="text-5xl font-serif font-bold text-white italic tracking-tighter">Secure Cloud Silo</h3>
              <p className="text-stone-500 text-lg italic">"Cloud protocols detected: Provisioning data layer."</p>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-blue-600/10 rounded-[2.5rem] border-2 border-blue-500/20 flex gap-6 items-center shadow-inner">
                 <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"><i className="fas fa-network-wired text-xl"></i></div>
                 <p className="text-sm text-blue-100 font-medium italic leading-relaxed">
                   {dbStatus.isEnvManaged 
                     ? "Environment variables detected. Vinea has automatically mapped your production silo endpoints."
                     : "Connect Vinea to your private Supabase instance. This ensures your establishment data is resilient and authenticated."}
                 </p>
              </div>

              {!dbStatus.isEnvManaged && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-3 ml-1">Supabase Endpoint (URL)</label>
                    <input 
                      type="text" 
                      value={profile.supabaseUrl}
                      onChange={e => setProfile({...profile, supabaseUrl: e.target.value})}
                      className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="https://your-project.supabase.co"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 ml-1">Public Anon Node (API Key)</label>
                    <input 
                      type="password" 
                      value={profile.supabaseAnonKey}
                      onChange={e => setProfile({...profile, supabaseAnonKey: e.target.value})}
                      className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-5 text-xs font-mono text-white focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>
              )}

              {dbStatus.error && (
                <div className="p-6 bg-red-500/10 border-2 border-red-500/20 rounded-2xl animate-in shake-in">
                  <p className="text-[10px] font-black uppercase text-red-500 mb-2">Protocol Error</p>
                  <p className="text-sm text-red-300 font-medium italic leading-relaxed">{dbStatus.error}</p>
                </div>
              )}

              {dbStatus.needsRegistration && (
                <div className="p-8 bg-amber-500/10 border-2 border-amber-500/20 rounded-[2.5rem] space-y-6 animate-in slide-in-from-top-4">
                  <p className="text-sm text-amber-200 font-medium italic">
                    Establishment <strong>"{profile.name}"</strong> confirmed as new node in this cloud silo.
                  </p>
                  <button 
                    onClick={handleRegisterEstablishment}
                    disabled={dbStatus.loading}
                    className="w-full py-5 bg-amber-500 text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-900/20"
                  >
                    {dbStatus.loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-server"></i>}
                    Commit Facility Registration
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-10">
              <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Back</button>
              {!dbStatus.needsRegistration && !dbStatus.alreadyExists && (
                <button 
                  onClick={validateAndProvision}
                  disabled={(!profile.supabaseUrl || !profile.supabaseAnonKey) && !dbStatus.isEnvManaged || dbStatus.loading}
                  className="px-16 py-5 bg-blue-600 hover:bg-blue-50 disabled:opacity-50 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-4 transition-all"
                >
                  {dbStatus.loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-network-wired"></i>}
                  Establish Connection
                </button>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="w-full max-w-3xl space-y-12 animate-in slide-in-from-right-10 duration-500 px-6">
             <div className="space-y-2">
              <h3 className="text-5xl font-serif font-black text-white italic tracking-tighter">Program Philosophy</h3>
              <p className="text-stone-500 text-lg italic">
                {isLocalSiloBypass ? "Local bypass active. Configure your persona for this session." : '"Briefly describe your program to tune the AI somatic persona."'}
              </p>
             </div>
             {isLocalSiloBypass && (
               <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-6 rounded-2xl flex items-center gap-4">
                  <i className="fas fa-shield-halved text-emerald-500"></i>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Environment configuration (.env.local) detected. Bypassing cloud silo verification for localized deployment.</p>
               </div>
             )}
             <textarea 
                value={profile.description}
                onChange={e => setProfile({...profile, description: e.target.value})}
                className="w-full h-64 bg-white/5 border-2 border-white/5 rounded-[3rem] px-10 py-10 text-white focus:outline-none focus:border-amber-500 resize-none transition-all placeholder:text-stone-800 leading-relaxed text-lg italic font-medium"
                placeholder="List signature vintages, artisanal focus, or unique service protocols..."
             />
             <div className="flex justify-between pt-10">
              <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Back</button>
              <button onClick={handleNext} className="px-16 py-5 bg-amber-600 hover:bg-amber-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95">Review Deployment</button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="w-full max-w-5xl space-y-12 animate-in slide-in-from-right-10 duration-500 px-6">
            <h3 className="text-5xl font-serif font-black text-white text-center italic tracking-tighter leading-none mb-16">Initializing Intelligence Modules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'The Scholar Node', desc: 'Technical beverage archives.', icon: 'fa-brain' },
                { title: 'The Yield Engine', desc: 'Predictive logistics logic.', icon: 'fa-chart-line' },
                { title: 'Palate Mapping', desc: 'Hyper-personalized service.', icon: 'fa-fingerprint' }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border-2 border-white/5 p-12 rounded-[4rem] text-center space-y-6 group hover:border-amber-500/20 transition-all shadow-2xl">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border-2 border-amber-500/20 shadow-inner group-hover:bg-amber-500 group-hover:text-stone-950 transition-all">
                    <i className={`fas ${item.icon} text-2xl`}></i>
                  </div>
                  <div>
                    <h4 className="font-serif font-black italic text-white text-xl">{item.title}</h4>
                    <p className="text-[10px] text-stone-500 uppercase font-black tracking-[0.3em] mt-2">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col items-center pt-16 space-y-8">
               {(profile.edition === 'paid' || profile.edition === 'enterprise') && !hasApiKey && (
                 <div className="flex flex-col items-center gap-4">
                   <button onClick={handleSelectKey} className="px-12 py-4 bg-stone-900 border-2 border-amber-500 text-amber-500 rounded-2xl text-xs font-black uppercase tracking-[0.3em] animate-pulse shadow-xl shadow-amber-500/10">Authorize Gemini Alpha Key</button>
                   {/* Fix: Added mandatory link to billing documentation as per GenAI guidelines */}
                   <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[9px] text-stone-500 underline uppercase tracking-widest hover:text-amber-500 transition-colors"
                   >
                     Billing Documentation
                   </a>
                 </div>
               )}

               <button 
                onClick={startInitialization}
                disabled={(profile.edition === 'paid' || profile.edition === 'enterprise') && !hasApiKey}
                className="w-full max-w-lg py-7 bg-amber-600 hover:bg-amber-50 disabled:opacity-50 text-white rounded-3xl font-black text-sm uppercase tracking-[0.4em] transition-all shadow-[0_30px_70px_rgba(217,119,6,0.3)] active:scale-95"
              >
                Launch Facility Intelligence
              </button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="text-center space-y-10 max-w-xl mx-auto px-6">
            {isInitializing ? (
              <div className="space-y-12">
                <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-sparkles text-amber-500 text-4xl animate-pulse"></i></div>
                </div>
                <h3 className="text-4xl font-serif text-white italic tracking-tight">Synthesizing System Core...</h3>
              </div>
            ) : (
              <div className="animate-in fade-in duration-1000 space-y-12 flex flex-col items-center">
                <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <i className="fas fa-check-double text-4xl"></i>
                </div>
                <div className="space-y-4">
                  <h3 className="text-5xl md:text-6xl font-serif font-black text-white italic leading-none tracking-tighter">System Ready.</h3>
                  <p className="text-stone-400 text-lg font-medium italic text-center">
                    {isDemoMode 
                      ? "Explorer tier node initialized. Database set to local-first sandbox mode. No cloud account required."
                      : (isLocalSiloBypass 
                          ? "Local Environment Silo identified. Bypassing standard registry for developer deployment."
                          : "Establishment identified. Cloud Silo activated. Secure authentication required for Operator, Visionary, and Architect tiers.")}
                  </p>
                </div>
                <button 
                  onClick={() => onComplete(profile)}
                  className="group px-16 py-7 bg-white text-stone-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-amber-500 hover:text-white transition-all transform active:scale-95 shadow-2xl flex items-center gap-4"
                >
                  {isDemoMode ? 'Launch Dashboard' : 'Finalize & Sign Up'}
                  <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-stone-950 flex flex-col items-center justify-center overflow-x-hidden ${step === 0 ? '' : 'p-4 md:p-12 overflow-y-auto custom-scrollbar'}`}>
      {step !== 0 && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
           <div className="absolute -top-1/4 -right-1/4 w-[100vw] h-[100vw] bg-amber-500/[0.03] rounded-full blur-[150px]"></div>
           <div className="absolute -bottom-1/4 -left-1/4 w-[80vw] h-[80vw] bg-amber-600/[0.03] rounded-full blur-[120px]"></div>
        </div>
      )}
      
      <div className={`relative z-10 w-full flex flex-col items-center ${step === 0 ? 'h-full overflow-y-auto custom-scrollbar' : ''}`}>
        {renderStep()}
      </div>
    </div>
  );
};

export default Onboarding;

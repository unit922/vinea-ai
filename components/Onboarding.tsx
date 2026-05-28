
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { supabaseSync, getSupabaseConfig, isLocalEnvironment } from '../services/supabaseSync';
import { RestaurantProfile } from '../lib/types';
import { getBrandedTerm } from '../utils/branding';
import TermsOfService from './modals/TermsOfService';
import VinetelligenceLogo from './VinetelligenceLogo';

interface OnboardingProps {
  onComplete: (profile: RestaurantProfile) => void;
  onSelectAuth: (mode: 'login' | 'signup') => void;
  currentUserEmail?: string;
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
    features: ['No Sign-Up Required', 'Local Data Storage', 'Bar Station Control'],
    accent: 'border-stone-500'
  },
  {
    id: 'free',
    title: 'The Essential',
    badge: 'Managed Cloud',
    desc: 'Essential AI for small teams with cloud backups. Fully featured 14-day trial.',
    price: '$149/mo',
    subPrice: '14-Day Free Trial',
    icon: 'fa-seedling',
    features: ['14-Day Free Trial', 'Cloud Profiles', 'Basic Inventory AI', 'Standard Coach', 'Staff Monitoring'],
    accent: 'border-indigo-500/30'
  },
  {
    id: 'paid',
    title: 'The Growth',
    badge: 'Pro Suite',
    desc: 'Advanced predictive suite for professional venues. Includes multimodal vision audits.',
    price: '$499/mo',
    subPrice: '14-Day Free Trial',
    icon: 'fa-crown',
    features: ['14-Day Free Trial', 'Predictive Analytics', 'Signature Lab', 'Guest Journey AI', 'Vision Audits'],
    accent: 'border-indigo-500 shadow-indigo-500/20'
  },
  {
    id: 'enterprise',
    title: 'The Enterprise',
    badge: 'Enterprise Silo',
    desc: 'The definitive solution for hospitality groups and multi-venue portfolios. Secured institutional data silos with centralized network control and neural tuning.',
    price: 'Custom',
    icon: 'fa-building-shield',
    features: ['Multi-Venue Central Hub', 'Private Data Silos', 'Global Roster Sync', 'Custom Model Tuning', 'White-label Portal', 'Priority Response Support'],
    accent: 'border-blue-500 shadow-blue-500/20'
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onSelectAuth, currentUserEmail }) => {
  const [step, setStep] = useState(0); 
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const [branding] = useState({
    name: ((import.meta.env?.VITE_ESTABLISHMENT_NAME as string) || 
          (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ESTABLISHMENT_NAME : undefined) || 'Vinetelligence').trim(),
    tagline: ((import.meta.env?.VITE_ESTABLISHMENT_TAGLINE as string) || 
             (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ESTABLISHMENT_TAGLINE : undefined) || 'Beverage Intelligence Platform').trim(),
    heroImage: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=2000&q=90',
    description: (import.meta.env?.VITE_ESTABLISHMENT_DESC as string) || 
                 (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_ESTABLISHMENT_DESC : undefined) || "The world's most advanced AI ecosystem for high-end hospitality—mapping palates, predicting supply, and coaching mastery."
  });

  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Vinetelligence: Failed to parse stored profile in Onboarding", e);
      }
    }
    return {
      id: 'demo-id',
      name: '',
      type: 'Restaurant',
      customType: '',
      focus: 'Wine & Spirits',
      description: 'Experimental local sandbox environment.',
      edition: 'demo',
      supabaseUrl: '',
      supabaseAnonKey: '',
      aiPersona: 'technical',
      ownerEmail: '',
      tier: 'Operator',
      demoMode: 'operator',
      allowGoogleAuth: false,
    };
  });

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const [isInitializing, setIsInitializing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isProductionMode, setIsProductionMode] = useState(false);
  const [isLocalSiloBypass, setIsLocalSiloBypass] = useState(false);
  const [showManualConfig, setShowManualConfig] = useState(false);

  const [dbStatus, setDbStatus] = useState<{
    loading: boolean, 
    statusText?: string,
    error?: string, 
    success?: boolean, 
    needsRegistration?: boolean,
    alreadyExists?: boolean,
    isEnvManaged?: boolean
  }>({loading: false});
  
  const isDemoMode = profile.edition === 'demo';
  const isEnterpriseTier = profile.edition === 'enterprise';

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
      if (stored) {
        try {
          const p = JSON.parse(stored);
          // Only update if critical fields changed to avoid reset loops
          const hasChanged = p.name !== profileRef.current.name || 
                           p.ownerEmail !== profileRef.current.ownerEmail ||
                           p.edition !== profileRef.current.edition ||
                           p.type !== profileRef.current.type;
                           
          if (hasChanged) {
            setProfile(p);
          }

          // Check for AI signals to advance onboarding
          const signal = localStorage.getItem('vinetelligence_ai_signal');
          if (signal === 'advance') {
            setStep(prev => {
              // Only advance from steps where it makes sense (Hero or Data entry steps)
              if (prev === 0 || prev === 1 || prev === 2 || prev === 4) {
                return prev + 1;
              }
              return prev;
            });
            localStorage.removeItem('vinetelligence_ai_signal');
          }
        } catch (err) {
          console.error("Vinetelligence: Sync with storage failed", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const envConfig = getSupabaseConfig();
    console.log("Vinetelligence: Initial environment config check", { hasConfig: !!envConfig, source: envConfig?.source });
    if (envConfig && envConfig.source === 'env') {
      setIsProductionMode(true);
      if (isLocalEnvironment()) {
        setIsLocalSiloBypass(true);
      }

      if (!isDemoMode) {
        console.log("Vinetelligence: Setting isEnvManaged to true based on environment variables");
        setProfile(prev => ({
          ...prev,
          supabaseUrl: envConfig.url,
          supabaseAnonKey: envConfig.anonKey
        }));
        setDbStatus(prev => ({ ...prev, isEnvManaged: true }));
      }
    }
  }, [isDemoMode]);

  const handleLaunchDemo = (mode: 'operator' | 'guest' = 'operator') => {
    const demoProfile = {
      ...profile,
      name: branding.name + ' Local Sandbox',
      edition: 'demo',
      demoMode: mode
    };
    onComplete(demoProfile);
  };

  const handleNext = useCallback(() => {
    const currentProfile = profileRef.current;
    if (step === 5 && currentProfile.supabaseUrl && currentProfile.supabaseAnonKey) {
      supabaseSync.saveSupabaseConfig(currentProfile.supabaseUrl, currentProfile.supabaseAnonKey);
    }
    
    localStorage.setItem('vinetelligence_profile', JSON.stringify(currentProfile));
    localStorage.setItem('vinea_profile', JSON.stringify(currentProfile));
    
    if (step === 2 && (isDemoMode || currentProfile.edition === 'free' || currentProfile.edition === 'paid')) {
      setStep(4); // Skip payment for demo and all professional trials
      return;
    }

    if (step === 4 && isDemoMode) {
      setStep(6); // Skip silo for demo
      return;
    }
    
    setStep(step + 1);
  }, [step, isDemoMode]);
  
  const handleBack = () => {
    if (step === 4 && isDemoMode) {
      setStep(2); // Skip payment for demo
      return;
    }
    if (step === 6 && isDemoMode) {
      setStep(4); // Skip silo for demo
      return;
    }
    setStep(step - 1);
  };

  const autoProvisionAttempted = useRef(false);

  const validateAndProvision = useCallback(async () => {
    console.log("Vinetelligence: validateAndProvision triggered", { isEnvManaged: dbStatus.isEnvManaged, showManualConfig });
    setDbStatus(prev => ({ ...prev, loading: true, error: undefined, statusText: 'Initializing Connection...' }));
    
    // Save config if provided manually
    if (profile.supabaseUrl && profile.supabaseAnonKey) {
      console.log("Vinetelligence: Saving Supabase config to local storage");
      supabaseSync.saveSupabaseConfig(profile.supabaseUrl, profile.supabaseAnonKey);
    }
    
    localStorage.setItem('vinetelligence_profile', JSON.stringify(profile));
    localStorage.setItem('vinea_profile', JSON.stringify(profile));
    await new Promise(r => setTimeout(r, 800));

    try {
      setDbStatus(prev => ({ ...prev, statusText: 'Verifying Cloud Schema...' }));
      const schemaResult = await supabaseSync.verifySchema();
      if (!schemaResult.success) {
        console.error("Vinetelligence: Schema verification failed", schemaResult.message);
        throw new Error(schemaResult.message);
      }

      setDbStatus(prev => ({ ...prev, statusText: 'Synchronizing Node Registry...' }));
      console.log("Vinetelligence: Schema verified, checking establishment existence:", profile.name);
      const existing = await supabaseSync.checkEstablishmentExists(profile.name);
      
      if (existing) {
        console.log("Vinetelligence: Establishment exists", existing);
        setProfile(prev => ({ ...prev, id: existing.id }));
        setDbStatus(prev => ({ 
          ...prev, 
          loading: false, 
          success: true, 
          alreadyExists: true, 
          error: undefined,
          statusText: 'Connection Established' 
        }));
      } else {
        console.log("Vinetelligence: Establishment does not exist, needs registration");
        setDbStatus(prev => ({ 
          ...prev, 
          loading: false, 
          success: true, 
          needsRegistration: true, 
          alreadyExists: false, 
          error: undefined,
          statusText: 'Ready for Registration'
        }));
      }
    } catch (e: unknown) {
      let errorMessage = 'Connection failed';
      if (e instanceof Error) errorMessage = e.message;
      else if (typeof e === 'string') errorMessage = e;
      else if (e && typeof e === 'object' && 'message' in e) errorMessage = String((e as { message: unknown }).message);

      console.error("Vinetelligence: validateAndProvision failed", e);
      setDbStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage,
        statusText: undefined 
      }));
      // DO NOT reset autoProvisionAttempted.current here to prevent infinite loops
    }
  }, [profile, setProfile, dbStatus.isEnvManaged, showManualConfig]);

  const handleRegisterEstablishment = useCallback(async () => {
    setDbStatus(prev => ({ ...prev, loading: true, statusText: 'Registering Facility...' }));
    try {
      const currentProfile = profileRef.current;
      // Ensure config is saved before registering
      if (currentProfile.supabaseUrl && currentProfile.supabaseAnonKey) {
        supabaseSync.saveSupabaseConfig(currentProfile.supabaseUrl, currentProfile.supabaseAnonKey);
      }
      
      console.log("Vinetelligence: Registering establishment:", currentProfile.name);
      
      // Handle Trial for All Cloud Tiers
      const isTrialTier = currentProfile.edition === 'free' || currentProfile.edition === 'paid';
      const trialEndsAt = isTrialTier 
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() 
        : undefined;
      
      const profileToRegister = {
        ...currentProfile,
        subscriptionStatus: isTrialTier ? 'trial' : undefined,
        trialEndsAt: trialEndsAt
      };

      const data = await supabaseSync.registerEstablishment(profileToRegister);
      
      // Add owner to staff roster automatically
      if (currentProfile.ownerEmail) {
        console.log("Vinetelligence: Adding owner to roster:", currentProfile.ownerEmail);
        try {
          await supabaseSync.addToRoster(data.id, currentProfile.ownerEmail, 'Owner');
        } catch (rosterError: unknown) {
          console.warn("Vinetelligence: Background roster registration restricted by RLS. Proceeding with secondary identity verification.", rosterError);
          // Allow progression if establishment was successfully created. 
          // Identity will be verified via primary ownerEmail field in restaurants table.
          const error = rosterError as { message?: string; code?: string };
          const isRLS = error.message?.toLowerCase().includes('row-level security') || error.code === '42501';
          if (!isRLS) throw rosterError;
        }
      }

      const updatedProfile = { 
        ...profileToRegister, 
        id: data.id 
      };
      setProfile(updatedProfile);
      
      // CRITICAL: Save to localStorage immediately so subsequent steps/views have the latest data
      localStorage.setItem('vinetelligence_profile', JSON.stringify(updatedProfile));
      localStorage.setItem('vinea_profile', JSON.stringify(updatedProfile));

      setDbStatus(prev => ({ 
        ...prev, 
        loading: false, 
        success: true, 
        needsRegistration: false, 
        alreadyExists: false,
        statusText: 'Registration Complete'
      }));
      
      // Use a small delay for visual feedback then proceed
      setTimeout(handleNext, 1500);
    } catch (e: unknown) {
      const error = e as Error;
      console.error("Vinetelligence: handleRegisterEstablishment failed", error);
      setDbStatus(prev => ({ ...prev, loading: false, error: error.message, statusText: undefined }));
    }
  }, [handleNext]);

  useEffect(() => {
    console.log("Vinetelligence: Step 5 Effect Check", { 
      step, 
      isEnvManaged: dbStatus.isEnvManaged, 
      success: dbStatus.success, 
      loading: dbStatus.loading, 
      error: dbStatus.error,
      autoProvisionAttempted: autoProvisionAttempted.current 
    });
    if (step === 5 && dbStatus.isEnvManaged && !dbStatus.success && !dbStatus.loading && !dbStatus.error && !autoProvisionAttempted.current) {
      console.log("Vinetelligence: Triggering auto-provisioning for step 5");
      autoProvisionAttempted.current = true;
      validateAndProvision();
    }
    
    if (step !== 5) {
      autoProvisionAttempted.current = false;
    }
  }, [step, dbStatus.isEnvManaged, dbStatus.success, dbStatus.loading, dbStatus.error, validateAndProvision]);

  const handlePayment = async () => {
    setPaymentError(null);
    setIsProcessingPayment(true);
    
    const isStaff = currentUserEmail?.endsWith('@vinetelligence.com') || currentUserEmail?.endsWith('@vinea.live');
    const isHighTier = profile.edition === 'paid' || profile.edition === 'enterprise';

    // Allow staff to bypass for testing, but others must pay
    if (isHighTier && !isStaff) {
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: profile.edition,
            email: currentUserEmail || profile.ownerEmail
          }),
        });

        const session = await response.json();
        if (session.url) {
          window.location.href = session.url;
          return;
        } else {
          throw new Error(session.error || "Failed to create checkout session");
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setPaymentError(message);
        setIsProcessingPayment(false);
        return;
      }
    }

    // For 'free' (Operator Trial), we just proceed
    setIsProcessingPayment(false);
    setStep(4); // Proceed to Venue Designation
  };

  const startInitialization = async () => {
    setIsInitializing(true);
    setStep(10);
    try {
      const finalType = profile.type === 'Other' ? (profile.customType || 'Unique Establishment') : profile.type;
      await geminiService.getWelcomeBrief({ ...profile, type: finalType });
      setTimeout(() => setIsInitializing(false), 2500);
    } catch (error) {
      console.error(error);
      setIsInitializing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0: 
        return (
          <div className="w-full min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-indigo-500/30 selection:text-white overflow-x-hidden touch-scrolling">
            <nav className="fixed top-0 left-0 right-0 z-[120] px-4 md:px-8 py-4 md:py-6 flex justify-between items-center bg-stone-950/40 backdrop-blur-md">
              <div className="flex items-center gap-2 cursor-default select-none">
                <VinetelligenceLogo size="sm" withText={true} />
              </div>
              <div className="flex gap-4">
                <button onClick={() => onSelectAuth('login')} className="px-4 md:px-6 py-2 border border-white/20 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-300 hover:text-white hover:border-white transition-all">Sign In</button>
              </div>
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden">
               <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/40 to-stone-950 z-10"></div>
                  <img src={branding.heroImage} className="w-full h-full object-cover scale-110" alt="Venue Experience" />
               </div>
               
               <div className="relative z-20 max-w-5xl space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                  <div className="flex justify-center">
                    <span className="bg-indigo-500/10 text-indigo-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] px-4 py-2 rounded-full border border-indigo-500/20 mb-2 md:mb-4 inline-block">{branding.tagline}</span>
                  </div>
                  <h1 className="text-4xl sm:text-6xl md:text-9xl font-serif font-black italic tracking-tighter text-white leading-[0.9]">
                    Hospitality,<br/><span className="text-stone-400">Synthesized.</span>
                  </h1>
                  <p className="text-base md:text-2xl text-stone-300 max-w-2xl mx-auto font-medium italic leading-relaxed opacity-80 px-4">
                    "{branding.description}"
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-8 items-center px-4">
                     {isProductionMode ? (
                       <>
                         <button 
                          onClick={() => onSelectAuth('login')}
                          className="w-full sm:w-auto px-10 md:px-14 py-4 md:py-6 bg-indigo-500 text-stone-950 rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] active:scale-95"
                         >
                           Staff Portal
                         </button>
                         <div className="flex flex-col gap-3 w-full sm:w-auto">
                           <button 
                             onClick={() => handleLaunchDemo('operator')}
                             className="w-full px-8 md:px-10 py-3 md:py-4 border border-white/20 text-white rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-white/10 transition-all active:scale-95"
                           >
                             Demo as Operator
                           </button>
                         </div>
                       </>
                     ) : (
                       <>
                         <div className="flex flex-col gap-3 w-full sm:w-auto">
                           <button 
                             onClick={() => {
                               setProfile({...profile, aesthetic: 'elite', brandVoice: 'luxury', name: branding.name + ' Elite Sandbox', edition: 'demo', demoMode: 'operator'});
                               onComplete({...profile, aesthetic: 'elite', brandVoice: 'luxury', name: branding.name + ' Elite Sandbox', edition: 'demo', demoMode: 'operator'});
                             }}
                             className="w-full px-8 md:px-10 py-3 md:py-4 bg-indigo-500 text-stone-900 rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-white transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] active:scale-95"
                           >
                             Demo Elite Mode
                           </button>
                           <button 
                             onClick={() => {
                               setProfile({...profile, aesthetic: 'light', brandVoice: 'casual', name: branding.name + ' Light Sandbox', edition: 'demo', demoMode: 'operator'});
                               onComplete({...profile, aesthetic: 'light', brandVoice: 'casual', name: branding.name + ' Light Sandbox', edition: 'demo', demoMode: 'operator'});
                             }}
                             className="w-full px-8 md:px-10 py-3 md:py-4 border border-indigo-500/30 text-indigo-500 rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-indigo-500 hover:text-stone-950 transition-all active:scale-95"
                           >
                             Demo Light Mode
                           </button>
                         </div>
                         <button onClick={() => setStep(1)} className="w-full sm:w-auto px-10 md:px-14 py-4 md:py-6 border border-white/20 text-white rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-white/10 transition-all active:scale-95">Register Establishment</button>
                       </>
                     )}
                  </div>
               </div>

               <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 animate-bounce text-stone-500">
                  <i className="fas fa-chevron-down text-xl"></i>
               </div>
            </section>

            {/* Core Modules Showcase */}
            <section className="py-40 px-8 bg-stone-950 relative overflow-hidden">
               <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
               <div className="max-w-7xl mx-auto">
                  {/* Academy Section Hidden for Maintenance */}
                  {/* 
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-40">
                     <div className="space-y-10">
                        <div className="space-y-4">
                           <h2 className="text-6xl font-serif font-black italic text-white tracking-tighter leading-none">The Scholar Node</h2>
                           <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Academy</p>
                        </div>
                        <p className="text-stone-400 text-xl leading-relaxed font-medium italic">
                           "Eliminate technical friction. Vinetelligence provides your team with a high-fidelity knowledge base covering global vintages, spirit chemistry, and cultural etiquette—delivered in real-time via hands-free AI coaching."
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-4 hover:border-indigo-500/30 transition-all">
                              <i className="fas fa-brain-circuit text-indigo-500 text-2xl"></i>
                              <h4 className="font-bold text-lg italic">Hands-Free Coaching</h4>
                              <p className="text-xs text-stone-500 leading-relaxed font-medium italic">Voice-activated technical support for sommeliers and mixologists during peak service.</p>
                           </div>
                           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-4 hover:border-indigo-500/30 transition-all">
                              <i className="fas fa-bolt text-indigo-500 text-2xl"></i>
                              <h4 className="font-bold text-lg italic">Tactical Drills</h4>
                              <p className="text-xs text-stone-500 leading-relaxed font-medium italic">Daily skill verification micro-modules synced with your actual inventory list.</p>
                           </div>
                        </div>
                     </div>
                     <div className="relative group">
                        <div className="absolute -inset-4 bg-rose-500/10 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <img 
                          src="https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=1200&q=80" 
                          className="relative z-10 w-full aspect-[4/5] object-cover rounded-[3rem] border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-1000 shadow-2xl" 
                          alt="Training Experience" 
                        />
                        <div className="absolute bottom-10 right-10 z-20 bg-stone-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl animate-float">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Live Synthesis active</span>
                           </div>
                           <p className="text-xs font-bold text-white mt-2">"Describe the terroir of Côte de Nuits..."</p>
                        </div>
                     </div>
                  </div>
                  */}

                  {/* Guest Intelligence Node Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-40">
                     <div className="space-y-10">
                        <div className="space-y-4">
                           <h2 className="text-6xl font-serif font-black italic text-white tracking-tighter leading-none">{getBrandedTerm('guest_journey', profile)}</h2>
                           <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em]">Palate Sync Protocol</p>
                        </div>
                        <p className="text-stone-400 text-xl leading-relaxed font-medium italic">
                           "The guest experience begins before they arrive. Vinetelligence's Guest Intelligence Node captures palate DNA and dietary constraints, allowing your team to prepare bespoke pairings that resonate with every individual."
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-4 hover:border-indigo-500/30 transition-all">
                              <i className="fas fa-fingerprint text-indigo-500 text-2xl"></i>
                              <h4 className="font-bold text-lg italic">Palate DNA</h4>
                              <p className="text-xs text-stone-500 leading-relaxed font-medium italic">Capture deep preferences and pairing styles to tailor every interaction.</p>
                           </div>
                           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-4 hover:border-indigo-500/30 transition-all">
                              <i className="fas fa-calendar-check text-indigo-500 text-2xl"></i>
                              <h4 className="font-bold text-lg italic">Seamless Booking</h4>
                              <p className="text-xs text-stone-500 leading-relaxed font-medium italic">A high-fidelity reservation interface that feels like an extension of your brand.</p>
                           </div>
                        </div>
                        <div className="pt-6 flex flex-col gap-4">
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 italic">
                             * Guest Portal links are generated per establishment and accessible via their unique URLs.
                           </p>
                        </div>
                     </div>
                     <div className="relative group">
                        <div className="absolute -inset-4 bg-rose-500/10 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <img 
                          src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80" 
                          className="relative z-10 w-full aspect-[4/5] object-cover rounded-[3rem] border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-1000 shadow-2xl" 
                          alt="Guest Experience" 
                        />
                        <div className="absolute top-10 right-10 z-20 bg-stone-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Palate Match: 94%</span>
                           </div>
                           <p className="text-xs font-bold text-white mt-2">"Preparing Barolo 2016 for Table 4..."</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-40">
                     <div className="order-2 lg:order-1 relative group">
                        <div className="absolute -inset-4 bg-blue-500/10 rounded-[3rem] blur-2xl opacity-50"></div>
                        <img 
                          src="https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80" 
                          className="relative z-10 w-full aspect-[4/5] object-cover rounded-[3rem] border border-white/10 grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl" 
                          alt="Inventory Vision" 
                        />
                        <div className="absolute top-10 left-10 z-20 bg-blue-900/80 backdrop-blur-md p-6 rounded-3xl border border-blue-500/20 shadow-2xl">
                           <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Vision Audit Node</p>
                           <p className="text-xs font-bold text-white italic leading-none">Confidence Index: 98.4%</p>
                           <div className="w-full h-1 bg-blue-500/20 rounded-full mt-3 overflow-hidden">
                              <div className="h-full bg-blue-500 w-[98%]"></div>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-10 order-1 lg:order-2">
                        <div className="space-y-4 text-right lg:text-left">
                           <h2 className="text-6xl font-serif font-black italic text-white tracking-tighter leading-none">{getBrandedTerm('yield_alpha', profile)}</h2>
                           <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Predictive Logistics</p>
                        </div>
                        <p className="text-stone-400 text-xl leading-relaxed font-medium italic">
                           "Stop reacting to shortages. Vinetelligence's predictive engine uses local demand patterns and multimodal vision audits to automate your supply chain and increase net margins by up to 14.2%."
                        </p>
                        <div className="grid grid-cols-1 gap-6 pt-4">
                           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center gap-6 group hover:border-blue-500/30 transition-all">
                              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 text-2xl group-hover:bg-blue-500 group-hover:text-white transition-all"><i className="fas fa-expand"></i></div>
                              <div>
                                 <h4 className="font-bold text-lg italic">Vision Audit</h4>
                                 <p className="text-xs text-stone-500 leading-relaxed font-medium italic">Automatic bottle identification, fill-level parsing, and ESG scoring via camera.</p>
                              </div>
                           </div>
                           <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center gap-6 group hover:border-blue-500/30 transition-all">
                              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-500 text-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all"><i className="fas fa-chart-line-up"></i></div>
                              <div>
                                 <h4 className="font-bold text-lg italic">Demand Forecasting</h4>
                                 <p className="text-xs text-stone-500 leading-relaxed font-medium italic">Analyzes historical velocity to suggest exact reorder nodes for the next 72 hours.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            {/* Security & Access Integrity */}
            <section className="py-40 px-8 bg-stone-900/40 border-y border-white/5 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
               <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                  <div className="relative order-2 lg:order-1">
                     <div className="absolute -inset-10 bg-blue-500/10 rounded-full blur-3xl"></div>
                     <div className="relative z-10 p-12 glass rounded-[3rem] border border-white/10 space-y-8 shadow-2xl">
                        <div className="flex items-center gap-4">
                           <div className="w-16 h-16 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center">
                              <i className="fas fa-shield-halved text-3xl"></i>
                           </div>
                           <div className="space-y-1">
                              <h3 className="text-2xl font-serif font-black italic text-white leading-none">Vinetelligence Fortress</h3>
                              <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest leading-none mt-2">Zero-Trust Data Protection</p>
                           </div>
                        </div>
                        <div className="space-y-6">
                           {[
                              { title: "Hardened Bytecode", desc: "Production application logic is obfuscated and hardened to prevent unauthorized inspection of proprietary node architecture." },
                              { title: "Private Silo Synchronization", desc: "Establishment records are isolated into cryptographically secure data silos with 256-bit AES protection." },
                              { title: "Biometric & OAuth Identity", desc: "Integrates directly with Google Workspace and enterprise identity providers for multi-factor staff authentication." }
                           ].map((item, i) => (
                              <div key={i} className="flex gap-4 group">
                                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 group-hover:scale-150 transition-transform"></div>
                                 <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">{item.title}</h4>
                                    <p className="text-xs text-stone-500 italic leading-relaxed">{item.desc}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                  <div className="space-y-10 order-1 lg:order-2">
                     <div className="space-y-4">
                        <h2 className="text-6xl font-serif font-black italic text-white tracking-tighter leading-none">Immutable Trust.</h2>
                        <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.4em]">Integrated Security Architecture</p>
                     </div>
                     <p className="text-stone-400 text-xl leading-relaxed font-medium italic">
                        "Hospitality is built on discretion. Vinetelligence is engineered to exceed banking-grade security standards, ensuring your menu engineering, guest palates, and financial nodes remain strictly within your establishment's control."
                     </p>
                     <div className="pt-8 flex gap-8">
                        <div className="flex-1 p-8 bg-white/5 rounded-3xl border border-white/5 space-y-2 text-center">
                           <p className="text-3xl font-serif font-black text-white italic">24/7</p>
                           <p className="text-[9px] font-black uppercase text-stone-600 tracking-widest leading-none">Audit Monitoring</p>
                        </div>
                        <div className="flex-1 p-8 bg-white/5 rounded-3xl border border-white/5 space-y-2 text-center">
                           <p className="text-3xl font-serif font-black text-white italic">99.9%</p>
                           <p className="text-[9px] font-black uppercase text-stone-600 tracking-widest leading-none">Storage Redundancy</p>
                        </div>
                     </div>
                  </div>
               </div>
            </section>

            {/* System Protocols Tiers */}
            {/* Fix: Changed 'class' to 'className' as required for React JSX */}
            <section id="protocols" className="py-40 px-8 bg-stone-900/30 border-y border-white/5">
               <div className="max-w-6xl mx-auto space-y-20">
                  <div className="text-center space-y-4">
                     <h2 className="text-6xl font-serif font-black italic text-white tracking-tight leading-none">Intelligence Architecture</h2>
                     <p className="text-stone-500 text-sm uppercase tracking-[0.5em] font-black">Select Operational Protocol</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {EDITIONS.map((ed) => (
                      <div key={ed.id} className="bg-white/5 backdrop-blur-sm p-10 rounded-[3rem] border border-white/5 flex flex-col space-y-10 group hover:border-indigo-500/30 transition-all hover:bg-white/[0.07] shadow-2xl relative overflow-hidden">
                         <div className="flex justify-between items-start">
                            <i className={`fas ${ed.icon} text-indigo-500 text-3xl`}></i>
                            <div className="flex flex-col items-end">
                               <span className="text-[8px] font-black uppercase text-stone-500 tracking-[0.3em] bg-white/5 px-2 py-1 rounded mb-1">{ed.badge}</span>
                               <span className="text-xl font-serif font-bold italic text-indigo-500">{ed.price}</span>
                               {ed.subPrice && <span className="text-[8px] font-black uppercase text-stone-600 tracking-widest">{ed.subPrice}</span>}
                            </div>
                         </div>
                         <div className="space-y-4 flex-1">
                            <h4 className="text-2xl font-serif font-bold text-white italic leading-tight">{ed.title}</h4>
                            <p className="text-xs text-stone-400 leading-relaxed italic">{ed.desc}</p>
                         </div>
                         <div className="space-y-4 pt-6 border-t border-white/5">
                            {ed.features.map((f, i) => (
                              <div key={i} className="flex items-center gap-3 text-[9px] font-black text-stone-500 group-hover:text-stone-300">
                                 <div className="w-1 h-1 rounded-full bg-stone-800 group-hover:bg-indigo-500 transition-colors"></div>
                                 {f}
                              </div>
                            ))}
                         </div>
                         <button 
                          onClick={() => { 
                             setProfile({...profile, edition: ed.id, tier: ed.title.replace('The ', '')}); 
                             setStep(1); 
                          }} 
                          className="w-full py-5 bg-white/5 rounded-2xl group-hover:bg-indigo-500 group-hover:text-stone-900 transition-all font-black text-[10px] uppercase tracking-widest text-stone-400"
                         >
                           Initialize Node
                         </button>
                      </div>
                    ))}
                  </div>
               </div>
            </section>

            {/* Network Stats */}
            {/* Fix: Changed 'class' to 'className' as required for React JSX */}
            <section className="py-32 px-8">
               <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                  <div className="space-y-2">
                     <p className="text-5xl font-serif font-black italic text-indigo-500">42ms</p>
                     <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">AI Latency Index</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-5xl font-serif font-black italic text-indigo-500">50k+</p>
                     <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Verified Vintages</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-5xl font-serif font-black italic text-indigo-500">14.2%</p>
                     <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Average Yield Delta</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-5xl font-serif font-black italic text-indigo-500">99.9%</p>
                     <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Network Uptime</p>
                  </div>
               </div>
            </section>

            <footer className="py-40 px-8 border-t border-white/5 text-center bg-stone-950">
               <div className="max-w-md mx-auto space-y-16">
                  <div className="space-y-6">
                    <h1 className="font-serif text-8xl font-black text-indigo-500 italic tracking-tighter uppercase leading-none">Vinetelligence</h1>
                    <p className="text-stone-400 text-xl font-medium leading-relaxed italic">"Realizing the integrated intelligence layer for the modern beverage program."</p>
                  </div>
                  <div className="space-y-6 pt-10">
                    <div className="flex flex-col gap-4 text-stone-500 font-black uppercase text-[9px] tracking-[0.2em] mb-8">
                       <a href="mailto:support@vinetelligence.com" className="hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
                          <i className="fas fa-envelope text-[10px]"></i>
                          support@vinetelligence.com
                       </a>
                       <a href="mailto:business@vinetelligence.com" className="hover:text-indigo-500 transition-colors flex items-center justify-center gap-2">
                          <i className="fas fa-briefcase text-[10px]"></i>
                          business@vinetelligence.com
                       </a>
                    </div>
                    <div className="flex gap-10 justify-center text-stone-700 text-xl mb-10">
                       <i className="fab fa-instagram hover:text-indigo-500 transition-colors cursor-pointer"></i>
                       <i className="fab fa-linkedin hover:text-indigo-500 transition-colors cursor-pointer"></i>
                       <i className="fab fa-twitter hover:text-indigo-500 transition-colors cursor-pointer"></i>
                    </div>

                    {/* Glossary Section */}
                    <div className="pt-20 border-t border-white/5 text-left max-w-4xl mx-auto space-y-10">
                      <h3 className="text-2xl font-serif font-black italic text-stone-500 uppercase tracking-tighter">Intelligence Glossary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-2">
                          <h4 className="text-indigo-500 text-[10px] font-black uppercase tracking-widest">Synthesized</h4>
                          <p className="text-xs text-stone-500 italic leading-relaxed">The AI combines multiple data streams (inventory, guest history, staff patterns) to create a single, actionable response or task.</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-indigo-500 text-[10px] font-black uppercase tracking-widest">{getBrandedTerm('neural_link', profile)}</h4>
                          <p className="text-xs text-stone-500 italic leading-relaxed">The real-time secure communication bridge between your facility's local data and our cloud-based intelligence models.</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-indigo-500 text-[10px] font-black uppercase tracking-widest">Lattice</h4>
                          <p className="text-xs text-stone-500 italic leading-relaxed">The interconnected web of hospitality knowledge that powers our technical training and service coaching.</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-indigo-500 text-[10px] font-black uppercase tracking-widest">{getBrandedTerm('yield_alpha', profile)}</h4>
                          <p className="text-xs text-stone-500 italic leading-relaxed">Our predictive algorithm that identifies the exact path to maximizing profit margins and minimizing waste.</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-stone-800 text-[10px] font-black uppercase tracking-[0.5em] mt-20">© 2026 VINETELLIGENCE INTELLIGENCE SUITE</p>
                    <p className="text-stone-900 text-[8px] font-black uppercase tracking-[0.2em]">Designed for hospitality mastery.</p>
                  </div>
               </div>
            </footer>
          </div>
        );
      case 1:
        return (
          <div className="text-center space-y-6 md:space-y-10 animate-in fade-in zoom-in duration-700 max-w-2xl px-6">
            <div className="w-20 h-20 bg-indigo-500 text-stone-950 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl transform rotate-12 mb-8"><i className="fas fa-hammer text-3xl"></i></div>
            <h2 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight tracking-tighter italic">Facility Architect</h2>
            <p className="text-stone-400 text-lg md:text-xl font-medium leading-relaxed italic">
              "Initializing establishment architecture. Secure your operational identity and select your intelligence tier."
            </p>
            <div className="pt-10 flex gap-6 justify-center">
              <button onClick={() => setStep(0)} className="px-10 py-5 border border-white/10 text-stone-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all">Back</button>
              <button 
                onClick={handleNext}
                className="group px-14 py-5 bg-white text-stone-900 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all hover:bg-indigo-500 hover:text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 flex items-center gap-4"
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
                  onClick={() => setProfile({...profile, edition: ed.id, tier: ed.title.replace('The ', '')})}
                  className={`flex flex-col text-left p-10 rounded-[3rem] border-4 transition-all duration-500 relative group overflow-hidden h-full ${
                    profile.edition === ed.id 
                      ? `${ed.accent} bg-white/5 shadow-2xl ring-4 ring-indigo-500/10` 
                      : 'bg-white/0 border-white/5 hover:border-white/20 hover:bg-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${profile.edition === ed.id ? 'bg-indigo-500 text-stone-950 shadow-xl' : 'bg-white/5 text-stone-700'}`}>
                      <i className={`fas ${ed.icon} text-2xl`}></i>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${profile.edition === ed.id ? 'bg-indigo-500 text-stone-900 border-indigo-400' : 'bg-white/5 border-white/10 text-stone-600'}`}>
                      {ed.badge}
                    </span>
                  </div>

                  <h4 className="text-2xl font-serif font-bold text-white mb-3 italic">{ed.title}</h4>
                  <p className="text-xs text-stone-500 leading-relaxed mb-10 h-12 overflow-hidden">{ed.desc}</p>
                  
                  <div className="space-y-4 mb-12 flex-1">
                    {ed.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <i className={`fas fa-check-circle text-xs ${profile.edition === ed.id ? 'text-indigo-500' : 'text-stone-800'}`}></i>
                        <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col items-end pt-8 border-t border-white/10">
                     <span className="text-3xl font-serif font-black italic text-white">{ed.price}</span>
                     {ed.subPrice && <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest mt-1">{ed.subPrice}</span>}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-10">
              <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Back</button>
              <button 
                onClick={handleNext}
                className="px-14 py-5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-2xl"
              >
                Proceed to Setup
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center space-y-10 max-w-xl mx-auto px-6 animate-in fade-in duration-700">
            <div className="w-24 h-24 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto border-2 border-indigo-500/30">
              <i className="fas fa-credit-card text-4xl"></i>
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-serif font-black text-white italic tracking-tight">Secure Payment Gateway</h3>
              <p className="text-stone-500 italic">"Initializing transaction for {EDITIONS.find(e => e.id === profile.edition)?.title} protocol."</p>
            </div>
            
            <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-8">
               <div className="flex justify-between items-center pb-6 border-b border-white/10">
                  <span className="text-stone-400 font-bold uppercase text-[10px] tracking-widest">Selected Tier</span>
                  <span className="text-white font-serif italic text-xl">{EDITIONS.find(e => e.id === profile.edition)?.title}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-bold uppercase text-[10px] tracking-widest">
                    {profile.edition === 'free' ? 'Trial Period' : 'Amount Due'}
                  </span>
                  <span className="text-indigo-500 font-serif font-black italic text-3xl">
                    {profile.edition === 'free' ? '14 Days Free' : EDITIONS.find(e => e.id === profile.edition)?.price}
                  </span>
               </div>
               
               {paymentError && (
                 <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                   <i className="fas fa-exclamation-triangle text-indigo-500 mt-1"></i>
                   <p className="text-[10px] font-bold text-indigo-400 text-left leading-relaxed italic">{paymentError}</p>
                 </div>
               )}
            </div>

            <button 
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all flex items-center justify-center gap-4"
            >
              {isProcessingPayment ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-lock"></i>
                  {profile.edition === 'free' ? 'Start 14-Day Free Trial' : 'Complete Secure Payment'}
                </>
              )}
            </button>
            <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Cancel</button>
          </div>
        );
      case 4:
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
                  disabled={profile.id !== 'demo-id'}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  onBlur={e => setProfile({...profile, name: e.target.value.trim()})}
                  className={`w-full bg-white/5 border-b-2 border-white/10 py-6 text-4xl text-white font-serif focus:outline-none focus:border-indigo-500 transition-all placeholder:text-stone-800 italic ${profile.id !== 'demo-id' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  placeholder="The Gilded Shaker..."
                />
                {profile.id !== 'demo-id' && (
                  <p className="text-[8px] text-stone-500 mt-2 uppercase tracking-widest italic">
                    * Registry name is locked after cloud synchronization.
                  </p>
                )}
              </div>

              <div className="group">
                <label className="block text-[11px] font-black text-stone-500 uppercase tracking-[0.4em] mb-4 ml-1">Owner Operational Email</label>
                <input 
                  type="email" 
                  value={profile.ownerEmail}
                  onChange={e => setProfile({...profile, ownerEmail: e.target.value})}
                  className="w-full bg-white/5 border-b-2 border-white/10 py-4 text-xl text-white font-serif focus:outline-none focus:border-indigo-500 transition-all placeholder:text-stone-800 italic"
                  placeholder="owner@establishment.com"
                />
                <p className="text-[8px] text-stone-600 mt-2 uppercase tracking-widest">This email will be authorized as the primary node administrator.</p>
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
                          ? 'bg-indigo-500 text-stone-950 border-indigo-500 shadow-xl' 
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
                disabled={!profile.name || !profile.ownerEmail}
                className="px-16 py-5 bg-indigo-600 hover:bg-indigo-50 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all"
              >
                {isEnterpriseTier ? 'Proceed to Silo Setup' : 'Proceed to Tuning'}
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="w-full max-w-2xl space-y-10 animate-in slide-in-from-right-10 duration-500 px-6">
             <div className="space-y-2">
              <h3 className="text-5xl font-serif font-bold text-white italic tracking-tighter">Secure Cloud Silo</h3>
              <p className="text-stone-500 text-lg italic">
                {isEnterpriseTier ? "Architect-tier protocols detected: Provisioning private data layer." : "Cloud-tier protocols detected: Provisioning data synchronization layer."}
              </p>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-blue-600/10 rounded-[2.5rem] border-2 border-blue-500/20 flex gap-6 items-center shadow-inner">
                 <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"><i className="fas fa-network-wired text-xl"></i></div>
                 <div className="flex-1">
                   <p className="text-sm text-blue-100 font-medium italic leading-relaxed">
                     {dbStatus.isEnvManaged 
                       ? "Managed Cloud detected. Vinetelligence is ready to register your establishment in the global registry."
                       : "As a cloud-enabled node, you can connect Vinetelligence to your private Supabase instance for data sovereignty and cloud backups."}
                   </p>
                   {dbStatus.isEnvManaged && !showManualConfig && !dbStatus.success && (
                     <button 
                       onClick={() => setShowManualConfig(true)}
                       className="mt-2 text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 transition-all tracking-widest"
                     >
                       Override Managed Config
                     </button>
                   )}
                 </div>
              </div>

              {(showManualConfig || !dbStatus.isEnvManaged) && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
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
                  {showManualConfig && (
                    <button 
                      onClick={() => setShowManualConfig(false)}
                      className="text-[9px] font-black uppercase text-stone-500 hover:text-white transition-all tracking-widest"
                    >
                      Use Managed Config
                    </button>
                  )}
                </div>
              )}

              {dbStatus.loading && (
                <div className="p-8 bg-blue-500/5 border-2 border-blue-500/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 animate-pulse">
                  <i className="fas fa-circle-notch fa-spin text-blue-500 text-3xl"></i>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">{dbStatus.statusText || 'Processing...'}</p>
                </div>
              )}

              {dbStatus.error && (
                <div className="p-8 bg-red-500/10 border-2 border-red-500/20 rounded-[2.5rem] animate-in shake-in">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-900/20">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Protocol Error</p>
                  </div>
                  <p className="text-sm text-red-200 font-medium italic leading-relaxed pl-14">{dbStatus.error}</p>
                  <div className="mt-6 ml-14 flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={validateAndProvision}
                      className="px-8 py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all active:scale-95"
                    >
                      Retry Connection
                    </button>
                    <button 
                      onClick={() => {
                        console.log("Vinetelligence: User chose to skip schema verification");
                        setDbStatus(prev => ({ 
                          ...prev, 
                          success: true, 
                          needsRegistration: true, 
                          error: undefined,
                          statusText: 'Verification Skipped'
                        }));
                      }}
                      className="px-8 py-4 bg-white/5 border border-white/10 text-stone-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all active:scale-95"
                    >
                      Skip Verification
                    </button>
                  </div>
                  <p className="mt-4 ml-14 text-[8px] text-stone-500 uppercase tracking-widest italic">
                    * Skip only if you are certain the Cloud Silo is correctly provisioned.
                  </p>
                </div>
              )}

              {dbStatus.success && dbStatus.alreadyExists && (
                 <div className="p-8 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-[2.5rem] flex items-center gap-4">
                    <i className="fas fa-info-circle text-indigo-500 text-2xl"></i>
                    <p className="text-sm text-indigo-200 font-medium italic">Establishment "{profile.name}" already exists in this silo. Connecting to existing node.</p>
                 </div>
              )}

              {dbStatus.needsRegistration && (
                <div className="p-8 bg-indigo-500/10 border-2 border-indigo-500/20 rounded-[2.5rem] space-y-6 animate-in slide-in-from-top-4">
                  <p className="text-sm text-indigo-200 font-medium italic">
                    Establishment <strong>"{profile.name}"</strong> confirmed as new node in this cloud silo.
                  </p>
                  <button 
                    onClick={handleRegisterEstablishment}
                    disabled={dbStatus.loading}
                    className="w-full py-5 bg-indigo-500 text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/20"
                  >
                    {dbStatus.loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-server"></i>}
                    Commit Facility Registration
                  </button>
                </div>
              )}

              {dbStatus.success && !dbStatus.needsRegistration && (
                 <div className="p-8 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[2.5rem] flex items-center gap-4">
                    <i className="fas fa-check-circle text-emerald-500 text-2xl"></i>
                    <p className="text-sm text-emerald-200 font-medium italic">Cloud Silo Synchronized. Node ID: {profile.id}</p>
                 </div>
              )}
            </div>

            <div className="flex justify-between pt-10">
              <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Back</button>
              {!dbStatus.needsRegistration && !dbStatus.success && (
                <button 
                  onClick={validateAndProvision}
                  disabled={((!profile.supabaseUrl || !profile.supabaseAnonKey) && !dbStatus.isEnvManaged) || dbStatus.loading}
                  className="px-16 py-5 bg-blue-600 hover:bg-blue-50 disabled:opacity-50 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-4 transition-all"
                >
                  {dbStatus.loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-network-wired"></i>}
                  Establish Connection
                </button>
              )}
              {dbStatus.success && !dbStatus.needsRegistration && (
                <button 
                  onClick={handleNext}
                  className="px-16 py-5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95"
                >
                  Continue Setup
                </button>
              )}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="w-full max-w-3xl space-y-12 animate-in slide-in-from-right-10 duration-500 px-6">
             <div className="space-y-2">
              <h3 className="text-5xl font-serif font-black text-white italic tracking-tighter">Program Philosophy</h3>
              <p className="text-stone-500 text-lg italic">
                {isLocalSiloBypass ? "Local environment identified. Synchronizing local persona." : (isEnterpriseTier ? "Configure your private silo persona." : "Initializing managed intelligence node...")}
              </p>
             </div>
             {isLocalSiloBypass && (
               <div className="bg-emerald-500/10 border-2 border-emerald-500/30 p-6 rounded-2xl flex items-center gap-4">
                  <i className="fas fa-shield-halved text-emerald-500"></i>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Environment configuration (.env.local) detected. Local silo protocols active.</p>
               </div>
             )}
             <textarea 
                value={profile.description}
                onChange={e => setProfile({...profile, description: e.target.value})}
                className="w-full h-64 bg-white/5 border-2 border-white/5 rounded-[3rem] px-10 py-10 text-white focus:outline-none focus:border-indigo-500 resize-none transition-all placeholder:text-stone-800 leading-relaxed text-lg italic font-medium"
                placeholder="List signature vintages, artisanal focus, or unique service protocols..."
             />
             <div className="flex justify-between pt-10">
              <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Back</button>
              <button onClick={handleNext} className="px-16 py-5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95">Configure Voice</button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="w-full max-w-4xl space-y-12 animate-in slide-in-from-right-10 duration-500 px-6">
             <div className="text-center space-y-4">
              <h3 className="text-5xl font-serif font-black text-white italic tracking-tighter">Experience Profile</h3>
              <p className="text-stone-500 text-lg italic">Select how your AI system communicates and represents your brand.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
               <button 
                 onClick={() => setProfile({...profile, aesthetic: 'elite', brandVoice: 'luxury'})}
                 className={`p-10 rounded-[3rem] border-4 transition-all text-left space-y-6 ${profile.aesthetic === 'elite' ? 'border-indigo-500 bg-white/5 shadow-2xl' : 'border-white/5 bg-white/0 opacity-60'}`}
               >
                 <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <i className="fas fa-crown text-2xl"></i>
                 </div>
                 <div>
                   <h4 className="text-2xl font-serif font-black italic text-white">Elite Mode</h4>
                   <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mt-1">High-Luxury Aesthetic</p>
                 </div>
                 <p className="text-xs text-stone-500 leading-relaxed italic">
                   "The traditional Vinetelligence experience. Uses technical jargon like 'Neural Link', 'Intelligence Node', and 'Scholar Lattice' for a high-performance, polished feel."
                 </p>
               </button>

               <button 
                 onClick={() => setProfile({...profile, aesthetic: 'light', brandVoice: 'casual'})}
                 className={`p-10 rounded-[3rem] border-4 transition-all text-left space-y-6 ${profile.aesthetic === 'light' ? 'border-indigo-500 bg-white/5 shadow-2xl' : 'border-white/5 bg-white/0 opacity-60'}`}
               >
                 <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <i className="fas fa-bolt-lightning text-2xl"></i>
                 </div>
                 <div>
                   <h4 className="text-2xl font-serif font-black italic text-white">Light Mode</h4>
                   <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mt-1">Approachable Utility</p>
                 </div>
                 <p className="text-xs text-stone-500 leading-relaxed italic">
                   "A simplified, everyday experience. Uses clear labels like 'AI Assistant', 'Training', and 'Staff Helper' to minimize friction for teams in casual or fast-paced settings."
                 </p>
               </button>
             </div>

             <div className="flex justify-between pt-10">
              <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Back</button>
              <button onClick={handleNext} className="px-16 py-5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95">Review Deployment</button>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="w-full max-w-4xl space-y-12 animate-in slide-in-from-right-10 duration-500 px-6">
            <div className="space-y-4 text-center">
              <h3 className="text-5xl font-serif font-black text-white italic tracking-tighter leading-none">Neural Linguistics</h3>
              <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em]">Select Primary Operating Language</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { id: 'en', name: 'English', flag: '🇺🇸', desc: 'Standard' },
                { id: 'es', name: 'Español', flag: '🇪🇸', desc: 'Iberia/LatAm' },
                { id: 'nl', name: 'Nederlands', flag: '🇳🇱', desc: 'Benelux' },
                { id: 'pt', name: 'Português', flag: '🇵🇹', desc: 'Brasil' }
              ].map((lang) => (
                <button 
                  key={lang.id}
                  onClick={() => setProfile({...profile, language: lang.id})}
                  className={`p-8 rounded-[2.5rem] border-4 transition-all text-center space-y-4 ${profile.language === lang.id ? 'border-indigo-500 bg-white/5 shadow-2xl' : 'border-white/5 bg-white/0 opacity-60'}`}
                >
                  <div className="text-4xl mb-2">{lang.flag}</div>
                  <div>
                    <h4 className="text-xl font-serif font-black italic text-white leading-none">{lang.name}</h4>
                    <p className="text-indigo-500 text-[9px] font-black uppercase tracking-widest mt-2">{lang.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-between pt-10">
              <button onClick={handleBack} className="text-stone-600 hover:text-white font-black uppercase text-[11px] tracking-[0.4em] transition-all">Back</button>
              <button onClick={handleNext} className="px-16 py-5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95">Next Segment</button>
            </div>
          </div>
        );
      case 9:
        return (
          <div className="w-full max-w-5xl space-y-12 animate-in slide-in-from-right-10 duration-500 px-6">
            <h3 className="text-5xl font-serif font-black text-white text-center italic tracking-tighter leading-none mb-16">Initializing Intelligence Modules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: profile.aesthetic === 'light' ? 'Staff Training' : 'The Scholar Node', desc: 'Technical beverage archives.', icon: 'fa-brain' },
                { title: profile.aesthetic === 'light' ? 'Sales Forecast' : 'The Yield Engine', desc: 'Predictive logistics logic.', icon: 'fa-chart-line' },
                { title: profile.aesthetic === 'light' ? 'Guest Favorites' : 'Palate Mapping', desc: 'Hyper-personalized service.', icon: 'fa-fingerprint' }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border-2 border-white/5 p-12 rounded-[4rem] text-center space-y-6 group hover:border-indigo-500/20 transition-all shadow-2xl">
                  <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto border-2 border-indigo-500/20 shadow-inner group-hover:bg-indigo-500 group-hover:text-stone-950 transition-all">
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
               <button 
                onClick={startInitialization}
                className="w-full max-lg py-7 bg-indigo-600 hover:bg-indigo-50 text-white rounded-3xl font-black text-sm uppercase tracking-[0.4em] transition-all shadow-[0_30px_70px_rgba(79,70,229,0.3)] active:scale-95"
              >
                Launch {profile.aesthetic === 'light' ? 'Assistant' : 'Facility Intelligence'}
              </button>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="text-center space-y-10 max-w-xl mx-auto px-6">
            {isInitializing ? (
              <div className="space-y-12">
                <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center"><i className="fas fa-sparkles text-indigo-500 text-4xl animate-pulse"></i></div>
                </div>
                <h3 className="text-4xl font-serif text-white italic tracking-tight">{profile.aesthetic === 'light' ? 'Setting up system...' : 'Synthesizing System Core...'}</h3>
              </div>
            ) : (
              <div className="animate-in fade-in duration-1000 space-y-12 flex flex-col items-center">
                <div className="w-24 h-24 bg-indigo-500/20 text-indigo-500 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                  <i className="fas fa-check-double text-4xl"></i>
                </div>
                <div className="space-y-4">
                  <h3 className="text-5xl md:text-6xl font-serif font-black text-white italic leading-none tracking-tighter">System Ready.</h3>
                  <p className="text-stone-400 text-lg font-medium italic text-center">
                    {isDemoMode 
                      ? "Explorer tier node initialized. Database set to local-first sandbox mode. No account required."
                      : (isEnterpriseTier 
                          ? "Architect node identified. Private Silo activated for this facility."
                          : "Establishment identified. Vinetelligence Managed Cloud node activated for your tier.")}
                  </p>
                </div>
                <div className="space-y-6 flex flex-col items-center">
                  <div className="flex flex-col items-center gap-6 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div 
                        onClick={() => setHasAcceptedTerms(!hasAcceptedTerms)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${hasAcceptedTerms ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-white/10 group-hover:border-white/20 bg-white/5'}`}
                      >
                        {hasAcceptedTerms && <i className="fas fa-check text-stone-950 text-xs"></i>}
                      </div>
                      <span className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-500 group-hover:text-stone-300 transition-colors">
                        I acknowledge the <button onClick={(e) => { e.stopPropagation(); setShowTerms(true); }} className="text-emerald-500 hover:underline">Vinetelligence Neural Protocols</button>
                      </span>
                    </label>
                  </div>

                  <button 
                    onClick={() => onComplete(profile)}
                    disabled={!hasAcceptedTerms}
                    className="group px-16 py-7 bg-white text-stone-900 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-500 hover:text-white transition-all transform active:scale-95 shadow-2xl flex items-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale"
                  >
                    {isDemoMode ? 'Launch Dashboard' : 'Finalize & Sign Up'}
                    <i className="fas fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                  </button>
                  {!isDemoMode && (
                    <p className="text-stone-500 text-[10px] uppercase font-black tracking-widest animate-pulse">
                      Next: Establish your administrative credentials
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950 overflow-y-auto overflow-x-hidden custom-scrollbar touch-scrolling">
      {step !== 0 && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
           <div className="absolute -top-1/4 -right-1/4 w-[100vw] h-[100vw] bg-indigo-500/[0.03] rounded-full blur-[150px]"></div>
           <div className="absolute -bottom-1/4 -left-1/4 w-[80vw] h-[80vw] bg-indigo-600/[0.03] rounded-full blur-[120px]"></div>
        </div>
      )}
      
      <div className="relative z-10 w-full min-h-full flex flex-col items-center justify-center p-4 md:p-12">
        {renderStep()}
      </div>

      <TermsOfService 
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
    </div>
  );
};

export default Onboarding;

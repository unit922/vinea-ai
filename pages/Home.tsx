import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, ShieldCheck, Mail, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import VinetelligenceLogo from '../components/VinetelligenceLogo';
import AHLALogo from '../components/AHLALogo';
import { getPublicBrand } from '../utils/branding';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { SocialPromo } from '../components/SocialPromo';

interface HomeProps {
  onLogin?: () => void;
  onEnterDemo?: () => void;
  onStartOnboarding?: () => void;
}

const Home: React.FC<HomeProps> = ({ onEnterDemo, onStartOnboarding, onLogin }) => {
  const brand = getPublicBrand();
  const primaryText = brand.theme === 'vinea' ? 'text-amber-600' : 'text-indigo-600';
  const restaurantProfile = useVinetelligenceStore(state => state.restaurantProfile);

  const isVinea = brand.theme === 'vinea';
  const brandName = isVinea ? 'Vinea' : 'Vinetelligence';

  // Dynamic tailwind class strings for branding colors
  const textBrand400 = isVinea ? 'text-amber-400' : 'text-indigo-400';
  const textBrand600 = isVinea ? 'text-amber-600' : 'text-indigo-600';
  const bgBrand500 = isVinea ? 'bg-amber-500' : 'bg-indigo-500';
  const bgBrand600 = isVinea ? 'bg-amber-600' : 'bg-indigo-600';
  const hoverBgBrand600 = isVinea ? 'hover:bg-amber-600' : 'hover:bg-indigo-600';
  const hoverBgBrand700 = isVinea ? 'hover:bg-amber-700' : 'hover:bg-indigo-700';
  const borderBrand500_50 = isVinea ? 'hover:border-amber-500/50' : 'hover:border-indigo-500/50';
  const bgBrand500_10 = isVinea ? 'bg-amber-500/10' : 'bg-indigo-500/10';
  const shadowBrand100 = isVinea ? 'shadow-amber-100' : 'shadow-indigo-100';
  const bgBrand950_60 = isVinea ? 'bg-amber-950/60' : 'bg-indigo-950/60';

  const [isSocialFunnelActive, setIsSocialFunnelActive] = useState(false);
  const [activeModal, setActiveModal] = useState<'demo' | 'contact' | 'success' | 'verify' | null>(null);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', establishment: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [activePromoSlide, setActivePromoSlide] = useState(0);
  const [isPromoPlaying, setIsPromoPlaying] = useState(true);

  const scrollToSolutions = () => {
    const element = document.getElementById('solutions');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!isPromoPlaying) return;
    const interval = setInterval(() => {
      setActivePromoSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPromoPlaying]);

  // Auto-detect social traffic source on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('source') || params.get('funnel') || params.get('utm_source');
    const isSocialRef = ref === 'linkedin' || ref === 'linkedin-pro' || ref === 'facebook' || ref === 'fb' || ref === 'facebook-human' || ref === 'social';
    const isReferrerSocial = document.referrer.includes('linkedin.com') || 
                             document.referrer.includes('facebook.com') || 
                             document.referrer.includes('fb.me') || 
                             document.referrer.includes('instagram.com') || 
                             document.referrer.includes('t.co');
                             
    if (isSocialRef || isReferrerSocial) {
      setIsSocialFunnelActive(true);
    }
  }, []);

  if (isSocialFunnelActive) {
    const fallbackProfile = {
      id: isVinea ? 'vinea-landing-id' : 'vinetelligence-demo-id',
      name: isVinea ? 'Vinea Enterprise' : 'Vinetelligence Enterprise',
      type: 'Bespoke Restaurant & Bar',
      focus: 'Beverage Yield Optimization',
      aesthetic: 'elite' as const,
      manualPromoUrl: '',
      slug: 'demo-funnel'
    };
    
    return (
      <SocialPromo 
        profile={restaurantProfile || fallbackProfile}
        onBack={() => setIsSocialFunnelActive(false)}
        onLogin={onLogin}
      />
    );
  }

  const handleLeadSubmit = async () => {
    setEmailError(null);
    if (!leadForm.name || !leadForm.email) {
      setEmailError("Identity and contact coordinates are mandatory.");
      return;
    }
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(leadForm.email.toLowerCase())) {
      setEmailError("The provided email does not match neural patterns. Please verify and retry.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { supabaseSync } = await import('../services/supabaseSync');
      await supabaseSync.pushLead({
        ...leadForm,
        type: activeModal || 'contact'
      });
      if (activeModal === 'demo') {
        setActiveModal('verify');
      } else {
        setLeadForm({ name: '', email: '', establishment: '', message: '' });
        setActiveModal('success');
      }
    } catch (err) {
      console.error("Intelligence: Failed to push lead", err);
      setEmailError("Sync failure. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="pt-12 pb-20 md:pt-20 md:pb-32 px-6 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 -z-10 w-full h-full opacity-5">
           <div className="absolute inset-0 bg-gradient-to-l from-indigo-100 to-transparent"></div>
           <div className="grid grid-cols-6 gap-2 rotate-12 -translate-y-20">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-indigo-900 rounded-2xl"></div>
              ))}
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${brand.theme === 'vinea' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'} text-[10px] font-black uppercase tracking-widest`}>
                <i className="fas fa-sparkles text-[9px]"></i>
                {brand.theme === 'vinea' ? 'Autonomous Fine-Wine & Sommelier Platform' : 'Autonomous Restaurant & Beverage System'}
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                v3.2.1 Online
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-black leading-tight tracking-tighter text-stone-900">
              Optimize your <br />
              <span className={`${primaryText} italic`}>operations step-by-step.</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-xl font-medium">
              {brand.theme === 'vinea'
                ? "Vinea AI is an 80% autonomous, AI-powered fine-wine and hospitality service platform. We seamlessly synchronize with your existing POS systems to predict beverage demand, automate stock depletions, and guide floor staff with real-time sommelier intelligence."
                : "Vinetelligence is an 80% autonomous, AI-powered system for restaurant and beverage operations. We seamlessly synchronize with your existing POS systems to predict demand, automate stock depletions, and guide floor staff with real-time predictive intelligence."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={scrollToSolutions}
                className={`px-10 py-5 bg-stone-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest ${hoverBgBrand600} transition-all shadow-xl shadow-stone-200 active:scale-95 flex items-center justify-center gap-3 cursor-pointer`}
              >
                Explore What We Offer
                <ArrowRight className="w-3.5 h-3.5 text-white/50" />
              </button>
              <button 
                onClick={() => {
                  if (onStartOnboarding) {
                    onStartOnboarding();
                  } else {
                    setActiveModal('demo');
                  }
                }}
                className="px-10 py-5 bg-white text-stone-900 border border-stone-200 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                Consultation Call
              </button>
            </div>
            
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                 <div className="flex items-center gap-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Already a Partner?</p>
                   <button 
                     onClick={() => {
                       if (typeof window !== 'undefined' && window.location.hostname.includes('vinetelligence')) {
                         localStorage.setItem('platform_selected_app', 'vinetelligence');
                          const hUrl = new URL(window.location.href);
                          hUrl.searchParams.set('mode', 'login');
                          window.history.replaceState({}, '', hUrl.toString());
                          window.location.reload();
                         return;
                       }
                       onLogin?.();
                     }}
                     className={`text-[10px] font-black uppercase tracking-widest ${textBrand600} hover:underline transition-all cursor-pointer`}
                   >
                     Sign In
                   </button>
                 </div>
                 <div className="flex items-center gap-2 border-l border-stone-200 pl-6">
                   <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Want a preview?</p>
                   <button 
                     onClick={() => onEnterDemo?.()}
                     className={`text-[10px] font-black uppercase tracking-widest ${textBrand600} hover:underline transition-all cursor-pointer`}
                   >
                     Try Instant Sandbox Demo
                   </button>
                 </div>
              </div>

              {/* Quick Feature List */}
              <div className="flex flex-wrap gap-x-8 gap-y-4">
                {[
                  { icon: 'fa-microchip', text: 'AI-Driven Predictions' },
                  { icon: 'fa-users-gear', text: 'Autonomous Roster Sync' },
                  { icon: 'fa-globe', text: 'Global Intelligence Node' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <i className={`fas ${item.icon} text-indigo-500 text-[10px]`}></i>
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Above-the-fold Value Pillars */}
            <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-stone-100 mt-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <i className="fas fa-boxes-stacked text-xs"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Inventory</span>
                </div>
                <p className="text-[11px] font-bold text-stone-500 leading-relaxed italic">Predictive stock nodes eliminate 92% of manual counting.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <i className="fas fa-user-bolt text-xs"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Workforce</span>
                </div>
                <p className="text-[11px] font-bold text-stone-500 leading-relaxed italic">Autonomous coaching nodes turn junior staff into experts.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600">
                  <i className="fas fa-dna text-xs"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Guest DNA</span>
                </div>
                <p className="text-[11px] font-bold text-stone-500 leading-relaxed italic">Neural pattern matching decants the perfect experience.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="relative">
            {/* Interactive Preview Hub */}
            <div className="aspect-square rounded-[4rem] bg-stone-900 border-4 border-white shadow-2xl relative overflow-hidden group p-1">
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
               <div className="relative h-full w-full rounded-[3.8rem] overflow-hidden flex flex-col p-8 md:p-12 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl">
                        <i className="fas fa-atom animate-spin-slow"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Neural Core</p>
                        <p className="text-sm font-bold text-white uppercase tracking-tighter">System Pulse Active</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-indigo-400 uppercase">Yield Status</p>
                       <p className="text-3xl font-serif font-black text-white italic">+32.4%</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl space-y-3 cursor-default">
                        <i className="fas fa-wine-glass-alt text-indigo-400"></i>
                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Guest DNA</p>
                        <p className="text-xs text-white/90 italic font-medium">"Table 4 prefers high-tannin reds from Tuscany."</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl space-y-3 cursor-default">
                        <i className="fas fa-chart-line text-indigo-400"></i>
                        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">Inventory Node</p>
                        <p className="text-xs text-white/90 italic font-medium">"Barolo depletion at 84%. Auto-ordering enabled."</p>
                      </motion.div>
                    </div>

                    <div className="bg-indigo-600/20 backdrop-blur-xl border border-indigo-500/30 p-6 rounded-3xl flex items-center justify-between group/live">
                       <div className="space-y-1">
                         <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest">Revenue Velocity</p>
                         <p className="text-lg font-serif font-black text-white italic">Node Growth Target: 114%</p>
                       </div>
                       <div className="h-12 w-24 flex items-end gap-1">
                         {[1,2,3,4,5].map(i => (
                           <motion.div 
                             key={i}
                             animate={{ height: `${30 + Math.random() * 70}%` }}
                             transition={{ repeat: Infinity, duration: 1.5, repeatType: 'reverse', delay: i * 0.1 }}
                             className="flex-1 bg-indigo-500 rounded-t-sm"
                           />
                         ))}
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    <button 
                      onClick={scrollToSolutions}
                      className="px-8 py-4 bg-white text-stone-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-3 group/btn cursor-pointer"
                    >
                      See Our Full Suite
                      <i className="fas fa-arrow-right group-hover/btn:translate-x-1 transition-transform"></i>
                    </button>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>
            
      {/* Trust & Interop Bar */}
      <section className="bg-stone-50 border-y border-stone-100 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-8">
          <div className="flex items-center gap-3 border-r border-stone-200 pr-6 grayscale hover:grayscale-0 opacity-80 hover:opacity-100 transition-all">
            <AHLALogo height={18} theme="color" />
          </div>
          <div className="flex items-center gap-3 opacity-60 grayscale">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-tight">GDPR <br/> Compliant</span>
          </div>
          <div className="flex items-center gap-3">
            <i className="fas fa-plug text-lg text-indigo-600"></i>
            <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Native Interop <br/> Oracle / Toast / Olo</span>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-tight">ISO 27001 <br/> Certified Infrastructure</span>
          </div>
          <div className="flex items-center gap-3">
            <i className="fas fa-file-contract text-lg text-indigo-600"></i>
            <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Enterprise <br/> Service Level Agreement</span>
          </div>
          <div className="flex items-center gap-3">
            <i className="fas fa-lock text-lg text-indigo-600"></i>
            <span className="text-[10px] font-black uppercase tracking-widest leading-tight">AES-256 <br/> Data Encryption</span>
          </div>
        </div>
      </section>

      {/* Services & Offerings (Inspired by Restaurant Suite 360) */}
      <section id="solutions" className="py-24 md:py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16 md:mb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Solutions Suite</h2>
            <h3 className="text-3xl md:text-5xl font-serif font-black tracking-tighter leading-tight italic">Optimized for Operational Alpha.</h3>
            <p className="text-sm md:text-base text-stone-500 max-w-2xl mx-auto font-medium italic">We provide neural infrastructure and beverage intelligence for the world's most demanding establishments.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Predictive Inventory Nodes", 
                desc: "Real-time depletion alerts and automated restocking protocols optimized for high-velocity environments.",
                icon: "fa-box-open",
                link: "/platform"
              },
              { 
                title: "Staff Mastery Training", 
                desc: "AI-driven coaching nodes that transform staff into beverage experts through continuous micro-learning.",
                icon: "fa-user-graduate",
                link: "/academy"
              },
              { 
                title: "Neural Guest Analytics", 
                desc: "Deep pattern matching for personalized hospitality, decanting the perfect guest experience at scale.",
                icon: "fa-brain",
                link: "/intelligence"
              }
            ].map((service, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 md:p-10 bg-stone-50 border border-stone-100 rounded-[3rem] space-y-6 hover:bg-white hover:shadow-2xl transition-all group flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 text-2xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <i className={`fas ${service.icon}`}></i>
                  </div>
                  <h4 className="text-xl font-serif font-black italic">{service.title}</h4>
                  <p className="text-sm text-stone-500 font-medium leading-relaxed italic">{service.desc}</p>
                </div>
                <div className="pt-4 border-t border-stone-100/50">
                   <Link to={service.link} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 group/link">
                      Explore Module <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                   </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
             <Link to="/platform" className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors group">
               <span>Explore the Full 6-Module Platform Suite</span>
               <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        </div>
      </section>

      {/* Stats Matrix */}
      <section className="py-24 bg-white border-b border-stone-100">
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

      {/* Technical Infrastructure & Integrations */}
      <section className="py-32 px-6 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] ${textBrand400}">Deep Integration</h2>
               <h3 className="text-4xl md:text-6xl font-serif font-black italic tracking-tighter leading-none">Interoperable <br /> with your Tech Stack.</h3>
               <p className="text-stone-400 text-lg leading-relaxed italic">
                 {brandName} isn't a walled garden. We provide native interop nodes for the world's most trusted hospitality platforms, ensuring your neural data flows seamlessly across your entire operation.
               </p>
               
               <div className="grid grid-cols-2 gap-6 pt-8">
                  {[
                    { name: "Oracle Micros", type: "Full Bi-directional Sync" },
                    { name: "Toast POS", type: "Real-time Transaction Hooks" },
                    { name: "Mews PMS", type: "Guest Profile & Room Sync" },
                    { name: "Olo Ordering", type: "Off-premise Fulfillment" },
                    { name: "Stripe", type: "Neural Payment Hub" },
                    { name: "Salesforce", type: "Enterprise CRM Interop" }
                  ].map((tech, i) => (
                    <div key={i} className={`p-6 bg-white/5 border border-white/10 rounded-[2rem] ${borderBrand500_50} transition-colors`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${textBrand400} mb-1`}>{tech.name}</p>
                      <p className="text-[9px] text-white/50 font-medium italic">{tech.type}</p>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="relative">
               <div className={`aspect-square ${bgBrand500_10} rounded-full flex items-center justify-center relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,${isVinea ? '#f59e0b' : '#4f46e5'}_0%,transparent_70%)] opacity-30`}></div>
                  <div className="relative z-10 w-full p-12">
                     <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-8 rounded-[3rem] shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                           <div className={`text-[10px] font-black uppercase tracking-widest ${textBrand400}`}>Node Status</div>
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                        <div className="space-y-4">
                           <p className="text-xl font-serif font-bold italic">Neural Handshake Successful</p>
                           <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} transition={{ duration: 2 }} className={`h-full ${bgBrand500}`} />
                           </div>
                           <div className="grid grid-cols-2 gap-4 pt-4">
                              <div className="text-center">
                                 <p className="text-[8px] font-black text-white/40 uppercase">Latency</p>
                                 <p className="text-lg font-serif font-black">42ms</p>
                              </div>
                              <div className="text-center">
                                 <p className="text-[8px] font-black text-white/40 uppercase">Load Balance</p>
                                 <p className="text-lg font-serif font-black">Optimal</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Experience Section - Featuring Warm human hospitality */}
      <section className="py-24 md:py-32 px-6 bg-[#0c0e0e] text-white overflow-hidden relative border-y border-stone-800">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Integrated Harmony</h2>
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-serif font-black tracking-tighter leading-none italic">The Neural Experience.</h3>
            <p className="text-xs md:text-sm text-stone-400 font-medium max-w-xl mx-auto leading-relaxed italic">
              Our backend intelligence runs continuously behind the scenes so your team can focus on what truly matters: authentic, unforgettable guest connections and premium wine service.
            </p>
          </div>
          
          <div className="relative group max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-[3rem] blur-3xl opacity-50"></div>
            <div className="relative w-full rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl bg-stone-900">
               {/* Warm, friendly luxury dining image showing people clinking wine glasses and smiling */}
               <img 
                 src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1600" 
                 alt="Warm hospitality experience with wine service and happy guests"
                 className="w-full h-auto object-cover max-h-[500px]"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
               
               {/* Floating descriptive badge cards to overlay technology markers onto the warm dining scene */}
               <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left">
                 <div className="space-y-2 max-w-md bg-stone-900/95 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl">
                   <div className={`flex items-center gap-2 ${textBrand400} text-[10px] font-black uppercase tracking-widest`}>
                     <span className={`w-2 h-2 rounded-full ${bgBrand500} animate-pulse`}></span>
                     <span>Digital Cellar & Dining Harmony</span>
                   </div>
                   <h4 className="text-base font-serif font-bold italic text-white">Data-driven, humanly delivered.</h4>
                   <p className="text-[11px] text-stone-400 leading-relaxed font-medium">
                     Through passive POS mesh, real-time inventory adjustments, and conversational coaching nodes, {brandName} empowers your establishment with premium automation while amplifying classic hospitality.
                   </p>
                 </div>
                 
                 <div className="flex gap-3 flex-wrap">
                   <span className="px-4 py-2.5 bg-black/75 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-bold text-white flex items-center gap-2 shadow-lg">
                     <i className="fas fa-handshake text-emerald-400"></i>
                     Seamless Integrations
                   </span>
                   <span className="px-4 py-2.5 bg-black/75 backdrop-blur-md border border-white/10 rounded-xl text-[10px] font-bold text-white flex items-center gap-2 shadow-lg">
                     <i className="fas fa-wine-glass text-amber-400"></i>
                     Yield Optimization
                   </span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proven Process Section */}
      <section className="py-32 px-6 bg-[#0c0e0e] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Our Proven Process</h2>
                <h3 className="text-6xl font-serif font-black tracking-tighter leading-none italic">The Path to <br /> Restaurant Success.</h3>
              </div>
              
              <div className="space-y-10">
                {[
                  { step: "01", title: "Operational Audit", desc: "We dive deep into your establishment's workflow to understand your unique inventory and staffing challenges." },
                  { step: "02", title: "Custom Integration", desc: "A bespoke roadmap blending sensor nodes, predictive analytics, and operational intelligence." },
                  { step: "03", title: "Execution & Excellence", desc: "A rigorous rollout where we bring the strategy to life and optimize for performance." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className="text-4xl font-serif font-black text-indigo-500/30 group-hover:text-indigo-500 transition-colors">{item.step}</div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-serif font-black italic">{item.title}</h4>
                      <p className="text-stone-400 font-medium italic">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-indigo-600 rounded-full transform rotate-12 flex items-center justify-center p-20 shadow-2xl">
                <div className="text-center space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Ready to Grow?</p>
                  <p className="text-5xl font-serif font-black italic">Book Your <br /> Demo Today</p>
                  <button 
                    onClick={() => setActiveModal('demo')}
                    className="mt-8 px-10 py-5 bg-white text-indigo-600 rounded-full font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95"
                  >
                    Consultation Call
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Promo Showcase & Safe Sandbox Article */}
      <section className="py-24 md:py-32 px-6 bg-stone-50 border-y border-stone-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 md:gap-20 items-center">
          
          {/* Interactive Promo Film Player (Left / 7 Cols on lg) */}
          <div className="lg:col-span-7 space-y-6 relative order-2 lg:order-1">
            <div className="absolute -inset-10 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
            
            {/* Player Container */}
            <div className="relative z-10 bg-stone-900 rounded-[3rem] p-3 shadow-3xl border border-stone-800/80">
              {/* Screen Area */}
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-stone-950 flex flex-col justify-between p-8">
                {/* Dynamic Backgrounds matching video scenes */}
                <div className="absolute inset-0 z-0">
                  <div 
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-[1.5s] ease-in-out transform ${activePromoSlide === 0 ? 'opacity-30 scale-100' : 'opacity-0 scale-110'}`}
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1200')` }}
                  />
                  <div 
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-[1.5s] ease-in-out transform ${activePromoSlide === 1 ? 'opacity-30 scale-100' : 'opacity-0 scale-110'}`}
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=1200')` }}
                  />
                  <div 
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-[1.5s] ease-in-out transform ${activePromoSlide === 2 ? 'opacity-30 scale-100' : 'opacity-0 scale-110'}`}
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/20" />
                </div>

                {/* Top Overlay Bar */}
                <div className="relative z-10 flex justify-between items-center">
                  <span className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-black uppercase tracking-[0.2em] text-indigo-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block mr-1.5 animate-pulse"></span>
                    Brand Promo Loop
                  </span>
                  <div className="flex gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${activePromoSlide === 0 ? 'bg-indigo-500' : 'bg-white/30'}`} />
                    <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${activePromoSlide === 1 ? 'bg-indigo-500' : 'bg-white/30'}`} />
                    <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${activePromoSlide === 2 ? 'bg-indigo-500' : 'bg-white/30'}`} />
                  </div>
                </div>

                {/* Main Caption Displays - Mirroring the promo video frames exactly */}
                <div className="relative z-10 my-auto text-left max-w-2xl">
                  <AnimatePresence mode="wait">
                    {activePromoSlide === 0 && (
                      <motion.div 
                        key="slide0"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-3"
                      >
                        <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest font-mono">SCENE 01 // OPERATIONAL AUDIT</h4>
                        <h5 className="text-3xl md:text-4xl font-serif font-black tracking-tight leading-tight text-white italic">
                          Replace Chaos with Intelligence.
                        </h5>
                        <p className="text-stone-400 text-xs md:text-sm font-medium leading-relaxed italic">
                          When kitchen and cellar operations speed up, guesswork yields friction. Let automation do the heavy lifting.
                        </p>
                      </motion.div>
                    )}
                    
                    {activePromoSlide === 1 && (
                      <motion.div 
                        key="slide1"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-3"
                      >
                        <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest font-mono">SCENE 02 // MITIGATING ERROR RANGES</h4>
                        <h5 className="text-3xl md:text-4xl font-serif font-black tracking-tight leading-tight text-white italic">
                          Consistency • Inventory mistakes • Guest experience.
                        </h5>
                        <p className="text-stone-400 text-xs md:text-sm font-medium leading-relaxed italic">
                          Eradicate expensive manual counting errors. Protect margins and guarantee a premium guest journey.
                        </p>
                      </motion.div>
                    )}

                    {activePromoSlide === 2 && (
                      <motion.div 
                        key="slide2"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-3"
                      >
                        <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest font-mono">SCENE 03 // ACTIONABLE OPTIMIZATION</h4>
                        <h5 className="text-3xl md:text-4xl font-serif font-black tracking-tight leading-tight text-white italic">
                          See how predictive intelligence optimizes your floor, staff, and inventory right now.
                        </h5>
                        <p className="text-stone-400 text-xs md:text-sm font-medium leading-relaxed italic">
                          Seamlessly synchronize workflows. Instantly elevate junior staff members into master sommeliers.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Video Playback Subtitle Overlay */}
                <div className="relative z-10 flex justify-between items-end border-t border-white/5 pt-4 text-stone-500">
                  <span className={`text-[9px] font-mono uppercase tracking-widest font-black ${textBrand400}`}>
                    {activePromoSlide === 0 ? "01 / REPLACING CHAOS" : activePromoSlide === 1 ? "02 / PAIN POINTS" : "03 / THE REMEDY"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase">{brandName} OS</span>
                    <i className="fas fa-signal text-[8px] text-emerald-500 animate-pulse"></i>
                  </div>
                </div>
              </div>

              {/* Progress Playhead Line */}
              <div className="h-1.5 w-full bg-stone-950 relative overflow-hidden rounded-full mt-3">
                <motion.div 
                  key={activePromoSlide}
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 5, ease: 'linear' }}
                  className={`h-full ${bgBrand500}`}
                />
              </div>

              {/* Player Controllers */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-3 px-2">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPromoPlaying(!isPromoPlaying)}
                    className="w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-all cursor-pointer text-xs"
                    title={isPromoPlaying ? "Pause Video Simulation" : "Play Video Simulation"}
                  >
                    <i className={`fas ${isPromoPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                  </button>
                  <button 
                    onClick={() => {
                      setIsPromoPlaying(false);
                      setActivePromoSlide((prev) => (prev === 0 ? 2 : prev - 1));
                    }}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 transition-all cursor-pointer text-xs"
                    title="Previous Slide"
                  >
                    <i className="fas fa-backward"></i>
                  </button>
                  <button 
                    onClick={() => {
                      setIsPromoPlaying(false);
                      setActivePromoSlide((prev) => (prev + 1) % 3);
                    }}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/70 transition-all cursor-pointer text-xs"
                    title="Next Slide"
                  >
                    <i className="fas fa-forward"></i>
                  </button>
                </div>

                {/* Chapter Selectors */}
                <div className="flex gap-2 w-full sm:w-auto">
                  {[
                    { label: "01. BOH Chaos", index: 0 },
                    { label: "02. Core Errors", index: 1 },
                    { label: "03. Live Solution", index: 2 }
                  ].map((chapter) => (
                    <button
                      key={chapter.index}
                      onClick={() => {
                        setIsPromoPlaying(false);
                        setActivePromoSlide(chapter.index);
                      }}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border ${
                        activePromoSlide === chapter.index 
                          ? 'bg-indigo-600 text-white border-indigo-500' 
                          : 'bg-white/5 text-stone-400 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      {chapter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Promo Article Call-to-Action (Right / 5 Cols on lg) */}
          <div className="lg:col-span-5 space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Featured Promo Insight
              </span>
              <h3 className="text-4xl md:text-5xl font-serif font-black italic tracking-tighter leading-none text-stone-900">
                A Cure for <br /> Restaurant Chaos.
              </h3>
            </div>
            
            <div className="space-y-6 text-stone-600 font-medium leading-relaxed italic text-sm md:text-base">
              <p>
                Behind every exquisite service is a high-pressure dance of inventory depletions, team alignment, and guest intuition. Yet, legacy restaurant workflows too often mean constant firefighting—plagued by painful inventory mistakes, training lag, and lost revenue.
              </p>
              <p>
                Our promo film exposes this universal battleground. By layering predictive intelligence over your existing setup, {brandName} seamlessly takes the guesswork out of daily operations. We replace back-of-house friction with real-time operational alpha.
              </p>
            </div>

            {/* Premium Safe Sandbox Reassurance Container */}
            <div className="p-8 bg-white border border-stone-200 rounded-[2.5rem] space-y-5 shadow-xl shadow-stone-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-serif font-bold text-stone-900 italic text-base">Step In Safely & Confidently</h4>
              </div>
              
              <p className="text-xs text-stone-500 leading-relaxed italic font-medium">
                We believe you should see our software without barriers. Our interactive demo is a fully isolated, client-side sandbox. It is <strong className="text-stone-800 font-semibold">100% free, runs instantly in your browser, and requires no phone calls, no email lists, and no credit card</strong>. Feel completely secure to explore our operating tools at your own leisure.
              </p>

              <div className="pt-2">
                <button 
                  onClick={() => onEnterDemo?.()}
                  className={`w-full py-5 bg-stone-900 ${hoverBgBrand600} text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-stone-200 active:scale-95 flex items-center justify-center gap-3 cursor-pointer`}
                >
                  <span>Launch Safe Sandbox Demo</span>
                  <ArrowRight className="w-4 h-4 text-white/50" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Operating System Mockup Section */}
      <section className="py-32 px-6 bg-stone-50 border-t border-stone-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-24">
            <h2 className={`text-[10px] font-black uppercase tracking-[0.4em] ${textBrand600}`}>The Operating System</h2>
            <h3 className="text-5xl font-serif font-black tracking-tighter leading-tight italic">Inside the {brandName} App.</h3>
            <p className="text-xl text-stone-500 max-w-2xl mx-auto italic">A professional-grade interface for managers who demand absolute clarity and real-time control.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="bg-stone-900 rounded-[3rem] p-4 shadow-3xl border border-white/10 aspect-[4/5] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551218808-94e220e0349c?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-[3s]"></div>
                <div className="relative h-full flex flex-col justify-between p-10 bg-gradient-to-t from-stone-900 via-transparent to-transparent">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                      <i className="fas fa-microchip text-indigo-400"></i>
                    </div>
                    <div className="px-4 py-1.5 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 rounded-full">
                      <span className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">Live Engine v3.2</span>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Current Synthesis</p>
                       <p className="text-4xl font-serif font-bold text-white italic">Yield Alpha: 94.2%</p>
                    </div>
                    <div className="flex gap-3">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex-1 h-32 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex items-end p-2 overflow-hidden">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${20 + (i * 15)}%` }}
                            transition={{ duration: 1.5, delay: i * 0.1 }}
                            className="w-full bg-indigo-500" 
                          />
                        </div>
                      ))}
                    </div>
                    <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">AI Command Observation</p>
                      <p className="text-xs text-white/80 italic leading-relaxed">Service velocity in Sector 4 is peaking. Recommend deploying additional personnel to guest entry nodes.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -right-10 top-20 bg-white p-6 rounded-[2rem] shadow-2xl border border-stone-100 hidden lg:block animate-bounce-slow">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/20"><i className="fas fa-bolt"></i></div>
                   <div>
                     <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Real-time Pulse</p>
                     <p className="text-sm font-bold text-stone-900">Inventory Purge: 0.4s</p>
                   </div>
                 </div>
              </div>

              {/* Guest Recognition Badge */}
              <div className="absolute -left-12 bottom-40 bg-stone-900 p-6 rounded-[2rem] shadow-2xl border border-white/10 hidden lg:block">
                 <div className="space-y-3">
                   <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Guest Recognition</p>
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 border border-white/10 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover grayscale" alt="Guest" />
                      </div>
                      <p className="text-[10px] text-white/80 font-medium italic">"Welcome back, Alexander. Decanting your Barolo now."</p>
                   </div>
                 </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-4">
                <h4 className="text-2xl font-serif font-bold italic tracking-tight">The command center for your restaurant's future.</h4>
                <p className="text-stone-500 font-medium leading-relaxed italic">Our interface isn't just about showing numbers—it's about providing the exact right information at the exact right moment. We've stripped away the noise of legacy POS systems to give you a neural-link to your operation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { title: "Predictive Command", desc: "Never react again. See your stock depletion hours before it happens.", icon: "fa-eye" },
                  { title: "Service Synthesis", desc: "AI observes guest journeys and alerts you to bottlenecks before they frustrated guests.", icon: "fa-brain" },
                  { title: "Personnel Index", desc: "Deep metrics on staff performance that go beyond just 'sales per hour'.", icon: "fa-users" },
                  { title: "Revenue Velocity", desc: "Live tracking of average check size vs goal alignment.", icon: "fa-gauge-high" }
                ].map((feature, i) => (
                  <div key={i} className="space-y-3 p-6 bg-white rounded-3xl border border-stone-100 shadow-sm hover:border-indigo-600 transition-all cursor-default group">
                    <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <i className={`fas ${feature.icon}`}></i>
                    </div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-stone-900">{feature.title}</h5>
                    <p className="text-xs text-stone-500 italic leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-6">
                 <Link to="/platform" className="inline-flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-indigo-600 group">
                    Platform Deep Dive <i className="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
                 </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sleek Funnel Promo: Operational Leakage Audit Link */}
      <section className="py-24 px-6 bg-[#FDF8F0] border-t border-b border-stone-100">
         <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full text-[10px] font-black uppercase text-red-500 tracking-wider">
               <i className="fas fa-triangle-exclamation"></i> B2B Operational Risk Assessment
            </div>
            <div className="space-y-4">
               <h3 className="text-3xl md:text-5xl font-serif font-black tracking-tight text-stone-900 leading-tight">
                  Are you losing up to <span className="text-red-500 italic">12.5% of beverage revenue</span>?
               </h3>
               <p className="text-sm text-stone-500 max-w-xl mx-auto italic leading-relaxed">
                  Most upscale establishments suffer from silent spillage, manual inventory errors, and high-margin dead stock. Run your operational coordinates in our B2B calculator to see your custom report.
               </p>
            </div>
            <div>
               <Link 
                 to="/pricing" 
                 className={`inline-flex items-center gap-3 px-8 py-4.5 ${bgBrand600} text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-stone-900 shadow-xl ${shadowBrand100} active:scale-95 transition-all`}
               >
                  <span>Launch Margin Leakage Calculator</span>
                  <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
         </div>
      </section>



      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'demo' || activeModal === 'contact' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[100] flex items-center justify-center p-6 ${bgBrand950_60} backdrop-blur-md`}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl relative">
              <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 text-stone-400 hover:text-stone-900"><X className="w-6 h-6" /></button>
              <div className="grid md:grid-cols-5 h-full">
                <div className={`md:col-span-2 ${bgBrand600} p-12 text-white space-y-8`}>
                  <VinetelligenceLogo size="sm" withText={false} className="text-white" />
                <div className="space-y-2">
                   <h4 className="text-2xl font-serif font-black leading-tight text-white">{activeModal === 'demo' ? 'Strategic Consultation' : 'Growth Support'}</h4>
                   <p className="text-indigo-100 text-xs font-medium opacity-80 leading-relaxed italic">Learn how we can optimize your beverage operations through predictive intelligence and neural hospitality protocols.</p>
                </div>
                </div>
                <div className="md:col-span-3 p-12 space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Name</label>
                        <input type="text" value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} className="w-full px-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Email</label>
                        <input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} className="w-full px-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl text-sm outline-none" />
                      </div>
                    </div>
                    {emailError && <p className="text-red-500 text-[9px] font-black uppercase">{emailError}</p>}
                    <button onClick={handleLeadSubmit} disabled={isSubmitting} className={`w-full py-5 ${bgBrand600} text-white rounded-2xl font-black text-[10px] uppercase tracking-widest ${hoverBgBrand700} transition-all`}>{isSubmitting ? 'Syncing...' : 'Submit Request'}</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
        
        {activeModal === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[110] flex items-center justify-center p-6 ${bgBrand950_60} backdrop-blur-md`}>
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 max-w-sm text-center space-y-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><Check /></div>
                <h4 className="text-2xl font-serif font-black">Intel Received</h4>
                <p className="text-stone-500 text-sm">Our nodes are processing your request. We will synchronize shortly.</p>
                <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Close</button>
             </motion.div>
          </motion.div>
        )}

        {activeModal === 'verify' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[110] flex items-center justify-center p-6 ${bgBrand950_60} backdrop-blur-md`}>
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 max-w-md text-center space-y-8">
                <div className={`w-20 h-20 ${bgBrand500_10} ${textBrand600} rounded-full flex items-center justify-center mx-auto animate-pulse`}>
                  <Mail className="w-10 h-10" />
                </div>
                <div className="space-y-4">
                  <h4 className="text-3xl font-serif font-black italic">Verify Identity.</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">
                    A unique neural access key has been dispatched to <span className="text-indigo-600 font-bold">{leadForm.email}</span>. 
                    Please verify your professional credentials via the link to unlock the Interactive Onboarding.
                  </p>
                </div>
                <div className="pt-4 space-y-4">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-4 text-left">
                    <ShieldCheck className="text-emerald-500" />
                    <p className="text-[10px] font-black uppercase text-stone-400">Status: Waiting for Neural Handshake...</p>
                  </div>
                  <button 
                    onClick={() => {
                       onEnterDemo?.();
                    }}
                    className={`w-full py-5 ${bgBrand600} text-white rounded-2xl font-black text-[10px] uppercase tracking-widest ${hoverBgBrand700} transition-all shadow-xl ${shadowBrand100}`}
                  >
                    Neural Access Granted
                  </button>
                  <button onClick={() => setActiveModal(null)} className="text-[10px] font-black uppercase text-stone-400 tracking-widest hover:text-stone-600 transition-colors">Abort Access Request</button>
                </div>
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default Home;

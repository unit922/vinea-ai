import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight, ShieldCheck, Mail, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import VinetelligenceLogo from '../components/VinetelligenceLogo';

interface HomeProps {
  onLogin?: () => void;
  onEnterDemo?: () => void;
  onStartOnboarding?: () => void;
}

const Home: React.FC<HomeProps> = ({ onEnterDemo, onStartOnboarding }) => {
  const [activeModal, setActiveModal] = useState<'demo' | 'contact' | 'success' | 'verify' | null>(null);
  const [leadForm, setLeadForm] = useState({ name: '', email: '', establishment: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // ROI Calculator State
  const [monthlyRev, setMonthlyRev] = useState(50000);
  const [atrophyRate, setAtrophyRate] = useState(15);
  const calculatedEfficiency = (atrophyRate * 0.72).toFixed(1);
  const annualRecovery = Math.round(monthlyRev * 12 * (parseFloat(calculatedEfficiency) / 100));

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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                <i className="fas fa-chart-line"></i>
                Direct Sandbox Access — No Signup Required
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                v3.2.1 Online
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-black leading-tight tracking-tighter text-stone-900">
              Transform your <br />
              <span className="text-indigo-600 italic">Establishment in 48h.</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-xl font-medium">
              Vinetelligence is an 80% autonomous Neural Operating System. Skip the demo calls—launch our instant sandbox and see how predictive intelligence optimizes your floor, staff, and inventory right now.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => onEnterDemo?.()}
                className="px-10 py-5 bg-stone-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-stone-200 active:scale-95 flex items-center justify-center gap-3"
              >
                Instant Sandbox Access
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
                className="px-10 py-5 bg-white text-stone-900 border border-stone-200 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-stone-50 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                Initialize your Node
              </button>
            </div>
            
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex items-center gap-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Already a Partner?</p>
                 <button 
                   onClick={() => {
                     if (typeof window !== 'undefined' && window.location.hostname.includes('vinetelligence.live')) {
                       window.location.href = 'https://vinea.live?mode=login';
                       return;
                     }
                     onLogin?.();
                   }}
                   className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:scale-105 transition-all"
                 >
                   Sign In to your establishment
                 </button>
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
                      onClick={() => onEnterDemo?.()}
                      className="px-8 py-4 bg-white text-stone-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-3 group/btn"
                    >
                      Step Inside the Sandbox
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
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-60 grayscale">
          <div className="flex items-center gap-3">
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
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Deep Integration</h2>
               <h3 className="text-4xl md:text-6xl font-serif font-black italic tracking-tighter leading-none">Interoperable <br /> with your Tech Stack.</h3>
               <p className="text-stone-400 text-lg leading-relaxed italic">
                 Vinetelligence isn't a walled garden. We provide native interop nodes for the world's most trusted hospitality platforms, ensuring your neural data flows seamlessly across your entire operation.
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
                    <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:border-indigo-500/50 transition-colors">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{tech.name}</p>
                      <p className="text-[9px] text-white/50 font-medium italic">{tech.type}</p>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="relative">
               <div className="aspect-square bg-indigo-500/10 rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#4f46e5_0%,transparent_70%)] opacity-30"></div>
                  <div className="relative z-10 w-full p-12">
                     <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-8 rounded-[3rem] shadow-2xl space-y-6">
                        <div className="flex items-center justify-between">
                           <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Node Status</div>
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                        <div className="space-y-4">
                           <p className="text-xl font-serif font-bold italic">Neural Handshake Successful</p>
                           <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} transition={{ duration: 2 }} className="h-full bg-indigo-500" />
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

      {/* Services & Offerings (Inspired by Restaurant Suite 360) */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16 md:mb-24">
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
              },
              { 
                title: "Operations Command", 
                desc: "Executive-level visibility across all operational sectors with real-time health metrics.",
                icon: "fa-tower-control",
                link: "/platform"
              },
              { 
                title: "Yield Alpha Engine", 
                desc: "Dynamic optimization of high-margin beverage inventory to maximize every glass served.",
                icon: "fa-chart-pie",
                link: "/intelligence"
              },
              { 
                title: "Supply Chain Synthesis", 
                desc: "Automated integration with global premium distributors for frictionless procurement.",
                icon: "fa-truck-fast",
                link: "/pricing"
              }
            ].map((service, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-10 bg-stone-50 border border-stone-100 rounded-[3rem] space-y-6 hover:bg-white hover:shadow-2xl transition-all group flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 text-2xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <i className={`fas ${service.icon}`}></i>
                  </div>
                  <h4 className="text-xl font-serif font-black italic">{service.title}</h4>
                  <p className="text-sm text-stone-500 font-medium leading-relaxed italic">{service.desc}</p>
                </div>
                <div className="pt-4">
                   <Link to={service.link} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 group/link opacity-0 group-hover:opacity-100 transition-opacity">
                      Learn More <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                   </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-32 px-6 bg-[#0c0e0e] text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">See it in Action</h2>
            <h3 className="text-3xl md:text-5xl lg:text-7xl font-serif font-black tracking-tighter leading-none italic">The Neural Experience.</h3>
          </div>
          
          <div className="relative group max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-indigo-500/20 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl bg-stone-900">
               <video 
                 className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000"
                 muted loop playsInline autoPlay
                 poster="https://images.unsplash.com/photo-1551218808-94e220e0349c?auto=format&fit=crop&q=80&w=1200"
               >
                 <source src="https://assets.mixkit.co/videos/preview/mixkit-bartender-preparing-a-drink-86-large.mp4" type="video/mp4" />
               </video>
               
               {/* UI Overlays to simulate app interaction */}
               <div className="absolute top-10 left-10 space-y-4 animate-float">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl shadow-2xl">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                        <span className="text-[8px] font-black uppercase text-indigo-400">Neural Node Active</span>
                     </div>
                  </div>
               </div>

               <div className="absolute bottom-10 right-10 max-w-xs text-right space-y-4">
                 <p className="text-2xl font-serif font-black italic text-white leading-tight">"Mapping palate DNA in real-time..."</p>
                 <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]" 
                    />
                 </div>
               </div>
            </div>
          </div>
          
          <div className="pt-8">
            <div className="inline-flex flex-col items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 italic">Visual Showcase: Proprietary Node Logic</span>
              <div className="h-0.5 w-12 bg-indigo-500/30"></div>
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

      {/* Demo & Sandbox Experience Highlight */}
      <section className="py-32 px-6 bg-stone-50 border-y border-stone-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="absolute -inset-10 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="relative z-10 glass rounded-[3rem] border border-white/40 p-2 shadow-3xl bg-white">
              <div className="bg-stone-900 rounded-[2.8rem] overflow-hidden aspect-video border border-stone-800 shadow-inner flex items-center justify-center relative">
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                 <div className="text-center space-y-6 relative z-10 p-12">
                    <i className="fas fa-play-circle text-6xl text-white opacity-40 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"></i>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Launch Sandbox Interface</p>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="order-1 lg:order-2 space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 italic">Interactive Sandbox</h2>
            <h3 className="text-4xl md:text-6xl font-serif font-black italic tracking-tighter leading-none">Experience the <br /> System Today.</h3>
            <p className="text-lg text-stone-500 font-medium italic leading-relaxed">
              Why wait? Explore the full Vinetelligence suite in our synchronized sandbox. Test the "Staff Mastery" nodes, run a mock "Yield Alpha" report, and experience how "Guest Palate DNA" transforms service.
            </p>
            <div className="space-y-6 pt-4">
              {[
                "Zero-configuration demo environment",
                "Explore all Professional & Enterprise features",
                "Test AI interactions in real-time",
                "Instant local-first storage synchronization"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[8px] font-black">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 italic">{benefit}</span>
                </div>
              ))}
            </div>
            <div className="pt-6">
              <button 
                onClick={() => onEnterDemo?.()}
                className="px-14 py-6 bg-stone-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all shadow-2xl active:scale-95"
              >
                Launch Sandbox Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Operating System Mockup Section */}
      <section className="py-32 px-6 bg-stone-50 border-t border-stone-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-24">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Operating System</h2>
            <h3 className="text-5xl font-serif font-black tracking-tighter leading-tight italic">Inside the Vinetelligence App.</h3>
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

      {/* Competitive Edge - 2026 Horizon Comparison */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-24">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Competitive Landscape</h2>
            <h3 className="text-5xl font-serif font-black tracking-tighter leading-tight italic">2026 Horizon Comparison.</h3>
            <p className="text-xl text-stone-500 max-w-2xl mx-auto italic">How Vinetelligence outperforms legacy systems and emerging 2026 startups.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="py-8 px-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Capabilities</th>
                  <th className="py-8 px-4 text-[10px] font-black uppercase tracking-widest text-stone-900 border-l border-stone-100 bg-stone-50/50">Vinetelligence AI</th>
                  <th className="py-8 px-4 text-[10px] font-black uppercase tracking-widest text-stone-400">2026 Startups</th>
                  <th className="py-8 px-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Legacy Systems (Toast/Olo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  { feature: "Neural Inventory Sync", vt: "Native / Real-time", s26: "Partial / Manual", legacy: "Reactive / Lagged" },
                  { feature: "Guest Palate DNA", vt: "Generative AI Sync", s26: "Basic CRM", legacy: "Static Profile" },
                  { feature: "Operational Command", vt: "Executive Level", s26: "Standard Dashboard", legacy: "Tabular Lists" },
                  { feature: "AI Training Node", vt: "Bespoke / Multi-model", s26: "Generic LMS", legacy: "PDF / Video" },
                  { feature: "Prediction Horizon", vt: "72 Hours", s26: "24 Hours", legacy: "None (Historical only)" },
                  { feature: "Neural Personalization", vt: "Deep / Generative", s26: "Template Based", legacy: "Rigid / Standard" }
                ].map((row, i) => (
                  <tr key={i} className="group hover:bg-stone-50 transition-all">
                    <td className="py-6 px-4 text-xs font-bold text-stone-900">{row.feature}</td>
                    <td className="py-6 px-4 text-xs font-black text-indigo-600 border-l border-stone-100 bg-indigo-50/30">{row.vt}</td>
                    <td className="py-6 px-4 text-xs font-medium text-stone-500 italic">{row.s26}</td>
                    <td className="py-6 px-4 text-xs font-medium text-stone-400 italic line-through">{row.legacy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-20 p-10 bg-indigo-600 rounded-[3rem] text-center space-y-6 shadow-2xl">
             <p className="text-xl text-white italic max-w-2xl mx-auto">"Vinetelligence is the first system we've seen that actually understands the soul of hospitality while using the brain of silicon. It makes legacy systems look like typewriters."</p>
             <p className="text-[10px] font-black uppercase tracking-widest text-white/70">— Leading Hospitality Futurist, 2026</p>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section id="roi" className="py-20 md:py-32 px-6 bg-[#FDF8F0]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Growth Optimization</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-black leading-tight">Calculate your <br /> <span className="text-indigo-600 italic">Success Index.</span></h3>
            </div>
            <div className="space-y-12 md:pt-8">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Monthly Beverage Revenue</label>
                  <span className="text-lg md:text-xl font-serif font-black text-stone-900 italic">${monthlyRev.toLocaleString()}</span>
                </div>
                <input 
                  type="range" min="10000" max="500000" step="5000" value={monthlyRev}
                  onChange={(e) => setMonthlyRev(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Current Atrophy Rate (Loss)</label>
                  <span className="text-lg md:text-xl font-serif font-black text-red-500 italic">{atrophyRate}%</span>
                </div>
                <input 
                   type="range" min="5" max="35" step="1" value={atrophyRate}
                   onChange={(e) => setAtrophyRate(parseInt(e.target.value))}
                   className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>
          </div>
 
          <div className="bg-white p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-stone-100 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="space-y-8 md:space-y-12 relative">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-lg md:text-xl">
                      <i className="fas fa-chart-line-up"></i>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">Projected Annual Recovery</p>
                </div>
                <div className="space-y-2">
                   <p className="text-5xl md:text-7xl font-serif font-black text-indigo-600 tracking-tighter">${annualRecovery.toLocaleString()}</p>
                   <p className="text-[10px] md:text-[11px] font-bold text-stone-400 uppercase tracking-widest italic leading-relaxed">
                     Projected operational recovery through strategic <br className="hidden md:block" /> inventory & workforce optimization.
                   </p>
                </div>
                <button 
                  onClick={() => setActiveModal('demo')}
                  className="w-full py-4 md:py-5 bg-stone-900 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-100 active:scale-95"
                >
                  Download Growth Analysis
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {activeModal === 'demo' || activeModal === 'contact' ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-950/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl relative">
              <button onClick={() => setActiveModal(null)} className="absolute top-8 right-8 text-stone-400 hover:text-stone-900"><X className="w-6 h-6" /></button>
              <div className="grid md:grid-cols-5 h-full">
                <div className="md:col-span-2 bg-indigo-600 p-12 text-white space-y-8">
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
                    <button onClick={handleLeadSubmit} disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all">{isSubmitting ? 'Syncing...' : 'Submit Request'}</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
        
        {activeModal === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-indigo-950/60 backdrop-blur-md">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 max-w-sm text-center space-y-8">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><Check /></div>
                <h4 className="text-2xl font-serif font-black">Intel Received</h4>
                <p className="text-stone-500 text-sm">Our nodes are processing your request. We will synchronize shortly.</p>
                <button onClick={() => setActiveModal(null)} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Close</button>
             </motion.div>
          </motion.div>
        )}

        {activeModal === 'verify' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-indigo-950/60 backdrop-blur-md">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 max-w-md text-center space-y-8">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
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
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
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


import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Share2, 
  Brain, 
  Zap, 
  TrendingUp,
  Sparkles,
  MessageSquare,
  Globe,
  Copy,
  Download,
  Target,
  FlaskConical,
  Sprout,
  Crown,
  ShieldCheck,
  Barcode,
  AudioLines,
  Fingerprint,
  ChevronDown,
  Instagram,
  Linkedin as LinkedinIcon,
  Twitter
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { RestaurantProfile } from '../lib/types';
import { SectorInterestPoll } from './SectorInterestPoll';
import { APP_VERSION, CURRENT_YEAR } from '../constants';
import { getBrandedTerm } from '../utils/branding';

interface SocialPromoProps {
  profile: RestaurantProfile;
  onBack?: () => void;
  onUpdateProfile?: (key: keyof RestaurantProfile, value: string) => void;
  onNavigate?: (view: 'promo' | 'book' | 'menu') => void;
  onOpenAvatarChat?: () => void;
}

export const SocialPromo: React.FC<SocialPromoProps> = ({ profile, onBack, onUpdateProfile, onNavigate, onOpenAvatarChat }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [manualUrl, setManualUrl] = useState(profile?.manualPromoUrl || '');
  const [previewAesthetic, setPreviewAesthetic] = useState<'elite' | 'light'>(profile?.aesthetic === 'light' ? 'light' : 'elite');
  
  const previewProfile = React.useMemo(() => ({
    ...profile,
    aesthetic: previewAesthetic
  }), [profile, previewAesthetic]);
  
  const [promoContent, setPromoContent] = useState({
    headline: "Hospitality, Synthesized.",
    subheadline: "The world's most advanced AI ecosystem for high-end hospitality.",
    pitch: "Vinetelligence bridges the gap between traditional service and neural intelligence. By mapping palate DNA and predicting consumption velocity, we empower establishments to yield higher margins while delivering unparalleled guest experiences."
  });

  const shareUrl = React.useMemo(() => {
    if (profile?.manualPromoUrl) return profile.manualPromoUrl;
    if (profile?.slug) {
      return `${window.location.origin}/${profile.slug}`;
    }
    return `${window.location.origin}${window.location.pathname}?view=promo&rid=${profile.id}`;
  }, [profile.manualPromoUrl, profile.id, profile.slug]);

  const handleUpdateUrl = () => {
    if (onUpdateProfile) {
      onUpdateProfile('manualPromoUrl', manualUrl);
      setIsEditingUrl(false);
    }
  };

  // Simulate AI generation of promo content based on profile and preview aesthetic
  useEffect(() => {
    if (profile.name && profile.name !== 'Vinetelligence Explorer (Demo)') {
      const isLight = previewAesthetic === 'light';
      
      const genTimer = setTimeout(() => setIsGenerating(true), 10);
      
      const timer = setTimeout(() => {
        if (isLight) {
          setPromoContent({
            headline: `${profile.name}: Smarter Service.`,
            subheadline: `A Modern Assistant for ${profile.type || 'Hospitality'}.`,
            pitch: `At ${profile.name}, we use Vinetelligence to simplify our daily workflow. Our AI-powered assistant helps our staff master the menu and ensures we always have exactly what guests want in stock.`
          });
        } else {
          setPromoContent({
            headline: `${profile.name}: Redefined by Vinetelligence.`,
            subheadline: `Elevating ${profile.type || 'Hospitality'} through Neural Intelligence.`,
            pitch: `At ${profile.name}, we've integrated the Vinetelligence Intelligence Suite to master the art of the glass. From ${profile.focus || 'beverage'} precision to predictive guest mapping, our facility is now powered by the most advanced AI in the industry. (VinetelligenceOS v${APP_VERSION})`
          });
        }
        setIsGenerating(false);
      }, 800);
      return () => {
        clearTimeout(genTimer);
        clearTimeout(timer);
      };
    }
  }, [profile.name, profile.type, profile.focus, previewAesthetic]);

  const handleShare = async () => {
    if (navigator.share) {
      analyticsService.logEvent('Promo', 'Share Initiated', profile.name);
      try {
        await navigator.share({
          title: `Vinetelligence | ${profile.name} Promotion`,
          text: `Check out how ${profile.name} is using Vinetelligence AI to redefine hospitality.`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard for sharing!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-stone-100 font-sans selection:bg-indigo-500 selection:text-stone-950 overflow-x-hidden touch-scrolling">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-4 md:py-8 flex justify-between items-center bg-gradient-to-b from-stone-950/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-serif text-xl md:text-3xl font-black text-indigo-500 tracking-tighter italic uppercase">Vinetelligence</span>
          <span className="hidden sm:inline text-[10px] text-indigo-500 font-black ml-2 opacity-40 group-hover:opacity-100 transition-opacity">v{APP_VERSION}</span>
        </div>
        <div className="hidden md:flex gap-10">
          <a href="#vision" className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-white transition-all">Vision</a>
          <a href="#nodes" className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-white transition-all">Nodes</a>
          <a href="#security" className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-white transition-all">Security</a>
          <a href="#protocols" className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-white transition-all">Protocols</a>
        </div>
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="px-6 py-2 glass text-stone-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:text-white transition-all"
            >
              Command
            </button>
          )}
          <button 
            onClick={handleShare}
            className="px-8 py-3 bg-white text-stone-950 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-2xl flex items-center gap-2"
          >
            <Share2 className="w-3 h-3" />
            Share Repo
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-stone-950/60 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=2000&q=90" 
            className="w-full h-full object-cover scale-110 grayscale" 
            alt="Hero"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="relative z-20 max-w-6xl space-y-8 md:space-y-12">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-indigo-500 text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] md:tracking-[0.8em] inline-block mb-2 md:mb-4 animate-pulse"
          >
            Intelligence Suite {APP_VERSION}
          </motion.span>
            <h2 className="text-4xl sm:text-6xl md:text-[10rem] font-serif font-black italic tracking-tighter text-white leading-[0.9] md:leading-[0.85] select-none">
              {isGenerating ? (
                <span className="animate-pulse opacity-50 text-2xl md:text-6xl">Synthesizing...</span>
              ) : (
                <>
                  Hospitality,<br/><span className="text-stone-400">{previewAesthetic === 'light' ? 'Simplified.' : 'Synthesized.'}</span>
                </>
              )}
            </h2>
          
          {/* Aesthetic Toggle for Visitors */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-4 py-4 md:py-8"
          >
            <div className="bg-stone-900/80 backdrop-blur-3xl p-1 md:p-1.5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 flex flex-wrap justify-center gap-1 md:gap-2 shadow-2xl relative">
              <div className="hidden sm:block absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-indigo-500/60 font-mono">Switch Vision Protocol</span>
              </div>
              <button 
                onClick={() => setPreviewAesthetic('elite')}
                className={`px-4 md:px-8 py-2 md:py-3 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${previewAesthetic === 'elite' ? 'bg-indigo-500 text-stone-950 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-stone-500 hover:text-stone-300'}`}
              >
                <Brain className="w-3 h-3" />
                Elite
              </button>
              <button 
                onClick={() => setPreviewAesthetic('light')}
                className={`px-4 md:px-8 py-2 md:py-3 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${previewAesthetic === 'light' ? 'bg-amber-500 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-stone-500 hover:text-stone-300'}`}
              >
                <Sparkles className="w-3 h-3" />
                Light
              </button>
            </div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base md:text-3xl text-stone-300 max-w-3xl mx-auto font-medium italic leading-relaxed opacity-90 px-4"
          >
            "{isGenerating ? "Predicting market velocity..." : promoContent.subheadline}"
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-8 px-4"
          >
            <button 
              onClick={() => {
                const isEnterprise = profile.name?.toLowerCase().includes('enterprise');
                if (isEnterprise) {
                  const el = document.getElementById('protocols');
                  el?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  onNavigate?.('book');
                }
              }}
              className="w-full sm:w-auto px-8 md:px-14 py-4 md:py-6 bg-indigo-600 hover:bg-indigo-50 text-white rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] transition-all shadow-[0_0_50px_rgba(79,70,229,0.3)] active:scale-95"
            >
              {profile.name?.toLowerCase().includes('enterprise') ? 'Explore Protocols' : 'Launch Facility'}
            </button>
            <button 
              onClick={() => {
                analyticsService.logEvent('Promo', 'Navigate to Manifesto');
                const el = document.getElementById('vision');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 md:px-14 py-4 md:py-6 glass text-white rounded-full font-black text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-white/10 transition-all active:scale-95 font-serif italic"
            >
              View Manifesto
            </button>
          </motion.div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 animate-bounce text-stone-500">
          <ChevronDown className="w-8 h-8" />
        </div>
      </section>

      {/* The Core Pillars (Scholar Node) */}
      <section id="vision" className="py-40 px-8 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px]"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-6xl font-serif font-black italic text-white tracking-tighter leading-none">
                {previewAesthetic === 'light' ? 'The Team Helper' : getBrandedTerm('scholar_node', previewProfile)}
              </h2>
              <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.4em]">
                {previewAesthetic === 'light' ? 'Easy Staff Support' : 'Integrated Beverage Academy'}
              </p>
            </div>
            <p className="text-stone-400 text-2xl leading-relaxed font-medium italic">
              {previewAesthetic === 'light' 
                ? "Stop struggling with difficult guest questions. Vinetelligence Light acts as a simple digital assistant that anyone on your team can use to get instant info on drinks, specials, and service basics."
                : "Stop searching for answers. Start knowing them. Vinetelligence provides your team with a real-time, high-fidelity knowledge base covering global wine regions, spirit chemistry, and historical origins."
              }
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 glass rounded-[2.5rem] space-y-4 hover:border-indigo-500/30 transition-all group">
                <AudioLines className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-lg">{previewAesthetic === 'light' ? 'Simple Voice Chat' : 'Live AI Coaching'}</h4>
                <p className="text-sm text-stone-500 leading-relaxed italic">{previewAesthetic === 'light' ? 'Just ask your phone a question about any drink on the menu to get a quick, easy answer.' : 'Multimodal voice AI for floor staff training and product specialization briefings.'}</p>
              </div>
              <div className="p-8 glass rounded-[2.5rem] space-y-4 hover:border-indigo-500/30 transition-all group">
                <Zap className="w-8 h-8 text-indigo-500 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-lg">{previewAesthetic === 'light' ? 'Daily Cheat Sheet' : 'Tactical Flash Drills'}</h4>
                <p className="text-sm text-stone-500 leading-relaxed italic">{previewAesthetic === 'light' ? 'A quick 2-minute update every day to keep the team informed on what\'s important.' : 'High-speed technical verification for staff members during shift prep.'}</p>
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-[4rem] blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
            <img 
              src="https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=1200&q=80" 
              className="relative z-10 w-full aspect-square object-cover rounded-[4rem] border border-white/10 grayscale group-hover:grayscale-0 transition-all duration-1000 shadow-2xl" 
              alt="Team Helper"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Operational Command (The "Why") */}
      <section id="nodes" className="py-40 bg-stone-100 text-stone-900 border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-3xl mx-auto mb-32 space-y-6">
            <h2 className="text-7xl font-serif font-black italic tracking-tighter leading-none">
              {previewAesthetic === 'light' ? 'Simple Growth.' : (getBrandedTerm('yield_alpha', previewProfile) + '.')}
            </h2>
            <p className="text-stone-500 text-xl font-medium italic leading-relaxed">
              {previewAesthetic === 'light' 
                ? "Vinetelligence tracks what your customers love and helps you order the right amount. It is like having a smart stock manager that never sleeps."
                : "Vinetelligence doesn't just manage your inventory—it predicts the next glass. By bridging consumption velocity with regional trends, we increase your net beverage margin by up to 14.2%."
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-12 rounded-[4rem] shadow-xl space-y-8 group hover:-translate-y-2 transition-all">
              <div className="w-16 h-16 bg-stone-950 text-indigo-500 rounded-3xl flex items-center justify-center text-2xl shadow-lg">
                <Barcode className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-serif font-bold italic">{previewAesthetic === 'light' ? 'Inventory Scan' : 'Vision Audits'}</h3>
              <p className="text-stone-500 leading-relaxed italic">{previewAesthetic === 'light' ? 'Take a photo of your shelves to update the system. No more manual counting or spreadsheets.' : 'Point your camera at the bar. AI identifies brand, fill levels, and identifies shrinkage in 42ms.'}</p>
            </div>
            <div className="bg-white p-12 rounded-[4rem] shadow-xl space-y-8 group hover:-translate-y-2 transition-all">
              <div className="w-16 h-16 bg-stone-950 text-indigo-500 rounded-3xl flex items-center justify-center text-2xl shadow-lg">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-serif font-bold italic">{previewAesthetic === 'light' ? 'Stock Helper' : 'Demand Forecast'}</h3>
              <p className="text-stone-500 leading-relaxed italic">{previewAesthetic === 'light' ? 'Get a weekly heads-up on what you need to order so you never run out of favorites.' : 'Predictive logistics engine that tells you exactly what to order before the rush arrives.'}</p>
            </div>
            <div className="bg-white p-12 rounded-[4rem] shadow-xl space-y-8 group hover:-translate-y-2 transition-all">
              <div className="w-16 h-16 bg-stone-950 text-indigo-500 rounded-3xl flex items-center justify-center text-2xl shadow-lg">
                <Fingerprint className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-serif font-bold italic">{previewAesthetic === 'light' ? 'Guest Book' : getBrandedTerm('palate_dna', previewProfile)}</h3>
              <p className="text-stone-500 leading-relaxed italic">{previewAesthetic === 'light' ? 'Remind your staff of what regular guests like to drink, making them feel right at home.' : 'Map every guest\'s flavor profile. SevenRooms integration for high-value pre-arrival outreach.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Market Intelligence Poll Section */}
      <section className="py-32 px-8 bg-[#0c0a09]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-serif font-black italic text-white tracking-tighter">
              Shape the <span className="text-indigo-500">Future</span>
            </h2>
            <p className="text-stone-500 text-lg italic max-w-2xl mx-auto">
              We are building Vinetelligence in collaboration with the world's leading hospitality groups. Cast your vote on our development roadmap.
            </p>
          </div>
          <SectorInterestPoll />
        </div>
      </section>

      {/* Institutional Intelligence Section */}
      <section className="py-32 px-8 bg-stone-900/30 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          <div className="text-center mb-16 space-y-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[8px] font-black uppercase tracking-widest mb-4">
                <Sparkles className="w-2 h-2" /> Ecosystem Alpha
             </div>
             <h2 className="text-4xl md:text-6xl font-serif font-black italic text-white tracking-tighter">Institutional Assets</h2>
             <p className="text-stone-500 text-lg italic max-w-2xl mx-auto">Standardized protocol briefings for our partner network.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            {[
              {
                id: 'platform',
                title: 'The Vinetelligence Ecosystem',
                icon: <Brain className="w-6 h-6 text-indigo-500" />,
                content: "Vinetelligence bridges the gap between traditional service and neural intelligence. By mapping palate DNA and predicting consumption velocity, we empower establishments to yield higher margins while delivering unparalleled guest experiences.",
                tags: ["#HospitalitySynthesized", "#VinetelligenceAI"]
              },
              {
                id: 'architecture',
                title: 'Architecture Protocols',
                icon: <Target className="w-6 h-6 text-indigo-500" />,
                content: "Select your protocol. From the local 'Explorer' sandbox to the enterprise-grade 'Architect' silo, Vinetelligence scales with your vision. Higher tiers unlock multimodal vision audits, predictive pricing, and investor intelligence nodes.",
                tags: ["#VinetelligenceOS", "#Tiers"]
              }
            ].map((asset, i) => (
              <div key={i} className="group p-10 glass rounded-[3rem] border border-white/5 hover:border-white/10 transition-all space-y-8 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                      {asset.icon}
                    </div>
                    <h3 className="text-2xl font-serif font-black italic text-white">{asset.title}</h3>
                   </div>
                  <a 
                    href="/vinetelligence_logo.svg" 
                    download="vinetelligence_logo.svg"
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-stone-500 hover:text-indigo-500 transition-all active:scale-95 group/down"
                    title="Download Brand Asset"
                  >
                    <Download className="w-4 h-4 group-hover/down:translate-y-0.5 transition-transform" />
                  </a>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${asset.content} ${asset.tags.join(' ')}`);
                      alert("Asset copied to clipboard!");
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-stone-500 hover:text-indigo-500 transition-all active:scale-95"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-black/40 rounded-2xl p-6 relative z-10 border border-white/5">
                  <p className="text-sm text-stone-300 italic leading-relaxed">"{asset.content}"</p>
                </div>
                <div className="flex flex-wrap gap-2 relative z-10">
                   {asset.tags.map((tag, j) => (
                     <span key={j} className="text-[10px] font-black uppercase tracking-widest text-stone-600 bg-white/5 px-3 py-1 rounded-full border border-white/5">{tag}</span>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Data Integrity Section */}
      <section id="security" className="py-40 px-8 relative bg-stone-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="absolute -inset-10 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="relative z-10 p-12 glass rounded-[3rem] border border-white/10 space-y-8">
                <div className="w-16 h-16 bg-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h2 className="text-4xl md:text-5xl font-serif font-black italic text-white tracking-tight">The Vinetelligence Fortress</h2>
                <div className="space-y-6">
                  {[
                    { title: "Zero-Trust Architecture", desc: "No direct database access. Every request is verified via cryptographically secure server clusters." },
                    { title: "Full Code Obfuscation", desc: "Production nodes run on hardened, obfuscated bytecode to prevent reverse-engineering of proprietary logic." },
                    { title: "PII Anonymization", desc: "Guest data is scrubbed of identifying information before being processed by neural models." },
                    { title: "Point-in-Time Backups", desc: "Real-time state replication ensures zero data loss even in the event of hardware failures." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0 group-hover:scale-150 transition-transform"></div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">{item.title}</h4>
                        <p className="text-xs text-stone-500 italic leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-12">
              <h3 className="text-6xl font-serif font-black italic text-white tracking-tighter leading-none">Security is our <span className="text-indigo-500">DNA.</span></h3>
              <p className="text-xl text-stone-400 italic leading-relaxed">
                "We understand that hospitality is built on trust. Vinetelligence is engineered from the ground up to protect establishment secrets and guest privacy with the same intensity we apply to beverage intelligence."
              </p>
              <div className="grid grid-cols-2 gap-8 text-center pt-8">
                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10">
                  <p className="text-4xl font-serif font-black text-indigo-500 italic">256-bit</p>
                  <p className="text-[9px] font-black uppercase text-stone-500 tracking-[0.3em] mt-2">AES Encryption</p>
                </div>
                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10">
                  <p className="text-4xl font-serif font-black text-indigo-500 italic">SOC 2</p>
                  <p className="text-[9px] font-black uppercase text-stone-500 tracking-[0.3em] mt-2">Compliance Ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Protocols (Tiers) */}
      <section id="protocols" className="py-40 px-8 relative bg-stone-950/50">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6">
            <h2 className="text-6xl font-serif font-black italic text-white tracking-tight leading-none">System Protocols</h2>
            <p className="text-stone-500 text-sm uppercase tracking-[0.5em] font-black">Architecture Tier Availability</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                tier: "The Explorer",
                icon: <FlaskConical className="w-8 h-8 text-indigo-500" />,
                scope: "Local Sandbox",
                desc: "Strictly anonymous local session storage. Designed for rapid operational prototyping and staff training nodes.",
                features: ["Local Persistance", "Scholar Node"],
                cta: "Initialize",
                link: "/?tier=explorer"
              },
                {
                  tier: "The Essential",
                  icon: <Sprout className="w-8 h-8 text-indigo-500" />,
                  scope: "Cloud Sync",
                  desc: "Authenticated access with managed Supabase backups. Scalable for single-unit professional venues.",
                  features: ["Cloud Profiles", "POS Interface"],
                  cta: "Start 14d Trial",
                  link: "/?mode=demo&tier=operator"
                },
                {
                  tier: "The Growth",
                  icon: <Crown className="w-8 h-8 text-indigo-500" />,
                  scope: "Full Intelligence",
                  desc: "The complete Vinetelligence suite. Multimodal vision audits, predictive pricing, and investor intelligence.",
                  features: ["Predictive Alpha", "Vision Audits", "Signature Lab"],
                  cta: "Start 14d Trial",
                  link: "/?mode=demo&tier=visionary",
                  featured: true
                },
              {
                tier: "The Enterprise",
                icon: <ShieldCheck className="w-8 h-8 text-indigo-500" />,
                scope: "Private Silos",
                desc: "Enterprise-grade security. Dedicated data silos, custom model tuning, and multi-unit network command.",
                features: ["Managed Backend", "Multi-Unit Sync"],
                cta: "Enterprise Inquiry",
                link: "mailto:business@vinetelligence.live"
              }
            ].map((tier, i) => (
              <div 
                key={i} 
                className={`p-10 rounded-[3rem] flex flex-col space-y-12 transition-all ${
                  tier.featured 
                    ? 'bg-indigo-500 shadow-[0_20px_60px_rgba(79,70,229,0.2)] scale-105 z-10' 
                    : 'glass hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {tier.icon}
                  </div>
                  <h4 className={`text-2xl font-serif font-bold italic leading-none ${tier.featured ? 'text-stone-950' : 'text-white'}`}>{tier.tier}</h4>
                  <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-2 py-1 rounded inline-block ${tier.featured ? 'bg-black/5 text-stone-900/60' : 'bg-white/5 text-stone-500'}`}>{tier.scope}</span>
                </div>
                <p className={`text-xs leading-relaxed flex-1 italic ${tier.featured ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>{tier.desc}</p>
                <ul className={`space-y-3 text-[10px] font-bold uppercase tracking-widest ${tier.featured ? 'text-stone-900' : 'text-stone-500'}`}>
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                       <div className={`w-1 h-1 rounded-full ${tier.featured ? 'bg-stone-900' : 'bg-rose-500'}`}></div>
                       {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => {
                    if (tier.link.startsWith('mailto')) {
                      window.location.href = tier.link;
                    } else if (tier.link.startsWith('/?mode=demo')) {
                      window.location.href = tier.link;
                    } else if (tier.tier === "The Explorer") {
                      window.location.href = '/?mode=demo';
                    } else {
                      window.location.href = `mailto:business@vinetelligence.live?subject=Vinetelligence Inquiry: ${tier.tier} Protocol`;
                    }
                  }}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${
                    tier.featured 
                      ? 'bg-stone-950 text-white hover:bg-stone-800 shadow-2xl' 
                      : 'glass hover:bg-white hover:text-stone-950'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Matrix */}
      <section className="py-40 bg-stone-900 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="space-y-2">
            <p className="text-5xl font-serif font-black italic text-indigo-500">42ms</p>
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">AI Latency</p>
          </div>
          <div className="space-y-2">
            <p className="text-5xl font-serif font-black italic text-indigo-500">50k+</p>
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Labels Mapped</p>
          </div>
          <div className="space-y-2">
            <p className="text-5xl font-serif font-black italic text-indigo-500">14.2%</p>
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Yield Delta</p>
          </div>
          <div className="space-y-2">
            <p className="text-5xl font-serif font-black italic text-indigo-500">99.8%</p>
            <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Uptime Index</p>
          </div>
        </div>
      </section>

      {/* URL Configuration Section - Only visible to owners/managers */}
      {onUpdateProfile && (
        <section className="py-20 px-8 bg-stone-950">
          <div className="max-w-2xl mx-auto p-12 glass rounded-[3rem] border border-white/10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-rose-500" />
                <h3 className="text-xl font-serif font-black italic text-white leading-none">Relay Node Configuration</h3>
              </div>
              <button 
                onClick={() => setIsEditingUrl(!isEditingUrl)}
                className="text-[10px] font-black uppercase text-stone-500 hover:text-white transition-colors"
              >
                {isEditingUrl ? 'Cancel' : 'Manage Relay'}
              </button>
            </div>

            {isEditingUrl ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-stone-500 ml-2 tracking-widest">Manual Promo URL</label>
                  <input 
                    type="text"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://vinetelligence.live/your-venue"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-rose-500 transition-all font-mono"
                  />
                </div>
                <button 
                  onClick={handleUpdateUrl}
                  className="w-full py-5 bg-indigo-500 text-stone-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl active:scale-95"
                >
                  Sync Relay Node
                </button>
              </div>
            ) : (
              <div className="p-8 bg-stone-900/50 rounded-2xl border border-white/5 flex items-center justify-between group">
                <div className="truncate mr-4">
                  <p className="text-[9px] font-black uppercase text-stone-500 tracking-widest mb-2">Active Relay URL</p>
                  <p className="text-xs text-stone-300 font-mono truncate">{shareUrl}</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert("Relay URL copied to clipboard.");
                  }}
                  className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-stone-500 hover:text-indigo-500 transition-all active:scale-90"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            )}
            <p className="text-[11px] text-stone-600 italic text-center leading-relaxed">
              "Override the default Vinetelligence intelligence relay with your custom domain or strategic landing page."
            </p>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-40 px-8 text-center bg-gradient-to-b from-stone-950 to-stone-900 border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-16">
          <h2 className="text-5xl md:text-8xl font-serif font-black italic text-white tracking-tighter leading-tight">
            Ready to <span className="text-indigo-500">Initialize?</span>
          </h2>
          <p className="text-stone-500 text-2xl font-medium italic max-w-2xl mx-auto leading-relaxed">
            Join the network of elite establishments redefining the hospitality landscape with Vinetelligence AI.
          </p>
          <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
            <button 
              onClick={() => {
                analyticsService.logEvent('Promo', 'Initialize Demo Clicked', profile.name);
                // Return to top or lead to demo for inquiry establishment
                window.location.href = '/?mode=demo';
              }}
              className="px-16 py-8 bg-indigo-500 text-stone-950 rounded-full font-black text-xs uppercase tracking-[0.5em] hover:bg-white transition-all shadow-[0_0_60px_rgba(79,70,229,0.2)] active:scale-95"
            >
              Initialize Demo
            </button>
            <button 
              onClick={() => {
                analyticsService.logEvent('Promo', 'Brief Agent Clicked');
                onOpenAvatarChat?.();
              }}
              className="px-16 py-8 glass text-white rounded-full font-black text-xs uppercase tracking-[0.5em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95"
            >
              <MessageSquare className="w-5 h-5" />
              {getBrandedTerm('brief_agent', previewProfile)}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-40 px-8 text-center border-t border-white/5 bg-[#0c0a09]">
        <div className="max-w-3xl mx-auto space-y-20">
          <div className="space-y-8">
            <h1 className="font-serif text-8xl md:text-9xl font-black text-indigo-500 italic tracking-tighter uppercase indigo-glow">Vinetelligence</h1>
            <p className="text-stone-400 text-2xl font-medium italic">"The future of beverage intelligence, realized."</p>
          </div>
          
          <div className="flex flex-col items-center gap-12">
            <div className="flex gap-16 text-stone-600">
              <Instagram className="w-6 h-6 hover:text-indigo-500 cursor-pointer transition-colors" />
              <LinkedinIcon className="w-6 h-6 hover:text-indigo-500 cursor-pointer transition-colors" />
              <Twitter className="w-6 h-6 hover:text-indigo-500 cursor-pointer transition-colors" />
            </div>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-10 text-[10px] font-black uppercase tracking-[0.4em] text-stone-700">
                {profile.email && <span>{profile.email}</span>}
                <span className="hidden md:inline">•</span>
                <span>Hospitality Synthesized</span>
                <span className="hidden md:inline">•</span>
                <span>Facility Node {profile.id?.substring(0, 8)}</span>
              </div>
              <p className="text-stone-800 text-[11px] font-black uppercase tracking-[0.6em] animate-pulse">© {CURRENT_YEAR} VINETELLIGENCE INTELLIGENCE SUITE</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

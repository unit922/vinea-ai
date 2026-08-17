import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, GraduationCap, Users, Sparkles, Award, Star, Presentation, Youtube, Layout } from 'lucide-react';
import { CanvaEditor } from '../components/CanvaEditor';
import { YouTubeOptimizer } from '../components/YouTubeOptimizer';

interface AcademyProps {
  onEnterDemo?: () => void;
  onStartOnboarding?: () => void;
}

const Academy: React.FC<AcademyProps> = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'curriculum' | 'canva' | 'youtube'>('curriculum');

  // Scroll helper if they choose to scroll down, or toggle tab state
  const handleTabClick = (tab: 'all' | 'curriculum' | 'canva' | 'youtube') => {
    setActiveTab(tab);
    // Smooth scroll down to content after slight delay to allow rendering if needed
    setTimeout(() => {
      const element = document.getElementById('academy-workspace-anchor');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="pt-24 min-h-screen bg-[#FDF8F0]">
      {/* Academy Hero */}
      <section className="py-12 md:py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Brand Mastery Academy</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-8xl font-serif font-black leading-tight tracking-tighter text-stone-900 italic">
              Success <br /> Simplified.
            </h1>
            <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-xl font-medium">
              We provide the tools and training to transform your staff into brand advocates. From visual story-telling to intelligent guest interaction, we empower your team to drive real success and conversions.
            </p>

            {/* QUICK ACTIONS SELECTOR - EXTREMELY VISIBLE FOR DIRECT INTERACTION */}
            <div className="space-y-4 pt-4 border-t border-stone-200">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Select Workspace Module:</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'all', label: 'Show All Modules', icon: <Layout className="w-3.5 h-3.5" /> },
                  { id: 'curriculum', label: 'Brand Mastery', icon: <BookOpen className="w-3.5 h-3.5" /> },
                  { id: 'canva', label: 'Deck Co-Pilot', icon: <Presentation className="w-3.5 h-3.5 text-indigo-500" /> },
                  { id: 'youtube', label: 'Video Intelligence', icon: <Youtube className="w-3.5 h-3.5 text-red-500" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id as 'all' | 'curriculum' | 'canva' | 'youtube')}
                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border outline-none cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-stone-900 text-white border-stone-900 shadow-md transform -translate-y-0.5'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-200'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-[4rem] bg-stone-900 overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=2070&auto=format&fit=crop" 
                alt="Hospitality Training" 
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent"></div>
              <div className="absolute bottom-12 left-12 right-12 space-y-6">
                <div className="p-6 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Training Delta</p>
                    <Star className="text-yellow-400 w-4 h-4 fill-yellow-400" />
                  </div>
                  <p className="text-4xl font-serif font-black text-white italic">+42% Knowledge Index</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Anchor for workspace navigation scrolling */}
      <div id="academy-workspace-anchor" className="scroll-mt-24" />

      {/* Tab-driven visual panel layouts */}
      
      {/* 1. CURRICULUM SECTION */}
      {(activeTab === 'all' || activeTab === 'curriculum') && (
        <section className="py-24 bg-white border-t border-stone-200/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center space-y-4 mb-20">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Curriculum</h2>
              <h3 className="text-4xl font-serif font-black text-stone-900 italic">Enablement for Growth.</h3>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: <BookOpen />, title: "Brand DNA", desc: "Understanding the core values and story that define your establishment." },
                { icon: <Users />, title: "Guest Connection", desc: "Building authentic rapport and creating memorable experiences for every guest." },
                { icon: <GraduationCap />, title: "Micro-Upselling", desc: "Strategic techniques to increase average check size through value-led suggestions." },
                { icon: <Award />, title: "Service Excellence", desc: "Refining the technical and emotional aspects of professional hospitality." }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-10 bg-stone-50 rounded-[3rem] border border-stone-100 space-y-6 hover:shadow-xl transition-all h-full"
                >
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                    {item.icon}
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-xl font-serif font-black">{item.title}</h4>
                    <p className="text-stone-500 text-sm font-medium leading-relaxed italic">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. CANVA CUSTOMIZER SECTION */}
      {(activeTab === 'all' || activeTab === 'canva') && (
        <section id="canva-booster-session" className="py-24 bg-stone-100 border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center space-y-4 max-w-xl mx-auto">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Dynamic Workshop</h2>
              <h3 className="text-4xl font-serif font-black text-stone-900 italic">Canva Presentation Co-Pilot.</h3>
              <p className="text-stone-500 text-xs md:text-sm font-medium">Customize the 15-page Service Excellence presentation you uploaded. Swap generic placeholders with customized high-conversions narratives instantly.</p>
            </div>
            
            <div className="bg-white rounded-[4rem] p-8 md:p-14 border border-stone-200 shadow-xl">
              <CanvaEditor />
            </div>
          </div>
        </section>
      )}

      {/* 3. YOUTUBE OPTIMIZER SECTION */}
      {(activeTab === 'all' || activeTab === 'youtube') && (
        <section id="youtube-optimizer-session" className="py-24 bg-white border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center space-y-4 max-w-xl mx-auto">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600">Broadcast Creator Studio</h2>
              <h3 className="text-4xl font-serif font-black text-stone-900 italic">Video Engagement & script Catalyst.</h3>
              <p className="text-stone-500 text-xs md:text-sm font-medium">Analyze your latest YouTube metrics, optimize strategic script hooks, and capture high-intent leads before they click away.</p>
            </div>
            
            <div className="bg-stone-50 rounded-[4rem] p-8 md:p-14 border border-stone-200 shadow-xl">
              <YouTubeOptimizer />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Academy;

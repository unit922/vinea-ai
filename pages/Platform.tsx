
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ComparisonMatrix from '../components/ComparisonMatrix';
import PartnerNetwork from '../components/PartnerNetwork';
import BlogSection from '../components/BlogSection';

interface PlatformProps {
  onEnterDemo?: () => void;
  onStartOnboarding?: () => void;
}

const Platform: React.FC<PlatformProps> = ({ onEnterDemo, onStartOnboarding }) => {
  const navigate = useNavigate();
  return (
    <div className="pt-24 min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-24 px-6 text-center space-y-8 bg-stone-50">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Infrastructure</h2>
        <h1 className="text-3xl md:text-8xl font-serif font-black leading-tight tracking-tighter text-stone-900 italic">
          Engineering <br /> Hospitality.
        </h1>
        <p className="text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto font-medium italic">
          Vinetelligence isn't just an app—it's a neural operating system designed specifically for the complexities of high-end establishments.
        </p>
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic flex items-center gap-2 justify-center">
          <i className="fas fa-desktop text-xs"></i>
          Optimization Note: Laptop or Tablet recommended for full experience.
        </p>
      </section>

      {/* Core Modules Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          
          {/* Module 1: Intelligence Engine */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
               <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl shadow-xl shadow-stone-200">
                  <i className="fas fa-brain-circuit"></i>
               </div>
               <div className="space-y-4">
                  <h3 className="text-4xl font-serif font-black italic">Intelligence Engine</h3>
                  <p className="text-stone-500 font-medium leading-relaxed italic">
                    The core of our platform uses generative models to analyze inventory velocity and guest preferences. It doesn't just track stock; it predicts when you'll run out and suggests order quantities optimized for your specific revenue goals.
                  </p>
               </div>
               <ul className="space-y-3">
                  {['Predictive Inventory Auditing', 'Guest Palate DNA Mapping', 'Dynamic Revenue Forecasting'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-stone-700">
                       <i className="fas fa-check text-indigo-500 text-[10px]"></i>
                       {feat}
                    </li>
                  ))}
               </ul>
            </div>
            <div className="bg-stone-900 rounded-[3rem] p-12 shadow-3xl border border-stone-800">
               <div className="aspect-video bg-stone-800 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                  <div className="text-center space-y-4 relative z-10">
                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Processing Node</p>
                     <p className="text-4xl font-mono font-bold text-white">READY</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Module 2: Staff Academy */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="lg:order-2 space-y-8">
               <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl shadow-xl shadow-stone-200">
                  <i className="fas fa-graduation-cap"></i>
               </div>
               <div className="space-y-4">
                  <h3 className="text-4xl font-serif font-black italic">Staff Academy</h3>
                  <p className="text-stone-500 font-medium leading-relaxed italic">
                    Excellence is consistent. Our Academy provides mobile-optimized training modules that bridge the gap between back-of-house knowledge and front-of-house service.
                  </p>
               </div>
               <ul className="space-y-3">
                  {['Interactive Mixology Labs', 'Sommelier Digital Testing', 'Service Protocol Certification'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-stone-700">
                       <i className="fas fa-check text-indigo-500 text-[10px]"></i>
                       {feat}
                    </li>
                  ))}
               </ul>
            </div>
            <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-100">
               <div className="space-y-6">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                       <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white"><i className="fas fa-play"></i></div>
                       <div className="flex-1 h-3 bg-stone-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${30 * i}%` }}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Module 3: Executive Command */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
               <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl shadow-xl shadow-stone-200">
                  <i className="fas fa-tower-observation"></i>
               </div>
               <div className="space-y-4">
                  <h3 className="text-4xl font-serif font-black italic">Executive Command</h3>
                  <p className="text-stone-500 font-medium leading-relaxed italic">
                    The "Command Center" provides owners and group managers with an eagle-eye view of their entire network. Monitor MRR, staff sentiment, and facility health from a single, unified interface.
                  </p>
               </div>
               <ul className="space-y-3">
                  {['Global Revenue Ledger', 'Network Health Heartbeat', 'Emergency Protocol Revocation'].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-stone-700">
                       <i className="fas fa-check text-indigo-500 text-[10px]"></i>
                       {feat}
                    </li>
                  ))}
               </ul>
            </div>
            <div className="relative">
               <div className="bg-stone-900 rounded-[3rem] p-8 shadow-3xl border border-white/10">
                  <div className="flex justify-between items-center mb-8">
                     <p className="text-[10px] font-black uppercase text-white/50 tracking-widest">Global Overview</p>
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                  </div>
                  <div className="space-y-4">
                     {[1,2,3].map(i => (
                       <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                          <div className="text-stone-400 text-[10px] font-bold">Node_{i}</div>
                          <div className="text-white font-mono text-[10px]">98.2% ONLINE</div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>

          {/* Technical Interoperability Section */}
          <div className="py-24 border-t border-stone-100">
             <div className="grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Neural Mesh</h2>
                   <h3 className="text-4xl font-serif font-black italic">Technical Interoperability.</h3>
                   <p className="text-stone-500 font-medium leading-relaxed italic">
                      Vinetelligence connects seamlessly to your existing infrastructure via our proprietary **Universal API Mesh**. Whether you use legacy Enterprise systems or modern cloud-native POS platforms, we provide zero-latency synchronization.
                   </p>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                         <h4 className="text-[10px] font-black uppercase text-stone-400 mb-3 tracking-widest">Methods</h4>
                         <ul className="text-xs font-bold text-stone-700 space-y-2">
                            <li>• Native API Integration</li>
                            <li>• Secure Middleware Bridge</li>
                            <li>• Zero-Integration Vision Node</li>
                         </ul>
                      </div>
                      <div className="p-6 bg-stone-50 rounded-2xl border border-stone-100">
                         <h4 className="text-[10px] font-black uppercase text-stone-400 mb-3 tracking-widest">Supported POS</h4>
                         <ul className="text-xs font-bold text-stone-700 space-y-2">
                            <li>• Oracle GLAS / Micros</li>
                            <li>• Toast / Lightspeed</li>
                            <li>• Square / Clover</li>
                         </ul>
                      </div>
                   </div>
                </div>
                <div className="relative">
                   <div className="bg-stone-50 p-10 rounded-[3rem] border border-stone-100 flex items-center justify-center gap-12 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                      <i className="fas fa-plug text-5xl"></i>
                      <div className="h-20 w-px bg-stone-200"></div>
                      <div className="space-y-4">
                         <div className="w-32 h-4 bg-stone-200 rounded-full"></div>
                         <div className="w-24 h-4 bg-stone-200 rounded-full"></div>
                         <div className="w-40 h-4 bg-stone-200 rounded-full"></div>
                      </div>
                   </div>
                   <div className="absolute -bottom-6 -right-6 bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest">Deployment: 48 Hours</p>
                   </div>
                </div>
             </div>
          </div>

          {/* New Section: Human + AI Synergy */}
          <div className="bg-indigo-600 rounded-[4rem] p-12 md:p-20 text-white overflow-hidden relative">
             <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
             <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
                <div className="space-y-8">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Thought Leadership</h2>
                   <h3 className="text-4xl md:text-6xl font-serif font-black italic tracking-tighter leading-none">
                      The Future <br /> is Human.
                   </h3>
                   <p className="text-xl text-indigo-100 font-medium italic leading-relaxed">
                      "Are human-first teams possible in the age of AI?" We believe they aren't just possible—they are necessary. Vinetelligence is built to amplify human connection, not replace it.
                   </p>
                   <a 
                     href="https://www.mews.com/en/resources/future-is-human/are-human-first-teams-possible-in-the-age-of-ai"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-4 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95 group"
                   >
                      Read the Perspective <i className="fas fa-external-link-alt opacity-50 group-hover:translate-x-1 transition-transform"></i>
                   </a>
                </div>
                <div className="relative">
                   <div className="aspect-video rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-indigo-900 group">
                      <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
                        alt="The Future is Human"
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-20 h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse cursor-pointer">
                            <i className="fas fa-play text-2xl ml-1"></i>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </section>

      <BlogSection onAction={onEnterDemo || (() => navigate('/?mode=contact'))} />

      <PartnerNetwork />

      <ComparisonMatrix />

      {/* Technical Specs Footer */}
      <section className="py-32 px-6 bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-16">
          <div className="space-y-4">
             <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Latency</h4>
             <p className="text-2xl font-serif font-bold italic">Sub-42ms Data Pulse.</p>
             <p className="text-stone-400 text-sm italic">Optimized for high-velocity environments where every millisecond counts toward guest satisfaction.</p>
          </div>
          <div className="space-y-4">
             <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Security</h4>
             <p className="text-2xl font-serif font-bold italic">SOC-2 Type II Certified.</p>
             <p className="text-stone-400 text-sm italic">Individual data silos for every establishment. Your data is your property, period.</p>
          </div>
          <div className="space-y-4">
             <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Integration</h4>
             <p className="text-2xl font-serif font-bold italic">Universal API Mesh.</p>
             <p className="text-stone-400 text-sm italic">Compatible with all major POS systems, supply chain nodes, and local commerce APIs.</p>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-32 px-6 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <h2 className="text-5xl font-serif font-black text-white italic tracking-tighter">Ready to upgrade your establishment's brain?</h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => onStartOnboarding?.()}
              className="px-12 py-6 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-50 transition-all shadow-2xl active:scale-95"
            >
              Get Started
            </button>
            <button 
              onClick={() => onEnterDemo?.()}
              className="px-12 py-6 bg-indigo-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-950 transition-all shadow-2xl active:scale-95"
            >
              Interactive Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Platform;

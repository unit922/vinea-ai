import React from 'react';
import { Building2, ShieldCheck, FileText, Globe, Landmark, Scale } from 'lucide-react';

const Corporate: React.FC = () => {
  return (
    <div className="pt-24 min-h-screen bg-white">
      {/* HQ Header */}
      <section className="py-32 px-6 border-b border-stone-100 bg-[#0c0e0e] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" 
            alt="Global Infrastructure" 
            className="w-full h-full object-cover grayscale"
          />
        </div>
        <div className="absolute inset-0 bg-stone-900/80"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Strategic Operations / Global Node</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-serif font-black leading-tight tracking-tighter italic">
              Digital <br /> Trust.
            </h1>
            <p className="text-xl text-stone-300 leading-relaxed max-w-xl font-medium">
              Providing institutional-grade software for high-value hospitality nodes around the world.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-2xl p-12 rounded-[4rem] border border-white/10 space-y-12">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <Building2 className="text-indigo-400 w-8 h-8" />
                   <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Global Operations</h4>
                </div>
                <div className="space-y-2">
                   <p className="text-3xl font-serif font-black italic">Vinetelligence Hub</p>
                   <p className="text-xl text-stone-400 font-medium">Strategic Digital Infrastructure <br /> Global Support Grid</p>
                </div>
             </div>
             <div className="pt-10 border-t border-white/10 grid grid-cols-2 gap-8 text-[10px] font-black uppercase tracking-widest text-white/40">
                <div className="space-y-2">
                   <p>System Status</p>
                   <p className="text-white text-xs">Operational</p>
                </div>
                <div className="space-y-2">
                   <p>Architecture</p>
                   <p className="text-white text-xs">Distributed Intelligence</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Compliance & Pillars */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-32">
          {/* Transparency Section */}
          <div className="grid lg:grid-cols-2 gap-24 items-center">
             <div className="order-2 lg:order-1 relative">
                <div className="aspect-video bg-stone-100 rounded-[3rem] overflow-hidden">
                   <img 
                     src="https://images.unsplash.com/photo-1454165833772-d996d49513d7?q=80&w=2070&auto=format&fit=crop" 
                     alt="Corporate Governance" 
                     className="w-full h-full object-cover"
                   />
                </div>
                <div className="absolute -bottom-10 -right-10 bg-indigo-600 p-12 rounded-[3rem] text-white shadow-2xl">
                   <ShieldCheck className="w-12 h-12 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Enterprise <br /> Grade Security</p>
                </div>
             </div>
             <div className="order-1 lg:order-2 space-y-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Trust Architecture</h2>
                <h3 className="text-4xl font-serif font-black text-stone-900 italic">B2B SaaS Integrity.</h3>
                <div className="space-y-6 text-stone-600 font-medium leading-relaxed italic">
                   <p>The Vinetelligence platform is a specialized professional tool for the hospitality sector. We focus on providing high-performance architectural value for our enterprise partners.</p>
                   <p>Our infrastructure is a closed-loop "Silo" ensuring that establishment trade secrets and guest preference data remain strictly proprietary. We provide full Data Sovereignty for all enterprise partners.</p>
                </div>
             </div>
          </div>

          {/* Pillars Grid */}
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <Scale />, title: "Legal Safety", desc: "Our terms provide absolute clarity on B2B software provisions, liability, and enterprise protection." },
              { icon: <Globe />, title: "Global Compliance", desc: "Data residency options optimized for global availability while respecting cross-border data protection principles." },
              { icon: <Landmark />, title: "Institutional Grade", desc: "Built to satisfy the security requirements of global luxury hotel portfolios and high-velocity hospitality nodes." }
            ].map((item, i) => (
              <div key={i} className="p-12 bg-white rounded-[3rem] border border-stone-100 space-y-8 hover:bg-stone-50 transition-colors">
                <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center text-white">
                  {item.icon}
                </div>
                <div className="space-y-4">
                   <h4 className="text-2xl font-serif font-black italic">{item.title}</h4>
                   <p className="text-stone-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Corporate Transparency Letter */}
          <div className="p-20 bg-stone-50 rounded-[4rem] text-center space-y-12 border border-stone-100">
             <div className="w-20 h-20 mx-auto bg-stone-900 rounded-full flex items-center justify-center text-white text-3xl">
                <FileText />
             </div>
             <div className="space-y-6 max-w-3xl mx-auto">
                <h4 className="text-4xl font-serif font-black italic text-stone-900">A Statement on Mission.</h4>
                <p className="text-stone-500 font-medium italic leading-relaxed text-lg">
                  "In an era of digital fragmentation, our platform stands as a beacon of professional hospitality technology. We acknowledge the importance of credibility in B2B relationships. Our decentralized operations reflect our commitment to stability, governance, and excellence."
                </p>
                <div className="pt-8">
                   <p className="text-[10px] font-black uppercase tracking-widest text-stone-900">The Board of Governance</p>
                   <p className="text-xs text-stone-400 mt-2">Vinetelligence AI Global Ops</p>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Corporate;

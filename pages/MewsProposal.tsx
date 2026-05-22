import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Zap, BarChart3, Building2, Users2 } from 'lucide-react';
import VinetelligenceLogo from '../components/VinetelligenceLogo';

const MewsProposal: React.FC = () => {
  return (
    <div className="pt-24 min-h-screen bg-stone-50">
      {/* Hero / Header */}
      <section className="py-24 px-6 bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
            <VinetelligenceLogo size="xs" withText={false} />
            <span>Vinetelligence × Mews Partnership Proposal</span>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-7xl font-serif font-black leading-[0.9] tracking-tighter text-stone-900 italic">
                Synchronized <br /> 
                <span className="text-indigo-600">Hospitality.</span>
              </h1>
              <p className="text-xl text-stone-600 leading-relaxed max-w-xl font-medium">
                Vinetelligence proposes a deep integration with the Mews Property Management System to create the world's first unified guest profile engine that bridges the gap between stay-data and palate-data.
              </p>
              <div className="flex gap-4">
                 <button className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95">Download PDF Protocol</button>
                 <button className="px-8 py-4 bg-white border border-stone-200 text-stone-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors">Contact Partner Desk</button>
              </div>
            </div>
            <div className="bg-stone-100 rounded-[4rem] p-4 relative overflow-hidden aspect-square">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-rose-500/10 scale-150 animate-pulse"></div>
               <div className="relative z-10 w-full h-full flex items-center justify-center">
                  <div className="w-full max-w-sm space-y-4">
                     <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-stone-200 space-y-6">
                        <div className="flex justify-between items-center">
                           <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 font-serif font-black">M</div>
                           <div className="w-4 h-0.5 bg-stone-200"></div>
                           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><i className="fas fa-brain text-[10px]"></i></div>
                        </div>
                        <div className="h-1 bg-indigo-100 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3, repeat: Infinity }} className="h-full bg-indigo-600" />
                        </div>
                        <p className="text-[10px] font-black uppercase text-center tracking-widest text-stone-400">Neural Sync in Progress</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Mews? */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">The Power of Choice</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-black italic tracking-tighter">Why Mews + Vinetelligence?</h3>
              <p className="text-stone-500 max-w-2xl mx-auto italic font-medium">Mews is the definitive cloud PMS for modern hotels. Vinetelligence is the definitive AI for beverage operations. Together, they create a complete 360-degree guest profile.</p>
           </div>

           <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: <Users2 />, title: "Unified Profiles", desc: "Guest preferences in Mews automatically sync with Vinetelligence's Palate DNA nodes." },
                { icon: <Building2 />, title: "Room Service 2.0", desc: "AI-driven beverage recommendations based on check-in data and past stay history." },
                { icon: <BarChart3 />, title: "Revenue Interop", desc: "Seamless billing integration from the Bar Station directly to the guest's Mews folio." },
                { icon: <Zap />, title: "Instant Sync", desc: "Real-time updates across multiple properties through the Mews Marketplace API." }
              ].map((item, i) => (
                <div key={i} className="p-8 bg-white rounded-[2.5rem] border border-stone-100 space-y-6 shadow-sm hover:shadow-xl transition-all">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    {item.icon}
                  </div>
                  <h4 className="text-lg font-serif font-black italic">{item.title}</h4>
                  <p className="text-[11px] text-stone-500 font-medium leading-relaxed italic">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Integration Benefits */}
      <section className="py-32 px-6 bg-stone-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[50%] h-full bg-indigo-600/10 skew-x-12 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12">
            <div className="space-y-6">
              <h3 className="text-5xl font-serif font-black tracking-tighter italic">Benefits for <br /> Mews Customers.</h3>
              <p className="text-stone-400 font-medium leading-relaxed italic">By integrating Vinetelligence, Mews customers unlock a new layer of operational brilliance that legacy F&B tools simply cannot match.</p>
            </div>
            
            <div className="space-y-8">
               {[
                 { title: "Reduce Inventory Atrophy", benefit: "92% more accurate inventories mean 15-20% reduction in wastage for hotel bars." },
                 { title: "Personalized Mini-Bars", benefit: "Use stay history to stock mini-bars with the actual labels guests love." },
                 { title: "Staff Efficiency", benefit: "Reduce staff training time by 40% through Vinea Academy training nodes." }
               ].map((item, i) => (
                 <div key={i} className="flex gap-6 group">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                     <CheckCircle2 className="w-6 h-6" />
                   </div>
                   <div className="space-y-1">
                     <h4 className="text-xl font-serif font-black italic">{item.title}</h4>
                     <p className="text-sm text-stone-500 italic">{item.benefit}</p>
                   </div>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="p-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] space-y-8">
               <div className="flex items-center gap-4">
                  <VinetelligenceLogo size="sm" className="text-indigo-400" />
                  <div className="h-6 w-px bg-white/10"></div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/50">Mews Partner Portal</div>
               </div>
               <div className="space-y-4">
                  <p className="text-2xl font-serif font-black italic">"The integration of Vinetelligence with Mews ecosystem would represent a paradigm shift in how luxury beverage programs are managed globally."</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">— Chief Innovation Officer</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="p-6 bg-indigo-600 rounded-[2rem] text-center">
                  <p className="text-3xl font-serif font-black italic">14.2%</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-indigo-100 italic">Average Yield Uplift</p>
               </div>
               <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-center">
                  <p className="text-3xl font-serif font-black italic">42ms</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/50 italic">Neural Sync Latency</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12 bg-white p-20 rounded-[4rem] border border-stone-100 shadow-2xl">
          <h3 className="text-4xl font-serif font-black italic">Ready to Synchronize?</h3>
          <p className="text-stone-500 font-medium italic">Join the Vinetelligence Ecosystem and redefine the future of luxury hospitality. Our partner team is standing by to initiate the Mews Neural Link.</p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://referrals.mews.com/uU3mdly3" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-900 transition-all flex items-center gap-3"
            >
              Become a Partner <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MewsProposal;

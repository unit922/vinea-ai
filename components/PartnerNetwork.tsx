
import React from 'react';
import { Share2, Zap, ShieldCheck, Database } from 'lucide-react';

const MEWS_PARTNER_LINK = "https://referrals.mews.com/uU3mdly3";

const PartnerNetwork = () => {
  return (
    <section className="py-32 px-6 bg-stone-50 border-y border-stone-200 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-600">
              <Share2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Certified Integration</span>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-5xl md:text-7xl font-serif font-black italic tracking-tighter text-stone-900 leading-[0.9]">
                Neural <br />
                <span className="text-emerald-600">Ecosystem.</span>
              </h2>
              <p className="text-xl text-stone-600 leading-relaxed font-medium italic max-w-xl">
                Vinetelligence doesn't exist in a vacuum. We bridge the gap between your core Property Management System and high-margin beverage operations.
              </p>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-white rounded-3xl border border-stone-200 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center text-emerald-400 text-3xl font-serif">M</div>
                  <div>
                    <h4 className="text-2xl font-serif font-bold italic">Mews PMS Partner</h4>
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Strategic Integration</p>
                  </div>
                </div>
                <p className="text-stone-500 text-sm leading-relaxed mb-8 italic">
                  "The Perfect Match: Mews handles the check-in; Vinetelligence handles the palate. Sync guest profiles directly from Mews to Vinetelligence to prepare personalized beverage recommendations before they reach the bar."
                </p>
                <a 
                  href={MEWS_PARTNER_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 text-stone-900 font-black text-[10px] uppercase tracking-widest group-hover:gap-5 transition-all"
                >
                  Configure Mews Bridge <i className="fas fa-arrow-right text-emerald-500"></i>
                </a>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-[4rem]"></div>
            <div className="grid grid-cols-2 gap-6 relative z-10">
              {[
                { icon: <Zap />, label: "Live Sync", desc: "Real-time state replication across devices." },
                { icon: <ShieldCheck />, label: "Secure Bridge", desc: "Enterprise-grade encryption for PII data." },
                { icon: <Database />, label: "Data Harvest", desc: "Automatically import guest historical data." },
                { icon: <Share2 />, label: "Universal API", desc: "Connect to any POS or Inventory node." }
              ].map((item, i) => (
                <div key={i} className={`p-8 rounded-[2.5rem] border border-stone-200 ${i % 2 === 1 ? 'bg-indigo-600 text-white translate-y-12' : 'bg-white text-stone-900'}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${i % 2 === 1 ? 'bg-white/10' : 'bg-stone-50 text-indigo-600'}`}>
                    {item.icon}
                  </div>
                  <h5 className="font-bold mb-2 italic">{item.label}</h5>
                  <p className={`text-[11px] leading-relaxed opacity-70 ${i % 2 === 1 ? 'text-indigo-100' : 'text-stone-500'}`}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnerNetwork;

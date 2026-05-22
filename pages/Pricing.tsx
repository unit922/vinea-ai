import React from 'react';
import { Check } from 'lucide-react';
import ComparisonMatrix from '../components/ComparisonMatrix';

interface PricingProps {
  onEnterDemo?: () => void;
  onStartOnboarding?: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onEnterDemo, onStartOnboarding }) => {
  return (
    <div className="pt-24 min-h-screen bg-white">
      <section className="py-12 md:py-24 px-6 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-50 border border-stone-100 text-stone-400 text-[8px] font-black uppercase tracking-widest italic">
          <i className="fas fa-info-circle"></i>
          Service Disclaimer: Professional SaaS Infrastructure. No Physical Beverage Sales.
        </div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Growth Plans</h2>
        <h1 className="text-3xl sm:text-6xl md:text-8xl font-serif font-black leading-tight tracking-tighter text-stone-900 italic">
          Fueling <br /> Success.
        </h1>
        <p className="text-lg md:text-xl text-stone-600 leading-relaxed max-w-xl mx-auto font-medium">
          Choose the growth plan that aligns with your establishment's aspirations. We provide specialized solutions for single locations and global restaurant groups.
        </p>
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic flex items-center gap-2 justify-center">
          <i className="fas fa-desktop text-xs"></i>
          Optimization Note: Laptop or Tablet recommended for full experience.
        </p>
      </section>

      <section className="pb-32 px-6">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: "The Explorer",
              price: "Free",
              desc: "Full Vinetelligence suite using local session persistence. Strictly anonymous, no account required.",
              features: ["No Sign-Up Required", "Local Secure Storage", "Bar Station Control", "Operational Knowledge Base", "Sandbox Mode"]
            },
            {
              name: "The Essential",
              price: "$149",
              desc: "For boutique establishments looking to refine their brand and operations.",
              features: ["14-Day Free Trial", "Full Bar Station & Inventory", "Guest Intelligence Node", "Operational Performance Sync", "Standard Support"]
            },
            {
              name: "The Growth",
              price: "$499",
              desc: "For scaling groups and boutique hotels requiring deep analytics.",
              features: ["14-Day Free Trial", "Specialized Global Trend Node", "Predictive Supply Chain Node", "Revenue Optimization Engine", "Dedicated Success Manager"]
            },
            {
              name: "The Enterprise",
              price: "Custom",
              desc: "The definitive solution for global hospitality leaders and portfolios.",
              features: ["Full Brand Integration", "Custom API Solutions", "White-label Growth Portal", "On-site Strategic Direction", "Governance Advisory"]
            }
          ].map((plan, i) => (
            <div key={i} className={`p-8 md:p-10 rounded-[3rem] flex flex-col justify-between space-y-10 border transition-all hover:scale-[1.02] ${i === 2 ? 'bg-[#0c0e0e] text-white shadow-3xl border-indigo-500/30' : 'bg-stone-50 border-stone-100'}`}>
              <div className="space-y-6">
                 <div className="space-y-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${i === 2 ? 'text-indigo-400' : 'text-indigo-600'}`}>{plan.name}</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-4xl md:text-5xl font-serif font-black">{plan.price}</span>
                       {plan.price !== 'Custom' && plan.price !== 'Free' && <span className="text-xs opacity-50">/mo</span>}
                    </div>
                 </div>
                 <p className={`text-[11px] font-medium leading-relaxed italic ${i === 2 ? 'text-stone-400' : 'text-stone-500'}`}>{plan.desc}</p>
                 <div className="space-y-4 pt-8 border-t border-current opacity-20">
                    {plan.features.map((feat, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <Check className="w-3 h-3 shrink-0" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-tight">{feat}</span>
                      </div>
                    ))}
                 </div>
              </div>
              <button 
                onClick={() => {
                  if (plan.name === 'The Explorer' && onEnterDemo) {
                    onEnterDemo();
                  } else if (plan.name === 'The Enterprise') {
                    onEnterDemo?.(); // Use demo as fallback for contact/sales in this UI
                  } else if (onStartOnboarding) {
                    onStartOnboarding();
                  }
                }}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${i === 2 ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-900/50' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
              >
                {plan.name === 'The Enterprise' ? 'Contact Sales' : plan.name === 'The Explorer' ? 'Launch Sandbox' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Deployment Estimates Section */}
      <section className="py-32 px-6 bg-stone-50 border-t border-stone-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20">
            <div className="space-y-8">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Implementation Economics</h2>
               <h3 className="text-5xl font-serif font-black tracking-tighter leading-tight italic">Deployment Forecast <br /> for SMB Establishments.</h3>
               <p className="text-stone-500 font-medium italic leading-relaxed">
                  High-spec "Neural Hospitality" requires specialized hardware to maintain sub-42ms latency and guest pattern matching. We provide transparent estimates for a professional 5-staff deployment.
               </p>
               <div className="p-8 bg-indigo-600 rounded-[2rem] text-white space-y-6 shadow-2xl">
                   <div className="flex justify-between items-center pb-6 border-b border-white/20">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Year 1 Est. Investment</p>
                      <p className="text-3xl font-serif font-black italic">$12,288 – $18,988</p>
                   </div>
                  <p className="text-xs italic leading-relaxed opacity-80">
                     Includes one-time professional hardware acquisition, network infrastructure, professional configuration, and the first year of "Essential" subscription.
                  </p>
               </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-8">
                  <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-indigo-600">
                     <i className="fas fa-microchip"></i>
                  </div>
               <div className="space-y-4">
                  <h4 className="text-lg font-serif font-black italic">Hardware Layer</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">One-time Acquisition (2026 Estimates)</p>
                  <ul className="space-y-4">
                     {[
                       { item: '5x Mobile AI Terminals', cost: '$4,000 – $7,500', desc: 'High-spec handhelds for <42ms latency' },
                       { item: '5x Specialized Scanners', cost: '$1,500 – $3,000', desc: 'Advanced beverage mapping peripherals' },
                       { item: '1x Neural Processing Hub', cost: '$1,500 – $3,000', desc: 'On-site server for local persona matching' },
                       { item: 'Docking & Charging', cost: '$200 – $400', desc: 'Centralized 5-device station' }
                     ].map((h, i) => (
                       <li key={i} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11px] font-bold">
                             <span className="text-stone-900 italic">{h.item}</span>
                             <span className="text-indigo-600">{h.cost}</span>
                          </div>
                          <p className="text-[8px] text-stone-400 uppercase tracking-tighter">{h.desc}</p>
                       </li>
                     ))}
                  </ul>
                  <div className="pt-4 border-t border-stone-100 flex justify-between">
                     <span className="text-xs font-black uppercase tracking-widest italic">Est. Setup Total</span>
                     <span className="text-xs font-black text-indigo-600 italic">$7,200 – $13,900</span>
                  </div>
               </div>
               </div>

               <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-8">
                  <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-indigo-600">
                     <i className="fas fa-brain-circuit"></i>
                  </div>
                  <div className="space-y-4">
                     <h4 className="text-lg font-serif font-black italic">Operating Layer</h4>
                     <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Recurring & Integration</p>
                     <ul className="space-y-4">
                        {[
                          { item: 'Annual Subscription', cost: '$1,788' },
                          { item: 'Professional Config', cost: '$1,000' },
                          { item: 'Staff Mastery Training', cost: '$500' }
                        ].map((h, i) => (
                          <li key={i} className="flex justify-between text-[11px] font-bold">
                             <span className="text-stone-500 italic">{h.item}</span>
                             <span className="text-stone-900">{h.cost}</span>
                          </li>
                        ))}
                     </ul>
                     <div className="pt-4 border-t border-stone-100 flex justify-between">
                        <span className="text-xs font-black uppercase tracking-widest italic">Annual / Logic</span>
                        <span className="text-xs font-black text-indigo-600 italic">$3,288</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <ComparisonMatrix />

      {/* Compliance / Safe Billing */}
      <section className="py-24 px-6 bg-stone-50 border-y border-stone-100">
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="flex justify-center gap-12 opacity-40 grayscale">
            <i className="fab fa-stripe text-5xl"></i>
            <i className="fab fa-cc-visa text-5xl"></i>
            <i className="fab fa-cc-mastercard text-5xl"></i>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">
            SECURE B2B BILLING. ALL TRANSACTIONS ARE PROCESSED THROUGH INDUSTRY-STANDARD GATEWAYS. <br />
            "INTELLIGENCE" WILL APPEAR AS THE SERVICE PROVIDER ON YOUR INSTITUTIONAL STATEMENTS.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Pricing;

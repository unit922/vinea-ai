import React, { useState } from 'react';
import { Check } from 'lucide-react';
import ComparisonMatrix from '../components/ComparisonMatrix';

interface PricingProps {
  onEnterDemo?: () => void;
  onStartOnboarding?: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onEnterDemo, onStartOnboarding }) => {
  // Free Margin Leakage Audit State (Playbook Lead Magnet)
  const [monthlyRev, setMonthlyRev] = useState(120000);
  const [posSystem, setPosSystem] = useState("Toast");
  const [costPercent, setCostPercent] = useState(30);

  // Formulas for the Free Margin Leakage Audit
  // COGS = Monthly Beverage Rev * Cost %
  // Normal manual inventory leakage rate = 12.5% of COGS
  const calculatedCOGS = monthlyRev * (costPercent / 100);
  const monthlyLeakage = Math.round(calculatedCOGS * 0.125);
  const annualLeakage = monthlyLeakage * 12;

  const handleDemoLaunchWithAudit = () => {
    localStorage.setItem('vinetelligence_audit_rev', monthlyRev.toString());
    localStorage.setItem('vinetelligence_audit_pos', posSystem);
    localStorage.setItem('vinetelligence_audit_cost', costPercent.toString());
    localStorage.setItem('vinetelligence_audit_leakage', monthlyLeakage.toString());
    localStorage.setItem('vinetelligence_audit_active', 'true');
    if (onEnterDemo) {
      onEnterDemo();
    }
  };

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
      </section>

      <section className="pb-32 px-6">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: "The Explorer",
              price: "Free",
              desc: "Full Vinetelligence suite using local session persistence. Strictly anonymous, no account required.",
              features: ["No Sign-Up Required", "Local Secure Storage", "Bar Station Control", "Operational Knowledge Base", "Interactive Demo"]
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
                {plan.name === 'The Enterprise' ? 'Contact Sales' : plan.name === 'The Explorer' ? 'Launch Demo' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* AI & FB Consultancy Services Section */}
      <section id="consulting" className="py-24 px-6 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Consultancy Services</h2>
            <h3 className="text-3xl md:text-5xl font-serif font-black italic text-stone-900 leading-tight">
              AI & FB (Meta) Consultancy Annex
            </h3>
            <p className="text-stone-500 max-w-2xl mx-auto text-sm italic leading-relaxed">
              We complement our core development activities with bespoke advisory services. Elevate your brand presence, capture off-premises high-value traffic on Facebook/Meta, and convert them seamlessly using custom-calibrated AI sommeliers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Package 1 */}
            <div className="bg-white p-10 md:p-12 rounded-[3rem] border border-stone-200/60 shadow-xl flex flex-col justify-between space-y-10 hover:border-indigo-500/40 transition-all">
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[8px] font-black uppercase tracking-widest text-indigo-600">One-Time Kickstart</span>
                  <h4 className="text-2xl font-serif font-black italic text-stone-900 pt-2">Core Integration & FB Ad Setup</h4>
                  <p className="text-stone-500 text-xs italic font-medium">For single establishments looking to pilot high-yield AI reservation funnels.</p>
                </div>
                <div className="text-4xl font-serif font-black text-stone-900">$2,500 <span className="text-xs text-stone-400 font-sans font-normal">flat fee</span></div>
                
                <div className="pt-6 border-t border-stone-100 space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Included Scope</p>
                  <ul className="space-y-3">
                    {[
                      "Bespoke Facebook & Instagram Ad Campaign Setup",
                      "Meta Pixel & Conversions API Routing",
                      "Localized Gemini LLM Menu Calibration",
                      "OpenTable / Resy Custom Lead Hook",
                      "48-Hour Live Deployment & Hand-off"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-xs font-bold text-stone-700">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button 
                onClick={() => onStartOnboarding?.() || onEnterDemo?.()}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all"
              >
                Inquire About Package
              </button>
            </div>

            {/* Package 2 */}
            <div className="bg-[#0c0e0e] text-white p-10 md:p-12 rounded-[3rem] border border-indigo-500/30 shadow-2xl flex flex-col justify-between space-y-10 hover:border-indigo-500 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <div className="space-y-6 relative z-10">
                <div className="space-y-1">
                  <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[8px] font-black uppercase tracking-widest text-indigo-400">Monthly Retainer</span>
                  <h4 className="text-2xl font-serif font-black italic text-white pt-2">Enterprise Growth & Optimization</h4>
                  <p className="text-stone-400 text-xs italic font-medium">For luxury hospitality groups requiring continuous model tuning and dynamic ad scaling.</p>
                </div>
                <div className="text-4xl font-serif font-black text-white">$1,500 <span className="text-xs text-stone-500 font-sans font-normal">/ month</span></div>
                
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Included Scope</p>
                  <ul className="space-y-3">
                    {[
                      "Ongoing Meta Ads Management & Creative Sourcing",
                      "A/B Split Testing & Conversion Rate Optimization",
                      "Weekly Gemini Model Fine-Tuning & Custom Prompting",
                      "Dedicated Developer Hours for POS & CRM Sync",
                      "Monthly ROI & Attrition Performance Auditing"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-xs font-bold text-stone-200">
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button 
                onClick={() => onStartOnboarding?.() || onEnterDemo?.()}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-900/50"
              >
                Retain Strategy Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Free Margin Leakage Audit Section (B2B Playbook Lead Magnet) */}
      <section id="roi" className="py-20 md:py-32 px-6 bg-[#FDF8F0] border-t border-b border-stone-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 md:gap-24 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Free Operational Audit</h2>
              <h3 className="text-4xl md:text-5xl font-serif font-black leading-tight">Identify your <br /> <span className="text-red-500 italic">Hidden Margin Leakage.</span></h3>
              <p className="text-sm text-stone-600 leading-relaxed max-w-lg">
                Most restaurant operators lose thousands of dollars each month to poor menu planning, manual paper inventory, over-pouring, and dead stock. Put in your operational coordinates below to calculate your estimated leakage.
              </p>
            </div>
            <div className="space-y-8 md:pt-4">
              {/* Question 1: Monthly Revenue */}
              <div className="space-y-4">
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

              {/* Question 2: Primary POS System */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Primary POS System</label>
                  <span className="text-xs font-mono font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{posSystem} Node</span>
                </div>
                <select
                  value={posSystem}
                  onChange={(e) => setPosSystem(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-stone-200 rounded-2xl text-sm font-semibold text-stone-800 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="Toast">Toast POS</option>
                  <option value="Oracle Micros">Oracle Micros Simphony</option>
                  <option value="Lightspeed">Lightspeed Restaurant</option>
                  <option value="Clover">Clover POS</option>
                  <option value="Square">Square POS</option>
                  <option value="Excel/Paper">Excel Spreadsheet / Manual Counts</option>
                </select>
                {/* Integration Helper Badge */}
                {posSystem === "Toast" && (
                  <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1.5 italic">
                    <i className="fas fa-check-circle"></i> Certified Toast App Marketplace Node available for instant plug-and-play synchronization.
                  </p>
                )}
                {posSystem === "Oracle Micros" && (
                  <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1.5 italic">
                    <i className="fas fa-check-circle"></i> Certified Oracle Cloud Marketplace integration ensures military-grade Simphony terminal links.
                  </p>
                )}
                {posSystem === "Lightspeed" && (
                  <p className="text-[10px] text-indigo-600 font-bold flex items-center gap-1.5 italic">
                    <i className="fas fa-check-circle"></i> Certified Lightspeed cloud partner provides seamless real-time stock depletion logs.
                  </p>
                )}
                {(posSystem !== "Toast" && posSystem !== "Oracle Micros" && posSystem !== "Lightspeed") && (
                  <p className="text-[10px] text-stone-500 font-medium flex items-center gap-1.5 italic">
                    <i className="fas fa-info-circle"></i> Connect via our secure Universal Rest API gateway or manual CSV import.
                  </p>
                )}
              </div>

              {/* Question 3: Current COGS % */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500">Current Beverage COGS (Cost %)</label>
                  <span className="text-lg md:text-xl font-serif font-black text-stone-900 italic">{costPercent}%</span>
                </div>
                <input 
                  type="range" min="15" max="45" step="1" value={costPercent}
                  onChange={(e) => setCostPercent(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Industry standard ranges between 20% to 35%.</p>
              </div>
            </div>
          </div>
 
          {/* Audit Results Presentation */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-stone-100 shadow-2xl relative overflow-hidden w-full">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="space-y-8 relative">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white text-lg md:text-xl shadow-lg shadow-red-100">
                      <i className="fas fa-triangle-exclamation"></i>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Estimated Annual Leakage</p>
                </div>
                <div className="space-y-2">
                   <p className="text-5xl md:text-7xl font-serif font-black text-red-500 tracking-tighter">${annualLeakage.toLocaleString()}</p>
                   <p className="text-[10px] md:text-[11px] font-bold text-stone-500 uppercase tracking-widest italic leading-relaxed">
                     Based on your ${monthlyRev.toLocaleString()} revenue and {costPercent}% COGS, you are losing approximately <span className="text-red-500 font-black">${monthlyLeakage.toLocaleString()}/mo</span>.
                   </p>
                </div>

                {/* Leakage Breakdown */}
                <div className="py-6 border-t border-b border-stone-100 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Leakage Breakdown Diagnostics</p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-stone-800">
                        <span>Spillage & Over-pouring (35%)</span>
                        <span className="text-red-500">${Math.round(monthlyLeakage * 0.35).toLocaleString()}/mo</span>
                      </div>
                      <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-stone-800">
                        <span>Manual Inventory Discrepancy (40%)</span>
                        <span className="text-red-500">${Math.round(monthlyLeakage * 0.40).toLocaleString()}/mo</span>
                      </div>
                      <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-stone-800">
                        <span>Slow-moving Dead Stock (25%)</span>
                        <span className="text-red-500">${Math.round(monthlyLeakage * 0.25).toLocaleString()}/mo</span>
                      </div>
                      <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-300 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleDemoLaunchWithAudit}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-[#141414] transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3 animate-pulse"
                  >
                    <i className="fas fa-play"></i>
                    <span>Inject Data into Interactive Demo</span>
                  </button>
                  <p className="text-[9px] text-center text-stone-400 font-bold uppercase tracking-wider">Instant Demo Access. Pre-loaded with Dummy Profiles. No Signup Required.</p>
                </div>

                {/* Certified Marketplace Badging and Shadow Audit Details */}
                <div className="mt-8 pt-8 border-t border-stone-100 grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Certified Integrations</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[9px] font-bold text-stone-700 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Toast App Marketplace
                      </span>
                      <span className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[9px] font-bold text-stone-700 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-pulse"></span>
                        Oracle Simphony Cloud
                      </span>
                      <span className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-[9px] font-bold text-stone-700 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                        Lightspeed Certified
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Hyper-Targeted "Shadow" Audits</p>
                    <p className="text-[10px] text-stone-500 italic font-medium leading-relaxed">
                      We model public wine lists for high-volume establishments to calculate margin leaks with zero initial setup. Contact our integration specialists to claim your pre-loaded shadow profile and instantly unlock your interactive demo.
                    </p>
                  </div>
                </div>
             </div>
          </div>
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

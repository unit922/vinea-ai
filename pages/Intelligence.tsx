import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Brain, Layers, Database, Zap, Binary, Check, HelpCircle, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import BlogSection from '../components/BlogSection';
import ComparisonSection from '../components/ComparisonSection';

interface IntelligenceProps {
  onEnterDemo?: () => void;
}

const Intelligence: React.FC<IntelligenceProps> = ({ onEnterDemo }) => {
  const navigate = useNavigate();
  const [auditAnswers, setAuditAnswers] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  const auditQuestions = [
    {
      id: 1,
      title: "Does it know your guest — or just do a task?",
      desc: "If your AI agent can't draw on a shared, persistent profile of who your guest is, it is merely automating a chore rather than delivering premium hospitality.",
      icon: "fas fa-user-circle"
    },
    {
      id: 2,
      title: "Does it have judgment, or just speed?",
      desc: "Anyone can automate a rapid reply. A system with taste knows which details matter, when to surprise, and when to exercise restraint.",
      icon: "fas fa-balance-scale"
    },
    {
      id: 3,
      title: "Does it free your people for moments that matter?",
      desc: "The right AI in luxury absorbs administrative burdens to make your team more present with guests, rather than just shifting headcount off the line.",
      icon: "fas fa-hands-helping"
    },
    {
      id: 4,
      title: "Does it compound, or stay static?",
      desc: "A genuine system continuously learns your property's pricing philosophy, regulars' quirks, and cellar decisions, making it more valuable each month.",
      icon: "fas fa-trending-up"
    },
    {
      id: 5,
      title: "Was it built for luxury, or retrofitted from volume?",
      desc: "Most systems are engineered for scale and lightly repainted for the top end. True luxury requires a solution structured around taste from day one.",
      icon: "fas fa-award"
    }
  ];

  const yesCount = Object.values(auditAnswers).filter(Boolean).length;
  return (
    <div className="pt-24 min-h-screen bg-white">
      {/* Solution Header */}
      <section className="py-24 px-6 border-b border-stone-100">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Strategic Solutions</h2>
            <h1 className="text-3xl md:text-7xl font-serif font-black leading-tight tracking-tighter text-stone-900 italic">
              Neural <br /> Operating System.
            </h1>
            <p className="text-xl text-stone-600 leading-relaxed max-w-xl font-medium">
              We provide the specialized neural infrastructure and predictive engines needed to separate your establishment from the competition. We transform your restaurant's operations into a high-performance intelligence node.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="aspect-square bg-stone-900 rounded-[3rem] p-8 text-white flex flex-col justify-between group hover:bg-indigo-600 transition-colors duration-500">
               <Layers className="w-10 h-10 text-indigo-400 group-hover:text-white" />
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Logistics</p>
                 <p className="text-xl font-serif font-black italic">Inventory <br /> Nodes</p>
               </div>
             </div>
             <div className="aspect-square bg-stone-50 rounded-[3rem] p-8 text-stone-900 flex flex-col justify-between border border-stone-100">
               <Database className="w-10 h-10 text-indigo-600" />
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Optimization</p>
                 <p className="text-xl font-serif font-black italic">Yield <br /> Optimization</p>
               </div>
             </div>
             <div className="aspect-square bg-stone-50 rounded-[3rem] p-8 text-stone-900 flex flex-col justify-between border border-stone-100">
               <Brain className="w-10 h-10 text-indigo-600" />
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Insights</p>
                 <p className="text-xl font-serif font-black italic">Predictive <br /> Demand Data</p>
               </div>
             </div>
             <div className="aspect-square bg-indigo-600 rounded-[3rem] p-8 text-white flex flex-col justify-between">
               <Shield className="w-10 h-10 text-indigo-200" />
               <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Trust</p>
                 <p className="text-xl font-serif font-black italic">GDPR <br /> Sovereign</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Core Protocol Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Zap />,
                title: "Real-time Sync",
                desc: "Our neural scanners synthesize labels and inventory levels in milliseconds, providing an always-accurate reflection of your cellars and bars."
              },
              {
                icon: <Binary />,
                title: "Operational Alpha",
                desc: "Predictive algorithms designed to optimize staffing deployment and minimize waste through atmospheric and historical data analysis."
              },
              {
                icon: <Database />,
                title: "Unified Data Hub",
                desc: "We synchronize your operational data across all touchpoints: from your backend inventory systems to your staff's handheld terminals."
              }
            ].map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-12 bg-stone-50 rounded-[3rem] border border-stone-100 space-y-8 hover:shadow-2xl transition-all"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                  {item.icon}
                </div>
                <div className="space-y-4">
                  <h4 className="text-2xl font-serif font-black">{item.title}</h4>
                  <p className="text-stone-500 font-medium leading-relaxed italic">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Intelligence & Global Insights */}
      <section className="py-32 px-6 bg-stone-50 border-y border-stone-100">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Global Strategy Hub</h2>
            <h3 className="text-4xl md:text-6xl font-serif font-black italic">Strategic Intelligence <br /> & Global Insights.</h3>
            <p className="text-stone-500 font-medium italic max-w-2xl mx-auto leading-relaxed">
              Vinetelligence provides a macro-view of the hospitality landscape. Our global sensor network identifies shifting guest preferences and supply chain volatility before they impact your P&L.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-12 bg-white rounded-[4rem] border border-stone-100 space-y-8 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <i className="fas fa-globe-americas text-xl"></i>
                </div>
                <h4 className="text-2xl font-serif font-black italic">Market Velocity Mapping</h4>
                <p className="text-sm text-stone-500 font-medium leading-relaxed italic">
                  Track regional beverage trends across the Caribbean and global luxury markets. Our AI identifies emerging varietal demands and spirit preferences 3-6 months in advance.
                </p>
              </div>
              <ul className="space-y-4 pt-8 border-t border-stone-100">
                {[
                  "Predictive Demand Forecasting",
                  "Cross-border Competitive Analysis",
                  "Yield Optimization Protocols"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                    <i className="fas fa-check-circle opacity-50"></i>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-12 bg-stone-900 text-white rounded-[4rem] space-y-8 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <i className="fas fa-chart-line text-9xl"></i>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 font-serif font-black italic text-xl">
                  AI
                </div>
                <h4 className="text-2xl font-serif font-black italic">Macro-Yield Analytics</h4>
                <p className="text-sm text-stone-400 font-medium leading-relaxed italic">
                  Analyze high-level operational performance across groups. Our "Executive Command" node provides deep insights into staff efficiency, inventory shrinkage, and ROI attribution.
                </p>
              </div>
              <div className="pt-8 border-t border-white/10 space-y-4 relative z-10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Current Prediction Index</p>
                 <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-serif font-black italic">+14.2%</span>
                    <span className="text-xs text-stone-500 italic">Avg. Yield Improvement</span>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI & FB Consultancy Services Annex */}
      <section className="py-32 px-6 bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600">
                <Brain className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">Consultancy Annex</span>
              </div>
              <h3 className="text-4xl md:text-6xl font-serif font-black italic text-stone-900 tracking-tighter leading-none">
                AI & Meta Ad <br /> Consultancy Services.
              </h3>
              <p className="text-xl text-stone-600 leading-relaxed font-medium italic">
                Alongside our premium system development activities, we provide bespoke strategic consulting. We guide global luxury establishments through the high-stakes implementation of localized AI models and high-converting Facebook/Meta marketing frameworks.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link to="/pricing#consulting" className="px-10 py-5 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-stone-200">
                  Explore Consultancy Pricing
                </Link>
                <button onClick={onEnterDemo} className="px-10 py-5 bg-stone-100 text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-200 transition-all border border-stone-200">
                  Launch Local sandbox
                </button>
              </div>
            </div>
            
            <div className="lg:col-span-5 bg-stone-50 p-12 rounded-[4rem] border border-stone-100 space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Strategic Focus</p>
                <h4 className="text-2xl font-serif font-black italic text-stone-900">Closing the Data Loop</h4>
                <p className="text-stone-500 text-xs font-medium leading-relaxed italic">
                  Most development agencies write code in isolation. We bridge developers and strategists to capture off-premises traffic (Facebook/Meta Ads) and seamlessly routing it into on-premises AI conversion funnels.
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-stone-200">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-bold">
                  <span>Advisory Capacity</span>
                  <span>Active Queue</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-mono font-bold text-stone-800">Currently Booking Q3/Q4 Enterprise Audits</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-10">
            {[
              {
                icon: "fab fa-facebook-square",
                title: "Meta Acquisition Funnels",
                desc: "Laser-focused Instagram & Facebook custom-audience targeting using your reservation logs and high-value guest profiles (100% anonymized & GDPR compliant)."
              },
              {
                icon: "fas fa-brain",
                title: "Localized AI Training",
                desc: "We calibrate Gemini and custom LLM model architectures to reflect your restaurant group's specific menus, sommelier preferences, and hospitality guidelines."
              },
              {
                icon: "fas fa-code-branch",
                title: "Full-Stack Dev Integration",
                desc: "Connecting high-ticket Meta leads with reservation managers (Resy, OpenTable) and physical Point of Sale hardware via custom developer middleware."
              }
            ].map((service, i) => (
              <div key={i} className="p-10 bg-stone-50/55 rounded-[3rem] border border-stone-150 space-y-6 hover:bg-stone-50 transition-colors">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-stone-100">
                  <i className={`${service.icon} text-lg`}></i>
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-serif font-black italic text-stone-900">{service.title}</h4>
                  <p className="text-stone-500 text-xs font-medium leading-relaxed italic">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Luxury AI Discernment Test (Interactive Audit Checklist based on Journal No. 1) */}
      <section className="py-24 md:py-32 px-6 bg-[#fcfbf9] border-b border-stone-200 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/canvas-paper.png')] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto space-y-16 relative z-10">
          
          <div className="text-center space-y-4">
            <span className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[8px] font-black uppercase tracking-[0.25em] text-indigo-600 font-mono">
              The Discernment Test
            </span>
            <h3 className="text-4xl md:text-5xl font-serif font-black italic text-stone-900 tracking-tighter leading-none pt-2">
              Is Your AI Actually <br /> Ready for Luxury?
            </h3>
            <p className="text-stone-500 max-w-2xl mx-auto text-xs md:text-sm italic font-medium leading-relaxed">
              Standalone & siloed agents can win a product demo. They cannot deliver luxury hospitality. Take our interactive self-audit to evaluate if your current AI systems or proposed vendors pass the discernment benchmark.
            </p>
          </div>

          <div className="space-y-6">
            {auditQuestions.map((q) => {
              const currentAnswer = auditAnswers[q.id];
              return (
                <div 
                  key={q.id} 
                  className={`p-8 md:p-10 rounded-[2.5rem] border transition-all duration-300 bg-white ${
                    currentAnswer === true 
                      ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/[0.02]' 
                      : currentAnswer === false 
                        ? 'border-indigo-500/20 shadow-lg shadow-indigo-500/[0.01]' 
                        : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                          0{q.id}
                        </span>
                        <h4 className="font-serif font-black italic text-stone-950 text-base md:text-lg">
                          {q.title}
                        </h4>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed font-medium italic pl-1">
                        {q.desc}
                      </p>
                    </div>

                    {/* Interactive Yes / No Buttons */}
                    <div className="flex gap-2.5 w-full md:w-auto pt-2 md:pt-0">
                      <button
                        onClick={() => {
                          setAuditAnswers(prev => ({ ...prev, [q.id]: true }));
                          if (Object.keys({ ...auditAnswers, [q.id]: true }).length === 5) {
                            setShowResult(true);
                          }
                        }}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                          currentAnswer === true 
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/10' 
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>
                      <button
                        onClick={() => {
                          setAuditAnswers(prev => ({ ...prev, [q.id]: false }));
                          if (Object.keys({ ...auditAnswers, [q.id]: false }).length === 5) {
                            setShowResult(true);
                          }
                        }}
                        className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                          currentAnswer === false 
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10' 
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Diagnostic Result Display */}
          <AnimatePresence>
            {showResult && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="p-10 md:p-12 bg-stone-900 text-white rounded-[3.5rem] border border-white/10 shadow-3xl space-y-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-indigo-400">
                      AUDIT DIAGNOSTIC COMPLETE
                    </span>
                    <h4 className="text-2xl font-serif font-black italic text-white leading-tight">
                      Your Luxury Alignment Score: {yesCount}/5
                    </h4>
                  </div>
                  <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      {yesCount === 5 ? "Elite Harmony" : yesCount >= 3 ? "Point-Solution Risk" : "Extreme Fragmentation"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 text-stone-300 text-sm md:text-base font-medium italic leading-relaxed">
                  {yesCount === 5 ? (
                    <p>
                      Excellent. Your current systems are highly unified, dynamic, and focused on protecting human service. You recognize that luxury is never about raw speed or automated chores—it's about making guests feel anticipatingly cared for. Talk to our consultancy team to further scale your integrated operational advantage.
                    </p>
                  ) : yesCount >= 3 ? (
                    <p>
                      Your team has strong hospitality instincts, but your technology stack is showing signs of point-solution fragmentation. By employing siloed agents that don't speak to each other or share persistent guest profiles, you risk making service feel mechanical. Our consultancy annex specialize in weaving these loose nodes into a unified intelligence mesh.
                    </p>
                  ) : (
                    <p>
                      Your current systems fail the core luxury discernment tests. You are likely drowning in disconnected admin, using speed-oriented mass-market tools retrofitted for the top end. This approach adds complexity instead of reducing it, and squeezing out genuine human warmth. We strongly recommend an immediate architectural overhaul to protect your brand margin and guest loyalty.
                    </p>
                  )}
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <a 
                    href="#consulting" 
                    className="flex-1 py-5 bg-white text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all text-center flex items-center justify-center gap-3"
                  >
                    <span>Request Strategic Audit</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </a>
                  <button 
                    onClick={() => {
                      setAuditAnswers({});
                      setShowResult(false);
                    }}
                    className="py-5 px-8 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 font-black text-xs uppercase tracking-widest text-stone-300 hover:text-white transition-all"
                  >
                    Reset Audit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      <ComparisonSection />

      <BlogSection onAction={onEnterDemo || (() => navigate('/?mode=contact'))} />

      {/* Corporate Callout */}
      <section className="py-24 bg-[#0c0e0e] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/20 translate-x-1/2 rounded-full blur-[120px]"></div>
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12 relative">
          <h3 className="text-4xl font-serif font-black italic">Engineered for Excellence. <br /> Deployed Globally.</h3>
          <p className="max-w-2xl mx-auto text-stone-400 font-medium leading-relaxed uppercase text-[10px] tracking-[0.3em]">
            Operated on enterprise-grade infrastructure. Our protocols ensure professional-grade data integrity and security for global hospitality.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/corporate" className="px-10 py-4 bg-white text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-100 transition-all">
              Transparency Report
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Intelligence;

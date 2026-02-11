
import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { AIRecommendation, ExecutiveKPI, InvestorInsight, SustainabilityReport } from '../types';
import { geminiService } from '../services/geminiService';

interface ManagerDashboardProps {
  searchQuery?: string;
}

interface PredictivePulseData {
  summary: string;
  focusAction: string;
  sentiment: string;
}

const revenueData = [
  { name: 'Mon', revenue: 4000, covers: 45, margin: 68 },
  { name: 'Tue', revenue: 3000, covers: 32, margin: 62 },
  { name: 'Wed', revenue: 5500, covers: 60, margin: 70 },
  { name: 'Thu', revenue: 7000, covers: 75, margin: 74 },
  { name: 'Fri', revenue: 12000, covers: 140, margin: 78 },
  { name: 'Sat', revenue: 15000, covers: 165, margin: 82 },
  { name: 'Sun', revenue: 9000, covers: 110, margin: 76 },
];

const bestSellers = [
  { name: 'Cabernet', value: 400, color: '#7c2d12' },
  { name: 'Old Fashioned', value: 300, color: '#b45309' },
  { name: 'IPA', value: 200, color: '#d97706' },
  { name: 'Chardonnay', value: 150, color: '#fbbf24' },
];

const EXECUTIVE_KPIS: ExecutiveKPI[] = [
  { label: 'Yield Alpha', value: '+14.2%', change: 2.1, trend: 'up', benchmark: 'Industry: 6.4%', description: 'Profit delta since AI dynamic pricing activation.' },
  { label: 'Labor Efficiency', value: '$122/hr', change: 8.5, trend: 'up', benchmark: 'Regional: $88/hr', description: 'Revenue generated per staff hour vs market.' },
  { label: 'Cognitive Equity', value: '4.2k Profiles', change: 15, trend: 'up', benchmark: 'Asset Growth', description: 'Identified unique guest palate profiles (Data Asset).' },
  { label: 'Burn Reduction', value: '22%', change: 4.0, trend: 'down', benchmark: 'Waste Index', description: 'Decrease in inventory shrinkage via Vision Audits.' },
];

// Feature Maturity Data based on user request
const AI_FEATURE_MATRIX = [
  { category: 'F&B Intelligence', features: [
    { name: 'Predictive Inventory', status: 'Live', desc: 'Demand forecasting & auto-par calculation.' },
    { name: 'Vision Audits', status: 'Live', desc: 'Multimodal brand & fill level detection.' },
    { name: 'Beverage Personalization', status: 'Live', desc: 'AI Signature Lab & Palate Fingerprinting.' },
    { name: 'Kitchen Automation', status: 'Roadmap', desc: 'Smart oven & robotic chef telemetry integration.' }
  ]},
  { category: 'Guest Experience', features: [
    { name: 'AI Virtual Concierge', status: 'Live', desc: 'Multilingual chat & booking assistants.' },
    { name: 'Hyper-Personalization', status: 'Live', desc: 'CRM driven beverage journeys.' },
    { name: 'Smart Room Sync', status: 'Roadmap', desc: 'Voice-activated ambiance control.' },
    { name: 'Reputation Node', status: 'Beta', desc: 'Automated guest review analysis & reply drafts.' }
  ]},
  { category: 'Operations', features: [
    { name: 'Dynamic Pricing', status: 'Live', desc: 'Real-time yield optimization algorithms.' },
    { name: 'Staff Scheduling', status: 'Live', desc: 'Demand-based labor audit & optimization.' },
    { name: 'Predictive Maintenance', status: 'Live', desc: 'HVAC & refrigerator failure alerting.' }
  ]}
];

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ searchQuery = '' }) => {
  const [isInvestorView, setIsInvestorView] = useState(false);
  const [isAuthLocked, setIsAuthLocked] = useState(true);
  const [accessKey, setAccessKey] = useState('');
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [morningBrief, setMorningBrief] = useState<any>(null);
  const [isBriefing, setIsBriefing] = useState(false);
  const [pulseData, setPulseData] = useState<PredictivePulseData | null>(null);
  const [isPulsing, setIsPulsing] = useState(false);

  const [investorInsight, setInvestorInsight] = useState<InvestorInsight | null>(null);
  const [loadingInvestor, setLoadingInvestor] = useState(false);

  // Reputation Node State
  const [reviewText, setReviewText] = useState("Great wine list, but the service was a bit slow on a Saturday night. The sommelier really knew his stuff though.");
  const [isAnalyzingReview, setIsAnalyzingReview] = useState(false);
  const [reviewReply, setReviewReply] = useState<string | null>(null);

  // Sustainability Pulse State
  const [sustainabilityData, setSustainabilityData] = useState<SustainabilityReport | null>(null);
  const [isAuditingSustainability, setIsAuditingSustainability] = useState(false);

  useEffect(() => {
    const syncKey = () => setSessionKey(localStorage.getItem('vinea_investor_key'));
    syncKey();
    window.addEventListener('storage', syncKey);

    const fetchStrategy = async () => {
      setLoadingRecs(true);
      setIsPulsing(true);
      try {
        const profile = JSON.parse(localStorage.getItem('vinea_profile') || '{}');
        const [venueStrategy, globalIntel, pulse, sustAudit] = await Promise.all([
          geminiService.getBusinessStrategy({ revenue: revenueData, inventory: bestSellers, profile }),
          geminiService.getGlobalIntelligence(),
          geminiService.getPredictivePulse(revenueData),
          geminiService.getSustainabilityImpactAudit([])
        ]);

        const globalRecs: AIRecommendation[] = [];
        if (globalIntel) {
          globalIntel.trends.forEach((t: any) => globalRecs.push({ 
            type: 'trend', message: t.title, rationale: t.message, impact: 'High', actionLabel: 'View Trend', priority: 'medium', sources: globalIntel.sources 
          }));
        }
        setRecommendations([...venueStrategy, ...globalRecs]);
        setPulseData(pulse);
        setSustainabilityData(sustAudit);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRecs(false);
        setIsPulsing(false);
      }
    };
    fetchStrategy();
    return () => window.removeEventListener('storage', syncKey);
  }, []);

  const fetchInvestorInsight = async () => {
    setLoadingInvestor(true);
    try {
      const data = await geminiService.getInvestorIntelligence({
        revenue: revenueData,
        kpis: EXECUTIVE_KPIS,
        bestSellers
      });
      setInvestorInsight(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInvestor(false);
    }
  };

  const handleBriefing = async () => {
    setIsBriefing(true);
    try {
      const staff = JSON.parse(localStorage.getItem('vinea_staff_list') || '[]');
      const orders = JSON.parse(localStorage.getItem('vinea_orders') || '[]');
      const brief = await geminiService.getShiftBriefing({ staff, orders });
      setMorningBrief(brief);
    } catch (e) {
      console.error("Failed to generate shift briefing", e);
    } finally {
      setIsBriefing(false);
    }
  };

  const handleAnalyzeReview = async () => {
    setIsAnalyzingReview(true);
    try {
      const reply = await geminiService.getTrainingResponse(`Analyze this guest review and draft a professional, brand-aligned response from a manager. Review: "${reviewText}"`, []);
      setReviewReply(reply);
    } catch (e) { console.error(e); }
    finally { setIsAnalyzingReview(false); }
  };

  const verifyAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionKey && accessKey === sessionKey) {
      setIsAuthLocked(false);
      fetchInvestorInsight();
    } else {
      alert("Invalid Access Protocol. Use the Token Node from the Venue Admin > Dev Lab.");
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-all duration-700 ${isInvestorView ? 'bg-stone-950 p-6 rounded-[3rem]' : ''}`}>
      <div className="flex justify-between items-center shrink-0 mb-6 px-2">
        <div>
           <h2 className={`text-2xl font-serif font-bold italic tracking-tight ${isInvestorView ? 'text-amber-500' : 'text-stone-900'}`}>
             {isInvestorView ? 'Investor Intelligence Terminal' : 'Operational Command'}
           </h2>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
             {isInvestorView ? 'Grounding Performance in Global Benchmarks' : 'Real-time Pulse Monitor'}
           </p>
        </div>
        
        <button 
          onClick={() => { if(sessionKey) setIsInvestorView(!isInvestorView); else alert("Investor protocol dormant. Generate a Token Node in Venue Admin > Dev Lab first."); }}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 border-2 ${
            !sessionKey ? 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed opacity-50' :
            isInvestorView ? 'bg-amber-500 text-stone-900 border-amber-400' : 'bg-white text-stone-500 border-stone-200 hover:border-amber-500'
          }`}
        >
          <i className={`fas ${!sessionKey ? 'fa-lock' : isInvestorView ? 'fa-lock-open' : 'fa-chart-pie'}`}></i>
          {isInvestorView ? 'Exit Protocol' : 'Investor Protocol'}
        </button>
      </div>

      {!isInvestorView ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-6">
          <div className="bg-stone-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden shrink-0 group border border-white/5">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                     <span className="bg-amber-500 text-stone-950 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Executive Brief</span>
                     <h2 className="text-xl font-serif font-bold italic tracking-tight text-white">Shift Strategy</h2>
                  </div>
                  {morningBrief ? (
                    <div className="animate-in fade-in slide-in-from-left-4 max-w-2xl">
                       <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{morningBrief.priority}</p>
                       <p className="text-stone-300 text-sm leading-relaxed italic">"{morningBrief.brief}"</p>
                    </div>
                  ) : (
                    <p className="text-stone-500 text-sm italic">Initialize tonight's tactical command briefing to see AI shift priorities.</p>
                  )}
               </div>
               <button onClick={handleBriefing} disabled={isBriefing} className="px-8 py-4 bg-amber-500 text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl active:scale-95 disabled:opacity-50 shrink-0">
                 {isBriefing ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-brain mr-2"></i>}
                 Generate Pulse
               </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
                   <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 italic">Intelligence Pulse</h3>
                      {pulseData && (
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${pulseData.sentiment === 'Bullish' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {pulseData.sentiment} Momentum
                        </span>
                      )}
                   </div>
                   {isPulsing ? (
                     <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-stone-100 rounded w-full"></div>
                        <div className="h-4 bg-stone-100 rounded w-3/4"></div>
                     </div>
                   ) : pulseData ? (
                     <div className="space-y-4 animate-in fade-in duration-500">
                        <p className="text-sm font-bold text-stone-800 leading-relaxed italic">"{pulseData.summary}"</p>
                        <div className="p-4 bg-stone-900 text-white rounded-2xl flex items-center gap-4">
                           <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-stone-900 shrink-0"><i className="fas fa-bolt-lightning text-xs"></i></div>
                           <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{pulseData.focusAction}</p>
                        </div>
                     </div>
                   ) : (
                     <p className="text-xs text-stone-400 italic">Synthesizing latest telemetry data...</p>
                   )}
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col min-h-[300px]">
                  <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 mb-6 italic">Strategic Nodes</h3>
                  <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="w-full text-left p-4 rounded-2xl border border-stone-100 bg-stone-50 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white text-stone-500">{rec.type}</span>
                          <span className="text-[9px] font-bold text-emerald-600">{rec.impact} Impact</span>
                        </div>
                        <p className="text-xs font-bold text-stone-800 leading-tight italic">{rec.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col h-full min-h-[400px]">
                   <div className="flex justify-between items-center mb-8">
                      <div><h3 className="text-lg font-serif font-bold text-stone-800 italic">Operational Velocity</h3><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Revenue Forecast Matrix</p></div>
                   </div>
                   <div className="flex-1 w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          {/* Fix: removed duplicate x2 attribute and added y1 for proper vertical gradient definition */}
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#7c2d12" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#7c2d12" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                        <Area type="monotone" dataKey="revenue" stroke="#7c2d12" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-500"><i className="fas fa-leaf text-7xl"></i></div>
                      <h4 className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 text-emerald-100 italic">Sustainability Pulse</h4>
                      {sustainabilityData ? (
                        <div className="space-y-4 animate-in fade-in">
                           <div>
                              <p className="text-4xl font-serif font-black italic">-{sustainabilityData.wasteReductionPct}%</p>
                              <p className="text-[10px] font-black uppercase opacity-60">Spoilage Reduction Index</p>
                           </div>
                           <p className="text-xs font-bold leading-relaxed italic opacity-80 line-clamp-2">"Potential Savings identified in {sustainabilityData.topSpillageItems[0]?.name || 'Drafts'} via AI pour calibration."</p>
                        </div>
                      ) : (
                        <div className="animate-pulse space-y-4">
                           <div className="h-8 bg-white/10 rounded w-1/2"></div>
                           <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        </div>
                      )}
                   </div>
                   
                   <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group border border-white/5">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all duration-500"><i className="fas fa-screwdriver-wrench text-7xl text-amber-500"></i></div>
                      <h4 className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 text-amber-500 italic">Asset Resilience</h4>
                      <div className="space-y-4">
                         <div>
                            <p className="text-4xl font-serif font-black italic text-white">99.8%</p>
                            <p className="text-[10px] font-black uppercase text-stone-500">Operational Uptime</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
                            <p className="text-[8px] font-black uppercase tracking-widest text-stone-400">Predictive Maintenance Active</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* AI Integrity Index & Reputation Node */}
              <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm space-y-10">
                    <div className="flex justify-between items-center">
                       <div>
                          <h3 className="text-xl font-serif font-bold text-stone-900 italic">AI Integrity Index</h3>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mt-1">Silo Feature Maturity Tracking</p>
                       </div>
                       <div className="text-center">
                          <p className="text-3xl font-serif font-black text-amber-500 italic">82%</p>
                          <p className="text-[8px] font-black uppercase text-stone-400">Total Activation</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {AI_FEATURE_MATRIX.map((cat, i) => (
                         <div key={i} className="space-y-4">
                            <h4 className="text-[9px] font-black uppercase text-stone-900 border-b border-stone-100 pb-2 tracking-widest italic">{cat.category}</h4>
                            <div className="space-y-3">
                               {cat.features.map((f, j) => (
                                 <div key={j} className="flex items-start gap-3 group">
                                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${f.status === 'Live' ? 'bg-emerald-500' : f.status === 'Beta' ? 'bg-amber-500' : 'bg-stone-200'}`}></div>
                                    <div>
                                       <p className="text-xs font-bold text-stone-800 flex items-center gap-2">
                                          {f.name}
                                          <span className="text-[7px] font-black uppercase opacity-40 group-hover:opacity-100 transition-opacity">[{f.status}]</span>
                                       </p>
                                       <p className="text-[9px] text-stone-400 italic leading-tight">{f.desc}</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-stone-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><i className="fas fa-comment-dots text-8xl"></i></div>
                    <div className="space-y-2 mb-8">
                       <span className="bg-blue-500 text-stone-900 text-[8px] font-black uppercase px-2 py-0.5 rounded italic">Reputation Node</span>
                       <h3 className="text-xl font-serif font-bold italic tracking-tight">Review Synthesis</h3>
                    </div>
                    
                    <div className="flex-1 space-y-6 flex flex-col">
                       <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                          <p className="text-[9px] font-black text-stone-500 uppercase mb-2">Target Review (G-Maps/Yelp)</p>
                          <textarea 
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-xs italic font-medium text-stone-300 resize-none outline-none min-h-[60px]"
                          />
                       </div>

                       <div className="flex-1 min-h-[100px] overflow-y-auto custom-scrollbar">
                          {isAnalyzingReview ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                               <i className="fas fa-spinner fa-spin text-amber-500"></i>
                               <p className="text-[8px] font-black uppercase tracking-[0.4em]">Drafting Contextual Reply...</p>
                            </div>
                          ) : reviewReply ? (
                            <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl animate-in slide-in-from-bottom-2">
                               <p className="text-[9px] font-black text-blue-400 uppercase mb-2">AI Drafted Reply</p>
                               <p className="text-xs italic leading-relaxed text-stone-200">"{reviewReply}"</p>
                               <button onClick={() => {navigator.clipboard.writeText(reviewReply); alert("Reply copied to clipboard.");}} className="mt-4 text-[8px] font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors flex items-center gap-2">
                                  <i className="fas fa-copy"></i> Copy & Reply to Guest
                               </button>
                            </div>
                          ) : (
                            <p className="text-[9px] text-stone-600 italic text-center pt-10 uppercase tracking-widest">Awaiting analysis pulse...</p>
                          )}
                       </div>

                       <button 
                        onClick={handleAnalyzeReview}
                        disabled={isAnalyzingReview || !reviewText.trim()}
                        className="w-full py-4 bg-white text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 transition-all active:scale-95 shadow-xl"
                       >
                          Analyze & Draft Reply
                       </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
           {isAuthLocked ? (
             <div className="flex-1 flex items-center justify-center animate-in fade-in duration-700">
                <div className="bg-stone-900 border border-white/5 p-12 rounded-[4rem] shadow-2xl max-w-md w-full space-y-10 text-center relative overflow-hidden">
                   <div className="space-y-4">
                      <div className="w-20 h-20 bg-amber-500 text-stone-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl transform -rotate-12"><i className="fas fa-key text-3xl"></i></div>
                      <h3 className="text-3xl font-serif font-bold text-white italic tracking-tight">Security Protocol Active</h3>
                      <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Stakeholder Verification Required.</p>
                   </div>
                   <form onSubmit={verifyAccess} className="space-y-4 relative z-10">
                      <input type="password" value={accessKey} onChange={e => setAccessKey(e.target.value)} placeholder="Enter Token Node..." className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-5 text-white text-center font-black tracking-[0.4em] focus:outline-none focus:border-amber-500 transition-all placeholder:text-stone-700" />
                      <button type="submit" className="w-full py-5 bg-white text-stone-950 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-amber-500 shadow-xl transition-all">Establish Verification</button>
                   </form>
                </div>
             </div>
           ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 animate-in zoom-in-95 pb-20">
                {/* Investor Overview KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                   {EXECUTIVE_KPIS.map((kpi, i) => (
                     <div key={i} className="bg-stone-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-chart-line text-4xl"></i></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 mb-2">{kpi.label}</p>
                        <div className="flex justify-between items-baseline mb-4">
                           <h4 className="text-4xl font-serif font-black italic text-amber-500 tracking-tighter">{kpi.value}</h4>
                           <span className={`text-[10px] font-black px-2 py-1 rounded border ${kpi.trend === 'up' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>{kpi.trend === 'up' ? '+' : '-'}{kpi.change}%</span>
                        </div>
                        <p className="text-[9px] font-black uppercase text-stone-600 mb-2">{kpi.benchmark}</p>
                        <p className="text-xs text-stone-300 leading-relaxed italic opacity-70">"{kpi.description}"</p>
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Scalability Roadmap & AI Narrative */}
                  <div className="lg:col-span-7 space-y-8">
                    <div className="bg-stone-900 border border-white/5 rounded-[3rem] p-10 shadow-2xl space-y-10">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-serif font-bold text-amber-500 italic">Equity Narrative Alpha</h3>
                        {investorInsight && (
                          <div className="px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <span className="text-[10px] font-black uppercase text-amber-500">Multiplier: {investorInsight.projectedValuationMultiplier}x Revenue</span>
                          </div>
                        )}
                      </div>
                      
                      {loadingInvestor ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-6 text-stone-500">
                          <i className="fas fa-spinner fa-spin text-4xl text-amber-500"></i>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Retrieving Global Market Benchmarks...</p>
                        </div>
                      ) : investorInsight ? (
                        <div className="space-y-12 animate-in fade-in duration-1000">
                          <p className="text-lg text-stone-300 font-medium italic leading-relaxed">"{investorInsight.narrative}"</p>
                          
                          <div className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500 border-b border-white/5 pb-2 uppercase tracking-[0.4em]">Scalability Roadmap</h4>
                            <div className="grid grid-cols-1 gap-4">
                              {investorInsight.scalabilityRoadmap.map((item, i) => (
                                <div key={i} className="flex gap-6 items-start p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-black text-xs shrink-0">{i+1}</div>
                                  <div>
                                    <p className="text-[10px] font-black uppercase text-amber-500 mb-1">{item.phase}</p>
                                    <p className="text-sm font-bold text-white mb-1">{item.milestone}</p>
                                    <p className="text-[11px] text-stone-500 font-medium italic">Impact: {item.impact}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-20 text-center text-stone-700 italic">Initialize terminal to synthesize investor intelligence.</div>
                      )}
                    </div>
                  </div>

                  {/* Benchmark & Risk Matrix */}
                  <div className="lg:col-span-5 space-y-8">
                    <div className="bg-stone-900 border border-white/5 rounded-[3rem] p-8 shadow-2xl space-y-8">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-stone-500 italic">Global Index Benchmarking</h3>
                      <div className="space-y-4">
                        {investorInsight?.benchmarks.map((bench, i) => (
                          <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-stone-400">{bench.category}</span>
                              <span className="text-[8px] font-black uppercase text-stone-600">Vinea Index v4.1</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-xs text-stone-500 uppercase font-bold mb-1">Venue Value</p>
                                <p className="text-2xl font-black text-white">{bench.venueValue}{bench.unit}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-stone-500 uppercase font-bold mb-1">Industry Avg</p>
                                <p className="text-lg font-black text-amber-600">{bench.indexValue}{bench.unit}</p>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: '85%' }}></div>
                            </div>
                          </div>
                        )) || <div className="py-10 text-center opacity-20 grayscale"><i className="fas fa-layer-group text-4xl"></i></div>}
                      </div>
                    </div>

                    <div className="bg-stone-900 border border-white/5 rounded-[3rem] p-8 shadow-2xl space-y-6">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-500 italic">Risk Assessment Heatmap</h3>
                      <div className="space-y-3">
                        {investorInsight?.riskAssessment.map((risk, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group">
                            <div className={`w-3 h-3 rounded-full shrink-0 ${risk.level === 'Low' ? 'bg-emerald-500' : risk.level === 'Medium' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black uppercase text-white">{risk.category}</span>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${risk.level === 'Low' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{risk.level} Risk</span>
                              </div>
                              <p className="text-[10px] text-stone-500 leading-relaxed italic line-clamp-1 group-hover:line-clamp-none transition-all">{risk.detail}</p>
                            </div>
                          </div>
                        )) || <div className="py-10 text-center opacity-20 grayscale"><i className="fas fa-shield-halved text-4xl"></i></div>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-stone-900 border border-white/5 rounded-[3rem] p-10 h-[500px] flex flex-col shadow-2xl">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-white italic">Operational Alpha Radar</h3>
                        <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest mt-1">Cross-Functional Yield Integrity</p>
                      </div>
                      <i className="fas fa-compass text-amber-500 text-2xl"></i>
                   </div>
                   <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Yield IQ', A: 120, B: 110, fullMark: 150 },
                          { subject: 'Labor Velocity', A: 98, B: 130, fullMark: 150 },
                          { subject: 'Palate Data', A: 86, B: 130, fullMark: 150 },
                          { subject: 'Inventory Delta', A: 99, B: 100, fullMark: 150 },
                          { subject: 'Upsell Alpha', A: 85, B: 90, fullMark: 150 },
                          { subject: 'Staff Sync', A: 65, B: 85, fullMark: 150 },
                        ]}>
                          <PolarGrid stroke="#292524" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#78716c', fontSize: 10, fontWeight: 'bold' }} />
                          <Radar name="Venue" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                          <Radar name="Index" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                        </RadarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;

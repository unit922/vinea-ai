import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  FileText, 
  Globe, 
  Landmark, 
  Scale, 
  AlertCircle,
  ArrowRight,
  ClipboardPlus,
  Sparkles,
  Check,
  Copy
} from 'lucide-react';

const Corporate: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'diagnostics' | 'results' | 'share'>('profile');
  
  // Profile State
  const [profile, setProfile] = useState({
    venueName: '',
    venueType: 'Fine Dining Restaurant',
    weeklyCovers: 350,
    weeklyWineBottles: 120,
    currentPOS: '',
    currentReservations: '',
    currentInventory: 'Spreadsheets (Excel/Sheets)'
  });

  // Diagnostics State (9 key questions rated 1 to 5)
  const [scores, setScores] = useState<{ [key: string]: number }>({
    slowBottleCounts: 3,
    guessworkOrdering: 3,
    pouringWaste: 3,
    missingPreferences: 3,
    forgottenFollowups: 3,
    unpreparedFloorStaff: 3,
    diningChaos: 3,
    inflexibleSchedules: 3,
    longTraining: 3
  });

  const [copiedText, setCopiedText] = useState(false);

  const testCriteria = [
    {
      id: 'slowBottleCounts',
      category: '🍇 WINE CELLAR & STOCK',
      title: 'Slow Bottle Counts (counting stock by hand)',
      desc: 'Walking through cellars/fridges with clipboards, manual typing, or monthly counts only.'
    },
    {
      id: 'guessworkOrdering',
      category: '🍇 WINE CELLAR & STOCK',
      title: 'Ordering Drinks Based on Guesswork',
      desc: 'Buying stock based on guesses rather than upcoming table covers, weather, or fast-sellers.'
    },
    {
      id: 'pouringWaste',
      category: '🍇 WINE CELLAR & STOCK',
      title: 'Pouring Waste & Untracked Depletions',
      desc: 'Pours, tasters, and opens go unrecorded with no link to POS receipts.'
    },
    {
      id: 'missingPreferences',
      category: '👑 GUEST CARE & SERVICE',
      title: 'Missing Guest Preferences',
      desc: 'No quick, on-screen look-up for VIP favorites, grape varietals, allergy records, or seat preferences.'
    },
    {
      id: 'forgottenFollowups',
      category: '👑 GUEST CARE & SERVICE',
      title: 'Forgotten / Weak Feedback Loop',
      desc: 'Sending zero follow-up or generalized spam lists instead of hyper-targeted specific bottle invitations.'
    },
    {
      id: 'unpreparedFloorStaff',
      category: '👑 GUEST CARE & SERVICE',
      title: 'Unprepared Floor Staff & Delay',
      desc: 'Waitstaff feel nervous or slow when guests ask about vintages, profiles, or complex menu facts.'
    },
    {
      id: 'diningChaos',
      category: '⏱️ STAFF & CAPACITY',
      title: 'Dining Floor & Kitchen Gridlock',
      desc: 'Dining chairs and kitchen get slammed unpredictably due to weak table pacing.'
    },
    {
      id: 'inflexibleSchedules',
      category: '⏱️ STAFF & CAPACITY',
      title: 'Inflexible Roster / Labor Hours Waste',
      desc: 'Time-consuming adjustments to shifts when weather or booking volumes suddenly wave.'
    },
    {
      id: 'longTraining',
      category: '⏱️ STAFF & CAPACITY',
      title: 'Long Employee Training / Onboarding Time',
      desc: 'Weeks spent studying lists or manuals instead of active standalone high-ticket selling.'
    }
  ];

  const handleScoreChange = (id: string, val: number) => {
    setScores(prev => ({ ...prev, [id]: val }));
  };

  // Math models based on standard B2B hospitality friction benchmarks
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const frictionPercentage = Math.round((totalScore / 45) * 100);

  // Calibrate Estimated Loss (Drag Cost)
  // Industry Benchmark: average high friction costs ~$15 per cover in lost upselling, cellar shrinkage, and roster misalignments.
  const estimatedYearlyLoss = Math.round(
    profile.weeklyCovers * 52 * (totalScore / 18) * 4.9
  );

  const getFrictionLabel = () => {
    if (totalScore <= 15) return { text: 'Optimal Sync', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
    if (totalScore <= 30) return { text: 'Moderate Drag', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { text: 'Critical Leakage', color: 'text-rose-600 bg-rose-50 border-rose-100' };
  };

  const getSolutionMapping = (id: string) => {
    switch (id) {
      case 'slowBottleCounts':
      case 'pouringWaste':
        return { tool: 'AI Inventory Node', desc: 'Auto-syncs physical bottles and labels directly to live ledger registers.' };
      case 'guessworkOrdering':
        return { tool: 'Predictive Ordering Hub', desc: 'Calculates stock depletion trends using weather alerts and booking parameters.' };
      case 'missingPreferences':
        return { tool: 'Guest Palate Registry', desc: 'Gives managers and waitstaff a guest taste-profile overview in 3 seconds.' };
      case 'forgottenFollowups':
        return { tool: 'Automated Guest Dispatch', desc: 'Triggers targeted text/email recommendations to guests according to historical purchases.' };
      case 'unpreparedFloorStaff':
      case 'longTraining':
        return { tool: 'Sentinel Assistant Floor Coach', desc: 'Allows on-the-spot lookup of sommelier pairings and training templates.' };
      default:
        return { tool: 'Dynamic Operations System', desc: 'Unifies kitchen pace, predicts floor cycles, and syncs rotas.' };
    }
  };

  const generateReportText = () => {
    return `📊 HOSPITALITY OPERATIONAL DIAGNOSTIC AUDIT
Venue Brand: ${profile.venueName || 'High-Net-Worth Establishment'}
Type: ${profile.venueType}
Weekly Covers: ${profile.weeklyCovers} | Weekly Wine Bottles: ${profile.weeklyWineBottles}

=======================================
🔍 STRATEGIC FRICTION EVALUATION
TOTAL FRICTION SCORE: ${totalScore} / 45 (Friction Index: ${frictionPercentage}%)
STATUS: ${getFrictionLabel().text}
ESTIMATED YEARLY REVENUE DRAG: $${estimatedYearlyLoss.toLocaleString()}

---------------------------------------
⚠️ MAIN CRITICAL AREAS & AI ALIGNMENT:
${Object.entries(scores)
  .filter(([, value]) => value >= 3)
  .map(([key, value]) => {
    const item = testCriteria.find(c => c.id === key);
    const mapping = getSolutionMapping(key);
    return `\n* [FRIC ${value}/5] ${item?.title}\n  🔧 ALIGNMENT: Use ${mapping.tool} -> ${mapping.desc}`;
  })
  .join('\n')}

=======================================
🚀 RECOMMENDED NEXT STEPS:
1. Print official '/HOSPITALITY_AUDIT_TEMPLATE.md' and run a clipboard night-shift inventory walk-through.
2. Align high-impact red zones with Vinetelligence modules.
3. Access of the live platform demo to configure your exact table grids, cellar nodes, and staff lists.

Watch our complete Vinetelligence walkthrough here: https://youtu.be/TkSYN10JR-I`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

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

          {/* Interactive B2B Operational Auditor & ROI Assessor */}
          <section className="bg-stone-50 border border-stone-200 rounded-[4rem] overflow-hidden p-8 md:p-16 space-y-16 shadow-inner">
            <div className="max-w-3xl space-y-6">
              <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600">
                <ClipboardPlus className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest font-mono">Operations Diagnostic Tool</span>
              </div>
              <h3 className="text-4xl md:text-5xl font-serif font-black text-stone-900 italic leading-tight">
                Hospitality AI Readiness <br /> & Friction Assessor
              </h3>
              <p className="text-stone-600 text-sm md:text-base font-medium leading-relaxed font-sans">
                Where does your venue actually stand? Complete this quick 9-step audit mapped from our official <code className="bg-stone-150 px-1.5 py-0.5 rounded text-xs font-mono font-bold text-stone-800">/HOSPITALITY_AUDIT_TEMPLATE.md</code> framework to assess cellar drag, labor leakage, and customer premium yield.
              </p>
            </div>

            {/* Diagnostic Multi-step Container */}
            <div className="bg-white border border-stone-150 rounded-[3rem] shadow-xl overflow-hidden grid lg:grid-cols-12">
              {/* Left Sidebar Steps */}
              <div className="lg:col-span-4 bg-stone-900 text-white p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Calibration Progress</p>
                    <h4 className="text-xl font-serif font-black italic">Auditor Controls</h4>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between ${
                        activeTab === 'profile'
                          ? 'bg-white text-stone-950 border-white'
                          : 'bg-transparent text-stone-400 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <span>1. Venue Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('diagnostics')}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between ${
                        activeTab === 'diagnostics'
                          ? 'bg-white text-stone-950 border-white'
                          : 'bg-transparent text-stone-400 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <span>2. Friction Test</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('results')}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between ${
                        activeTab === 'results'
                          ? 'bg-white text-stone-950 border-white'
                          : 'bg-transparent text-stone-400 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <span>3. Custom AI Mapping</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('share')}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between ${
                        activeTab === 'share'
                          ? 'bg-white text-stone-950 border-white'
                          : 'bg-transparent text-stone-400 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <span>4. Export Dossier</span>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    <span>LIVE COEFFICIENT</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold">{frictionPercentage}%</span>
                    <span className="text-[10px] font-black uppercase text-stone-400 leading-none">Friction Index</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${frictionPercentage}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Right Workspace Context */}
              <div className="lg:col-span-8 p-8 md:p-12">
                {/* PROFILE CONFIG */}
                {activeTab === 'profile' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="space-y-2 pb-6 border-b border-stone-100">
                      <h4 className="text-2xl font-serif font-black italic text-stone-900">Step 1: Establishment Capacity Profile</h4>
                      <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">Define standard operating baseline scales.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 font-sans">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-stone-500 uppercase tracking-wider">Venue Name</label>
                        <input
                          type="text"
                          value={profile.venueName}
                          onChange={(e) => setProfile(prev => ({ ...prev, venueName: e.target.value }))}
                          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-stone-800"
                          placeholder="e.g. Napa Valley Resort"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-stone-500 uppercase tracking-wider">Establishment Type</label>
                        <select
                          value={profile.venueType}
                          onChange={(e) => setProfile(prev => ({ ...prev, venueType: e.target.value }))}
                          className="w-full border border-stone-200 bg-white rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-stone-800"
                        >
                          <option>Fine Dining Restaurant</option>
                          <option>Boutique Wine Bar</option>
                          <option>Hotel & Resort Lounge</option>
                          <option>Multi-unit Venue Group</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-stone-500 uppercase tracking-wider">Weekly Guest Covers</label>
                        <input
                          type="number"
                          value={profile.weeklyCovers}
                          onChange={(e) => setProfile(prev => ({ ...prev, weeklyCovers: Number(e.target.value) }))}
                          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-stone-800 font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-stone-500 uppercase tracking-wider">Weekly Open Wine Bottles</label>
                        <input
                          type="number"
                          value={profile.weeklyWineBottles}
                          onChange={(e) => setProfile(prev => ({ ...prev, weeklyWineBottles: Number(e.target.value) }))}
                          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none text-stone-800 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-stone-100 flex justify-end">
                      <button
                        onClick={() => setActiveTab('diagnostics')}
                        className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                      >
                        <span>Go to Friction Diagnostics</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* FRICTION TESTS */}
                {activeTab === 'diagnostics' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="space-y-2 pb-6 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="text-2xl font-serif font-black italic text-stone-900 font-serif">Step 2: Friction Level Audit</h4>
                        <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">Rate operational hassle levels (1 = perfect, 5 = headcount nightmare).</p>
                      </div>
                      <div className={`px-4 py-2 border rounded-full text-xs font-bold font-mono uppercase shrink-0 ${getFrictionLabel().color}`}>
                        {getFrictionLabel().text} ({totalScore} / 45)
                      </div>
                    </div>

                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {testCriteria.map((item) => (
                        <div key={item.id} className="p-5 border border-stone-150 rounded-2xl bg-stone-50/40 hover:bg-stone-50 transition-all space-y-3 font-sans">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black uppercase text-indigo-500 tracking-wider font-mono bg-indigo-50 px-2 py-0.5 rounded">{item.category}</span>
                              <h5 className="text-xs font-black text-stone-800 uppercase tracking-widest">{item.title}</h5>
                              <p className="text-xs text-stone-500 leading-normal font-medium">{item.desc}</p>
                            </div>
                            <span className="text-lg font-mono font-bold text-stone-900 border border-stone-200 bg-white shadow-sm w-9 h-9 rounded-xl flex items-center justify-center">
                              {scores[item.id]}
                            </span>
                          </div>
                          
                          <div className="flex gap-1 pt-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleScoreChange(item.id, i)}
                                className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-black transition-all ${
                                  scores[item.id] === i
                                    ? 'bg-stone-900 border-stone-900 text-white shadow-md font-bold'
                                    : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-500'
                                }`}
                              >
                                {i}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-8 border-t border-stone-100 flex justify-between items-center">
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="px-5 py-3 border border-stone-250 text-stone-500 hover:text-stone-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setActiveTab('results')}
                        className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                      >
                        <span>Calculate AI Impact</span>
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* DETAILED RESULTS & ROI */}
                {activeTab === 'results' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="space-y-2 pb-6 border-b border-stone-100">
                      <h4 className="text-2xl font-serif font-black italic text-stone-900">Step 3: Operational Drag Forecast & ROI</h4>
                      <p className="text-stone-500 text-xs font-medium uppercase tracking-wider font-mono">Calibrated impact breakdown & customized Vinetelligence solutions.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 bg-stone-900 text-white p-8 rounded-3xl">
                      <div className="space-y-2 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 pr-6">
                        <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#f5f5f4] bg-white/10 px-2 py-0.5 rounded font-mono">
                          <AlertCircle className="w-3 h-3 text-indigo-400" />
                          Estimated Profit Leak
                        </div>
                        <h5 className="text-4xl md:text-5xl font-mono font-bold leading-normal text-rose-400 leading-tight">
                          ${estimatedYearlyLoss.toLocaleString()}
                        </h5>
                        <p className="text-[10px] uppercase text-stone-400 font-bold tracking-wider leading-relaxed">
                          Yearly operational drag & spillage losses based on friction settings and Weekly covers.
                        </p>
                      </div>

                      <div className="space-y-2 pl-2">
                        <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#f5f5f4] bg-emerald-500/20 px-2 py-0.5 rounded font-mono">
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          AI Expected Solution
                        </div>
                        <h5 className="text-4xl md:text-5xl font-mono font-bold text-emerald-400 leading-tight leading-normal">
                          -${Math.round(estimatedYearlyLoss * 0.85).toLocaleString()}
                        </h5>
                        <p className="text-[10px] uppercase text-stone-400 font-bold tracking-wider leading-relaxed">
                          Recoverable cash-flow value unlocked within 60 days of fully provisioning Vinetelligence nodes.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Identified Red-Zone Bottlenecks & Software Alignment:</p>
                      <div className="space-y-2 font-sans text-xs">
                        {Object.entries(scores)
                          .filter(([, value]) => value >= 3)
                          .map(([key, value]) => {
                            const item = testCriteria.find(c => c.id === key);
                            const alignment = getSolutionMapping(key);
                            return (
                              <div key={key} className="flex gap-4 p-4 border border-stone-200 rounded-2xl bg-stone-50/40 hover:bg-stone-50 transition-all">
                                <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 font-mono text-[10px] font-black shrink-0 font-bold shadow-sm">
                                  {value}
                                </div>
                                <div className="space-y-1">
                                  <p className="font-extrabold text-stone-800 uppercase tracking-wider">{item?.title}</p>
                                  <p className="text-stone-500 font-medium leading-normal">{item?.desc}</p>
                                  <div className="inline-flex items-center gap-1.5 pt-1.5 text-xs text-emerald-600 font-bold">
                                    <Sparkles className="w-3 h-3 shrink-0" />
                                    <span>🔧 Deploy <span className="underline">{alignment.tool}</span>: {alignment.desc}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="pt-8 border-t border-stone-100 flex justify-between items-center">
                      <button
                        onClick={() => setActiveTab('diagnostics')}
                        className="px-5 py-3 border border-stone-250 text-stone-500 hover:text-stone-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setActiveTab('share')}
                        className="px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                      >
                        <span>Review & Export Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SHARE & EXPORT DOSSIER COPIER */}
                {activeTab === 'share' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="space-y-2 pb-6 border-b border-stone-100">
                      <h4 className="text-2xl font-serif font-black italic text-stone-900">Step 4: Strategic Executive Report Export</h4>
                      <p className="text-stone-500 text-xs font-medium uppercase tracking-wider">Perfect format to share on B2B LinkedIn boards, email, or send directly to stakeholder partners.</p>
                    </div>

                    <div className="relative rounded-2xl bg-stone-900 overflow-hidden border border-stone-800 p-6 shadow-2xl">
                      <div className="absolute top-5 right-5 z-10">
                        <button
                          onClick={copyToClipboard}
                          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 backdrop-blur-md border border-white/10"
                        >
                          {copiedText ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied Report!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy to Clipboard</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="text-stone-300 text-[10px] md:text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[300px] scrollbar-thin scrollbar-thumb-stone-800 pr-2">
                        {generateReportText()}
                      </pre>
                    </div>

                    <div className="p-5 border border-indigo-100 bg-indigo-50/40 rounded-3xl space-y-3 font-sans">
                      <div className="flex gap-3">
                        <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-stone-800 uppercase tracking-widest text-[10px]">Strategic Insight Node</h5>
                          <p className="text-xs text-[#292524] italic leading-relaxed">
                            Publishing this diagnostic on LinkedIn with a screenshot of your score or sharing it in business DMs is a strong way to drive direct attention. It provides crisp B2B authority showing exact digital solutions.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-stone-100 flex justify-between">
                      <button
                        onClick={() => setActiveTab('results')}
                        className="px-5 py-3 border border-stone-250 text-stone-500 hover:text-stone-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Back
                      </button>
                      <a
                        href="https://youtu.be/TkSYN10JR-I"
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                      >
                        <span>Watch Platform Demonstration</span>
                        <i className="fas fa-external-link-alt text-[9px]" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

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

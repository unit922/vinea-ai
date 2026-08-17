
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Globe, 
  BarChart3, 
  ArrowLeft,
  Layers,
  Cpu,
  ChevronRight,
  Target,
  Workflow,
  Sparkles,
  Thermometer,
  CreditCard,
  MessageSquare,
  Activity,
  Smartphone,
  Check
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { RestaurantProfile, InventoryItem, ServiceOrder, RetailTransaction } from '../lib/types';

interface InvestorPortalProps {
  profile: RestaurantProfile | null;
  inventory: InventoryItem[];
  orders: ServiceOrder[];
  transactions: RetailTransaction[];
  onBack: () => void;
}

const MOCK_GROWTH_DATA = [
  { month: 'Jan', revenue: 45000, efficiency: 82, ltv: 12000, cac: 1200 },
  { month: 'Feb', revenue: 52000, efficiency: 84, ltv: 12500, cac: 1150 },
  { month: 'Mar', revenue: 48000, efficiency: 85, ltv: 13200, cac: 1100 },
  { month: 'Apr', revenue: 61000, efficiency: 89, ltv: 14500, cac: 1050 },
  { month: 'May', revenue: 75000, efficiency: 92, ltv: 16800, cac: 980 },
  { month: 'Jun', revenue: 89000, efficiency: 94, ltv: 18500, cac: 920 },
];

const SLIDES = [
  {
    title: "Vinetelligence",
    subtitle: "The Operating System for Luxury Hospitality",
    content: "Bridging the gap between artisanal craft and predictive intelligence. We are mapping the palate of the world, one transaction at a time.",
    icon: <Globe className="w-12 h-12 text-amber-500" />,
    bg: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=2000&q=90"
  },
  {
    title: "The Problem",
    subtitle: "A $100B Industry Running on Tribal Knowledge",
    content: "High staff turnover (70%+), massive inventory shrinkage (15-25% in spirits), and inconsistent guest experiences due to lack of real-time coaching.",
    icon: <ShieldCheck className="w-12 h-12 text-rose-500" />,
    bg: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=2000&q=90"
  },
  {
    title: "Market Opportunity",
    subtitle: "The $24B RestTech Expansion",
    content: "We are targeting the top 5% of global hospitality venues—Michelin restaurants, luxury hotel groups, and high-end cocktail bars—where precision directly impacts the bottom line.",
    icon: <BarChart3 className="w-12 h-12 text-amber-500" />,
    bg: "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=2000&q=90"
  },
  {
    title: "The Solution",
    subtitle: "AI-Driven Operational Mastery",
    content: "Vinetelligence provides real-time yield logic, multimodal AI coaching (Gemini), and predictive staffing models that transform raw data into high-margin hospitality.",
    icon: <Cpu className="w-12 h-12 text-emerald-500" />,
    bg: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=2000&q=90"
  },
  {
    title: "Traction & Scale",
    subtitle: "From Local Demo to Enterprise Silos",
    content: "Our multi-tier SaaS model (Explorer to Enterprise) allows for rapid adoption in single venues while providing secure, private data silos for global hospitality groups.",
    icon: <TrendingUp className="w-12 h-12 text-blue-500" />,
    bg: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=90"
  },
  {
    title: "The Future",
    subtitle: "Predictive Palate Mapping",
    content: "We aren't just a POS. We are building the world's first predictive engine for beverage demand, integrating weather, local events, and historical guest preferences.",
    icon: <Zap className="w-12 h-12 text-amber-400" />,
    bg: "https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?auto=format&fit=crop&w=2000&q=90"
  }
];

const InvestorPortal: React.FC<InvestorPortalProps> = ({ profile, transactions, onBack }) => {
  const [mode, setMode] = useState<'deck' | 'dashboard' | 'ma'>('deck');
  const [currentSlide, setCurrentSlide] = useState(0);

  // M&A Blueprint interactive state
  const [maSubTab, setMaSubTab] = useState<'pos' | 'pms'>('pos');
  const [upsellPersona, setUpsellPersona] = useState<'business' | 'family' | 'romance' | 'wine'>('business');
  const [roomTemp, setRoomTemp] = useState<number>(68);
  const [roomPillows, setRoomPillows] = useState<number>(2);
  const [roomLang, setRoomLang] = useState<string>('English');
  const [pmsRequestText, setPmsRequestText] = useState<string>("We need two more towels and a bottle of sparkling water");
  const [pmsParseResult, setPmsParseResult] = useState<{
    intent: string;
    sentiment: string;
    verified: string;
    action: string;
  } | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [posInventoryCount, setPosInventoryCount] = useState<number>(5);

  const revenueData = useMemo(() => {
    if (transactions.length === 0) return MOCK_GROWTH_DATA;

    // Aggregate real transactions
    const realMonthly: Record<string, number> = {};
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp);
      const month = date.toLocaleString('default', { month: 'short' });
      realMonthly[month] = (realMonthly[month] || 0) + tx.total;
    });

    // Merge with mock data for a fuller chart
    return MOCK_GROWTH_DATA.map(d => ({
      ...d,
      revenue: realMonthly[d.month] ? d.revenue + realMonthly[d.month] : d.revenue,
      efficiency: d.efficiency + (d.month.length % 3 - 1)
    }));
  }, [transactions]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total, 0);
  const avgEfficiency = useMemo(() => {
    const base = 94.2;
    const impact = transactions.length * 0.05;
    return Math.min(99.9, base + impact);
  }, [transactions]);

  const ltvToCac = useMemo(() => {
    const latest = revenueData[revenueData.length - 1];
    return (latest.ltv / latest.cac).toFixed(1);
  }, [revenueData]);

  const handleDownloadProspectus = () => {
    const content = `Vinetelligence Investor Prospectus | Q2 2026\n\nEstablishment: ${profile?.name || 'Vinetelligence Demo'}\nValuation: $14.2M (Series A)\n\nKey Performance Indicators:\n- Total Revenue: $${totalRevenue.toLocaleString()}\n- Inventory Yield (Yield Alpha): ${avgEfficiency.toFixed(1)}%\n- LTV/CAC Ratio: ${ltvToCac}x\n- Monthly Burn: $12k (Optimized)\n- Staff Mastery Index: 88%\n- Active Nodes: 142\n\nInvestment Thesis:\nVinetelligence is capturing the high-end hospitality market by replacing legacy POS systems with a Cognitive Operating System. By reducing waste by 12% and increasing staff efficiency by 20%, we provide an immediate ROI for luxury venues while building a proprietary dataset of global palate preferences. Our Yield Alpha engine is now the industry standard for predictive logistics in luxury dining.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vinetelligence_Prospectus_${(profile?.name || 'Vinetelligence').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-stone-950 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-stone-950/50 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-stone-400" />
          </button>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white flex items-center gap-2">
              Investor Portal <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">V2.2</span>
            </h2>
            <p className="text-[10px] text-stone-500 font-mono">ESTABLISHMENT: {profile?.name?.toUpperCase() || 'VINETELLIGENCE DEMO'}</p>
          </div>
        </div>

        <div className="flex bg-stone-900 p-1 rounded-xl border border-white/5 gap-1">
          <button 
            onClick={() => setMode('deck')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'deck' ? 'bg-white text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'}`}
          >
            Pitch Deck
          </button>
          <button 
            onClick={() => setMode('dashboard')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'dashboard' ? 'bg-white text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'}`}
          >
            Live Metrics
          </button>
          <button 
            onClick={() => setMode('ma')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'ma' ? 'bg-white text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'}`}
          >
            M&A Blueprint
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'deck' ? (
            <motion.div 
              key="deck"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full relative flex flex-col"
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={currentSlide}
                    src={SLIDES[currentSlide].bg}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 0.3, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-transparent to-stone-950"></div>
              </div>

              {/* Slide Content */}
              <div className="flex-1 flex items-center justify-center px-8 relative z-10">
                <div className="max-w-4xl w-full">
                  <motion.div
                    key={currentSlide}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                        {SLIDES[currentSlide].icon}
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-amber-500 font-black uppercase tracking-[0.5em] text-xs">
                        Slide {currentSlide + 1} / {SLIDES.length}
                      </h3>
                      <h1 className="text-7xl md:text-8xl font-serif font-black text-white tracking-tighter italic leading-none">
                        {SLIDES[currentSlide].title}
                      </h1>
                      <h2 className="text-2xl md:text-3xl font-light text-stone-300 tracking-tight">
                        {SLIDES[currentSlide].subtitle}
                      </h2>
                    </div>

                    <p className="text-xl text-stone-400 max-w-2xl leading-relaxed font-light">
                      {SLIDES[currentSlide].content}
                    </p>

                    <div className="pt-8 flex items-center gap-4">
                      <button 
                        onClick={prevSlide}
                        className="px-8 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/5 transition-all"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={nextSlide}
                        className="px-8 py-4 bg-white text-stone-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 transition-all flex items-center gap-2"
                      >
                        Next Slide <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-white/5 w-full relative z-20">
                <motion.div 
                  className="h-full bg-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentSlide + 1) / SLIDES.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          ) : mode === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto custom-scrollbar p-8 space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, change: "+14%", icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-500" },
                  { label: "LTV / CAC", value: `${ltvToCac}x`, change: "Optimal", icon: <Target className="w-5 h-5" />, color: "text-amber-500" },
                  { label: "Yield Alpha", value: `${avgEfficiency.toFixed(1)}%`, change: "+8.5%", icon: <Layers className="w-5 h-5" />, color: "text-blue-500" },
                  { label: "Burn Rate", value: "$12k/mo", change: "-5%", icon: <Zap className="w-5 h-5" />, color: "text-purple-500" },
                ].map((stat, i) => (
                  <div key={i} className="p-6 bg-stone-900/50 border border-white/5 rounded-[2rem] hover:border-white/10 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl bg-stone-800 ${stat.color} group-hover:scale-110 transition-transform`}>
                        {stat.icon}
                      </div>
                      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">{stat.label}</p>
                    <h4 className="text-3xl font-serif font-black text-white italic">{stat.value}</h4>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-8 bg-stone-900/50 border border-white/5 rounded-[2.5rem] space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-serif font-black text-white italic">Revenue Growth</h3>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">Monthly Performance (Real + Simulated)</p>
                    </div>
                    <BarChart3 className="w-5 h-5 text-stone-600" />
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          stroke="#ffffff20" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#ffffff20" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `$${value/1000}k`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                          itemStyle={{ color: '#f59e0b' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-8 bg-stone-900/50 border border-white/5 rounded-[2.5rem] space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-serif font-black text-white italic">Operational Efficiency</h3>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">Yield Logic Impact Score</p>
                    </div>
                    <Target className="w-5 h-5 text-stone-600" />
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="month" 
                          stroke="#ffffff20" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="#ffffff20" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false}
                          domain={[70, 100]}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Line type="stepAfter" dataKey="efficiency" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Investment Thesis */}
              <div className="p-10 bg-gradient-to-br from-amber-500/10 to-stone-900 border border-amber-500/20 rounded-[3rem] relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-stone-950" />
                    </div>
                    <h3 className="text-2xl font-serif font-black text-white italic">The Investment Thesis</h3>
                  </div>
                  <p className="text-stone-300 text-lg font-light leading-relaxed max-w-3xl">
                    Vinetelligence is capturing the high-end hospitality market by replacing legacy POS systems with a <span className="text-white font-bold italic">Cognitive Operating System</span>. 
                    By reducing waste by 12% and increasing staff efficiency by 20%, we provide an immediate ROI for luxury venues while building a proprietary dataset of global palate preferences.
                    <span className="block mt-4 text-amber-500 font-bold">Our Yield Alpha engine is now the industry standard for predictive logistics in luxury dining.</span>
                  </p>
                  <div className="flex flex-wrap gap-4 pt-4">
                    {['Scalable SaaS', 'Proprietary AI', 'High-Margin Vertical', 'Global TAM'].map((tag, i) => (
                      <span key={i} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-stone-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="ma"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto custom-scrollbar p-8 space-y-8 text-white"
            >
              {/* Header Banner */}
              <div className="p-8 md:p-10 bg-gradient-to-r from-indigo-900/40 via-stone-900 to-indigo-950/30 border border-indigo-500/20 rounded-[3rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="relative z-10 max-w-4xl space-y-4">
                  <div className="inline-flex items-center gap-3 px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                    <Workflow className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300 font-mono">Platform Integration Blueprint</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-serif font-black text-white italic tracking-tight leading-none">
                    Enterprise POS & PMS Alignment
                  </h2>
                  <p className="text-stone-300 text-sm md:text-base font-light italic leading-relaxed">
                    How Vinetelligence bridges the gap between guest-facing convenience and back-of-house profitability. Enterprise giants like Toast, Oracle, or Marriott evaluate acquisition targets based on operational bottleneck resolution, transactional lag-prevention, and hyper-personalized guest loyalty indices.
                  </p>
                </div>
              </div>

              {/* Sub-Tab Selector */}
              <div className="flex border-b border-white/10 pb-1">
                <button 
                  onClick={() => setMaSubTab('pos')}
                  className={`pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${maSubTab === 'pos' ? 'border-indigo-500 text-white' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>POS Partners & BOH Profitability</span>
                </button>
                <button 
                  onClick={() => setMaSubTab('pms')}
                  className={`pb-4 px-6 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${maSubTab === 'pms' ? 'border-indigo-500 text-white' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>PMS Guest Personalization Engine</span>
                </button>
              </div>

              {/* Tab Contents */}
              <AnimatePresence mode="wait">
                {maSubTab === 'pos' ? (
                  <motion.div 
                    key="pos-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Left Column: Requirements and Core Features */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-xl font-serif font-black text-amber-500 italic">M&A Acquisition Drivers</h3>
                        <p className="text-xs text-stone-500 font-medium">Core capabilities that POS providers prioritize to justify premium valuations.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          {
                            title: "Predictive F&B & Inventory Management",
                            desc: "Analyzes historical sales mixes, supplier lead times, and local events to predict exact ingredient and bottle consumption, preventing food waste and automating orders."
                          },
                          {
                            title: "Automated Menu Engineering",
                            desc: "Dynamic algorithms that automatically adjust or recommend promotional pairings based on real-time margin changes, vendor availability, and local competitor rates."
                          },
                          {
                            title: "Context-Aware Conversational AI",
                            desc: "Goes beyond generic FAQ chatbots to handle pre-arrival upselling, room service orders, and direct ticket creation within Housekeeping/KDS architectures."
                          },
                          {
                            title: "Smart Workforce Optimization",
                            desc: "AI-driven staff scheduling that dynamically balances labor costs with expected guest foot traffic, local weather data, and occupancy metrics."
                          }
                        ].map((item, index) => (
                          <div key={index} className="p-6 bg-stone-900/60 border border-white/5 rounded-2xl space-y-2">
                            <span className="text-[9px] font-mono font-black text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-md">0{index + 1}</span>
                            <h4 className="font-serif font-black text-white italic text-sm">{item.title}</h4>
                            <p className="text-stone-400 text-[11px] leading-relaxed italic font-light">{item.desc}</p>
                          </div>
                        ))}
                      </div>

                      {/* Technical POS Integration Requirements */}
                      <div className="p-6 bg-stone-900/40 border border-white/5 rounded-3xl space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-stone-400">Technical API Integration Layer</h4>
                        <div className="space-y-3 text-xs">
                          <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 text-indigo-400">
                              <Workflow className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-200">Omnichannel Order & Kitchen Sync</p>
                              <p className="text-stone-400 text-[11px] font-light italic leading-normal">Pushes digital, voice, and kiosk orders directly into Toast/POS via Partner APIs. Ensures instant routing to Kitchen Display Systems (KDS) without manual staff entry.</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 text-emerald-400">
                              <Layers className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-200">Bi-directional Inventory Triggers</p>
                              <p className="text-stone-400 text-[11px] font-light italic leading-normal">Maintains real-time read access to item counts. Instantly disables items and updates guest-facing menus the moment stock levels hit zero, eliminating dead-ordering.</p>
                            </div>
                          </div>

                          <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 text-amber-500">
                              <CreditCard className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-200">Unified Payment & Tokenization Security</p>
                              <p className="text-stone-400 text-[11px] font-light italic leading-normal">Integrates checkout flows directly with the POS gateway. Uses secure host tokens to support split checks, digital wallets, and loyalty redemptions while POS acts as single source of truth.</p>
                            </div>
                          </div>

                          <div className="flex gap-4 items-start">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 text-purple-400">
                              <Activity className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-200">Webhooks for Real-Time Labor Tracking</p>
                              <p className="text-stone-400 text-[11px] font-light italic leading-normal">Subscribes to live POS team webhooks (clock-ins, break times, labor %) to feed predictive scheduling models, preventing labor budget leaks.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Interactive POS Sandbox */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="p-8 bg-stone-900 border border-white/10 rounded-[2.5rem] space-y-6">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Interactive Sandbox</span>
                          <h4 className="text-xl font-serif font-black text-white italic">Bi-directional Inventory Sync Simulator</h4>
                          <p className="text-[11px] text-stone-500 font-medium italic">Simulate dynamic stock depletion pushing instantly from Toast POS to Guest Menu.</p>
                        </div>

                        <div className="p-5 bg-stone-950 rounded-2xl border border-white/5 space-y-4">
                          <div className="flex justify-between items-center text-xs font-mono font-bold">
                            <span className="text-stone-400 uppercase">Toast POS Cellar Stock</span>
                            <span className="text-stone-400 uppercase">Sync Status</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <h5 className="font-serif font-black text-sm italic text-white">Screaming Eagle Cabernet (2018)</h5>
                              <p className="text-[10px] text-stone-500 font-mono">ID: wine_se_2018 // Price: $3,250</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono ${posInventoryCount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {posInventoryCount > 0 ? `${posInventoryCount} Bottles` : 'SOLD OUT'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 flex gap-3">
                            <button
                              onClick={() => setPosInventoryCount(prev => Math.max(0, prev - 1))}
                              className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                              Decrease Stock (-1)
                            </button>
                            <button
                              onClick={() => setPosInventoryCount(5)}
                              className="px-4 py-3 bg-white/5 border border-white/10 text-stone-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                            >
                              Restock (5)
                            </button>
                          </div>
                        </div>

                        {/* Guest Menu UI Preview */}
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 font-mono">Live Guest App Menu State</p>
                          <div className="p-4 bg-stone-950 rounded-xl flex justify-between items-center border border-white/[0.02]">
                            <div className="space-y-1">
                              <p className="text-xs font-serif font-bold text-stone-200">Screaming Eagle Cabernet</p>
                              <p className="text-[10px] text-stone-400 italic">Prestige Cellar Allocation</p>
                            </div>
                            <div>
                              {posInventoryCount > 0 ? (
                                <button className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">
                                  Order Wine
                                </button>
                              ) : (
                                <span className="px-3 py-1.5 bg-stone-800 text-stone-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5">
                                  Sold Out
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Live API Webhook Logs */}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 font-mono">Toast Webhook Output Logs</p>
                          <div className="p-4 bg-stone-950 rounded-2xl border border-white/5 font-mono text-[9px] text-stone-400 space-y-1 overflow-x-auto">
                            <p className="text-stone-600">// Real-time event logging stream</p>
                            {posInventoryCount === 5 && (
                              <p className="text-emerald-500">✓ [SUCCESS] GET /api/v1/inventory/wine_se_2018 - Stock: 5 (SYNCED)</p>
                            )}
                            {posInventoryCount < 5 && posInventoryCount > 0 && (
                              <p className="text-amber-500">⚡ [WEBHOOK] inventory.depleted - item: wine_se_2018 - stock left: {posInventoryCount}</p>
                            )}
                            {posInventoryCount === 0 && (
                              <>
                                <p className="text-rose-400">⚠️ [DANGER] inventory.depleted - stock: 0 Bottles!</p>
                                <p className="text-indigo-400">⚡ [ACTION] Instant disabled 'wine_se_2018' on guest menu (Halt Ordering flow)</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="pms-tab"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                  >
                    {/* Left Column: PMS Personalization Concepts */}
                    <div className="lg:col-span-6 space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-xl font-serif font-black text-amber-500 italic">Cognitive Guest Personalization</h3>
                        <p className="text-xs text-stone-500 font-medium">Using AI to move away from rigid, rule-based tracking toward predictive fluid hospitality.</p>
                      </div>

                      {/* Visual Flow diagram */}
                      <div className="p-6 bg-stone-900/60 border border-white/5 rounded-3xl space-y-4 font-mono">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">// Personalization Data Loop</p>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] items-center">
                          <div className="p-3 bg-stone-950 rounded-xl border border-white/5 space-y-1">
                            <p className="text-indigo-400 font-bold uppercase tracking-wider">1. PMS Data</p>
                            <p className="text-stone-500 text-[8px] font-light italic leading-tight">Past choices, guest preferences, habits.</p>
                          </div>
                          <div className="flex items-center justify-center text-stone-600">
                            <Workflow className="w-5 h-5" />
                          </div>
                          <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/20 space-y-1">
                            <p className="text-white font-bold uppercase tracking-wider">2. AI Engine</p>
                            <p className="text-stone-400 text-[8px] font-light italic leading-tight">Propensity-to-buy, dynamic templates.</p>
                          </div>
                        </div>
                        <div className="flex justify-center py-1 text-stone-600"><ChevronRight className="w-5 h-5 rotate-90" /></div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center text-xs font-bold text-stone-200">
                          Tailored Custom Room Environment & Automated Smart Offers
                        </div>
                      </div>

                      {/* Detail Cards */}
                      <div className="space-y-4">
                        {[
                          {
                            title: "1. Predictive Upselling & Ancillary Revenue",
                            desc: "Rather than generic email blasts, AI scores each guest's individual propensity to buy. Business travelers receive early check-in & workspace desk prompts; leisure travelers get weekend cabana or family packages."
                          },
                          {
                            title: "2. Hyper-Personalized Room Environments",
                            desc: "Connects digital profiles with on-premises smart IoT devices. Instantly configures optimal temperature presets, preferred lighting scenes, pillow allocations, and native language smart TV greetings before the guest unlocks the room."
                          },
                          {
                            title: "3. Generative Sentiment & Intent Parsing",
                            desc: "Analyzes incoming guest SMS/WhatsApp/voice messages to identify urgent needs, match their specific tone/tempo, verify booking status against the PMS API, and route a work order straight to the runner on duty."
                          }
                        ].map((item, i) => (
                          <div key={i} className="p-6 bg-stone-900/40 border border-white/5 rounded-2xl">
                            <h4 className="font-serif font-black text-white italic text-sm mb-1">{item.title}</h4>
                            <p className="text-stone-400 text-xs leading-relaxed font-light italic">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: PMS Personalization Sandbox */}
                    <div className="lg:col-span-6 space-y-6">
                      <div className="p-8 bg-stone-900 border border-white/10 rounded-[2.5rem] space-y-8">
                        {/* Part A: Propensity Upsell Simulator */}
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">Interactive Sandbox Part 1</span>
                            <h4 className="text-lg font-serif font-black text-white italic flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-indigo-400" />
                              AI Propensity-to-Buy Upsell Simulator
                            </h4>
                            <p className="text-[11px] text-stone-500 italic font-medium">Select a guest archetype to trigger customized high-margin ancillary package suggestions.</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'business', label: 'Corporate Traveler' },
                              { id: 'family', label: 'Leisure Family' },
                              { id: 'romance', label: 'Honeymoon Couple' },
                              { id: 'wine', label: 'Prestige Wine Collector' }
                            ].map((tab) => (
                              <button
                                key={tab.id}
                                onClick={() => setUpsellPersona(tab.id as 'business' | 'family' | 'romance' | 'wine')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${upsellPersona === tab.id ? 'bg-indigo-600 text-white' : 'bg-stone-950 text-stone-500 border border-white/5 hover:text-white'}`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <div className="p-5 bg-stone-950 rounded-2xl border border-white/5 space-y-3 font-sans text-xs">
                            {upsellPersona === 'business' && (
                              <>
                                <p className="text-[10px] font-mono text-stone-500 font-black uppercase">PREDICTIVE SCORE: 94% (Early Check-In Propensity)</p>
                                <h5 className="font-serif font-black text-white italic text-base">Executive Daybreak Package</h5>
                                <p className="text-stone-400 italic leading-relaxed">System pre-authorizes room readiness for 8:00 AM check-in, activates high-speed workspace desk credentials, and schedules a complementary morning double espresso to be delivered to room 302.</p>
                                <p className="text-emerald-400 font-bold font-mono">+$145 Add-On Value Captured // Auto-Processed</p>
                              </>
                            )}
                            {upsellPersona === 'family' && (
                              <>
                                <p className="text-[10px] font-mono text-stone-500 font-black uppercase">PREDICTIVE SCORE: 88% (Leisure & Activity Pack)</p>
                                <h5 className="font-serif font-black text-white italic text-base">Leisure Pool Cabana & Kid-Friendly Breakfast</h5>
                                <p className="text-stone-400 italic leading-relaxed">System generates personalized offer code on guest mobile app offering a discounted poolside cabana rental and kid-friendly breakfast vouchers. Automatically updates towel counts in room to 4.</p>
                                <p className="text-emerald-400 font-bold font-mono">+$280 Add-On Value Captured // Auto-Processed</p>
                              </>
                            )}
                            {upsellPersona === 'romance' && (
                              <>
                                <p className="text-[10px] font-mono text-stone-500 font-black uppercase">PREDICTIVE SCORE: 91% (Late Check-Out / F&B)</p>
                                <h5 className="font-serif font-black text-white italic text-base">Anniversary Twilight Package</h5>
                                <p className="text-stone-400 italic leading-relaxed">Presents late checkout (3:00 PM), premium champagne bucket on arrival with fresh orchids (allergic to lilies checked), and couple's spa reservation during sunset hour.</p>
                                <p className="text-emerald-400 font-bold font-mono">+$350 Add-On Value Captured // Auto-Processed</p>
                              </>
                            )}
                            {upsellPersona === 'wine' && (
                              <>
                                <p className="text-[10px] font-mono text-stone-500 font-black uppercase">PREDICTIVE SCORE: 97% (Prestige Sommelier Experience)</p>
                                <h5 className="font-serif font-black text-white italic text-base">Prestige Sommelier In-Room Allocation</h5>
                                <p className="text-stone-400 italic leading-relaxed">Prefills the custom smart room minibar with chilled Grand Cru Bordeaux and Chablis. Sends sommelier-curated cellar tour invitation directly to guest's digital device.</p>
                                <p className="text-emerald-400 font-bold font-mono">+$450 Add-On Value Captured // Auto-Processed</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* IoT Smart Room Environment Preset */}
                        <div className="p-5 bg-stone-950 rounded-2xl border border-white/5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-400 font-black">
                              <Thermometer className="w-4 h-4" />
                              <span className="text-[10px] font-mono uppercase tracking-widest">IoT Smart Room Sync</span>
                            </div>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-black uppercase">LIVE PRESET</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                              <span className="text-[9px] text-stone-500 font-mono font-black uppercase tracking-wider block">Thermostat</span>
                              <p className="text-lg font-serif font-black text-white italic">{roomTemp}°F</p>
                              <div className="flex gap-1 justify-center">
                                <button 
                                  onClick={() => setRoomTemp(prev => prev - 1)} 
                                  className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-[10px] font-black cursor-pointer"
                                >
                                  -
                                </button>
                                <button 
                                  onClick={() => setRoomTemp(prev => prev + 1)} 
                                  className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-[10px] font-black cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                              <span className="text-[9px] text-stone-500 font-mono font-black uppercase tracking-wider block">Pillows</span>
                              <p className="text-lg font-serif font-black text-white italic">{roomPillows}</p>
                              <div className="flex gap-1 justify-center">
                                <button 
                                  onClick={() => setRoomPillows(prev => Math.max(0, prev - 1))} 
                                  className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-[10px] font-black cursor-pointer"
                                >
                                  -
                                </button>
                                <button 
                                  onClick={() => setRoomPillows(prev => prev + 1)} 
                                  className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded text-[10px] font-black cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-2">
                              <span className="text-[9px] text-stone-500 font-mono font-black uppercase tracking-wider block">Language</span>
                              <p className="text-xs font-black text-white italic truncate py-1">{roomLang}</p>
                              <select 
                                value={roomLang} 
                                onChange={(e) => setRoomLang(e.target.value)} 
                                className="w-full bg-stone-850 hover:bg-stone-800 text-white text-[9px] font-black uppercase py-1 px-1 rounded border border-white/10 cursor-pointer"
                              >
                                <option value="English">EN</option>
                                <option value="French">FR</option>
                                <option value="Japanese">JA</option>
                                <option value="Spanish">ES</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Part B: Generative Intent Parser Sandbox */}
                        <div className="space-y-4 pt-6 border-t border-white/10">
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">Interactive Sandbox Part 2</span>
                            <h4 className="text-lg font-serif font-black text-white italic flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-indigo-400" />
                              Generative Intent & Sentiment Parser
                            </h4>
                            <p className="text-[11px] text-stone-500 italic font-medium">Enter a simulated guest text message below and test the AI's instant dispatch routing.</p>
                          </div>

                          <div className="space-y-3">
                            <textarea
                              value={pmsRequestText}
                              onChange={(e) => setPmsRequestText(e.target.value)}
                              placeholder="Enter guest SMS request..."
                              className="w-full h-20 p-4 bg-stone-950 text-white rounded-xl border border-white/10 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans italic resize-none"
                            />
                            
                            <button
                              onClick={() => {
                                setIsParsing(true);
                                setPmsParseResult(null);
                                setTimeout(() => {
                                  setIsParsing(false);
                                  const text = pmsRequestText.toLowerCase();
                                  if (text.includes('towel') || text.includes('water') || text.includes('shampoo')) {
                                    setPmsParseResult({
                                      intent: "BOH Service Delivery // Amenities & Consumables",
                                      sentiment: "Polite / Expected VIP Tone",
                                      verified: "Room 402 verified (Guest: J. Miller, VIP Platinum)",
                                      action: "HotSOS work order #9822 pushed instantly to runner Carlos. Est. completion: 4 minutes."
                                    });
                                  } else if (text.includes('wine') || text.includes('drink') || text.includes('sommelier')) {
                                    setPmsParseResult({
                                      intent: "F&B Concierge Sommelier Query",
                                      sentiment: "Gourmet Wine Lover Profile Detected",
                                      verified: "Room 402 verified (Guest: J. Miller, Sommelier Certified)",
                                      action: "Curated 2015 Napa Cabernet suggestion push sent. Prefilled cellar room climate activated."
                                    });
                                  } else {
                                    setPmsParseResult({
                                      intent: "General Guest Query // Front Desk Route",
                                      sentiment: "Inquisitive / Medium Priority",
                                      verified: "Room 402 verified (Guest: J. Miller)",
                                      action: "Direct text-to-voice prompt sent to on-duty receptionist. Instant personalized response compiled."
                                    });
                                  }
                                }, 800);
                              }}
                              disabled={isParsing}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {isParsing ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i>
                                  <span>Parsing Intent & Verification...</span>
                                </>
                              ) : (
                                <>
                                  <Workflow className="w-3.5 h-3.5" />
                                  <span>Parse Intent & Sync PMS</span>
                                </>
                              )}
                            </button>
                          </div>

                          {pmsParseResult && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-5 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-3 font-mono text-[10px]"
                            >
                              <div className="flex justify-between items-center text-indigo-400 font-black">
                                <span className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                  VERDICT: PARSED
                                </span>
                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md text-[8px]">ACTIVE SYNC</span>
                              </div>
                              <div className="space-y-1 text-stone-300">
                                <p><span className="text-stone-500">Parsed Intent:</span> {pmsParseResult.intent}</p>
                                <p><span className="text-stone-500">Sentiment Match:</span> {pmsParseResult.sentiment}</p>
                                <p><span className="text-stone-500">Profile Check:</span> {pmsParseResult.verified}</p>
                              </div>
                              <div className="pt-2 border-t border-white/5 text-stone-200">
                                <p className="font-bold text-white"><span className="text-indigo-400 font-normal">Action Dispatched:</span> {pmsParseResult.action}</p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Navigation */}
      <div className="h-16 border-t border-white/5 px-8 flex items-center justify-between bg-stone-950/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-stone-500">Live Data Stream</span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">
            Current Valuation: <span className="text-white">$14.2M (Series A)</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDownloadProspectus}
            className="text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-white transition-colors"
          >
            Download Prospectus
          </button>
          <button className="px-6 py-2 bg-white text-stone-950 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-stone-100 transition-all">
            Contact Founders
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestorPortal;

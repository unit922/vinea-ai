
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
  Target
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
  const [mode, setMode] = useState<'deck' | 'dashboard'>('deck');
  const [currentSlide, setCurrentSlide] = useState(0);

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
    const content = `Vinetelligence Investor Prospectus | Q2 2026\n\nEstablishment: ${profile?.name || 'Vinetelligence Sandbox'}\nValuation: $14.2M (Series A)\n\nKey Performance Indicators:\n- Total Revenue: $${totalRevenue.toLocaleString()}\n- Inventory Yield (Yield Alpha): ${avgEfficiency.toFixed(1)}%\n- LTV/CAC Ratio: ${ltvToCac}x\n- Monthly Burn: $12k (Optimized)\n- Staff Mastery Index: 88%\n- Active Nodes: 142\n\nInvestment Thesis:\nVinetelligence is capturing the high-end hospitality market by replacing legacy POS systems with a Cognitive Operating System. By reducing waste by 12% and increasing staff efficiency by 20%, we provide an immediate ROI for luxury venues while building a proprietary dataset of global palate preferences. Our Yield Alpha engine is now the industry standard for predictive logistics in luxury dining.`;
    
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
            <p className="text-[10px] text-stone-500 font-mono">ESTABLISHMENT: {profile?.name?.toUpperCase() || 'VINETELLIGENCE SANDBOX'}</p>
          </div>
        </div>

        <div className="flex bg-stone-900 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setMode('deck')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'deck' ? 'bg-white text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'}`}
          >
            Pitch Deck
          </button>
          <button 
            onClick={() => setMode('dashboard')}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'dashboard' ? 'bg-white text-stone-950 shadow-lg' : 'text-stone-500 hover:text-white'}`}
          >
            Live Metrics
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
          ) : (
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

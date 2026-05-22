
import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExecutiveKPI, RetailTransaction, ExternalCatalyst, GuestJourney, RestaurantProfile, AppView } from '../lib/types';
import { supabaseSync, isValidUUID } from '../services/supabaseSync';
import { motion } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Zap, 
  Brain, 
  Clock, 
  Layers,
  Target,
  QrCode,
  Database,
  X
} from 'lucide-react';
import { getBrandedTerm } from '../utils/branding';
import GuestAccess from './GuestAccess';

import { SectorInterestPoll } from './SectorInterestPoll';

import { TrendIntelligenceNode } from './TrendIntelligenceNode';

const VELOCITY_DATA = [
  { hour: '17:00', guests: 12, turnTime: 45, yield: 82 },
  { hour: '18:00', guests: 28, turnTime: 52, yield: 88 },
  { hour: '19:00', guests: 45, turnTime: 68, yield: 94 },
  { hour: '20:00', guests: 52, turnTime: 75, yield: 91 },
  { hour: '21:00', guests: 38, turnTime: 62, yield: 85 },
  { hour: '22:00', guests: 20, turnTime: 48, yield: 78 },
];

const CATALYSTS: ExternalCatalyst[] = [
  { type: 'Weather', label: 'Heavy Rain (Expected 20:00)', impactScore: 0.8, description: 'Increased demand for interior seating & warm beverages.' },
  { type: 'Event', label: 'Local Jazz Festival', impactScore: 0.95, description: 'Higher walk-in velocity expected between 18:00-21:00.' },
  { type: 'Holiday', label: 'Mid-Week Anniversary', impactScore: 0.4, description: 'Slight uptick in premium wine pairing requests.' }
];

const MOCK_JOURNEYS: GuestJourney[] = [
  {
    id: 'j1',
    arrivalTime: '2026-04-01T13:43:18Z',
    status: 'Seated',
    tableNumber: '4',
    partySize: 2,
    profile: {
      name: 'Julian Vane',
      location: 'Global Hub',
      favoriteBeverages: 'Vintage Bordeaux, Islay Scotch',
      dietaryRestrictions: 'None',
      pastOrders: 'Chateau Margaux 2010',
      pairingStyle: 'Classic'
    },
    pacingMode: 'Leisurely'
  },
  {
    id: 'j2',
    arrivalTime: '2026-04-01T14:08:18Z',
    status: 'Arrived',
    tableNumber: '12',
    partySize: 4,
    profile: {
      name: 'Elena Rossi',
      location: 'Milan, IT',
      favoriteBeverages: 'Negroni, Franciacorta',
      dietaryRestrictions: 'Gluten-Free',
      pastOrders: 'Antinori Tignanello',
      pairingStyle: 'Adventurous'
    },
    pacingMode: 'Standard'
  },
  {
    id: 'j3',
    arrivalTime: '2026-04-01T14:23:18Z',
    status: 'Confirmed',
    tableNumber: '8',
    partySize: 2,
    profile: {
      name: 'Marcus Chen',
      location: 'Singapore',
      favoriteBeverages: 'Sake, Japanese Whisky',
      dietaryRestrictions: 'Shellfish Allergy',
      pastOrders: 'Yamazaki 12yr',
      pairingStyle: 'Zero-Proof'
    },
    pacingMode: 'Brisk'
  }
];

interface ManagerDashboardProps {
  searchQuery?: string;
  inventory?: InventoryItem[];
  restaurantProfile?: RestaurantProfile | null;
  orders?: ServiceOrder[];
  transactions?: RetailTransaction[];
  authMode?: 'demo' | 'secure';
  setActiveView?: (view: AppView) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  inventory = [], 
  restaurantProfile, 
  orders = [], 
  transactions = [],
  authMode = 'demo',
  setActiveView
}) => {
  const isDemo = restaurantProfile?.edition === 'demo' || authMode === 'demo';

  const [showOpsPulse, setShowOpsPulse] = useState(false);
  const [showGuestQR, setShowGuestQR] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [serviceInsight, setServiceInsight] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceInsight && !isSynthesizing) {
      const timer = setTimeout(() => {
        if (isDemo) {
          setServiceInsight("Operational pulse stable. Yield Alpha is performing at 94.2% across all sectors. High density detected in Sector 4; staffing deployment optimized.");
        } else {
          setServiceInsight("Neural engine ready. Awaiting operational data flow to synthesize real-time service insights and yield optimizations.");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [serviceInsight, isSynthesizing, isDemo]);

  const handleSynthesizeService = async () => {
    setIsSynthesizing(true);
    try {
      const { geminiService } = await import('../services/geminiService');
      const res = await geminiService.getServiceEfficiencyInsights(orders, transactions);
      setServiceInsight(res.narrative);
    } catch (e) {
      console.error("Service synthesis failed", e);
    } finally {
      setIsSynthesizing(false);
    }
  };
  const [journeys, setJourneys] = useState<GuestJourney[]>(() => {
    const profileStr = localStorage.getItem('vinetelligence_profile');
    if (profileStr) {
      const profile: RestaurantProfile = JSON.parse(profileStr);
      if ((isDemo || profile.edition === 'demo') && !isValidUUID(profile.id)) {
        return MOCK_JOURNEYS;
      }
    }
    return [];
  });

  useEffect(() => {
    const profileStr = localStorage.getItem('vinetelligence_profile');
    if (!profileStr) return;
    const profile: RestaurantProfile = JSON.parse(profileStr);
    
    if (!isValidUUID(profile.id)) {
      return;
    }
    
    const unsubscribeJourneys = supabaseSync.subscribeToJourneys(profile.id, (data) => {
      if (data.length > 0) {
        setJourneys(data);
      }
    });

    const unsubscribeTables = supabaseSync.subscribeToTables(profile.id, () => {
      // Tables synced
    });

    return () => {
      unsubscribeJourneys();
      unsubscribeTables();
    };
  }, []);

  const activeJourneys = useMemo(() => journeys.filter(j => j.status !== 'Completed'), [journeys]);
  const completedJourneysCount = useMemo(() => journeys.filter(j => j.status === 'Completed').length, [journeys]);

  const depletionItems = useMemo(() => {
    if ((!inventory || inventory.length === 0) && isDemo) {
      return [
        { label: 'Premium Gin Node 01 (Critical) Matrix Final V12', status: 'Critical', time: '4h', color: 'text-sky-600', progress: 15 },
        { label: 'Organic Lemons', status: 'Warning', time: '12h', color: 'text-sky-600', progress: 35 },
        { label: 'House Red', status: 'Optimal', time: '48h', color: 'text-azure-600', progress: 75 },
        { label: 'Sparkling Water', status: 'Optimal', time: '72h', color: 'text-azure-600', progress: 90 },
      ];
    }

    if (!inventory || inventory.length === 0) return [];

    return inventory
      .map(item => {
        const max = item.maxStock || item.minStock * 3 || 100;
        const ratio = item.stock / max;
        const progress = Math.min(100, Math.max(0, ratio * 100));
        
        let status: 'Critical' | 'Warning' | 'Optimal' = 'Optimal';
        let color = 'text-sky-600';
        let time = '72h+';

        if (item.stock <= item.minStock * 0.5) {
          status = 'Critical';
          color = 'text-sky-600';
          time = '< 4h';
        } else if (item.stock <= item.minStock) {
          status = 'Warning';
          color = 'text-sky-600';
          time = '12h-24h';
        } else if (item.stock <= item.minStock * 1.5) {
          time = '24h-48h';
        }

        return {
          label: item.name,
          status,
          time,
          color,
          progress
        };
      })
      .sort((a, b) => a.progress - b.progress)
      .slice(0, 4);
  }, [inventory, isDemo]);

  const supplyChainInsight = useMemo(() => {
    if (depletionItems.length === 0) {
      return isDemo 
        ? "Supply Chain Optimal: All core inventory nodes reporting healthy stock levels."
        : "Inventory Engine Ready: Add your first beverage nodes to activate predictive supply audits.";
    }
    const critical = depletionItems.filter(i => i.status === 'Critical');
    if (critical.length > 0) {
      return `Neural Alert: ${critical[0].label} depletion imminent (${critical[0].time}). Catalyst suggests high demand. Fire restock protocol immediately.`;
    }
    const warning = depletionItems.filter(i => i.status === 'Warning');
    if (warning.length > 0) {
      return `Predictive Warning: ${warning[0].label} inventory low. Expected depletion in ${warning[0].time}. Schedule restock for next shift.`;
    }
    return "Supply Chain Optimal: All core inventory nodes reporting healthy stock levels. No immediate intervention required.";
  }, [depletionItems, isDemo]);

  const kpis: ExecutiveKPI[] = [
    { label: getBrandedTerm('yield_alpha', restaurantProfile || undefined), value: isDemo ? '94.2%' : '0.0%', change: isDemo ? 3.8 : 0, trend: 'up', benchmark: 'Model Confidence', description: 'Forecasted vs Actual capture' },
    { label: 'LTV / CAC Ratio', value: isDemo ? '18.2x' : '--', change: isDemo ? 5.4 : 0, trend: 'up', benchmark: 'Industry Avg: 4.2x', description: 'Lifetime Value vs Acquisition' },
    { label: 'Sentiment Alpha', value: isDemo ? '4.9/5' : '--', change: isDemo ? 1.4 : 0, trend: 'up', benchmark: 'Target 4.5', description: 'AI-derived guest satisfaction' },
    { label: 'Waste Index', value: isDemo ? '3.2%' : '0.0%', change: isDemo ? -12.4 : 0, trend: 'down', benchmark: 'Target < 5%', description: 'Atrophy & inventory loss' },
  ];

  const chartData = useMemo(() => {
    return isDemo ? VELOCITY_DATA : VELOCITY_DATA.map(d => ({ ...d, guests: 0, yield: 0 }));
  }, [isDemo]);

  return (
    <div className="flex flex-col min-h-full bg-slate-100 text-[#141414] font-sans selection:bg-[#141414] selection:text-slate-100">
      {/* AI Status Bar */}
      <div className="bg-slate-950 text-sky-500 px-4 md:px-8 py-2 flex flex-col md:flex-row justify-between items-center border-b border-sky-500/20 gap-2 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
            <span className="text-[7px] md:text-[8px] font-mono font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Neural Core: Online</span>
          </div>
          <div className="h-3 w-px bg-sky-500/20"></div>
          <span className="text-[7px] md:text-[8px] font-mono font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-60">Latency: 14ms</span>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <span className="text-[7px] md:text-[8px] font-mono font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-60 truncate max-w-[150px]">
            {getBrandedTerm('facility', restaurantProfile || undefined)} ID: {(() => {
              const profileStr = localStorage.getItem('vinetelligence_profile');
              return profileStr ? JSON.parse(profileStr).id : 'DEMO';
            })()}
          </span>
        </div>
      </div>

      {/* Header: Mission Control Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end px-4 md:px-8 py-4 md:py-6 border-b border-[#141414] gap-4">
        <div>
           <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-black italic tracking-tighter leading-none">Executive Command Center</h2>
           <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-[0.3em] opacity-50 mt-2 flex items-center gap-2">
             <Activity className="w-3 h-3 animate-pulse text-sky-600" />
             Live operational synthesis // {new Date().toLocaleTimeString()}
           </p>
        </div>
        <div className="flex gap-2 md:gap-4 w-full md:w-auto">
           <button 
             onClick={() => setActiveView?.(AppView.INTEGRATION_HUB)}
             className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-white border border-[#141414] text-[#141414] rounded-none text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-stone-100 transition-all active:scale-95"
           >
              <Database className="w-3 h-3" />
              Integrations
           </button>
           <button 
             onClick={() => setShowGuestQR(true)}
             className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-slate-100 text-[#141414] border border-[#141414] rounded-none text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-sky-500 hover:text-white transition-all active:scale-95"
           >
              <QrCode className="w-3 h-3" />
              Guest QR
           </button>
           <button 
             onClick={() => setShowOpsPulse(!showOpsPulse)} 
             className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-[#141414] text-slate-100 rounded-none text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-sky-600 transition-all active:scale-95"
           >
              <Zap className="w-3 h-3" />
              Node Pulse
           </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">
        {restaurantProfile?.subscriptionStatus === 'trial' && (
          <div className="bg-amber-500 text-stone-950 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-[0_20px_50px_rgba(245,158,11,0.2)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-950 text-amber-500 rounded-full flex items-center justify-center shadow-2xl">
                 <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Protocol Trial Active</h3>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                  You have {Math.max(1, Math.ceil((new Date(restaurantProfile.trialEndsAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days remaining in your high-performance evaluation period.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setActiveView?.(AppView.SETTINGS)}
              className="px-8 py-3 bg-stone-950 text-white rounded-none text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-stone-950 transition-all shadow-xl"
            >
              Upgrade Node Command
            </button>
          </div>
        )}
        {authMode === 'demo' && (
          <div className="bg-sky-500/10 border border-sky-500/20 p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
              <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-widest text-sky-500">
                Simulation Environment Active: Using Synthetic Neural Data
              </p>
            </div>
            <p className="text-[8px] md:text-[9px] italic text-sky-500/60">
              Connect a production Caribbean profile to view live beverage intelligence.
            </p>
          </div>
        )}
        {/* Guest QR Modal */}
        {showGuestQR && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] overflow-hidden rounded-none border border-slate-100/20 shadow-2xl bg-slate-100">
              <button 
                onClick={() => setShowGuestQR(false)}
                className="absolute top-4 right-4 md:top-8 md:right-8 z-50 p-2 bg-[#141414] text-slate-100 hover:text-sky-500 transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className="h-full overflow-y-auto custom-scrollbar touch-scrolling">
                <GuestAccess restaurantProfile={(() => {
                  const profileStr = localStorage.getItem('vinetelligence_profile');
                  return JSON.parse(profileStr || '{}');
                })()} />
              </div>
            </div>
          </div>
        )}

        {/* Catalyst Row: Editorial Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-950 text-slate-100 p-6 md:p-8 rounded-none border border-slate-900 flex flex-col lg:flex-row gap-6 md:gap-8 items-start lg:items-center relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 pointer-events-none hidden md:block">
             <Layers className="w-32 md:w-48 h-32 md:h-48" />
           </div>
           
           <div className="flex items-center gap-4 md:gap-6 shrink-0 relative z-10 w-full lg:w-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-sky-500 rounded-none flex items-center justify-center text-slate-950 shadow-[3px_3px_0px_#f1f5f9] md:shadow-[4px_4px_0px_#f1f5f9]">
                 <Target className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                 <p className="text-[8px] md:text-[10px] font-mono font-bold text-sky-500 uppercase tracking-widest">Predictive Catalyst Sync</p>
                 <p className="text-lg md:text-xl font-serif font-black italic">Predictive Demand Matrix Active</p>
              </div>
           </div>
           
           <div className="h-10 md:h-12 w-full lg:w-[1px] bg-slate-100/20 block"></div>
           
           <div className="flex-1 flex gap-4 md:gap-6 overflow-x-auto custom-scrollbar no-scrollbar relative z-10 w-full pb-2 lg:pb-0 touch-scrolling">
              {isDemo ? CATALYSTS.map((c, i) => (
                <div key={i} className="bg-slate-100/5 px-4 md:px-6 py-3 md:py-4 border border-slate-100/10 flex items-center gap-3 md:gap-4 shrink-0 hover:bg-slate-100/10 transition-all cursor-default">
                   <div className="text-sky-500 shrink-0">
                     {c.type === 'Weather' ? <Clock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                   </div>
                   <div className="min-w-0">
                      <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-tighter truncate">{c.label}</p>
                      <p className="text-[8px] md:text-[9px] opacity-50 font-medium italic truncate max-w-[150px] md:max-w-none">{c.description}</p>
                   </div>
                </div>
              )) : (
                 <div className="bg-slate-100/5 px-6 py-4 border border-slate-100/10 flex items-center gap-4 opacity-50 italic text-[10px] w-full">
                    <Activity className="w-4 h-4 text-sky-600 animate-pulse" />
                    Neural atmospheric catalysts will populate as local nodes synchronize.
                 </div>
               )}
            </div>
        </motion.div>

        {/* KPI Grid: Technical Data Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-950 border border-slate-950">
           {kpis.map((kpi, i) => (
             <motion.div 
               key={i} 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: i * 0.1 }}
               className="bg-slate-100 p-4 md:p-8 space-y-2 md:space-y-4 group hover:bg-slate-950 hover:text-slate-100 transition-all duration-300"
             >
                <div className="flex justify-between items-start">
                   <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100">{kpi.label}</p>
                   <div className={`flex items-center gap-1 text-[8px] md:text-[10px] font-mono font-bold ${kpi.trend === 'up' ? 'text-sky-600' : 'text-azure-600'}`}>
                      {kpi.trend === 'up' ? <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <TrendingDown className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                      {kpi.change}%
                   </div>
                </div>
                <p className="text-2xl md:text-5xl font-mono font-bold tracking-tighter tabular-nums">{kpi.value}</p>
                <div className="pt-2 md:pt-4 border-t border-slate-950/10 group-hover:border-slate-100/10">
                  <p className="text-[8px] md:text-[9px] font-bold opacity-50 italic uppercase tracking-tighter line-clamp-1">{kpi.description}</p>
                  <p className="text-[7px] md:text-[8px] font-mono opacity-30 mt-1">{kpi.benchmark}</p>
                </div>
             </motion.div>
           ))}
        </div>

        {/* AI Yield Optimization Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 bg-slate-950 text-slate-100 p-8 border border-slate-900 space-y-6">
              <div className="flex items-center gap-3">
                 <TrendingUp className="w-5 h-5 text-sky-500" />
                 <h3 className="text-xs font-mono font-bold uppercase tracking-widest">{getBrandedTerm('neural_yield', restaurantProfile || undefined)}</h3>
              </div>
              <div className="space-y-4">
                 <div className="p-4 bg-white/5 border border-white/10 rounded-none space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-mono font-bold uppercase opacity-50">Item: Sommelier Selection 05</span>
                       <span className="text-[10px] font-mono font-bold text-sky-500">+12.5%</span>
                    </div>
                    <p className="text-xs font-bold italic">"Dynamic pricing suggested: $185 → $208. high demand market catalyst detected."</p>
                 </div>
                 <div className="p-4 bg-white/5 border border-white/10 rounded-none space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-mono font-bold uppercase opacity-50">Item: Infused Negroni</span>
                       <span className="text-[10px] font-mono font-bold text-azure-500 underline decoration-azure-500/30">Inventory Shift</span>
                    </div>
                    <p className="text-xs font-bold italic">"Move 12 units from Node 04 to Node 01. Prep for 20:00 service rush."</p>
                 </div>
              </div>
              <button className="w-full py-3 bg-sky-600 text-slate-950 text-[10px] font-mono font-black uppercase tracking-widest hover:bg-white transition-all">
                 Apply All Optimizations
              </button>
           </div>

           <div className="lg:col-span-1 bg-slate-950 text-slate-100 p-8 border border-slate-900 space-y-6">
              <div className="flex items-center gap-3">
                 <Clock className="w-5 h-5 text-azure-500" />
                 <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Service Efficiency</h3>
              </div>
              <div className="space-y-4">
                 {serviceInsight ? (
                   <div className="p-4 bg-white/5 border border-white/10 rounded-none space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar touch-scrolling">
                     <div className="prose prose-invert prose-xs">
                       <p className="text-xs font-bold italic whitespace-pre-wrap">{serviceInsight}</p>
                     </div>
                   </div>
                 ) : (
                   <div className="p-8 border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                       <Brain className={`w-10 h-10 text-slate-600 ${isSynthesizing ? 'animate-pulse' : ''}`} />
                       <p className="text-[10px] font-mono font-bold uppercase opacity-50">Vinetelligence Idle</p>
                       <p className="text-[9px] italic opacity-30">Analyze tropical service timing and payment processing velocity.</p>
                   </div>
                 )}
              </div>
              <button 
                onClick={handleSynthesizeService}
                disabled={isSynthesizing}
                className="w-full py-3 bg-sky-500 text-slate-950 text-[10px] font-mono font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSynthesizing ? 'Analyzing Service Matrix...' : 'Synthesize Service Audit'}
              </button>
           </div>

           <div className="lg:col-span-1 bg-white border border-slate-950 p-8 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity z-0">
                 <div className="w-32 h-32 border-4 border-[#141414] rounded-full -mr-16 -mt-16 animate-spin-slow" />
              </div>
              
              <div className="flex justify-between items-start relative z-10">
                 <div>
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 italic">{getBrandedTerm('predictive_supply', restaurantProfile || undefined)}</h3>
                    <h4 className="text-xl font-serif font-black italic mt-1">{restaurantProfile?.aesthetic === 'light' ? 'Stock Forecast' : 'Inventory Depletion Forecast Matrix'}</h4>
                    <p className="text-[9px] font-mono font-bold mt-2 opacity-70 border-l-2 border-[#141414] pl-3 italic max-w-md">
                       {supplyChainInsight}
                    </p>
                 </div>
                 <div className="px-3 py-1 bg-slate-100 text-[8px] font-mono font-bold uppercase tracking-widest">Next 72 Hours (Confidence: 94%)</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 relative z-10">
                 {depletionItems.map((item, i) => (
                   <div key={i} className="p-4 border border-slate-100 space-y-3 hover:bg-slate-50 transition-colors group/item">
                      <div className="flex justify-between items-start">
                         <p className="text-[9px] font-mono font-bold uppercase opacity-50">{item.label}</p>
                         <div className={`w-1 h-1 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                      </div>
                      <div className="space-y-1">
                         <p className={`text-xs font-black ${item.color}`}>{item.status}</p>
                         <div className="w-full h-[2px] bg-slate-100 overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${item.progress}%` }}
                               className={`h-full ${item.color.replace('text-', 'bg-')}`}
                            />
                         </div>
                      </div>
                      <p className="text-[8px] font-mono opacity-30">Depletion in {item.time}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Sector Interest Poll: Market Research */}
        <div className="grid grid-cols-1 gap-8">
           <SectorInterestPoll />
        </div>

        {/* Main Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* Chart: Technical Precision */}
           <div className="lg:col-span-8 bg-white p-10 border border-slate-950 shadow-[8px_8px_0px_#020617] space-y-10">
              <div className="flex justify-between items-end">
                 <div>
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 italic">Service Pacing // Yield Velocity</h3>
                    <h4 className="text-2xl font-serif font-black italic mt-2">Operational Flow Synthesis</h4>
                 </div>
                 <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#141414]"></div>
                      <span className="text-[9px] font-mono font-bold uppercase">Guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500"></div>
                      <span className="text-[9px] font-mono font-bold uppercase">Yield Alpha</span>
                    </div>
                 </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="1 4" vertical={false} stroke="#141414" strokeOpacity={0.1} />
                      <XAxis 
                        dataKey="hour" 
                        axisLine={{ stroke: '#141414', strokeWidth: 1 }} 
                        tickLine={false} 
                        tick={{fill: '#141414', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace'}} 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#141414', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace'}} 
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#020617', 
                          border: 'none', 
                          borderRadius: '0px',
                          color: '#f1f5f9',
                          fontFamily: 'monospace',
                          fontSize: '10px'
                        }} 
                        itemStyle={{ color: '#f1f5f9' }}
                      />
                      <Area 
                        type="stepAfter" 
                        dataKey="guests" 
                        stroke="#020617" 
                        strokeWidth={2} 
                        fill="#020617" 
                        fillOpacity={0.05} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="yield" 
                        stroke="#0ea5e9" 
                        strokeWidth={3} 
                        fill="none" 
                      />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
           
           {/* AI Insight: Hardware Style */}
           <div className="lg:col-span-4 bg-slate-950 text-slate-100 p-10 border border-slate-950 shadow-[8px_8px_0px_#0ea5e9] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                <Brain className="w-64 h-64" />
              </div>
              
              <div className="space-y-8 relative z-10">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-sky-500">Vinetelligence Operational Pulse</h4>
                 </div>
                 <p className="text-3xl font-serif font-black italic leading-[1.1] tracking-tight">
                   {isDemo 
                     ? "\"Atmospheric Shift Detected: Heavy Rain @ 20:00. <span class=\"text-sky-500 underline underline-offset-8 decoration-1\">Optimize Interior Node 02</span>. Restock premium selections; catalyst suggests 22% uptick in high-margin pairings.\""
                     : "\"Neural engine synchronized. Awaiting high-density catalysts to trigger predictive atmospheric shift protocols and yield-optimized staff deployment suggestions.\""}
                 </p>
              </div>
              
              <div className="pt-12 space-y-6 relative z-10">
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase opacity-50">Prediction Confidence</p>
                      <p className="text-2xl font-mono font-bold text-sky-500">98.4%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono font-bold uppercase opacity-50">Model Status</p>
                      <p className="text-xs font-mono font-bold uppercase text-sky-500">Optimal</p>
                    </div>
                 </div>
                 <div className="h-1 bg-white/10 rounded-none overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '98.4%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]"
                    ></motion.div>
                 </div>
              </div>
           </div>
        </div>

        {/* Secondary Grid: Data Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Live Journey Feed: Data Grid Style */}
           <div className="lg:col-span-2 bg-white border border-[#141414] shadow-[8px_8px_0px_#141414] flex flex-col">
              <div className="px-8 py-6 border-b border-[#141414] flex justify-between items-center bg-[#141414] text-[#E4E3E0]">
                 <div className="flex items-center gap-4">
                    <div className="relative">
                      <Users className="w-5 h-5 text-emerald-500" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-sky-500 rounded-full animate-ping"></div>
                    </div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest">Live Journey Synthesis</h3>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-[8px] font-mono font-black uppercase tracking-widest text-sky-500 bg-sky-500/10 px-2 py-1 border border-sky-500/20">AI Active</span>
                    <span className="text-[10px] font-mono font-bold uppercase opacity-50">{activeJourneys.length || 0} Active Nodes</span>
                    {completedJourneysCount > 0 && (
                       <span className="text-[10px] font-mono font-bold uppercase opacity-30 italic">{completedJourneysCount} Finalized Today</span>
                    )}
                 </div>
              </div>
              
              <div className="flex-1 overflow-x-auto custom-scrollbar">
                 <div className="min-w-[800px] lg:min-w-0">
                   <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-[#E4E3E0] border-b border-[#141414] z-10">
                         <tr className="text-[9px] font-mono font-bold uppercase opacity-50">
                            <th className="px-8 py-4">Identity</th>
                            <th className="px-8 py-4">Node</th>
                            <th className="px-8 py-4">Status</th>
                            <th className="px-8 py-4">AI Recommendation</th>
                            <th className="px-8 py-4 text-right">Sentiment</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]/10">
                         {activeJourneys.length > 0 ? activeJourneys.map((j, i) => (
                           <tr key={i} className="hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group cursor-default">
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] group-hover:bg-[#E4E3E0] group-hover:text-[#141414] flex items-center justify-center font-mono font-bold text-xs transition-colors">
                                      {j.profile.name[0]}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold">{j.profile.name}</p>
                                      <p className="text-[8px] font-mono opacity-50 group-hover:opacity-100">{j.profile.location}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-[10px] font-mono font-bold uppercase opacity-50 group-hover:opacity-100">Table {j.tableNumber}</td>
                              <td className="px-8 py-5">
                                 <span className={`text-[9px] font-mono font-bold uppercase px-2 py-1 border ${
                                   j.status === 'Completed' ? 'border-sky-500 text-sky-600' :
                                   j.status === 'Seated' ? 'border-sky-500 text-sky-600' :
                                   'border-[#141414]/20 text-stone-400'
                                 }`}>
                                   {j.status}
                                 </span>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-2">
                                    <Brain className="w-3 h-3 text-sky-500" />
                                    <span className="text-[10px] italic font-medium">
                                      {j.profile.pairingStyle === 'Classic' ? 'Suggest 2010 Margaux' : 
                                       j.profile.pairingStyle === 'Adventurous' ? 'Offer Franciacorta Flight' : 
                                       'Prioritize Zero-Proof Botanical'}
                                    </span>
                                  </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <div className="flex items-center justify-end gap-1">
                                    <div className="w-12 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-sky-500" style={{ width: '92%' }}></div>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold">4.8</span>
                                 </div>
                              </td>
                           </tr>
                         )) : (
                           <tr>
                              <td colSpan={5} className="px-8 py-20 text-center text-stone-400 italic font-serif">Awaiting operational data...</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                 </div>
              </div>
           </div>
           
           {/* Specialized Trend Node: Market Extraction Style */}
           <div className="lg:col-span-1">
              <TrendIntelligenceNode />
           </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

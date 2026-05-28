
import React, { useMemo, useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExecutiveKPI, RetailTransaction, ExternalCatalyst, GuestJourney, RestaurantProfile } from '../lib/types';
import { INITIAL_SHIFTS } from '../constants';
import { supabaseSync, isValidUUID } from '../services/supabaseSync';
import { motion } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Zap, 
  Brain, 
  AlertTriangle, 
  Clock, 
  Layers,
  Target,
  QrCode,
  X
} from 'lucide-react';
import { getBrandedTerm } from '../utils/branding';
import GuestAccess from './GuestAccess';

import { SectorInterestPoll } from './SectorInterestPoll';

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
      location: 'London, UK',
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
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  inventory = [], 
  restaurantProfile, 
  orders = [], 
  transactions = [],
  authMode = 'demo'
}) => {
  const [staff] = useState(() => {
    const saved = localStorage.getItem('vinetelligence_staff_list') || localStorage.getItem('vinea_staff_list');
    const profile = restaurantProfile || JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
    const isDemo = (!profile.edition || profile.edition === 'demo') && !isValidUUID(profile.id);
    return saved ? JSON.parse(saved) : (isDemo ? INITIAL_SHIFTS.map(s => ({ ...s, burnoutIndex: Math.floor(Math.random() * 40) + 10 })) : []);
  });

  const [showOpsPulse, setShowOpsPulse] = useState(false);
  const [showGuestQR, setShowGuestQR] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [serviceInsight, setServiceInsight] = useState<string | null>(null);

  const handleSynthesizeService = async () => {
    setIsSynthesizing(true);
    try {
      const { geminiService } = await import('../services/geminiService');
      const res = await geminiService.getServiceEfficiencyInsights(orders, transactions);
      setServiceInsight(res.narrative);
    } catch (e) {
      console.error("Vinetelligence: Service synthesis failed", e);
    } finally {
      setIsSynthesizing(false);
    }
  };
  const [journeys, setJourneys] = useState<GuestJourney[]>(() => {
    const profileStr = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
    if (profileStr) {
      const profile: RestaurantProfile = JSON.parse(profileStr);
      if (profile.edition === 'demo' && !isValidUUID(profile.id)) {
        return MOCK_JOURNEYS;
      }
    }
    return [];
  });

  useEffect(() => {
    const profileStr = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
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
    if (!inventory || inventory.length === 0) {
      return [
        { label: 'Premium Gin Node 01 (Critical) Matrix Final V12', status: 'Critical', time: '4h', color: 'text-indigo-600', progress: 15 },
        { label: 'Organic Lemons', status: 'Warning', time: '12h', color: 'text-indigo-600', progress: 35 },
        { label: 'House Red', status: 'Optimal', time: '48h', color: 'text-emerald-600', progress: 75 },
        { label: 'Sparkling Water', status: 'Optimal', time: '72h', color: 'text-emerald-600', progress: 90 },
      ];
    }

    return inventory
      .map(item => {
        const max = item.maxStock || item.minStock * 3 || 100;
        const ratio = item.stock / max;
        const progress = Math.min(100, Math.max(0, ratio * 100));
        
        let status: 'Critical' | 'Warning' | 'Optimal' = 'Optimal';
        let color = 'text-emerald-600';
        let time = '72h+';

        if (item.stock <= item.minStock * 0.5) {
          status = 'Critical';
          color = 'text-indigo-600';
          time = '< 4h';
        } else if (item.stock <= item.minStock) {
          status = 'Warning';
          color = 'text-indigo-600';
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
  }, [inventory]);

  const supplyChainInsight = useMemo(() => {
    const critical = depletionItems.filter(i => i.status === 'Critical');
    if (critical.length > 0) {
      return `Neural Alert: ${critical[0].label} depletion imminent (${critical[0].time}). Catalyst suggests high demand. Fire restock protocol immediately.`;
    }
    const warning = depletionItems.filter(i => i.status === 'Warning');
    if (warning.length > 0) {
      return `Predictive Warning: ${warning[0].label} inventory low. Expected depletion in ${warning[0].time}. Schedule restock for next shift.`;
    }
    return "Supply Chain Optimal: All core inventory nodes reporting healthy stock levels. No immediate intervention required.";
  }, [depletionItems]);

  const kpis: ExecutiveKPI[] = [
    { label: getBrandedTerm('yield_alpha', restaurantProfile || undefined), value: '94.2%', change: 3.8, trend: 'up', benchmark: 'Model Confidence', description: 'Forecasted vs Actual capture' },
    { label: 'LTV / CAC Ratio', value: '18.2x', change: 5.4, trend: 'up', benchmark: 'Industry Avg: 4.2x', description: 'Lifetime Value vs Acquisition' },
    { label: 'Sentiment Alpha', value: '4.9/5', change: 1.4, trend: 'up', benchmark: 'Target 4.5', description: 'AI-derived guest satisfaction' },
    { label: 'Waste Index', value: '3.2%', change: -12.4, trend: 'down', benchmark: 'Target < 5%', description: 'Spillage & inventory loss' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* AI Status Bar */}
      <div className="bg-[#141414] text-emerald-500 px-4 md:px-8 py-2 flex flex-col md:flex-row justify-between items-center border-b border-emerald-500/20 gap-2 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[7px] md:text-[8px] font-mono font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Core: Online</span>
          </div>
          <div className="h-3 w-px bg-emerald-500/20"></div>
          <span className="text-[7px] md:text-[8px] font-mono font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-60">Latency: 14ms</span>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          <span className="text-[7px] md:text-[8px] font-mono font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-60 truncate max-w-[150px]">{getBrandedTerm('facility', restaurantProfile || undefined)} ID: {localStorage.getItem('vinetelligence_profile') ? JSON.parse(localStorage.getItem('vinetelligence_profile')!).id : (localStorage.getItem('vinea_profile') ? JSON.parse(localStorage.getItem('vinea_profile')!).id : 'DEMO')}</span>
        </div>
      </div>

      {/* Header: Mission Control Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end px-4 md:px-8 py-4 md:py-6 border-b border-[#141414] gap-4">
        <div>
           <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-black italic tracking-tighter leading-none">Command Center</h2>
           <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-[0.3em] opacity-50 mt-2 flex items-center gap-2">
             <Activity className="w-3 h-3 animate-pulse text-emerald-600" />
             Live Operational Synthesis // {new Date().toLocaleTimeString()}
           </p>
        </div>
        <div className="flex gap-2 md:gap-4 w-full md:w-auto">
           <button 
             onClick={() => setShowGuestQR(true)}
             className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-[#E4E3E0] text-[#141414] border border-[#141414] rounded-none text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-indigo-500 hover:text-white transition-all active:scale-95"
           >
              <QrCode className="w-3 h-3" />
              Guest QR
           </button>
           <button 
             onClick={() => setShowOpsPulse(!showOpsPulse)} 
             className="flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-[#141414] text-[#E4E3E0] rounded-none text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 hover:bg-emerald-600 transition-all active:scale-95"
           >
              <Zap className="w-3 h-3" />
              Node Pulse
           </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8">
        {authMode === 'demo' && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-500">
                Simulation Environment Active: Using Synthetic Intelligence Data
              </p>
            </div>
            <p className="text-[8px] md:text-[9px] italic text-indigo-500/60">
              Connect a production profile to view live beverage intelligence.
            </p>
          </div>
        )}
        {/* Guest QR Modal */}
        {showGuestQR && (
          <div className="fixed inset-0 z-[1000] bg-[#141414]/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] overflow-hidden rounded-none border border-[#E4E3E0]/20 shadow-2xl bg-[#E4E3E0]">
              <button 
                onClick={() => setShowGuestQR(false)}
                className="absolute top-4 right-4 md:top-8 md:right-8 z-50 p-2 bg-[#141414] text-[#E4E3E0] hover:text-indigo-500 transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className="h-full overflow-y-auto custom-scrollbar touch-scrolling">
                <GuestAccess restaurantProfile={JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}')} />
              </div>
            </div>
          </div>
        )}

        {/* Catalyst Row: Editorial Style */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] text-[#E4E3E0] p-6 md:p-8 rounded-none border border-[#141414] flex flex-col lg:flex-row gap-6 md:gap-8 items-start lg:items-center relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 pointer-events-none hidden md:block">
             <Layers className="w-32 md:w-48 h-32 md:h-48" />
           </div>
           
           <div className="flex items-center gap-4 md:gap-6 shrink-0 relative z-10 w-full lg:w-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-500 rounded-none flex items-center justify-center text-[#141414] shadow-[3px_3px_0px_#E4E3E0] md:shadow-[4px_4px_0px_#E4E3E0]">
                 <Target className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                 <p className="text-[8px] md:text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-widest">External Catalyst Sync</p>
                 <p className="text-lg md:text-xl font-serif font-black italic">Predictive Demand Matrix Active</p>
              </div>
           </div>
           
           <div className="h-10 md:h-12 w-full lg:w-[1px] bg-[#E4E3E0]/20 block"></div>
           
           <div className="flex-1 flex gap-4 md:gap-6 overflow-x-auto custom-scrollbar no-scrollbar relative z-10 w-full pb-2 lg:pb-0 touch-scrolling">
              {CATALYSTS.map((c, i) => (
                <div key={i} className="bg-[#E4E3E0]/5 px-4 md:px-6 py-3 md:py-4 border border-[#E4E3E0]/10 flex items-center gap-3 md:gap-4 shrink-0 hover:bg-[#E4E3E0]/10 transition-all cursor-default">
                   <div className="text-emerald-500 shrink-0">
                     {c.type === 'Weather' ? <Clock className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                   </div>
                   <div className="min-w-0">
                      <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-tighter truncate">{c.label}</p>
                      <p className="text-[8px] md:text-[9px] opacity-50 font-medium italic truncate max-w-[150px] md:max-w-none">{c.description}</p>
                   </div>
                </div>
              ))}
           </div>
        </motion.div>

        {/* KPI Grid: Technical Data Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#141414] border border-[#141414]">
           {kpis.map((kpi, i) => (
             <motion.div 
               key={i} 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: i * 0.1 }}
               className="bg-[#E4E3E0] p-4 md:p-8 space-y-2 md:space-y-4 group hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-300"
             >
                <div className="flex justify-between items-start">
                   <p className="text-[8px] md:text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100">{kpi.label}</p>
                   <div className={`flex items-center gap-1 text-[8px] md:text-[10px] font-mono font-bold ${kpi.trend === 'up' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                      {kpi.trend === 'up' ? <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <TrendingDown className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                      {kpi.change}%
                   </div>
                </div>
                <p className="text-2xl md:text-5xl font-mono font-bold tracking-tighter tabular-nums">{kpi.value}</p>
                <div className="pt-2 md:pt-4 border-t border-[#141414]/10 group-hover:border-[#E4E3E0]/10">
                  <p className="text-[8px] md:text-[9px] font-bold opacity-50 italic uppercase tracking-tighter line-clamp-1">{kpi.description}</p>
                  <p className="text-[7px] md:text-[8px] font-mono opacity-30 mt-1">{kpi.benchmark}</p>
                </div>
             </motion.div>
           ))}
        </div>

        {/* AI Yield Optimization Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] space-y-6">
              <div className="flex items-center gap-3">
                 <TrendingUp className="w-5 h-5 text-emerald-500" />
                 <h3 className="text-xs font-mono font-bold uppercase tracking-widest">{getBrandedTerm('neural_yield', restaurantProfile || undefined)}</h3>
              </div>
              <div className="space-y-4">
                 <div className="p-4 bg-white/5 border border-white/10 rounded-none space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-mono font-bold uppercase opacity-50">Item: Barolo 2016</span>
                       <span className="text-[10px] font-mono font-bold text-emerald-500">+12.5%</span>
                    </div>
                    <p className="text-xs font-bold italic">"Dynamic pricing suggested: $185 → $208. High demand catalyst detected."</p>
                 </div>
                 <div className="p-4 bg-white/5 border border-white/10 rounded-none space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-mono font-bold uppercase opacity-50">Item: Negroni Classico</span>
                       <span className="text-[10px] font-mono font-bold text-indigo-500 underline decoration-indigo-500/30">Inventory Shift</span>
                    </div>
                    <p className="text-xs font-bold italic">"Move 12 units from Node 04 to Node 01. Prep for 20:00 rush."</p>
                 </div>
              </div>
              <button className="w-full py-3 bg-emerald-600 text-[#141414] text-[10px] font-mono font-black uppercase tracking-widest hover:bg-white transition-all">
                 Apply All Optimizations
              </button>
           </div>

           <div className="lg:col-span-1 bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] space-y-6">
              <div className="flex items-center gap-3">
                 <Clock className="w-5 h-5 text-indigo-500" />
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
                      <Brain className={`w-10 h-10 text-stone-600 ${isSynthesizing ? 'animate-pulse' : ''}`} />
                      <p className="text-[10px] font-mono font-bold uppercase opacity-50">Intelligence Idle</p>
                      <p className="text-[9px] italic opacity-30">Analyze service timing and payment processing velocity.</p>
                   </div>
                 )}
              </div>
              <button 
                onClick={handleSynthesizeService}
                disabled={isSynthesizing}
                className="w-full py-3 bg-indigo-500 text-[#141414] text-[10px] font-mono font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSynthesizing ? 'Analyzing Service Matrix...' : 'Synthesize Service Audit'}
              </button>
           </div>

           <div className="lg:col-span-1 bg-white border border-[#141414] p-8 flex flex-col justify-between group relative overflow-hidden">
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
                 <div className="px-3 py-1 bg-stone-100 text-[8px] font-mono font-bold uppercase tracking-widest">Next 72 Hours (Confidence: 94%)</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 relative z-10">
                 {depletionItems.map((item, i) => (
                   <div key={i} className="p-4 border border-stone-100 space-y-3 hover:bg-stone-50 transition-colors group/item">
                      <div className="flex justify-between items-start">
                         <p className="text-[9px] font-mono font-bold uppercase opacity-50">{item.label}</p>
                         <div className={`w-1 h-1 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                      </div>
                      <div className="space-y-1">
                         <p className={`text-xs font-black ${item.color}`}>{item.status}</p>
                         <div className="w-full h-[2px] bg-stone-100 overflow-hidden">
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
           <div className="lg:col-span-8 bg-white p-10 border border-[#141414] shadow-[8px_8px_0px_#141414] space-y-10">
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
                   <AreaChart data={VELOCITY_DATA}>
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
                          backgroundColor: '#141414', 
                          border: 'none', 
                          borderRadius: '0px',
                          color: '#E4E3E0',
                          fontFamily: 'monospace',
                          fontSize: '10px'
                        }} 
                        itemStyle={{ color: '#E4E3E0' }}
                      />
                      <Area 
                        type="stepAfter" 
                        dataKey="guests" 
                        stroke="#141414" 
                        strokeWidth={2} 
                        fill="#141414" 
                        fillOpacity={0.05} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="yield" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        fill="none" 
                      />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
           
           {/* AI Insight: Hardware Style */}
           <div className="lg:col-span-4 bg-[#141414] text-[#E4E3E0] p-10 border border-[#141414] shadow-[8px_8px_0px_#10b981] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                <Brain className="w-64 h-64" />
              </div>
              
              <div className="space-y-8 relative z-10">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <h4 className="text-[10px] font-mono font-bold uppercase tracking-[0.4em] text-emerald-500">AI Operational Pulse</h4>
                 </div>
                 <p className="text-3xl font-serif font-black italic leading-[1.1] tracking-tight">
                   "Atmospheric Shift Detected: Heavy Rain @ 20:00. <span className="text-emerald-500 underline underline-offset-8 decoration-1">Optimize Interior Node 02</span>. Restock premium reds; catalyst suggests 22% uptick in high-margin pairings."
                 </p>
              </div>
              
              <div className="pt-12 space-y-6 relative z-10">
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase opacity-50">Prediction Confidence</p>
                      <p className="text-2xl font-mono font-bold text-emerald-500">98.4%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono font-bold uppercase opacity-50">Model Status</p>
                      <p className="text-xs font-mono font-bold uppercase text-emerald-500">Optimal</p>
                    </div>
                 </div>
                 <div className="h-1 bg-white/10 rounded-none overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '98.4%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
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
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    </div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest">Live Journey Synthesis</h3>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-[8px] font-mono font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 border border-emerald-500/20">AI Active</span>
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
                                   j.status === 'Completed' ? 'border-emerald-500 text-emerald-600' :
                                   j.status === 'Seated' ? 'border-indigo-500 text-indigo-600' :
                                   'border-[#141414]/20 text-stone-400'
                                 }`}>
                                   {j.status}
                                 </span>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-2">
                                    <Brain className="w-3 h-3 text-emerald-500" />
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
                                      <div className="h-full bg-emerald-500" style={{ width: '92%' }}></div>
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
           
           {/* Personnel Health: Data Grid Style */}
           <div className="bg-white border border-[#141414] shadow-[8px_8px_0px_#141414] flex flex-col">
              <div className="px-8 py-6 border-b border-[#141414] flex justify-between items-center bg-[#141414] text-[#E4E3E0]">
                 <div className="flex items-center gap-4">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-mono font-bold uppercase tracking-widest">Personnel Index</h3>
                 </div>
              </div>
              
              <div className="p-8 space-y-8">
                 {staff.slice(0, 4).map((s: { name: string; role: string; burnoutIndex: number }, i: number) => (
                   <div key={i} className="space-y-3">
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-xs font-bold text-[#141414]">{s.name}</p>
                            <p className="text-[9px] font-mono font-bold uppercase opacity-50">{s.role}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-mono font-bold uppercase opacity-50">Fatigue</p>
                            <p className={`text-sm font-mono font-bold ${s.burnoutIndex > 60 ? 'text-indigo-600' : 'text-emerald-600'}`}>{s.burnoutIndex}%</p>
                         </div>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-none overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${s.burnoutIndex}%` }}
                           className={`h-full ${s.burnoutIndex > 60 ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                         ></motion.div>
                      </div>
                   </div>
                 ))}
              </div>
              
              <div className="mt-auto p-8 border-t border-[#141414]/10 bg-indigo-50/50">
                 <div className="flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="space-y-2">
                       <p className="text-[10px] font-mono font-bold uppercase text-indigo-600">Critical Alert // Inventory</p>
                       <p className="text-[11px] font-serif italic leading-relaxed text-stone-600">
                         Node 02 (Cellar) approaching par. Catalyst suggests high demand. Fire restock protocol within <span className="text-indigo-600 font-black">15m</span>.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

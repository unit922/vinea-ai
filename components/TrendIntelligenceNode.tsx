import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Brain, Globe, Sparkles, Calculator, Compass, Layers, 
  UserCheck, AlertTriangle, Leaf
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';

// Definitive attribute statistics sourced from Amadeus Travel Dreams 2026
const AMADEUS_ATTRIBUTES = [
  {
    id: 'sommelier_pack',
    name: 'Sommelier Welcome Pack',
    baselineWillingness: 28, // 28% of travelers willing to pay >11% above room rate
    mewsKey: 'somm-welcome',
    defaultPrice: 25,
    description: 'Custom organic craft wine half-bottle & personalized pairing guide mapped to Guest Palate DNA on check-in.',
    icon: Sparkles,
    color: '#D4AF37' // gold
  },
  {
    id: 'cellar_view',
    name: 'Virtual Cellar View & Floor Selection',
    baselineWillingness: 37, // 37% willing to pay
    mewsKey: 'floor-select',
    defaultPrice: 25,
    description: 'Pre-arrival interface to reserve specific room floor matching vintage preference climate corridors.',
    icon: Layers,
    color: '#4f46e5' // deep indigo
  },
  {
    id: 'local_experience',
    name: 'Oenological Experience Kits',
    baselineWillingness: 32, // 32% willing to pay
    mewsKey: 'local-kit',
    defaultPrice: 20,
    description: 'Artisanal local spirits & vineyard neighborhood maps enabling self-focused tasting guides.',
    icon: Compass,
    color: '#059669' // emerald
  },
  {
    id: 'reserve_parlor',
    name: 'Reserve Parlor Late Checkout',
    baselineWillingness: 33, // 33% willing to pay
    mewsKey: 'late-out',
    defaultPrice: 30,
    description: 'Premium delayed departure with active sommelier tasting salon entry & private bottle stash access.',
    icon: UserCheck,
    color: '#ea580c' // orange
  },
  {
    id: 'air_purified_sleep',
    name: 'Enhanced Scent & Air Quality Sleep',
    baselineWillingness: 31, // 31% willing to pay (Amadeus sleep/air options premium)
    mewsKey: 'purified-sleep',
    defaultPrice: 35,
    description: 'Sleep-ready chambers featuring vintage aromatherapy vaporizers & active oxygen enrichment columns.',
    icon: Leaf,
    color: '#06b6d4' // cyan
  }
];

export const TrendIntelligenceNode: React.FC = () => {
  // Calculator inputs
  const [roomCount, setRoomCount] = useState<number>(150);
  const [occupancy, setOccupancy] = useState<number>(70);
  const [adr, setAdr] = useState<number>(250);
  
  // Enabled attributes state
  const [enabledAttributes, setEnabledAttributes] = useState<Record<string, boolean>>({
    sommelier_pack: true,
    cellar_view: true,
    local_experience: true,
    reserve_parlor: true,
    air_purified_sleep: false
  });

  // Customized pricing state for multipliers
  const [attributePrices, setAttributePrices] = useState<Record<string, number>>({
    sommelier_pack: 25,
    cellar_view: 25,
    local_experience: 20,
    reserve_parlor: 30,
    air_purified_sleep: 35
  });

  const [activeTab, setActiveTab] = useState<'calculator' | 'retailing' | 'advisory' | 'sustainability'>('calculator');

  // Toggle state helper
  const toggleAttribute = (id: string) => {
    setEnabledAttributes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Update customized price helper
  const handlePriceChange = (id: string, value: number) => {
    setAttributePrices(prev => ({ ...prev, [id]: Math.max(1, value) }));
  };

  // Calculate Amadeus projection formula
  const calculations = useMemo(() => {
    // Total occupied rooms per year
    const annualOccupiedNights = roomCount * (occupancy / 100) * 365;
    
    let totalAncillaryRevenue = 0;
    const itemsData: Array<{ name: string; value: number; color: string; willingness: number; price: number }> = [];

    AMADEUS_ATTRIBUTES.forEach(attr => {
      const isEnabled = enabledAttributes[attr.id];
      const customPrice = attributePrices[attr.id];
      const willingness = attr.baselineWillingness;
      
      // Amadeus formula: Nights * (% willing to pay > 11%) * pricing
      const projectedRevenue = isEnabled ? annualOccupiedNights * (willingness / 100) * customPrice : 0;
      totalAncillaryRevenue += projectedRevenue;

      itemsData.push({
        name: attr.name,
        value: Math.round(projectedRevenue),
        color: isEnabled ? attr.color : '#e2e8f0',
        willingness,
        price: customPrice
      });
    });

    return {
      annualOccupiedNights: Math.round(annualOccupiedNights),
      totalAncillaryRevenue: Math.round(totalAncillaryRevenue),
      itemsData
    };
  }, [roomCount, occupancy, enabledAttributes, attributePrices]);

  return (
    <div className="bg-stone-950 text-white min-h-full flex flex-col h-full overflow-y-auto no-scrollbar custom-scrollbar font-sans pb-12">
      {/* Top Hero Brand Header */}
      <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-900/40 via-stone-900/60 to-stone-950 border-b border-white/5 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[110px] -mr-48 -mt-48 pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-3xl font-serif font-black italic tracking-tighter text-white">Trend & Personalization Node</h2>
                <p className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-black mt-1">Grounding Host Operations in Amadeus "Travel Dreams 2026" Data</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                API Feed Active
              </span>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                Amadeus verified
              </span>
            </div>
          </div>

          <p className="text-stone-300 text-xs md:text-sm leading-relaxed max-w-4xl font-medium">
            Hoteliers are shifting heavily to high-margin, decentralized ancillary merchandising to counter rising costs. The Amadeus 2026 global survey of <strong>500+ general managers and 6,000 travelers</strong> reveals that hotel operators are investing an average of **$319,000 on AI** and allocating **6.7% of overall expenditure to Sustainability**.
          </p>
        </div>
      </div>

      {/* Internal Interactive Navigation tabs */}
      <div className="px-8 mt-8 shrink-0">
        <div className="flex gap-2 border-b border-white/5 pb-1">
          {(['calculator', 'retailing', 'advisory', 'sustainability'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-indigo-400 font-black' : 'text-stone-500 hover:text-white'
              }`}
            >
              <span>
                {tab === 'calculator' && 'Delight Revenue Calculator'}
                {tab === 'retailing' && 'Attribute Merchandising'}
                {tab === 'advisory' && 'The Human-Led Guard'}
                {tab === 'sustainability' && 'Sustainability Yields (6.7%)'}
              </span>
              {activeTab === tab && (
                <motion.div layoutId="activeTrendTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 mt-8 flex-1">
        {/* TAB 1: INTERACTIVE REVENUE CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-8 animate-fade-in">
            <div className="bg-stone-900/60 border border-white/5 p-6 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-serif font-black italic text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <span>Interactive Ancillary Revenue Modeler</span>
                </h3>
                <p className="text-[10px] text-stone-400 mt-1 font-medium italic">Adjust sliders to calculate potential return based on real 2026 traveler willingess ratios.</p>
              </div>
              <div className="px-6 py-4 bg-indigo-500 text-stone-950 rounded-2xl text-center">
                <span className="text-[9px] font-mono uppercase font-black tracking-widest block opacity-75">Estimated Annual Potential</span>
                <span className="text-2xl md:text-3xl font-serif font-black italic">${calculations.totalAncillaryRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sliders Area */}
              <div className="lg:col-span-4 bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-400">Establishment Profile</h4>
                
                {/* Rooms count */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-bold">Room Inventory</span>
                    <span className="text-indigo-400 font-mono font-black">{roomCount} Keys</span>
                  </div>
                  <input 
                    type="range" 
                    min="20" 
                    max="1000" 
                    step="5"
                    value={roomCount} 
                    onChange={(e) => setRoomCount(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-stone-600 font-bold uppercase">
                    <span>20 Keys</span>
                    <span>1,000 Keys</span>
                  </div>
                </div>

                {/* Occupancy Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-bold">Annual Occupancy</span>
                    <span className="text-indigo-400 font-mono font-black">{occupancy}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="100" 
                    step="1"
                    value={occupancy} 
                    onChange={(e) => setOccupancy(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-stone-600 font-bold uppercase">
                    <span>30%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Average Daily Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-300 font-bold">Average Daily Rate (ADR)</span>
                    <span className="text-indigo-400 font-mono font-black">${adr}</span>
                  </div>
                  <input 
                    type="number" 
                    min="50" 
                    max="5000"
                    value={adr} 
                    onChange={(e) => setAdr(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4 border-t border-white/5 space-y-2 text-[10px] text-stone-400 font-serif leading-relaxed italic">
                  <p>
                    * Annual occupied nights calculated: <strong>{calculations.annualOccupiedNights.toLocaleString()} nights/year</strong>.
                  </p>
                  <p>
                    Vinetelligence feeds these attributes directly into <strong>Mews PMS</strong> as standard custom add-ons to streamline hotelier deployment cycles.
                  </p>
                </div>
              </div>

              {/* Attributes Toggles & Charts */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                {/* Horizontal generated chart */}
                <div className="bg-stone-900 border border-white/5 rounded-[2.5rem] p-8">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-400 mb-6">Annual Ancillary Revenue Output</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={calculations.itemsData} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#292524" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 10}} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#d6d3d1', fontSize: 10}} width={150} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                          contentStyle={{backgroundColor: '#1c1917', border: '1px solid #3f3f46', borderRadius: '16px', color: 'white', fontSize: '11px'}}
                          formatter={(value) => [`$${(value as number).toLocaleString()}`, 'Projected Revenue']}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                          {calculations.itemsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Attribute Toggles layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AMADEUS_ATTRIBUTES.map(attr => {
                    const isEnabled = enabledAttributes[attr.id];
                    const customPrice = attributePrices[attr.id];
                    const Icon = attr.icon;
                    return (
                      <div 
                        key={attr.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                          isEnabled 
                            ? 'bg-stone-900 border-indigo-500/20' 
                            : 'bg-stone-950 border-white/5 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2.5 items-center">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-lg" style={{ color: isEnabled ? attr.color : '#78716c' }}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-[11px] font-black uppercase text-stone-100 leading-tight">{attr.name}</h5>
                              <span className="text-[8px] font-mono text-stone-500 uppercase">Willingness Ratio: {attr.baselineWillingness}%</span>
                            </div>
                          </div>

                          <button 
                            onClick={() => toggleAttribute(attr.id)}
                            className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest cursor-pointer ${
                              isEnabled 
                                ? 'bg-indigo-500 text-stone-950' 
                                : 'bg-white/5 text-stone-400 border border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-400 italic font-medium leading-relaxed">
                          {attr.description}
                        </p>
                        <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest">Pricing Target</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-stone-400">$</span>
                            <input 
                              type="number" 
                              value={customPrice} 
                              onChange={(e) => handlePriceChange(attr.id, Number(e.target.value))}
                              className="w-12 bg-transparent text-[11px] font-mono text-indigo-400 font-bold focus:outline-none text-right"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED RETAILING STRATEGY */}
        {activeTab === 'retailing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-12">
            <div className="lg:col-span-4 bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-indigo-400 font-mono text-[9px] font-black uppercase tracking-widest">The Merchandising Paradigm</span>
                <h3 className="text-2xl font-serif font-black italic text-stone-100">Attribute-Based Merchandising</h3>
              </div>
              <p className="text-stone-300 text-sm leading-relaxed font-medium">
                Hospitality is transitioning from generic packages to precise attribute-based pricing (ABP). Travelers demand complete freedom and control over their itinerary—with over **a quarter of guests** explicitly seeking "pick and stay" models.
              </p>
              <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-3">
                <h5 className="text-[11px] font-mono font-black uppercase text-indigo-400 tracking-wider">The $1,000,000 Milestone</h5>
                <p className="text-[10px] text-stone-300 italic leading-relaxed">
                  "Based on conservative metrics, a standard 150-room hotel operating at 70% occupancy will easily clear over $1 million a year in pure ancillary margins by selling specific, low-overhead room and parlor attributes."
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-400">Vinetelligence Mews PMS Direct Enabler</h4>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "Dynamic Cellar Allocations", icon: Sparkles, text: "Vinetelligence synchronizes room climate telemetry based on guest checkout preference. If travelers purchase premium wine packs, the system reserves a ground floor cooler corridor for zero-friction somatic delivery.", status: "Mews Confirmed" },
                  { title: "The Sovereign Tasting Hub", icon: UserCheck, text: "Grounded check-in integrations automatically match room views to flavor preference. Wine-centric guests are automatically grouped near tasting parlors to boost on-property beverage spillover by up to 28%.", status: "Certified Allied Track" },
                  { title: "Self-Guided Neighborhood Oenology", icon: Compass, text: "Integrating interactive regional map packages with regional wine-makers. Vinetelligence ships physical companion guidebooks & mini bottle kits to generate instant social/influencer check-ins.", status: "Live Expansion" }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-stone-900/40 border border-white/5 rounded-[1.8rem] p-6 flex gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shrink-0 text-indigo-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black uppercase text-white">{item.title}</h5>
                          <span className="text-[8px] font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">{item.status}</span>
                        </div>
                        <p className="text-[11px] text-stone-400 italic font-medium leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THE TOUCHPOINT ADVISORY (HUMAN TOUCH PREFERENCE) */}
        {activeTab === 'advisory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-12">
            <div className="lg:col-span-4 bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-amber-500 font-mono text-[9px] font-black uppercase tracking-widest">Co-existence and Safeguards</span>
                <h3 className="text-2xl font-serif font-black italic text-stone-100">The Human-Led Guard</h3>
              </div>
              <p className="text-stone-300 text-sm leading-relaxed font-medium">
                Amadeus researchers warned: <strong>"Hotels must be careful not to overstep when implementing automated systems."</strong> Overwhelmingly, travelers prefer human-led service for critical sectors. Too much mechanical friction directly triggers bad reviews.
              </p>
              
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 items-start text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-amber-500 font-bold uppercase tracking-wider text-[10px]">Review Failure Rates</p>
                  <p className="text-[10px] text-stone-300 italic font-medium leading-relaxed">
                    <strong>77% of guests</strong> (and 83% of business travelers) would leave an immediate bad review due to cold, poor, or overly robotic hotel customer service.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
              <h4 className="text-[10px] font-mono font-black uppercase tracking-wider text-stone-400">Where Travelers Demand Real Human Interaction (Amadeus baseline)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { sect: "Room Beverage & Service", pct: 66, trend: "Staff-Led pairing delivers peak somatic delight." },
                  { sect: "Concierge & Tasting", pct: 58, trend: "Expert face-to-face sommelier consultation." },
                  { sect: "Check-in & Check-out", pct: 58, trend: "Express VIP welcome with conversational oenology." }
                ].map((stat, i) => (
                  <div key={i} className="bg-stone-900 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between h-44">
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-black uppercase tracking-wider text-stone-300 leading-tight">{stat.sect}</h5>
                      <p className="text-[10px] text-stone-500 italic font-medium leading-relaxed">{stat.trend}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-serif font-black italic text-amber-500">{stat.pct}% Ratio</span>
                      <span className="text-[8px] font-mono text-stone-600 uppercase tracking-widest font-black">Requires Human Touch</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vinetelligence Architecture Response */}
              <div className="p-8 bg-gradient-to-br from-indigo-950/40 via-stone-900 border border-indigo-500/15 rounded-[2.5rem] space-y-4">
                <div className="flex gap-3 items-center">
                  <Brain className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-white font-mono">Vinetelligence Architecture Response: Staff Coaching Node</h4>
                </div>
                <p className="text-[11px] md:text-xs text-stone-300 leading-relaxed font-medium">
                  We designed Vinetelligence with a strict <strong>Staff-First Interface Protocol</strong>. Rather than forcing independent guests to interact with mindless tablet terminals, Vinetelligence equips the physical staff floor—such as waiters and sommeliers—with real-time flavor alerts and cellar pairing intelligence. The tech acts as an invisible oenological advisor, ensuring the service remains entirely human-centered, luxurious, and emotionally rewarding.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUSTAINABILITY PROTOCOL (6.7% SPEND TARGET) */}
        {activeTab === 'sustainability' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-12">
            <div className="lg:col-span-4 bg-stone-900 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-emerald-400 font-mono text-[9px] font-black uppercase tracking-widest font-black">SaaS Green Credit Targets</span>
                <h3 className="text-2xl font-serif font-black italic text-emerald-400">6.7% Sustainability Ratio</h3>
              </div>
              <p className="text-stone-300 text-sm leading-relaxed font-medium">
                In 2026, **all 500 hoteliers surveyed** plan major investments in green practices, spending an average of <strong>6.7% of overall operational budget</strong> in sustainability. Over a third (35%) see visible eco-credentials as their primary differentiator.
              </p>
              <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-3">
                <h5 className="text-[11px] font-mono font-black text-emerald-400 uppercase tracking-widest font-black">Younger Segment Readiness</h5>
                <p className="text-[10px] text-stone-300 italic leading-relaxed">
                  Travelers who value sustainability report an average willingness to pay **11.7% more per night** for properties showing robust practices, jumping to **14.7% for Gen Z** (adding up to $36.75 per night).
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
              <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-400">Major Sustainability Targets for Premium Hoteliers</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Sustainable F&B (Sourcing/Pairing)", ratio: 33, role: "Biodynamic vineyards & zero-waste bottle diversion nodes.", active: true },
                  { name: "Water Conservation & Greywater", ratio: 33, role: "Greywater telemetry syncing with laundry operations.", active: false },
                  { name: "Responsible & Fair-trade Supply Chain", ratio: 33, role: "Eco-certified vineyard vendors and fair logistics audits.", active: true },
                  { name: "Waste Reduction (Plastics, Spoilage)", ratio: 32, role: "Biodegradable capsules & glass-crushing recycling loops.", active: true }
                ].map((item, idx) => (
                  <div key={idx} className="bg-stone-900 p-6 rounded-2xl border border-white/5 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <h5 className="text-[11px] font-black uppercase text-stone-100 leading-snug max-w-[70%]">{item.name}</h5>
                      <span className="text-xs font-serif font-black italic text-emerald-400">{item.ratio}% target</span>
                    </div>
                    <p className="text-[10px] text-stone-400 italic leading-relaxed font-mono">
                      Vinetelligence link: {item.role}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-stone-900 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black uppercase text-emerald-400 font-mono">Biodynamic & Organic Wine Inventory Flag</h5>
                  <p className="text-[10px] text-stone-400 italic leading-normal mt-1">Our intelligent inventory engine automatically tracks certification badges, boosting guest ESG visibility.</p>
                </div>
                <Leaf className="w-8 h-8 text-emerald-500 opacity-60 shrink-0 ml-4 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

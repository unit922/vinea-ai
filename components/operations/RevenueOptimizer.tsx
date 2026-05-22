
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useVinetelligenceStore } from '../../store/vinetelligenceStore';
import { getBrandedTerm } from '../../utils/branding';
import { InventoryItem, DynamicPriceSuggestion } from '../../lib/types';
import { 
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Area
} from 'recharts';

interface RevenueOptimizerProps {
  inventory: InventoryItem[];
}

const RevenueOptimizer: React.FC<RevenueOptimizerProps> = ({ inventory }) => {
  const restaurantProfile = useVinetelligenceStore(state => state.restaurantProfile);
  const yields = useMemo(() => [
    { hour: '17:00', demand: 20, revenue: 400, capacity: 15 },
    { hour: '18:00', demand: 45, revenue: 1200, capacity: 40 },
    { hour: '19:00', demand: 95, revenue: 2800, capacity: 90 },
    { hour: '20:00', demand: 110, revenue: 3500, capacity: 100 },
    { hour: '21:00', demand: 85, revenue: 2400, capacity: 80 },
    { hour: '22:00', demand: 40, revenue: 900, capacity: 30 },
  ], []);

  const suggestions = useMemo<DynamicPriceSuggestion[]>(() => {
    const highValueItems = inventory
      .filter(item => item.price > 100)
      .slice(0, 1);
    
    const baseSuggestions: DynamicPriceSuggestion[] = [
      { 
        itemName: highValueItems[0]?.name || 'Opus One 2018', 
        currentPrice: highValueItems[0]?.price || 450, 
        suggestedPrice: (highValueItems[0]?.price || 450) * 1.1, 
        rationale: 'High demand detected in local cluster. 4 bottles remaining in immediate vicinity.',
        reasonType: 'Scarcity'
      },
      { 
        itemName: 'Signature Espresso Martini', 
        currentPrice: 18, 
        suggestedPrice: 15, 
        rationale: 'Inventory surplus of coffee-based spirits. Promotional window high between 21:00-23:00.',
        reasonType: 'Demand'
      },
      { 
        itemName: 'Wagyu Carpaccio', 
        currentPrice: 32, 
        suggestedPrice: 38, 
        rationale: 'Complementary pairing demand high for current guest profiles.',
        reasonType: 'Event'
      }
    ];
    return baseSuggestions;
  }, [inventory]);

  return (
    <div className="min-h-full flex flex-col gap-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-black italic text-stone-900 tracking-tighter">Revenue Optimizer</h2>
            <p className="text-[9px] md:text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] mt-2 italic font-sans">{getBrandedTerm('neural_yield', restaurantProfile || undefined)} Engine (Module v6.1)</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
             <div className="flex-1 md:flex-none px-6 py-3 bg-stone-900 text-white rounded-2xl flex items-center justify-center md:justify-start gap-3 shadow-xl">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Auto-Yield Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Yield Curve */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xl font-serif font-bold text-stone-900 italic">Financial Performance Pulse</h4>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Real-time revenue density vs. Demand load</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-stone-900"></div><span className="text-[8px] font-bold text-stone-500 uppercase">Revenue</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[8px] font-bold text-stone-500 uppercase">Demand</span></div>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yields}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontSize: '11px'}}
                />
                <Area type="monotone" dataKey="demand" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.1} strokeWidth={2} />
                <Bar dataKey="revenue" fill="#0c0a09" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="capacity" stroke="#78716c" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 pt-4 border-t border-stone-100">
             <div className="space-y-1">
                <p className="text-[7px] md:text-[8px] font-black text-stone-400 uppercase tracking-widest">Yield Multiplier</p>
                <p className="text-xl md:text-2xl font-serif font-black italic text-stone-900">1.4x</p>
             </div>
             <div className="space-y-1">
                <p className="text-[7px] md:text-[8px] font-black text-stone-400 uppercase tracking-widest">RevPASH</p>
                <p className="text-xl md:text-2xl font-serif font-black italic text-stone-900">$84.20</p>
             </div>
             <div className="space-y-1">
                <p className="text-[7px] md:text-[8px] font-black text-stone-400 uppercase tracking-widest">Alpha Capture</p>
                <p className="text-xl md:text-2xl font-serif font-black italic text-emerald-600">+12.5%</p>
             </div>
             <div className="space-y-1">
                <p className="text-[7px] md:text-[8px] font-black text-stone-400 uppercase tracking-widest">System Load</p>
                <p className="text-xl md:text-2xl font-serif font-black italic text-amber-600">Peak</p>
             </div>
          </div>
        </div>

        {/* Dynamic Pricing AI */}
        <div className="lg:col-span-4 bg-stone-900 text-white p-8 rounded-[3rem] shadow-2xl flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h4 className="text-xl font-serif font-bold text-amber-500 italic">{restaurantProfile?.aesthetic === 'light' ? 'Price Suggestions' : 'Neural Pricing Engine'}</h4>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Dynamic adjustments in queue</p>
            </div>

            <div className="space-y-4">
               {suggestions.map((s, idx) => (
                 <motion.div 
                   key={idx}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.1 }}
                   className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 group hover:bg-white/10 transition-all"
                 >
                    <div className="flex justify-between items-start">
                       <div>
                          <p className="text-xs font-bold text-white">{s.itemName}</p>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                             s.reasonType === 'Scarcity' ? 'bg-rose-500/20 text-rose-500' : 
                             s.reasonType === 'Demand' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'
                          }`}>
                             {s.reasonType} Trigger
                          </span>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-stone-500 line-through">${s.currentPrice}</p>
                          <p className="text-lg font-black text-amber-500">${s.suggestedPrice}</p>
                       </div>
                    </div>
                    <p className="text-[9px] text-stone-400 italic leading-relaxed">"{s.rationale}"</p>
                    <button className="w-full py-2 bg-white/10 hover:bg-amber-500 hover:text-stone-900 transition-all rounded-lg text-[9px] font-black uppercase tracking-widest">
                       Apply Adjustment
                    </button>
                 </motion.div>
               ))}
            </div>
          </div>

          <button className="mt-8 w-full py-4 border border-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-white hover:text-stone-900 transition-all flex items-center justify-center gap-3">
             <i className="fas fa-bolt text-amber-500"></i>
              {restaurantProfile?.aesthetic === 'light' ? 'Refresh Forecast' : 'Trigger Neural Burst'}
          </button>
        </div>

        {/* Market Sentiment & External Catalysts */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic">External Catalyst: Weather</p>
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-stone-900 text-white rounded-3xl flex items-center justify-center text-2xl">
                    <i className="fas fa-cloud-rain"></i>
                 </div>
                 <div>
                    <p className="text-2xl font-serif font-black italic text-stone-900">Precipitation Expected</p>
                    <p className="text-[10px] font-bold text-stone-500 uppercase">Impact: +15% Indoor Capacity Demand</p>
                 </div>
              </div>
           </div>

           <div className="bg-emerald-950 text-emerald-400 p-8 rounded-[3rem] shadow-xl space-y-4 border border-emerald-900/50">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Inventory Yield Health</p>
              <div className="flex items-end justify-between">
                 <div>
                    <p className="text-4xl font-serif font-black italic">Optimal</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-60">Waste interception rate: 94%</p>
                 </div>
                 <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 flex items-center justify-center relative">
                    <span className="text-xs font-black">94%</span>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                       <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="213" strokeDashoffset={213 * (1 - 0.94)} className="text-emerald-500" />
                    </svg>
                 </div>
              </div>
           </div>

           <div className="bg-stone-50 p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic">Local Event Sync</p>
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                    <div>
                       <p className="text-[10px] font-black text-stone-900 uppercase">Tech Disrupt 2026</p>
                       <p className="text-[8px] font-bold text-stone-400">Ends in 4h • Distance: 0.4km</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-emerald-600">+22%</p>
                       <p className="text-[7px] font-bold text-stone-400 uppercase">Load</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueOptimizer;

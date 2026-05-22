
import React from 'react';
import { motion } from 'motion/react';
import { Zap, Hexagon, Globe, BarChart3, ArrowUpRight } from 'lucide-react';

const TREND_DATA = [
  {
    category: "Chilled Reds",
    trajectory: "Exponential",
    momentum: 94,
    insight: "NY Post: 'The Chilled Era'. Global 207% uptick in Pinot Noir/Gamay served at 12.5°C.",
    action: "Update Node 02 Storage Temp",
    color: "indigo"
  },
  {
    category: "Volcanic Wines",
    trajectory: "Stable Growth",
    momentum: 62,
    insight: "High mineral content demand rising in Global Hubs (Milan, Singapore).",
    action: "Initiate Mt. Etna Procurement",
    color: "amber"
  },
  {
    category: "Zero-Proof Botanicals",
    trajectory: "Sustained Peak",
    momentum: 88,
    insight: "Health-conscious guest DNA segments are prioritizing complex non-alc pairings.",
    action: "Deploy Seedlip Node Expansion",
    color: "emerald"
  }
];

export const TrendIntelligenceNode: React.FC = () => {
  return (
    <div className="bg-white border border-[#141414] shadow-[8px_8px_0px_#4f46e5] flex flex-col h-full overflow-hidden">
      <div className="px-6 py-5 border-b border-[#141414] bg-[#4f46e5] text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-indigo-200" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest">Specialized Trend Node</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span className="text-[10px] font-mono font-black uppercase tracking-tighter">Live Global Pulse</span>
        </div>
      </div>

      <div className="p-6 flex-1 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {TREND_DATA.map((trend, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group p-4 border border-stone-200 hover:border-indigo-600 transition-all cursor-default relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-20 transition-opacity">
                <Hexagon className="w-12 h-12" />
              </div>
              
              <div className="flex justify-between items-start mb-3">
                 <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black uppercase tracking-tight text-stone-900">{trend.category}</p>
                      <ArrowUpRight className="w-3 h-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-[9px] font-mono font-bold text-indigo-600 uppercase mt-0.5">{trend.trajectory}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-mono font-bold text-stone-400 uppercase">Momentum</p>
                    <p className="text-sm font-mono font-black text-stone-900">{trend.momentum}%</p>
                 </div>
              </div>

              <div className="h-1 bg-stone-100 rounded-full overflow-hidden mb-4">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${trend.momentum}%` }}
                   transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                   className="h-full bg-indigo-600"
                 />
              </div>

              <p className="text-[11px] font-medium text-stone-600 italic leading-relaxed mb-4">
                {trend.insight}
              </p>

              <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-[#4f46e5]" />
                    <span className="text-[9px] font-mono font-black uppercase text-indigo-600">{trend.action}</span>
                 </div>
                 <button className="text-[9px] font-mono font-black uppercase py-1.5 px-3 border border-indigo-600/20 hover:bg-indigo-600 hover:text-white transition-all">
                   Optimize
                 </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="pt-4 border-t border-stone-100">
           <div className="bg-stone-50 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 bg-white border border-stone-200 rounded-lg flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-black uppercase tracking-tighter text-stone-400">Yield Alpha Projection</p>
                <p className="text-sm font-serif font-black italic">+18.4% Revenue Uplift <span className="text-[10px] font-mono not-italic font-bold text-stone-400 font-sans ml-1">(Projected)</span></p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

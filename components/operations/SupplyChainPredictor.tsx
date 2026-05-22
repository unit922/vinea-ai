
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { InventoryItem } from '../../lib/types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface SupplyChainPredictorProps {
  inventory: InventoryItem[];
}

const SupplyChainPredictor: React.FC<SupplyChainPredictorProps> = ({ inventory }) => {
  // Simulate depletion data based on current stock
  const depletionData = useMemo(() => {
    return [
      { day: 'Mon', trend: 12, predicted: 15 },
      { day: 'Tue', trend: 18, predicted: 20 },
      { day: 'Wed', trend: 25, predicted: 28 },
      { day: 'Thu', trend: 45, predicted: 50 },
      { day: 'Fri', trend: 85, predicted: 95 },
      { day: 'Sat', trend: 95, predicted: 110 },
      { day: 'Sun', trend: 60, predicted: 75 },
    ];
  }, []);

  const highRiskItems = useMemo(() => {
    return inventory
      .filter(item => item.stock <= item.minStock * 1.5)
      .sort((a, b) => (a.stock / a.minStock) - (b.stock / b.minStock));
  }, [inventory]);

  const supplierPulse = [
    { name: 'Napa Valley Logistics', status: 'Optimal', delay: '0h', load: 85 },
    { name: 'Global Spirits Dist.', status: 'Delayed', delay: '4h', load: 92 },
    { name: 'Artisan Glassware', status: 'Optimal', delay: '0h', load: 45 },
    { name: 'Neural Vine Imports', status: 'Syncing', delay: '1h', load: 60 },
  ];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in duration-700">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
         <div>
           <h2 className="text-3xl sm:text-4xl font-serif font-black italic text-stone-900 tracking-tighter">Predictive Logistics</h2>
           <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] mt-2 italic">Neural Supply Chain Sync (Module v4.2)</p>
         </div>
         <div className="flex gap-4 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none px-6 py-3 bg-stone-900 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Auto-Order Enabled</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Depletion Forecast */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xl font-serif font-bold text-stone-900 italic">Global Consumption Velocity</h4>
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">7-Day Predictive depletion curve</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-[8px] font-bold text-stone-500 uppercase">Predicted</span></div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-stone-900"></div><span className="text-[8px] font-bold text-stone-500 uppercase">Actual Trend</span></div>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={depletionData}>
                <defs>
                  <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontSize: '11px'}}
                  cursor={{stroke: '#f59e0b', strokeWidth: 2}}
                />
                <Area type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={4} fillOpacity={1} fill="url(#colorCurve)" strokeDasharray="8 8" />
                <Area type="monotone" dataKey="trend" stroke="#0c0a09" strokeWidth={3} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
             <div className="space-y-1">
                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Est. Stockout (48h)</p>
                <p className="text-2xl font-serif font-black italic text-rose-600">12 Items</p>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Avg Lead Time</p>
                <p className="text-2xl font-serif font-black italic text-stone-900">14.2 Hours</p>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Efficiency Index</p>
                <p className="text-2xl font-serif font-black italic text-emerald-600">98.4%</p>
             </div>
          </div>
        </div>

        {/* High Risk Items */}
        <div className="lg:col-span-4 bg-stone-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><i className="fas fa-triangle-exclamation text-8xl"></i></div>
          <div className="relative z-10">
            <h4 className="text-xl font-serif font-bold text-amber-500 italic">Critical Inventory Nodes</h4>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Immediate replenishment identified</p>
          </div>

          <div className="space-y-4 relative z-10">
            {highRiskItems.slice(0, 5).map((item) => (
              <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white mb-0.5">{item.name}</p>
                  <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-black ${item.stock <= item.minStock ? 'text-rose-500' : 'text-amber-500'}`}>{item.stock} / {item.minStock}</p>
                  <p className="text-[8px] font-bold text-stone-500 italic">Depleting Fast</p>
                </div>
              </div>
            ))}
            {highRiskItems.length === 0 && (
              <div className="py-20 text-center space-y-4">
                 <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto text-stone-600">
                    <i className="fas fa-check"></i>
                 </div>
                 <p className="text-[10px] font-black uppercase text-stone-600 tracking-widest">All nodes stabilized</p>
              </div>
            )}
          </div>

          <button className="w-full py-5 bg-amber-500 text-stone-900 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-amber-400 transition-all active:scale-95">
             Authorize Bulk Order
          </button>
        </div>

        {/* Supplier Network Status */}
        <div className="lg:col-span-12 bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden">
           <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div>
                <h4 className="text-xl font-serif font-bold text-stone-900 italic">Supplier Network Synchronization</h4>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Global logistics node monitoring</p>
              </div>
              <div className="px-6 py-2 bg-white border border-stone-200 rounded-xl flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 <span className="text-[9px] font-black text-stone-600 uppercase">Live Carrier Feeds</span>
              </div>
           </div>
           
           <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {supplierPulse.map((supplier) => (
                   <div key={supplier.name} className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-4 hover:border-amber-500/30 transition-all group">
                      <div className="flex justify-between items-start">
                         <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm ${
                           supplier.status === 'Optimal' ? 'bg-emerald-50 text-emerald-600' : 
                           supplier.status === 'Delayed' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                         }`}>
                            <i className={`fas ${supplier.status === 'Optimal' ? 'fa-check' : 'fa-clock'}`}></i>
                         </div>
                         <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">v2.4 Link</span>
                      </div>
                      <div>
                         <h5 className="text-sm font-black text-stone-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{supplier.name}</h5>
                         <div className="flex justify-between items-center mt-3">
                            <span className="text-[9px] font-bold text-stone-500 uppercase">{supplier.status}</span>
                            <span className={`text-[9px] font-black ${supplier.delay === '0h' ? 'text-stone-300' : 'text-rose-500'}`}>Delay: {supplier.delay}</span>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between items-center text-[8px] font-black text-stone-400 uppercase">
                            <span>Network Load</span>
                            <span>{supplier.load}%</span>
                         </div>
                         <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${supplier.load}%` }}
                              className={`h-full ${supplier.load > 90 ? 'bg-rose-500' : 'bg-stone-900'}`} 
                            />
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainPredictor;

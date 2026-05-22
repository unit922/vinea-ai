
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

const SustainabilityNode: React.FC = () => {
  const wasteData = [
    { name: 'Organic', value: 40, color: '#10b981' },
    { name: 'Glass', value: 35, color: '#3b82f6' },
    { name: 'Plastics', value: 15, color: '#f59e0b' },
    { name: 'Other', value: 10, color: '#78716c' },
  ];

  const savingsTrend = [
    { month: 'Jan', co2: 120, savings: 450 },
    { month: 'Feb', co2: 110, savings: 520 },
    { month: 'Mar', co2: 95, savings: 680 },
    { month: 'Apr', co2: 80, savings: 850 },
  ];

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-black italic text-stone-900 tracking-tighter">Sustainability Node</h2>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] mt-2 italic">Circular Intelligence Protocol (Module v5.0)</p>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-emerald-950 text-emerald-400 rounded-2xl flex items-center gap-3 shadow-xl border border-emerald-900/50">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest ">Eco-Sync Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Waste Distribution */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-8">
          <div>
            <h4 className="text-xl font-serif font-bold text-stone-900 italic">Neural Waste Mapping</h4>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Real-time diversion analytics</p>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {wasteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {wasteData.map(item => (
              <div key={item.name} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <div>
                  <p className="text-[9px] font-black text-stone-900 uppercase">{item.name}</p>
                  <p className="text-[8px] font-bold text-stone-400">{item.value}% Diversion</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Trends */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-8">
          <div>
            <h4 className="text-xl font-serif font-bold text-stone-900 italic">Environmental Yield</h4>
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">CO2 Reduction vs. Economic Savings</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savingsTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#a8a29e', fontSize: 10}} />
                <Tooltip 
                   contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontSize: '11px'}}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                <Bar dataKey="co2" name="CO2 Saved (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="savings" name="SaaS Credit ($)" fill="#0c0a09" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                   <i className="fas fa-leaf"></i>
                </div>
                <div>
                   <p className="text-xs font-black text-emerald-900">Neural Efficiency Rating</p>
                   <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Top 2% of Global Establishments</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-2xl font-serif font-black italic text-emerald-600">A+</p>
             </div>
          </div>
        </div>

        {/* Neural Automation: Smart Depletion */}
        <div className="lg:col-span-12 bg-stone-950 text-white p-10 rounded-[4rem] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -mr-48 -mt-48"></div>
           
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
              <div className="col-span-2 space-y-6">
                 <div>
                    <h3 className="text-3xl font-serif font-black italic text-emerald-400">Smart Waste Interception</h3>
                    <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">AI-Driven Spoilage Mitigation</p>
                 </div>
                 <p className="text-stone-400 text-sm font-medium leading-relaxed max-w-xl">
                    The platform is now monitoring inventory age and temperature telemetry. 
                    The system will automatically suggest "Sustainability Flights" or discounted 
                    pairing menus before products cross the neural freshness threshold.
                 </p>
                 <div className="flex gap-4">
                    <button className="px-8 py-4 bg-emerald-500 text-stone-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-400 transition-all active:scale-95">
                       Configure Intercepts
                    </button>
                    <button className="px-8 py-4 bg-white/5 border border-white/10 text-stone-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                       View Registry
                    </button>
                 </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] space-y-6">
                 <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest text-center">Live Spoilage Alert</h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                       <div>
                          <p className="text-[10px] font-black text-rose-500 uppercase">Artisan Camembert</p>
                          <p className="text-[8px] font-bold text-stone-500">Exp: 48h</p>
                       </div>
                       <i className="fas fa-triangle-exclamation text-rose-500"></i>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-2xl opacity-40">
                       <div>
                          <p className="text-[10px] font-black text-stone-400 uppercase">Unfiltered IPA</p>
                          <p className="text-[8px] font-bold text-stone-500">Exp: 96h</p>
                       </div>
                       <i className="fas fa-check text-stone-600"></i>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SustainabilityNode;

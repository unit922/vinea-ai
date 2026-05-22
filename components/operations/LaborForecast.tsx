import React from 'react';

const LaborForecast: React.FC = () => {
  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demand Forecast Card */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-serif font-black text-stone-900 italic tracking-tighter">Predictive Demand Matrix</h3>
              <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest mt-1">72-Hour Neural Forecast</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-200">High Confidence</span>
            </div>
          </div>

          <div className="h-64 w-full bg-stone-50 rounded-[2.5rem] border border-stone-100 p-6 flex items-end gap-2 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <i className="fas fa-chart-line text-[120px] text-stone-900"></i>
            </div>
            {[45, 62, 85, 92, 78, 55, 42, 38, 52, 75, 98, 88].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-2 py-1 rounded text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {val}% Load
                </div>
                <div 
                  className={`w-full rounded-t-xl transition-all duration-1000 group-hover:brightness-110 ${val > 80 ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-stone-300'}`} 
                  style={{ height: `${val}%` }}
                ></div>
                <span className="text-[7px] font-black text-stone-400 uppercase tracking-tighter">{i * 2}:00</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 pt-4">
            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-2">
              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Peak Load Time</p>
              <p className="text-xl font-serif font-black text-stone-900 italic">20:00 - 22:00</p>
            </div>
            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-2">
              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Expected Covers</p>
              <p className="text-xl font-serif font-black text-stone-900 italic">142 Guests</p>
            </div>
            <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 space-y-2">
              <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Labor Efficiency</p>
              <p className="text-xl font-serif font-black text-emerald-600 italic">+12.4%</p>
            </div>
          </div>
        </div>

        {/* AI Labor Insights */}
        <div className="bg-stone-950 p-8 rounded-[3rem] shadow-2xl space-y-8 relative overflow-hidden border border-white/5">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-serif font-black text-white italic tracking-tight">Neural Labor Insights</h3>
            <p className="text-[10px] text-amber-500/60 uppercase font-black tracking-widest mt-1">Optimization Protocols</p>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-3 hover:bg-white/10 transition-all cursor-default group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center text-xs shadow-lg group-hover:scale-110 transition-transform"><i className="fas fa-user-clock"></i></div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Shift Staggering</h4>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed italic">"Recommend staggering Sommelier start times by 45 minutes to align with the 19:30 reservation surge."</p>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-3 hover:bg-white/10 transition-all cursor-default group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center text-xs shadow-lg group-hover:scale-110 transition-transform"><i className="fas fa-fire"></i></div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Burnout Prevention</h4>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed italic">"Staff 'Marco' is approaching a 0.85 Burnout Index. Suggest rotating to Zone: Lounge for the next 2 hours."</p>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-3 hover:bg-white/10 transition-all cursor-default group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-stone-950 flex items-center justify-center text-xs shadow-lg group-hover:scale-110 transition-transform"><i className="fas fa-coins"></i></div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Cost Optimization</h4>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed italic">"Potential to reduce labor cost by $140/night by consolidating Bar Station 2 during the 16:00-18:00 window."</p>
            </div>
          </div>

          <button className="w-full py-4 bg-amber-500 text-stone-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95">
            Apply Neural Schedule
          </button>
        </div>
      </div>

      {/* Staffing Recommendation Table */}
      <div className="bg-white p-8 rounded-[3rem] border border-stone-200 shadow-xl space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-serif font-black text-stone-900 italic tracking-tighter">Recommended Deployment</h3>
            <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest mt-1">Role-Based Allocation Matrix</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-stone-100 border border-stone-200"></div>
              <span className="text-[8px] font-black text-stone-500 uppercase">Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500"></div>
              <span className="text-[8px] font-black text-stone-500 uppercase">Recommended</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Operational Role</th>
                <th className="text-center py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Current Staffing</th>
                <th className="text-center py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">AI Recommendation</th>
                <th className="text-right py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {[
                { role: 'Sommelier', current: 2, recommended: 3, delta: '+1' },
                { role: 'Mixologist', current: 4, recommended: 3, delta: '-1' },
                { role: 'Server', current: 8, recommended: 10, delta: '+2' },
                { role: 'Floor Manager', current: 1, recommended: 1, delta: '0' },
                { role: 'Bar Back', current: 2, recommended: 3, delta: '+1' },
              ].map((row, i) => (
                <tr key={i} className="group hover:bg-stone-50 transition-all">
                  <td className="py-6 font-serif font-black italic text-stone-900 text-lg">{row.role}</td>
                  <td className="py-6 text-center">
                    <div className="flex justify-center gap-1">
                      {[...Array(row.current)].map((_, j) => <div key={j} className="w-2 h-6 bg-stone-200 rounded-sm"></div>)}
                    </div>
                  </td>
                  <td className="py-6 text-center">
                    <div className="flex justify-center gap-1">
                      {[...Array(row.recommended)].map((_, j) => <div key={j} className="w-2 h-6 bg-amber-500 rounded-sm shadow-sm"></div>)}
                    </div>
                  </td>
                  <td className={`py-6 text-right font-black text-xs ${row.delta.startsWith('+') ? 'text-emerald-600' : row.delta.startsWith('-') ? 'text-rose-500' : 'text-stone-400'}`}>
                    {row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LaborForecast;

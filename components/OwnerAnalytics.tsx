import React, { useState, useMemo } from 'react';
import { EstablishmentRegistry } from '../lib/types';
import { Globe } from 'lucide-react';

interface OwnerAnalyticsProps {
  onNavigateToInvestor?: () => void;
}

export const OwnerAnalytics: React.FC<OwnerAnalyticsProps> = ({ onNavigateToInvestor }) => {
  const [registry] = useState<EstablishmentRegistry[]>(() => {
    const saved = localStorage.getItem('vinetelligence_master_registry') || localStorage.getItem('vinea_master_registry');
    return saved ? JSON.parse(saved) : [
      { id: 'est-001', name: 'The Gilded Shaker', tier: 'Visionary', userLimit: 10, status: 'Active', lastPulse: '2m ago', usageMetric: 88, billingStatus: 'Current', mrr: 199 },
      { id: 'est-002', name: 'Vintage Tokyo', tier: 'Enterprise', userLimit: 999, status: 'Active', lastPulse: '15s ago', usageMetric: 94, billingStatus: 'Current', mrr: 899 },
      { id: 'est-003', name: 'Alpine Winter Cabin', tier: 'Operator', userLimit: 5, status: 'Suspended', lastPulse: '4d ago', usageMetric: 0, billingStatus: 'Delinquent', mrr: 99 },
    ];
  });

  const stats = useMemo(() => ({
    totalNodes: registry.length,
    activeNodes: registry.filter(e => e.status === 'Active').length,
    totalMRR: registry.reduce((acc, curr) => acc + (curr.billingStatus === 'Current' ? curr.mrr : 0), 0),
    avgUsage: Math.round(registry.reduce((acc, curr) => acc + curr.usageMetric, 0) / registry.length),
    networkHealth: 98.4
  }), [registry]);

  return (
    <div className="flex flex-col h-full bg-stone-50 overflow-hidden">
      {/* Header */}
      <div className="p-10 bg-white border-b border-stone-200 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-4xl font-serif font-black italic tracking-tighter text-stone-900">Vinetelligence.live Intelligence</h1>
          <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.4em] mt-2">Global Network Performance & Owner Analytics</p>
        </div>
        <div className="flex gap-4">
           {onNavigateToInvestor && (
             <button 
               onClick={onNavigateToInvestor}
               className="px-6 py-3 bg-stone-900 text-white rounded-2xl flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg active:scale-95"
             >
               <Globe className="w-4 h-4 text-amber-500" />
               <span className="text-[10px] font-black uppercase tracking-widest">Investor Relations</span>
             </button>
           )}
           <div className="px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest mb-1">Network Health</p>
              <p className="text-xl font-black text-emerald-900">{stats.networkHealth}%</p>
           </div>
           <div className="px-6 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="text-[8px] font-black uppercase text-amber-600 tracking-widest mb-1">Total MRR</p>
              <p className="text-xl font-black text-amber-900">${stats.totalMRR.toLocaleString()}</p>
           </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Total Nodes</p>
              <p className="text-4xl font-serif font-black italic text-stone-900">{stats.totalNodes}</p>
              <div className="mt-4 h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                 <div className="h-full bg-stone-900" style={{ width: '100%' }}></div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Active Nodes</p>
              <p className="text-4xl font-serif font-black italic text-stone-900">{stats.activeNodes}</p>
              <div className="mt-4 h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500" style={{ width: `${(stats.activeNodes / stats.totalNodes) * 100}%` }}></div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Avg. Node Usage</p>
              <p className="text-4xl font-serif font-black italic text-stone-900">{stats.avgUsage}%</p>
              <div className="mt-4 h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500" style={{ width: `${stats.avgUsage}%` }}></div>
              </div>
           </div>
           <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
              <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-4">Network Growth</p>
              <p className="text-4xl font-serif font-black italic text-stone-900">+12%</p>
              <div className="mt-4 h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                 <div className="h-full bg-amber-500" style={{ width: '12%' }}></div>
              </div>
           </div>
        </div>

        {/* Detailed Network View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-stone-100 flex justify-between items-center">
                 <h3 className="text-xl font-serif font-black italic text-stone-900">Node Registry</h3>
                 <button className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors">View Full Ledger</button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {registry.map(node => (
                   <div key={node.id} className="p-8 border-b border-stone-50 flex items-center justify-between hover:bg-stone-50 transition-all group">
                      <div className="flex items-center gap-6">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                           node.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                         }`}>
                            <i className={`fas ${node.status === 'Active' ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
                         </div>
                         <div>
                            <h4 className="text-lg font-serif font-black italic text-stone-900">{node.name}</h4>
                            <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">{node.tier} Node • {node.id}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-stone-900">{node.usageMetric}% Usage</p>
                         <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Last Pulse: {node.lastPulse}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-stone-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                 <h3 className="text-2xl font-serif font-black italic mb-6">Owner Briefing</h3>
                 <div className="space-y-6">
                    <div className="flex gap-4">
                       <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                          <i className="fas fa-rocket"></i>
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white">Vinetelligence 2.0 Deployment</p>
                          <p className="text-[10px] text-stone-400 italic">Rollout scheduled for Q2. Expected efficiency gain: 18%.</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                          <i className="fas fa-globe"></i>
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white">Global Expansion</p>
                          <p className="text-[10px] text-stone-400 italic">3 new nodes pending activation in Tokyo region.</p>
                       </div>
                    </div>
                 </div>
                 <button className="mt-10 w-full py-4 bg-amber-500 text-stone-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl">
                    Request Network Audit
                 </button>
              </div>

              <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-xl">
                 <h3 className="text-xl font-serif font-black italic text-stone-900 mb-6">Security Pulse</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
                       <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Firewall Status</span>
                       <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Hardened</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
                       <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Encryption</span>
                       <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">AES-256</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
                       <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Threat Level</span>
                       <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Minimal</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

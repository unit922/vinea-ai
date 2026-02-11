
import React, { useState, useEffect, useMemo } from 'react';
import { EstablishmentRegistry, EstablishmentStatus, Invoice } from '../types';
import { geminiService } from '../services/geminiService';

const MOCK_REGISTRY: EstablishmentRegistry[] = [
  { id: 'est-001', name: 'The Gilded Shaker', tier: 'Visionary', userLimit: 10, status: 'Active', lastPulse: '2m ago', usageMetric: 88, billingStatus: 'Current', mrr: 199 },
  { id: 'est-002', name: 'Vintage Tokyo', tier: 'Enterprise', userLimit: 999, status: 'Active', lastPulse: '15s ago', usageMetric: 94, billingStatus: 'Current', mrr: 899 },
  { id: 'est-003', name: 'Alpine Winter Cabin', tier: 'Operator', userLimit: 5, status: 'Suspended', lastPulse: '4d ago', usageMetric: 0, billingStatus: 'Delinquent', mrr: 99 },
  { id: 'est-004', name: 'Brutalist Espresso', tier: 'Explorer', userLimit: 5, status: 'Trial_Expired', lastPulse: '2h ago', usageMetric: 12, billingStatus: 'N/A', mrr: 0 },
];

const MasterAdmin: React.FC = () => {
  const [registry, setRegistry] = useState<EstablishmentRegistry[]>(() => {
    const saved = localStorage.getItem('vinea_master_registry');
    return saved ? JSON.parse(saved) : MOCK_REGISTRY;
  });
  const [activeTab, setActiveTab] = useState<'nodes' | 'ledger'>('nodes');
  const [isPulsing, setIsPulsing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('vinea_master_registry', JSON.stringify(registry));
  }, [registry]);

  const updateStatus = (id: string, status: EstablishmentStatus) => {
    setRegistry(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const stats = useMemo(() => ({
    total: registry.length,
    active: registry.filter(e => e.status === 'Active').length,
    revenue: registry.reduce((acc, curr) => acc + (curr.billingStatus === 'Current' ? curr.mrr : 0), 0)
  }), [registry]);

  const selectedEst = registry.find(e => e.id === selectedId);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">Vinea Network Command</h2>
          <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">Module 2: Master Controller</p>
        </div>
        <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
           <button onClick={() => setActiveTab('nodes')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'nodes' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Nodes</button>
           <button onClick={() => setActiveTab('ledger')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ledger' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Network Ledger</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        {[
          { label: 'Active Silos', value: stats.active, icon: 'fa-server', color: 'text-emerald-500' },
          { label: 'Network MRR', value: `$${stats.revenue.toLocaleString()}`, icon: 'fa-vault', color: 'text-blue-500' },
          { label: 'Global Health', value: '99.8%', icon: 'fa-heart-pulse', color: 'text-rose-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-stone-900 border border-white/5 p-6 rounded-3xl shadow-xl">
            <p className="text-[10px] font-black uppercase text-stone-500 mb-1 tracking-widest">{stat.label}</p>
            <div className="flex justify-between items-end">
               <p className="text-3xl font-black text-white">{stat.value}</p>
               <i className={`fas ${stat.icon} ${stat.color} text-xl mb-1`}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col">
        {activeTab === 'nodes' ? (
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-stone-50 z-10 border-b border-stone-100">
                  <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                    <th className="px-8 py-5">Establishment</th>
                    <th className="px-8 py-5">Tier / MRR</th>
                    <th className="px-8 py-5">State</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {registry.map(est => (
                    <tr key={est.id} onClick={() => setSelectedId(est.id)} className={`cursor-pointer transition-all hover:bg-stone-50 group ${selectedId === est.id ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-stone-900 text-amber-500 flex items-center justify-center font-black text-xs">{est.name[0]}</div>
                          <div>
                            <p className="text-sm font-bold text-stone-900">{est.name}</p>
                            <p className="text-[10px] text-stone-400">ID: {est.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-black text-stone-700">{est.tier}</p>
                        <p className="text-[10px] text-emerald-600 font-bold">${est.mrr}/mo</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${est.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {est.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <i className="fas fa-chevron-right text-stone-200 group-hover:text-amber-500 transition-colors"></i>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedEst && (
              <div className="w-80 border-l border-stone-100 p-8 space-y-8 animate-in slide-in-from-right-4">
                 <div>
                    <h4 className="text-xl font-serif font-bold text-stone-900">{selectedEst.name}</h4>
                    <p className="text-[10px] font-black uppercase text-stone-400 mt-1">Node Lifecycle Control</p>
                 </div>
                 <div className="space-y-4">
                    <button onClick={() => updateStatus(selectedEst.id, 'Active')} className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedEst.status === 'Active' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Activate</button>
                    <button onClick={() => updateStatus(selectedEst.id, 'Suspended')} className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedEst.status === 'Suspended' ? 'bg-rose-600 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}>Suspend</button>
                 </div>
                 <div className="pt-8 border-t border-stone-100">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Provisioning</p>
                    <div className="p-4 bg-stone-50 rounded-2xl space-y-2">
                       <p className="text-xs font-bold flex justify-between"><span>User Limit:</span> <span>{selectedEst.userLimit}</span></p>
                       <p className="text-xs font-bold flex justify-between"><span>Silo Load:</span> <span>{selectedEst.usageMetric}%</span></p>
                    </div>
                 </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col p-10 space-y-10">
             <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-2xl font-serif font-bold text-stone-900">Network Revenue Stream</h3>
                   <p className="text-stone-500 text-sm italic">Direct tracking of Vinea SaaS subscriptions.</p>
                </div>
                <button className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 shadow-lg">Generate P&L Report</button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem]">
                   <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4">Top Yielding Nodes</h4>
                   <div className="space-y-4">
                      {registry.filter(e => e.mrr > 0).sort((a,b) => b.mrr - a.mrr).map(e => (
                        <div key={e.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
                           <span className="text-sm font-bold text-stone-800">{e.name}</span>
                           <span className="text-sm font-black text-emerald-600">${e.mrr}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2.5rem]">
                   <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-widest mb-4">Attention Required (Arrears)</h4>
                   <div className="space-y-4">
                      {registry.filter(e => e.billingStatus === 'Delinquent').map(e => (
                        <div key={e.id} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border-l-4 border-rose-500">
                           <span className="text-sm font-bold text-stone-800">{e.name}</span>
                           <button className="text-[9px] font-black text-rose-600 uppercase underline">Fire Warning</button>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterAdmin;

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, Info, Database, LayoutGrid, Users, CreditCard, ExternalLink, RefreshCw, ArrowRight, Lock } from 'lucide-react';
import { mewsService } from '../services/mewsService';

const IntegrationHubView: React.FC = () => {
  const [mewsStatus, setMewsStatus] = useState<{ configured: boolean; status: string; endpoint: string }>({ 
    configured: false, 
    status: 'Identifying Node...', 
    endpoint: '' 
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'mews' | 'pos' | 'quickbooks' | 'lockers' | 'logs'>('mews');
  const [selectedPosSystem, setSelectedPosSystem] = useState<'oracle' | 'lightspeed' | 'toast'>('oracle');

  // SommOne Wine Locker States
  const [lockers, setLockers] = useState([
    { id: 'LCK-101', member: 'William S. Gates', title: 'Krug Clos d\'Ambonnay 2002', count: 1, lastOpened: 'Yesterday, 8:14 PM', status: 'Active' },
    { id: 'LCK-102', member: 'Jeffery B.', title: 'Quilceda Creek Cabernet 2013', count: 3, lastOpened: 'Today, 11:30 AM', status: 'Active' },
    { id: 'LCK-103', member: 'Richard B.', title: 'Leonetti Cellar Merlot 2018', count: 2, lastOpened: '2 days ago', status: 'Active' },
    { id: 'LCK-104', member: 'Steve B.', title: 'Beaux Frères Pinot Noir 2015', count: 1, lastOpened: 'Never', status: 'Standby' }
  ]);

  const handleWithdrawBottle = (id: string) => {
    setLockers(prev => prev.map(lck => {
      if (lck.id === id) {
        if (lck.count > 0) {
          addLog(`SommOne Wine Locker [${id}] - Dispatched 1 bottle of ${lck.title} to Table.`);
          return { ...lck, count: lck.count - 1, lastOpened: 'Just Now' };
        } else {
          addLog(`SommOne Wine Locker Error: No bottles remaining in locker [${id}].`);
        }
      }
      return lck;
    }));
  };

  const handleRestockLocker = (id: string) => {
    setLockers(prev => prev.map(lck => {
      if (lck.id === id) {
        addLog(`SommOne Wine Locker [${id}] - Sourced 1 bottle of ${lck.title} into Locker.`);
        return { ...lck, count: lck.count + 1 };
      }
      return lck;
    }));
  };

  // Mews Manual Configuration States
  const [formEndpoint, setFormEndpoint] = useState('api.mews.com');
  const [formClientToken, setFormClientToken] = useState('');
  const [formAccessToken, setFormAccessToken] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('vinetelligence_mews_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.endpoint) setFormEndpoint(parsed.endpoint);
        if (parsed.clientToken) setFormClientToken(parsed.clientToken);
        if (parsed.accessToken) setFormAccessToken(parsed.accessToken);
      } catch (e) {
        console.error('Failed to parse loaded Mews local config:', e);
      }
    }
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const status = await mewsService.getStatus();
    setMewsStatus(status);
  };

  const handleSaveMewsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      endpoint: formEndpoint || 'api.mews.com',
      clientToken: formClientToken,
      accessToken: formAccessToken
    };
    localStorage.setItem('vinetelligence_mews_config', JSON.stringify(config));
    setSaveSuccess(true);
    addLog(`Mews connection configuration preserved locally.`);
    checkStatus();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addLog = (msg: string) => {
    setSyncLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const handleTestHandshake = async () => {
    if (!mewsStatus.configured) return;
    setIsSyncing(true);
    addLog("Initiating Neural Handshake with Mews Connector API...");
    
    try {
      // Simulate/Test a customer fetch (using an empty filter or a dummy ID to see if it responds)
      addLog("Node Request: /api/connector/v1/customers/get");
      const customers = await mewsService.getCustomers({ Emails: ["test@vinetelligence.ai"] });
      addLog(`Neural Link Success: Received ${customers?.Customers?.length || 0} customer nodes.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Neural handshake failed";
      addLog(`Handshake Failure: ${msg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-200">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Zap className="w-5 h-5" />
             </div>
             <h1 className="text-3xl font-serif font-black italic tracking-tight text-stone-900">Integration Hub</h1>
          </div>
          <p className="text-stone-500 font-medium italic text-sm">Synchronizing your beverage intelligence with the world's leading hospitality stacks.</p>
        </div>
        
        <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200 self-start md:self-center overflow-x-auto no-scrollbar max-w-full">
           {[
             { id: 'mews', label: 'Mews PMS', icon: <Database className="w-3.5 h-3.5" /> },
             { id: 'pos', label: 'POS Nodes', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
             { id: 'quickbooks', label: 'Accounting', icon: <CreditCard className="w-3.5 h-3.5" /> },
             { id: 'lockers', label: 'Wine Locker (SommOne)', icon: <Lock className="w-3.5 h-3.5" /> },
             { id: 'logs', label: 'Sync Registry', icon: <Activity className="w-3.5 h-3.5" /> }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as 'mews' | 'pos' | 'quickbooks' | 'lockers' | 'logs')}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm border border-stone-200' : 'text-stone-400 hover:text-stone-600'
               }`}
             >
               {tab.icon}
               {tab.label}
             </button>
           ))}
        </div>
      </header>

      {activeTab === 'pos' && (
        <div className="space-y-8">
           <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-start w-fit">
              <button 
                onClick={() => setSelectedPosSystem('oracle')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedPosSystem === 'oracle' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}
              >
                Oracle Simphony
              </button>
              <button 
                onClick={() => setSelectedPosSystem('lightspeed')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedPosSystem === 'lightspeed' ? 'bg-red-600 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}
              >
                Lightspeed Retail
              </button>
              <button 
                onClick={() => setSelectedPosSystem('toast')}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedPosSystem === 'toast' ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-400 hover:text-stone-600'}`}
              >
                Toast POS
              </button>
           </div>

           <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-sm space-y-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8">
                      <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 bg-sky-50 text-sky-600 border border-sky-100">
                         <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></div>
                         Bridge Active
                      </div>
                   </div>

                   <div className="space-y-6 max-w-xl">
                      <div className="space-y-2">
                         <h2 className="text-2xl font-serif font-black italic text-stone-900 tracking-tight">
                            {selectedPosSystem === 'oracle' && 'Oracle Simphony Neural Node'}
                            {selectedPosSystem === 'lightspeed' && 'Lightspeed Cloud Handshake'}
                            {selectedPosSystem === 'toast' && 'Toast Certified App Marketplace Node'}
                         </h2>
                         <p className="text-stone-500 text-sm italic font-medium leading-relaxed">
                            {selectedPosSystem === 'toast' && 'Certified Toast App Marketplace Integration. Directly captures live kitchen check tickets, table-side orders, and beverage depletion events in real-time.'}
                             {selectedPosSystem === 'oracle' && 'Synchronize enterprise-grade menu databases and live guest checks directly from your property management workstations.'}
                            {selectedPosSystem === 'lightspeed' && 'High-velocity cloud integration for boutiques and luxury bistros. Direct stock depletion and sales summary mapping.'}
                         </p>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                         {[
                           { label: 'PLU Mapping', icon: <Database className="w-3.5 h-3.5" /> },
                           { label: 'Staff IDs', icon: <Users className="w-3.5 h-3.5" /> },
                           { label: 'Live Checks', icon: <Activity className="w-3.5 h-3.5" /> }
                         ].map((node, i) => (
                           <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col items-center gap-3 text-center">
                              <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-400">
                                 {node.icon}
                              </div>
                              <p className="text-[9px] font-black text-stone-900 uppercase tracking-widest">{node.label}</p>
                           </div>
                         ))}
                      </div>

                      <div className="flex gap-4 pt-4">
                         <button 
                           onClick={() => addLog(`Initiating ${selectedPosSystem} Node Discovery...`)}
                           className={`px-8 py-4 ${selectedPosSystem === 'oracle' ? 'bg-stone-900' : 'bg-red-600'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95`}
                         >
                           Lauch Node Scan
                         </button>
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 border border-stone-200">
                   <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 mb-6">Neural Mapping Registry</h3>
                   <div className="space-y-3">
                      {[
                        { item: 'Vintage Cristal 2012', id: 'PLU-90210', status: 'Mapped' },
                        { item: 'Staff: Alexander G.', id: 'EXT-104', status: 'Authorized' },
                        { item: 'Folio: Room 402', id: 'LINK-88', status: 'Connected' }
                      ].map((reg, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-stone-50 rounded-xl">
                           <div className="space-y-0.5">
                              <p className="text-xs font-bold text-stone-900">{reg.item}</p>
                              <p className="text-[9px] font-mono font-bold text-stone-400">{reg.id}</p>
                           </div>
                           <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{reg.status}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-sm space-y-8">
                    <div className="space-y-4">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedPosSystem === 'oracle' ? 'bg-stone-100 text-stone-900' : 'bg-red-50 text-red-600'}`}>
                          <LayoutGrid className="w-7 h-7" />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-xl font-serif font-black italic text-stone-900">System Architecture</h3>
                          <p className="text-xs text-stone-500 italic leading-relaxed">
                             Vinetelligence communicates with {selectedPosSystem === 'oracle' ? 'Oracle' : 'Lightspeed'} via a secure REST-API gateway using Oauth2 and TLS 1.3 encryption.
                          </p>
                       </div>
                    </div>
                    
                    <div className="pt-6 border-t border-stone-100 space-y-4">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase text-stone-400">
                          <span>Latency Node</span>
                          <span className="text-stone-900">42ms</span>
                       </div>
                       <div className="flex items-center justify-between text-[10px] font-black uppercase text-stone-400">
                          <span>Encryption</span>
                          <span className="text-stone-900">Quantum-Safe</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'mews' && (
        <div className="grid lg:grid-cols-3 gap-8">
           {/* Connection Card */}
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-sm space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8">
                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                      mewsStatus.configured ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${mewsStatus.configured ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                       {mewsStatus.status}
                    </div>
                 </div>

                 <div className="space-y-6 max-w-xl">
                    <div className="space-y-2">
                       <h2 className="text-2xl font-serif font-black italic text-stone-900 tracking-tight">Mews Connector API Link</h2>
                       <p className="text-stone-500 text-sm italic font-medium leading-relaxed">
                          Vinetelligence integrates deeply with Mews to provide live guest profile mapping, room folio billing, and predictive stay-based beverage preparation.
                       </p>
                    </div>

                    <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 grid md:grid-cols-2 gap-8">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Target Endpoint</label>
                          <p className="text-xs font-mono font-bold text-stone-900 truncate">{mewsStatus.endpoint || 'api.mews.com'}</p>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Protocol Version</label>
                          <p className="text-xs font-mono font-bold text-stone-900">v1 (Connector API)</p>
                       </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4">
                       <button 
                         onClick={handleTestHandshake}
                         disabled={!mewsStatus.configured || isSyncing}
                         className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-stone-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                       >
                         {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-indigo-300" />}
                         {isSyncing ? 'Synchronizing...' : 'Trigger Handshake'}
                       </button>
                       <a 
                         href="https://docs.mews.com/connector-api" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="flex items-center gap-3 px-8 py-4 bg-white border border-stone-200 text-stone-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all"
                       >
                         API Protocols
                         <ExternalLink className="w-3.5 h-3.5" />
                       </a>
                    </div>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                 <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm space-y-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                       <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-lg font-serif font-black italic text-stone-900">Guest Palate Sync</h3>
                       <p className="text-[11px] text-stone-500 font-medium italic leading-relaxed">
                          Automatically pulls guest Stay-Notes from Mews and maps them to our Palate DNA profile engine.
                       </p>
                    </div>
                    <div className="pt-4 border-t border-stone-50">
                       <div className="flex justify-between items-center text-[9px] font-black uppercase text-stone-400">
                          <span>Sync status</span>
                          <span className="text-emerald-500">Autonomous</span>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm space-y-6">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                       <CreditCard className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-lg font-serif font-black italic text-stone-900">Folio Billing Direct</h3>
                       <p className="text-[11px] text-stone-500 font-medium italic leading-relaxed">
                          Close service orders directly to the guest's Mews folio from the Vinetelligence Bar Station.
                       </p>
                    </div>
                    <div className="pt-4 border-t border-stone-50">
                       <div className="flex justify-between items-center text-[9px] font-black uppercase text-stone-400">
                          <span>Billing Hook</span>
                          <span className="text-stone-900">Active</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Setup Info Sidebar */}
           <div className="space-y-8">
               <div className="bg-stone-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl">
                  <div className="space-y-2">
                     <h3 className="text-xl font-serif font-black italic text-indigo-400 tracking-tight">Configuration Mode</h3>
                     <p className="text-stone-400 text-xs italic font-medium leading-relaxed uppercase tracking-wider">Neural environment setup</p>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                           <Info className="w-3 h-3" />
                           Partner Credentials
                        </div>
                        <p className="text-[10px] text-stone-400 leading-relaxed italic">
                           Integration requires a <strong className="text-white">ClientToken</strong> from the Mews Marketplace and an <strong className="text-white">AccessToken</strong> for each specific establishment.
                        </p>
                     </div>
                     
                     <form onSubmit={handleSaveMewsConfig} className="p-6 bg-white/5 border border-white/10 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                           <Zap className="w-3.5 h-3.5" />
                           Credentials Setup Desk
                        </div>
                        
                        <div className="space-y-1">
                           <label className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Mews API Endpoint</label>
                           <input 
                              type="text"
                              value={formEndpoint}
                              onChange={(e) => setFormEndpoint(e.target.value)}
                              placeholder="e.g. api.mews.com / api.demo.mews.com"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                           />
                        </div>

                        <div className="space-y-1">
                           <label className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Client Token</label>
                           <input 
                              type="password"
                              value={formClientToken}
                              onChange={(e) => setFormClientToken(e.target.value)}
                              placeholder="Input Token"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                           />
                        </div>

                        <div className="space-y-1">
                           <label className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Access Token</label>
                           <input 
                              type="password"
                              value={formAccessToken}
                              onChange={(e) => setFormAccessToken(e.target.value)}
                              placeholder="Input Access Token"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                           />
                        </div>

                        <button 
                           type="submit"
                           className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-100 hover:text-indigo-900 transition-all shadow-md active:scale-95"
                        >
                           {saveSuccess ? "✓ Configurations Saved!" : "Save Credentials"}
                        </button>
                        
                        <p className="text-[8px] text-stone-400 text-center italic leading-relaxed">
                           Type <strong className="text-white">demo</strong> to simulated test of neural handshake.
                        </p>
                     </form>

                     <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                           <Zap className="w-3 h-3" />
                           Ecosystem Partner
                        </div>
                        <p className="text-[10px] text-indigo-200 leading-relaxed italic border-stone-200">
                           Not using Mews yet? Join the world's most advanced cloud PMS ecosystem through our partner channel.
                        </p>
                        <a 
                          href="https://referrals.mews.com/uU3mdly3" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 transition-all shadow-lg"
                        >
                          Join Mews Ecosystem <ArrowRight className="w-3 h-3" />
                        </a>
                     </div>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 italic">Integration Architecture</p>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white font-serif font-black text-xs italic">V</div>
                           <div className="h-px flex-1 bg-gradient-to-r from-indigo-500 to-transparent"></div>
                           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-serif font-black text-xs italic">M</div>
                        </div>
                     </div>
                  </div>
               </div>
           </div>
        </div>
      )}

      {activeTab === 'quickbooks' && (
        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-sm space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8">
                    <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                       QuickBooks Online Ready
                    </div>
                 </div>

                 <div className="space-y-6 max-w-xl">
                    <div className="space-y-2">
                       <h2 className="text-2xl font-serif font-black italic text-stone-900 tracking-tight">Financial Ledger Handshake</h2>
                       <p className="text-stone-500 text-sm italic font-medium leading-relaxed">
                          Automate your back-office by syncing inventory valuation, daily sales summaries, and purchase bills directly to QuickBooks Online.
                       </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                       {[
                         { label: 'Revenue Sync', status: 'Enabled', detail: 'Daily Journal Entries' },
                         { label: 'COGS Mapping', status: 'Active', detail: 'Weighted Average Cost' },
                         { label: 'Vendor Sync', status: 'Standby', detail: 'Direct Bill Pushing' },
                         { label: 'Tax Node', status: 'Enabled', detail: 'Multi-jurisdiction compliant' }
                       ].map((stat, i) => (
                         <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-1">
                            <div className="flex justify-between items-start">
                               <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">{stat.label}</p>
                               <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">{stat.status}</span>
                            </div>
                            <p className="text-[10px] font-bold text-stone-900">{stat.detail}</p>
                         </div>
                       ))}
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4">
                       <button 
                         onClick={() => addLog("Triggering Manual General Ledger Sync...")}
                         className="flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all group"
                       >
                         <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                         Push to Ledger
                       </button>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-stone-200 space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <h3 className="text-xl font-serif font-black italic text-stone-900">Chart of Accounts Mapping</h3>
                       <p className="text-xs text-stone-500 italic font-medium">Link Vinetelligence categories to your QBO GL Accounts.</p>
                    </div>
                    <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Refresh Accounts</button>
                 </div>

                 <div className="space-y-4">
                    {[
                      { v: 'Wine Sales', q: '4000 - Beverage Revenue', type: 'Income' },
                      { v: 'Spirit Sales', q: '4010 - Spirit Revenue', type: 'Income' },
                      { v: 'Cellar Asset', q: '1200 - Inventory (Drink)', type: 'Asset' },
                      { v: 'Wastage Node', q: '5100 - Cost of Goods Sold', type: 'Expense' }
                    ].map((map, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-stone-50 rounded-2xl border border-stone-100">
                         <div className="flex items-center gap-6">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-stone-200">
                               <Database className="w-4 h-4 text-stone-400" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Source: {map.v}</p>
                               <div className="flex items-center gap-2">
                                  <ArrowRight className="w-3 h-3 text-emerald-500" />
                                  <p className="text-xs font-bold text-stone-900">{map.q}</p>
                               </div>
                            </div>
                         </div>
                         <div className="px-3 py-1 bg-stone-200/50 rounded-lg text-[8px] font-black uppercase text-stone-500">{map.type}</div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-8">
               <div className="bg-emerald-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl">
                  <div className="space-y-2">
                     <h3 className="text-xl font-serif font-black italic text-emerald-300 tracking-tight">Accounting Audit</h3>
                     <p className="text-emerald-100/50 text-xs italic font-medium leading-relaxed uppercase tracking-wider">Sync Integrity Node</p>
                  </div>
                  
                  <div className="space-y-6 text-sm">
                     <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-white/10 text-[10px] font-black uppercase tracking-widest">
                           <span className="text-emerald-300/60 font-serif italic">Last Sync</span>
                           <span>Today, 06:14 AM</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-white/10 text-[10px] font-black uppercase tracking-widest">
                           <span className="text-emerald-300/60 font-serif italic">Pending Bills</span>
                           <span>12 Orders</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                           <span className="text-emerald-300/60 font-serif italic">Sync Accuracy</span>
                           <span className="text-emerald-400">99.9%</span>
                        </div>
                     </div>

                     <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                           <Info className="w-3 h-3" />
                           Direct Sync Mode
                        </div>
                        <p className="text-[10px] text-emerald-100/60 leading-relaxed italic leading-relaxed">
                           Vinetelligence bypasses standard export/import. We push data directly into your <strong className="text-white">QuickBooks API</strong> tunnel using Oauth2 handshake.
                        </p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-sm space-y-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                     <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-lg font-serif font-black italic text-stone-900">Multi-Channel GL</h3>
                     <p className="text-[11px] text-stone-500 font-medium italic leading-relaxed">
                        Selling across restaurant, bar, and retail? Automatically segment revenue and inventory by channel in QuickBooks.
                     </p>
                  </div>
                  <button className="w-full py-3 border border-stone-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all">
                     View Channel Map
                  </button>
               </div>
           </div>
        </div>
      )}

      {activeTab === 'lockers' && (
        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[3rem] p-10 border border-stone-200 shadow-sm space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8">
                    <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                       SommOne Link Certified
                    </div>
                 </div>

                 <div className="space-y-6 max-w-xl">
                    <div className="space-y-2">
                       <h2 className="text-2xl font-serif font-black italic text-stone-900 tracking-tight">SommOne Wine Locker Hub</h2>
                       <p className="text-stone-500 text-sm italic font-medium leading-relaxed">
                          Synchronize and manage customer-owned wine collections directly with your table maps. When locker owners dine, floor servers can instantly retrieve, pour, and log cellar withdrawals on our mobile interfaces.
                       </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                       {[
                         { label: 'Active Lockers', val: '4/12' },
                         { label: 'Stored Bottles', val: `${lockers.reduce((acc, curr) => acc + curr.count, 0)} Bottles` },
                         { label: 'POS Integrations', val: 'Toast certified' },
                         { label: 'Ledger Audit', val: '99.99%' }
                       ].map((stat, i) => (
                         <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-center space-y-1">
                            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-sm font-black text-stone-900 font-serif italic">{stat.val}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-stone-200 space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <h3 className="text-xl font-serif font-black italic text-stone-900">Member Locker Vaults</h3>
                       <p className="text-xs text-stone-500 italic font-medium">Interactive registry. Click 'Pull Bottle' to simulate a tableside withdrawal.</p>
                    </div>
                 </div>

                 <div className="grid sm:grid-cols-2 gap-4">
                    {lockers.map((lck) => (
                      <div key={lck.id} className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 flex flex-col justify-between gap-6 hover:shadow-md transition-all duration-300">
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <span className="px-2.5 py-1 bg-stone-200 text-stone-700 rounded-lg text-[8px] font-mono font-black tracking-wider uppercase">{lck.id}</span>
                               <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${lck.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{lck.status}</span>
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-xs font-black text-stone-400 uppercase tracking-wider">Member Name</h4>
                               <p className="text-sm font-black text-stone-900 font-serif italic">{lck.member}</p>
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Reserve Bottle</h4>
                               <p className="text-xs font-bold text-stone-800 line-clamp-1">{lck.title}</p>
                            </div>
                         </div>

                         <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between">
                            <div className="space-y-0.5">
                               <h4 className="text-[8px] font-black text-stone-400 uppercase tracking-wider">Qty Remaining</h4>
                               <p className="text-lg font-black text-indigo-600 font-serif italic">{lck.count} <span className="text-[9px] text-stone-500 uppercase font-sans tracking-widest font-bold">Btls</span></p>
                            </div>

                            <div className="flex gap-2">
                               <button 
                                 onClick={() => handleRestockLocker(lck.id)}
                                 title="Restock / Add bottle"
                                 className="w-8 h-8 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition-all text-xs"
                               >
                                 <i className="fas fa-plus"></i>
                               </button>
                               <button 
                                 onClick={() => handleWithdrawBottle(lck.id)}
                                 disabled={lck.count <= 0}
                                 className="px-4 h-8 rounded-lg bg-stone-900 hover:bg-indigo-600 disabled:bg-stone-200 disabled:text-stone-400 text-white flex items-center justify-center transition-all text-[8px] font-black uppercase tracking-widest"
                               >
                                 Pull Bottle
                               </button>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-8">
               <div className="bg-stone-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl">
                  <div className="space-y-2">
                     <h3 className="text-xl font-serif font-black italic text-indigo-400 tracking-tight">Tableside Integration</h3>
                     <p className="text-stone-400 text-xs italic font-medium leading-relaxed uppercase tracking-wider">SommOne & Toast POS Flow</p>
                  </div>
                  
                  <div className="space-y-6">
                     <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                           <i className="fas fa-network-wired text-xs"></i>
                           Ecosystem Loop
                        </div>
                        <p className="text-[10px] text-stone-300 leading-relaxed italic">
                           Vinetelligence leverages SommOne\'s Open API to directly stream private inventory data to our floor terminal and tableside tablets.
                        </p>
                     </div>

                     <div className="space-y-4 pt-2">
                        {[
                          { step: '01', title: 'Loyalty Trigger', desc: 'When the guest check is opened in Toast, the system recognizes the member ID automatically.' },
                          { step: '02', title: 'Locker Authorization', desc: 'A secure popup on the hand-held terminal displays the list of pre-vetted private collections.' },
                          { step: '03', title: 'Floor Pull & Log', desc: 'Sommelier pulls the wine from physical cabinet; clicking "Pull Bottle" automatically logs depletion and applies corkage parameters.' }
                        ].map((item, idx) => (
                          <div key={idx} className="flex gap-4">
                             <span className="text-indigo-400 font-serif font-black italic text-sm">{item.step}</span>
                             <div className="space-y-0.5">
                                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">{item.title}</h4>
                                <p className="text-[10px] text-stone-400 italic leading-relaxed">{item.desc}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
           </div>
        </div>
      )}

      {(activeTab === 'logs' || activeTab === 'mews' || activeTab === 'quickbooks' || activeTab === 'lockers') && (
        <div className="bg-white rounded-[2.5rem] p-1 border border-stone-200">
           <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-900">Neural Sync Registry</h3>
              <button 
                onClick={() => setSyncLogs([])}
                className="text-[9px] font-black text-stone-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
              >
                Clear Buffer
              </button>
           </div>
           <div className="h-64 overflow-y-auto bg-stone-50/50 p-6 space-y-2 font-mono text-[10px] custom-scrollbar">
              {syncLogs.length > 0 ? (
                syncLogs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={i} 
                    className="flex gap-4 p-2 rounded-lg bg-white border border-stone-200 shadow-sm"
                  >
                    <span className="text-indigo-400 shrink-0">{log.split(']')[0]}]</span>
                    <span className="text-stone-600">{log.split(']')[1]}</span>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-stone-400 italic">
                  No synchronization activity recorded.
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationHubView;


import React, { useState, useEffect, useMemo } from 'react';
import { EstablishmentRegistry, EstablishmentStatus, Invoice } from '../lib/types';
import { paymentService } from '../services/paymentService';
import { supabaseSync } from '../services/supabaseSync';
import { firebaseService, VisitorInterest } from '../services/firebaseService';

const MOCK_REGISTRY: EstablishmentRegistry[] = [
  { id: 'est-001', name: 'The Gilded Shaker', tier: 'Visionary', userLimit: 10, status: 'Active', lastPulse: '2m ago', usageMetric: 88, billingStatus: 'Current', mrr: 199 },
  { id: 'est-002', name: 'Vintage Tokyo', tier: 'Enterprise', userLimit: 999, status: 'Active', lastPulse: '15s ago', usageMetric: 94, billingStatus: 'Current', mrr: 899 },
  { id: 'est-003', name: 'Alpine Winter Cabin', tier: 'Operator', userLimit: 5, status: 'Suspended', lastPulse: '4d ago', usageMetric: 0, billingStatus: 'Delinquent', mrr: 99 },
  { id: 'est-004', name: 'Brutalist Espresso', tier: 'Explorer', userLimit: 5, status: 'Trial_Expired', lastPulse: '2h ago', usageMetric: 12, billingStatus: 'N/A', mrr: 0 },
];

interface MasterAdminProps {
  isDeveloper?: boolean;
  initialTab?: 'nodes' | 'ledger' | 'security';
  mode?: 'saas' | 'ledger';
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  role: string;
  score: number;
  downloads: number;
  date: string;
  source?: string;
}

const MasterAdmin: React.FC<MasterAdminProps> = ({ 
  isDeveloper = false, 
  initialTab = 'nodes',
  mode = 'saas'
}) => {
  const [registry, setRegistry] = useState<EstablishmentRegistry[]>(() => {
    const saved = localStorage.getItem('vinetelligence_master_registry') || localStorage.getItem('vinea_master_registry');
    return saved ? JSON.parse(saved) : MOCK_REGISTRY;
  });
  const [activeTab, setActiveTab] = useState<'nodes' | 'ledger' | 'security' | 'leads'>(initialTab as 'nodes' | 'ledger' | 'security' | 'leads');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [visitorInterests, setVisitorInterests] = useState<VisitorInterest[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info' | 'success';
    confirmLabel?: string;
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });

  const showNotification = (title: string, message: string, type: 'success' | 'danger' | 'info' = 'info') => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => setConfirmModal(prev => ({ ...prev, show: false })),
      type,
      confirmLabel: 'Close'
    });
  };

  const askConfirmation = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'info' = 'info', confirmLabel = 'Confirm') => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, show: false }));
      },
      type,
      confirmLabel
    });
  };

  const syncWithCloud = async () => {
    setIsSyncing(true);
    try {
      const cloudData = await supabaseSync.pullRegistry();
      if (cloudData) {
        setRegistry(cloudData);
      } else if (cloudData === null) {
        // Silo missing or empty, keep local/mock data
        console.warn("Vinetelligence: Cloud Silo inactive. Using local node registry.");
      }
    } catch (e) {
      console.error("Vinetelligence: Cloud Sync Failed", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncWithCloud();
    
    // Subscribe to Supabase Registry for real-time updates
    const unsubscribe = supabaseSync.subscribeToRegistry((data) => {
      if (data) {
        setRegistry(data);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('vinetelligence_master_registry', JSON.stringify(registry));
    localStorage.setItem('vinea_master_registry', JSON.stringify(registry));
    supabaseSync.pullSaaSInvoices()
      .then(fetchedInvoices => {
        // Only set invoices if we get data from cloud
        // If data is empty (purged), we want to show it as empty, not fallback to mock
        setInvoices(fetchedInvoices);
      })
      .catch(e => {
        console.error("Vinetelligence: Failed to get invoices from Supabase", e);
        paymentService.getInvoices().then(setInvoices);
      });
  }, [registry]);

  useEffect(() => {
    if (activeTab === 'leads') {
      setIsLoadingLeads(true);
      fetch('/api/leads')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            setLeads(data);
          }
        })
        .catch(err => console.error("Failed to load leads", err))
        .finally(() => setIsLoadingLeads(false));

      setIsLoadingInterests(true);
      const unsubscribe = firebaseService.subscribeToVisitorInterests((data) => {
        setVisitorInterests(data);
        setIsLoadingInterests(false);
      });

      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [activeTab]);

  const updateStatus = async (id: string, status: EstablishmentStatus) => {
    const performUpdate = async () => {
      // Optimistic update
      setRegistry(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      
      try {
        const result = await supabaseSync.updateRestaurantStatus(id, status);
        if (!result.success) {
          showNotification("Sync Error", result.message, "danger");
          syncWithCloud();
        }
      } catch (e) {
        console.error("Vinetelligence: Error updating status", e);
        showNotification("Error", "An error occurred while updating the status.", "danger");
        syncWithCloud();
      }
    };

    if (status === 'Suspended') {
      askConfirmation(
        'Suspend Establishment',
        'Are you sure you want to suspend this establishment? This will restrict their access to the Vinetelligence platform.',
        performUpdate,
        'danger',
        'Suspend'
      );
    } else {
      performUpdate();
    }
  };

  const handleMessageOwner = (email?: string, name?: string) => {
    if (!email) {
      showNotification("Missing Data", "No owner email found for this establishment.", "info");
      return;
    }
    const subject = encodeURIComponent(`Vinetelligence Network Intelligence: ${name}`);
    const body = encodeURIComponent(`Hello,\n\nThis is an automated message from Vinetelligence Network Command regarding your establishment: ${name}.\n\n`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const stats = useMemo(() => ({
    total: registry.length,
    active: registry.filter(e => e.status === 'Active').length,
    revenue: registry.reduce((acc, curr) => acc + (curr.billingStatus === 'Current' ? curr.mrr : 0), 0)
  }), [registry]);

  const selectedEst = registry.find(e => e.id === selectedId);

  const handleDeleteRestaurant = async (id: string) => {
    askConfirmation(
      'Terminate Architecture',
      'Are you absolutely sure you want to delete this restaurant and ALL its associated data? This cannot be undone.',
      async () => {
        setIsSyncing(true);
        try {
          const result = await supabaseSync.deleteRestaurant(id);
          if (result.success) {
            showNotification("Success", "Establishment architecture terminated successfully.", "success");
            setRegistry(prev => prev.filter(e => e.id !== id));
            setSelectedId(null);
          } else {
            showNotification("Error", result.message, "danger");
          }
        } catch (e) {
          console.error("Vinetelligence: Delete failed", e);
          showNotification("Error", "An error occurred during deletion.", "danger");
        } finally {
          setIsSyncing(false);
        }
      },
      'danger',
      'Terminate'
    );
  };

  const handlePurgeTestData = async () => {
    askConfirmation(
      'Purge Test Data',
      'This will delete ALL restaurants with "Test", "Demo", or "Placeholder" in their name. Are you sure?',
      async () => {
        setIsSyncing(true);
        try {
          const result = await supabaseSync.purgeTestRestaurants();
          if (result.success) {
            showNotification("Purge Complete", result.message, "success");
            await syncWithCloud();
          } else {
            showNotification("Purge Failed", result.message, "danger");
          }
        } catch (e) {
          console.error("Vinetelligence: Purge failed", e);
          showNotification("Error", "An error occurred during purge.", "danger");
        } finally {
          setIsSyncing(false);
        }
      },
      'danger',
      'Purge All'
    );
  };

  const handlePurgeLedger = async () => {
    askConfirmation(
      'Purge Global Ledger',
      'This will delete ALL transaction history from the Global Network Ledger. This action is irreversible. Proceed?',
      async () => {
        setIsSyncing(true);
        try {
          const result = await supabaseSync.purgeSaaSLedger();
          if (result.success) {
            showNotification("Purge Complete", result.message, "success");
            setInvoices([]);
          } else {
            showNotification("Purge Failed", result.message, "danger");
          }
        } catch (e) {
          console.error("Vinetelligence: Ledger Purge failed", e);
          showNotification("Error", "An error occurred during ledger purge.", "danger");
        } finally {
          setIsSyncing(false);
        }
      },
      'danger',
      'Purge Now'
    );
  };

  const formatPulse = (pulse: string) => {
    if (!pulse || pulse === 'Unknown' || pulse === 'N/A') return 'N/A';
    try {
      const date = new Date(pulse);
      if (isNaN(date.getTime())) return pulse;
      
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return pulse;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 pb-20">
      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center space-y-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                confirmModal.type === 'danger' ? 'bg-indigo-50 text-indigo-600' : 
                confirmModal.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                'bg-blue-50 text-blue-600'
              }`}>
                <i className={`fas ${
                  confirmModal.type === 'danger' ? 'fa-triangle-exclamation' : 
                  confirmModal.type === 'success' ? 'fa-check-circle' : 
                  'fa-info-circle'
                } text-2xl`}></i>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-serif font-bold text-stone-900 italic">{confirmModal.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{confirmModal.message}</p>
              </div>
              <div className="flex gap-3 pt-4">
                {confirmModal.confirmLabel !== 'Close' && (
                  <button 
                    onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                    className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                    confirmModal.type === 'danger' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 
                    'bg-stone-900 text-white hover:bg-indigo-600'
                  }`}
                >
                  {confirmModal.confirmLabel || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <i className={`fas ${mode === 'saas' ? 'fa-network-wired' : 'fa-vault'} text-indigo-500`}></i>
             <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
               {mode === 'saas' ? 'Network Command Center' : 'Global Revenue Ledger'}
             </h2>
          </div>
          <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em]">
            {mode === 'saas' ? 'Developer Organization Terminal (Root Access)' : 'Executive Stakeholder Financial Suite'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isDeveloper && mode === 'saas' && (
            <button 
              onClick={handlePurgeTestData}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg transition-all"
            >
              <i className="fas fa-trash-can"></i>
              Purge Test Data
            </button>
          )}
          <button 
            onClick={syncWithCloud}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isSyncing ? 'bg-stone-100 text-stone-400' : 'bg-stone-900 text-white hover:bg-indigo-600 shadow-lg'
            }`}
          >
            <i className={`fas fa-sync-alt ${isSyncing ? 'animate-spin' : ''}`}></i>
            {isSyncing ? 'Syncing...' : 'Sync Cloud'}
          </button>
          <div className="flex gap-1 p-1 bg-stone-100 rounded-xl shadow-inner">
             {mode === 'saas' ? (
               <>
                 <button onClick={() => setActiveTab('nodes')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'nodes' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Node Registry</button>
                 <button onClick={() => setActiveTab('leads')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'leads' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Tracked Audits & Leads</button>
                 <button onClick={() => setActiveTab('security')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>Network Security</button>
               </>
             ) : (
               <button onClick={() => setActiveTab('ledger')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ledger' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>SaaS Revenue</button>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Active Silos', value: stats.active, icon: 'fa-server', color: 'text-emerald-500' },
          { label: 'Total Network MRR', value: `${stats.revenue.toLocaleString()}`, icon: 'fa-vault', color: 'text-blue-500' },
          { label: 'API Load Index', value: '32%', icon: 'fa-microchip', color: 'text-indigo-500' },
          { label: 'Network Uptime', value: '99.9%', icon: 'fa-heart-pulse', color: 'text-indigo-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-stone-900 border border-white/5 p-6 rounded-3xl shadow-xl hover:scale-[1.02] transition-transform">
            <p className="text-[10px] font-black uppercase text-stone-500 mb-1 tracking-widest">{stat.label}</p>
            <div className="flex justify-between items-end">
               <p className="text-3xl font-black text-white">{stat.value}</p>
               <i className={`fas ${stat.icon} ${stat.color} text-xl mb-1`}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2.5rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col">
        {activeTab === 'nodes' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 bg-stone-50 z-10 border-b border-stone-100">
                  <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                    <th className="px-8 py-5">Establishment Identity</th>
                    <th className="px-8 py-5">Architecture Tier</th>
                    <th className="px-8 py-5">Usage Metric</th>
                    <th className="px-8 py-5">Heartbeat</th>
                    <th className="px-8 py-5">Protocol State</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {registry.map(est => (
                    <tr key={est.id} onClick={() => setSelectedId(est.id)} className={`cursor-pointer transition-all hover:bg-stone-50 group ${selectedId === est.id ? 'bg-indigo-50/50' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-stone-900 text-indigo-500 flex items-center justify-center font-black text-xs shadow-sm">{est.name[0]}</div>
                          <div>
                            <p className="text-sm font-bold text-stone-900">{est.name}</p>
                            <p className="text-[10px] text-stone-400 font-mono">NODE_ID: {est.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                          est.tier === 'Enterprise' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          est.tier === 'Visionary' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          'bg-stone-100 text-stone-600 border-stone-200'
                        }`}>
                          {est.tier}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="w-24 flex flex-col gap-1">
                           <div className="flex justify-between text-[8px] font-bold text-stone-400 uppercase"><span>Load</span><span>{est.usageMetric}%</span></div>
                           <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                              <div className="h-full bg-stone-900 transition-all duration-1000" style={{ width: `${est.usageMetric}%` }}></div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-bold text-stone-500 italic">{formatPulse(est.lastPulse)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${est.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                          {est.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <i className="fas fa-chevron-right text-stone-200 group-hover:text-indigo-500 transition-colors"></i>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedEst && (
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-stone-100 p-8 space-y-8 animate-in slide-in-from-right-4 bg-stone-50/30 overflow-y-auto custom-scrollbar">
                 <div className="space-y-2">
                    <h4 className="text-xl font-serif font-black text-stone-900 italic">{selectedEst.name}</h4>
                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest border-b border-stone-200 pb-2">Facility Registry Override</p>
                 </div>
                 
                 <div className="space-y-6">
                    <div>
                       <p className="text-[9px] font-black text-stone-400 uppercase mb-3">Lifecycle Control</p>
                       <div className="grid grid-cols-2 gap-2">
                          <button onClick={() => updateStatus(selectedEst.id, 'Active')} className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${selectedEst.status === 'Active' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-stone-400 border border-stone-200'}`}>Active</button>
                          <button onClick={() => updateStatus(selectedEst.id, 'Suspended')} className={`py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${selectedEst.status === 'Suspended' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-stone-400 border border-stone-200'}`}>Suspend</button>
                       </div>
                    </div>

                    <div>
                       <p className="text-[9px] font-black text-stone-400 uppercase mb-3">Provisioning Metrics</p>
                       <div className="bg-white p-6 rounded-[2rem] border border-stone-100 space-y-4 shadow-sm">
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-stone-400 uppercase">User Nodes</span>
                             <span className="text-xs font-black text-stone-900">{selectedEst.userLimit}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-stone-400 uppercase">Monthly MRR</span>
                             <span className="text-xs font-black text-emerald-600">${selectedEst.mrr}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-[10px] font-bold text-stone-400 uppercase">Last Sync</span>
                             <span className="text-[10px] font-bold text-stone-500 italic">{formatPulse(selectedEst.lastPulse)}</span>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={() => handleMessageOwner(selectedEst.ownerEmail, selectedEst.name)}
                      className="w-full py-4 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
                    >
                       <i className="fas fa-envelope"></i> Message Owner
                    </button>
                    <button 
                      onClick={() => handleDeleteRestaurant(selectedEst.id)}
                      className="w-full py-4 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                    >
                       Terminate Architecture
                    </button>
                 </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="flex-1 flex flex-col p-10 space-y-10 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                 <div>
                    <h3 className="text-2xl font-serif font-bold text-stone-900 italic">Global Network Revenue</h3>
                    <p className="text-stone-500 text-sm font-medium italic">Consolidated ledger for all Vinetelligence establishment SaaS nodes.</p>
                 </div>
                 <div className="flex flex-col sm:flex-row gap-3">
                    <button className="px-8 py-3 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all">Export Net Rev</button>
                    <button onClick={handlePurgeLedger} className="px-8 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100">Purge Ledger</button>
                     <button className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg">Generate P&L Report</button>
                 </div>
              </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] shadow-inner space-y-6">
                   <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Top Yielding Nodes</h4>
                      <i className="fas fa-crown text-emerald-300"></i>
                   </div>
                   <div className="space-y-4">
                      {registry.filter(e => e.mrr > 0).sort((a,b) => b.mrr - a.mrr).map(e => (
                        <div key={e.id} className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm hover:translate-x-1 transition-transform">
                           <div className="flex items-center gap-4">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              <span className="text-sm font-bold text-stone-800">{e.name}</span>
                           </div>
                           <span className="text-sm font-black text-emerald-600">${e.mrr}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] shadow-inner space-y-6">
                   <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Revenue at Risk (Arrears)</h4>
                      <i className="fas fa-triangle-exclamation text-indigo-300"></i>
                   </div>
                   <div className="space-y-4">
                      {registry.filter(e => e.billingStatus === 'Delinquent').map(e => (
                        <div key={e.id} className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border-l-4 border-indigo-500">
                           <span className="text-sm font-bold text-stone-800">{e.name}</span>
                           <div className="flex gap-3">
                              <span className="text-xs font-black text-indigo-600 self-center">${e.mrr}</span>
                              <button 
                                onClick={() => updateStatus(e.id, 'Suspended')}
                                className="text-[9px] font-black text-white bg-stone-900 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-indigo-600 transition-colors"
                              >
                                Suspend
                              </button>
                           </div>
                        </div>
                      ))}
                      {registry.filter(e => e.billingStatus === 'Delinquent').length === 0 && (
                        <div className="py-20 text-center text-stone-300 italic text-sm">Registry Healthy. No nodes in arrears.</div>
                      )}
                   </div>
                </div>
             </div>

              <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-xl">
                 <div className="p-8 border-b border-stone-50 bg-stone-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h4 className="text-[10px] font-black uppercase text-stone-500 tracking-widest italic">Global Network Ledger</h4>
                    <span className="bg-stone-900 text-white px-3 py-1 rounded-full text-[9px] font-black">History: 7 Years</span>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                       <thead>
                         <tr className="text-[9px] font-black uppercase text-stone-400 border-b border-stone-50 bg-stone-50/20">
                            <th className="px-8 py-5">Transaction Node</th>
                            <th className="px-8 py-5">Source Establishment</th>
                            <th className="px-8 py-5">Synthesis Amount</th>
                            <th className="px-8 py-5">Protocol State</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                         {invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-stone-50/50 group transition-all">
                               <td className="px-8 py-6">
                                  <p className="text-xs font-bold text-stone-800">{inv.id}</p>
                                  <p className="text-[9px] text-stone-400 font-black uppercase mt-1">{inv.date}</p>
                               </td>
                               <td className="px-8 py-6">
                                  <p className="text-xs font-bold text-stone-700">{inv.restaurantName || 'The Gilded Shaker'}</p>
                                  <span className="text-[10px] font-black uppercase text-stone-400 flex items-center gap-2 mt-1">
                                     <i className={`fab fa-${inv.method.toLowerCase().replace(' ', '')} text-stone-300`}></i> 
                                     {inv.method}
                                  </span>
                               </td>
                               <td className="px-8 py-6"><span className="text-sm font-black text-stone-800">${inv.amount}</span></td>
                               <td className="px-8 py-6">
                                  <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border shadow-sm ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                     {inv.status}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'leads' && (
           <div className="flex-1 p-12 overflow-y-auto custom-scrollbar space-y-8 flex flex-col">
              <div className="flex justify-between items-end shrink-0">
                 <div className="space-y-2">
                    <h3 className="text-2xl font-serif font-bold text-stone-900 italic">Pre-Sales Lead Acquiring & Audit Downloads</h3>
                    <p className="text-stone-500 text-sm italic font-medium">Tracks who downloaded the Operational self-assessment checklists or requested custom reports, including score outputs and access frequency measurements.</p>
                 </div>
                 <div className="flex bg-stone-100 p-1.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] uppercase font-black px-3 py-1 bg-white shadow-sm rounded-lg text-indigo-650">Active Campaign Grounding</span>
                 </div>
              </div>

              {isLoadingLeads ? (
                 <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <i className="fas fa-sync-alt animate-spin text-3xl text-indigo-500"></i>
                    <p className="text-stone-400 font-mono text-xs">LOADING AUDITS REGISTRY...</p>
                 </div>
              ) : (
                <div className="flex-1 bg-white border border-stone-200 rounded-[2rem] overflow-hidden flex flex-col min-h-0 min-w-0">
                   <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                         <thead className="bg-stone-100 sticky top-0 z-10 border-b border-stone-200">
                            <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                               <th className="px-8 py-5">Establishment Details</th>
                               <th className="px-8 py-5">Professional Contact</th>
                               <th className="px-8 py-5 text-center">Friction Score</th>
                               <th className="px-8 py-5 text-center">Download Multiplier</th>
                               <th className="px-8 py-5">Telemetry Location</th>
                               <th className="px-8 py-5">Registration Date</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-stone-100 bg-white">
                            {leads.map((lead: Lead) => (
                               <tr key={lead.id} className="hover:bg-stone-50/70 transition-all">
                                  <td className="px-8 py-6">
                                     <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-black font-mono text-xs shadow-sm">
                                           {lead.name ? lead.name[0].toUpperCase() : "A"}
                                        </div>
                                        <div>
                                           <p className="text-sm font-bold text-stone-900">{lead.name}</p>
                                           <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">{lead.source || "Web Portal Download"}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-8 py-6">
                                     <p className="text-xs font-bold text-stone-850">{lead.email}</p>
                                     <p className="text-[10px] font-black uppercase text-indigo-600 mt-0.5">{lead.role || "Operator"}</p>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-black font-mono border shadow-sm ${
                                        lead.score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        lead.score >= 50 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                        'bg-stone-100 text-stone-600 border-stone-200'
                                     }`}>
                                        {lead.score || 0}% AI Ready
                                     </span>
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                     <div className="inline-flex items-center gap-2 bg-stone-100/80 px-3 py-1.5 rounded-xl border border-stone-200 font-mono font-black text-xs text-stone-800">
                                        <i className="fas fa-file-arrow-down text-indigo-500"></i>
                                        {lead.downloads || 1} Downloads
                                     </div>
                                  </td>
                                  <td className="px-8 py-6 text-stone-600 text-xs italic font-medium">{lead.location}</td>
                                  <td className="px-8 py-6 text-stone-400 text-[10px] font-mono">{lead.date ? new Date(lead.date).toLocaleDateString() : 'N/A'}</td>
                               </tr>
                            ))}
                            {leads.length === 0 && (
                               <tr>
                                  <td colSpan={6} className="py-20 text-center text-stone-300 italic text-sm">No leads captured in current temporal sequence.</td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

               {/* Visitor Interests Section */}
               <div className="space-y-4 pt-8 border-t border-stone-200">
                  <div className="flex justify-between items-end">
                     <div className="space-y-1">
                        <h4 className="text-lg font-serif font-bold text-stone-900 italic">Visitor Interests & Exit Survey Responses</h4>
                        <p className="text-stone-500 text-xs italic font-medium">Captures real-time visitor interest selections and qualitative feedback comments from the AI Specialist chat avatar.</p>
                     </div>
                  </div>

                  {isLoadingInterests ? (
                     <div className="py-10 flex flex-col items-center justify-center space-y-2">
                        <i className="fas fa-sync-alt animate-spin text-xl text-indigo-500"></i>
                        <p className="text-stone-400 font-mono text-[10px]">LOADING SURVEY ANSWERS...</p>
                     </div>
                  ) : (
                     <div className="bg-white border border-stone-200 rounded-[2rem] overflow-hidden flex flex-col">
                        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                           <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead className="bg-stone-50 sticky top-0 z-10 border-b border-stone-200">
                                 <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                                    <th className="px-8 py-4">Selected Interest</th>
                                    <th className="px-8 py-4">Exit Comment / Reasons</th>
                                    <th className="px-8 py-4">Source / Context</th>
                                    <th className="px-8 py-4">Recorded Timestamp</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-100 bg-white">
                                 {visitorInterests.map((item) => (
                                    <tr key={item.id || Math.random().toString()} className="hover:bg-stone-50/70 transition-all">
                                       <td className="px-8 py-5">
                                          <div className="flex items-center gap-3">
                                             <div className="w-7 h-7 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-mono font-black text-[10px] shadow-sm">
                                                <i className="fas fa-lightbulb text-[9px]"></i>
                                             </div>
                                             <span className="text-xs font-bold text-stone-900">{item.interest}</span>
                                          </div>
                                       </td>
                                       <td className="px-8 py-5 text-xs text-stone-700 italic max-w-md truncate" title={item.comments}>
                                          {item.comments || <span className="text-stone-300 italic">No additional comments provided</span>}
                                       </td>
                                       <td className="px-8 py-5">
                                          <span className="px-2 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 font-mono text-[9px] font-black uppercase tracking-wider rounded-md">
                                             {item.source || "avatar-chat"}
                                          </span>
                                       </td>
                                       <td className="px-8 py-5 text-[10px] font-mono text-stone-500">
                                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                                       </td>
                                    </tr>
                                 ))}
                                 {visitorInterests.length === 0 && (
                                    <tr>
                                       <td colSpan={4} className="py-12 text-center text-stone-300 italic text-sm">No visitor feedback or interests collected yet in this sequence.</td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  )}
               </div>
            </div>
          )}

        {activeTab === 'security' && (
          <div className="flex-1 p-12 overflow-y-auto custom-scrollbar space-y-12">
             <div className="flex justify-between items-end">
                <div className="space-y-2">
                   <h3 className="text-2xl font-serif font-bold text-stone-900 italic">Network Security & Root Auth</h3>
                   <p className="text-stone-500 text-sm font-medium italic">Manage global API keys, root access tokens, and establishment silos.</p>
                </div>
                <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
                   <i className="fas fa-power-off"></i> Emergency Global Revoke
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-stone-950 text-indigo-500 rounded-2xl flex items-center justify-center text-xl shadow-lg"><i className="fas fa-fingerprint"></i></div>
                      <h4 className="text-lg font-serif font-black italic">Network Root Tokens</h4>
                   </div>
                   <div className="space-y-4">
                      <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center group cursor-pointer hover:border-indigo-500 transition-all">
                         <div>
                            <p className="text-xs font-bold text-stone-900">VNTL-ROOT-2025-ALPHA</p>
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Status: Operational • Created: 01/2025</p>
                         </div>
                         <i className="fas fa-shield-check text-emerald-500 group-hover:scale-125 transition-transform"></i>
                      </div>
                      <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center group cursor-pointer hover:border-indigo-500 transition-all">
                         <div>
                            <p className="text-xs font-bold text-stone-900">VNTL-ROOT-2025-OMEGA</p>
                            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">Status: Dormant • Created: 02/2025</p>
                         </div>
                         <i className="fas fa-circle-xmark text-stone-300 group-hover:scale-125 transition-transform"></i>
                      </div>
                   </div>
                   <button className="w-full py-4 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">Synthesize Root Token</button>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-stone-950 text-indigo-500 rounded-2xl flex items-center justify-center text-xl shadow-lg"><i className="fas fa-key"></i></div>
                      <h4 className="text-lg font-serif font-black italic">Silo Authorization Codes</h4>
                   </div>
                   <p className="text-xs text-stone-500 italic leading-relaxed">Generated upon verified SaaS payment sequence. Allows establishments to elevate from Explorer/Operator tiers.</p>
                   <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <i className="fas fa-magnifying-glass text-stone-300"></i>
                      <input type="text" placeholder="Search Code Registry..." className="bg-transparent border-none outline-none font-bold text-sm w-full" />
                   </div>
                   <div className="h-[120px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {['VNTL-PAID-9821-2025', 'VNTL-ENTP-4402-2025', 'VNTL-PAID-1102-2025'].map(code => (
                        <div key={code} className="flex justify-between items-center text-[10px] font-mono font-black text-stone-400 border-b border-stone-50 pb-2">
                           <span>{code}</span>
                           <span className="text-[8px] bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded">USED</span>
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

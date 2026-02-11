
import React, { useState, useEffect } from 'react';
import { supabaseSync } from '../../services/supabaseClient';

interface ConnectivitySettingsProps {
  profile: any;
  onUpdateTier: (tierId: string) => void;
  onUpdateProfile: (key: string, value: any) => void;
}

const ConnectivitySettings: React.FC<ConnectivitySettingsProps> = ({ profile, onUpdateTier, onUpdateProfile }) => {
  const isExplorer = profile?.edition === 'demo';
  const [useCustomDb, setUseCustomDb] = useState((profile?.edition === 'enterprise' || !!profile?.supabaseUrl) && !isExplorer);
  const [verificationStatus, setVerificationStatus] = useState<{loading: boolean, msg: string, success?: boolean}>({loading: false, msg: ''});

  useEffect(() => {
    if (isExplorer) {
      setUseCustomDb(false);
    }
  }, [isExplorer]);

  const handleVerify = async () => {
    setVerificationStatus({ loading: true, msg: 'Querying Cloud Silo...' });
    const result = await supabaseSync.verifySchema();
    setVerificationStatus({ 
      loading: false, 
      msg: result.success ? 'Schema Active: Bi-directional sync operational.' : `Schema Missing: ${result.message}`,
      success: result.success
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Environment Connectivity</h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isExplorer ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isExplorer ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isExplorer ? 'Demo Environment Active' : 'System Online'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              { id: 'demo', label: 'Explorer', icon: 'fa-vial' },
              { id: 'free', label: 'Operator', icon: 'fa-seedling' },
              { id: 'paid', label: 'Visionary', icon: 'fa-crown' },
              { id: 'enterprise', label: 'Enterprise', icon: 'fa-building-shield' }
            ].map(tier => (
              <button
                key={tier.id}
                onClick={() => onUpdateTier(tier.id)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  profile?.edition === tier.id 
                    ? 'bg-amber-50 border-amber-500 shadow-inner' 
                    : 'bg-stone-50 border-stone-100 opacity-50 grayscale hover:opacity-100'
                }`}
              >
                <i className={`fas ${tier.icon} ${profile?.edition === tier.id ? 'text-amber-600' : 'text-stone-300'}`}></i>
                <span className="text-[9px] font-black uppercase tracking-widest">{tier.label}</span>
              </button>
            ))}
          </div>
       </div>

       <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Data Layer Configuration</h3>
              <p className="text-[10px] text-stone-500 mt-1">
                {isExplorer 
                  ? 'Explorer tier utilizes localized IndexedDB session storage.' 
                  : 'Configure your environment variables for Supabase integration.'}
              </p>
            </div>
            {!isExplorer && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-stone-400">Custom DB</span>
                <button 
                  onClick={() => setUseCustomDb(!useCustomDb)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${useCustomDb ? 'bg-amber-500' : 'bg-stone-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${useCustomDb ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            )}
          </div>

          {isExplorer ? (
            <div className="bg-stone-50 p-10 rounded-[2.5rem] border-4 border-dashed border-stone-100 flex flex-col items-center text-center space-y-6">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-amber-500">
                 <i className="fas fa-flask text-2xl"></i>
               </div>
               <div>
                 <p className="text-stone-900 font-bold">Local Sandbox Isolation</p>
                 <p className="text-xs text-stone-400 max-w-sm mt-1 mx-auto leading-relaxed">
                   The Explorer tier is restricted to local session persistence only. To enable cloud synchronization, please upgrade to a higher tier.
                 </p>
               </div>
               <button 
                onClick={() => onUpdateTier('free')}
                className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
               >
                 Upgrade to Cloud Operator
               </button>
            </div>
          ) : useCustomDb ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-5 bg-stone-900 text-white rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-between">
                 <div className="flex gap-4 items-center">
                    <i className="fas fa-shield-halved text-amber-500 text-xl"></i>
                    <div>
                      <p className="text-xs font-bold">Cloud Silo Status</p>
                      <p className={`text-[10px] uppercase font-black tracking-widest ${verificationStatus.success ? 'text-emerald-400' : 'text-stone-500'}`}>
                        {verificationStatus.msg || 'Awaiting Verification...'}
                      </p>
                    </div>
                 </div>
                 <button 
                  onClick={handleVerify}
                  disabled={verificationStatus.loading}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10 transition-all"
                 >
                   {verificationStatus.loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
                   Verify Intelligence Silo
                 </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Supabase Project URL</label>
                  <input 
                    type="text" 
                    placeholder="https://xyz.supabase.co"
                    defaultValue={profile?.supabaseUrl} 
                    onBlur={(e) => onUpdateProfile('supabaseUrl', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 text-xs font-mono text-stone-700 focus:ring-2 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Public Anon API Key</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="Enter anon key..."
                      defaultValue={profile?.supabaseAnonKey} 
                      onBlur={(e) => onUpdateProfile('supabaseAnonKey', e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 text-xs font-mono text-stone-700 focus:ring-2 focus:ring-amber-500 outline-none" 
                    />
                    <i className="fas fa-key absolute right-4 top-1/2 -translate-y-1/2 text-stone-300"></i>
                  </div>
                </div>
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                   <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Technical Requirement</p>
                   <p className="text-xs text-amber-900 leading-relaxed font-medium">
                     Vinea requires specific table structures to be present in your cloud silo. Ensure you have executed the <code className="bg-amber-100 px-1 rounded">database_schema.sql</code> provided in your deployment package before verifying.
                   </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 p-10 rounded-[2.5rem] border-4 border-dashed border-stone-100 flex flex-col items-center text-center space-y-6">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-stone-200">
                 <i className="fas fa-database text-2xl"></i>
               </div>
               <div>
                 <p className="text-stone-900 font-bold">Managed Vinea Storage Active</p>
                 <p className="text-xs text-stone-400 max-w-sm mt-1 mx-auto leading-relaxed">
                   Currently using local session persistence. Toggle 'Custom DB' to activate your Architect-tier cloud silos.
                 </p>
               </div>
               <button 
                onClick={() => setUseCustomDb(true)}
                className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 shadow-lg"
               >
                 Initialize Private Backend
               </button>
            </div>
          )}
       </div>
    </div>
  );
};

export default ConnectivitySettings;

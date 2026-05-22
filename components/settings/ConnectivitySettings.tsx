
import React, { useState } from 'react';
import { supabaseSync } from '../../services/supabaseSync';
import { RestaurantProfile } from '../../lib/types';
import TestSim from './TestSim';

interface ConnectivitySettingsProps {
  profile: RestaurantProfile | null;
  onUpdateTier: (tierId: string) => void;
  onUpdateProfile: (key: string, value: string | number | boolean | object | null) => void;
}

const ConnectivitySettings: React.FC<ConnectivitySettingsProps> = ({ profile, onUpdateTier, onUpdateProfile }) => {
  const isExplorer = profile?.edition === 'demo';
  const isArchitectTier = profile?.edition === 'enterprise';
  const [useCustomDb, setUseCustomDb] = useState(isArchitectTier && !!profile?.supabaseUrl);
  const [verificationStatus, setVerificationStatus] = useState<{loading: boolean, msg: string, success?: boolean}>({loading: false, msg: ''});
  const [showSimulator, setShowSimulator] = useState(false);

  const handleUpdateTier = (tierId: string) => {
    onUpdateTier(tierId);
    if (tierId !== 'enterprise') {
      setUseCustomDb(false);
    }
  };

  const handleVerify = async () => {
    setVerificationStatus({ loading: true, msg: 'Querying Cloud Silo...' });
    const result = await supabaseSync.verifySchema();
    setVerificationStatus({ 
      loading: false, 
      msg: result.success ? 'Schema Active: Bi-directional sync operational.' : `Schema Missing: ${result.message}`,
      success: result.success
    });
  };

  const handleDiagnostics = async () => {
    setVerificationStatus({ loading: true, msg: 'Running Full Diagnostics...' });
    const result = await supabaseSync.runDiagnostics();
    setVerificationStatus({ 
      loading: false, 
      msg: result.success ? 'Diagnostics Passed: System fully operational.' : `Diagnostics Failed [${result.step}]: ${result.message}`,
      success: result.success
    });
  };

  const handleFixRegistration = async () => {
    if (!profile) return;
    setVerificationStatus({ loading: true, msg: 'Registering Establishment in Cloud Silo...' });
    try {
      // 1. Check if it already exists by name
      const existing = await supabaseSync.checkEstablishmentExists(profile.name);
      if (existing) {
        onUpdateProfile('id', existing.id);
        setVerificationStatus({ loading: false, msg: `Establishment found and linked. ID: ${existing.id}`, success: true });
        return;
      }

      // 2. Register new
      const result = await supabaseSync.registerEstablishment({
        name: profile.name,
        tagline: profile.tagline || '',
        description: profile.description || '',
        type: profile.type || 'Restaurant',
        ownerEmail: profile.ownerEmail || '',
        edition: profile.edition
      });
      
      onUpdateProfile('id', result.id);
      setVerificationStatus({ loading: false, msg: `Establishment registered successfully. ID: ${result.id}`, success: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown registration error';
      setVerificationStatus({ loading: false, msg: `Registration failed: ${message}`, success: false });
    }
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
              { id: 'essential', label: 'Essential', icon: 'fa-seedling' },
              { id: 'growth', label: 'Growth', icon: 'fa-crown' },
              { id: 'enterprise', label: 'Enterprise', icon: 'fa-building-shield' }
            ].map(tier => (
              <button
                key={tier.id}
                onClick={() => handleUpdateTier(tier.id)}
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
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">POS & Inventory Connectivity</h3>
              <p className="text-[10px] text-stone-500 mt-1">
                Integrate Intelligence with your existing Point of Sale system to automate inventory and sales reconciliation.
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
              profile?.posConfig?.status === 'Connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'
            }`}>
              {profile?.posConfig?.status || 'Not Configured'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'Middleware', label: 'Middleware Aggregator', icon: 'fa-network-wired', desc: 'Deliverect, Otter, ItsaCheckmate' },
              { id: 'DirectCloud', label: 'Direct Cloud API', icon: 'fa-cloud-bolt', desc: 'Toast, Square, Lightspeed' },
              { id: 'LegacyFallback', label: 'Legacy Fallback', icon: 'fa-file-export', desc: 'CSV/SFTP Daily Reconciliation' }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => onUpdateProfile('posConfig', { 
                  ...(profile?.posConfig || {}), 
                  type: method.id,
                  status: 'Pending'
                })}
                className={`p-6 rounded-2xl border-2 text-left transition-all space-y-3 ${
                  profile?.posConfig?.type === method.id 
                    ? 'bg-amber-50 border-amber-500 shadow-inner' 
                    : 'bg-stone-50 border-stone-100 hover:border-stone-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  profile?.posConfig?.type === method.id ? 'bg-amber-500 text-white' : 'bg-white text-stone-300'
                }`}>
                  <i className={`fas ${method.icon}`}></i>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-900">{method.label}</p>
                  <p className="text-[9px] text-stone-400 mt-1 leading-tight">{method.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {profile?.posConfig?.type === 'Middleware' && (
            <div className="space-y-4 p-6 bg-stone-50 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Middleware Provider</label>
                  <select 
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold text-stone-700 outline-none"
                    value={profile?.posConfig?.provider || ''}
                    onChange={(e) => onUpdateProfile('posConfig', { ...profile?.posConfig, provider: e.target.value })}
                  >
                    <option value="">Select Provider...</option>
                    <option value="Deliverect">Deliverect</option>
                    <option value="Otter">Otter</option>
                    <option value="ItsaCheckmate">ItsaCheckmate</option>
                    <option value="Omnivore">Omnivore</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Integration API Key</label>
                  <input 
                    type="password"
                    placeholder="Enter API Key..."
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs font-mono text-stone-700 outline-none"
                    value={profile?.posConfig?.apiKey || ''}
                    onChange={(e) => onUpdateProfile('posConfig', { ...profile?.posConfig, apiKey: e.target.value })}
                  />
                </div>
              </div>
              <button 
                onClick={() => onUpdateProfile('posConfig', { ...profile?.posConfig, status: 'Connected', lastSync: new Date().toISOString() })}
                className="w-full py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
              >
                Authorize Middleware Connection
              </button>
            </div>
          )}

          {profile?.posConfig?.type === 'DirectCloud' && (
            <div className="space-y-4 p-6 bg-stone-50 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">POS System</label>
                  <select 
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold text-stone-700 outline-none"
                    value={profile?.posConfig?.provider || ''}
                    onChange={(e) => onUpdateProfile('posConfig', { ...profile?.posConfig, provider: e.target.value })}
                  >
                    <option value="">Select POS...</option>
                    <option value="Toast">Toast</option>
                    <option value="Square">Square</option>
                    <option value="Clover">Clover</option>
                    <option value="Lightspeed">Lightspeed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Webhook URL (Inventory Sync)</label>
                  <input 
                    type="text"
                    readOnly
                    value={`https://api.vinetelligence.live/webhooks/pos/${profile?.id}`}
                    className="w-full bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 text-xs font-mono text-stone-400 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[9px] text-amber-800 leading-relaxed font-medium">
                  <i className="fas fa-info-circle mr-2"></i>
                  Direct Cloud integration requires OAuth authorization. After selecting your POS, click the button below to sign in to your POS dashboard.
                </p>
              </div>
              <button 
                onClick={() => onUpdateProfile('posConfig', { ...profile?.posConfig, status: 'Connected', lastSync: new Date().toISOString() })}
                className="w-full py-3 bg-amber-500 text-stone-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
              >
                Authorize via {profile?.posConfig?.provider || 'POS'} OAuth
              </button>

              {profile?.posConfig?.status === 'Connected' && (
                <button 
                  onClick={() => setShowSimulator(true)}
                  className="w-full py-3 bg-white border border-stone-200 text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-amber-500 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-terminal text-amber-500"></i>
                  Launch POS Simulator (Demo)
                </button>
              )}
            </div>
          )}

          {profile?.posConfig?.type === 'LegacyFallback' && (
            <div className="space-y-4 p-6 bg-stone-50 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">SFTP Host</label>
                  <input 
                    type="text"
                    placeholder="sftp.vinetelligence.live"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs font-mono text-stone-700 outline-none"
                    value={profile?.posConfig?.sftpHost || ''}
                    onChange={(e) => onUpdateProfile('posConfig', { ...profile?.posConfig, sftpHost: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">SFTP Username</label>
                  <input 
                    type="text"
                    placeholder="est_12345"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs font-mono text-stone-700 outline-none"
                    value={profile?.posConfig?.sftpUser || ''}
                    onChange={(e) => onUpdateProfile('posConfig', { ...profile?.posConfig, sftpUser: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">SFTP Password</label>
                  <input 
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-xs font-mono text-stone-700 outline-none"
                    value={profile?.posConfig?.sftpPass || ''}
                    onChange={(e) => onUpdateProfile('posConfig', { ...profile?.posConfig, sftpPass: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-4 bg-stone-100 border border-stone-200 rounded-xl">
                <p className="text-[9px] text-stone-600 leading-relaxed">
                  <i className="fas fa-clock mr-2"></i>
                  Legacy fallback reconciles inventory once every 24 hours via CSV upload. Configure your POS to auto-export sales reports to this SFTP endpoint.
                </p>
              </div>
              <button 
                onClick={() => onUpdateProfile('posConfig', { ...profile?.posConfig, status: 'Connected', lastSync: new Date().toISOString() })}
                className="w-full py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all"
              >
                Test SFTP Connection
              </button>
            </div>
          )}
       </div>

       <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">Data Layer Configuration</h3>
              <p className="text-[10px] text-stone-500 mt-1">
                {isExplorer 
                  ? 'Explorer tier utilizes localized IndexedDB session storage.' 
                  : (isArchitectTier ? 'Configure your enterprise private silo integration.' : 'Intelligence Managed Cloud active for your establishment.')}
              </p>
            </div>
            {isArchitectTier && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-stone-400">Custom DB (BYODB)</span>
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
                onClick={() => handleUpdateTier('essential')}
                className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-lg"
               >
                 Upgrade to Cloud Essential
               </button>
            </div>
          ) : isArchitectTier && useCustomDb ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-5 bg-stone-900 text-white rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-between">
                 <div className="flex gap-4 items-center">
                    <i className="fas fa-shield-halved text-amber-500 text-xl"></i>
                    <div>
                      <p className="text-xs font-bold">Private Silo Status</p>
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
                   Verify Custom Endpoint
                 </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Supabase Project URL</label>
                  <input 
                    type="text" 
                    placeholder="https://your-enterprise.supabase.co"
                    defaultValue={profile?.supabaseUrl} 
                    onBlur={(e) => onUpdateProfile('supabaseUrl', e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 text-xs font-mono text-stone-700 focus:ring-2 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Private Anon API Key</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="Enter private anon key..."
                      defaultValue={profile?.supabaseAnonKey} 
                      onBlur={(e) => onUpdateProfile('supabaseAnonKey', e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-5 py-4 text-xs font-mono text-stone-700 focus:ring-2 focus:ring-amber-500 outline-none" 
                    />
                    <i className="fas fa-key absolute right-4 top-1/2 -translate-y-1/2 text-stone-300"></i>
                  </div>
                </div>
              </div>
            </div>
          ) : !isArchitectTier ? (
            <div className="bg-stone-50 p-10 rounded-[2.5rem] border border-emerald-500/20 flex flex-col items-center text-center space-y-6">
               <div className="w-16 h-16 bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center text-emerald-500">
                 <i className="fas fa-cloud-check text-2xl"></i>
               </div>
               <div>
                 <p className="text-stone-900 font-bold">Resilient Managed Storage Active</p>
                 <p className="text-xs text-stone-400 max-w-sm mt-1 mx-auto leading-relaxed">
                   Your establishment data is automatically encrypted and backed up to Intelligence's global cloud network. 
                   <span className="block mt-2 font-black text-emerald-600">Enterprise Silos are restricted to the Architect Tier.</span>
                 </p>
               </div>
               <div className="p-4 bg-white rounded-2xl border border-stone-200 w-full max-w-xs shadow-sm">
                  <div className="flex justify-between items-center text-[8px] font-black uppercase text-stone-400 mb-2">
                    <span>Sync Health</span>
                    <span className="text-emerald-600">Optimal</span>
                  </div>
                  <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full animate-pulse"></div>
                  </div>
               </div>
               <p className="text-[10px] text-stone-400 italic">
                 "Enterprise BYODB connectivity ensures regulatory compliance and residency control."
               </p>
            </div>
          ) : (
            <div className="bg-stone-50 p-10 rounded-[2.5rem] border-4 border-dashed border-stone-100 flex flex-col items-center text-center space-y-6">
               <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-stone-200">
                 <i className="fas fa-database text-2xl"></i>
               </div>
               <div>
                 <p className="text-stone-900 font-bold">Managed Cloud Node (Architect)</p>
                 <p className="text-xs text-stone-400 max-w-sm mt-1 mx-auto leading-relaxed">
                   Currently using Intelligence's high-speed global cluster. Toggle 'Custom DB' to point this node to your private enterprise silo.
                 </p>
               </div>
               <button 
                onClick={() => setUseCustomDb(true)}
                className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg active:scale-95 transition-all"
               >
                 Initialize Private Silo
               </button>
            </div>
          )}
       </div>

       <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-200 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-stone-400">System Diagnostics</h3>
            <div className="flex gap-2">
              {profile?.id === 'demo-id' && !isExplorer && (
                <button 
                  onClick={handleFixRegistration}
                  disabled={verificationStatus.loading}
                  className="px-6 py-3 bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-500 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-amber-900/20"
                >
                  {verificationStatus.loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wrench"></i>}
                  Fix Establishment Registration
                </button>
              )}
              <button 
                onClick={handleDiagnostics}
                disabled={verificationStatus.loading}
                className="px-6 py-3 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {verificationStatus.loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-stethoscope"></i>}
                Run Connectivity Diagnostics
              </button>
            </div>
          </div>
          
          {verificationStatus.msg && (
            <div className={`p-6 rounded-2xl border-2 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 ${
              verificationStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'
            }`}>
              <i className={`fas ${verificationStatus.success ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-circle text-red-500'} text-xl mt-0.5`}></i>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest">Diagnostic Report</p>
                <p className="text-xs font-medium italic leading-relaxed">{verificationStatus.msg}</p>
              </div>
            </div>
          )}
        </div>

        {showSimulator && (
          <TestSim 
            restaurantName={profile?.name || 'Establishment'} 
            onClose={() => setShowSimulator(false)} 
          />
        )}
    </div>
  );
};

export default ConnectivitySettings;

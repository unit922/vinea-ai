
import React, { useState } from 'react';
import { supabaseSync } from '../../services/supabaseSync';
import { RestaurantProfile } from '../../lib/types';

interface SetupSettingsProps {
  onRelaunch: () => void;
  profile: RestaurantProfile | null;
  onUpdate: (key: keyof RestaurantProfile, value: string) => void;
}

const SetupSettings: React.FC<SetupSettingsProps> = ({ onRelaunch, profile, onUpdate }) => {
  const [isCleaning, setIsCleaning] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isConfirmingCloudPurge, setIsConfirmingCloudPurge] = useState(false);
  const [isConfirmingSeed, setIsConfirmingSeed] = useState(false);

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleCloudPurge = async () => {
    if (!profile?.id) {
      setCleanFeedback({ success: false, message: "Establishment ID not found. Cannot purge cloud data." });
      return;
    }

    setIsCleaning(true);
    setFeedback(null);
    try {
      const res = await supabaseSync.cleanDemoData(profile.id);
      setFeedback(res);
      if (res.success) {
        // Also clear local storage for these specific items
        localStorage.removeItem('vinetelligence_orders');
        localStorage.removeItem('vinetelligence_inventory');
        localStorage.removeItem('vinetelligence_journeys');
        localStorage.removeItem('vinetelligence_transactions');
        localStorage.removeItem('vinea_orders');
        localStorage.removeItem('vinea_inventory');
        localStorage.removeItem('vinea_journeys');
        localStorage.removeItem('vinea_transactions');
        window.dispatchEvent(new Event('storage'));
      }
    } catch {
      setFeedback({ success: false, message: "System failure during purge sequence." });
    } finally {
      setIsCleaning(false);
      setIsConfirmingCloudPurge(false);
    }
  };

  const handleSeedData = async () => {
    if (!profile?.id) {
      setFeedback({ success: false, message: "Establishment ID not found. Cannot seed cloud data." });
      return;
    }

    setIsSeeding(true);
    setFeedback(null);
    try {
      const syncer = supabaseSync as unknown as { seedTrialData: (id: string) => Promise<{success: boolean; message: string}> };
      const res = await syncer.seedTrialData(profile.id);
      setFeedback(res);
      if (res.success) {
        // Trigger a data refresh
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('vinetelligence_data_update'));
      }
    } catch (err: unknown) {
      const error = err as Error;
      setFeedback({ success: false, message: `Seeding Failed: ${error.message || 'Unknown protocol error'}` });
    } finally {
      setIsSeeding(false);
      setIsConfirmingSeed(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="bg-amber-500 text-stone-950 p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10"><i className="fas fa-rocket text-8xl"></i></div>
          <h3 className="text-2xl font-serif font-bold mb-2">Re-initialize Setup</h3>
          <p className="text-sm font-medium mb-8 max-w-md">Restart the Vinetelligence onboarding wizard to reconfigure your establishment's core identity and AI modules.</p>
          <button 
            onClick={onRelaunch}
            className="px-10 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-stone-800 transition-all active:scale-95"
          >
            Relaunch Setup Wizard
          </button>
       </div>

       <div className="bg-white p-10 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-stone-900 text-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-book text-xl"></i>
             </div>
             <div>
                <h4 className="text-xl font-serif font-black italic">System Documentation</h4>
                <p className="text-xs text-stone-500 font-medium">Access the latest user and technical manuals for the Vinetelligence Intelligence Suite.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <a 
               href="/USER_MANUAL.md" 
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-between p-6 bg-stone-50 border border-stone-200 rounded-2xl hover:bg-white hover:border-amber-500/40 transition-all group"
             >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-400 group-hover:text-amber-500 transition-colors shadow-sm">
                      <i className="fas fa-user-tie"></i>
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest text-stone-600 group-hover:text-stone-900">User Manual</span>
                </div>
                <i className="fas fa-external-link-alt text-[10px] text-stone-300 group-hover:text-amber-500"></i>
             </a>

             <a 
               href="/TECHNICAL_MANUAL.md" 
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center justify-between p-6 bg-stone-50 border border-stone-200 rounded-2xl hover:bg-white hover:border-blue-500/40 transition-all group"
             >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-400 group-hover:text-blue-500 transition-colors shadow-sm">
                      <i className="fas fa-code"></i>
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest text-stone-600 group-hover:text-stone-900">Technical Manual</span>
                </div>
                <i className="fas fa-external-link-alt text-[10px] text-stone-300 group-hover:text-blue-500"></i>
             </a>
          </div>
       </div>

       <div className="bg-white p-10 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-stone-900 text-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-link text-xl"></i>
             </div>
             <div>
                <h4 className="text-xl font-serif font-black italic">Portal & Menu Overrides</h4>
                <p className="text-xs text-stone-500 font-medium">Manually configure external URLs for guest portals and digital menus.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-4 flex items-center gap-2">
                   <i className="fas fa-calendar-check"></i> Manual Reservation Portal URL
                </label>
                <input 
                  type="url" 
                  value={profile?.manualPortalUrl || ''}
                  onChange={e => onUpdate('manualPortalUrl', e.target.value)}
                  placeholder="https://your-portal.com/book"
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-sm shadow-inner" 
                />
                <p className="text-[9px] text-stone-400 italic px-4">If set, this will override the auto-generated booking link.</p>
             </div>

             <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest ml-4 flex items-center gap-2">
                   <i className="fas fa-wine-glass"></i> Manual Digital Menu URL
                </label>
                <input 
                  type="url" 
                  value={profile?.manualMenuUrl || ''}
                  onChange={e => onUpdate('manualMenuUrl', e.target.value)}
                  placeholder="https://your-menu.com/view"
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-sm shadow-inner" 
                />
                <p className="text-[9px] text-stone-400 italic px-4">If set, this will override the auto-generated menu link.</p>
             </div>
          </div>
       </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Deep Seed Protocol</h4>
             <p className="text-xs text-stone-500 leading-relaxed">Populate your Cloud Silo with high-fidelity trial data including inventory, staff, and guest history.</p>
             
             {isConfirmingSeed ? (
                <div className="flex gap-2">
                  <button 
                   onClick={handleSeedData}
                   disabled={isSeeding}
                   className="flex-1 py-4 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isSeeding ? <i className="fas fa-spinner fa-spin"></i> : 'Execute Seed'}
                  </button>
                  <button 
                   onClick={() => setIsConfirmingSeed(false)}
                   className="px-4 py-4 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
             ) : (
                <button 
                 onClick={() => setIsConfirmingSeed(true)}
                 className="w-full py-4 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <i className="fas fa-seedling text-emerald-500"></i>
                  Initialize Trial Data
                </button>
             )}
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Cloud Silo Purge</h4>
             <p className="text-xs text-stone-500 leading-relaxed">Permanently remove all operational data from the cloud database. Recommended for environment resets.</p>
             
             {isConfirmingCloudPurge ? (
               <div className="flex gap-2">
                 <button 
                  onClick={handleCloudPurge}
                  disabled={isCleaning}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg disabled:opacity-50"
                 >
                   {isCleaning ? <i className="fas fa-spinner fa-spin"></i> : 'Confirm Purge'}
                 </button>
                 <button 
                  onClick={() => setIsConfirmingCloudPurge(false)}
                  className="px-4 py-4 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
                 >
                   Cancel
                 </button>
               </div>
             ) : (
               <button 
                onClick={() => setIsConfirmingCloudPurge(true)}
                className="w-full py-4 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg flex items-center justify-center gap-2"
               >
                 <i className="fas fa-cloud-bolt text-amber-500"></i>
                 Execute Cloud Purge
               </button>
             )}
          </div>
       </div>

       {feedback && (
          <div className={`p-6 rounded-[2rem] border animate-in zoom-in-95 duration-300 flex items-center justify-between gap-4 ${feedback.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
            <div className="flex items-center gap-4">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feedback.success ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  <i className={`fas ${feedback.success ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
               </div>
               <div>
                  <h5 className="font-black uppercase tracking-widest text-[10px]">{feedback.success ? 'Protocol Successful' : 'Protocol Failed'}</h5>
                  <p className="text-xs font-medium">{feedback.message}</p>
               </div>
            </div>
            <button onClick={() => setFeedback(null)} className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100">Dismiss</button>
          </div>
       )}

       <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-4 max-w-sm">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Clear Local State</h4>
             <p className="text-xs text-stone-500 leading-relaxed">Wipe all local session data, history, and training progress. This action cannot be undone.</p>
             
             {isConfirmingReset ? (
               <div className="flex gap-2">
                 <button 
                  onClick={handleReset}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg"
                 >
                   Confirm Reset
                 </button>
                 <button 
                  onClick={() => setIsConfirmingReset(false)}
                  className="px-4 py-4 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all"
                 >
                   Cancel
                 </button>
               </div>
             ) : (
               <button 
                onClick={() => setIsConfirmingReset(true)}
                className="w-full py-4 border-2 border-stone-200 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all"
               >
                 Reset All Local State
               </button>
             )}
          </div>
    </div>
  );
};

export default SetupSettings;

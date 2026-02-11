
import React from 'react';

interface SetupSettingsProps {
  onRelaunch: () => void;
}

const SetupSettings: React.FC<SetupSettingsProps> = ({ onRelaunch }) => {
  const handleReset = () => {
    if (confirm("Purge all establishment data? This action is permanent.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="bg-amber-500 text-stone-950 p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10"><i className="fas fa-rocket text-8xl"></i></div>
          <h3 className="text-2xl font-serif font-bold mb-2">Re-initialize Setup</h3>
          <p className="text-sm font-medium mb-8 max-w-md">Restart the Vinea onboarding wizard to reconfigure your establishment's core identity and AI modules.</p>
          <button 
            onClick={onRelaunch}
            className="px-10 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-stone-800 transition-all active:scale-95"
          >
            Relaunch Setup Wizard
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Clear Data Store</h4>
             <p className="text-xs text-stone-500 leading-relaxed">Wipe all local session data, history, and training progress. This action cannot be undone.</p>
             <button 
              onClick={handleReset}
              className="w-full py-4 border-2 border-red-200 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
             >
               Reset All Local State
             </button>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Export Intelligence</h4>
             <p className="text-xs text-stone-500 leading-relaxed">Download your custom recipes, staff roster, and inventory par history as a JSON archive.</p>
             <button className="w-full py-4 bg-stone-100 text-stone-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all">
               Generate System Export
             </button>
          </div>
       </div>
    </div>
  );
};

export default SetupSettings;

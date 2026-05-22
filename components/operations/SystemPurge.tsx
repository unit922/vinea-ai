import React from 'react';
import { AppView } from '../../lib/types';

interface SystemPurgeProps {
  isCleaning: boolean;
  cleanFeedback: { success: boolean; message: string } | null;
  showPurgeConfirm: boolean;
  setShowPurgeConfirm: (show: boolean) => void;
  handlePurge: () => void;
  setActiveView: (view: AppView) => void;
}

const SystemPurge: React.FC<SystemPurgeProps> = ({
  isCleaning,
  cleanFeedback,
  showPurgeConfirm,
  setShowPurgeConfirm,
  handlePurge,
  setActiveView
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 p-6">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 border border-stone-200 shadow-2xl space-y-10 text-center">
        <div className="w-24 h-24 bg-stone-900 text-amber-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl rotate-3">
          <i className="fas fa-broom-ball text-4xl"></i>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-3xl font-serif font-black italic text-stone-900">Operational Purge Protocol</h3>
          <p className="text-stone-500 text-sm leading-relaxed max-w-md mx-auto">
            Initialize a deep clean of the Cloud Silo. This will permanently remove all operational demo data including orders, inventory, guest journeys, and equipment telemetry.
          </p>
        </div>

        <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 text-left space-y-3">
          <div className="flex items-center gap-3 text-amber-700">
            <i className="fas fa-triangle-exclamation"></i>
            <span className="text-[10px] font-black uppercase tracking-widest">Warning: Irreversible Action</span>
          </div>
          <p className="text-xs text-amber-900/70 font-medium leading-relaxed">
            This action cannot be undone. Ensure all critical data has been archived before executing the purge sequence.
          </p>
        </div>

        {cleanFeedback && (
          <div className={`p-4 rounded-2xl text-xs font-bold animate-in fade-in slide-in-from-top-2 ${cleanFeedback.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
            {cleanFeedback.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => setShowPurgeConfirm(true)}
            disabled={isCleaning}
            className="flex-1 py-5 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-xl hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isCleaning ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-can text-amber-500"></i>}
            Execute Purge
          </button>
          <button 
            onClick={() => setActiveView(AppView.DASHBOARD)}
            className="flex-1 py-5 bg-stone-100 text-stone-600 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] hover:bg-stone-200 transition-all"
          >
            Return to Dashboard
          </button>
        </div>

        {showPurgeConfirm && (
          <div className="fixed inset-0 z-[700] bg-stone-950/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 shadow-2xl border border-stone-200">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                <i className="fas fa-triangle-exclamation text-3xl"></i>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black italic text-stone-900">Confirm Purge?</h3>
                <p className="text-stone-500 text-xs leading-relaxed italic">
                  This will delete all demo data from the cloud. This action is irreversible.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={handlePurge}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95"
                >
                  Confirm Operational Purge
                </button>
                <button onClick={() => setShowPurgeConfirm(false)} className="py-2 text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemPurge;

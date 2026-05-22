import React from 'react';
import { EquipmentStatus } from '../../lib/types';

interface FacilityHealthProps {
  equipment: EquipmentStatus[];
  isAssetsLoading: boolean;
  isAnalyzingMaintenance: boolean;
  handleMaintenanceAudit: () => void;
  maintenanceBrief: string | { riskSummary: string } | null;
  setMaintenanceBrief: (brief: string | { riskSummary: string } | null) => void;
}

const FacilityHealth: React.FC<FacilityHealthProps> = ({
  equipment,
  isAssetsLoading,
  isAnalyzingMaintenance,
  handleMaintenanceAudit,
  maintenanceBrief,
  setMaintenanceBrief
}) => {
  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 italic">Core Asset Monitoring</h3>
                <p className="text-[9px] font-bold text-stone-300 uppercase">Real-time Cloud Sync Operational</p>
              </div>
              <button onClick={handleMaintenanceAudit} disabled={isAnalyzingMaintenance || equipment.length === 0} className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-800 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                {isAnalyzingMaintenance ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microchip text-amber-500"></i>}
                Predictive Audit
              </button>
            </div>

            {isAssetsLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-stone-300 gap-4">
                <i className="fas fa-satellite-dish fa-spin text-4xl"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">Querying Facility Silo...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {equipment.map(item => (
                  <div key={item.id} className="p-6 bg-stone-50 border border-stone-100 rounded-3xl space-y-4 hover:border-amber-500 transition-all group shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black text-stone-900 group-hover:text-amber-600 transition-colors">{item.name}</p>
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">{item.type}</p>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                        item.status === 'Optimal' ? 'bg-emerald-50 text-emerald-600' : item.status === 'Warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                      }`}>{item.status}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between text-[8px] font-black text-stone-400 uppercase mb-1"><span>Health Index</span><span>{item.healthScore}%</span></div>
                        <div className="h-1 w-full bg-stone-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${item.healthScore > 80 ? 'bg-emerald-500' : item.healthScore > 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${item.healthScore}%` }}></div>
                        </div>
                      </div>
                    </div>
                    {item.telemetry && (
                      <div className="pt-2 flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
                        {Object.entries(item.telemetry).map(([key, val]) => (
                          <div key={key} className="bg-white px-2 py-1 rounded-lg border border-stone-100 flex flex-col items-center min-w-[50px] shrink-0">
                            <span className="text-[7px] font-black text-stone-400 uppercase">{key}</span>
                            <span className="text-[9px] font-black text-stone-900">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-1/3 space-y-6">
          {maintenanceBrief && (
            <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-right-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-shield-virus text-8xl text-amber-500"></i></div>
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 italic">Predictive Analysis</h4>
              <p className="text-sm font-bold leading-relaxed italic mb-8">"{maintenanceBrief.riskSummary || maintenanceBrief}"</p>
              <button onClick={() => setMaintenanceBrief(null)} className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-white transition-all">Acknowledge</button>
            </div>
          )}
          
          {!maintenanceBrief && (
            <div className="p-8 bg-stone-100 rounded-[2.5rem] border border-stone-200 flex flex-col items-center justify-center text-center space-y-4 opacity-40 grayscale min-h-[200px]">
              <i className="fas fa-solar-panel text-5xl text-stone-300"></i>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Launch Diagnostics to retrieve operational telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityHealth;

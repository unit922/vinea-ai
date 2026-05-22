import React from 'react';
import { GuestJourney, ServiceOrder, AppView, SubscriptionTier } from '../../lib/types';
import { useVinetelligenceStore } from '../../store/vinetelligenceStore';

interface GuestJourneysProps {
  journeys: GuestJourney[];
  orders: ServiceOrder[];
  setActiveView: (view: AppView) => void;
}

const GuestJourneys: React.FC<GuestJourneysProps> = ({ journeys, orders, setActiveView }) => {
  const activeJourneys = journeys.filter(j => j.status !== 'Completed');
  const store = useVinetelligenceStore();
  const isOperator = store.restaurantProfile?.tier === SubscriptionTier.OPERATOR || !store.restaurantProfile?.tier;

  return (
    <div className="min-h-full p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-serif font-black italic text-stone-900">Guest Journey</h2>
          <p className="text-stone-500 text-[10px] sm:text-xs font-medium uppercase tracking-widest">{isOperator ? 'Real-time Pacing' : 'AI-Driven Pacing & Service Insights'}</p>
        </div>
        <button 
          onClick={() => setActiveView(AppView.CONCIERGE)}
          className="w-full sm:w-auto px-6 py-4 sm:py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <i className="fas fa-concierge-bell"></i>
          Concierge Hub
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeJourneys.length === 0 ? (
            <div className="p-12 bg-stone-50 rounded-[3rem] border border-dashed border-stone-200 text-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <i className="fas fa-users text-stone-300 text-2xl"></i>
              </div>
              <p className="text-stone-400 text-xs font-medium italic">No active guest journeys found in the system.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeJourneys.map(journey => {
                const tableOrders = orders.filter(o => o.tableNumber === journey.tableNumber);
                const isBrisk = journey.pacingMode === 'Brisk';
                const isLeisurely = journey.pacingMode === 'Leisurely';
                
                return (
                  <div key={journey.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-md transition-all space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-lg font-serif font-black italic text-stone-900">{journey.profile.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-500 rounded-md text-[8px] font-black uppercase tracking-widest">Table {journey.tableNumber}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            isBrisk ? 'bg-amber-100 text-amber-600' : isLeisurely ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {journey.pacingMode} Pacing
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-stone-400 uppercase">Stage</p>
                        <p className="text-xs font-black text-stone-900 italic">{journey.currentStage}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase text-stone-400">
                        <span>Experience Progress</span>
                        <span>{journey.status === 'Completed' ? 'Total Experience' : `${Math.round(journey.satisfactionScore || 50)}% Satisfaction`}</span>
                      </div>
                      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            (journey.satisfactionScore || 50) > 80 ? 'bg-emerald-500' : (journey.satisfactionScore || 50) > 60 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} 
                          style={{ width: `${journey.status === 'Completed' ? 100 : (journey.satisfactionScore || 50)}%` }}
                        ></div>
                      </div>
                    </div>

                    {journey.feedback && (
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex text-[8px] text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <i key={i} className={`fas fa-star ${i < (journey.rating || 0) ? 'text-amber-500' : 'text-stone-200'}`}></i>
                            ))}
                          </div>
                          <span className="text-[8px] font-black uppercase text-stone-400">Feedback</span>
                        </div>
                        <p className="text-[10px] text-stone-600 italic leading-relaxed">"{journey.feedback}"</p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-50 flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {tableOrders.slice(0, 3).map((o, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-stone-900 border-2 border-white flex items-center justify-center text-[8px] text-amber-500 font-bold">
                            {o.items.length}
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-stone-400 italic">{tableOrders.length} Rounds Fired</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isOperator && (
          <div className="space-y-6">
            <div className="bg-stone-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-6">
              <h3 className="text-xl font-serif font-black italic text-amber-500">Service Insights</h3>
              <div className="space-y-4">
                {activeJourneys.length > 0 ? (
                  <>
                    {activeJourneys.some(j => j.pacingMode === 'Brisk') && (
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                        <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Pacing Alert</p>
                        <p className="text-xs text-stone-300 leading-relaxed italic">
                          "Table {activeJourneys.find(j => j.pacingMode === 'Brisk')?.tableNumber} is on high-velocity pacing. Ensure rapid prep response for upcoming course nodes."
                        </p>
                      </div>
                    )}
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                      <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Satisfaction Peak</p>
                      <p className="text-xs text-stone-300 leading-relaxed italic">"Guest '{activeJourneys[0].profile.name}' satisfaction is optimal. Current flow recommends maintaining current engagement pacing."</p>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center opacity-30">
                    <i className="fas fa-brain text-4xl mb-4"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Active Nodes</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestJourneys;

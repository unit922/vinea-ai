import React from 'react';
import { AppView, RestaurantProfile } from '../../lib/types';

interface OperationsOverviewProps {
  isDemo: boolean;
  setActiveView: (view: AppView) => void;
  restaurantProfile: RestaurantProfile | null;
  setRestaurantProfile: (profile: RestaurantProfile) => void;
  setIsPublicRoute: (isPublic: boolean) => void;
  setPublicView: (view: 'book' | 'menu' | null) => void;
}

const OperationsOverview: React.FC<OperationsOverviewProps> = ({ 
  isDemo, 
  setActiveView, 
  restaurantProfile, 
  setRestaurantProfile, 
  setIsPublicRoute, 
  setPublicView 
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-500">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] p-12 border border-stone-200 shadow-2xl space-y-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-amber-500 text-stone-900 rounded-[2rem] flex items-center justify-center shadow-xl rotate-3">
            <i className="fas fa-microchip text-3xl"></i>
          </div>
          <div>
            <h3 className="text-4xl font-serif font-black italic text-stone-900 tracking-tighter">{isDemo ? 'Operational Demo Control' : 'Operational Control'}</h3>
            <p className="text-stone-500 text-sm font-medium italic">{isDemo ? 'Active Simulation:' : 'Active Node:'} <span className="text-amber-600 font-bold">{isDemo ? 'Oenovía Local Sandbox' : 'Oenovía Production Silo'}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <i className="fas fa-users-viewfinder text-2xl text-stone-400"></i>
              <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Active</span>
            </div>
            <h4 className="text-xl font-serif font-black italic">Guest Traffic</h4>
            <p className="text-[10px] text-stone-500 leading-relaxed font-medium">Simulated guest arrivals and journey telemetry are currently active in the cloud silo.</p>
            <div className="pt-4">
              <button onClick={() => setActiveView(AppView.CONCIERGE)} className="w-full py-3 bg-stone-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg active:scale-95">Manage Concierge</button>
            </div>
          </div>

          <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <i className="fas fa-shaker text-2xl text-stone-400"></i>
              <span className="bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Pending</span>
            </div>
            <h4 className="text-xl font-serif font-black italic">Bar Station</h4>
            <p className="text-[10px] text-stone-500 leading-relaxed font-medium">Order flow from visitor menus and staff terminals is synchronized in real-time.</p>
            <div className="pt-4">
              <button onClick={() => setActiveView(AppView.BAR_STATION)} className="w-full py-3 bg-stone-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg active:scale-95">Open Bar Station</button>
            </div>
          </div>

          <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <i className="fas fa-box-open text-2xl text-stone-400"></i>
              <span className="bg-rose-500/10 text-rose-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Low Stock</span>
            </div>
            <h4 className="text-xl font-serif font-black italic">Inventory</h4>
            <p className="text-[10px] text-stone-500 leading-relaxed font-medium">AI-driven stock monitoring and automated replenishment cycles are operational.</p>
            <div className="pt-4">
              <button onClick={() => setActiveView(AppView.INVENTORY)} className="w-full py-3 bg-stone-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg active:scale-95">Check Inventory</button>
            </div>
          </div>
        </div>

        <div className="p-8 bg-stone-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-2xl font-serif font-black italic text-amber-500">Switch to Guest Mode</h4>
            <p className="text-stone-400 text-[10px] font-medium leading-relaxed max-w-xs">Experience the application from the perspective of a visitor at the establishment.</p>
          </div>
          <button 
            onClick={() => {
              if (restaurantProfile) {
                const updated = { ...restaurantProfile, demoMode: 'guest' as const };
                setRestaurantProfile(updated);
                localStorage.setItem('intelligence_profile', JSON.stringify(updated));
                setIsPublicRoute(true);
                setPublicView('menu');
              }
            }}
            className="px-10 py-5 bg-amber-500 text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-amber-400 transition-all active:scale-95 whitespace-nowrap"
          >
            Launch Guest Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperationsOverview;

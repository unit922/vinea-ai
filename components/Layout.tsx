
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenTutorial: () => void;
  onLogout?: () => void;
  userSession?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, searchQuery, onSearchChange, onOpenTutorial, onLogout, userSession }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tier, setTier] = useState<string>('Standard');
  const [performance, setPerformance] = useState({ latency: 42, throughput: 98 });
  
  const [alerts, setAlerts] = useState({
    orders: 0,
    lowStock: false,
    academyTasks: 0,
    upcomingGuests: 0,
    opsAlert: false
  });

  useEffect(() => {
    const profile = localStorage.getItem('vinea_profile');
    if (profile) {
      try {
        const p = JSON.parse(profile);
        const tierMap: any = {
          'demo': 'Explorer',
          'free': 'Operator',
          'paid': 'Visionary',
          'enterprise': 'Enterprise'
        };
        setTier(tierMap[p.edition] || 'Standard');
      } catch (e) {
        setTier('Standard');
      }
    }

    const syncAlerts = () => {
      const orders = JSON.parse(localStorage.getItem('vinea_orders') || '[]');
      const activeOrders = orders.filter((o: any) => o.status === 'Pending' || o.status === 'Prepping').length;

      const inventory = JSON.parse(localStorage.getItem('vinea_inventory') || '[]');
      const lowStock = inventory.some((i: any) => i.stock <= i.minStock);

      const staff = JSON.parse(localStorage.getItem('vinea_staff_list') || '[]');
      const modulesCount = staff.reduce((acc: number, s: any) => acc + (s.assignedModules?.filter((m: any) => !m.completed).length || 0), 0);

      const journeys = JSON.parse(localStorage.getItem('vinea_journeys') || '[]');
      const arrivals = journeys.filter((j: any) => j.status === 'Confirmed' || j.status === 'Engagement Sent').length;

      setAlerts({
        orders: activeOrders,
        lowStock: lowStock,
        academyTasks: modulesCount,
        upcomingGuests: arrivals,
        opsAlert: Math.random() > 0.8 
      });

      setPerformance({
        latency: Math.floor(35 + Math.random() * 15),
        throughput: Math.floor(95 + Math.random() * 5)
      });
    };

    syncAlerts();
    window.addEventListener('storage', syncAlerts);
    const interval = setInterval(syncAlerts, 5000);
    
    return () => {
      window.removeEventListener('storage', syncAlerts);
      clearInterval(interval);
    };
  }, []);

  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-line', alert: false },
    { id: AppView.BAR_STATION, label: 'Bar Station', icon: 'fa-shaker', badge: alerts.orders > 0 ? alerts.orders : undefined },
    { id: AppView.INVENTORY, label: 'AI Inventory', icon: 'fa-box-open', dot: alerts.lowStock ? 'bg-rose-500' : undefined },
    { id: AppView.TRAINING, label: 'Academy', icon: 'fa-brain-circuit', badge: alerts.academyTasks > 0 ? alerts.academyTasks : undefined },
    { id: AppView.CONCIERGE, label: 'Guest Journey', icon: 'fa-concierge-bell', badge: alerts.upcomingGuests > 0 ? alerts.upcomingGuests : undefined },
    { id: AppView.STAFFING, label: 'AI Operations', icon: 'fa-gears', dot: alerts.opsAlert ? 'bg-amber-500' : undefined },
    { id: AppView.ESTABLISHMENT_ADMIN, label: 'Venue Admin', icon: 'fa-user-gear' },
    { id: AppView.SETTINGS, label: 'Settings', icon: 'fa-cog' },
  ];

  const displayName = userSession?.user?.user_metadata?.full_name || userSession?.user?.email?.split('@')[0] || 'Operator';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 flex overflow-hidden font-sans bg-stone-950 select-none">
      <aside className={`${isSidebarOpen ? 'w-60' : 'w-20'} bg-stone-900 text-white transition-all duration-300 flex flex-col z-50 border-r border-white/5 shrink-0 h-full shadow-2xl relative`}>
        <div className="p-4 flex items-center justify-between shrink-0 h-16 border-b border-white/5">
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-tight text-amber-500 leading-none">VINEA</span>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-500 mt-0.5">{tier} Admin</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="w-10 h-10 flex items-center justify-center hover:text-amber-500 transition-colors rounded-lg hover:bg-white/5"
          >
            <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-bars'} text-lg`}></i>
          </button>
        </div>

        <nav className="flex-1 mt-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center py-3.5 px-6 transition-all relative group ${
                activeView === item.id 
                  ? 'bg-amber-600/10 border-r-4 border-amber-500 text-amber-500 font-bold' 
                  : 'hover:bg-white/5 text-stone-500 hover:text-stone-300'
              }`}
            >
              <div className="w-8 flex justify-center relative">
                <i className={`fas ${item.icon || 'fa-circle'} text-base`}></i>
                {!isSidebarOpen && item.dot && (
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${item.dot} animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]`}></span>
                )}
                {!isSidebarOpen && item.badge && (
                  <span className="absolute -top-2 -right-3 min-w-[14px] h-[14px] flex items-center justify-center bg-amber-500 text-stone-900 text-[8px] font-black rounded-full border border-stone-900">
                    {item.badge}
                  </span>
                )}
              </div>
              {isSidebarOpen && (
                <div className="ml-3 flex-1 flex items-center justify-between overflow-hidden">
                  <span className="font-semibold text-xs tracking-wide truncate">{item.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-amber-500 text-stone-900 text-[9px] font-black rounded-lg shadow-lg shadow-amber-500/20">
                        {item.badge}
                      </span>
                    )}
                    {item.dot && (
                      <span className={`w-1.5 h-1.5 rounded-full ${item.dot} animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]`}></span>
                    )}
                  </div>
                </div>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-stone-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-[60]">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-800 border border-white/5 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0 shadow-lg relative">
              {initial}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-stone-900"></div>
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate text-stone-200">{displayName}</p>
                <button onClick={onLogout} className="text-[9px] font-black uppercase text-stone-500 hover:text-amber-500 transition-colors">Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0 h-full bg-white">
        <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 z-40 px-8 flex justify-between items-center shrink-0 h-16">
          <div className="flex items-center gap-4 truncate">
            <div className="w-1.5 h-6 rounded-full bg-amber-500 shrink-0"></div>
            <h1 className="text-sm font-black text-stone-900 uppercase tracking-widest truncate">
              {activeView.replace('-', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 bg-stone-50 rounded-full border border-stone-200">
               <div className="flex items-center gap-2 border-r border-stone-200 pr-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-tighter">AI: {performance.latency}ms</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-tighter">Velocity: {performance.throughput}%</span>
                  <div className="w-12 h-1 bg-stone-200 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${performance.throughput}%` }}></div>
                  </div>
               </div>
            </div>
            
            <div className="relative group">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-[10px]"></i>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..." 
                className="pl-10 pr-6 py-2.5 bg-stone-100 rounded-2xl text-[11px] font-bold focus:outline-none w-32 transition-all focus:w-64 border border-transparent focus:border-stone-200 focus:bg-white"
              />
            </div>
            <button 
              onClick={onOpenTutorial} 
              className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center border border-transparent hover:border-amber-100"
              title="Tutorial"
            >
              <i className="fas fa-question text-xs"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col h-full overflow-hidden p-8">
            <div className="flex-1 flex flex-col h-full max-w-[1700px] mx-auto w-full relative">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;

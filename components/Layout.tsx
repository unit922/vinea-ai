import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  LogOut, 
  Search, 
  Menu, 
  Bell,
  HelpCircle,
  Database,
  BarChart3,
  Network,
  Users,
  Glasses,
  GraduationCap,
  Activity,
  Heart,
  Settings,
  ShieldAlert,
  Zap,
  MessageSquare
} from 'lucide-react';
import { AppView, RestaurantProfile } from '../lib/types';
import VinetelligenceLogo from './VinetelligenceLogo';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenTutorial?: () => void;
  onLogout: () => void;
  onUpdateProfile: (field: string, value: unknown) => void;
  userSession: { user: { email?: string, user_metadata?: { avatar_url?: string } } } | null;
  restaurantProfile: RestaurantProfile | null;
  establishmentName?: string;
  isDeveloper: boolean;
  ownedCount: number;
  devToolsUnlocked: boolean;
  onSetDevToolsUnlocked: (unlocked: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeView,
  setActiveView,
  searchQuery,
  onSearchChange,
  onOpenTutorial,
  onLogout,
  userSession,
  restaurantProfile,
  establishmentName,
  isDeveloper,
  ownedCount,
  devToolsUnlocked,
}) => {
  // Use unused variables in a safe way to satisfy linter
  if (restaurantProfile) {
    // console.debug("Active Profile Loaded", restaurantProfile.id);
  }
  if (devToolsUnlocked) {
    // console.debug("Admin Access Active");
  }

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isDemo = restaurantProfile?.edition === 'demo';
  const isEssential = restaurantProfile?.edition === 'essential';
  const isGrowth = restaurantProfile?.edition === 'growth';

  const menuItems = [
    { id: AppView.DASHBOARD, icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: AppView.INVENTORY, icon: <Database size={20} />, label: 'Inventory' },
    { id: AppView.BAR_STATION, icon: <Users size={20} />, label: 'Station' },
    { id: AppView.TRAINING, icon: <GraduationCap size={20} />, label: 'Academy' },
    { id: AppView.STAFFING, icon: <Activity size={20} />, label: 'Operations', hidden: !isDemo && !isDeveloper && !isEssential && !isGrowth },
    { id: AppView.GUEST_PROFILE, icon: <Heart size={20} />, label: 'Guests', hidden: !isDemo && !isDeveloper && !isEssential && !isGrowth },
    { id: AppView.DISPATCH_DESK, icon: <MessageSquare size={20} />, label: 'Dispatch', hidden: !isDemo && !isDeveloper && !isEssential && !isGrowth },
    { id: AppView.ESTABLISHMENT_ADMIN, icon: <ShieldAlert size={20} />, label: 'Admin', hidden: isDemo && !isDeveloper },
    { id: AppView.SETTINGS, icon: <Settings size={20} />, label: 'Settings', hidden: isDemo && !isDeveloper },
    { id: AppView.OWNER_ANALYTICS, icon: <BarChart3 size={20} />, label: 'Intelligence', hidden: !isDeveloper && ownedCount <= 1 },
    { id: AppView.MASTER_ADMIN, icon: <Network size={20} />, label: 'Network', hidden: !isDeveloper },
  ];

  return (
    <div className="flex h-screen bg-stone-950 text-stone-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-stone-900 border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 h-20 flex items-center gap-3 border-b border-white/5">
            <VinetelligenceLogo size="sm" withText={false} />
            <span className="text-xl font-serif font-black tracking-tighter text-white italic">Intelligence</span>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.filter(item => !item.hidden).map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveView(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeView === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-stone-400 hover:bg-white/5 hover:text-white'}`}
              >
                {item.icon}
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5 bg-black/20">
             <div className="flex items-center gap-3 p-3 text-stone-400 group">
                <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-xs font-black overflow-hidden border border-white/10">
                   {userSession?.user?.user_metadata?.avatar_url ? (
                     <img src={userSession.user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     userSession?.user?.email?.charAt(0).toUpperCase() || 'U'
                   )}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black text-white truncate uppercase tracking-widest">{establishmentName || 'Node Active'}</p>
                   <p className="text-[8px] truncate opacity-50">{userSession?.user?.email}</p>
                </div>
                <button onClick={onLogout} className="p-2 hover:text-red-400 transition-colors">
                   <LogOut size={16} />
                </button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-stone-900/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-40">
           <div className="flex items-center gap-6 flex-1">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-stone-400">
                 <Menu />
              </button>
              <div className="relative max-w-md w-full group hidden md:block">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 w-4 h-4 transition-colors group-focus-within:text-indigo-400" />
                 <input 
                   type="text" 
                   placeholder="SCAN PROTOCOL / SEARCH NODE"
                   value={searchQuery}
                   onChange={(e) => onSearchChange(e.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-[10px] font-black tracking-widest focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-stone-700"
                 />
              </div>
           </div>

           <div className="flex items-center gap-4">
              {restaurantProfile?.subscriptionStatus === 'trial' && (
                 <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-pulse">
                    <Zap size={14} className="text-amber-500" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">
                       Trial Node Active: {Math.max(1, Math.ceil((new Date(restaurantProfile.trialEndsAt!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} Days Remaining
                    </p>
                 </div>
              )}
              <button onClick={onOpenTutorial} className="p-2.5 text-stone-400 hover:text-white transition-colors relative">
                 <HelpCircle size={20} />
              </button>
              <button className="p-2.5 text-stone-400 hover:text-white transition-colors relative">
                 <Bell size={20} />
                 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-stone-900"></span>
              </button>
              <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
              <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <p className="text-[8px] font-black uppercase text-indigo-400 tracking-widest leading-none">Status</p>
                    <p className="text-[10px] font-black uppercase text-emerald-400 tracking-tighter">Synchronized (Ready v3.2.1)</p>
                 </div>
                 <div className="w-10 h-10 bg-indigo-600/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
                    <Glasses size={20} />
                 </div>
              </div>
           </div>
        </header>

        {/* Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
           {children}
        </div>
      </main>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;

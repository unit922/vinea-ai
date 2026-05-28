
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppView, RestaurantProfile, ServiceOrder, InventoryItem, StaffShift, GuestJourney } from '../lib/types';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { getBrandedTerm } from '../utils/branding';
import TermsOfService from './modals/TermsOfService';
import UpgradeFlow from './modals/UpgradeFlow';
import VinetelligenceLogo from './VinetelligenceLogo';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenTutorial: () => void;
  onLogout?: () => void;
  onUpdateProfile?: (key: keyof RestaurantProfile, value: string | number | boolean | null) => void;
  isDeveloper?: boolean;
  ownedCount?: number;
  devToolsUnlocked?: boolean;
  onSetDevToolsUnlocked?: (val: boolean) => void;
  establishmentName?: string;
  restaurantProfile?: RestaurantProfile | null;
  userSession?: {
    user?: {
      email?: string;
      email_verified?: boolean;
      user_metadata?: {
        full_name?: string;
      };
    };
  } | null;
}

// Added MenuItem interface to resolve object literal property errors
interface MenuItem {
  id: AppView;
  label: string;
  icon: string;
  color?: string;
  badge?: number;
  dot?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeView, 
  setActiveView, 
  searchQuery, 
  onSearchChange, 
  onOpenTutorial, 
  onLogout, 
  onUpdateProfile,
  userSession, 
  establishmentName,
  restaurantProfile,
  isDeveloper = false,
  ownedCount = 0,
  devToolsUnlocked = false,
  onSetDevToolsUnlocked
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024;
    }
    return false;
  }); 
  const [tier] = useState<string>(() => {
    try {
      const p = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
      const tierMap: Record<string, string> = {
        'demo': 'Explorer (Demo)',
        'paid': 'Architect',
        'enterprise': 'Enterprise'
      };
      return tierMap[p.edition] || 'Standard';
    } catch {
      return 'Standard';
    }
  });
  const [performance, setPerformance] = useState({ latency: 42, throughput: 98 });
  const [devClicks, setDevClicks] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const serviceAlerts = useVinetelligenceStore(state => state.serviceAlerts);
  const setServiceAlerts = useVinetelligenceStore(state => state.setServiceAlerts);
  const authMode = useVinetelligenceStore(state => state.authMode);

  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }, [currentTime]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    });
  }, [currentTime]);
  
  const trialDaysRemaining = useMemo(() => {
    if (restaurantProfile?.subscriptionStatus !== 'trial' || !restaurantProfile?.trialEndsAt) return null;
    const end = new Date(restaurantProfile.trialEndsAt).getTime();
    const now = new Date().getTime();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [restaurantProfile]);

  const isTrialExpired = useMemo(() => {
    if (restaurantProfile?.subscriptionStatus !== 'trial' || !restaurantProfile?.trialEndsAt) return false;
    return new Date(restaurantProfile.trialEndsAt).getTime() < new Date().getTime();
  }, [restaurantProfile]);

  const isVerificationRequired = useMemo(() => {
    return authMode === 'secure' && 
           restaurantProfile?.edition !== 'demo' && 
           userSession?.user?.email && 
           !userSession.user.email_verified && 
           !isDeveloper;
  }, [authMode, restaurantProfile, userSession, isDeveloper]);

  const [alerts, setAlerts] = useState({
    orders: 0,
    lowStock: false,
    academyTasks: 0,
    upcomingGuests: 0,
    opsAlert: false
  });

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showStartingTrialNotice, setShowStartingTrialNotice] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const [density, setDensity] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vinetelligence_interface_density') || 'standard';
    }
    return 'standard';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sizeMap: Record<string, string> = {
        'comfortable': '16px',
        'standard': '14.5px',
        'compact': '13.0px',
        'micro': '11.5px'
      };
      const size = sizeMap[density] || '14.5px';
      document.documentElement.style.setProperty('--root-font-size', size);
      localStorage.setItem('vinetelligence_interface_density', density);
    }
  }, [density]);

  // Startup Trial Reminder
  useEffect(() => {
    if (restaurantProfile?.subscriptionStatus === 'trial' && trialDaysRemaining !== null) {
      // Small delay after load to catch user's attention
      const timer = setTimeout(() => {
        setShowStartingTrialNotice(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [restaurantProfile?.subscriptionStatus, trialDaysRemaining]);

  const handleUpgrade = async (planId: string = 'operator') => {
    setIsUpgrading(true);
    setIsUpgradeOpen(false);
    try {
      // In a real app, this would redirect to a checkout page
      // Here we'll simulate the successful upgrade flow
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          email: userSession?.user?.email || restaurantProfile?.ownerEmail,
          trial: false // Explicitly no trial for upgrades
        }),
      });

      const session = await response.json();
      if (session.url) {
        window.location.href = session.url;
      } else {
        // Fallback for demo: simulation
        setTimeout(() => {
          if (onUpdateProfile) {
            onUpdateProfile('subscriptionStatus', 'active');
            onUpdateProfile('trialEndsAt', null);
            onUpdateProfile('edition', planId);
            setNotification(`Intelligence Upgrade Complete: ${planId.toUpperCase()} Tier Activated.`);
            setIsUpgrading(false);
          }
        }, 2000);
      }
    } catch (error: unknown) {
      console.error("Upgrade Error:", error);
      const message = error instanceof Error ? error.message : String(error);
      alert("Neural Link Interrupted: " + message);
      setIsUpgrading(false);
    }
  };

  useEffect(() => {
    // Check for payment success in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && onUpdateProfile) {
      const plan = params.get('plan');
      onUpdateProfile('subscriptionStatus', 'active');
      onUpdateProfile('trialEndsAt', null);
      if (plan) onUpdateProfile('edition', plan);
      
      // Clean up URL
      window.history.replaceState({}, document.title, "/");
      
      const msg = "Neural Protocol Synchronized: Subscription Active.";
      setTimeout(() => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 5000);
      }, 100);
    }
  }, [onUpdateProfile, setNotification]);

  useEffect(() => {
    const syncAlerts = () => {
      const ordersStr = localStorage.getItem('vinetelligence_orders') || localStorage.getItem('vinea_orders') || '[]';
      const orders = JSON.parse(ordersStr);
      const activeOrders = orders.filter((o: ServiceOrder) => o.status === 'Pending' || o.status === 'Prepping').length;

      const inventoryStr = localStorage.getItem('vinetelligence_inventory') || localStorage.getItem('vinea_inventory') || '[]';
      const inventory = JSON.parse(inventoryStr);
      const lowStock = inventory.some((i: InventoryItem) => i.stock <= i.minStock);

      const staffStr = localStorage.getItem('vinetelligence_staff_list') || localStorage.getItem('vinea_staff_list') || '[]';
      const staff = JSON.parse(staffStr);
      const modulesCount = staff.reduce((acc: number, s: StaffShift) => acc + (s.assignedModules?.filter((m) => !m.completed).length || 0), 0);

      const journeysStr = localStorage.getItem('vinetelligence_journeys') || localStorage.getItem('vinea_journeys') || '[]';
      const journeys = JSON.parse(journeysStr);
      const arrivals = journeys.filter((j: GuestJourney) => j.status === 'Confirmed' || j.status === 'Engagement Sent').length;

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

  const handleLogoClick = () => {
    if (!isDeveloper) return;
    
    const newCount = devClicks + 1;
    setDevClicks(newCount);
    
    if (newCount >= 5 && onSetDevToolsUnlocked) {
      onSetDevToolsUnlocked(true);
      setDevClicks(0);
      setNotification("Neural Overdrive: Advanced Deployment Tools Synchronized.");
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const canAccess = useVinetelligenceStore(state => state.canAccess);
  
  // Vinetelligence Intelligence Access Control
  const canSeeIntelligence = useMemo(() => {
    const userRole = userSession?.user?.user_metadata?.role;
    const userEmail = userSession?.user?.email || '';
    const isVinetelligenceStaff = userEmail.endsWith('@vinetelligence.live') || userEmail.endsWith('@vinea.live') || userRole === 'Developer';
    const isEnterpriseOwner = (userRole === 'Owner' || userRole === 'Investor') && ownedCount > 1;
    return isVinetelligenceStaff || isEnterpriseOwner;
  }, [userSession?.user?.user_metadata?.role, userSession?.user?.email, ownedCount]);

  // Applied MenuItem interface to useMemo return type to fix property errors
  const menuItems = useMemo<MenuItem[]>(() => {
    const userRole = userSession?.user?.user_metadata?.role;
    const isAdmin = ['Owner', 'Manager', 'Developer', 'Investor'].includes(userRole || '');
    const isDemoOperator = restaurantProfile?.edition === 'demo' && restaurantProfile?.demoMode !== 'guest';
    const isDemoGuest = restaurantProfile?.edition === 'demo' && restaurantProfile?.demoMode === 'guest';

    const items: MenuItem[] = [];

    const allViews: MenuItem[] = [
      { id: AppView.DASHBOARD, label: getBrandedTerm('dashboard', restaurantProfile || undefined), icon: 'fa-chart-line' },
      { id: AppView.OWNER_ANALYTICS, label: getBrandedTerm('intelligence_node', restaurantProfile || undefined), icon: 'fa-globe', color: 'text-blue-500' },
      { id: AppView.RETENTION, label: getBrandedTerm('retention_ai', restaurantProfile || undefined), icon: 'fa-users-gear', color: 'text-indigo-500' },
      { id: AppView.FINANCIAL_HUB, label: getBrandedTerm('financial_hub', restaurantProfile || undefined), icon: 'fa-vault', color: 'text-emerald-500' },
      { id: AppView.BAR_STATION, label: getBrandedTerm('sentinel', restaurantProfile || undefined), icon: 'fa-shaker', badge: alerts.orders > 0 ? alerts.orders : undefined },
      { id: AppView.INVENTORY, label: getBrandedTerm('inventory', restaurantProfile || undefined), icon: 'fa-box-open', dot: alerts.lowStock ? 'bg-indigo-500' : undefined },
      { id: AppView.SUPPLY_CHAIN, label: getBrandedTerm('predictive_supply', restaurantProfile || undefined), icon: 'fa-truck-fast', color: 'text-indigo-500' },
      { id: AppView.SUSTAINABILITY, label: getBrandedTerm('sustainability', restaurantProfile || undefined), icon: 'fa-leaf', color: 'text-emerald-500' },
      { id: AppView.REVENUE_OPTIMIZER, label: getBrandedTerm('neural_yield', restaurantProfile || undefined), icon: 'fa-chart-line-up', color: 'text-indigo-500' },
      { id: AppView.SENTIMENT, label: getBrandedTerm('sentiment_pulse', restaurantProfile || undefined), icon: 'fa-tower-broadcast', color: 'text-indigo-600' },
      { id: AppView.EXPERIENCE_SENTINEL, label: getBrandedTerm('exp_sentinel', restaurantProfile || undefined), icon: 'fa-user-shield', color: 'text-blue-500' },
      { id: AppView.COMPETITORS, label: getBrandedTerm('market_sentinel', restaurantProfile || undefined), icon: 'fa-microscope', color: 'text-indigo-600' },
      { id: AppView.TRAINING, label: getBrandedTerm('scholar_node', restaurantProfile || undefined), icon: 'fa-brain-circuit', badge: alerts.academyTasks > 0 ? alerts.academyTasks : undefined },
      { id: AppView.CONCIERGE, label: getBrandedTerm('guest_journey', restaurantProfile || undefined), icon: 'fa-concierge-bell', badge: alerts.upcomingGuests > 0 ? alerts.upcomingGuests : undefined },
      { id: AppView.STAFFING, label: getBrandedTerm('operations', restaurantProfile || undefined), icon: 'fa-gears', dot: alerts.opsAlert ? 'bg-indigo-500' : undefined },
      { id: AppView.FACILITY_ASSETS, label: getBrandedTerm('facility_assets', restaurantProfile || undefined), icon: 'fa-server' },
      { id: AppView.DISPATCH, label: getBrandedTerm('dispatch', restaurantProfile || undefined), icon: 'fa-comments', color: 'text-orange-500' },
      { id: AppView.INTEGRATION_HUB, label: getBrandedTerm('integration_hub', restaurantProfile || undefined), icon: 'fa-box-open', color: 'text-purple-400' },
      { id: AppView.TREND_INTELLIGENCE, label: getBrandedTerm('trend_intelligence', restaurantProfile || undefined), icon: 'fa-arrow-trend-up', color: 'text-cyan-400' },
    ];

    allViews.forEach(view => {
      const isVisible = (isAdmin || isDemoOperator) || (!isDemoGuest && [AppView.BAR_STATION, AppView.CONCIERGE].includes(view.id));
      
      if (isVisible) {
        // Special case for Intelligence which is further gated by staff/enterprise
        if (view.id === AppView.OWNER_ANALYTICS && !canSeeIntelligence) return;
        
        items.push(view);
      }
    });

    return items;
  }, [alerts, userSession?.user?.user_metadata?.role, restaurantProfile, canSeeIntelligence]);

  // Applied MenuItem interface to useMemo return type to fix property errors
  const secondaryItems = useMemo<MenuItem[]>(() => {
    const userRole = userSession?.user?.user_metadata?.role;
    const isAdmin = ['Owner', 'Manager', 'Developer', 'Investor'].includes(userRole || '');
    
    const items: MenuItem[] = [];

    if (isAdmin) {
      items.push({ id: AppView.ESTABLISHMENT_ADMIN, label: getBrandedTerm('venue_admin', restaurantProfile || undefined), icon: 'fa-user-gear' });
    }
    
    const isInvestor = userRole === 'Investor';

    if (isInvestor || (isDeveloper && devToolsUnlocked)) {
      items.push({ 
        id: AppView.GLOBAL_LEDGER, 
        label: isInvestor ? 'Investor Platform' : 'Global Ledger', 
        icon: 'fa-vault', 
        color: 'text-blue-400' 
      });
      
      if (isDeveloper && devToolsUnlocked) {
        items.push({ id: AppView.NETWORK_ADMIN, label: 'Global SaaS', icon: 'fa-network-wired', color: 'text-blue-400' });
      }
    }

    if (isAdmin) {
      items.push({ id: AppView.SETTINGS, label: getBrandedTerm('settings', restaurantProfile || undefined), icon: 'fa-cog' });
    }
    return items;
  }, [isDeveloper, devToolsUnlocked, userSession?.user?.user_metadata?.role, restaurantProfile]);

  const displayName = userSession?.user?.user_metadata?.full_name || userSession?.user?.email?.split('@')[0] || 'Operator';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 flex font-sans bg-stone-950 overflow-hidden touch-scrolling">
      {/* Startup Trial Notice */}
      {showStartingTrialNotice && (
        <div className="fixed inset-0 z-[5000] bg-stone-950/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white max-w-sm w-full rounded-[2.5rem] shadow-2xl border border-stone-200 p-10 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-indigo-600 text-stone-950 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <i className="fas fa-rocket text-2xl"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-black italic">Vinetelligence Trial Active</h3>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">
                Your 14-day operational sandbox is currently online. You have <span className="text-indigo-600 font-bold">{trialDaysRemaining} days</span> remaining to explore the full intelligence suite.
              </p>
            </div>
            <div className="w-full space-y-3 pt-2">
              <button 
                onClick={() => {
                  setShowStartingTrialNotice(false);
                  setIsUpgradeOpen(true);
                }}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl"
              >
                Upgrade Now
              </button>
              <button 
                onClick={() => setShowStartingTrialNotice(false)}
                className="w-full py-4 bg-stone-50 text-stone-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-stone-900 transition-all"
              >
                Continue Trial Environment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trial Banner */}
      {trialDaysRemaining !== null && !isTrialExpired && !restaurantProfile?.recordingMode && (
        <div className="fixed top-0 left-0 right-0 z-[1000] bg-stone-900 text-white px-4 py-2.5 flex items-center justify-center gap-4 shadow-lg border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-3 rounded-full ${i < (14 - (trialDaysRemaining || 0)) ? 'bg-indigo-600' : 'bg-white/10'}`}
                ></div>
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest ml-2">
              {trialDaysRemaining === 0 ? 'Trial Expires Today' : `Facility Trial: ${trialDaysRemaining} days remaining`}
            </span>
          </div>
          <div className="h-4 w-px bg-white/20 hidden sm:block"></div>
          <p className="text-[9px] font-bold italic hidden lg:block text-stone-400">
            Professional Tier Trial Active. Full intelligence nodes will desync in {trialDaysRemaining} days.
          </p>
          <button 
            onClick={() => setIsUpgradeOpen(true)}
            disabled={isUpgrading}
            className="px-6 py-1.5 bg-indigo-600 text-stone-950 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-xl flex items-center gap-2 active:scale-95"
          >
            {isUpgrading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt text-[10px]"></i>}
            Full Authorization
          </button>
        </div>
      )}

      {/* Global Notification */}
      {notification && (
        <div className="fixed top-8 right-8 z-[1000] animate-in slide-in-from-right-8 duration-500">
          <div className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl border border-blue-400 backdrop-blur-xl flex items-center gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20">
              <i className="fas fa-bolt text-xs"></i>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest italic">{notification}</span>
          </div>
        </div>
      )}

      {/* Presentation Watermark */}
      {restaurantProfile?.recordingMode && (
        <div className="fixed bottom-12 right-12 z-[9999] opacity-40 flex items-center gap-3 pointer-events-none select-none animate-pulse">
          <div className="w-10 h-10 bg-stone-900 flex items-center justify-center rounded-xl border border-white/10 shadow-2xl">
            <VinetelligenceLogo size="sm" withText={false} accentColor="#4f46e5" />
          </div>
          <div className="text-right">
            <div className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Neural Intelligence</div>
            <div className="text-[10px] font-serif font-black italic text-indigo-500">Live Demonstration</div>
          </div>
        </div>
      )}
      {/* Desktop/Tablet Sidebar */}
      <aside className={`hidden md:flex ${isSidebarOpen ? 'w-64' : 'w-20'} bg-stone-900 text-white transition-all duration-300 flex-col z-50 border-r border-white/5 shrink-0 h-full shadow-2xl relative ${trialDaysRemaining !== null ? 'pt-10' : ''}`}>
        <div className="p-4 flex items-center justify-between shrink-0 h-16 border-b border-white/5">
          {isSidebarOpen && (
            <div 
              className={`flex cursor-pointer transition-all ${devClicks > 0 ? 'scale-105' : ''}`}
              onClick={handleLogoClick}
            >
              <VinetelligenceLogo size="sm" withText={false} accentColor={devToolsUnlocked ? '#60a5fa' : '#4f46e5'} />
              <div className="flex flex-col justify-center ml-2">
                <span className={`font-serif text-xl font-bold tracking-tight leading-none ${devToolsUnlocked ? 'text-blue-400' : 'text-indigo-600'}`}>VINETELLIGENCE</span>
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-stone-500 mt-0.5">{isDeveloper ? 'ROOT ADMIN' : `${tier} Admin`}</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="w-10 h-10 flex items-center justify-center hover:text-indigo-600 transition-colors rounded-lg hover:bg-white/5"
          >
            <i className={`fas ${isSidebarOpen ? 'fa-angle-left' : 'fa-bars'} text-lg`}></i>
          </button>
        </div>

        {isSidebarOpen && establishmentName && (
          <div className="px-6 py-4 border-b border-white/5 bg-white/5">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600/60">Establishment</p>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[7px] font-black text-stone-500 uppercase tracking-widest">Synced</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-white truncate font-serif italic">{establishmentName}</h2>
              {ownedCount > 1 && (
                <button 
                  onClick={() => setIsUpgradeOpen(true)} // Temporarily using this to trigger "More Info" or we can create a specific view
                  className="text-[8px] font-black uppercase text-indigo-600/60 hover:text-indigo-600 transition-all tracking-[0.2em] text-left flex items-center gap-1.5"
                >
                  <i className="fas fa-arrows-rotate text-[7px]"></i>
                  Switch Establishments ({ownedCount})
                </button>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 mt-2 overflow-y-auto custom-scrollbar">
          {[...menuItems, ...secondaryItems].map((item) => {
            const allowed = canAccess(item.id);
            return (
              <button
                key={item.id}
                onClick={() => allowed ? setActiveView(item.id) : setIsUpgradeOpen(true)}
                className={`w-full flex items-center py-4 px-6 transition-all relative group ${
                  activeView === item.id 
                    ? 'bg-indigo-700/10 border-r-4 border-indigo-600 text-indigo-600 font-bold' 
                    : `hover:bg-white/5 text-stone-500 hover:text-stone-300 ${!allowed ? 'opacity-60 grayscale-[0.3]' : ''}`
                }`}
              >
                <div className="w-8 flex justify-center relative">
                  <i className={`fas ${item.icon || 'fa-circle'} text-base ${item.color && activeView !== item.id ? item.color : ''}`}></i>
                  {!isSidebarOpen && item.dot && allowed && (
                    <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${item.dot} animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]`}></span>
                  )}
                  {!isSidebarOpen && !allowed && (
                    <i className="fas fa-lock absolute -top-1.5 -right-1.5 text-[8px] text-indigo-600/50"></i>
                  )}
                  {!isSidebarOpen && item.badge && allowed && (
                    <span className="absolute -top-2 -right-3 min-w-[14px] h-[14px] flex items-center justify-center bg-indigo-600 text-stone-900 text-[8px] font-black rounded-full border border-stone-900">
                      {item.badge}
                    </span>
                  )}
                </div>
                {isSidebarOpen && (
                  <div className="ml-3 flex-1 flex items-center justify-between overflow-hidden">
                    <span className="font-semibold text-xs tracking-wide truncate">{item.label}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {!allowed && (
                        <span className="text-[7px] font-black uppercase tracking-widest text-indigo-600/50 flex items-center gap-1 bg-indigo-600/10 px-1.5 py-0.5 rounded-full border border-indigo-600/20">
                          <i className="fas fa-lock text-[6px]"></i>
                          Lock
                        </span>
                      )}
                      {item.badge && allowed && (
                        <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-indigo-600 text-stone-900 text-[9px] font-black rounded-lg shadow-lg shadow-indigo-600/20">
                          {item.badge}
                        </span>
                      )}
                      {item.dot && allowed && (
                        <span className={`w-1.5 h-1.5 rounded-full ${item.dot} animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]`}></span>
                      )}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
          <div className="flex flex-col gap-4">
            {isSidebarOpen && !restaurantProfile?.recordingMode && (
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setIsTermsOpen(true)}
                  className="text-[8px] font-mono font-black text-stone-600 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
                >
                  Legal Protocols
                </button>
                {!isDeveloper && (
                  <button 
                    onClick={() => setIsUpgradeOpen(true)}
                    className="text-[8px] font-mono font-black text-indigo-600/60 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
                  >
                    Forge New Tier
                  </button>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-800 border border-white/5 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 shadow-lg relative">
                {initial}
                {isDeveloper && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-stone-900 flex items-center justify-center"><i className="fas fa-check text-[6px] text-white"></i></div>}
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate text-stone-200">{displayName}</p>
                  <button onClick={onLogout} className="text-[9px] font-black uppercase text-stone-500 hover:text-indigo-600 transition-colors">Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col relative min-w-0 bg-white mb-20 md:mb-0 ${trialDaysRemaining !== null ? 'pt-12 md:pt-10' : ''} safe-bottom`}>
        {/* Service Alerts Banner */}
        {serviceAlerts.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-4 space-y-2 pointer-events-none">
            {serviceAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 ${
                  alert.severity === 'critical' 
                    ? 'bg-indigo-700 border-indigo-600 text-white' 
                    : 'bg-indigo-600 border-indigo-500 text-indigo-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${alert.severity === 'critical' ? 'bg-indigo-600' : 'bg-indigo-500'}`}>
                    <i className={`fas ${alert.type === 'payment' ? 'fa-credit-card' : 'fa-clock'} animate-pulse`}></i>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-tight">{alert.message}</p>
                </div>
                <button 
                  onClick={() => setServiceAlerts(serviceAlerts.filter(a => a.id !== alert.id))}
                  className="w-6 h-6 rounded-lg hover:bg-black/10 flex items-center justify-center transition-colors shrink-0"
                >
                  <i className="fas fa-times text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>
        )}
        <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 z-40 px-4 md:px-8 flex justify-between items-center shrink-0 h-14 md:h-16">
          <div className="flex items-center gap-3 md:gap-4 truncate">
            <div className="w-1.5 h-5 md:h-6 rounded-full bg-indigo-600 shrink-0"></div>
            <h1 className="text-[10px] md:text-sm font-black text-stone-900 uppercase tracking-widest truncate">
              {activeView.replace('-', ' ')}
            </h1>
            {isDeveloper && (
              <span className={`hidden sm:inline ${devToolsUnlocked ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-stone-100 text-stone-700 border-stone-200'} text-[7px] md:text-[8px] font-black uppercase px-2 py-0.5 rounded-full border transition-all`}>
                {devToolsUnlocked ? 'Network Root' : 'Observer'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {!restaurantProfile?.recordingMode && (
              <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 bg-stone-50 rounded-full border border-stone-200">
                <div className="flex items-center gap-2 border-r border-stone-200 pr-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-tighter">AI: {performance.latency}ms</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-tighter">Velocity: {performance.throughput}%</span>
                    <div className="w-12 h-1 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${performance.throughput}%` }}></div>
                    </div>
                </div>
              </div>
            )}
            
            {/* Real-time Day & Time Display */}
            <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 bg-indigo-50/50 rounded-full border border-indigo-100 text-indigo-950 shrink-0 shadow-sm">
              <span className="hidden md:flex items-center text-[9px] md:text-[10px] font-bold uppercase tracking-wider gap-1 border-r border-indigo-200/60 pr-2 md:pr-2.5">
                <i className="fas fa-calendar-alt text-indigo-600"></i>
                {formattedDate}
              </span>
              <span className="flex items-center text-[9px] md:text-[10px] font-mono font-bold text-indigo-700 tracking-tighter gap-1">
                <i className="fas fa-clock text-indigo-500 animate-pulse"></i>
                {formattedTime}
              </span>
            </div>

            {/* Interface Density & Resolution Controls */}
            <div className="hidden lg:flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 shrink-0 shadow-sm">
              <span className="text-[8px] font-black uppercase text-stone-400 tracking-wider px-2.5">Layout</span>
              {(['comfortable', 'standard', 'compact', 'micro'] as const).map((level) => {
                const labels: Record<string, string> = {
                  comfortable: 'Cozy',
                  standard: 'Std',
                  compact: 'Comp',
                  micro: 'Micro'
                };
                const scaleSizes: Record<string, string> = {
                  comfortable: 'text-[11px]',
                  standard: 'text-[9px]',
                  compact: 'text-[7px]',
                  micro: 'text-[5px]'
                };
                return (
                  <button
                    key={level}
                    onClick={() => setDensity(level)}
                    title={`Set display density to ${labels[level]}`}
                    className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      density === level
                        ? 'bg-white text-indigo-600 shadow-sm border border-stone-200/50 scale-[1.02]'
                        : 'text-stone-400 hover:text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className={`${scaleSizes[level]} font-black leading-none text-indigo-500`}>A</span>
                    <span>{labels[level]}</span>
                  </button>
                );
              })}
            </div>
            
            <div className="relative group hidden sm:block">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-[10px]"></i>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..." 
                className="pl-10 pr-6 py-2 bg-stone-100 rounded-2xl text-[11px] font-bold focus:outline-none w-24 md:w-32 transition-all focus:w-48 md:focus:w-64 border border-transparent focus:border-stone-200 focus:bg-white"
              />
            </div>
            <button 
              onClick={onOpenTutorial} 
              className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-stone-100 text-stone-400 hover:text-indigo-700 hover:bg-indigo-50 transition-all flex items-center justify-center border border-transparent hover:border-indigo-100"
            >
              <i className="fas fa-question text-[10px] md:text-xs"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar pb-32 md:pb-0">
          <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-8">
            <div className="flex-1 flex flex-col max-w-[1700px] mx-auto w-full relative touch-scrolling">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile/Tablet Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-stone-900 border-t border-white/5 z-[2000] flex justify-around items-center px-4 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {menuItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveView(item.id);
              setIsMobileMoreOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-1.5 min-w-[60px] transition-all ${
              activeView === item.id ? 'text-indigo-600 scale-105' : 'text-stone-500'
            }`}
          >
            <div className="relative">
              <i className={`fas ${item.icon} text-lg`}></i>
              {item.badge && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-stone-900">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[7px] font-black uppercase tracking-widest truncate max-w-[50px]">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
          className={`flex flex-col items-center justify-center gap-1.5 min-w-[60px] transition-all ${
            isMobileMoreOpen ? 'text-indigo-600 scale-105' : 'text-stone-500'
          }`}
        >
          <div className="relative">
            <i className={`fas ${isMobileMoreOpen ? 'fa-times' : 'fa-grid-2'} text-lg`}></i>
            {([...menuItems.slice(4), ...secondaryItems].some(i => i.badge || i.dot)) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-600 rounded-full border border-stone-900 animate-pulse"></span>
            )}
          </div>
          <span className="text-[7px] font-black uppercase tracking-widest">{isMobileMoreOpen ? 'Close' : 'More'}</span>
        </button>
      </nav>

      {/* Mobile More Overlay */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMoreOpen(false)}
              className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-[1500] md:hidden"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-20 left-0 right-0 bg-stone-900 border-t border-white/10 rounded-t-[2.5rem] z-[1501] md:hidden overflow-hidden"
            >
              <div className="p-8 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">Facility Expandable Nodes</h3>
                  <div className="w-10 h-1 bg-stone-800 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {[...menuItems.slice(4), ...secondaryItems].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setIsMobileMoreOpen(false);
                      }}
                      className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all space-y-3 ${
                        activeView === item.id 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                          : 'bg-white/5 border-white/5 text-stone-400 opacity-80'
                      }`}
                    >
                      <div className="relative">
                        <i className={`fas ${item.icon} text-xl`}></i>
                        {item.badge && (
                          <span className={`absolute -top-2 -right-3 min-w-[14px] h-[14px] flex items-center justify-center text-[8px] font-black rounded-full border ${
                            activeView === item.id ? 'bg-stone-950 text-white border-indigo-600' : 'bg-indigo-600 text-stone-900 border-stone-900'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.dot && (
                          <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${item.dot} animate-pulse`}></span>
                        )}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-center">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-800 border border-white/5 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                      {displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white leading-none mb-1">{displayName}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">{tier} Node</p>
                    </div>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="px-6 py-2 glass rounded-xl text-[8px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Email Verification Overlay */}
      {isVerificationRequired && (
        <div className="fixed inset-0 bg-stone-950/98 backdrop-blur-2xl z-[10000] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-10 animate-in fade-in zoom-in-95 duration-700">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="relative w-full h-full bg-stone-900 border border-indigo-500/30 rounded-[3rem] flex items-center justify-center text-indigo-500 shadow-2xl">
                <i className="fas fa-envelope-circle-check text-5xl"></i>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-serif font-black text-white italic tracking-tighter">Identity Verification</h2>
                <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.5em]">Protocol Enforcement Required</p>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed italic">
                Your Operational Node (<span className="text-white font-bold">{userSession?.user?.email}</span>) requires primary identity verification to access professional intelligence protocols.
              </p>
            </div>

            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl text-left space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0 mt-1">
                  <i className="fas fa-inbox text-[10px]"></i>
                </div>
                <p className="text-[10px] text-stone-300 font-medium leading-relaxed italic">
                  A verification link has been transmitted to your inbox. Please synchronize your identity to unlock facility management.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-[0_20px_40px_rgba(79,70,229,0.2)] active:scale-95"
              >
                I have verified - Synchronize
              </button>
              
              <button 
                onClick={onLogout}
                className="w-full py-4 text-stone-600 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Disconnect & Return
              </button>
            </div>

            <p className="text-[8px] text-stone-700 font-black uppercase tracking-[0.3em]">
              Identity verification is mandatory for all professional tier nodes.
            </p>
          </div>
        </div>
      )}

      {/* Trial Expired Overlay */}
      {isTrialExpired && (
        <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-indigo-500/20 rounded-[2.5rem] flex items-center justify-center text-indigo-500 mx-auto border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
              <i className="fas fa-hourglass-end text-4xl"></i>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white tracking-tighter italic">Trial Period Concluded</h2>
              <p className="text-stone-400 text-sm leading-relaxed">
                Your 14-day operational trial for <span className="text-indigo-500 font-bold">{establishmentName}</span> has expired. 
                To continue managing your establishment with Vinetelligence's full intelligence suite, please complete your subscription payment.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4">
              <button 
                onClick={() => setIsUpgradeOpen(true)}
                disabled={isUpgrading}
                className="w-full py-5 bg-indigo-500 text-stone-950 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white transition-all shadow-[0_20px_40px_rgba(99,102,241,0.2)] active:scale-95 flex items-center justify-center gap-3"
              >
                {isUpgrading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-credit-card"></i>}
                Pay & Continue Service
              </button>
              
              <button 
                onClick={onLogout}
                className="w-full py-4 bg-transparent text-stone-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Sign Out
              </button>
            </div>

            <div className="pt-8 border-t border-white/5">
              <p className="text-[9px] text-stone-600 font-black uppercase tracking-widest">
                All your data is securely preserved and will be available immediately upon upgrade.
              </p>
            </div>
          </div>
        </div>
      )}

      <TermsOfService 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
      />

      <UpgradeFlow 
        isOpen={isUpgradeOpen} 
        onClose={() => setIsUpgradeOpen(false)} 
        onUpgrade={handleUpgrade}
        currentEdition={restaurantProfile?.edition}
      />
    </div>
  );
};

export default Layout;

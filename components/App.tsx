
import React, { useState, useEffect } from 'react';
import { AppView, StaffShift, RestaurantProfile } from './types';
import Layout from './components/Layout';
import ManagerDashboard from './components/ManagerDashboard';
import Inventory from './components/Inventory';
import IntelligenceAcademy from './components/IntelligenceAcademy';
import Onboarding from './components/Onboarding';
import GuestProfileView from './components/GuestProfileView';
import OperationsView from './components/OperationsView';
import TutorialOverlay from './components/TutorialOverlay';
import ConciergeView from './components/ConciergeView';
import BarStationView from './components/BarStationView';
import AuthView from './components/AuthView';
import DevPortal from './components/DevPortal';
import MasterAdmin from './components/MasterAdmin';
import EstablishmentAdmin from './components/EstablishmentAdmin';
import GuestReservationPortal from './components/GuestReservationPortal';
import VisitorMenu from './components/VisitorMenu';
import FinancialHub from './components/FinancialHub';
import VisionAuditor from './components/VisionAuditor';
import { authService } from './services/authService';
import { INITIAL_INVENTORY } from './constants';

// Settings Sub-components
import GeneralSettings from './components/settings/GeneralSettings';
import AISettings from './components/settings/AISettings';
import ConnectivitySettings from './components/settings/ConnectivitySettings';
import SecuritySettings from './components/settings/SecuritySettings';
import SetupSettings from './components/settings/SetupSettings';

type SettingsTab = 'general' | 'ai' | 'connectivity' | 'security' | 'setup';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('general');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<'login' | 'signup' | null>(null);
  const [restaurantProfile, setRestaurantProfile] = useState<RestaurantProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<{ user: { email?: string; user_metadata?: { role?: string; full_name?: string } } } | null>(null);
  const [isPublicRoute, setIsPublicRoute] = useState(false);
  const [publicView, setPublicView] = useState<'book' | 'menu' | null>(null);
  const [publicRid, setPublicRid] = useState<string | null>(null);
  const [publicTable, setPublicTable] = useState<string | null>(null);
  
  const [currentUserRole, setCurrentUserRole] = useState<StaffShift['role']>('Manager');
  const [authMode, setAuthMode] = useState<'demo' | 'secure'>('demo');
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [showDevPortal, setShowDevPortal] = useState(false);
  const [devToolsUnlocked, setDevToolsUnlocked] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const rid = params.get('rid');
      const tableNum = params.get('table');

      if (view === 'book') {
        setIsPublicRoute(true);
        setPublicView('book');
        setPublicRid(rid);
        setIsReady(true);
        return;
      }

      if (view === 'menu') {
        setIsPublicRoute(true);
        setPublicView('menu');
        setPublicRid(rid);
        setPublicTable(tableNum);
        setIsReady(true);
        return;
      }

      try {
        const storedProfile = localStorage.getItem('vinea_profile');
        if (storedProfile) {
          const p = JSON.parse(storedProfile);
          setRestaurantProfile(p);
          const isDemo = p.edition === 'demo';
          setAuthMode(isDemo ? 'demo' : 'secure');
          
          if (!isDemo) {
            const currentSession = await authService.getSession();
            setSession(currentSession);
            if (!currentSession) {
              setShowAuth('login');
            } else {
              const email = currentSession.user.email || '';
              const isDev = email.endsWith('@vinea.live') || currentSession.user.user_metadata?.role === 'Developer';
              setIsDeveloper(isDev);
              if (isDev) setShowDevPortal(true);
            }
          }
        } else {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error("Vinea: Boot failed", err);
        setShowOnboarding(true);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();

    const unsubscribe = authService.onAuthChange((newSession) => {
      setSession(newSession);
      if (newSession) {
        setShowAuth(null);
        const email = newSession.user.email || '';
        // Fixed: Use newSession instead of undefined currentSession in this scope
        // Fix: Changed currentSession to newSession to fix ReferenceError
        const isDev = email.endsWith('@vinea.live') || newSession.user.user_metadata?.role === 'Developer';
        setIsDeveloper(isDev);
        if (isDev) setShowDevPortal(true);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isReady) return null;

  if (isPublicRoute) {
    if (publicView === 'book') {
      return (
        <GuestReservationPortal 
          rid={publicRid || undefined}
          onComplete={() => { window.location.search = ''; }} 
          isPublic 
        />
      );
    }
    
    if (publicView === 'menu') {
      const inventory = JSON.parse(localStorage.getItem('vinea_inventory') || JSON.stringify(INITIAL_INVENTORY));
      const orders = JSON.parse(localStorage.getItem('vinea_orders') || '[]');
      const tableNum = publicTable || 'Digital';
      const activeOrders = orders.filter((o: any) => o.tableNumber === tableNum);

      return (
        <VisitorMenu 
          table={{ id: 'pub-t', number: tableNum, capacity: 4, status: 'Occupied', x: 0, y: 0 }}
          inventory={inventory}
          activeOrders={activeOrders}
          onPlaceOrder={(items) => {
            const newOrder = {
              id: `ORD-PUB-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              tableNumber: tableNum,
              serverName: 'Guest (Web)',
              items,
              status: 'Pending',
              priority: 'Normal',
              source: 'Visitor'
            };
            const updated = [...orders, newOrder];
            localStorage.setItem('vinea_orders', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
          }}
          onExit={() => { window.location.search = ''; }}
        />
      );
    }
  }

  const handleOnboardingComplete = (profile: RestaurantProfile) => {
    setRestaurantProfile(profile);
    localStorage.setItem('vinea_profile', JSON.stringify(profile));
    localStorage.setItem('vinea_onboarded', 'true');
    
    if (profile.edition === 'demo') {
      setShowOnboarding(false);
      setAuthMode('demo');
    } else {
      setShowOnboarding(false);
      setShowAuth('signup');
    }
  };

  const updateProfileValue = (key: keyof RestaurantProfile, value: string | number | boolean | null) => {
    if (!restaurantProfile) return;
    const newProfile = { ...restaurantProfile, [key]: value };
    setRestaurantProfile(newProfile);
    localStorage.setItem('vinea_profile', JSON.stringify(newProfile));
  };

  const updateTier = (tierId: string) => {
    updateProfileValue('edition', tierId);
    window.location.reload(); 
  };

  const handleLogout = async () => {
    if (authMode === 'secure') {
      await authService.signOut();
    }
    
    localStorage.removeItem('vinea_profile');
    localStorage.removeItem('vinea_onboarded');
    localStorage.removeItem('vinea_tables');
    localStorage.removeItem('vinea_orders');
    localStorage.removeItem('vinea_draft_orders');
    localStorage.removeItem('vinea_inventory');
    localStorage.removeItem('vinea_staff_list');
    localStorage.removeItem('vinea_journeys');
    localStorage.removeItem('vinea_transactions');
    
    setSession(null);
    setRestaurantProfile(null);
    setAuthMode('demo');
    setIsDeveloper(false);
    setShowDevPortal(false);
    setDevToolsUnlocked(false);
    setShowAuth(null);
    setShowOnboarding(true);
    setActiveView(AppView.DASHBOARD);
  };

  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case 'general':
        return <GeneralSettings profile={restaurantProfile} onUpdate={updateProfileValue} />;
      case 'ai':
        return <AISettings profile={restaurantProfile} onUpdate={updateProfileValue} />;
      case 'connectivity':
        return <ConnectivitySettings profile={restaurantProfile} onUpdateTier={updateTier} onUpdateProfile={updateProfileValue} />;
      case 'security':
        return <SecuritySettings currentUserRole={currentUserRole} onUpdateRole={setCurrentUserRole} authMode={authMode} onUpdateAuthMode={setAuthMode} onLogout={handleLogout} userSession={session} />;
      case 'setup':
        return <SetupSettings onRelaunch={() => { setShowOnboarding(true); setShowAuth(null); }} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case AppView.DASHBOARD:
        return <ManagerDashboard searchQuery={searchQuery} />;
      case AppView.FINANCIAL_HUB:
        return <FinancialHub />;
      case AppView.INVENTORY:
        return <Inventory searchQuery={searchQuery} />;
      case AppView.VISION_AUDITOR:
        return <VisionAuditor onCommit={() => setActiveView(AppView.INVENTORY)} onClose={() => setActiveView(AppView.INVENTORY)} />;
      case AppView.TRAINING:
        return <IntelligenceAcademy searchQuery={searchQuery} userRole={currentUserRole} />;
      case AppView.GUEST_PROFILE:
        return <GuestProfileView />;
      case AppView.STAFFING:
        return <OperationsView setActiveView={setActiveView} />;
      case AppView.CONCIERGE:
        return <ConciergeView />;
      case AppView.BAR_STATION:
        return <BarStationView />;
      case AppView.ESTABLISHMENT_ADMIN:
        return <EstablishmentAdmin isDeveloper={isDeveloper} devToolsUnlocked={devToolsUnlocked} />;
      case AppView.NETWORK_ADMIN:
      case AppView.GLOBAL_LEDGER:
        return <MasterAdmin isDeveloper={isDeveloper} />;
      case AppView.SETTINGS:
        return (
          <div className="flex flex-col lg:flex-row gap-8 items-start h-full overflow-hidden">
            <div className="w-full lg:w-72 shrink-0 bg-white p-5 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible custom-scrollbar">
              {[
                { id: 'general', label: 'Establishment', icon: 'fa-building' },
                { id: 'ai', label: 'AI Intelligence', icon: 'fa-brain' },
                { id: 'connectivity', label: 'Connectivity', icon: 'fa-network-wired' },
                { id: 'security', label: 'Security & Roster', icon: 'fa-shield-halved' },
                { id: 'setup', label: 'Setup Recovery', icon: 'fa-hammer' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsTab(tab.id as SettingsTab)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-sm font-bold shrink-0 lg:shrink ${
                    activeSettingsTab === tab.id 
                      ? 'bg-stone-900 text-white shadow-xl' 
                      : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <i className={`fas ${tab.icon} w-5 text-center`}></i>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar pr-4 pb-20">
              {renderSettingsContent()}
            </div>
          </div>
        );
      default:
        return <ManagerDashboard searchQuery={searchQuery} />;
    }
  };

  const handleDevPortalSelect = (choice: 'demo' | 'investor' | 'developer') => {
    setShowDevPortal(false);
    if (choice === 'demo') {
      setAuthMode('demo');
      setActiveView(AppView.DASHBOARD);
    } else if (choice === 'investor') {
      setAuthMode('secure');
      setDevToolsUnlocked(true);
      setActiveView(AppView.GLOBAL_LEDGER);
    } else if (choice === 'developer') {
      setAuthMode('secure');
      setDevToolsUnlocked(true);
      setActiveView(AppView.ESTABLISHMENT_ADMIN);
    }
  };

  return (
    <>
      {showDevPortal && isDeveloper && (
        <DevPortal 
          userEmail={session?.user.email} 
          onSelect={handleDevPortalSelect} 
        />
      )}
      
      {showOnboarding && (
        <Onboarding 
          onComplete={handleOnboardingComplete} 
          onSelectAuth={(mode) => { setShowAuth(mode); setShowOnboarding(false); }}
        />
      )}
      
      {showAuth && !showOnboarding && (
        <AuthView 
          initialMode={showAuth}
          onSuccess={(newSession) => {
            setSession(newSession);
            setShowAuth(null);
            const email = newSession.user.email || '';
            // Fix: Changed currentSession to newSession to fix ReferenceError
            const isDev = email.endsWith('@vinea.live') || newSession.user.user_metadata?.role === 'Developer';
            setIsDeveloper(isDev);
          }} 
          onAbort={() => {
            setShowAuth(null);
            if (!restaurantProfile) setShowOnboarding(true);
          }}
        />
      )}
      
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
      
      <Layout 
        activeView={activeView} 
        setActiveView={setActiveView} 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery}
        onOpenTutorial={() => setShowTutorial(true)}
        onLogout={handleLogout}
        userSession={session}
        isDeveloper={isDeveloper}
        devToolsUnlocked={devToolsUnlocked}
        onSetDevToolsUnlocked={setDevToolsUnlocked}
      >
        {renderContent()}
      </Layout>
    </>
  );
};

export default App;

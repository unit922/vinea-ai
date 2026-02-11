
import React, { useState, useEffect } from 'react';
import { AppView, StaffShift } from './types';
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
import MasterAdmin from './components/MasterAdmin';
import EstablishmentAdmin from './components/EstablishmentAdmin';
import GuestReservationPortal from './components/GuestReservationPortal';
import { authService } from './services/authService';

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
  const [restaurantProfile, setRestaurantProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isPublicRoute, setIsPublicRoute] = useState(false);
  
  const [currentUserRole, setCurrentUserRole] = useState<StaffShift['role']>('Manager');
  const [authMode, setAuthMode] = useState<'demo' | 'secure'>('demo');

  useEffect(() => {
    const initializeApp = async () => {
      // Check for public view parameter
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'book') {
        setIsPublicRoute(true);
        setIsReady(true);
        return;
      }

      try {
        const storedProfile = localStorage.getItem('vinea_profile');
        if (storedProfile) {
          const p = JSON.parse(storedProfile);
          setRestaurantProfile(p);
          setAuthMode(p.edition === 'demo' ? 'demo' : 'secure');
          
          if (p.edition !== 'demo') {
            const currentSession = await authService.getSession();
            setSession(currentSession);
            if (!currentSession) setShowAuth('login');
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
      if (newSession) setShowAuth(null);
    });
    return () => unsubscribe();
  }, []);

  if (!isReady) return null;

  // Handle Public Guest View
  if (isPublicRoute) {
    return <GuestReservationPortal onComplete={() => window.location.href = '/'} isPublic />;
  }

  const handleOnboardingComplete = (profile: any) => {
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

  const updateProfileValue = (key: string, value: any) => {
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
    await authService.signOut();
    setSession(null);
    setShowAuth('login');
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
      case AppView.INVENTORY:
        return <Inventory searchQuery={searchQuery} />;
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
        return <EstablishmentAdmin />;
      case AppView.NETWORK_ADMIN:
        return <MasterAdmin />;
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

  return (
    <>
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
      >
        {renderContent()}
      </Layout>
    </>
  );
};

export default App;


import React, { useState } from 'react';
import { useVineaStore } from '../store/vineaStore';
import { useVineaActions } from '../hooks/useVineaActions';
import { AppView } from '../types';
import ManagerDashboard from './ManagerDashboard';
import Inventory from './Inventory';
import GuestProfileView from './GuestProfileView';
import OperationsView from './OperationsView';
import ConciergeView from './ConciergeView';
import BarStationView from './BarStationView';
import MasterAdmin from './MasterAdmin';
import EstablishmentAdmin from './EstablishmentAdmin';
import IntelligenceAcademy from './IntelligenceAcademy';
import FinancialHub from './FinancialHub';
import VisionAuditor from './VisionAuditor';
import FacilityAssets from './FacilityAssets';
import InvestorPortal from './InvestorPortal';
import { SocialPromo } from './SocialPromo';
import { RetentionIntelligence } from './RetentionIntelligence';
import { OwnerAnalytics } from './OwnerAnalytics';

// Settings Sub-components
import GeneralSettings from './settings/GeneralSettings';
import AISettings from './settings/AISettings';
import ConnectivitySettings from './settings/ConnectivitySettings';
import SecuritySettings from './settings/SecuritySettings';
import SetupSettings from './settings/SetupSettings';

type SettingsTab = 'general' | 'ai' | 'connectivity' | 'security' | 'setup';

interface ViewManagerProps {
  searchQuery: string;
  initialAcademyTab?: 'academy' | 'mixology' | 'signature' | 'roster' | 'pairing';
  setInitialAcademyTab: (tab: 'academy' | 'mixology' | 'signature' | 'roster' | 'pairing' | undefined) => void;
  setIsAIChatOpen: (open: boolean) => void;
  setIsPublicRoute: (isPublic: boolean) => void;
  setPublicView: (view: 'book' | 'menu' | 'promo' | null) => void;
  onRelaunchOnboarding: () => void;
}

const ViewManager: React.FC<ViewManagerProps> = ({
  searchQuery,
  initialAcademyTab,
  setInitialAcademyTab,
  setIsAIChatOpen,
  setIsPublicRoute,
  setPublicView,
  onRelaunchOnboarding
}) => {
  const store = useVineaStore();
  const { handleAddToMenu, handleRemoveFromMenu, updateProfileValue, handleLogout } = useVineaActions();
  const isAdmin = ['Owner', 'Manager', 'Developer', 'Investor'].includes(store.currentUserRole || '');
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('general');

  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case 'general':
        return <GeneralSettings profile={store.restaurantProfile} onUpdate={updateProfileValue} />;
      case 'ai':
        return <AISettings profile={store.restaurantProfile} onUpdate={updateProfileValue} />;
      case 'connectivity':
        return <ConnectivitySettings profile={store.restaurantProfile} onUpdateTier={(tier) => updateProfileValue('edition', tier)} onUpdateProfile={updateProfileValue} />;
      case 'security':
        return <SecuritySettings 
          currentUserRole={store.currentUserRole} 
          onUpdateRole={store.setCurrentUserRole} 
          authMode={store.authMode} 
          onUpdateAuthMode={store.setAuthMode} 
          onLogout={handleLogout} 
          userSession={store.session}
          restaurantId={store.restaurantProfile?.id}
        />;
      case 'setup':
        return <SetupSettings onRelaunch={onRelaunchOnboarding} profile={store.restaurantProfile} onUpdate={updateProfileValue} />;
      default:
        return null;
    }
  };

  switch (store.activeView) {
    case AppView.DASHBOARD:
      return (
        <ManagerDashboard 
          searchQuery={searchQuery} 
          inventory={store.inventory} 
          restaurantProfile={store.restaurantProfile} 
          orders={store.orders}
          transactions={store.transactions}
          authMode={store.authMode}
        />
      );
    case AppView.FINANCIAL_HUB:
      return (
        <FinancialHub 
          restaurantProfile={store.restaurantProfile} 
          inventory={store.inventory} 
          transactions={store.transactions}
          authMode={store.authMode}
        />
      );
    case AppView.INVENTORY:
      return (
        <Inventory 
          searchQuery={searchQuery} 
          userRole={store.currentUserRole} 
          inventory={store.inventory} 
          authMode={store.authMode}
        />
      );
    case AppView.VISION_AUDITOR:
      return <VisionAuditor onCommit={() => store.setActiveView(AppView.INVENTORY)} onClose={() => store.setActiveView(AppView.INVENTORY)} />;
    case AppView.TRAINING:
      return (
        <IntelligenceAcademy 
          searchQuery={searchQuery} 
          userRole={store.currentUserRole} 
          inventory={store.inventory}
          initialTab={initialAcademyTab}
          onAddToMenu={handleAddToMenu}
          onRemoveFromMenu={handleRemoveFromMenu}
        />
      );
    case AppView.GUEST_PROFILE:
      return <GuestProfileView journeys={store.journeys} setJourneys={store.setJourneys} />;
    case AppView.FACILITY_ASSETS:
      return <FacilityAssets restaurantId={store.restaurantProfile?.id || 'demo-id'} />;
    case AppView.RETENTION:
      return <RetentionIntelligence />;
    case AppView.OWNER_ANALYTICS:
      return <OwnerAnalytics onNavigateToInvestor={() => store.setActiveView(AppView.INVESTOR)} />;
    case AppView.INVESTOR:
      return (
        <InvestorPortal 
          profile={store.restaurantProfile} 
          inventory={store.inventory} 
          orders={store.orders} 
          transactions={store.transactions}
          onBack={() => store.setActiveView(AppView.DASHBOARD)} 
        />
      );
    case AppView.PROMO:
      return (
        <SocialPromo 
          profile={store.restaurantProfile!} 
          onBack={() => store.setActiveView(AppView.ESTABLISHMENT_ADMIN)}
          onUpdateProfile={updateProfileValue}
        />
      );
    case AppView.STAFFING:
      return (
        <OperationsView 
          setActiveView={store.setActiveView} 
          restaurantProfile={store.restaurantProfile}
          setRestaurantProfile={store.setRestaurantProfile}
          setIsPublicRoute={setIsPublicRoute}
          setPublicView={setPublicView}
          journeys={store.journeys}
          setJourneys={store.setJourneys}
          orders={store.orders}
          inventory={store.inventory}
          tables={store.tables}
          userRole={store.currentUserRole}
        />
      );
    case AppView.CONCIERGE:
      return (
        <ConciergeView 
          journeys={store.journeys} 
          setJourneys={store.setJourneys} 
          profile={store.restaurantProfile} 
          orders={store.orders} 
          tables={store.tables}
          setTables={store.setTables}
        />
      );
    case AppView.BAR_STATION:
      return (
        <BarStationView 
          setIsAIChatOpen={setIsAIChatOpen} 
          onNavigateToAcademy={(tab) => {
            setInitialAcademyTab(tab);
            store.setActiveView(AppView.TRAINING);
          }}
          orders={store.orders}
          inventory={store.inventory}
        />
      );
    case AppView.ESTABLISHMENT_ADMIN:
      return (
        <EstablishmentAdmin 
          isDeveloper={store.isDeveloper} 
          devToolsUnlocked={store.devToolsUnlocked} 
          restaurantProfile={store.restaurantProfile} 
          onUpdateProfile={updateProfileValue}
          onNavigateToInvestor={() => store.setActiveView(AppView.INVESTOR)}
          onNavigateToPromo={() => store.setActiveView(AppView.PROMO)}
        />
      );
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
    case AppView.NETWORK_ADMIN:
      return <MasterAdmin isDeveloper={store.isDeveloper} initialTab="nodes" mode="saas" />;
    case AppView.GLOBAL_LEDGER:
      return <MasterAdmin isDeveloper={store.isDeveloper} initialTab="ledger" mode="ledger" />;
    default:
      return isAdmin ? (
        <ManagerDashboard 
          searchQuery={searchQuery} 
          inventory={store.inventory} 
          restaurantProfile={store.restaurantProfile} 
          orders={store.orders}
          transactions={store.transactions}
          authMode={store.authMode}
        />
      ) : (
        <BarStationView 
          setIsAIChatOpen={setIsAIChatOpen} 
          orders={store.orders}
          inventory={store.inventory}
          authMode={store.authMode}
        />
      );
  }
};

export default ViewManager;

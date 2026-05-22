
import React, { useState } from 'react';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { useVinetelligenceActions } from '../hooks/useVinetelligenceActions';
import { AppView } from '../lib/types';
import ManagerDashboard from './ManagerDashboard';
import Inventory from './Inventory';
import GuestProfileView from './GuestProfileView';
import OperationsView from './OperationsView';
import ConciergeView from './ConciergeView';
import BarStationView from './BarStationView';
import MasterAdmin from './MasterAdmin';
import EstablishmentAdmin from './EstablishmentAdmin';
import VinetelligenceAcademy from './VinetelligenceAcademy';
import FinancialHub from './FinancialHub';
import VisionAuditor from './VisionAuditor';
import FacilityAssets from './FacilityAssets';
import InvestorPortal from './InvestorPortal';
import { OwnerAnalytics } from './OwnerAnalytics';
import { RetentionIntelligence } from './RetentionIntelligence';
import MarketingSuite from './MarketingSuite';
import CompetitorIntelligence from './CompetitorIntelligence';
import SupplyChainPredictor from './operations/SupplyChainPredictor';
import SustainabilityNode from './operations/SustainabilityNode';
import RevenueOptimizer from './operations/RevenueOptimizer';
import SentimentIntelligence from './operations/SentimentIntelligence';
import ExperienceSentinel from './operations/ExperienceSentinel';
import IntegrationHubView from './IntegrationHubView';
import OmnichannelDispatchDesk from './OmnichannelDispatchDesk';

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
  setAIChatOpen: (open: boolean) => void;
  setIsPublicRoute: (isPublic: boolean) => void;
  setPublicView: (view: 'book' | 'menu' | 'promo' | null) => void;
  onRelaunchOnboarding: () => void;
}

const ViewManager: React.FC<ViewManagerProps> = ({
  searchQuery,
  initialAcademyTab,
  setInitialAcademyTab,
  setAIChatOpen,
  setIsPublicRoute,
  setPublicView,
  onRelaunchOnboarding
}) => {
  const activeView = useVinetelligenceStore(state => state.activeView);
  const currentUserRole = useVinetelligenceStore(state => state.currentUserRole);
  const inventory = useVinetelligenceStore(state => state.inventory);
  const orders = useVinetelligenceStore(state => state.orders);
  const restaurantProfile = useVinetelligenceStore(state => state.restaurantProfile);
  const transactions = useVinetelligenceStore(state => state.transactions);
  const authMode = useVinetelligenceStore(state => state.authMode);
  const sessions = useVinetelligenceStore(state => state.session);
  const journeys = useVinetelligenceStore(state => state.journeys);
  const tables = useVinetelligenceStore(state => state.tables);
  const isDeveloper = useVinetelligenceStore(state => state.isDeveloper);
  const devToolsUnlocked = useVinetelligenceStore(state => state.devToolsUnlocked);
  const ownedCount = useVinetelligenceStore(state => state.ownedCount);
  
  const canAccess = useVinetelligenceStore(state => state.canAccess);
  const setActiveView = useVinetelligenceStore(state => state.setActiveView);
  const setRestaurantProfile = useVinetelligenceStore(state => state.setRestaurantProfile);
  const setJourneys = useVinetelligenceStore(state => state.setJourneys);
  const setTables = useVinetelligenceStore(state => state.setTables);
  const setAuthMode = useVinetelligenceStore(state => state.setAuthMode);
  const setCurrentUserRole = useVinetelligenceStore(state => state.setCurrentUserRole);

  const { handleAddToMenu, handleRemoveFromMenu, updateProfileValue, handleLogout } = useVinetelligenceActions();
  const isAdmin = ['Owner', 'Manager', 'Developer', 'Admin'].includes(currentUserRole || '');
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsTab>('general');

  // Tier Access Guard
  console.log("AppViewManager: Guard Check", { activeView, canAccess: canAccess(activeView) });
  if (!canAccess(activeView)) {
    console.log("AppViewManager: Access Denied, falling back to Dashboard");
    // Fallback to Dashboard if trying to access restricted view
    return (
      <ManagerDashboard 
        searchQuery={searchQuery} 
        inventory={inventory} 
        restaurantProfile={restaurantProfile} 
        orders={orders}
        transactions={transactions}
        authMode={authMode}
      />
    );
  }

  console.log("AppViewManager: Rendering View", activeView);
  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case 'general':
        return <GeneralSettings profile={restaurantProfile} onUpdate={updateProfileValue} />;
      case 'ai':
        return <AISettings profile={restaurantProfile} onUpdate={updateProfileValue} />;
      case 'connectivity':
        return <ConnectivitySettings profile={restaurantProfile} onUpdateTier={(tier) => updateProfileValue('edition', tier)} onUpdateProfile={updateProfileValue} />;
      case 'security':
        return <SecuritySettings 
          currentUserRole={currentUserRole} 
          onUpdateRole={setCurrentUserRole} 
          authMode={authMode} 
          onUpdateAuthMode={setAuthMode} 
          onLogout={handleLogout} 
          userSession={sessions}
          restaurantId={restaurantProfile?.id}
        />;
      case 'setup':
        return <SetupSettings onRelaunch={onRelaunchOnboarding} profile={restaurantProfile} onUpdate={updateProfileValue} />;
      default:
        return null;
    }
  };

  switch (activeView) {
    case AppView.DASHBOARD:
      return (
        <ManagerDashboard 
          searchQuery={searchQuery} 
          inventory={inventory} 
          restaurantProfile={restaurantProfile} 
          orders={orders}
          transactions={transactions}
          authMode={authMode}
          setActiveView={setActiveView}
        />
      );
    case AppView.FINANCIAL_HUB:
      return (
        <FinancialHub 
          restaurantProfile={restaurantProfile} 
          inventory={inventory} 
          transactions={transactions}
          authMode={authMode}
        />
      );
    case AppView.INVENTORY:
      return (
        <Inventory 
          searchQuery={searchQuery} 
          userRole={currentUserRole} 
          inventory={inventory} 
          authMode={authMode}
        />
      );
    case AppView.VISION_AUDITOR:
      return <VisionAuditor onCommit={() => setActiveView(AppView.INVENTORY)} onClose={() => setActiveView(AppView.INVENTORY)} />;
    case AppView.TRAINING:
      return (
        <VinetelligenceAcademy 
          searchQuery={searchQuery} 
          userRole={currentUserRole} 
          inventory={inventory}
          initialTab={initialAcademyTab}
          onAddToMenu={handleAddToMenu}
          onRemoveFromMenu={handleRemoveFromMenu}
        />
      );
    case AppView.GUEST_PROFILE:
      return <GuestProfileView journeys={journeys} setJourneys={setJourneys} />;
    case AppView.DISPATCH_DESK:
      return <OmnichannelDispatchDesk />;
    case AppView.FACILITY_ASSETS:
      return <FacilityAssets restaurantId={restaurantProfile?.id || 'demo-id'} />;
    case AppView.RETENTION:
      return <RetentionIntelligence />;
    case AppView.OWNER_ANALYTICS: {
      const userEmail = sessions?.user?.email || '';
      const isStaff = userEmail.endsWith('@vinetelligence.ai') || userEmail.endsWith('@vinea.ai') || currentUserRole === 'Developer';
      const isEnterprise = (currentUserRole === 'Owner' || currentUserRole === 'Investor') && ownedCount > 1;
      
      if (!isStaff && !isEnterprise) {
        return <ManagerDashboard 
          searchQuery={searchQuery} 
          inventory={inventory} 
          restaurantProfile={restaurantProfile} 
          orders={orders}
          transactions={transactions}
          authMode={authMode}
        />;
      }
      return <OwnerAnalytics onNavigateToInvestor={() => setActiveView(AppView.INVESTOR)} />;
    }
    case AppView.INVESTOR:
      return (
        <InvestorPortal 
          profile={restaurantProfile} 
          inventory={inventory} 
          orders={orders} 
          transactions={transactions}
          onBack={() => setActiveView(AppView.DASHBOARD)} 
        />
      );
    case AppView.PROMO:
      return (
        <MarketingSuite 
          profile={restaurantProfile!} 
          inventory={inventory}
          onBack={() => setActiveView(AppView.ESTABLISHMENT_ADMIN)}
        />
      );
    case AppView.SUPPLY_CHAIN:
      return <SupplyChainPredictor inventory={inventory} />;
    case AppView.SUSTAINABILITY:
      return <SustainabilityNode />;
    case AppView.REVENUE_OPTIMIZER:
      return <RevenueOptimizer inventory={inventory} />;
    case AppView.SENTIMENT:
      return <SentimentIntelligence />;
    case AppView.EXPERIENCE_SENTINEL:
      return <ExperienceSentinel />;
    case AppView.COMPETITORS:
      return <CompetitorIntelligence inventory={inventory} />;
    case AppView.INTEGRATION_HUB:
      return <IntegrationHubView />;
    case AppView.STAFFING:
      return (
        <OperationsView 
          setActiveView={setActiveView} 
          restaurantProfile={restaurantProfile}
          setRestaurantProfile={setRestaurantProfile}
          setIsPublicRoute={setIsPublicRoute}
          setPublicView={setPublicView}
          journeys={journeys}
          setJourneys={setJourneys}
          orders={orders}
          inventory={inventory}
          tables={tables}
          userRole={currentUserRole}
        />
      );
    case AppView.CONCIERGE:
      return (
        <ConciergeView 
          journeys={journeys} 
          setJourneys={setJourneys} 
          profile={restaurantProfile} 
          orders={orders} 
          tables={tables}
          setTables={setTables}
        />
      );
    case AppView.BAR_STATION:
      return (
        <BarStationView 
          setAIChatOpen={setAIChatOpen} 
          onNavigateToAcademy={(tab) => {
            setInitialAcademyTab(tab);
            setActiveView(AppView.TRAINING);
          }}
          orders={orders}
          inventory={inventory}
        />
      );
    case AppView.ESTABLISHMENT_ADMIN:
      return (
        <EstablishmentAdmin 
          isDeveloper={isDeveloper} 
          devToolsUnlocked={devToolsUnlocked} 
          restaurantProfile={restaurantProfile} 
          onUpdateProfile={updateProfileValue}
          onNavigateToInvestor={() => setActiveView(AppView.INVESTOR)}
          onNavigateToPromo={() => setActiveView(AppView.PROMO)}
        />
      );
    case AppView.SETTINGS:
      return (
        <div className="flex flex-col lg:flex-row gap-8 items-start min-h-full">
          <div className="w-full lg:w-72 shrink-0 bg-white p-5 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible custom-scrollbar no-scrollbar lg:no-scrollbar-off">
            {[
              { id: 'general', label: 'Establishment', icon: 'fa-building' },
              { id: 'ai', label: 'Vinetelligence AI', icon: 'fa-brain' },
              { id: 'connectivity', label: 'Connectivity', icon: 'fa-network-wired' },
              { id: 'security', label: 'Security & Roster', icon: 'fa-shield-halved' },
              { id: 'setup', label: 'Setup Recovery', icon: 'fa-hammer' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id as SettingsTab)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-sm font-bold shrink-0 lg:shrink ${
                  activeSettingsTab === tab.id 
                    ? 'bg-slate-950 text-slate-100 shadow-xl' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
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
      return <MasterAdmin isDeveloper={isDeveloper} initialTab="nodes" mode="saas" />;
    case AppView.GLOBAL_LEDGER:
      return <MasterAdmin isDeveloper={isDeveloper} initialTab="ledger" mode="ledger" />;
    default:
      return isAdmin ? (
        <ManagerDashboard 
          searchQuery={searchQuery} 
          inventory={inventory} 
          restaurantProfile={restaurantProfile} 
          orders={orders}
          transactions={transactions}
          authMode={authMode}
          setActiveView={setActiveView}
        />
      ) : (
        <BarStationView 
          setAIChatOpen={setAIChatOpen} 
          orders={orders}
          inventory={inventory}
          authMode={authMode}
        />
      );
  }
};

export default ViewManager;

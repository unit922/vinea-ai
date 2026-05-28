import React from 'react';
import { useVinetelligenceStore } from '../../store/vinetelligenceStore';
import { SubscriptionTier } from '../../lib/types';

interface OperationsHeaderProps {
  activeTab: string;
  setActiveTab: (tab: 'floor' | 'ordering' | 'checkout' | 'deployment' | 'history' | 'operation' | 'guest' | 'journey' | 'labor' | 'facility' | 'market' | 'system') => void;
  isAdmin: boolean;
  isDeveloper: boolean;
  isStaff: boolean;
}

const OperationsHeader: React.FC<OperationsHeaderProps> = ({ activeTab, setActiveTab, isAdmin, isDeveloper, isStaff }) => {
  const store = useVinetelligenceStore();
  const tier = store.restaurantProfile?.tier || SubscriptionTier.OPERATOR;
  const isOperator = tier === SubscriptionTier.OPERATOR;

  const tabs = [
    { id: 'operation', label: 'Overview', icon: 'fa-chart-network', show: true },
    { id: 'floor', label: 'Floor', icon: 'fa-chair', show: true },
    { id: 'ordering', label: 'Ordering', icon: 'fa-plus-circle', show: true },
    { id: 'checkout', label: 'Checkout', icon: 'fa-cash-register', show: true },
    { id: 'deployment', label: 'Staffing', icon: 'fa-users-gear', show: isAdmin || isDeveloper || isStaff },
    { id: 'journey', label: 'Journeys', icon: 'fa-route', show: true },
    { id: 'guest', label: 'Guests', icon: 'fa-user-group', show: true },
    { id: 'market', label: 'Market', icon: 'fa-globe', show: (isAdmin || isDeveloper) && !isOperator },
    { id: 'history', label: 'History', icon: 'fa-history', show: true },
    { id: 'labor', label: 'Labor', icon: 'fa-id-card', show: (isAdmin || isDeveloper) && !isOperator },
    { id: 'facility', label: 'Facility', icon: 'fa-tools', show: (isAdmin || isDeveloper) && !isOperator },
    { id: 'system', label: 'System', icon: 'fa-microchip', show: (isAdmin || isDeveloper) && !isOperator },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar">
      {tabs.filter(t => t.show).map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${
            activeTab === tab.id 
              ? 'bg-amber-500 text-stone-950 font-bold shadow-lg shadow-amber-500/20' 
              : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
          }`}
        >
          <i className={`fas ${tab.icon} text-xs`}></i>
          <span className="text-[10px] uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default OperationsHeader;

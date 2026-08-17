
import { create } from 'zustand';
import { RestaurantProfile, InventoryItem, ServiceOrder, Table, GuestJourney, AppView, RetailTransaction, StaffShift, StaffAssignment, StaffRosterItem, SubscriptionTier, TierConfig, TIER_CONFIGS } from '../lib/types';
import { isVinetelligenceAdmin } from '../lib/authUtils';
import { VinetelligenceSession } from '../services/authService';

interface VinetelligenceState {
  // Core State
  restaurantProfile: RestaurantProfile | null;
  getTierConfig: () => TierConfig;
  canAccess: (view: AppView) => boolean;
  isDevOrStaff: () => boolean;
  inventory: InventoryItem[];
  orders: ServiceOrder[];
  draftOrders: ServiceOrder[];
  tables: Table[];
  journeys: GuestJourney[];
  transactions: RetailTransaction[];
  staff: StaffShift[];
  staffRoster: StaffRosterItem[];
  assignments: StaffAssignment[];
  activeView: AppView;
  session: VinetelligenceSession | null;
  isReady: boolean;
  isOnline: boolean;
  isDatabaseConnected: boolean;
  isSyncing: boolean;
  authMode: 'demo' | 'secure';
  currentUserRole: StaffShift['role'];
  isDeveloper: boolean;
  devToolsUnlocked: boolean;
  ownedCount: number;
  serviceAlerts: { id: string; message: string; type: 'delay' | 'payment'; severity: 'warning' | 'critical' }[];
  isAIChatOpen: boolean;
  
  // Actions
  setRestaurantProfile: (profile: RestaurantProfile | null) => void;
  setInventory: (inventory: InventoryItem[]) => void;
  setOrders: (orders: ServiceOrder[]) => void;
  setDraftOrders: (orders: ServiceOrder[]) => void;
  setTables: (tables: Table[]) => void;
  setJourneys: (journeys: GuestJourney[]) => void;
  setTransactions: (transactions: RetailTransaction[]) => void;
  setStaff: (staff: StaffShift[]) => void;
  setStaffRoster: (roster: StaffRosterItem[]) => void;
  setAssignments: (assignments: StaffAssignment[]) => void;
  setActiveView: (view: AppView) => void;
  setSession: (session: VinetelligenceSession | null) => void;
  setIsReady: (isReady: boolean) => void;
  setIsOnline: (isOnline: boolean) => void;
  setIsDatabaseConnected: (isConnected: boolean) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setAuthMode: (mode: 'demo' | 'secure') => void;
  setCurrentUserRole: (role: StaffShift['role']) => void;
  setIsDeveloper: (isDev: boolean) => void;
  setDevToolsUnlocked: (unlocked: boolean) => void;
  setOwnedCount: (count: number) => void;
  setServiceAlerts: (alerts: { id: string; message: string; type: 'delay' | 'payment'; severity: 'warning' | 'critical' }[]) => void;
  setAIChatOpen: (isOpen: boolean) => void;
  
  // Helpers
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  addOrder: (order: ServiceOrder) => void;
  updateOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  updateTable: (number: string, updates: Partial<Table>) => void;
}

export const useVinetelligenceStore = create<VinetelligenceState>((set, get) => ({
  restaurantProfile: null,
  getTierConfig: () => {
    const state = get();
    // Use stored profile tier or default to Operator
    const tier = state.restaurantProfile?.tier || SubscriptionTier.OPERATOR;
    
    // Safety check that tier is a valid enum value
    const validTier = Object.values(SubscriptionTier).includes(tier as SubscriptionTier) 
      ? (tier as SubscriptionTier) 
      : SubscriptionTier.OPERATOR;
    
    const config = TIER_CONFIGS[validTier] || TIER_CONFIGS[SubscriptionTier.OPERATOR];
    
    if (!config) {
      console.warn("Vinetelligence Store: Critical error - TIER_CONFIGS missing Operator config.");
      return TIER_CONFIGS[SubscriptionTier.OPERATOR];
    }
    return config;
  },
  canAccess: (view: AppView) => {
    const state = get();
    
    // Academy Only Mode Restriction
    if (state.restaurantProfile?.academyOnlyMode) {
      return view === AppView.TRAINING || view === AppView.SETTINGS || view === AppView.ESTABLISHMENT_ADMIN;
    }

    // Staff bypass
    const email = state.session?.user?.email || '';
    const isOwnerOrDev = ['Owner', 'Developer'].includes(state.currentUserRole || '');
    const isStaffRole = ['Server', 'Sommelier', 'Mixologist', 'Concierge'].includes(state.currentUserRole || '');
    const isStaff = isVinetelligenceAdmin(email) || isOwnerOrDev || isStaffRole;
    
    if (isStaff) {
      // Even staff might not see internal master-only views
      if (view === AppView.NETWORK_ADMIN || view === AppView.GLOBAL_LEDGER) {
        return isOwnerOrDev && (isVinetelligenceAdmin(email) || state.currentUserRole === 'Developer');
      }
      return true;
    }
    
    // Feature based access
    const config = state.getTierConfig();
    let hasAccess = config?.features?.includes(view) || false;
    
    // Prevent unauthenticated demo/regular users from accessing internal master admins
    if (view === AppView.NETWORK_ADMIN || view === AppView.GLOBAL_LEDGER) {
      hasAccess = false;
    }

    // Explicitly allow TRAINING, BAR_STATION, SUSTAINABILITY, SUPPLY_CHAIN, REVENUE_OPTIMIZER, SENTIMENT, EXPERIENCE_SENTINEL, and COMPETITORS for Operators
    if ((view === AppView.TRAINING || view === AppView.BAR_STATION || view === AppView.SUSTAINABILITY || view === AppView.SUPPLY_CHAIN || view === AppView.REVENUE_OPTIMIZER || view === AppView.SENTIMENT || view === AppView.EXPERIENCE_SENTINEL || view === AppView.COMPETITORS) && (state.restaurantProfile?.tier === SubscriptionTier.OPERATOR || !state.restaurantProfile?.tier)) {
      return true;
    }

    console.log("Vinetelligence Store: canAccess", { view, hasAccess, tier: state.restaurantProfile?.tier });
    return hasAccess;
  },
  isDevOrStaff: () => {
    const state = useVinetelligenceStore.getState();
    const email = state.session?.user?.email || '';
    return isVinetelligenceAdmin(email) || state.currentUserRole === 'Developer';
  },
  inventory: [],
  orders: [],
  draftOrders: [],
  tables: [],
  journeys: [],
  transactions: [],
  staff: [],
  staffRoster: [],
  assignments: [],
  activeView: (typeof window !== 'undefined' && localStorage.getItem('vinetelligence_active_view') as AppView) || AppView.DASHBOARD,
  session: null,
  isReady: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isDatabaseConnected: true,
  isSyncing: false,
  authMode: 'demo',
  currentUserRole: 'Manager',
  isDeveloper: false,
  devToolsUnlocked: false,
  ownedCount: 0,
  serviceAlerts: [],
  isAIChatOpen: false,

  setRestaurantProfile: (profile) => set({ restaurantProfile: profile }),
  setInventory: (inventory) => set({ inventory }),
  setOrders: (orders) => set({ orders }),
  setDraftOrders: (draftOrders) => set({ draftOrders }),
  setTables: (tables) => set({ tables }),
  setJourneys: (journeys) => set({ journeys }),
  setTransactions: (transactions) => set({ transactions }),
  setStaff: (staff) => set({ staff }),
  setStaffRoster: (staffRoster) => set({ staffRoster }),
  setAssignments: (assignments) => set({ assignments }),
  setActiveView: (view) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vinetelligence_active_view', view);
    }
    set({ activeView: view });
  },
  setSession: (session) => set({ session }),
  setIsReady: (isReady) => set({ isReady }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setIsDatabaseConnected: (isDatabaseConnected) => set({ isDatabaseConnected }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setAuthMode: (mode) => set({ authMode: mode }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),
  setIsDeveloper: (isDev) => set({ isDeveloper: isDev }),
  setDevToolsUnlocked: (unlocked) => set({ devToolsUnlocked: unlocked }),
  setOwnedCount: (count) => set({ ownedCount: count }),
  setServiceAlerts: (serviceAlerts) => set({ serviceAlerts }),
  setAIChatOpen: (isOpen) => set({ isAIChatOpen: isOpen }),

  updateInventoryItem: (id, updates) => set((state) => ({
    inventory: state.inventory.map((item) => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),

  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders]
  })),

  updateOrder: (id, updates) => set((state) => ({
    orders: state.orders.map((order) => 
      order.id === id ? { ...order, ...updates } : order
    )
  })),

  updateTable: (number, updates) => set((state) => ({
    tables: state.tables.map((table) => 
      table.number === number ? { ...table, ...updates } : table
    )
  })),
}));

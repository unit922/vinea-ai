
import { create } from 'zustand';
import { RestaurantProfile, InventoryItem, ServiceOrder, Table, GuestJourney, AppView, RetailTransaction, StaffShift, StaffAssignment, StaffRosterItem, SubscriptionTier, TierConfig, TIER_CONFIGS } from '../lib/types';
import { isSystemAdmin } from '../lib/authUtils';
import { Session } from '../services/authService';

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
  session: Session | null;
  isReady: boolean;
  isOnline: boolean;
  isDatabaseConnected: boolean;
  isSyncing: boolean;
  authMode: 'demo' | 'secure';
  currentUserRole: StaffShift['role'];
  isDeveloper: boolean;
  devToolsUnlocked: boolean;
  ownedCount: number;
  isAIChatOpen: boolean;
  serviceAlerts: { id: string; message: string; type: 'delay' | 'payment'; severity: 'warning' | 'critical' }[];
  
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
  setSession: (session: Session | null) => void;
  setIsReady: (isReady: boolean) => void;
  setIsOnline: (isOnline: boolean) => void;
  setIsDatabaseConnected: (isConnected: boolean) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  setAuthMode: (mode: 'demo' | 'secure') => void;
  setCurrentUserRole: (role: StaffShift['role']) => void;
  setIsDeveloper: (isDev: boolean) => void;
  setDevToolsUnlocked: (unlocked: boolean) => void;
  setOwnedCount: (count: number) => void;
  setAIChatOpen: (isOpen: boolean) => void;
  setServiceAlerts: (alerts: { id: string; message: string; type: 'delay' | 'payment'; severity: 'warning' | 'critical' }[]) => void;
  
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
    const role = state.currentUserRole;
    const email = state.session?.user?.email || '';
    
    const isOwnerOrDev = ['Owner', 'Developer'].includes(role || '');
    const isAdminOrManager = ['Admin', 'Manager'].includes(role || '');
    const isAdministrative = isOwnerOrDev || isAdminOrManager || isSystemAdmin(email);
    
    const isInvestor = role === 'Investor';
    const isStaffRole = ['Server', 'Sommelier', 'Mixologist', 'Concierge'].includes(role || '');

    // Master/SaaS Admin views - Only Owner/Dev with Admin credentials
    if (view === AppView.NETWORK_ADMIN || view === AppView.GLOBAL_LEDGER) {
      return isOwnerOrDev && (isSystemAdmin(email) || role === 'Developer');
    }

    // Administrative roles have full base establishment access
    if (isAdministrative) {
      return true;
    }

    // Investor access - Restricted to analytics and high-level views
    if (isInvestor) {
      return [
        AppView.DASHBOARD,
        AppView.FINANCIAL_HUB,
        AppView.INVESTOR,
        AppView.OWNER_ANALYTICS,
        AppView.SETTINGS,
        AppView.REVENUE_OPTIMIZER,
        AppView.SENTIMENT,
        AppView.COMPETITORS
      ].includes(view);
    }

    // Staff access - Restricted to operational views
    if (isStaffRole) {
      return [
        AppView.DASHBOARD,
        AppView.BAR_STATION,
        AppView.CONCIERGE,
        AppView.TRAINING,
        AppView.GUEST_PROFILE,
        AppView.DISPATCH_DESK,
        AppView.INVENTORY,
        AppView.VISION_AUDITOR,
        AppView.FACILITY_ASSETS,
        AppView.SETTINGS
      ].includes(view);
    }

    // Fallback to Tier based access for any other case (e.g. Guest or unassigned)
    const config = state.getTierConfig();
    return config?.features?.includes(view) || false;
  },
  isDevOrStaff: () => {
    const state = useVinetelligenceStore.getState();
    const email = state.session?.user?.email || '';
    return isSystemAdmin(email) || state.currentUserRole === 'Developer';
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
  activeView: AppView.DASHBOARD,
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
  isAIChatOpen: false,
  serviceAlerts: [],

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
  setActiveView: (view) => set({ activeView: view }),
  setSession: (session) => set({ session }),
  setIsReady: (isReady) => set({ isReady }),
  setIsOnline: (isOnline) => set({ isOnline }),
  setIsDatabaseConnected: (isDatabaseConnected) => set({ isDatabaseConnected }),
  setIsSyncing: (isSyncing) => set({ isSyncing }),
  setAuthMode: (mode) => set({ authMode: mode }),
  setIsDeveloper: (isDeveloper) => set({ isDeveloper }),
  setDevToolsUnlocked: (devToolsUnlocked) => set({ devToolsUnlocked }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),
  setOwnedCount: (count) => set({ ownedCount: count }),
  setAIChatOpen: (isAIChatOpen) => set({ isAIChatOpen }),
  setServiceAlerts: (serviceAlerts) => set({ serviceAlerts }),

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


import { create } from 'zustand';
import { RestaurantProfile, InventoryItem, ServiceOrder, Table, GuestJourney, AppView, RetailTransaction, StaffShift, StaffAssignment, StaffRosterItem } from '../lib/types';
import { VineaSession } from '../services/authService';

interface VineaState {
  // Core State
  restaurantProfile: RestaurantProfile | null;
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
  session: VineaSession | null;
  isReady: boolean;
  isOnline: boolean;
  authMode: 'demo' | 'secure';
  currentUserRole: StaffShift['role'];
  isDeveloper: boolean;
  devToolsUnlocked: boolean;
  ownedCount: number;
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
  setSession: (session: VineaSession | null) => void;
  setIsReady: (isReady: boolean) => void;
  setIsOnline: (isOnline: boolean) => void;
  setAuthMode: (mode: 'demo' | 'secure') => void;
  setCurrentUserRole: (role: StaffShift['role']) => void;
  setIsDeveloper: (isDev: boolean) => void;
  setDevToolsUnlocked: (unlocked: boolean) => void;
  setOwnedCount: (count: number) => void;
  setServiceAlerts: (alerts: { id: string; message: string; type: 'delay' | 'payment'; severity: 'warning' | 'critical' }[]) => void;
  
  // Helpers
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  addOrder: (order: ServiceOrder) => void;
  updateOrder: (id: string, updates: Partial<ServiceOrder>) => void;
  updateTable: (number: string, updates: Partial<Table>) => void;
}

export const useVineaStore = create<VineaState>((set) => ({
  restaurantProfile: null,
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
  authMode: 'demo',
  currentUserRole: 'Manager',
  isDeveloper: false,
  devToolsUnlocked: false,
  ownedCount: 0,
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
  setAuthMode: (mode) => set({ authMode: mode }),
  setCurrentUserRole: (role) => set({ currentUserRole: role }),
  setIsDeveloper: (isDev) => set({ isDeveloper: isDev }),
  setDevToolsUnlocked: (unlocked) => set({ devToolsUnlocked: unlocked }),
  setOwnedCount: (count) => set({ ownedCount: count }),
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

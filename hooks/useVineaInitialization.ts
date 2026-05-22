
import { useEffect } from 'react';
import { useVineaStore } from '../store/vineaStore';
import { supabaseSync, isValidUUID } from '../services/supabaseSync';
import { INITIAL_INVENTORY, MOCK_JOURNEYS, INITIAL_SHIFTS, INITIAL_TABLES, INITIAL_TRANSACTIONS } from '../constants';
import { RestaurantProfile, ServiceOrder, InventoryItem } from '../lib/types';

export const useVineaInitialization = () => {
  const store = useVineaStore();
  const { 
    setIsOnline, setOrders, setInventory, setJourneys, setTables, 
    setTransactions, setStaff, setAssignments, setDraftOrders,
    setStaffRoster, setAuthMode
  } = store;

  const profileId = store.restaurantProfile?.id;
  const authMode = store.authMode;
  const session = store.session;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline]);

  useEffect(() => {
    const handleStorage = () => {
      const storedOrders = localStorage.getItem('vinea_orders');
      const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];
      setOrders(parsedOrders);
      
      const storedInventory = localStorage.getItem('vinea_inventory');
      const profileStr = localStorage.getItem('vinea_profile');
      const profile: RestaurantProfile | null = profileStr ? JSON.parse(profileStr) : null;
      const isDemo = !profile || ((!profile.edition || profile.edition === 'demo') && !isValidUUID(profile.id));
      const parsedInventory = storedInventory ? JSON.parse(storedInventory) : (isDemo ? INITIAL_INVENTORY : []);
      setInventory(parsedInventory);

      const storedJourneys = localStorage.getItem('vinea_journeys');
      const parsedJourneys = storedJourneys ? JSON.parse(storedJourneys) : (isDemo ? MOCK_JOURNEYS : []);
      setJourneys(parsedJourneys);

      const storedTables = localStorage.getItem('vinea_tables');
      const parsedTables = storedTables ? JSON.parse(storedTables) : (isDemo ? INITIAL_TABLES : []);
      setTables(parsedTables);

      const storedTransactions = localStorage.getItem('vinea_transactions');
      const parsedTransactions = storedTransactions ? JSON.parse(storedTransactions) : (isDemo ? INITIAL_TRANSACTIONS : []);
      setTransactions(parsedTransactions);

      const storedStaff = localStorage.getItem('vinea_staff_list');
      const parsedStaff = storedStaff ? JSON.parse(storedStaff) : (isDemo ? INITIAL_SHIFTS : []);
      setStaff(parsedStaff);

      const storedAssignments = localStorage.getItem('vinea_assignments');
      const parsedAssignments = storedAssignments ? JSON.parse(storedAssignments) : [];
      setAssignments(parsedAssignments);

      const storedDraftOrders = localStorage.getItem('vinea_draft_orders');
      const parsedDraftOrders = storedDraftOrders ? JSON.parse(storedDraftOrders) : [];
      setDraftOrders(parsedDraftOrders);

      setAuthMode(isDemo ? 'demo' : 'secure');
    };

    handleStorage();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [setOrders, setInventory, setJourneys, setTables, setTransactions, setStaff, setAssignments, setDraftOrders, setAuthMode]);

  useEffect(() => {
    const handleManualUpdate = () => {
      console.log("Vinea: Manual data update triggered. Refreshing caches...");
      // Forcing a fresh sync by just reloading from storage then trigger cloud pulls
      window.dispatchEvent(new Event('storage'));
      
      // We also trigger a small delay then re-pull from cloud 
      // if we are in secure mode
      if (profileId && authMode !== 'demo') {
        setTimeout(() => window.location.reload(), 2000); // Reloading is safest to reset all hooks
      }
    };

    window.addEventListener('vinea_data_update', handleManualUpdate);
    return () => window.removeEventListener('vinea_data_update', handleManualUpdate);
  }, [profileId, authMode]);

  useEffect(() => {
    if (!profileId || authMode === 'demo' || !session) return;

    const sendPulse = async () => {
      try {
        const ordersStr = localStorage.getItem('vinea_orders') || '[]';
        const orders: ServiceOrder[] = JSON.parse(ordersStr);
        const inventoryStr = localStorage.getItem('vinea_inventory') || '[]';
        const inventory: InventoryItem[] = JSON.parse(inventoryStr);
        
        const activeOrders = orders.filter((o: ServiceOrder) => o.status === 'Pending' || o.status === 'Prepping').length;
        const lowStock = inventory.filter((i: InventoryItem) => i.stock <= i.minStock).length;
        
        const baseUsage = 20 + (activeOrders * 15) + (lowStock * 5);
        const finalUsage = Math.min(100, Math.max(0, baseUsage + (Math.random() * 10 - 5)));
        
        await supabaseSync.pushPulse(profileId, Math.floor(finalUsage));
      } catch (e) {
        console.error("Vinea: Pulse failed", e);
      }
    };

    sendPulse();
    const interval = setInterval(sendPulse, 60000);
    return () => clearInterval(interval);
  }, [profileId, authMode, session]);

  useEffect(() => {
    if (!profileId || authMode === 'demo') return;
    // For sync we need either a session OR to be in a public route
    const isPublicRoute = window.location.pathname.split('/').filter(p => p).length > 0;
    if (!session && !isPublicRoute) return;

    const syncJourneys = async () => {
      try {
        const data = await supabaseSync.pullJourneys(profileId);
        if (data) {
          setJourneys(data);
          localStorage.setItem('vinea_journeys', JSON.stringify(data));
        }
      } catch (e) {
        console.error("Vinea: Initial journey sync failed", e);
      }
    };

    syncJourneys();
    
    const syncOperations = async () => {
      try {
        const [assignments, staffProfiles, roster] = await Promise.all([
          supabaseSync.pullAssignments(profileId),
          supabaseSync.getStaffProfiles(profileId),
          supabaseSync.getStaffRoster(profileId)
        ]);

        if (assignments) setAssignments(assignments);
        if (staffProfiles) {
          const mappedStaff = staffProfiles.map((p: { id: string; full_name: string; email: string; role: string; performance_score: number; availability_status: string }) => ({
            id: p.id,
            name: p.full_name || 'Unknown Staff',
            email: p.email,
            role: p.role,
            performanceScore: p.performance_score || 100,
            availabilityStatus: p.availability_status,
            accessStatus: 'Active',
            startTime: '09:00',
            endTime: '17:00'
          }));
          setStaff(mappedStaff);
        }
        if (roster) setStaffRoster(roster);
      } catch (e) {
        console.error("Vinea: Operations sync failed", e);
      }
    };

    syncOperations();

    const syncInventory = async () => {
      try {
        const data = await supabaseSync.pullInventory(profileId);
        if (data) {
          setInventory(data);
          localStorage.setItem('vinea_inventory', JSON.stringify(data));
        }
      } catch (e) {
        console.error("Vinea: Initial inventory sync failed", e);
      }
    };

    const syncOrders = async () => {
      try {
        const data = await supabaseSync.pullOrders(profileId);
        if (data) {
          setOrders(data);
          localStorage.setItem('vinea_orders', JSON.stringify(data));
        }
      } catch (e) {
        console.error("Vinea: Initial orders sync failed", e);
      }
    };

    const syncTables = async () => {
      try {
        const data = await supabaseSync.pullTables(profileId);
        if (data) {
          setTables(data);
          localStorage.setItem('vinea_tables', JSON.stringify(data));
        }
      } catch (e) {
        console.error("Vinea: Initial tables sync failed", e);
      }
    };

    syncInventory();
    syncOrders();
    syncTables();

    const unsubscribeJourneys = supabaseSync.subscribeToJourneys(profileId, (data) => {
      if (data) {
        setJourneys(data);
        localStorage.setItem('vinea_journeys', JSON.stringify(data));
      }
    });

    const unsubscribeAssignments = supabaseSync.subscribeToAssignments(profileId, (data) => {
      if (data) setAssignments(data);
    });

    const unsubscribeInventory = supabaseSync.subscribeToInventory(profileId, (data) => {
      if (data) {
        setInventory(data);
        localStorage.setItem('vinea_inventory', JSON.stringify(data));
      }
    });

    const unsubscribeOrders = supabaseSync.subscribeToOrders(profileId, (data) => {
      if (data) {
        setOrders(data);
        localStorage.setItem('vinea_orders', JSON.stringify(data));
      }
    });
    
    const unsubscribeRoster = supabaseSync.subscribeToRoster(profileId, (data) => {
      if (data) setStaffRoster(data);
    });

    const unsubscribeStaff = supabaseSync.subscribeToStaffProfiles(profileId, (profiles: StaffProfile[]) => {
      if (profiles) {
        const mappedStaff = profiles.map((p) => ({
          id: p.id,
          name: p.full_name || 'Unknown Staff',
          email: p.email,
          role: p.role,
          performanceScore: p.performance_score || 100,
          availabilityStatus: p.availability_status,
          accessStatus: 'Active',
          startTime: '09:00',
          endTime: '17:00'
        }));
        setStaff(mappedStaff);
      }
    });

    const unsubscribeTables = supabaseSync.subscribeToTables(profileId, (data) => {
      if (data) {
        setTables(data);
        localStorage.setItem('vinea_tables', JSON.stringify(data));
      }
    });

    return () => {
      unsubscribeJourneys();
      unsubscribeAssignments();
      unsubscribeInventory();
      unsubscribeOrders();
      unsubscribeTables();
      unsubscribeRoster();
      unsubscribeStaff();
    };
  }, [profileId, authMode, session, setJourneys, setAssignments, setStaff, setStaffRoster, setInventory, setOrders, setTables]);
};

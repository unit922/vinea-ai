import { useState, useEffect, useCallback } from 'react';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { supabaseSync, generateUUID, isValidUUID } from '../services/supabaseSync';
import { geminiService } from '../services/geminiService';
import { 
  Table, 
  StaffShift, 
  ServiceOrder, 
  InventoryItem, 
  OrderItem, 
  RetailTransaction, 
  EquipmentStatus, 
  StaffAssignment, 
  StaffRosterItem,
  FloorZone,
  PaymentMethod
} from '../lib/types';
import { INITIAL_TABLES, MOCK_EQUIPMENT, INITIAL_ZONES, FISCAL_ENGINE_CONFIG, INITIAL_INVENTORY } from '../constants';
import { calculateDecrementAmount } from '../lib/inventoryUtils';

export const useOperationsLogic = () => {
  const store = useVinetelligenceStore();
  const { 
    staff, 
    orders, 
    setOrders,
    setStaff, 
    staffRoster, 
    setStaffRoster, 
    restaurantProfile: profile,
    assignments,
    setAssignments,
    inventory,
    setInventory,
    draftOrders,
    setDraftOrders,
    addOrder,
    transactions,
    setTransactions,
    serviceAlerts,
    setServiceAlerts,
    tables,
    updateTable,
    setJourneys
  } = store;

  // Local UI State (not needed in global store)
  const [activeTab, setActiveTab] = useState<'floor' | 'ordering' | 'checkout' | 'deployment' | 'history' | 'operation' | 'guest' | 'journey' | 'labor' | 'facility' | 'market' | 'system'>('operation');
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [activeSeat, setActiveSeat] = useState<number | null>(null);
  const [currentCart, setCurrentCart] = useState<OrderItem[]>([]);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);
  const [isSynthesizingCoverage, setIsSynthesizingCoverage] = useState(false);
  const [isSynthesizingService, setIsSynthesizingService] = useState(false);
  const [coverageInsight, setCoverageInsight] = useState<string | null>(null);
  const [serviceInsight, setServiceInsight] = useState<string | null>(null);
  const handleSynthesizeServiceEfficiency = async () => {
    setIsSynthesizingService(true);
    setServiceInsight(null);
    try {
      const res = await geminiService.getServiceEfficiencyInsights(orders, transactions);
      setServiceInsight(res.narrative);
    } catch (e) {
      console.error("Intelligence: Failed to synthesize service efficiency", e);
    } finally {
      setIsSynthesizingService(false);
    }
  };

  const [isAnalyzingMaintenance, setIsAnalyzingMaintenance] = useState(false);
  const [maintenanceBrief, setMaintenanceBrief] = useState<string | null>(null);
  const [isAssetsLoading] = useState(false);
  const [equipment] = useState<EquipmentStatus[]>(MOCK_EQUIPMENT);
  const [isRosterLoading, setIsRosterLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [rosterMode, setRosterMode] = useState<'Active' | 'Authorized'>('Active');
  const [newRosterEmail, setNewRosterEmail] = useState('');
  const [newRosterRole, setNewRosterRole] = useState<StaffShift['role']>('Server');

  // Staff Performance Gamification
  useEffect(() => {
    const interval = setInterval(() => {
      if (staff.length === 0) return;

      const updated = staff.map(s => {
        const activeOrders = orders.filter(o => o.serverName === s.name && o.status !== 'Delivered');
        const completedOrders = orders.filter(o => o.serverName === s.name && o.status === 'Delivered');
        
        const scoreDelta = (completedOrders.length * 0.1) - (activeOrders.length * 0.05);
        const burnoutDelta = activeOrders.length * 0.1;
        
        return {
          ...s,
          performanceScore: Math.min(100, Math.max(0, (s.performanceScore || 50) + scoreDelta)),
          burnoutIndex: Math.min(100, Math.max(0, (s.burnoutIndex || 0) + burnoutDelta - 0.05))
        };
      });
      
      if (JSON.stringify(updated) !== JSON.stringify(staff)) {
        setStaff(updated);
        localStorage.setItem('intelligence_staff_list', JSON.stringify(updated));
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [staff, orders, setStaff]);

  const handleUpdateStaff = async (staffId: string, updates: Partial<StaffShift>) => {
    const updatedStaff = staff.map(s => s.id === staffId ? { ...s, ...updates } : s);
    setStaff(updatedStaff);
    localStorage.setItem('intelligence_staff_list', JSON.stringify(updatedStaff));
    
    if (isValidUUID(profile?.id)) {
      const profileUpdates: Record<string, string | number> = {};
      if (updates.performanceScore !== undefined) profileUpdates.performance_score = updates.performanceScore;
      if (updates.availabilityStatus !== undefined) profileUpdates.availability_status = updates.availabilityStatus;
      if (updates.name !== undefined) profileUpdates.full_name = updates.name;
      if (updates.role !== undefined) profileUpdates.role = updates.role;
      
      try {
        store.setIsSyncing(true);
        await supabaseSync.updateStaffProfile(staffId, profileUpdates);
      } catch (e) {
        console.error("Intelligence: Failed to sync staff update", e);
      } finally {
        store.setIsSyncing(false);
      }
    }
  };

  const handleAddRosterItem = async (email: string, role: StaffShift['role']) => {
    if (!email || !isValidUUID(profile?.id)) return;

    const tierConfig = store.getTierConfig();

    if (staffRoster.length >= tierConfig.maxUsers) {
      setOrderFeedback(`${tierConfig.name} Limit Reached: Maximum ${tierConfig.maxUsers} staff members allowed.`);
      setTimeout(() => setOrderFeedback(null), 5000);
      return;
    }

    setIsRosterLoading(true);
    store.setIsSyncing(true);
    try {
      await supabaseSync.addToStaffRoster(profile!.id, email, role);
      
      // Dispatch Invitation Email to match Establishment Admin behavior
      if (profile?.name) {
        await supabaseSync.sendInviteEmail(email, profile.name, role);
      }

      const updated = await supabaseSync.getStaffRoster(profile!.id);
      setStaffRoster(updated as StaffRosterItem[]);
      setOrderFeedback('Activation Dispatched');
      setTimeout(() => setOrderFeedback(null), 3000);
    } catch (e) {
      console.error("Intelligence: Failed to add to roster", e);
      setOrderFeedback('Roster update failed');
      setTimeout(() => setOrderFeedback(null), 3000);
    } finally {
      setIsRosterLoading(false);
      store.setIsSyncing(false);
    }
  };

  const handleRemoveRosterItem = async (id: string) => {
    if (!isValidUUID(profile?.id)) return;
    const itemToRemove = staffRoster.find(r => r.id === id);
    if (!itemToRemove) return;

    try {
      store.setIsSyncing(true);
      await supabaseSync.removeFromStaffRoster(id);
      setStaffRoster(staffRoster.filter(r => r.id !== id));
      
      if (itemToRemove.status === 'Registered') {
        const matchingStaff = staff.find(s => s.email?.toLowerCase() === itemToRemove.email?.toLowerCase());
        if (matchingStaff) {
          await supabaseSync.removeStaffFromEstablishment(matchingStaff.id);
          const updatedStaff = staff.filter(s => s.id !== matchingStaff.id);
          setStaff(updatedStaff);
          localStorage.setItem('intelligence_staff_list', JSON.stringify(updatedStaff));
        }
      }
      setOrderFeedback('Roster Item Removed');
      setTimeout(() => setOrderFeedback(null), 3000);
    } catch (e) {
      console.error("Intelligence: Failed to remove roster item", e);
    } finally {
      store.setIsSyncing(false);
    }
  };

  const handleSynthesizeCoverage = async (zonesToUse: FloorZone[] = INITIAL_ZONES) => {
    setIsSynthesizingCoverage(true);
    store.setIsSyncing(true);
    setCoverageInsight(null);
    try {
      const journeyKey = 'intelligence_journeys';
      let journeys = [];
      try {
        journeys = JSON.parse(localStorage.getItem(journeyKey) || '[]');
      } catch (pe) {
        console.error("Intelligence: Journey parse error in synthesis", pe);
      }
      const allocatableStaff = staff.filter(s => 
        s.accessStatus === 'Active' && 
        (s.availabilityStatus === 'Available' || s.availabilityStatus === 'Busy') &&
        !['owner', 'admin', 'manager', 'developer', 'investor'].includes(s.role.toLowerCase().trim())
      ).map(s => ({
        id: s.id,
        name: s.name,
        role: s.role,
        performanceScore: s.performanceScore,
        availabilityStatus: s.availabilityStatus
      }));
      
      const res = await geminiService.getStaffingInsights(allocatableStaff, zonesToUse, journeys);
      
      if (res.assignments && res.assignments.length > 0) {
        const newAssignments: StaffAssignment[] = res.assignments.map((a: { staffId: string; zoneId: string; priority?: string }) => ({
          staffId: a.staffId,
          zoneId: a.zoneId,
          priority: a.priority || 'Primary',
          timestamp: new Date().toISOString()
        }));
        setAssignments(newAssignments);
        localStorage.setItem('intelligence_assignments', JSON.stringify(newAssignments));
        if (isValidUUID(profile?.id)) {
          await supabaseSync.pushAssignments(profile!.id, newAssignments).catch(console.error);
        }
      }
      setCoverageInsight(res.narrative);
    } catch (e) { console.error(e); }
    finally { 
      setIsSynthesizingCoverage(false); 
      store.setIsSyncing(false);
    }
  };

  const handleMaintenanceAudit = async () => {
    setIsAnalyzingMaintenance(true);
    try {
      const brief = await geminiService.getFacilityMaintenanceBrief(equipment);
      setMaintenanceBrief(brief || 'Analysis complete.');
    } catch (e) { 
      console.error(e); 
      setMaintenanceBrief('Analysis failed.');
    }
    finally { setIsAnalyzingMaintenance(false); }
  };

  const addToCart = (item: InventoryItem) => {
    const existing = currentCart.find(i => i.name === item.name && i.seat === activeSeat);
    if (existing) {
      setCurrentCart(currentCart.map(i => 
        (i.name === item.name && i.seat === activeSeat) ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      const isSpiritOrWine = item.category === 'Spirit' || item.category === 'Wine';
      const divisor = item.category === 'Wine' ? 5 : 12;
      const baseServingPrice = item.servingPrice || (item.unit.toLowerCase().includes('bottle') ? item.price / divisor : item.price);
      
      const newItem: OrderItem = {
        id: generateUUID(),
        name: item.name,
        quantity: 1,
        status: 'Pending',
        prepType: (item.category === 'Lunch' || item.category === 'Dinner' || item.category === 'Snack') ? 'Complex' : (item.category === 'Mixer' ? 'Mix' : 'Pour'),
        priceAtOrder: isSpiritOrWine ? baseServingPrice : item.price,
        style: item.category,
        seat: activeSeat
      };
      setCurrentCart([...currentCart, newItem]);
    }
  };

  const handleFireDraft = async (draftId: string) => {
    const draft = draftOrders.find(d => d.id === draftId);
    if (!draft) return;

    store.setIsSyncing(true);
    try {
      const updatedDrafts = draftOrders.filter(d => d.id !== draftId);
      setDraftOrders(updatedDrafts);
      localStorage.setItem('intelligence_draft_orders', JSON.stringify(updatedDrafts));

      const firedOrder: ServiceOrder = {
        ...draft,
        timestamp: new Date().toISOString(),
        status: 'Pending'
      };

      addOrder(firedOrder);
      const updatedOrders = [firedOrder, ...orders];
      localStorage.setItem('oenovia_orders', JSON.stringify(updatedOrders));
      localStorage.setItem('vinetelligence_orders', JSON.stringify(updatedOrders));
      localStorage.setItem('vinea_orders', JSON.stringify(updatedOrders));

      if (isValidUUID(profile?.id)) {
        await supabaseSync.saveOrder(profile!.id, firedOrder).catch(console.error);
      }

      setOrderFeedback('Draft Fired');
      setTimeout(() => setOrderFeedback(null), 3000);

      const table = tables.find(t => t.number === draft.tableNumber);
      if (table && table.status === 'Available') {
        updateTable(table.number, { status: 'Occupied', occupantName: 'Walk-in Party' });
      }
    } finally {
      store.setIsSyncing(false);
    }
  };

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('Stripe');
  const [tipPercent, setTipPercent] = useState(20);
  const [guestFeedback, setGuestFeedback] = useState('');
  const [guestRating, setGuestRating] = useState(5);
  const [isSettling, setIsSettling] = useState(false);

  const getTableHistory = useCallback((tableNum: string) => orders.filter(o => o.tableNumber === tableNum), [orders]);
  
  const calculateSubtotal = useCallback((tableNum: string): number => {
    return getTableHistory(tableNum).reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + (item.priceAtOrder * item.quantity), 0);
    }, 0);
  }, [getTableHistory]);

  const handlePlaceOrder = async (items: OrderItem[] = currentCart, source: 'Staff' | 'Visitor' = 'Staff', priority: 'Normal' | 'High' | 'VIP' = 'Normal', isDraft: boolean = false) => {
    if (!activeTable) return;
    const newOrder: ServiceOrder = { 
      id: generateUUID(), 
      timestamp: new Date().toISOString(), 
      tableNumber: activeTable.number,
      items,
      status: isDraft ? 'Draft' : 'Pending',
      source,
      priority,
      serverName: profile?.name || 'Intelligence Staff'
    };

    if (isDraft) {
      const updatedDrafts = [...draftOrders, newOrder];
      setDraftOrders(updatedDrafts);
      localStorage.setItem('intelligence_draft_orders', JSON.stringify(updatedDrafts));
    } else {
      store.setIsSyncing(true);
      try {
        addOrder(newOrder);
        const updatedOrders = [newOrder, ...orders];
        localStorage.setItem('intelligence_orders', JSON.stringify(updatedOrders));
        if (isValidUUID(profile?.id)) {
          await supabaseSync.saveOrder(profile!.id, newOrder);
        }
        
        // Update inventory
        const updatedInventory = inventory.map(inv => {
          const orderItem = items.find(i => i.name === inv.name);
          if (orderItem) {
            const decrement = calculateDecrementAmount(orderItem, inv);
            return { ...inv, stock: Math.max(0, inv.stock - decrement) };
          }
          return inv;
        });
        setInventory(updatedInventory);
        localStorage.setItem('intelligence_inventory', JSON.stringify(updatedInventory));
      } catch (e) {
        console.error("Intelligence: Placement failed", e);
        setOrderFeedback('Order failed to sync');
      } finally {
        store.setIsSyncing(false);
      }
    }

    setCurrentCart([]);
    setOrderFeedback(isDraft ? 'Draft Saved' : 'Order Fired');
    setTimeout(() => setOrderFeedback(null), 3000);

    if (!isDraft && activeTable.status === 'Available') {
      updateTable(activeTable.number, { status: 'Occupied', occupantName: 'Walk-in Party' });
      const updatedTables = tables.map(t => t.number === activeTable.number ? { ...t, status: 'Occupied' as const, occupantName: 'Walk-in Party' } : t);
      localStorage.setItem('intelligence_tables', JSON.stringify(updatedTables));
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: ServiceOrder['status']) => {
    const now = new Date().toISOString();
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const updates: Partial<ServiceOrder> = { status: newStatus };
        if (newStatus === 'Prepping') updates.preppedAt = now;
        if (newStatus === 'Ready') updates.readyAt = now;
        if (newStatus === 'Delivered') updates.deliveredAt = now;
        return { ...o, ...updates };
      }
      return o;
    });
    
    setOrders(updatedOrders);
    localStorage.setItem('intelligence_orders', JSON.stringify(updatedOrders));
    
    const order = updatedOrders.find(o => o.id === orderId);
    if (order && isValidUUID(profile?.id)) {
      store.setIsSyncing(true);
      try {
        await supabaseSync.saveOrder(profile!.id, order);
      } catch (e) {
        console.error("Intelligence: Failed to sync order status update", e);
      } finally {
        store.setIsSyncing(false);
      }
    }
  };

  // Service Delay Monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newAlerts: typeof serviceAlerts = [];
      
      orders.forEach(order => {
        if (order.status === 'Delivered') return;
        
        const placedTime = new Date(order.timestamp).getTime();
        const waitTimeMinutes = (now - placedTime) / 60000;
        
        if (order.status === 'Pending' || order.status === 'Prepping') {
          if (waitTimeMinutes > 15) {
            newAlerts.push({
              id: `delay-${order.id}`,
              message: `CRITICAL: Table ${order.tableNumber} order pending for ${Math.floor(waitTimeMinutes)}m`,
              type: 'delay',
              severity: 'critical'
            });
          } else if (waitTimeMinutes > 10) {
            newAlerts.push({
              id: `delay-${order.id}`,
              message: `Warning: Table ${order.tableNumber} service delay (${Math.floor(waitTimeMinutes)}m)`,
              type: 'delay',
              severity: 'warning'
            });
          }
        } else if (order.status === 'Ready') {
          const readyTime = order.readyAt ? new Date(order.readyAt).getTime() : placedTime;
          const deliveryWait = (now - readyTime) / 60000;
          if (deliveryWait > 5) {
            newAlerts.push({
              id: `delivery-${order.id}`,
              message: `ALERT: Table ${order.tableNumber} order ready for ${Math.floor(deliveryWait)}m - Needs delivery!`,
              type: 'delay',
              severity: 'critical'
            });
          }
        }
      });

      // Payment Delay Monitoring
      tables.forEach(table => {
        if (table.status === 'Occupied' && table.paymentStartedAt && !table.settledAt) {
          const startTime = new Date(table.paymentStartedAt).getTime();
          const paymentTime = (now - startTime) / 60000;
          if (paymentTime > 5) {
            newAlerts.push({
              id: `payment-${table.id}`,
              message: `PAYMENT DELAY: Table ${table.number} checkout in progress for ${Math.floor(paymentTime)}m`,
              type: 'payment',
              severity: 'warning'
            });
          }
        }
      });

      setServiceAlerts(newAlerts);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [orders, tables, setServiceAlerts]);

  // Track Payment Start
  useEffect(() => {
    if (activeTab === 'checkout' && activeTable && !activeTable.paymentStartedAt) {
      const now = new Date().toISOString();
      const updatedTable = { ...activeTable, paymentStartedAt: now };
      
      // Update both store and local state
      updateTable(activeTable.number, { paymentStartedAt: now });
      setActiveTable(updatedTable);

      const updatedTables = tables.map(t => t.number === activeTable.number ? updatedTable : t);
      localStorage.setItem('intelligence_tables', JSON.stringify(updatedTables));

      if (isValidUUID(profile?.id)) {
        supabaseSync.pushTables(profile!.id, tables.map(t => 
          t.number === activeTable.number ? updatedTable : t
        )).catch(console.error);
      }
    }
  }, [activeTab, activeTable, updateTable, tables, profile, setActiveTable]);

  const handleSettleTable = async () => {
    if (!activeTable) return;
    setIsSettling(true);
    try {
      const subtotal = calculateSubtotal(activeTable.number);
      const tax = subtotal * FISCAL_ENGINE_CONFIG.TAX_RATE;
      const tip = subtotal * (tipPercent / 100);
      const total = subtotal + tax + tip;

      const transaction: RetailTransaction = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        tableNumber: activeTable.number,
        guestName: activeTable.occupantName || 'Walk-in Guest',
        items: getTableHistory(activeTable.number).flatMap(o => o.items),
        subtotal,
        tax,
        gratuity: tip,
        total,
        paymentMethod: selectedPayment,
        guestFeedback,
        guestRating,
        status: 'Settled'
      };

      const updatedTransactions = [transaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem('intelligence_transactions', JSON.stringify(updatedTransactions));

      // Remove orders for this table
      const remainingOrders = orders.filter(o => o.tableNumber !== activeTable.number);
      setOrders(remainingOrders);
      localStorage.setItem('intelligence_orders', JSON.stringify(remainingOrders));
      
      // Complete matching Guest Journey
      const matchingJourney = store.journeys.find(j => 
        j.tableNumber === activeTable.number && 
        (j.status === 'Arrived' || j.status === 'Seated')
      );
      if (matchingJourney) {
        const updatedJourneys = store.journeys.map(j => 
          j.id === matchingJourney.id ? { 
            ...j, 
            status: 'Completed' as const, 
            feedback: guestFeedback, 
            rating: guestRating 
          } : j
        );
        setJourneys(updatedJourneys);
        localStorage.setItem('intelligence_journeys', JSON.stringify(updatedJourneys));
        
        if (isValidUUID(profile?.id)) {
           supabaseSync.saveTransaction(profile!.id, transaction).catch(console.error);
           supabaseSync.updateGuestJourneyStatus(matchingJourney.id, 'Completed');
           // In a real app we'd also push the feedback/rating here
        }
      }

      // Reset table
      updateTable(activeTable.number, { 
        status: 'Available', 
        occupantName: '', 
        occupantCount: 0,
        paymentStartedAt: undefined,
        settledAt: new Date().toISOString()
      });

      const updatedTablesRes = tables.map(t => t.number === activeTable.number ? { 
        ...t, 
        status: 'Available' as const, 
        occupantName: '', 
        occupantCount: 0,
        paymentStartedAt: undefined,
        settledAt: new Date().toISOString()
      } : t);
      localStorage.setItem('intelligence_tables', JSON.stringify(updatedTablesRes));

      setActiveTable(null);
      setActiveTab('floor');
      setGuestFeedback('');
      setGuestRating(5);
      setOrderFeedback('Table Settled');
      setTimeout(() => setOrderFeedback(null), 3000);
    } catch (e) {
      console.error("Intelligence: Settlement failed", e);
    } finally {
      setIsSettling(false);
    }
  };

  const handleCancelOrder = (id: string) => {
    const order = orders.find(o => o.id === id) || draftOrders.find(o => o.id === id);
    if (!order) return;

    if (draftOrders.some(d => d.id === id)) {
      const updated = draftOrders.filter(d => d.id !== id);
      setDraftOrders(updated);
      localStorage.setItem('intelligence_draft_orders', JSON.stringify(updated));
    } else {
      const updated = orders.filter(o => o.id !== id);
      setOrders(updated);
      localStorage.setItem('intelligence_orders', JSON.stringify(updated));
      // In a real app, we'd also void in Supabase
    }
    setOrderFeedback('Order Voided');
    setTimeout(() => setOrderFeedback(null), 3000);
  };

  const handleQuickPay = async (priority: 'Normal' | 'High' | 'VIP') => {
    if (currentCart.length === 0) return;
    handlePlaceOrder(currentCart, 'Staff', priority, false);
    setActiveTab('settlement');
  };

  const [isCleaning, setIsCleaning] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [cleanFeedback, setCleanFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handlePurge = async () => {
    setIsCleaning(true);
    try {
      if (isValidUUID(profile?.id)) {
        await supabaseSync.purgeOperationalData(profile!.id);
      }
      
      // Clear local state
      setOrders([]);
      setDraftOrders([]);
      setTransactions([]);
      setJourneys([]);
      setInventory(INITIAL_INVENTORY);
      setTables(INITIAL_TABLES);
      
      // Clear localStorage
      localStorage.removeItem('intelligence_orders');
      localStorage.removeItem('intelligence_draft_orders');
      localStorage.removeItem('intelligence_transactions');
      localStorage.removeItem('intelligence_inventory');
      localStorage.removeItem('intelligence_assignments');
      localStorage.removeItem('intelligence_journeys');
      
      setCleanFeedback({ success: true, message: 'Operational Silo Purged Successfully' });
      setShowPurgeConfirm(false);
    } catch (error) {
      setCleanFeedback({ success: false, message: 'Purge Protocol Failed' });
      console.error(error);
    } finally {
      setIsCleaning(false);
      setTimeout(() => setCleanFeedback(null), 5000);
    }
  };

  const removeFromCart = (idx: number) => {
    setCurrentCart(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCartItem = (idx: number, updates: Partial<OrderItem>) => {
    setCurrentCart(prev => prev.map((item, i) => i === idx ? { ...item, ...updates } : item));
  };

  const refreshInventory = async () => {
    if (isValidUUID(profile?.id)) {
      store.setIsSyncing(true);
      try {
        const cloudData = await supabaseSync.pullInventory(profile!.id);
        if (cloudData && cloudData.length > 0) {
          setInventory(cloudData);
          localStorage.setItem('intelligence_inventory', JSON.stringify(cloudData));
        }
      } catch (e) {
        console.error("Intelligence: Manual inventory refresh failed", e);
      } finally {
        store.setIsSyncing(false);
      }
    }
  };

  const handleRemoveStaffProfile = async (id: string) => {
    if (!isValidUUID(profile?.id)) return;
    try {
      await supabaseSync.removeStaffProfile(id);
      const updatedStaff = staff.filter(s => s.id !== id);
      setStaff(updatedStaff);
      localStorage.setItem('intelligence_staff_list', JSON.stringify(updatedStaff));
    } catch (e) {
      console.error("Intelligence: Failed to remove staff profile", e);
    }
  };

  const handleManualAssign = (staffId: string, zoneId: string) => {
    const newAssignment: StaffAssignment = {
      staffId,
      zoneId,
      priority: 'High',
      timestamp: new Date().toISOString()
    };
    const updated = [...assignments.filter(a => a.staffId !== staffId), newAssignment];
    setAssignments(updated);
    localStorage.setItem('intelligence_assignments', JSON.stringify(updated));
    if (isValidUUID(profile?.id)) {
      supabaseSync.pushAssignments(profile!.id, updated).catch(console.error);
    }
  };

  return {
    activeTab, setActiveTab,
    activeTable, setActiveTable,
    activeSeat, setActiveSeat,
    currentCart, setCurrentCart,
    orderFeedback, setOrderFeedback,
    isSynthesizingCoverage, coverageInsight, handleSynthesizeCoverage,
    isSynthesizingService, serviceInsight, handleSynthesizeServiceEfficiency,
    isAnalyzingMaintenance, maintenanceBrief, handleMaintenanceAudit,
    isAssetsLoading, equipment,
    isRosterLoading, handleAddRosterItem, handleRemoveRosterItem,
    confirmModal, setConfirmModal,
    handleUpdateStaff,
    addToCart,
    removeFromCart,
    updateCartItem,
    handleFireDraft,
    handlePlaceOrder,
    handleSettleTable,
    handleCancelOrder,
    handleQuickPay,
    selectedPayment, setSelectedPayment,
    tipPercent, setTipPercent,
    guestFeedback, setGuestFeedback,
    guestRating, setGuestRating,
    isSettling,
    getTableHistory,
    calculateSubtotal,
    isCleaning, showPurgeConfirm, setShowPurgeConfirm, cleanFeedback, handlePurge,
    refreshInventory,
    handleRemoveStaffProfile,
    handleManualAssign,
    handleUpdateOrderStatus,
    serviceAlerts,
    rosterMode, setRosterMode,
    newRosterEmail, setNewRosterEmail,
    newRosterRole, setNewRosterRole
  };
};

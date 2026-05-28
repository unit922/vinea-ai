
import React, { useState, useEffect, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { ServiceOrder, InventoryItem, OrderItem, Table } from '../lib/types';
import { supabaseSync, generateUUID } from '../services/supabaseSync';
import { financialEngine } from '../services/FinancialEngine';
import AdjustablePOS from './AdjustablePOS';

interface BarStationViewProps {
  setIsAIChatOpen?: (open: boolean) => void;
  onNavigateToAcademy?: (tab: 'academy' | 'mixology' | 'signature' | 'roster' | 'pairing') => void;
  orders?: ServiceOrder[];
  inventory?: InventoryItem[];
  authMode?: 'demo' | 'secure';
}

const BarStationView: React.FC<BarStationViewProps> = ({ 
  setIsAIChatOpen, 
  onNavigateToAcademy,
  orders: propOrders = [],
  inventory: propInventory = [],
  authMode = 'demo'
}) => {
  const profile = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');

  const [orders, setOrders] = useState<ServiceOrder[]>(propOrders);
  const [inventory, setInventory] = useState<InventoryItem[]>(propInventory);

  useEffect(() => {
    if (propOrders) {
      setOrders(propOrders);
    }
  }, [propOrders]);

  useEffect(() => {
    if (propInventory) {
      setInventory(propInventory);
    }
  }, [propInventory]);

  const [showDirectOrder, setShowDirectOrder] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Stripe');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pendingOrderDetails, setPendingOrderDetails] = useState<{priority: 'Normal' | 'High' | 'VIP', isDraft: boolean, isPickup: boolean} | null>(null);
  const [directCart, setDirectCart] = useState<OrderItem[]>([]);
  const [activeSeat, setActiveSeat] = useState<number | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [selectedItemInfo, setSelectedItemInfo] = useState<InventoryItem | null>(null);
  const [prepGuide, setPrepGuide] = useState<{ instructions: string[], videoUrl: string, tips: string[] } | null>(null);
  const [loadingPrepGuide, setLoadingPrepGuide] = useState(false);

  const dummyTable: Table = {
    id: 'walk-in',
    number: 'Walk-in',
    capacity: 4,
    status: 'Occupied',
    x: 0,
    y: 0
  };

  const handlePOSOrder = React.useCallback(async (priority: 'Normal' | 'High' | 'VIP' = 'Normal', isDraft: boolean = false, isPickup: boolean = false) => {
    if (directCart.length === 0) return;

    // For Kiosk mode, we require payment first
    if (isKioskMode && !showPayment && !isDraft) {
      setPendingOrderDetails({ priority, isDraft, isPickup });
      setShowPayment(true);
      return;
    }

    const total = directCart.reduce((sum, item) => sum + ((item.priceAtOrder || 0) * item.quantity), 0);

    const newOrder: ServiceOrder = {
      id: generateUUID(),
      tableNumber: isPickup ? 'Pickup' : 'Walk-in',
      serverName: isPickup ? `Pickup: ${visitorName || 'Guest'}` : (visitorName || 'Walk-in Guest'),
      items: directCart.map(item => ({ ...item, id: generateUUID(), priceAtOrder: item.priceAtOrder || 0 })),
      status: 'Pending',
      timestamp: new Date().toISOString(),
      total,
      priority,
      isVisitor: true,
      source: isKioskMode ? 'Visitor' : 'Staff',
      isDraft
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('vinetelligence_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('vinea_orders', JSON.stringify(updatedOrders));

    // Create Transaction for paid orders (Kiosk or immediate walk-in pay)
    if (showPayment && !isDraft) {
      const transaction: RetailTransaction = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        tableNumber: isPickup ? 'Pickup' : 'Walk-in',
        guestName: visitorName || 'Walk-in Guest',
        items: newOrder.items,
        subtotal: total,
        tax: total * 0.08, // Using a standard 8% tax for bar
        gratuity: 0, // Kiosk/Walk-in basic doesn't force gratuity here, can be added to UI later
        total: total * 1.08,
        paymentMethod: selectedPaymentMethod as PaymentMethod,
        status: 'Settled'
      };

      const savedTransactions = localStorage.getItem('vinetelligence_transactions') || localStorage.getItem('vinea_transactions') || '[]';
      const transactions = JSON.parse(savedTransactions);
      const updatedTransactions = [transaction, ...transactions];
      localStorage.setItem('vinetelligence_transactions', JSON.stringify(updatedTransactions));
      localStorage.setItem('vinea_transactions', JSON.stringify(updatedTransactions));
      
      if (profile.id && profile.id !== 'demo-id') {
        supabaseSync.saveTransaction(profile.id, transaction).catch(e => console.error("Vinetelligence: Failed to sync transaction", e));
      }
    }

    // Push to Supabase
    if (profile.id && profile.id !== 'demo-id') {
      supabaseSync.saveOrder(profile.id, newOrder).catch(e => console.error("Vinetelligence: Failed to sync bar order", e));
    }
    
    // Clear cart and close
    setDirectCart([]);
    setVisitorName('');
    setShowDirectOrder(false);
    setShowPayment(false);
    setPendingOrderDetails(null);
    setActiveSeat(null);

    if (isKioskMode) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 8000);
    }
  }, [directCart, isKioskMode, showPayment, visitorName, orders, selectedPaymentMethod, profile.id]);

  const [synthesisProgress, setSynthesisProgress] = useState<{ step: string, detail: string } | null>(null);

  const handleProcessPayment = React.useCallback(async () => {
    if (isProcessingPayment) return;
    
    setIsProcessingPayment(true);
    setSynthesisProgress({ step: 'INITIALIZING', detail: 'Connecting to gateway...' });
    
    try {
      const total = directCart.reduce((sum, item) => sum + ((item.priceAtOrder || 0) * item.quantity), 0);
      
      const orderForSynthesis: ServiceOrder = {
        id: generateUUID(),
        tableNumber: pendingOrderDetails?.isPickup ? 'Pickup' : 'Walk-in',
        serverName: visitorName || 'Walk-in Guest',
        items: directCart.map(item => ({ ...item, priceAtOrder: item.priceAtOrder || 0 })),
        status: 'Pending',
        total,
        timestamp: new Date().toISOString(),
        priority: pendingOrderDetails?.priority || 'Normal'
      };

      const result = await financialEngine.processPayment(
        profile.id || 'demo-establishment',
        orderForSynthesis,
        selectedPaymentMethod.includes('Card') ? 'Card' : 'Digital',
        visitorName || 'Walk-in Guest',
        (step, detail) => {
          setSynthesisProgress({ step, detail });
        }
      );

      if (result) {
        if (pendingOrderDetails) {
          handlePOSOrder(pendingOrderDetails.priority, pendingOrderDetails.isDraft, pendingOrderDetails.isPickup);
        } else {
          handlePOSOrder();
        }
      } else {
        alert("Financial System synthesis failed. Please retry.");
      }
    } catch (e) {
      console.error("Payment Process Error:", e);
      alert("Terminal synthesis error. Please check node connectivity.");
    } finally {
      setIsProcessingPayment(false);
      setSynthesisProgress(null);
    }
  }, [directCart, visitorName, pendingOrderDetails, profile.id, selectedPaymentMethod, isProcessingPayment, handlePOSOrder]);

  const handleAddToCart = (item: InventoryItem) => {
    setDirectCart(prev => {
      const existingIndex = prev.findIndex(i => i.name === item.name && i.seat === activeSeat && !i.modifier);
      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1
        };
        return newCart;
      } else {
        return [...prev, {
          id: generateUUID(),
          name: item.name,
          quantity: 1,
          prepType: (item.category === 'Lunch' || item.category === 'Dinner') ? 'Complex' : (item.category === 'Spirit' ? 'Mix' : 'Pour'),
          status: 'Pending',
          priceAtOrder: item.price,
          seat: activeSeat,
          style: item.category
        }];
      }
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setDirectCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCartItem = (index: number, updates: Partial<OrderItem>) => {
    setDirectCart(prev => {
      const newCart = [...prev];
      if (newCart[index]) {
        newCart[index] = { ...newCart[index], ...updates };
      }
      return newCart;
    });
  };

  const renderPaymentInterface = () => {
    const total = directCart.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);
    const tax = total * 0.08;
    const finalTotal = total + tax;

    return (
      <div className="fixed inset-0 z-[600] bg-stone-950/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95">
          <div className="p-8 bg-stone-900 text-white flex justify-between items-center">
             <div>
                <h3 className="text-2xl font-serif font-black italic">Financial Gateway</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Authorize Order Retrieval</p>
             </div>
             <button onClick={() => { setShowPayment(false); setPendingOrderDetails(null); }} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <i className="fas fa-times"></i>
             </button>
          </div>

          <div className="p-8 space-y-8">
             <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-stone-400">
                   <span className="uppercase tracking-widest">Cart Yield</span>
                   <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-stone-400 italic">
                   <span className="uppercase tracking-widest">Bar Alpha (Tax 8%)</span>
                   <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-4xl font-serif font-black text-stone-900 pt-4 border-t border-stone-100">
                   <span className="italic tracking-tighter">Gross</span>
                   <span className="text-emerald-600">${finalTotal.toFixed(2)}</span>
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Select Gateway</h4>
                <div className="grid grid-cols-2 gap-3">
                   {['Stripe', 'PayPal', 'Cash', 'Crypto'].map(method => (
                      <button 
                        key={method}
                        onClick={() => setSelectedPaymentMethod(method)}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedPaymentMethod === method ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105' : 'border-stone-100 text-stone-400 opacity-60'}`}
                      >
                         <i className={`fas ${
                           method === 'Stripe' ? 'fa-credit-card' :
                           method === 'PayPal' ? 'fa-brands fa-paypal' :
                           method === 'Crypto' ? 'fa-bitcoin' : 'fa-money-bill-wave'
                         } text-lg`}></i>
                         <span className="text-[8px] font-black uppercase whitespace-nowrap">{method}</span>
                      </button>
                   ))}
                </div>
             </div>

             <button 
               onClick={handleProcessPayment}
               disabled={isProcessingPayment}
               className="w-full py-6 bg-stone-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden"
             >
                {isProcessingPayment ? (
                  <div className="flex flex-col items-center gap-2">
                     <i className="fas fa-spinner fa-spin"></i>
                     <span className="text-[8px] animate-pulse">{synthesisProgress?.detail}</span>
                  </div>
                ) : (
                  <>
                    <i className="fas fa-shield-check text-indigo-500"></i>
                    Process Authorize
                  </>
                )}
             </button>

             {isProcessingPayment && (
               <div className="space-y-3 pt-4 border-t border-stone-100">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black uppercase text-stone-400">Synthesis Handshake</span>
                     <span className="text-[9px] font-black text-indigo-500">{synthesisProgress?.step}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-indigo-500 transition-all duration-700" 
                        style={{ width: 
                           synthesisProgress?.step === 'INITIALIZING' ? '20%' : 
                           synthesisProgress?.step === 'EXTERNAL_HANDSHAKE' ? '45%' : 
                           synthesisProgress?.step === 'LEDGER_VERIFICATION' ? '70%' : 
                           synthesisProgress?.step === 'SYNTHESIZING' ? '90%' : '100%' 
                        }} 
                     />
                  </div>
               </div>
             )}
             
             <p className="text-center text-[8px] font-black uppercase tracking-widest text-stone-400 opacity-60 italic">
                Secure 256-bit Neural Encryption Active
             </p>
          </div>
        </div>
      </div>
    );
  };

  const posCartItems: OrderItem[] = directCart;

  // UI State
  const showBatchView = true;

  useEffect(() => {
    const handleStorageChange = () => {
      const savedOrders = localStorage.getItem('vinetelligence_orders') || localStorage.getItem('vinea_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
      
      const savedInventory = localStorage.getItem('vinetelligence_inventory') || localStorage.getItem('vinea_inventory');
      if (savedInventory) setInventory(JSON.parse(savedInventory));
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleFetchPrepGuide = async (name: string) => {
    setLoadingPrepGuide(true);
    setPrepGuide(null);
    try {
      const guide = await geminiService.getCocktailPreparationGuide(name);
      setPrepGuide(guide);
    } catch (e) {
      console.error("Vinetelligence: Failed to fetch prep guide", e);
    } finally {
      setLoadingPrepGuide(false);
    }
  };

  const tableIntelligence = useMemo(() => {
    const getPrice = (name: string) => inventory.find(inv => inv.name === name)?.price || 15;
    const groups: Record<string, { orders: ServiceOrder[], total: number, items: OrderItem[], source: string, timestamp: string, status: string }> = {};
    
    orders.filter(o => 
      (o.status === 'Pending' || o.status === 'Prepping' || o.status === 'Ready' || o.status === 'Delivered')
    ).forEach(order => {
      const displayId = order.tableNumber ? `Table ${order.tableNumber}` : (order.serverName.startsWith('Pickup:') ? order.serverName.replace('Pickup: ', '') : order.serverName);
      const key = `${displayId}:::${order.source}`;
      
      if (!groups[key]) {
        groups[key] = { orders: [], total: 0, items: [], source: order.source, timestamp: order.timestamp, status: order.status };
      }
      
      groups[key].orders.push(order);
      // Overall group status should be the "highest priority" 
      if (order.status === 'Pending' && groups[key].status !== 'Pending') groups[key].status = 'Pending';

      order.items.forEach(item => {
        groups[key].total += (item.priceAtOrder || getPrice(item.name)) * item.quantity;
        const existing = groups[key].items.find(i => i.name === item.name && i.style === item.style && i.modifier === item.modifier);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          groups[key].items.push({ ...item });
        }
      });
    });
    
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [orders, inventory]);

  const consolidatedBatch = useMemo(() => {
    const batches: Record<string, { name: string, quantity: number, category: string, modifier?: string }> = {};
    orders.filter(o => o.status === 'Pending' || o.status === 'Prepping').forEach(order => {
      order.items.forEach(item => {
        const key = `${item.name}-${item.style}-${item.modifier || ''}`;
        if (!batches[key]) {
          batches[key] = { name: item.name, quantity: 0, category: item.style || '', modifier: item.modifier };
        }
        batches[key].quantity += item.quantity;
      });
    });
    return Object.values(batches).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.stock <= item.minStock);
  }, [inventory]);

  const handleBumpTable = (key: string) => {
    const [displayId, source] = key.split(':::');
    
    // First, identify the orders that will be updated
    const ordersToUpdate = orders.filter(o => {
      const orderDisplay = o.tableNumber ? `Table ${o.tableNumber}` : (o.serverName.startsWith('Pickup:') ? o.serverName.replace('Pickup: ', '') : o.serverName);
      return orderDisplay === displayId && o.source === source && (o.status === 'Pending' || o.status === 'Prepping');
    });

    if (ordersToUpdate.length === 0) return;

    // Deduct inventory
    setInventory(prevInv => {
      const nextInv = [...prevInv];
      ordersToUpdate.forEach(order => {
        order.items.forEach(item => {
          const invIdx = nextInv.findIndex(inv => inv.name === item.name);
          if (invIdx >= 0) {
            nextInv[invIdx] = {
              ...nextInv[invIdx],
              stock: Math.max(0, nextInv[invIdx].stock - item.quantity),
              consumed: (nextInv[invIdx].consumed || 0) + item.quantity
            };
          }
        });
      });
      // Persist inventory
      localStorage.setItem('vinetelligence_inventory', JSON.stringify(nextInv));
      localStorage.setItem('vinea_inventory', JSON.stringify(nextInv));
      return nextInv;
    });

    const updatedOrders = orders.map(o => {
      const orderDisplay = o.tableNumber ? `Table ${o.tableNumber}` : (o.serverName.startsWith('Pickup:') ? o.serverName.replace('Pickup: ', '') : o.serverName);
      
      if (orderDisplay === displayId && o.source === source && (o.status === 'Pending' || o.status === 'Prepping')) {
        const isWalkInOrPickup = displayId.includes('Walk-in') || displayId.includes('Pickup') || !displayId.includes('Table');
        
        const updatedOrder: ServiceOrder = { 
          ...o, 
          status: (isWalkInOrPickup ? 'Delivered' : 'Ready'),
          readyAt: new Date().toISOString(),
          deliveredAt: isWalkInOrPickup ? new Date().toISOString() : undefined,
          items: o.items.map(item => ({ ...item, status: (isWalkInOrPickup ? 'Served' : 'Ready') }))
        };
        // Push to Supabase
        supabaseSync.saveOrder(profile.id || 'demo', updatedOrder).catch(e => console.error("Vinetelligence: Failed to sync order update", e));
        return updatedOrder;
      }
      return o;
    });
    setOrders(updatedOrders);
    localStorage.setItem('vinetelligence_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('vinea_orders', JSON.stringify(updatedOrders));

    // Automatically complete journey for Walk-in/Pickup guests
    const isWalkIn = displayId.includes('Walk-in') || displayId.includes('Pickup') || !displayId.includes('Table');
    if (isWalkIn) {
      const savedJourneys = localStorage.getItem('vinetelligence_journeys') || localStorage.getItem('vinea_journeys');
      if (savedJourneys) {
        try {
          const journeys: GuestJourney[] = JSON.parse(savedJourneys);
          const tableNum = displayId.includes('Table') ? displayId.replace('Table ', '') : 'Walk-in';
          const journey = journeys.find(j => 
            (j.tableNumber === tableNum && j.status !== 'Completed') ||
            (displayId.includes(j.profile.name) && j.status !== 'Completed')
          );
          if (journey) {
            const updatedJourneys = journeys.map(j => j.id === journey.id ? { ...j, status: 'Completed' as const } : j);
            localStorage.setItem('vinetelligence_journeys', JSON.stringify(updatedJourneys));
            localStorage.setItem('vinea_journeys', JSON.stringify(updatedJourneys));
            supabaseSync.pushJourney(profile.id || 'demo', { ...journey, status: 'Completed' as const }).catch(e => console.error("Vinetelligence: Failed to sync journey completion", e));
          }
        } catch (e) { console.error("Vinetelligence: Failed to auto-complete journey", e); }
      }
    }

    window.dispatchEvent(new Event('storage'));
  };

  const handleClearSession = (key: string) => {
    const [displayId, source] = key.split(':::');
    
    const updatedOrders = orders.map(o => {
      const orderDisplay = o.tableNumber ? `Table ${o.tableNumber}` : (o.serverName.startsWith('Pickup:') ? o.serverName.replace('Pickup: ', '') : o.serverName);
      if (orderDisplay === displayId && o.source === source) {
        const updatedOrder: ServiceOrder = { 
          ...o, 
          status: 'Completed',
          items: o.items.map(item => ({ ...item, status: 'Completed' }))
        };
        // Sync completion
        supabaseSync.saveOrder(profile.id || 'demo', updatedOrder).catch(e => console.error("Vinetelligence: Failed to sync session completion", e));
        return updatedOrder;
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem('vinetelligence_orders', JSON.stringify(updatedOrders));
    localStorage.setItem('vinea_orders', JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event('storage'));
  };

  const renderOrderCard = (key: string, data: { orders: ServiceOrder[], total: number, items: OrderItem[], source: string, timestamp: string, status: string }) => {
    const [displayId, source] = key.split(':::');
    const isVisitor = source === 'Visitor';
    const isWalkIn = displayId.includes('Walk-in') || !displayId.includes('Table');
    const allDelivered = data.orders.every(o => o.status === 'Delivered' || o.status === 'Ready');
    
    return (
      <div key={key} className={`bg-white border rounded-[2rem] md:rounded-[2.5rem] shadow-xl flex flex-col hover:shadow-2xl transition-all group overflow-hidden border-stone-100 ${isVisitor ? 'ring-2 ring-blue-500/20' : ''} ${allDelivered ? 'opacity-75' : ''}`}>
        <div className={`p-4 md:p-5 flex justify-between items-center ${allDelivered ? 'bg-emerald-600 text-white' : (isWalkIn ? 'bg-indigo-600 text-white' : (isVisitor ? 'bg-blue-600 text-white' : 'bg-stone-900 text-white'))}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-2xl font-serif font-black truncate max-w-[150px] md:max-w-[200px] block">
                  {displayId}
                </span>
                {isWalkIn && (
                  <span className="text-[7px] md:text-[8px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full">Active Tab</span>
                )}
              </div>
              <p className="text-[10px] md:text-xs font-black uppercase opacity-60 mt-0.5">{allDelivered ? 'All Rounds Served' : `Fired ${data.timestamp}`}</p>
            </div>
            <div className="flex items-center gap-3">
               {isVisitor && <i className="fas fa-tablet-screen-button opacity-40"></i>}
               {allDelivered && (
                 <button 
                   onClick={() => handleClearSession(key)}
                   className="w-10 h-10 rounded-xl bg-white/20 hover:bg-stone-900 hover:text-white flex items-center justify-center transition-all"
                   title="Close Tab / Leave"
                 >
                   <i className="fas fa-door-open text-xs"></i>
                 </button>
               )}
            </div>
        </div>

        <div className="flex-1 p-4 md:p-5 space-y-3">
            {data.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-stone-50 pb-2 last:border-0">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl border flex items-center justify-center text-xs md:text-sm font-black ${isVisitor ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
                      {item.quantity}x
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm md:text-base font-bold text-stone-800 line-clamp-1 ${allDelivered ? 'line-through opacity-50' : ''}`}>{item.name}</span>
                    {item.modifier && (
                      <span className="text-[8px] md:text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">
                        {item.modifier}
                      </span>
                    )}
                  </div>
                </div>
                {!allDelivered && (
                  <button 
                    onClick={() => {
                      const invItem = inventory.find(inv => inv.name === item.name);
                      if (invItem) setSelectedItemInfo(invItem);
                    }}
                    className="w-8 h-8 rounded-lg bg-stone-50 text-stone-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center shrink-0"
                    title="How to Prepare"
                  >
                    <i className="fas fa-shaker text-xs"></i>
                  </button>
                )}
              </div>
            ))}
        </div>

        <div className="p-4 md:p-5 bg-stone-50/50 border-t border-stone-100 gap-3 flex">
            {!allDelivered ? (
              <button 
                onClick={() => handleBumpTable(key)} 
                className={`flex-1 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isVisitor ? 'bg-blue-900 text-white hover:bg-emerald-500 hover:text-stone-900' : 'bg-stone-900 text-white hover:bg-emerald-500 hover:text-stone-900'}`}
              >
                Mark Ready
              </button>
            ) : (
              <div className="flex-1 flex gap-2">
                <button 
                  onClick={() => {
                    setVisitorName(displayId.replace('Walk-in: ', ''));
                    setShowDirectOrder(true);
                  }}
                  className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest"
                >
                  New Round
                </button>
                <button 
                  onClick={() => {
                    setPendingOrderDetails({ priority: 'Normal', isDraft: false, isPickup: false });
                    setVisitorName(displayId.replace('Walk-in: ', ''));
                    // In a real app we'd load the whole session into the cart for pay, 
                    // but for now we'll just trigger success
                    handleClearSession(key);
                  }}
                  className="px-6 py-4 bg-stone-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest"
                >
                  Settle / Clear
                </button>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderOrderingInterface = () => {
    if (showSuccess) {
      return (
        <div className="flex-1 bg-white rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
           <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl shadow-lg shadow-emerald-500/20">
              <i className="fas fa-check-circle"></i>
           </div>
           <div className="space-y-4">
              <h3 className="text-4xl font-serif font-black text-stone-900 italic">Order Received</h3>
              <p className="text-stone-500 text-lg max-w-md mx-auto leading-relaxed italic">
                Your selection has been transmitted to the bar command. We'll have it ready for you shortly.
              </p>
           </div>
           <button 
             onClick={() => setShowSuccess(false)}
             className="px-12 py-5 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
           >
             Start New Order
           </button>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col animate-in fade-in duration-500">
         <div className="p-6 bg-stone-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-stone-900 shadow-lg shadow-indigo-500/20">
              <i className="fas fa-tablet-screen-button text-xl"></i>
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold italic tracking-tight">Guest Ordering Terminal</h3>
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mt-0.5">Silo: {profile.establishmentName || 'Vinetelligence Main'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
             <i className="fas fa-user text-indigo-500 text-xs"></i>
             <input 
               type="text" 
               value={visitorName} 
               onChange={(e) => setVisitorName(e.target.value)} 
               placeholder="Your Name..." 
               className="bg-transparent border-none outline-none font-bold text-sm placeholder:text-white/20 w-40"
             />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <AdjustablePOS 
            table={dummyTable}
            inventory={inventory}
            currentCart={posCartItems}
            activeSeat={activeSeat}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateItem={handleUpdateCartItem}
            onSetActiveSeat={(seat) => setActiveSeat(seat)}
            onPlaceOrder={(priority, isDraft, isPickup) => handlePOSOrder(priority, isDraft, isPickup)}
            isKiosk={isKioskMode}
            onPayNow={(priority, isPickup) => {
              setPendingOrderDetails({ priority, isDraft: false, isPickup });
              setShowPayment(true);
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col relative selection:bg-indigo-500 selection:text-white bg-stone-50 p-3 md:p-6 min-h-screen touch-scrolling overflow-y-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-4 md:mb-6 shrink-0 gap-4">
        <div className="flex items-center gap-4 md:gap-6">
           <div className="space-y-1">
              <div className="flex items-center gap-2 md:gap-3">
                 <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${isKioskMode ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-indigo-500 shadow-[0_0_10px_#6366f1]'}`}></div>
                 <h2 className="text-lg md:text-2xl font-black text-stone-900 uppercase tracking-tight">
                   {isKioskMode ? 'Self-Service' : 'Bar Command'}
                 </h2>
              </div>
              <p className="text-[8px] md:text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">
                {isKioskMode ? 'Guest Portal' : 'Real-time Preparation'}
              </p>
           </div>
           
          {!isKioskMode && (
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => setIsAIChatOpen?.(true)}
                  className="hidden sm:flex items-center gap-3 px-6 py-3 bg-stone-900 text-white rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 hover:bg-stone-800 border border-white/10 group"
               >
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                     <i className="fas fa-robot text-stone-900 text-xs"></i>
                  </div>
                  <span>Neural Coach</span>
               </button>
               <button 
                  onClick={() => onNavigateToAcademy?.('mixology')}
                  className="hidden sm:flex items-center gap-3 px-6 py-3 bg-indigo-500 text-white rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-xl border border-indigo-400/50 hover:bg-indigo-400 group"
               >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                     <i className="fas fa-graduation-cap text-xs text-white"></i>
                  </div>
                  <span>Mixology Academy</span>
               </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
           {!isKioskMode && (
             <button 
               onClick={() => setShowDirectOrder(true)}
               className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
             >
                <i className="fas fa-plus"></i> Walk-in
             </button>
           )}
           <button 
             onClick={() => {
               setIsKioskMode(!isKioskMode);
               setShowSuccess(false);
             }}
             className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
               isKioskMode ? 'bg-stone-900 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
             }`}
           >
              <i className={`fas ${isKioskMode ? 'fa-user-tie' : 'fa-tablet-screen-button'}`}></i>
              {isKioskMode ? 'Staff' : 'Kiosk'}
           </button>
        </div>
      </div>

      {authMode === 'demo' && (
        <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 p-4 flex items-center justify-between rounded-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-500">
              Bar Simulation Active: Using Synthetic Order Flow
            </p>
          </div>
          <p className="text-[9px] italic text-indigo-500/60">
            Connect a production profile to view live bar operations.
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 overflow-hidden">
        {isKioskMode ? (
          renderOrderingInterface()
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {tableIntelligence.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-stone-50 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-stone-200 opacity-60">
                 <i className="fas fa-shaker text-4xl text-stone-200 mb-4 animate-bounce"></i>
                 <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Registry Dormant</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10 touch-scrolling">
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6">
                  {tableIntelligence.map(([key, data]) => renderOrderCard(key, data))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isKioskMode && (showBatchView || lowStockItems.length > 0) && (
          <div className="w-full lg:w-80 flex flex-col shrink-0 gap-4 md:gap-6 animate-in slide-in-from-right-4 overflow-y-auto lg:overflow-visible custom-scrollbar">
            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-[2rem] md:rounded-[2.5rem] shadow-xl flex flex-col overflow-hidden shrink-0">
                <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest">Stock Alerts</h3>
                  <i className="fas fa-triangle-exclamation animate-pulse"></i>
                </div>
                <div className="p-6 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {lowStockItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedItemInfo(item)}
                      className="flex justify-between items-center p-4 bg-white border border-indigo-100 rounded-2xl cursor-pointer hover:bg-indigo-100 transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-800 truncate">{item.name}</p>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                          {(item.stock || 0).toFixed(2)} {item.unit} Left
                        </p>
                      </div>
                      <i className="fas fa-circle-info text-indigo-300 group-hover:text-indigo-600 transition-colors"></i>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Batch View */}
            {showBatchView && consolidatedBatch.length > 0 && (
              <div className="flex-1 bg-white border border-stone-200 rounded-[2.5rem] shadow-xl flex flex-col overflow-hidden">
                <div className="p-6 bg-stone-950 text-white flex justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest">Need to Make</h3>
                  <i className="fas fa-layer-group text-stone-700"></i>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                  {consolidatedBatch.map((item, i) => {
                    const invItem = inventory.find(inv => inv.name === item.name);
                    return (
                      <div 
                        key={i} 
                        onClick={() => invItem && setSelectedItemInfo(invItem)}
                        className={`flex justify-between items-center p-4 bg-stone-50 border border-stone-100 rounded-2xl group cursor-pointer hover:bg-stone-100 transition-all ${invItem?.stock <= invItem?.minStock ? 'border-l-4 border-l-indigo-500' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-200 flex items-center justify-center text-xl font-black text-stone-900 group-hover:bg-indigo-500 transition-colors">
                            {item.quantity}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-stone-800 truncate">{item.name}</p>
                            <p className="text-[10px] font-black text-stone-400 uppercase">
                                {item.category} {item.modifier && <span className="text-indigo-500 ml-1">[{item.modifier}]</span>}
                            </p>
                          </div>
                        </div>
                        <i className="fas fa-circle-info text-stone-300 group-hover:text-stone-600 transition-colors"></i>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Info Modal */}
      {showPayment && renderPaymentInterface()}
      {selectedItemInfo && (
        <div className="fixed inset-0 z-[500] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col">
            <div className={`p-8 flex justify-between items-center ${
              selectedItemInfo.category === 'Wine' ? 'bg-indigo-600' :
              selectedItemInfo.category === 'Spirit' ? 'bg-indigo-950' : 'bg-stone-900'
            } text-white`}>
              <div>
                <h3 className="text-2xl font-serif font-bold italic">{selectedItemInfo.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{selectedItemInfo.category} Intelligence</p>
              </div>
              <button onClick={() => setSelectedItemInfo(null)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Current Stock</p>
                  <p className="text-2xl font-black text-stone-900">{(selectedItemInfo.stock || 0).toFixed(2)} <span className="text-xs text-stone-400">{selectedItemInfo.unit}</span></p>
                </div>
                <div className="p-5 bg-stone-50 rounded-2xl border border-stone-100">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Price Point</p>
                  <p className="text-2xl font-black text-stone-900">${selectedItemInfo.price}</p>
                </div>
              </div>

              {selectedItemInfo.description && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Sommelier's Notes</h4>
                  <p className="text-stone-600 leading-relaxed text-sm italic">"{selectedItemInfo.description}"</p>
                </div>
              )}

              <div className="space-y-4">
                <button 
                  onClick={() => handleFetchPrepGuide(selectedItemInfo.name)}
                  disabled={loadingPrepGuide}
                  className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loadingPrepGuide ? (
                    <i className="fas fa-spinner animate-spin"></i>
                  ) : (
                    <i className="fas fa-shaker text-white"></i>
                  )}
                  {loadingPrepGuide ? 'Consulting Master Mixologist...' : 'How to Prepare (AI Guide)'}
                </button>

                {prepGuide && (
                  <div className="bg-stone-50 rounded-3xl p-6 border border-stone-100 space-y-6 animate-in slide-in-from-bottom-4 relative">
                    <button 
                      onClick={() => setPrepGuide(null)}
                      className="absolute top-4 right-4 w-8 h-8 bg-stone-200 hover:bg-stone-300 text-stone-600 rounded-full flex items-center justify-center transition-all"
                      title="Close Guide"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>

                    {prepGuide.imageUrl && (
                      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-stone-200 shadow-sm">
                        <img 
                          src={prepGuide.imageUrl} 
                          alt={selectedItemInfo.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                        <i className="fas fa-list-ol text-indigo-500"></i> Preparation Steps
                      </h4>
                      <ul className="space-y-2">
                        {prepGuide.instructions.map((step, idx) => (
                          <li key={idx} className="text-xs text-stone-700 flex gap-3">
                            <span className="font-black text-indigo-500 shrink-0">{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {prepGuide.tips.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 flex items-center gap-2">
                          <i className="fas fa-lightbulb text-indigo-500"></i> Pro Tips
                        </h4>
                        <ul className="space-y-2">
                          {prepGuide.tips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-stone-600 italic flex gap-3">
                              <i className="fas fa-check text-[8px] mt-1 text-emerald-500 shrink-0"></i>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {prepGuide.videoUrl && (
                      <div className="pt-2">
                        <a 
                          href={prepGuide.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                              <i className="fas fa-play text-xs"></i>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Video Tutorial</p>
                              <p className="text-[9px] text-indigo-600 font-bold">Watch on YouTube</p>
                            </div>
                          </div>
                          <i className="fas fa-external-link-alt text-indigo-300 group-hover:text-indigo-600 transition-colors"></i>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <i className="fas fa-leaf"></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Sustainability</p>
                    <p className="text-lg font-black text-emerald-900">{selectedItemInfo.sustainabilityScore || '85'} Alpha</p>
                  </div>
                </div>
                <div className="w-24 h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${selectedItemInfo.sustainabilityScore || 85}%` }}></div>
                </div>
              </div>

              <button 
                onClick={() => { setSelectedItemInfo(null); setPrepGuide(null); }}
                className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl"
              >
                Return to Station
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speed Dial / Manual Order Modal (Only used in Staff Mode) */}
      {showDirectOrder && !isKioskMode && (
        <div className="fixed inset-0 z-[400] bg-stone-950/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-8 lg:p-12 animate-in fade-in">
           <div className="bg-white w-full max-w-7xl h-full rounded-none md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/10">
              <div className="p-4 md:p-8 flex justify-between items-center shrink-0 bg-stone-900 text-white">
                 <div className="flex items-center gap-6">
                    <h3 className="text-3xl font-serif font-bold italic tracking-tight">
                       Point of Sale Protocol
                    </h3>
                    <div className="h-8 w-[1px] bg-white/20"></div>
                    <div className="flex items-center gap-3">
                       <i className="fas fa-user text-indigo-500"></i>
                       <input 
                         type="text" 
                         value={visitorName} 
                         onChange={(e) => setVisitorName(e.target.value)} 
                         placeholder="Guest Name / Pickup ID..." 
                         className="bg-transparent border-none outline-none font-bold text-xl placeholder:text-white/20 w-64"
                       />
                    </div>
                 </div>
                 <button onClick={() => setShowDirectOrder(false)} className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10 active:scale-90">
                    <i className="fas fa-times text-xl"></i>
                 </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                 <AdjustablePOS 
                   table={dummyTable}
                   inventory={inventory}
                   currentCart={posCartItems}
                   activeSeat={activeSeat}
                   onAddToCart={handleAddToCart}
                   onRemoveFromCart={handleRemoveFromCart}
                   onUpdateItem={handleUpdateCartItem}
                   onSetActiveSeat={(seat) => setActiveSeat(seat)}
                   onPlaceOrder={(priority, isDraft, isPickup) => handlePOSOrder(priority, isDraft, isPickup)}
                   onPayNow={(priority, isPickup) => {
                     setPendingOrderDetails({ priority, isDraft: false, isPickup });
                     setShowPayment(true);
                   }}
                   onNavigateToAcademy={onNavigateToAcademy}
                 />
              </div>
           </div>
        </div>
      )}
      {/* Floating AI Coach Trigger - Mobile/Compact */}
      {!isKioskMode && (
        <button 
          onClick={() => setIsAIChatOpen?.(true)}
          className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-stone-900 text-white rounded-full shadow-2xl flex items-center justify-center border border-white/10 hover:bg-stone-800 active:scale-90 transition-all sm:hidden"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <i className="fas fa-robot text-stone-900"></i>
          </div>
        </button>
      )}
    </div>
  );
};

export default BarStationView;

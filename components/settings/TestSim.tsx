import React, { useState, useEffect } from 'react';
import { InventoryItem, ServiceOrder, RetailTransaction } from '../../lib/types';
import { INITIAL_INVENTORY } from '../../constants';
import { supabaseSync } from '../../services/supabaseSync';

interface TestSimProps {
  onClose: () => void;
  restaurantName: string;
}

interface ToastLogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'incoming' | 'outgoing';
  title: string;
  message: string;
  payload?: unknown;
}

const TestSim: React.FC<TestSimProps> = ({ onClose, restaurantName }) => {
  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<'toast_pos' | 'wine_locker' | 'chowly_sync'>('toast_pos');

  // ==========================================
  // WINE LOCKER / ORIGINAL SIMULATOR STATE
  // ==========================================
  const [inventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('vinetelligence_inventory') || localStorage.getItem('vinea_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  const [cart, setCart] = useState<{item: InventoryItem, qty: number}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const calculateTotal = () => cart.reduce((sum, c) => sum + (c.item.price * c.qty), 0);

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const total = calculateTotal();
      const taxAmount = total * 0.08; 
      const finalAmount = total + taxAmount;
      const orderId = `SIM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const order: ServiceOrder = {
        id: orderId,
        tableNumber: 'SIM-Kiosk',
        items: cart.map(c => ({
          name: c.item.name,
          quantity: c.qty,
          priceAtOrder: c.item.price,
          category: c.item.category
        })),
        status: 'received',
        priority: 'Normal',
        timestamp: new Date().toISOString(),
        orderSource: 'Visitor',
        subtotal: total
      };

      const tx: RetailTransaction = {
        id: `TX-${orderId}`,
        orderId: orderId,
        amount: finalAmount,
        type: 'Retail',
        method: 'Credit & Debit Card',
        timestamp: new Date().toISOString(),
        status: 'Completed',
        metadata: {
          tax: taxAmount,
          subtotal: total,
          simulator: true
        }
      };

      await supabaseSync.saveOrder(order);
      await supabaseSync.saveTransaction(tx);

      const currentInvStr = localStorage.getItem('vinetelligence_inventory') || localStorage.getItem('vinea_inventory') || '[]';
      const currentInv = JSON.parse(currentInvStr);
      const updatedInv = currentInv.map((invItem: InventoryItem) => {
        const cartItem = cart.find(c => c.item.id === invItem.id);
        if (cartItem) {
          return { 
            ...invItem, 
            stock: Math.max(0, invItem.stock - cartItem.qty),
            consumed: (invItem.consumed || 0) + cartItem.qty
          };
        }
        return invItem;
      });

      localStorage.setItem('vinetelligence_inventory', JSON.stringify(updatedInv));
      localStorage.setItem('vinea_inventory', JSON.stringify(updatedInv));
      window.dispatchEvent(new Event('storage'));

      setShowSuccess(true);
      setCart([]);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Simulator Sync Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // TOAST POS INTEGRATION MODULE STATE
  // ==========================================
  const [selectedLocation, setSelectedLocation] = useState<'boston' | 'nyc'>('boston');
  const [avocadoAvailable, setAvocadoAvailable] = useState<boolean>(true);
  const [burgerAvailable, setBurgerAvailable] = useState<boolean>(true);
  const [selectedTemp, setSelectedTemp] = useState<'opt_med_rare_001' | 'opt_medium_002'>('opt_med_rare_001');
  const [selectedAddons, setSelectedAddons] = useState<{ bacon: boolean; avocado: boolean }>({ bacon: true, avocado: false });
  const [toastLogs, setToastLogs] = useState<ToastLogEntry[]>([]);
  const [processedEventIds, setProcessedEventIds] = useState<string[]>([]);
  const [isMenuSyncing, setIsMenuSyncing] = useState(false);
  const [lastMenuSyncTime, setLastMenuSyncTime] = useState<string>('2026-07-16T21:40:00Z');
  const [showConsolePayload, setShowConsolePayload] = useState<'order' | 'webhook' | 'menu'>('order');
  const [toastOrderSuccess, setToastOrderSuccess] = useState(false);
  const [recentOrderSuffix, setRecentOrderSuffix] = useState<string>('9942');

  // ==========================================
  // CHOWLY SYNC & COMMISSION ENGINE STATE
  // ==========================================
  const [commissionMarkup, setCommissionMarkup] = useState<number>(20);
  const [selectedChowlyItem, setSelectedChowlyItem] = useState<'burger' | 'wine'>('wine');
  const [simulatedOrderChannel, setSimulatedOrderChannel] = useState<'chowlydirect' | 'doordash' | 'ubereats' | 'grubhub'>('doordash');
  const [chowlyLogs, setChowlyLogs] = useState<ToastLogEntry[]>([]);
  const [chowlyOrderSuccess, setChowlyOrderSuccess] = useState(false);
  const [activeChowlyPayload, setActiveChowlyPayload] = useState<'price_sheet' | 'webhook_sync' | 'payout_analysis'>('price_sheet');
  const [wineAvailable, setWineAvailable] = useState<boolean>(true);

  // Helper to add Chowly specific logs
  const addChowlyLog = (type: 'info' | 'success' | 'warning' | 'error' | 'incoming' | 'outgoing', title: string, message: string) => {
    setChowlyLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        title,
        message
      },
      ...prev
    ]);
  };

  // Get current channel pricing list based on base prices & markups
  const getChowlyPrices = () => {
    const basePrice = selectedChowlyItem === 'burger' ? burgerBasePrice : 180.00;
    const markupFactor = 1 + (commissionMarkup / 100);
    return {
      base: basePrice,
      chowlydirect: basePrice, // 1st party commission-free, no markup
      doordash: parseFloat((basePrice * markupFactor).toFixed(2)),
      ubereats: parseFloat((basePrice * markupFactor).toFixed(2)),
      grubhub: parseFloat((basePrice * markupFactor).toFixed(2))
    };
  };

  // Listen for wine depletion or burger depletion to simulate real-time universal 86 propagation
  useEffect(() => {
    if (activeTab === 'chowly_sync') {
      const statusText = wineAvailable ? 'RESTOCKED / BACK IN STOCK' : 'OUT OF STOCK / 86\'D';
      addChowlyLog('warning', 'Toast Webhook Intercepted', `Caymus Cabernet Sauvignon status changed to ${statusText} on Toast POS.`);
      
      setTimeout(() => {
        addChowlyLog('outgoing', 'Broadcasting Channel Catalog Update', `Pushed item update isAvailable=${wineAvailable} to connected channels.`);
        setTimeout(() => {
          addChowlyLog('success', 'Channels Fully Synchronized', `Successfully synced availability across DoorDash, UberEats, Grubhub, and Chowly Direct (latency: 18ms).`);
        }, 450);
      }, 300);
    }
  }, [wineAvailable, activeTab]);

  useEffect(() => {
    if (activeTab === 'chowly_sync') {
      const statusText = burgerAvailable ? 'RESTOCKED / BACK IN STOCK' : 'OUT OF STOCK / 86\'D';
      addChowlyLog('warning', 'Toast Webhook Intercepted', `Classic Cheeseburger status changed to ${statusText} on Toast POS.`);
      
      setTimeout(() => {
        addChowlyLog('outgoing', 'Broadcasting Channel Catalog Update', `Pushed item update isAvailable=${burgerAvailable} to connected channels.`);
        setTimeout(() => {
          addChowlyLog('success', 'Channels Fully Synchronized', `Successfully synced availability across DoorDash, UberEats, Grubhub, and Chowly Direct (latency: 14ms).`);
        }, 450);
      }, 300);
    }
  }, [burgerAvailable, activeTab]);

  // Handle high-fidelity Order Simulation with exact commission payout math breakdown
  const handleSimulateChowlyOrder = async () => {
    setIsProcessing(true);
    const prices = getChowlyPrices();
    const isItemInStock = selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable;

    if (!isItemInStock) {
      addChowlyLog('error', 'Simulation Aborted', `Cannot place order. Target item is currently 86'd across channels.`);
      setIsProcessing(false);
      return;
    }

    const itemName = selectedChowlyItem === 'burger' ? 'Classic Cheeseburger' : 'Caymus Cabernet Sauvignon';
    const channelNameMap = {
      chowlydirect: 'Chowly Direct (1st-Party)',
      doordash: 'DoorDash',
      ubereats: 'UberEats',
      grubhub: 'Grubhub'
    };

    const commissionRates = {
      chowlydirect: 0.0,
      doordash: 0.25,
      ubereats: 0.30,
      grubhub: 0.20
    };

    const customerPaid = prices[simulatedOrderChannel];
    const commissionRate = commissionRates[simulatedOrderChannel];
    const commissionFee = parseFloat((customerPaid * commissionRate).toFixed(2));
    const netRevenue = parseFloat((customerPaid - commissionFee).toFixed(2));
    const profitWithoutMarkup = parseFloat((prices.base * (1 - commissionRate)).toFixed(2));
    const marginRecovered = parseFloat((netRevenue - profitWithoutMarkup).toFixed(2));

    addChowlyLog('incoming', `Incoming Marketplace Purchase (${channelNameMap[simulatedOrderChannel]})`, `Customer completed purchase for ${itemName} at marked-up price of $${customerPaid.toFixed(2)}.`);

    setTimeout(() => {
      addChowlyLog('outgoing', 'Injecting Order to POS Gateway', `Transferred order payload into Toast POS network under mapping location_${selectedLocation === 'boston' ? 'boston' : 'nyc'}.`);
      
      setTimeout(async () => {
        const orderId = `CHOW-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const order: ServiceOrder = {
          id: orderId,
          tableNumber: `${channelNameMap[simulatedOrderChannel]} Order`,
          items: [{
            name: itemName,
            quantity: 1,
            priceAtOrder: customerPaid,
            category: selectedChowlyItem === 'burger' ? 'Spirit' : 'Wine'
          }],
          status: 'received',
          priority: 'Normal',
          timestamp: new Date().toISOString(),
          orderSource: 'Visitor',
          subtotal: customerPaid
        };

        const tx: RetailTransaction = {
          id: `TX-${orderId}`,
          orderId: orderId,
          amount: customerPaid,
          type: 'Retail',
          method: 'Credit & Debit Card',
          timestamp: new Date().toISOString(),
          status: 'Completed',
          metadata: {
            tax: parseFloat((customerPaid * 0.08).toFixed(2)),
            subtotal: customerPaid,
            channel: simulatedOrderChannel,
            commission_fee: commissionFee,
            net_payout: netRevenue,
            margin_reclaimed: marginRecovered,
            simulator: true
          }
        };

        try {
          await supabaseSync.saveOrder(order);
          await supabaseSync.saveTransaction(tx);
          
          addChowlyLog('success', 'Toast POS Injection Cleared', `Successfully reconciled into general ledger. Net Payout: $${netRevenue.toFixed(2)} | Margin protected via markup: +$${marginRecovered.toFixed(2)}.`);
          setChowlyOrderSuccess(true);
          setTimeout(() => setChowlyOrderSuccess(false), 3000);
        } catch (err) {
          console.error("Chowly Simulation: POS Injection Error", err);
          addChowlyLog('error', 'POS Ingress Failure', 'Failed to register checkout state to cloud silo.');
        } finally {
          setIsProcessing(false);
        }
      }, 700);
    }, 500);
  };

  // Pre-seed some logs
  useEffect(() => {
    setToastLogs([
      {
        timestamp: new Date(Date.now() - 60000 * 5).toLocaleTimeString(),
        type: 'info',
        title: 'Toast POS Client Initialized',
        message: 'Successfully established socket tunnel to Toast Cloud Engine API endpoint. Ready for synchronous operations.'
      },
      {
        timestamp: new Date(Date.now() - 60000 * 4).toLocaleTimeString(),
        type: 'success',
        title: 'Menu Registry Pulled',
        message: 'Decoupled hierarchy sync parsed successfully: 1 active Menu, 1 Menu Group, 1 Menu Item, 2 Modifier Groups resolved.'
      }
    ]);
    setChowlyLogs([
      {
        timestamp: new Date(Date.now() - 60000 * 5).toLocaleTimeString(),
        type: 'info',
        title: 'Chowly Multi-Channel Broker Active',
        message: 'Successfully established bi-directional sync gateway to Toast POS and delivery APIs (DoorDash, UberEats, Grubhub, and Chowly Direct).'
      },
      {
        timestamp: new Date(Date.now() - 60000 * 4).toLocaleTimeString(),
        type: 'success',
        title: 'Dynamic Commission Offset Loaded',
        message: 'Calculated baseline markup offset (+20%) to mitigate 3rd-party marketplace fee overheads.'
      },
      {
        timestamp: new Date(Date.now() - 60000 * 3).toLocaleTimeString(),
        type: 'info',
        title: 'Channel Status Connected',
        message: 'All 4 configured endpoints are actively listening to catalog changes.'
      }
    ]);
  }, []);

  const addLog = (type: 'info' | 'success' | 'warning' | 'error' | 'incoming' | 'outgoing', title: string, message: string, payload?: unknown) => {
    setToastLogs(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        title,
        message,
        payload
      },
      ...prev
    ]);
  };

  // Mathematical variables for current configuration
  const burgerBasePrice = selectedLocation === 'boston' ? 14.99 : 16.99;
  const modifierCost = (selectedAddons.bacon ? 2.50 : 0) + (selectedAddons.avocado && avocadoAvailable ? 1.75 : 0);
  const calculatedSubtotal = burgerBasePrice + modifierCost;
  const calculatedTax = parseFloat((calculatedSubtotal * 0.08).toFixed(2));
  const calculatedTotal = parseFloat((calculatedSubtotal + calculatedTax).toFixed(2));

  // Dynamic Location Mapping Details
  const locationDetails = {
    boston: {
      locationGuid: "loc_boston_downtown_01",
      toastRestaurantGuid: "8a3b2c1d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
      region: "US-NE",
      currency: "USD",
      taxProfileId: "tax_boston_ma_625",
      menuOverrides: {
        menuGuid: "mnu_dinner_998877",
        basePriceModifier: 0.00
      }
    },
    nyc: {
      locationGuid: "loc_nyc_times_square_02",
      toastRestaurantGuid: "9z8y7x6w-5v4u-3t2s-1r0q-9p8o7n6m5l4k",
      region: "US-NY",
      currency: "USD",
      taxProfileId: "tax_nyc_ny_8875",
      menuOverrides: {
        menuGuid: "mnu_dinner_nyc_11002",
        basePriceModifier: 2.00
      }
    }
  };

  // GETTER FOR HIERARCHICAL MENU SYNC PAYLOAD
  const menuSyncPayload = {
    "restaurantGuid": locationDetails[selectedLocation].toastRestaurantGuid,
    "lastUpdated": lastMenuSyncTime,
    "menus": [
      {
        "guid": locationDetails[selectedLocation].menuOverrides.menuGuid,
        "name": selectedLocation === 'boston' ? "Dinner Menu" : "Dinner Menu NYC",
        "visibility": ["ONLINE_ORDERING", "POS"],
        "availability": {
          "startTime": "16:00",
          "endTime": "23:00",
          "daysAvailable": ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
        },
        "menuGroups": [
          {
            "guid": "grp_entrees_554433",
            "name": "Burgers & Mains",
            "menuItems": [
              {
                "guid": "itm_classic_burger_1122",
                "name": "Classic Cheeseburger",
                "description": "7oz Angus beef patty, cheddar, brioche bun.",
                "basePrice": burgerBasePrice,
                "sku": "BURGER-01",
                "imageUrn": "https://restaurant.com",
                "isAvailable": burgerAvailable,
                "taxRates": [locationDetails[selectedLocation].taxProfileId],
                "modifierGroupGuids": ["modgrp_temperature_111", "modgrp_addons_222"]
              }
            ]
          }
        ]
      }
    ],
    "modifierGroups": [
      {
        "guid": "modgrp_temperature_111",
        "name": "Required Cooking Temperature",
        "minSelections": 1,
        "maxSelections": 1,
        "modifierOptions": [
          {
            "guid": "opt_med_rare_001",
            "name": "Medium Rare",
            "priceType": "FIXED",
            "price": 0.00,
            "isAvailable": true
          },
          {
            "guid": "opt_medium_002",
            "name": "Medium",
            "priceType": "FIXED",
            "price": 0.00,
            "isAvailable": true
          }
        ]
      },
      {
        "guid": "modgrp_addons_222",
        "name": "Optional Add-ons",
        "minSelections": 0,
        "maxSelections": 5,
        "modifierOptions": [
          {
            "guid": "opt_bacon_999",
            "name": "Crispy Bacon",
            "priceType": "FIXED",
            "price": 2.50,
            "isAvailable": true
          },
          {
            "guid": "opt_avocado_888",
            "name": "Fresh Avocado",
            "priceType": "FIXED",
            "price": 1.75,
            "isAvailable": avocadoAvailable
          }
        ]
      }
    ]
  };

  // GETTER FOR ORDER INJECTION PAYLOAD
  const activeModifiersList = [
    {
      "modifierOptionGuid": selectedTemp,
      "quantity": 1,
      "unitPrice": 0.00
    }
  ];
  if (selectedAddons.bacon) {
    activeModifiersList.push({
      "modifierOptionGuid": "opt_bacon_999",
      "quantity": 1,
      "unitPrice": 2.50
    });
  }
  if (selectedAddons.avocado && avocadoAvailable) {
    activeModifiersList.push({
      "modifierOptionGuid": "opt_avocado_888",
      "quantity": 1,
      "unitPrice": 1.75
    });
  }

  const orderInjectionPayload = {
    "restaurantGuid": locationDetails[selectedLocation].toastRestaurantGuid,
    "source": "AI_VOICE_BOT",
    "externalOrderId": `order_ai_2026_0716_${recentOrderSuffix}`,
    "channel": "TAKE_OUT",
    "guestInfo": {
      "firstName": "Alex",
      "lastName": "Smith",
      "email": "alex.smith@email.com",
      "phoneNumber": "+15555550199"
    },
    "pricing": {
      "subtotal": parseFloat(calculatedSubtotal.toFixed(2)),
      "taxTotal": parseFloat(calculatedTax.toFixed(2)),
      "total": parseFloat(calculatedTotal.toFixed(2))
    },
    "selections": [
      {
        "itemGuid": "itm_classic_burger_1122",
        "quantity": 1,
        "unitPrice": burgerBasePrice,
        "appliedTaxRateGuid": locationDetails[selectedLocation].taxProfileId,
        "modifiers": activeModifiersList
      }
    ],
    "payments": [
      {
        "type": "DIGITAL_WALLET",
        "amount": parseFloat(calculatedTotal.toFixed(2)),
        "transactionToken": "tok_visa_enterprise_9988776655"
      }
    ]
  };

  const handlePullMenu = async () => {
    setIsMenuSyncing(true);
    addLog('outgoing', 'Sync Request Sent', `GET /api/v2/menus?restaurantGuid=${locationDetails[selectedLocation].toastRestaurantGuid}`);
    
    setTimeout(() => {
      setIsMenuSyncing(false);
      const now = new Date().toISOString();
      setLastMenuSyncTime(now);
      addLog('success', 'Hierarchical Menu Ingested', `Successfully loaded full structure for location [${selectedLocation.toUpperCase()}]. Base price resolved to $${burgerBasePrice}.`, menuSyncPayload);
    }, 1200);
  };

  const handleInjectOrder = async () => {
    if (!burgerAvailable) {
      addLog('error', 'Injection Rejected', 'Classic Cheeseburger is currently 86\'d (Out of Stock) and cannot be ordered.');
      return;
    }
    
    setIsProcessing(true);
    addLog('outgoing', 'Pushing Order Injection Payload', `POST /api/v2/orders/inject (External ID: order_ai_2026_0716_${recentOrderSuffix})`, orderInjectionPayload);

    setTimeout(() => {
      setIsProcessing(false);
      setToastOrderSuccess(true);
      addLog('success', 'Order Injected Successfully', `Toast POS verified and registered Order order_ai_2026_0716_${recentOrderSuffix} for $${calculatedTotal.toFixed(2)}. Status code 200 OK.`);
      setTimeout(() => setToastOrderSuccess(false), 3000);
      
      // Update order suffix for the next order
      setRecentOrderSuffix(prev => (parseInt(prev) + 1).toString());
    }, 1500);
  };

  const handleTriggerWebhook = (entityType: 'MODIFIER_OPTION' | 'MENU_ITEM', entityGuid: string, makeAvailable: boolean) => {
    const isAvocado = entityGuid === 'opt_avocado_888';
    const isBurger = entityGuid === 'itm_classic_burger_1122';
    
    const eventId = `evt_${Math.floor(Math.random() * 900000 + 100000)}_xyz`;
    const payload = {
      "eventId": eventId,
      "eventType": isBurger ? "MENU_ITEM_AVAILABILITY_CHANGED" : "MODIFIER_OPTION_AVAILABILITY_CHANGED",
      "timestamp": new Date().toISOString(),
      "restaurantGuid": locationDetails[selectedLocation].toastRestaurantGuid,
      "targetEntity": {
        "type": entityType,
        "guid": entityGuid,
        "isAvailable": makeAvailable,
        "reason": makeAvailable ? "RESTOCKED" : "OUT_OF_STOCK"
      }
    };

    // LOGGING STEP 1: Incoming Raw Webhook Hook Event
    addLog('incoming', 'Toast Webhook Received', `Event ID: ${eventId} | Entity: ${entityGuid} -> isAvailable: ${makeAvailable}`, payload);

    // LOGGING STEP 2: Idempotency check simulation
    if (processedEventIds.includes(eventId)) {
      addLog('warning', 'Idempotency Block Triggered', `Duplicate webhook detected! Event ID: ${eventId} has already been processed. Ignoring to prevent race conditions.`);
      return;
    }

    // Save eventId to processing ledger
    setProcessedEventIds(prev => [...prev, eventId]);

    // LOGGING STEP 3: Immediate Queue Ingest
    addLog('info', 'Immediate Queueing Initiated', `Dispatched Event ${eventId} to microservice queue (status: 202 Ingestion Acknowledged in 6ms). Releasing socket.`);

    // Wait slightly to show async queue consumer processing
    setTimeout(() => {
      if (isAvocado) {
        setAvocadoAvailable(makeAvailable);
        addLog('success', 'Cellar State Synchronized', `Webhook queue consumer processed Avocado availability state. Updated locally to ${makeAvailable ? 'Available' : 'OUT OF STOCK'}.`);
      } else if (isBurger) {
        setBurgerAvailable(makeAvailable);
        addLog('success', 'Cellar State Synchronized', `Webhook queue consumer processed Cheeseburger availability state. Updated locally to ${makeAvailable ? 'Available' : 'OUT OF STOCK'}.`);
      }
    }, 800);
  };

  // Render mathematical steps
  const mathFormulaStep1 = `P_item = P_base + ΣP_mod = $${burgerBasePrice} + $${modifierCost.toFixed(2)} = $${calculatedSubtotal.toFixed(2)}`;
  const mathFormulaStep2 = `Tax = P_item × 8% = $${calculatedSubtotal.toFixed(2)} × 0.08 = $${calculatedTax.toFixed(2)}`;
  const mathFormulaStep3 = `Total = P_item + Tax = $${calculatedSubtotal.toFixed(2)} + $${calculatedTax.toFixed(2)} = $${calculatedTotal.toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-[700] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="bg-[#151515] w-full max-w-7xl h-[92vh] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col">
        
        {/* TOP BAR WITH BRANDING & TABS */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-black/30 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/20">
              <i className="fas fa-network-wired text-lg"></i>
            </div>
            <div>
              <h2 className="text-white font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                Vinetelligence Unified POS Gateway
              </h2>
              <p className="text-stone-500 text-[9px] uppercase font-bold tracking-widest mt-0.5">
                Multi-Location POS Orchestration Engine
              </p>
            </div>
          </div>

          {/* TAB BAR SELECTOR */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('toast_pos')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'toast_pos'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <i className="fas fa-server"></i>
              Toast POS Integration Platform
            </button>
            <button
              onClick={() => setActiveTab('wine_locker')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'wine_locker'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <i className="fas fa-wine-bottle"></i>
              Wine Locker POS Simulator
            </button>
            <button
              onClick={() => setActiveTab('chowly_sync')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'chowly_sync'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <i className="fas fa-random"></i>
              Chowly Multi-Channel Delivery
            </button>
          </div>

          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* CONTAINER CONTENT */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'wine_locker' ? (
            // ==========================================
            // TAB 1: ORIGINAL WINE LOCKER SIMULATOR
            // ==========================================
            <div className="h-full flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 flex flex-col border-r border-white/5 h-full">
                <div className="p-6 border-b border-white/5 bg-black/10 flex justify-between items-center">
                  <div>
                    <h3 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-amber-500">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      Local Cellar Inventory Node
                    </h3>
                    <p className="text-stone-500 text-[9px] uppercase font-bold mt-1 tracking-widest">{restaurantName}</p>
                  </div>
                  <span className="text-[10px] bg-white/5 text-stone-400 px-3 py-1 rounded-lg border border-white/5 font-mono">
                    {inventory.length} Stock SKU Nodes
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
                  {inventory.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="group relative bg-white/5 border border-white/10 p-5 rounded-2xl text-left hover:bg-white/10 transition-all active:scale-95 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-25 transition-opacity">
                        <i className={`fas ${
                          item.category === 'Wine' ? 'fa-wine-bottle' :
                          item.category === 'Spirit' ? 'fa-glass-whiskey' :
                          'fa-beer-mug-empty'
                        } text-3xl`}></i>
                      </div>
                      <p className="text-white font-bold text-xs truncate pr-6">{item.name}</p>
                      <p className="text-stone-500 text-[8px] font-black uppercase tracking-widest mt-1">{item.category}</p>
                      <div className="mt-3 flex justify-between items-end">
                        <p className="text-amber-500 font-black text-sm">${item.price}</p>
                        <p className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${item.stock > 5 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          Stock: {item.stock}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-96 bg-black/20 flex flex-col h-full border-l border-white/5">
                <div className="p-6 border-b border-white/5 bg-black/10">
                  <h3 className="text-white font-black uppercase text-[10px] tracking-widest">Wine Order Basket</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30 my-10">
                      <i className="fas fa-shopping-cart text-3xl text-stone-500"></i>
                      <p className="text-[9px] font-black uppercase tracking-widest text-stone-500">Cart is empty</p>
                    </div>
                  ) : (
                    cart.map((c, i) => (
                      <div key={i} className="flex justify-between items-center animate-in slide-in-from-right-4 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div>
                          <p className="text-white text-xs font-bold">{c.item.name}</p>
                          <p className="text-stone-500 text-[8px] font-black uppercase tracking-widest mt-0.5">Qty: {c.qty}</p>
                        </div>
                        <p className="text-white font-black text-xs">${(c.item.price * c.qty).toFixed(2)}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 bg-black/40 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Total Amount</p>
                    <p className="text-white text-2xl font-black">${calculateTotal().toFixed(2)}</p>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isProcessing}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all active:scale-95 shadow-xl shadow-amber-500/5 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Updating Virtual Bin...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-cash-register"></i>
                        Checkout & Deplete Rack
                      </>
                    )}
                  </button>

                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <p className="text-[8px] text-stone-500 leading-relaxed italic text-center">
                      <i className="fas fa-sync mr-1.5 text-amber-500"></i>
                      Checking out synchronizes the local database bin depletion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'toast_pos' ? (
            // ==========================================
            // TAB 2: TOAST POS INTEGRATION PLAYGROUND
            // ==========================================
            <div className="h-full flex flex-col lg:flex-row overflow-hidden">
              
              {/* LEFT COLUMN: LOCATION SELECT & ORDER BUILDER */}
              <div className="w-full lg:w-[45%] flex flex-col border-r border-white/5 h-full overflow-y-auto custom-scrollbar p-6 space-y-6">
                
                {/* 1. LOCATION OVERRIDES & BRANDING */}
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Strategic Pillar: Decoupled Multi-Location Scaling</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedLocation('boston')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedLocation === 'boston'
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                          : 'bg-[#1a1a1a] border-white/10 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase tracking-wider">Boston Downtown</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${selectedLocation === 'boston' ? 'bg-amber-500 text-stone-950' : 'bg-white/10 text-stone-400'}`}>
                          US-NE
                        </span>
                      </div>
                      <p className="text-[9px] text-stone-500 mt-2 font-mono truncate">{locationDetails.boston.toastRestaurantGuid}</p>
                      <div className="mt-2 flex justify-between items-center text-[8px] uppercase tracking-widest text-stone-400">
                        <span>Base price adjustment:</span>
                        <span className="font-bold text-emerald-500">+$0.00</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedLocation('nyc')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedLocation === 'nyc'
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                          : 'bg-[#1a1a1a] border-white/10 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase tracking-wider">NYC Times Square</p>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${selectedLocation === 'nyc' ? 'bg-amber-500 text-stone-950' : 'bg-white/10 text-stone-400'}`}>
                          US-NY
                        </span>
                      </div>
                      <p className="text-[9px] text-stone-500 mt-2 font-mono truncate">{locationDetails.nyc.toastRestaurantGuid}</p>
                      <div className="mt-2 flex justify-between items-center text-[8px] uppercase tracking-widest text-stone-400">
                        <span>Base price adjustment:</span>
                        <span className="font-bold text-emerald-500">+$2.00 (NYC Premium)</span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="text-[8px] text-stone-500 leading-normal flex items-start gap-1.5 italic bg-black/15 p-2.5 rounded-lg border border-white/5">
                    <i className="fas fa-info-circle text-amber-500 mt-0.5"></i>
                    <span>
                      <strong>Dynamic Location Resolution:</strong> When an AI Voice Bot or UI triggers an order, it queries geolocation/selection, loading the target Guid and the specific store tax rate ({selectedLocation === 'boston' ? 'US-NE 8%' : 'US-NY 8%'}) and base premium.
                    </span>
                  </div>
                </div>

                {/* 2. INTERACTIVE ORDER BUILDER */}
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">1. POS Menu Order Configuration</h4>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${burgerAvailable ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'}`}>
                      {burgerAvailable ? 'Available' : '86\'d (Out of Stock)'}
                    </span>
                  </div>

                  <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-white text-xs font-bold">Classic Cheeseburger</h5>
                        <p className="text-[9px] text-stone-500 mt-1">7oz Angus beef patty, cheddar, brioche bun.</p>
                      </div>
                      <p className="text-amber-500 text-sm font-black">${burgerBasePrice.toFixed(2)}</p>
                    </div>

                    {/* MODIFIER GROUP 1: REQUIRED TEMPERATURE */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-stone-500">Cooking Temp (Required - select 1)</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedTemp('opt_med_rare_001')}
                          className={`py-2 px-3 rounded-lg text-[9px] font-bold text-center border transition-all ${
                            selectedTemp === 'opt_med_rare_001'
                              ? 'bg-amber-500 text-stone-950 border-amber-500'
                              : 'bg-black/20 text-stone-400 border-white/5 hover:border-white/10'
                          }`}
                        >
                          Medium Rare (+$0.00)
                        </button>
                        <button
                          onClick={() => setSelectedTemp('opt_medium_002')}
                          className={`py-2 px-3 rounded-lg text-[9px] font-bold text-center border transition-all ${
                            selectedTemp === 'opt_medium_002'
                              ? 'bg-amber-500 text-stone-950 border-amber-500'
                              : 'bg-black/20 text-stone-400 border-white/5 hover:border-white/10'
                          }`}
                        >
                          Medium (+$0.00)
                        </button>
                      </div>
                    </div>

                    {/* MODIFIER GROUP 2: OPTIONAL ADDONS */}
                    <div className="pt-3 border-t border-white/5 space-y-2">
                      <label className="block text-[8px] font-black uppercase tracking-widest text-stone-500">Optional Add-ons (Select up to 5)</label>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedAddons(prev => ({ ...prev, bacon: !prev.bacon }))}
                          className={`w-full flex justify-between items-center py-2 px-3 rounded-lg border transition-all text-xs ${
                            selectedAddons.bacon
                              ? 'bg-amber-500/10 border-amber-500 text-white'
                              : 'bg-black/20 text-stone-400 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <i className={`far ${selectedAddons.bacon ? 'fa-check-square text-amber-500' : 'fa-square'}`}></i>
                            Crispy Bacon
                          </span>
                          <span className="text-[10px] font-bold text-stone-400">+$2.50</span>
                        </button>

                        <button
                          onClick={() => avocadoAvailable && setSelectedAddons(prev => ({ ...prev, avocado: !prev.avocado }))}
                          disabled={!avocadoAvailable}
                          className={`w-full flex justify-between items-center py-2 px-3 rounded-lg border transition-all text-xs ${
                            !avocadoAvailable
                              ? 'bg-stone-900/50 border-white/5 text-stone-600 cursor-not-allowed'
                              : selectedAddons.avocado
                              ? 'bg-amber-500/10 border-amber-500 text-white'
                              : 'bg-black/20 text-stone-400 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <i className={`far ${!avocadoAvailable ? 'fa-ban' : selectedAddons.avocado ? 'fa-check-square text-amber-500' : 'fa-square'}`}></i>
                            Fresh Avocado
                            {!avocadoAvailable && <span className="ml-2 text-[8px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded">86'D</span>}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400">+$1.75</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. MATHEMATICAL VALIDATION PANEL */}
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">2. Programmatic Calculation Validation</h4>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                      API Compliant Math
                    </span>
                  </div>

                  <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3 font-mono text-[10px]">
                    
                    {/* STEP 1 */}
                    <div className="space-y-1">
                      <p className="text-stone-500 text-[8px] font-black uppercase tracking-widest font-sans">Step 1: Calculate Subtotal (Item + Upcharges)</p>
                      <div className="flex flex-col text-white border-b border-white/5 pb-1 text-xs">
                        <span className="font-mono text-[9px] text-stone-300">{mathFormulaStep1}</span>
                      </div>
                      <p className="text-[8px] text-stone-400 leading-normal font-sans italic pt-0.5">
                        Summing Cheeseburger Base (${burgerBasePrice.toFixed(2)}) + Bacon (${selectedAddons.bacon ? '2.50' : '0.00'}) + Avocado (${selectedAddons.avocado && avocadoAvailable ? '1.75' : '0.00'})
                      </p>
                    </div>

                    {/* STEP 2 */}
                    <div className="space-y-1 pt-2">
                      <p className="text-stone-500 text-[8px] font-black uppercase tracking-widest font-sans">Step 2: Calculate State Sales Tax (8%)</p>
                      <div className="flex flex-col text-white border-b border-white/5 pb-1 text-xs">
                        <span className="font-mono text-[9px] text-stone-300">{mathFormulaStep2}</span>
                      </div>
                      <p className="text-[8px] text-stone-400 leading-normal font-sans italic pt-0.5">
                        Applying state POS tax profile standard standard rate (0.08) to computed subtotal (${calculatedSubtotal.toFixed(2)})
                      </p>
                    </div>

                    {/* STEP 3 */}
                    <div className="space-y-1 pt-2">
                      <p className="text-stone-500 text-[8px] font-black uppercase tracking-widest font-sans">Step 3: Combine Final Gross Total</p>
                      <div className="flex flex-col text-white text-xs font-black">
                        <span className="font-mono text-[10px] text-amber-500 font-bold">{mathFormulaStep3}</span>
                      </div>
                    </div>

                  </div>

                  {/* SUBMIT BUTTON */}
                  <button
                    onClick={handleInjectOrder}
                    disabled={isProcessing || !burgerAvailable}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all active:scale-95 shadow-xl shadow-amber-500/5 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Verifying Signature & Injecting Order...
                      </>
                    ) : !burgerAvailable ? (
                      <>
                        <i className="fas fa-exclamation-triangle"></i>
                        Cannot Order: Item is 86'd
                      </>
                    ) : (
                      <>
                        <i className="fas fa-arrow-circle-right"></i>
                        Inject Verified Order into Toast POS
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN: HIERARCHICAL MENU SYNC & WEBHOOK SYSTEM */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                
                {/* MENU SYNC & WEBHOOK TRIGGERS PANEL */}
                <div className="p-6 border-b border-white/5 bg-black/10 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                  
                  {/* PULL MENU SYNC */}
                  <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Menus API Sync Gateway</h4>
                        <p className="text-[8px] text-stone-500 mt-0.5">Ingests fully resolved hierarchical catalogs matching Toast API design structure</p>
                      </div>
                      <button
                        onClick={handlePullMenu}
                        disabled={isMenuSyncing}
                        className="py-2 px-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border border-white/5"
                      >
                        {isMenuSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-arrows-rotate"></i>}
                        Pull & Sync Catalog
                      </button>
                    </div>

                    <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[9px] text-stone-400 font-mono">
                      <div>
                        <span className="text-stone-500">LAST SYNCED:</span> <span className="text-amber-500 font-bold">{new Date(lastMenuSyncTime).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-4">
                        <div>
                          <span className="text-stone-500">MENUS:</span> <span className="text-white">1 Resolved</span>
                        </div>
                        <div>
                          <span className="text-stone-500">ITEMS:</span> <span className="text-white">1 (Burger-01)</span>
                        </div>
                        <div>
                          <span className="text-stone-500">MODS:</span> <span className="text-white">4 Options</span>
                        </div>
                      </div>
                    </div>

                    {/* NESTED TREE VISUALIZER */}
                    <div className="border border-white/5 rounded-xl overflow-hidden text-[10px]">
                      <div className="bg-white/5 p-2.5 font-bold border-b border-white/5 text-white flex items-center justify-between">
                        <span><i className="fas fa-book-open text-amber-500 mr-2"></i>Dinner Menu <span className="text-[8px] text-stone-500 font-mono">({locationDetails[selectedLocation].menuOverrides.menuGuid})</span></span>
                        <span className="text-[8px] text-stone-400 bg-black/30 px-2 py-0.5 rounded font-mono uppercase">ONLINE / POS</span>
                      </div>
                      <div className="p-3 bg-black/10 space-y-2 border-b border-white/5 pl-6">
                        <div className="text-white font-bold"><i className="fas fa-folder text-amber-500 mr-2"></i>Burgers & Mains <span className="text-[8px] text-stone-500 font-mono">(grp_entrees_554433)</span></div>
                        <div className="pl-6 space-y-2 border-l border-white/5 ml-1 pt-1">
                          
                          {/* MENU ITEM */}
                          <div className={`p-2.5 rounded-lg border ${burgerAvailable ? 'bg-white/5 border-white/5' : 'bg-rose-500/5 border-rose-500/10'}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">
                                <i className="fas fa-hamburger text-amber-500 mr-2"></i>Classic Cheeseburger 
                                <span className="text-[8px] text-stone-500 font-mono ml-2">(itm_classic_burger_1122)</span>
                              </span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${burgerAvailable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {burgerAvailable ? 'In Stock' : '86\'D'}
                              </span>
                            </div>
                            
                            {/* NESTED MODIFIERS */}
                            <div className="mt-2.5 pt-2 border-t border-white/5 space-y-2 pl-4">
                              <div>
                                <span className="text-[9px] font-black uppercase text-stone-500">Required Cooking Temperature <span className="text-[8px] text-stone-600 font-mono">(modgrp_temperature_111)</span></span>
                                <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-[9px] text-stone-400">
                                  <div className="bg-black/20 p-1.5 rounded flex justify-between">
                                    <span>Medium Rare</span>
                                    <span>$0.00</span>
                                  </div>
                                  <div className="bg-black/20 p-1.5 rounded flex justify-between">
                                    <span>Medium</span>
                                    <span>$0.00</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <span className="text-[9px] font-black uppercase text-stone-500">Optional Add-ons <span className="text-[8px] text-stone-600 font-mono">(modgrp_addons_222)</span></span>
                                <div className="grid grid-cols-2 gap-2 mt-1 font-mono text-[9px]">
                                  <div className="bg-black/20 p-1.5 rounded flex justify-between text-stone-400">
                                    <span>Crispy Bacon</span>
                                    <span>+$2.50</span>
                                  </div>
                                  <div className={`p-1.5 rounded flex justify-between border ${avocadoAvailable ? 'bg-black/20 text-stone-400 border-transparent' : 'bg-rose-500/5 text-rose-400 border-rose-500/10'}`}>
                                    <span>Fresh Avocado</span>
                                    <span>{avocadoAvailable ? '+$1.75' : '86\'D'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WEBHOOK SIMULATOR */}
                  <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Toast Real-Time Webhook Simulator</h4>
                        <p className="text-[8px] text-stone-500 mt-0.5">Mocks physical POS updates sending availability signals directly to the AI core</p>
                      </div>
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        Event Broker Active
                      </span>
                    </div>

                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="text-[9px] text-stone-400 leading-normal flex items-center justify-center gap-2 font-mono bg-black/40 p-2 rounded-lg border border-white/5">
                        <span className="text-white font-bold">POS Terminal</span>
                        <i className="fas fa-arrow-right text-amber-500 text-[8px]"></i>
                        <span>86s Avocado</span>
                        <i className="fas fa-arrow-right text-amber-500 text-[8px]"></i>
                        <span className="text-white font-bold">Toast Engine</span>
                        <i className="fas fa-arrow-right text-amber-500 text-[8px]"></i>
                        <span>Webhook</span>
                        <i className="fas fa-arrow-right text-amber-500 text-[8px]"></i>
                        <span className="text-emerald-400 font-bold">AI Core State Update</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {/* AVOCADO WEBHOOK TRIGGERS */}
                        <div className="space-y-2">
                          <p className="text-[8px] font-black uppercase text-stone-500 tracking-wider">Avocado (Modifier Option)</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTriggerWebhook('MODIFIER_OPTION', 'opt_avocado_888', false)}
                              className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-bold rounded-lg border border-rose-500/20 transition-all flex items-center justify-center gap-1"
                            >
                              <i className="fas fa-ban"></i>
                              Trigger 86 (Deplete)
                            </button>
                            <button
                              onClick={() => handleTriggerWebhook('MODIFIER_OPTION', 'opt_avocado_888', true)}
                              className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1"
                            >
                              <i className="fas fa-check-circle"></i>
                              Trigger Restock
                            </button>
                          </div>
                        </div>

                        {/* BURGER WEBHOOK TRIGGERS */}
                        <div className="space-y-2">
                          <p className="text-[8px] font-black uppercase text-stone-500 tracking-wider">Cheeseburger (Menu Item)</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTriggerWebhook('MENU_ITEM', 'itm_classic_burger_1122', false)}
                              className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-bold rounded-lg border border-rose-500/20 transition-all flex items-center justify-center gap-1"
                            >
                              <i className="fas fa-ban"></i>
                              Trigger 86 (Deplete)
                            </button>
                            <button
                              onClick={() => handleTriggerWebhook('MENU_ITEM', 'itm_classic_burger_1122', true)}
                              className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1"
                            >
                              <i className="fas fa-check-circle"></i>
                              Trigger Restock
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* BOTTOM CONSOLE: LIVE JSON VIEW AND LOG ENGINE */}
                <div className="h-64 bg-[#0a0a0a] border-t border-white/5 flex flex-col">
                  
                  {/* CONSOLE CONTROL HEADER */}
                  <div className="px-6 py-2.5 bg-black/40 border-b border-white/5 flex justify-between items-center text-[10px]">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setShowConsolePayload('order')}
                        className={`font-black uppercase tracking-widest ${showConsolePayload === 'order' ? 'text-amber-500 border-b border-amber-500 pb-0.5' : 'text-stone-500 hover:text-stone-300'}`}
                      >
                        Outgoing Order Injection JSON
                      </button>
                      <button
                        onClick={() => setShowConsolePayload('webhook')}
                        className={`font-black uppercase tracking-widest ${showConsolePayload === 'webhook' ? 'text-amber-500 border-b border-amber-500 pb-0.5' : 'text-stone-500 hover:text-stone-300'}`}
                      >
                        MOCKED TOAST WEBHOOK MODEL
                      </button>
                      <button
                        onClick={() => setShowConsolePayload('menu')}
                        className={`font-black uppercase tracking-widest ${showConsolePayload === 'menu' ? 'text-amber-500 border-b border-amber-500 pb-0.5' : 'text-stone-500 hover:text-stone-300'}`}
                      >
                        Hierarchical Menu Sync JSON
                      </button>
                    </div>
                    <span className="text-[8px] font-mono text-stone-600">IDEMPOTENCY LEDGER COUNT: {processedEventIds.length}</span>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                    {/* PAYLOAD CODE VIEW */}
                    <div className="flex-1 overflow-auto p-4 font-mono text-[9px] text-stone-400 bg-black/60 custom-scrollbar border-r border-white/5">
                      {showConsolePayload === 'order' && (
                        <pre className="text-emerald-400">{JSON.stringify(orderInjectionPayload, null, 2)}</pre>
                      )}
                      {showConsolePayload === 'webhook' && (
                        <pre className="text-amber-400">{JSON.stringify({
                          "eventId": `evt_${processedEventIds[processedEventIds.length - 1] || '883311_xyz'}`,
                          "eventType": "MENU_ITEM_AVAILABILITY_CHANGED",
                          "timestamp": new Date().toISOString(),
                          "restaurantGuid": locationDetails[selectedLocation].toastRestaurantGuid,
                          "targetEntity": {
                            "type": "MODIFIER_OPTION",
                            "guid": "opt_avocado_888",
                            "isAvailable": avocadoAvailable,
                            "reason": avocadoAvailable ? "RESTOCKED" : "OUT_OF_STOCK"
                          }
                        }, null, 2)}</pre>
                      )}
                      {showConsolePayload === 'menu' && (
                        <pre className="text-blue-400">{JSON.stringify(menuSyncPayload, null, 2)}</pre>
                      )}
                    </div>

                    {/* GATEWAY LOG MONITOR */}
                    <div className="w-[45%] overflow-y-auto p-4 font-mono text-[9px] text-stone-300 custom-scrollbar bg-black/80 space-y-2.5">
                      <div className="text-[8px] font-black uppercase text-stone-500 border-b border-white/5 pb-1 tracking-widest font-sans flex justify-between">
                        <span>Gateway Console Log Stream</span>
                        <span className="text-amber-500">Live</span>
                      </div>
                      
                      {toastLogs.length === 0 ? (
                        <p className="text-stone-600 italic">No logs generated yet.</p>
                      ) : (
                        toastLogs.map((log, idx) => (
                          <div key={idx} className="border-b border-white/5 pb-2 animate-in fade-in duration-200">
                            <div className="flex justify-between items-start text-[8px] mb-0.5">
                              <span className={`font-black uppercase tracking-wider px-1 rounded ${
                                log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                log.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                                log.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                                log.type === 'incoming' ? 'bg-blue-500/10 text-blue-400' :
                                log.type === 'outgoing' ? 'bg-purple-500/10 text-purple-400' :
                                'bg-white/10 text-stone-400'
                              }`}>
                                {log.type}
                              </span>
                              <span className="text-stone-600 font-bold">{log.timestamp}</span>
                            </div>
                            <p className="text-white font-bold leading-tight">{log.title}</p>
                            <p className="text-stone-500 leading-normal mt-0.5">{log.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : (
            // ==========================================
            // TAB 3: CHOWLY MULTI-CHANNEL DELIVERY ENGINE
            // ==========================================
            <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-stone-950">
              
              {/* LEFT COLUMN: MARGIN PROTECT & SIMULATOR CONTROLS */}
              <div className="w-full lg:w-[42%] flex flex-col border-r border-white/5 h-full overflow-y-auto custom-scrollbar p-6 space-y-6 bg-black/25">
                
                {/* 1. DYNAMIC COMMISSION OFFSET (MARKUP) */}
                <div className="bg-[#1c1c1c] p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Chowly Margin Protect Engine</span>
                  </div>
                  
                  <p className="text-[10px] text-stone-400 leading-relaxed font-medium">
                    Marketplace delivery platforms (DoorDash, UberEats, Grubhub) charge a high 20% to 30% commission, hurting wine & beverage profits. Vinetelligence integrates <strong>Chowly's Commission Offsetter</strong> to dynamically adjust prices on 3rd-party channels to shield your margins, while first-party ordering stays at standard POS baseline.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Marketplace Markup Offset</span>
                      <span className="text-sm font-black text-amber-400">+{commissionMarkup}%</span>
                    </div>
                    
                    <input
                      type="range"
                      min="0"
                      max="35"
                      step="5"
                      value={commissionMarkup}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCommissionMarkup(val);
                        addChowlyLog('info', 'Markup Slider Adjusted', `Commission offset percentage recalculated to +${val}%. Broadcast queued.`);
                      }}
                      className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setCommissionMarkup(15);
                          addChowlyLog('info', 'Standard Presets Triggered', 'Applying baseline markup (+15%) to offset basic delivery commission tiers.');
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider border text-center transition-all ${
                          commissionMarkup === 15 ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-black/20 text-stone-400 border-white/5 hover:border-white/10'
                        }`}
                      >
                        Standard (+15%)
                      </button>
                      <button
                        onClick={() => {
                          setCommissionMarkup(25);
                          addChowlyLog('info', 'Aggressive Presets Triggered', 'Applying maximum security margin (+25%) to entirely immunize delivery fees.');
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[8px] font-black uppercase tracking-wider border text-center transition-all ${
                          commissionMarkup === 25 ? 'bg-amber-500 text-stone-950 border-amber-500' : 'bg-black/20 text-stone-400 border-white/5 hover:border-white/10'
                        }`}
                      >
                        Max Shield (+25%)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. ITEM & CHANNEL SELECTOR */}
                <div className="bg-[#1c1c1c] p-5 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">1. Select Target Product</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setSelectedChowlyItem('wine');
                        addChowlyLog('info', 'Active Simulator SKU Shift', 'Target shifted to Caymus Cabernet Sauvignon ($180.00 Base Wine Bottle).');
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        selectedChowlyItem === 'wine' ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-black/30 border-white/10 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        <i className="fas fa-wine-bottle text-amber-500"></i>
                        Caymus Wine
                      </p>
                      <p className="text-[8px] text-stone-500 mt-1 font-black">BASE: $180.00</p>
                      <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${wineAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedChowlyItem('burger');
                        addChowlyLog('info', 'Active Simulator SKU Shift', `Target shifted to Classic Cheeseburger ($${burgerBasePrice.toFixed(2)} Base Food Item).`);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        selectedChowlyItem === 'burger' ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-black/30 border-white/10 text-stone-400 hover:border-white/20'
                      }`}
                    >
                      <p className="text-xs font-bold flex items-center gap-1.5">
                        <i className="fas fa-hamburger text-amber-500"></i>
                        Cheeseburger
                      </p>
                      <p className="text-[8px] text-stone-500 mt-1 font-black">BASE: ${burgerBasePrice.toFixed(2)}</p>
                      <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${burgerAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">2. Choose Delivery Gateway Channel</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'chowlydirect', name: 'Menufy (1st-Party)', commission: '0% fee' },
                        { id: 'doordash', name: 'DoorDash', commission: '25% fee' },
                        { id: 'ubereats', name: 'UberEats', commission: '30% fee' },
                        { id: 'grubhub', name: 'Grubhub', commission: '20% fee' }
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => setSimulatedOrderChannel(ch.id as 'chowlydirect' | 'doordash' | 'ubereats' | 'grubhub')}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            simulatedOrderChannel === ch.id ? 'bg-amber-500/15 border-amber-500 text-white' : 'bg-black/20 border-white/5 text-stone-400 hover:border-white/10'
                          }`}
                        >
                          <p className="text-[10px] font-bold">{ch.name}</p>
                          <p className="text-[8px] text-stone-500 mt-0.5 uppercase font-mono font-black">{ch.commission}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    <button
                      onClick={handleSimulateChowlyOrder}
                      disabled={isProcessing || !(selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable)}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all active:scale-95 shadow-xl shadow-amber-500/5 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Simulating Order Pipeline...
                        </>
                      ) : !(selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable) ? (
                        <>
                          <i className="fas fa-ban"></i>
                          Target Item is 86'd (Sold Out)
                        </>
                      ) : (
                        <>
                          <i className="fas fa-shopping-cart"></i>
                          Place Simulated Marketplace Order
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: LIVE CHANNELS GRID & TELEMETRY TERMINALS */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                
                {/* 1. UNIVERSAL 86 SYNC MASTER CONSOLE */}
                <div className="p-6 border-b border-white/5 bg-[#121212] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 text-amber-500">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      Universal 86 Out-of-Stock Sync Broker
                    </h3>
                    <p className="text-stone-500 text-[9px] uppercase font-bold mt-1 tracking-widest">
                      Real-time physical wine depletion propagates instantly to all 3rd party marketplaces
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-stone-400 tracking-wider">
                      {selectedChowlyItem === 'burger' ? 'Cheeseburger POS Status' : 'Caymus Bottle POS Status'}:
                    </span>
                    <button
                      onClick={() => {
                        if (selectedChowlyItem === 'burger') {
                          setBurgerAvailable(!burgerAvailable);
                        } else {
                          setWineAvailable(!wineAvailable);
                        }
                      }}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        (selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable)
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {(selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable) ? 'IN STOCK (TAP TO 86)' : '86\'D (TAP TO RESTOCK)'}
                    </button>
                  </div>
                </div>

                {/* 2. ACTIVE INTEGRATED DELIVERY CHANNELS GRID */}
                <div className="p-6 bg-black/10 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                      {
                        id: 'chowlydirect',
                        name: 'Menufy (1st-Party)',
                        commission: '0% Commission',
                        desc: 'Your Direct Ordering Hub',
                        icon: 'fa-globe',
                        color: 'text-emerald-500',
                        price: getChowlyPrices().chowlydirect,
                        available: selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable
                      },
                      {
                        id: 'doordash',
                        name: 'DoorDash Integration',
                        commission: '25% Commission Cut',
                        desc: '3rd-Party Delivery Marketplace',
                        icon: 'fa-truck-fast',
                        color: 'text-rose-500',
                        price: getChowlyPrices().doordash,
                        available: selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable
                      },
                      {
                        id: 'ubereats',
                        name: 'UberEats Integration',
                        commission: '30% Commission Cut',
                        desc: '3rd-Party Delivery Marketplace',
                        icon: 'fa-motorcycle',
                        color: 'text-stone-200',
                        price: getChowlyPrices().ubereats,
                        available: selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable
                      },
                      {
                        id: 'grubhub',
                        name: 'Grubhub Integration',
                        commission: '20% Commission Cut',
                        desc: '3rd-Party Delivery Marketplace',
                        icon: 'fa-bicycle',
                        color: 'text-orange-500',
                        price: getChowlyPrices().grubhub,
                        available: selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable
                      }
                    ].map((channel) => (
                      <div
                        key={channel.id}
                        className={`relative p-5 rounded-2xl border transition-all overflow-hidden bg-[#181818] ${
                          simulatedOrderChannel === channel.id ? 'border-amber-500/50 shadow-xl shadow-amber-500/5' : 'border-white/5'
                        }`}
                      >
                        {/* ICON ACCENT */}
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <i className={`fas ${channel.icon} text-3xl ${channel.color}`}></i>
                        </div>

                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                          channel.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {channel.available ? 'SYNC ACTIVE' : '86\'D / SOLD OUT'}
                        </span>

                        <h5 className="text-white text-xs font-black mt-2 tracking-tight">{channel.name}</h5>
                        <p className="text-stone-500 text-[8px] mt-0.5 font-medium">{channel.desc}</p>
                        
                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-end">
                          <div>
                            <span className="text-[8px] text-stone-500 block uppercase font-black">Active Sync Price</span>
                            <span className="text-lg font-black text-white">${channel.price.toFixed(2)}</span>
                          </div>
                          <span className="text-[8px] text-stone-400 font-mono italic">{channel.commission}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* BOTTOM EXPLANATORY BANNER */}
                  <div className="bg-[#1e1c18] border border-amber-500/10 p-4.5 rounded-2xl flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
                      <i className="fas fa-shield-alt text-sm"></i>
                    </div>
                    <div>
                      <h5 className="text-white text-xs font-bold">Dynamic Revenue Mitigation Proof</h5>
                      <p className="text-[10px] text-stone-400 leading-relaxed mt-1">
                        Observe the pricing difference. By adding the <strong>+{commissionMarkup}% Chowly markup offset</strong>, you are passing the third-party delivery commission to the delivery platforms' end-customers. If the item is ordered tableside or directly on your first-party commission-free Menufy site, the customer gets the base in-house price.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM TELEMETRY CONSOLE PANEL */}
                <div className="h-64 bg-[#0a0a0a] border-t border-white/5 flex flex-col">
                  
                  {/* CONSOLE SELECT HEADER */}
                  <div className="px-6 py-2.5 bg-black/40 border-b border-white/5 flex justify-between items-center text-[10px]">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveChowlyPayload('price_sheet')}
                        className={`font-black uppercase tracking-widest ${activeChowlyPayload === 'price_sheet' ? 'text-amber-500 border-b border-amber-500 pb-0.5' : 'text-stone-500 hover:text-stone-300'}`}
                      >
                        Chowly Broadcast Sync JSON
                      </button>
                      <button
                        onClick={() => setActiveChowlyPayload('payout_analysis')}
                        className={`font-black uppercase tracking-widest ${activeChowlyPayload === 'payout_analysis' ? 'text-amber-500 border-b border-amber-500 pb-0.5' : 'text-stone-500 hover:text-stone-300'}`}
                      >
                        Chowly Payout & ROI Math
                      </button>
                    </div>
                    <span className="text-[8px] font-mono text-stone-600">CHOWLY MULTI-CHANNEL DESK ACTIVE</span>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                    {/* PAYLOAD CODE PANEL */}
                    <div className="flex-1 overflow-auto p-4 font-mono text-[9px] text-stone-400 bg-black/60 custom-scrollbar border-r border-white/5">
                      {activeChowlyPayload === 'price_sheet' && (
                        <pre className="text-blue-400">{JSON.stringify({
                          "timestamp": new Date().toISOString(),
                          "broker": "Chowly-Vinetelligence-POS-Gateway",
                          "pricingRules": {
                            "targetLocation": selectedLocation === 'boston' ? "Boston Downtown" : "NYC Times Square",
                            "commissionMarkupPercent": commissionMarkup,
                            "applyToMarketplacesOnly": true
                          },
                          "menuItems": [
                            {
                              "sku": selectedChowlyItem === 'burger' ? "BURGER-01" : "WINE-CAYMUS-2021",
                              "name": selectedChowlyItem === 'burger' ? "Classic Cheeseburger" : "Caymus Cabernet Sauvignon",
                              "basePrice": selectedChowlyItem === 'burger' ? burgerBasePrice : 180.00,
                              "channels": {
                                "chowlydirect": {
                                  "price": getChowlyPrices().chowlydirect,
                                  "commission": "0%",
                                  "isAvailable": selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable
                                },
                                "doordash": {
                                  "price": getChowlyPrices().doordash,
                                  "commission": "25%",
                                  "isAvailable": selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable
                                },
                                "ubereats": {
                                  "price": getChowlyPrices().ubereats,
                                  "commission": "30%",
                                  "isAvailable": selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable
                                },
                                "grubhub": {
                                  "price": getChowlyPrices().grubhub,
                                  "commission": "20%",
                                  "isAvailable": selectedChowlyItem === 'burger' ? burgerAvailable : wineAvailable
                                }
                              }
                            }
                          ]
                        }, null, 2)}</pre>
                      )}

                      {activeChowlyPayload === 'payout_analysis' && (() => {
                        const prices = getChowlyPrices();
                        const rates = { chowlydirect: 0.0, doordash: 0.25, ubereats: 0.30, grubhub: 0.20 };
                        const channelNameMap = {
                          chowlydirect: 'Chowly Direct',
                          doordash: 'DoorDash',
                          ubereats: 'UberEats',
                          grubhub: 'Grubhub'
                        };

                        const currentPrice = prices[simulatedOrderChannel];
                        const rate = rates[simulatedOrderChannel];
                        const fee = parseFloat((currentPrice * rate).toFixed(2));
                        const netPay = parseFloat((currentPrice - fee).toFixed(2));
                        
                        const profitWithoutMarkup = parseFloat((prices.base * (1 - rate)).toFixed(2));
                        const standardCommission = parseFloat((prices.base * rate).toFixed(2));
                        const marginSaved = parseFloat((netPay - profitWithoutMarkup).toFixed(2));

                        return (
                          <div className="space-y-3 font-sans text-stone-300">
                            <p className="text-amber-500 font-bold text-[10px] uppercase tracking-wider font-sans border-b border-white/5 pb-1 flex justify-between">
                              <span>Dynamic Payout Analyzer: {channelNameMap[simulatedOrderChannel]}</span>
                              <span className="font-mono text-white bg-amber-500/10 px-1 rounded">Markup: +{commissionMarkup}%</span>
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                              {/* WITH CHOWLY MARKUP */}
                              <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 space-y-2">
                                <p className="text-[9px] text-emerald-400 font-black uppercase tracking-wider font-sans">With Chowly Markup Offset</p>
                                <div className="space-y-1 text-[11px]">
                                  <div className="flex justify-between"><span>Customer Paid:</span> <span className="font-mono font-bold text-white">${currentPrice.toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span>Marketplace Commission ({rate * 100}%):</span> <span className="font-mono text-rose-400">-${fee.toFixed(2)}</span></div>
                                  <div className="flex justify-between border-t border-white/10 pt-1 font-bold"><span>Restaurant Keeps:</span> <span className="font-mono text-emerald-400">${netPay.toFixed(2)}</span></div>
                                </div>
                              </div>

                              {/* WITHOUT CHOWLY MARKUP */}
                              <div className="bg-rose-500/5 p-3 rounded-xl border border-rose-500/10 space-y-2">
                                <p className="text-[9px] text-rose-400 font-black uppercase tracking-wider font-sans">Without Chowly Markup (Standard)</p>
                                <div className="space-y-1 text-[11px]">
                                  <div className="flex justify-between"><span>Customer Paid:</span> <span className="font-mono font-bold text-white">${prices.base.toFixed(2)}</span></div>
                                  <div className="flex justify-between"><span>Marketplace Commission ({rate * 100}%):</span> <span className="font-mono text-rose-400">-${standardCommission.toFixed(2)}</span></div>
                                  <div className="flex justify-between border-t border-white/10 pt-1 font-bold"><span>Restaurant Keeps:</span> <span className="font-mono text-rose-300">${profitWithoutMarkup.toFixed(2)}</span></div>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl flex justify-between items-center text-xs">
                              <span className="font-bold flex items-center gap-1"><i className="fas fa-badge-check text-blue-400"></i>Commission Leak Mitigated (Net Margin Recovered):</span>
                              <span className="font-mono font-black text-emerald-400 text-sm animate-pulse">+${marginSaved.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* GATEWAY LOG MONITOR */}
                    <div className="w-[42%] overflow-y-auto p-4 font-mono text-[9px] text-stone-300 custom-scrollbar bg-black/80 space-y-2.5">
                      <div className="text-[8px] font-black uppercase text-stone-500 border-b border-white/5 pb-1 tracking-widest font-sans flex justify-between">
                        <span>Chowly Event Broker Log Stream</span>
                        <span className="text-amber-500">Live</span>
                      </div>
                      
                      {chowlyLogs.length === 0 ? (
                        <p className="text-stone-600 italic">No logs generated yet.</p>
                      ) : (
                        chowlyLogs.map((log, idx) => (
                          <div key={idx} className="border-b border-white/5 pb-2 animate-in fade-in duration-200">
                            <div className="flex justify-between items-start text-[8px] mb-0.5">
                              <span className={`font-black uppercase tracking-wider px-1 rounded ${
                                log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                log.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                                log.type === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                                log.type === 'incoming' ? 'bg-blue-500/10 text-blue-400' :
                                log.type === 'outgoing' ? 'bg-purple-500/10 text-purple-400' :
                                'bg-white/10 text-stone-400'
                              }`}>
                                {log.type}
                              </span>
                              <span className="text-stone-600 font-bold">{log.timestamp}</span>
                            </div>
                            <p className="text-white font-bold leading-tight">{log.title}</p>
                            <p className="text-stone-500 leading-normal mt-0.5">{log.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}
        </div>

        {/* ORDER SUCCESS OVERLAY */}
        {toastOrderSuccess && (
          <div className="absolute inset-0 z-[800] bg-emerald-500/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-10 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-600 text-3xl shadow-2xl mb-4 animate-bounce">
              <i className="fas fa-check"></i>
            </div>
            <h3 className="text-white text-3xl font-serif font-black italic mb-2">Toast POS Order Injected!</h3>
            <p className="text-white/90 text-xs font-semibold max-w-sm leading-relaxed">
              Calculations verified: Subtotal ${calculatedSubtotal.toFixed(2)} + 8% Sales Tax (${calculatedTax.toFixed(2)}) is mathematically correct. Toast gateway responded with 200 OK.
            </p>
          </div>
        )}

        {/* WINE ORDER SUCCESS OVERLAY */}
        {showSuccess && (
          <div className="absolute inset-0 z-[800] bg-emerald-500/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-10 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-emerald-600 text-3xl shadow-2xl mb-4 animate-bounce">
              <i className="fas fa-check"></i>
            </div>
            <h3 className="text-white text-3xl font-serif font-black italic mb-2">Wine Order Synced!</h3>
            <p className="text-white/90 text-xs font-semibold max-w-sm leading-relaxed">
              The Wine Locker POS has successfully notified Vinetelligence. Local cellar rack stock has been automatically depleted.
            </p>
          </div>
        )}

        {/* CHOWLY ORDER SUCCESS OVERLAY */}
        {chowlyOrderSuccess && (
          <div className="absolute inset-0 z-[800] bg-amber-500/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-10 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-stone-950 rounded-full flex items-center justify-center text-amber-500 text-3xl shadow-2xl mb-4 animate-bounce">
              <i className="fas fa-random"></i>
            </div>
            <h3 className="text-stone-950 text-3xl font-serif font-black italic mb-2">Chowly Order Injected!</h3>
            <p className="text-stone-900 text-xs font-semibold max-w-sm leading-relaxed font-bold">
              Marketplace order has been successfully captured, marked up to offset high delivery commission rates, and dynamically synchronized with your core POS general ledger system.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default TestSim;

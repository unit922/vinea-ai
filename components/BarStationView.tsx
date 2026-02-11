
import React, { useState, useEffect, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { ServiceOrder, InventoryItem, OrderItem } from '../types';
import { INITIAL_INVENTORY } from '../constants';

const BarStationView: React.FC = () => {
  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('vinea_orders');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [inventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('vinea_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [showWastage, setShowWastage] = useState(false);
  const [wastageItem, setWastageItem] = useState<InventoryItem | null>(null);
  
  const [showDirectOrder, setShowDirectOrder] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [directCart, setDirectCart] = useState<Record<string, number>>({});
  const [directOrderSearch, setDirectOrderSearch] = useState('');
  const [visitorName, setVisitorName] = useState('');

  // UI State
  const [showBatchView, setShowBatchView] = useState(true);
  const [isSequencing, setIsSequencing] = useState(false);
  const [sequenceData, setSequenceData] = useState<{sequence: string[], proTip: string} | null>(null);
  const [insightData, setInsightData] = useState<{name: string, history: string, origins: string, facts: string[]} | null>(null);
  const [isFetchingInsight, setIsFetchingInsight] = useState(false);
  const [currentlyFetchingItem, setCurrentlyFetchingItem] = useState<string | null>(null);

  // Popular items for Speed Dial (Top 6 likely)
  const popularItems = useMemo(() => {
    const ids = ['1', '2', '3', '5']; // Cabernet, Chardonnay, Gin, IPA
    return inventory.filter(i => ids.includes(i.id));
  }, [inventory]);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('vinea_orders');
      if (saved) setOrders(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const getPrice = (name: string) => inventory.find(inv => inv.name === name)?.price || 15;

  const tableIntelligence = useMemo(() => {
    const groups: Record<string, { orders: ServiceOrder[], total: number, items: OrderItem[], source: string, timestamp: string }> = {};
    
    orders.filter(o => o.status === 'Pending' || o.status === 'Prepping').forEach(order => {
      const displayId = order.tableNumber ? `Table ${order.tableNumber}` : (order.serverName.startsWith('Pickup:') ? order.serverName.replace('Pickup: ', '') : `Walk-in ${order.id.slice(-4)}`);
      const key = `${displayId}-${order.source}`;
      
      if (!groups[key]) {
        groups[key] = { orders: [], total: 0, items: [], source: order.source, timestamp: order.timestamp };
      }
      
      groups[key].orders.push(order);
      order.items.forEach(item => {
        groups[key].total += (item.priceAtOrder || getPrice(item.name)) * item.quantity;
        const existing = groups[key].items.find(i => i.name === item.name && i.style === item.style);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          groups[key].items.push({ ...item });
        }
      });
    });
    
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [orders, inventory]);

  // Consolidated "Batch" View logic
  const consolidatedBatch = useMemo(() => {
    const batches: Record<string, { name: string, quantity: number, category: string }> = {};
    orders.filter(o => o.status === 'Pending' || o.status === 'Prepping').forEach(order => {
      order.items.forEach(item => {
        const key = `${item.name}-${item.style}`;
        if (!batches[key]) {
          batches[key] = { name: item.name, quantity: 0, category: item.style || '' };
        }
        batches[key].quantity += item.quantity;
      });
    });
    return Object.values(batches).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const handleBumpTable = (key: string) => {
    const [displayId, source] = key.split('-');
    const updatedOrders = orders.map(o => {
      const orderDisplay = o.tableNumber ? `Table ${o.tableNumber}` : (o.serverName.startsWith('Pickup:') ? o.serverName.replace('Pickup: ', '') : `Walk-in ${o.id.slice(-4)}`);
      if (orderDisplay === displayId && o.source === source && (o.status === 'Pending' || o.status === 'Prepping')) {
        return { 
          ...o, 
          status: 'Ready' as const,
          items: o.items.map(item => ({ ...item, status: 'Ready' as const }))
        };
      }
      return o;
    });
    setOrders(updatedOrders);
    localStorage.setItem('vinea_orders', JSON.stringify(updatedOrders));
    window.dispatchEvent(new Event('storage'));
  };

  const handleAnalyzeSequence = async () => {
    setIsSequencing(true);
    try {
      const res = await geminiService.getBarPrepIntelligence(orders.filter(o => o.status === 'Pending'));
      setSequenceData(res);
    } catch (e) { console.error(e); }
    finally { setIsSequencing(false); }
  };

  const handleFetchInsight = async (name: string) => {
    setCurrentlyFetchingItem(name);
    setIsFetchingInsight(true);
    try {
      const res = await geminiService.getCocktailInsight(name, []);
      setInsightData({ ...res, name });
    } catch (e) { console.error(e); }
    finally { 
      setIsFetchingInsight(false); 
      setCurrentlyFetchingItem(null); 
    }
  };

  const addToDirectCart = (id: string) => {
    setDirectCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromDirectCart = (id: string) => {
    setDirectCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });
  };

  const handleFireDirectOrder = () => {
    const items: OrderItem[] = Object.entries(directCart).map(([id, qty]) => {
      const inv = inventory.find(i => i.id === id)!;
      return {
        id: `walkin-${Date.now()}-${id}`,
        name: inv.name,
        quantity: qty as number,
        status: 'Pending',
        prepType: 'Pour',
        priceAtOrder: inv.price,
        style: inv.category
      };
    });

    const newOrder: ServiceOrder = {
      id: `ord-walkin-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tableNumber: '', 
      serverName: visitorName ? `Pickup: ${visitorName}` : 'Bar Direct',
      items: items,
      status: 'Pending',
      priority: 'Normal',
      source: 'Visitor'
    };

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    localStorage.setItem('vinea_orders', JSON.stringify(updatedOrders));
    setDirectCart({});
    setVisitorName('');
    setShowDirectOrder(false);
    window.dispatchEvent(new Event('storage'));
  };

  const cartTotal: number = Object.entries(directCart).reduce((sum, [id, qty]) => {
    const item = inventory.find(i => i.id === id);
    return sum + (item?.price || 0) * (qty as number);
  }, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden relative selection:bg-amber-500 selection:text-white">
      {/* Top Action Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 shrink-0 gap-4">
        <div className="flex items-center gap-6">
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${isKioskMode ? 'bg-blue-500 shadow-[0_0_10px_#3b82f6]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}></div>
                 <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight">
                   {isKioskMode ? 'Self-Service Terminal' : 'Bar Command'}
                 </h2>
              </div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">
                {isKioskMode ? 'Guest Portal Active' : 'Real-time Preparation Node'}
              </p>
           </div>
           
           {!isKioskMode && (
             <div className="h-10 w-[1px] bg-stone-200 hidden md:block"></div>
           )}

           {!isKioskMode && (
             <button 
                onClick={() => setShowBatchView(!showBatchView)}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  showBatchView ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
             >
                <i className="fas fa-layer-group"></i>
                Batch Summary: {showBatchView ? 'On' : 'Off'}
             </button>
           )}
        </div>

        <div className="flex flex-wrap gap-2">
           {!isKioskMode && (
             <button 
                onClick={handleAnalyzeSequence} 
                disabled={isSequencing || tableIntelligence.length === 0}
                className="px-5 py-2.5 bg-white border border-stone-200 text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-amber-500 transition-all shadow-sm flex items-center gap-2"
             >
                {isSequencing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt text-amber-500"></i>}
                AI Sequencing
             </button>
           )}
           <button 
             onClick={() => setShowDirectOrder(true)}
             className="px-5 py-2.5 bg-amber-500 text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg active:scale-95 flex items-center gap-2"
           >
              <i className="fas fa-plus"></i> Walk-in
           </button>
           <button 
             onClick={() => setIsKioskMode(!isKioskMode)}
             className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
               isKioskMode ? 'bg-stone-900 text-white' : 'bg-blue-600 text-white hover:bg-blue-500'
             }`}
           >
              <i className={`fas ${isKioskMode ? 'fa-user-tie' : 'fa-tablet-screen-button'}`}></i>
              {isKioskMode ? 'Staff Mode' : 'Kiosk'}
           </button>
           {!isKioskMode && (
             <button onClick={() => setShowWastage(true)} className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all border border-rose-500/30">
                <i className="fas fa-flask-vial text-rose-500"></i>
             </button>
           )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Work Area: Order Cards */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {tableIntelligence.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-stone-50 rounded-[3rem] border-2 border-dashed border-stone-200 opacity-60">
               <i className="fas fa-shaker text-4xl text-stone-200 mb-4 animate-bounce"></i>
               <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Registry Dormant</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {tableIntelligence.map(([key, data]) => {
                  const [displayId, source] = key.split('-');
                  const isVisitor = source === 'Visitor';
                  
                  return (
                    <div key={key} className={`bg-white border rounded-[2.5rem] shadow-xl flex flex-col hover:shadow-2xl transition-all group overflow-hidden border-stone-100 ${isVisitor ? 'ring-2 ring-blue-500/20' : ''}`}>
                      <div className={`p-5 flex justify-between items-center ${isVisitor ? 'bg-blue-600 text-white' : 'bg-stone-900 text-white'}`}>
                          <div>
                            <span className="text-xl font-serif font-black truncate max-w-[180px] block">
                              {displayId}
                            </span>
                            <p className="text-[9px] font-black uppercase opacity-60 mt-0.5">Fired {data.timestamp}</p>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border border-white/20 bg-white/10`}>
                            {isVisitor ? 'GUEST' : 'STAFF'}
                          </span>
                      </div>

                      <div className="flex-1 p-5 space-y-3">
                          {data.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-stone-50 pb-2 last:border-0">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-black ${isVisitor ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-stone-50 border-stone-200 text-stone-600'}`}>
                                    {item.quantity}x
                                </div>
                                <span className="text-sm font-bold text-stone-800">{item.name}</span>
                              </div>
                              <button 
                                onClick={() => handleFetchInsight(item.name)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-200 hover:text-amber-500 transition-all border border-transparent hover:border-amber-100"
                              >
                                <i className={`fas ${currentlyFetchingItem === item.name ? 'fa-spinner fa-spin' : 'fa-brain'} text-[10px]`}></i>
                              </button>
                            </div>
                          ))}
                      </div>

                      <div className="p-5 bg-stone-50/50 border-t border-stone-100">
                          <button 
                            onClick={() => handleBumpTable(key)} 
                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isVisitor ? 'bg-blue-900 text-white hover:bg-emerald-500 hover:text-stone-900' : 'bg-stone-900 text-white hover:bg-emerald-500 hover:text-stone-900'}`}
                          >
                            Mark Ready
                          </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Batching View Sidebar */}
        {!isKioskMode && showBatchView && consolidatedBatch.length > 0 && (
          <div className="w-80 bg-white border border-stone-200 rounded-[2.5rem] shadow-xl flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right-4 duration-300">
             <div className="p-6 bg-stone-950 text-white flex justify-between items-center">
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest">Need to Make</h3>
                   <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-0.5">Consolidated Batches</p>
                </div>
                <i className="fas fa-layer-group text-stone-700"></i>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                {consolidatedBatch.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-stone-50 border border-stone-100 rounded-2xl group hover:border-amber-500 transition-all">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-stone-200 flex items-center justify-center text-lg font-black text-stone-900 group-hover:bg-amber-500 transition-colors">
                           {item.quantity}
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-bold text-stone-800 truncate">{item.name}</p>
                           <p className="text-[8px] font-black text-stone-400 uppercase">{item.category}</p>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
             <div className="p-6 border-t border-stone-50 bg-stone-50/50">
                <p className="text-[9px] text-stone-400 leading-relaxed italic text-center">
                   "Grouping allows for rapid glass-staging and efficient pouring sequences."
                </p>
             </div>
          </div>
        )}
      </div>

      {/* Speed Dial / Manual Order Modal */}
      {showDirectOrder && (
        <div className="fixed inset-0 z-[400] bg-stone-950/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-6xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/10">
              <div className={`p-8 flex justify-between items-center shrink-0 ${isKioskMode ? 'bg-blue-600 text-white' : 'bg-stone-900 text-white'}`}>
                 <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 mb-1 block">
                      {isKioskMode ? 'Visitor Portal' : 'Manual Entry Terminal'}
                    </span>
                    <h3 className="text-3xl font-serif font-bold italic tracking-tight">
                      {isKioskMode ? 'Select Your Order' : 'Point of Sale Protocol'}
                    </h3>
                 </div>
                 <button onClick={() => { setShowDirectOrder(false); setIsKioskMode(false); }} className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/10 active:scale-90">
                    <i className="fas fa-times text-xl"></i>
                 </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                 <div className="flex-1 flex flex-col bg-stone-50 p-10 overflow-hidden border-r border-stone-200">
                    {/* Identifier Input */}
                    <div className="mb-10 w-full">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 ml-1">Order Identification (Guest Name / Table)</label>
                      <input 
                        type="text" 
                        value={visitorName} 
                        onChange={(e) => setVisitorName(e.target.value)} 
                        placeholder="Elena Rossi (T-04)..." 
                        className="w-full px-8 py-5 bg-white border border-stone-200 rounded-3xl focus:ring-4 focus:ring-blue-500/10 outline-none font-bold text-xl shadow-sm transition-all" 
                      />
                    </div>

                    {/* NEW: Speed Dial / Popular Section */}
                    <div className="mb-10 space-y-4">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 ml-1">Speed Dial (Most Ordered)</h4>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {popularItems.map(item => (
                            <button 
                               key={item.id} 
                               onClick={() => addToDirectCart(item.id)} 
                               className="p-6 bg-white border border-stone-100 rounded-[2rem] text-center space-y-2 hover:border-amber-500 hover:shadow-xl transition-all group active:scale-95 shadow-sm"
                            >
                               <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto text-stone-400 group-hover:bg-amber-500 group-hover:text-stone-900 transition-colors">
                                  <i className={`fas ${item.category === 'Wine' ? 'fa-wine-glass' : 'fa-glass-martini'} text-xl`}></i>
                                </div>
                               <p className="text-xs font-black text-stone-800 leading-tight truncate">{item.name}</p>
                               <p className="text-[9px] font-bold text-stone-400 uppercase">${item.price}</p>
                            </button>
                          ))}
                       </div>
                    </div>
                    
                    <div className="relative mb-8 shrink-0">
                       <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-stone-300"></i>
                       <input 
                         type="text" 
                         value={directOrderSearch} 
                         onChange={(e) => setDirectOrderSearch(e.target.value)} 
                         placeholder="Full Inventory Lookup..." 
                         className="w-full pl-14 pr-8 py-5 bg-white border border-stone-200 rounded-[2rem] focus:ring-4 focus:ring-amber-500/10 font-bold outline-none shadow-sm text-sm" 
                       />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-10 pb-10">
                       {(['Wine', 'Spirit', 'Beer', 'Mixer', 'Snack'] as const).map(cat => {
                         const items = inventory.filter(i => i.category === cat && i.name.toLowerCase().includes(directOrderSearch.toLowerCase()));
                         if (items.length === 0) return null;
                         return (
                           <div key={cat} className="space-y-4">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 border-b border-stone-200 pb-2 ml-1">{cat} Archives</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                 {items.map(item => (
                                   <button 
                                     key={item.id} 
                                     onClick={() => addToDirectCart(item.id)} 
                                     className="bg-white p-5 rounded-2xl border border-stone-50 hover:border-blue-500 hover:shadow-lg transition-all text-left flex justify-between items-center group active:scale-[0.98] shadow-sm"
                                   >
                                      <div className="min-w-0 pr-4">
                                         <p className="font-bold text-stone-800 group-hover:text-blue-600 transition-colors truncate">{item.name}</p>
                                         <p className="text-[9px] text-stone-400 font-black uppercase tracking-tighter mt-0.5">${item.price}</p>
                                      </div>
                                      <div className="w-9 h-9 rounded-xl bg-stone-50 group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                                         <i className="fas fa-plus text-[10px]"></i>
                                      </div>
                                   </button>
                                 ))}
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>

                 {/* Order Sidebar */}
                 <div className="w-[400px] bg-white shrink-0 flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.05)] border-l border-stone-100">
                    <div className="p-8 border-b border-stone-50 bg-stone-50/50">
                       <h4 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1 italic">Active Staging Area</h4>
                       <p className="text-[10px] font-bold text-stone-500 uppercase flex items-center gap-2">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                         {visitorName ? `Identity: ${visitorName}` : 'Awaiting Destination'}
                       </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                       {Object.entries(directCart).length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center opacity-20 text-center grayscale py-20 space-y-6">
                           <div className="w-24 h-24 rounded-[2rem] border-4 border-dashed border-stone-200 flex items-center justify-center">
                              <i className={`fas ${isKioskMode ? 'fa-cart-plus' : 'fa-shaker'} text-4xl`}></i>
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-600">Basket Silent</p>
                         </div>
                       ) : (
                         Object.entries(directCart).map(([id, qty]) => {
                           const item = inventory.find(i => i.id === id)!;
                           return (
                             <div key={id} className="flex justify-between items-center animate-in slide-in-from-right-4 group">
                                <div className="flex gap-5 items-center">
                                   <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1.5 border border-stone-200">
                                      <button onClick={() => removeFromDirectCart(id)} className="w-8 h-8 hover:bg-white rounded-lg transition-all shadow-sm flex items-center justify-center text-[10px]"><i className="fas fa-minus"></i></button>
                                      <span className="text-sm font-black w-8 text-center text-stone-900">{qty}</span>
                                      <button onClick={() => addToDirectCart(id)} className="w-8 h-8 hover:bg-white rounded-lg transition-all shadow-sm flex items-center justify-center text-[10px]"><i className="fas fa-plus"></i></button>
                                   </div>
                                   <div><p className="text-sm font-bold text-stone-900">{item.name}</p></div>
                                </div>
                                <button onClick={() => setDirectCart(prev => {const next={...prev}; delete next[id]; return next;})} className="w-8 h-8 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                   <i className="fas fa-trash-alt text-[10px]"></i>
                                </button>
                             </div>
                           );
                         })
                       )}
                    </div>

                    <div className={`p-8 border-t border-stone-100 text-white rounded-t-[4rem] shadow-2xl ${isKioskMode ? 'bg-blue-700' : 'bg-stone-900'}`}>
                       <div className="flex justify-between items-end mb-8">
                          <div>
                             <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1 opacity-60 italic">Retail Summation</p>
                             <p className="text-5xl font-serif font-black italic tracking-tighter text-amber-500">${cartTotal.toFixed(2)}</p>
                          </div>
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                             <i className="fas fa-receipt text-amber-500 text-2xl"></i>
                          </div>
                       </div>
                       <button 
                         onClick={handleFireDirectOrder} 
                         disabled={Object.keys(directCart).length === 0 || !visitorName} 
                         className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] transition-all shadow-xl active:scale-95 disabled:opacity-30 disabled:grayscale ${
                           isKioskMode ? 'bg-white text-blue-900 hover:bg-blue-50' : 'bg-amber-500 text-stone-900 hover:bg-amber-400'
                         }`}
                       >
                         {isKioskMode ? 'Place Order' : 'Commit to Bar'}
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* AI Sequence Modal */}
      {sequenceData && (
        <div className="fixed inset-0 z-[500] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95">
           <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200">
              <div className="p-8 bg-stone-900 text-white flex justify-between items-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><i className="fas fa-bolt text-9xl"></i></div>
                 <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-amber-500 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Velocity Synthesis</span>
                    <h3 className="text-3xl font-serif font-bold italic tracking-tight mt-2">Alpha Prep Seq</h3>
                 </div>
                 <button onClick={() => setSequenceData(null)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20"><i className="fas fa-times"></i></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    {sequenceData.sequence.map((step, i) => (
                      <div key={i} className="flex gap-5 p-5 bg-stone-50 rounded-2xl items-center border border-stone-100 group hover:border-amber-500 transition-all">
                        <span className="shrink-0 w-8 h-8 rounded-xl bg-stone-900 text-amber-500 flex items-center justify-center text-[11px] font-black group-hover:scale-110 transition-transform">{i + 1}</span>
                        <p className="text-sm font-bold text-stone-700">{step}</p>
                      </div>
                    ))}
                 </div>
                 <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 shadow-inner">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2 italic"><i className="fas fa-microchip"></i> AI Scholar Pro-Tip</p>
                    <p className="text-sm text-amber-900 font-medium italic leading-relaxed">"{sequenceData.proTip}"</p>
                 </div>
              </div>
              <div className="p-8 border-t border-stone-100 bg-stone-50 flex justify-end">
                <button onClick={() => setSequenceData(null)} className="px-12 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Acknowledge</button>
              </div>
           </div>
        </div>
      )}

      {/* AI discovery Modal */}
      {insightData && (
        <div className="fixed inset-0 z-[500] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200">
              <div className="p-8 bg-stone-900 text-white flex justify-between items-center relative overflow-hidden">
                 <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">Knowledge Node</span>
                    <h3 className="text-4xl font-serif font-bold italic tracking-tight mt-2">{insightData.name}</h3>
                 </div>
                 <button onClick={() => setInsightData(null)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20 active:scale-90 border border-white/5 shadow-xl"><i className="fas fa-times"></i></button>
              </div>
              <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-amber-600 tracking-[0.3em] mb-4 border-b border-stone-100 pb-2">Technical Origins</h4>
                      <p className="text-sm text-stone-600 leading-relaxed italic font-medium">"{insightData.origins}"</p>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase text-amber-600 tracking-[0.3em] mb-4 border-b border-stone-100 pb-2">Heritage History</h4>
                      <p className="text-sm text-stone-600 leading-relaxed italic font-medium">"{insightData.history}"</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[11px] font-black uppercase text-amber-600 tracking-[0.3em] mb-2">Technical Specs & Facts</h4>
                    <div className="grid grid-cols-1 gap-3">
                       {insightData.facts.map((fact, i) => (
                         <div key={i} className="flex gap-4 p-5 bg-stone-50 border border-stone-100 rounded-2xl items-start group hover:border-amber-500 transition-all">
                            <span className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-amber-600 shadow-sm border border-stone-200 group-hover:bg-amber-500 group-hover:text-stone-900 transition-colors">{i+1}</span>
                            <p className="text-xs font-bold text-stone-800 pt-1 leading-relaxed">{fact}</p>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="p-8 border-t border-stone-100 bg-stone-50 flex justify-end">
                 <button onClick={() => setInsightData(null)} className="px-12 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] shadow-xl hover:bg-stone-800 transition-all active:scale-95">Exit Scholarship</button>
              </div>
           </div>
        </div>
      )}

      {/* Wastage Modal */}
      {showWastage && (
        <div className="fixed inset-0 z-[400] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 space-y-8 border border-stone-200">
              <div className="space-y-2 text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner"><i className="fas fa-flask-vial text-2xl"></i></div>
                <h3 className="text-3xl font-serif font-bold text-stone-900 italic">Log Shrinkage</h3>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">Protocol: Wastage Record</p>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-500 ml-1">Select Disposed Item</label>
                    <select value={wastageItem?.id || ''} onChange={(e) => setWastageItem(inventory.find(i => i.id === e.target.value) || null)} className="w-full py-4 bg-stone-50 border border-stone-200 rounded-2xl px-6 text-sm font-bold outline-none appearance-none shadow-inner">
                        <option value="">Choose Registry Node...</option>
                        {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setShowWastage(false)} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all">Cancel</button>
                    <button onClick={() => setShowWastage(false)} className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-rose-700 transition-all active:scale-95">Commit to Silo</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BarStationView;


import React, { useState, useMemo } from 'react';
import { InventoryItem, OrderItem, Table } from '../lib/types';
import { motion, AnimatePresence } from 'motion/react';

interface AdjustablePOSProps {
  table: Table;
  inventory: InventoryItem[];
  currentCart: OrderItem[];
  activeSeat: number | null;
  onAddToCart: (item: InventoryItem) => void;
  onRemoveFromCart: (index: number) => void;
  onUpdateItem: (index: number, updates: Partial<OrderItem>) => void;
  onSetActiveSeat: (seat: number | null) => void;
  onPlaceOrder: (priority?: 'Normal' | 'High' | 'VIP', isDraft?: boolean, isPickup?: boolean) => void;
  onPayNow?: (priority?: 'Normal' | 'High' | 'VIP', isPickup?: boolean) => void;
  isKiosk?: boolean;
}

type SidebarPosition = 'left' | 'right';
type StationProfile = 'Standard' | 'Lightspeed' | 'Square' | 'Tactical';

const AdjustablePOS: React.FC<AdjustablePOSProps> = ({
  table,
  inventory,
  currentCart,
  activeSeat,
  onAddToCart,
  onRemoveFromCart,
  onUpdateItem,
  onSetActiveSeat,
  onPlaceOrder,
  onPayNow,
  isKiosk = false
}) => {
  const [profile, setProfile] = useState<StationProfile>('Lightspeed');
  const [sidebarPos] = useState<SidebarPosition>('right');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [showQuickModFor, setShowQuickModFor] = useState<InventoryItem | null>(null);
  const [isPickup, setIsPickup] = useState(false);

  const [isHardwareMode, setIsHardwareMode] = useState(true);

  const categories = useMemo(() => {
    const standardCats = ['Wine', 'Spirit', 'Beer', 'Mixer', 'Cocktail', 'Snack'];
    const cats = Array.from(new Set([...standardCats, ...inventory.map(i => i.category)]));
    return ['All', ...cats.sort()];
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [inventory, searchTerm, activeCategory]);

  const calculateModifierPrice = (item: InventoryItem, modifier?: string) => {
    const isBottle = item.unit.toLowerCase().includes('bottle');
    const divisor = item.category === 'Wine' ? 5 : 12;
    const baseServingPrice = item.servingPrice || (isBottle ? item.price / divisor : item.price);

    switch (modifier) {
      case 'Double': return baseServingPrice * 1.8;
      case 'Rocks': case 'On the Rocks': return baseServingPrice + 2.0;
      case 'Mix': case 'Measurement Mix': return baseServingPrice + 1.5;
      case 'Shot': return baseServingPrice * 0.6;
      case 'Neat': return baseServingPrice;
      default: return (item.category === 'Spirit' || item.category === 'Wine') ? baseServingPrice : item.price;
    }
  };

  const cartTotal = currentCart.reduce((sum, item) => sum + (item.priceAtOrder * item.quantity), 0);

  // Tablet Grid Definitions
  const gridCols = profile === 'Lightspeed' 
    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
    : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';

  const terminalContent = (
    <div className={`flex h-full gap-2 transition-all duration-700 bg-stone-100 p-2 overflow-hidden ${sidebarPos === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Category Sidebar (Standard in Hardware POS) */}
      <div className="w-20 md:w-24 flex flex-col gap-1 overflow-y-auto no-scrollbar shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex flex-col items-center justify-center py-4 px-1 rounded-2xl transition-all active:scale-90 ${
              activeCategory === cat 
                ? 'bg-stone-900 text-amber-500 shadow-lg' 
                : 'bg-white text-stone-400 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            <i className={`fas ${
              cat === 'Wine' ? 'fa-wine-glass' : 
              cat === 'Spirit' ? 'fa-whiskey-glass' : 
              cat === 'Cocktail' ? 'fa-martini-glass' : 
              cat === 'Snack' ? 'fa-cookie' : 'fa-grid-2'
            } text-xs mb-2`}></i>
            <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-none">{cat}</span>
          </button>
        ))}
      </div>

      {/* Main Terminal Area */}
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-stone-200 shadow-xl overflow-hidden min-w-0">
        
        {/* Terminal Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex flex-col">
                <h2 className="text-sm font-black text-stone-900 uppercase tracking-widest leading-none">Terminal Node: 04</h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Silo-Sync: Stable</span>
                </div>
             </div>
             <div className="h-8 w-px bg-stone-100"></div>
             <div className="relative group">
               <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-[10px]"></i>
               <input 
                 type="text"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Search Items..."
                 className="pl-8 pr-4 py-2 bg-stone-50 border border-stone-100 rounded-full text-xs font-bold focus:ring-2 focus:ring-stone-900 outline-none w-48 lg:w-64 transition-all"
               />
             </div>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={() => setProfile('Lightspeed')} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${profile === 'Lightspeed' ? 'bg-rose-500 text-white shadow-lg' : 'text-stone-400 bg-stone-50'}`}>K-Series</button>
             <button onClick={() => setProfile('Square')} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${profile === 'Square' ? 'bg-indigo-600 text-white shadow-lg' : 'text-stone-400 bg-stone-50'}`}>Register</button>
             <div className="w-px h-4 bg-stone-200 mx-2"></div>
             <button 
                onClick={() => setIsHardwareMode(!isHardwareMode)}
                className={`w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center transition-all ${isHardwareMode ? 'bg-stone-900 text-white' : 'text-stone-400'}`}
             >
                <i className="fas fa-tablet"></i>
             </button>
          </div>
        </div>

        {/* Dense Grid Interface */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 grid ${gridCols} gap-2 lg:gap-3 custom-scrollbar touch-scrolling`}>
          {filteredInventory.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onAddToCart(item);
                if (item.category === 'Spirit' || item.category === 'Mixer' || item.category === 'Cocktail') {
                  setShowQuickModFor(item);
                }
              }}
              className={`text-left rounded-2xl border transition-all active:scale-95 group relative flex flex-col p-4 min-h-[100px] lg:min-h-[120px] justify-between
                ${profile === 'Lightspeed' ? 'bg-stone-50 border-stone-200 hover:border-stone-900 hover:bg-white' : 'bg-white border-stone-100 hover:bg-stone-50 shadow-sm'}
              `}
            >
              <div className="space-y-1">
                <p className="text-[10px] lg:text-[11px] font-black text-stone-900 uppercase leading-tight line-clamp-2">{item.name}</p>
                <span className="text-[7px] font-black text-stone-400 uppercase tracking-widest">{item.category}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                 <span className="text-xs font-black text-stone-900">${item.price}</span>
                 <div className="w-6 h-6 rounded-lg bg-stone-900 text-white flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-plus"></i>
                 </div>
              </div>
              {item.id === 'STOCK_LOW' && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                   <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></div>
                   <span className="text-[6px] font-black text-rose-500 uppercase">Low</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Persistent Order Ticket (Ergonomic Right Column) */}
      <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col gap-2 shrink-0 h-full">
        
        {/* Guest Header */}
        <div className="bg-stone-900 text-white p-6 rounded-[2.5rem] border border-white/10 shadow-2xl shrink-0 flex justify-between items-center">
           <div>
              <p className="text-[8px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-1">Check Identity</p>
              <h3 className="text-lg font-serif font-black italic tracking-tight">Table {table.number} Terminal</h3>
              <p className="text-[10px] text-stone-500 font-bold uppercase">{table.occupantName || 'Walk-in Anonymous'}</p>
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPickup(!isPickup)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isPickup ? 'bg-indigo-500 text-white' : 'bg-white/5 text-stone-500 hover:text-white'}`}
              >
                <i className={`fas ${isPickup ? 'fa-truck-fast' : 'fa-utensils'}`}></i>
              </button>
           </div>
        </div>

        {/* Seat Ribbon */}
        <div className={`bg-white p-2 rounded-2xl border border-stone-200 flex gap-1 shrink-0 ${isPickup ? 'opacity-30 pointer-events-none' : ''}`}>
           <button 
              onClick={() => onSetActiveSeat(null)}
              className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase transition-all ${activeSeat === null ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-50 text-stone-400'}`}
           >
              Party
           </button>
           {[...Array(table.capacity)].map((_, i) => (
              <button
                key={i}
                onClick={() => onSetActiveSeat(i)}
                className={`flex-1 py-3 rounded-xl text-[9px] font-black transition-all ${activeSeat === i ? 'bg-stone-900 text-white shadow-lg' : 'bg-stone-50 text-stone-400'}`}
              >
                P{i + 1}
              </button>
           ))}
        </div>

        {/* Ticket Body */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-stone-200 shadow-xl flex flex-col overflow-hidden">
           <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
              {currentCart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center p-10">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-stone-200 flex items-center justify-center mb-4">
                       <i className="fas fa-plus text-stone-200"></i>
                    </div>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Awaiting Input</p>
                 </div>
              ) : (
                currentCart.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className={`flex flex-col p-4 rounded-2xl border transition-all ${editingItemIdx === idx ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-white border-stone-100 hover:bg-stone-50'}`}
                  >
                    <div className="flex justify-between items-start">
                       <div className="flex gap-4 items-center">
                          <span className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center text-xs font-black italic">{item.quantity}</span>
                          <div className="min-w-0">
                             <p className="text-xs font-black text-stone-900 uppercase truncate">{item.name}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                                   {item.seat !== null ? `Seat ${item.seat + 1}` : 'Shared'}
                                </span>
                                {item.modifier && (
                                   <span className="text-[8px] font-black text-stone-400 italic">[{item.modifier}]</span>
                                )}
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-black text-stone-900">${(item.priceAtOrder * item.quantity).toFixed(2)}</p>
                          <div className="flex gap-1 mt-2">
                             <button onClick={() => setEditingItemIdx(editingItemIdx === idx ? null : idx)} className="w-7 h-7 rounded-lg bg-stone-100 text-stone-400 hover:text-stone-900 transition-all flex items-center justify-center">
                                <i className="fas fa-sliders text-[9px]"></i>
                             </button>
                             <button onClick={() => onRemoveFromCart(idx)} className="w-7 h-7 rounded-lg bg-stone-100 text-stone-400 hover:text-rose-500 transition-all flex items-center justify-center">
                                <i className="fas fa-times text-[9px]"></i>
                             </button>
                          </div>
                       </div>
                    </div>

                    {editingItemIdx === idx && (
                       <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-4 pt-4 border-t border-stone-200 grid grid-cols-3 gap-1 grid-rows-2">
                          {['Standard', 'Shot', 'Double', 'On the Rocks', 'Neat', 'Mix'].map(m => (
                             <button
                                key={m}
                                onClick={() => {
                                   const baseItem = inventory.find(inv => inv.name === item.name);
                                   if (baseItem) {
                                      const newPrice = calculateModifierPrice(baseItem, m);
                                      onUpdateItem(idx, { modifier: m as OrderItem['modifier'], priceAtOrder: newPrice });
                                   }
                                   setEditingItemIdx(null);
                                }}
                                className={`py-2 rounded-lg text-[7px] font-black uppercase tracking-tighter ${item.modifier === m ? 'bg-indigo-600 text-white' : 'bg-stone-100 text-stone-500'}`}
                             >
                                {m === 'Standard' ? item.unit : m}
                             </button>
                          ))}
                       </motion.div>
                    )}
                  </motion.div>
                ))
              )}
           </div>

           {/* Hardware-Style Action Pad */}
           <div className="p-8 bg-stone-50 border-t border-stone-100 space-y-6">
              <div className="flex justify-between items-end">
                 <div>
                    <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1 block">Total Due (SaaS Sync)</span>
                    <p className="text-4xl font-serif font-black italic text-stone-900">${cartTotal.toFixed(2)}</p>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <span className="text-[14px] font-black text-stone-900 italic">#{currentCart.length} Items</span>
                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">Ready for Sync</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => onPlaceOrder('Normal', true, isPickup)}
                   disabled={currentCart.length === 0}
                   className="py-4 bg-white border border-stone-200 rounded-2xl font-black uppercase text-[10px] tracking-widest text-stone-400 hover:text-stone-900 transition-all active:scale-95 disabled:opacity-30"
                 >
                    Hold / Draft
                 </button>
                 <button 
                   onClick={() => onPlaceOrder('Normal', false, isPickup)}
                   disabled={currentCart.length === 0}
                   className="py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-30 shadow-xl"
                 >
                    Fire Order
                 </button>
              </div>

              {onPayNow && (isPickup || isKiosk) && (
                 <button 
                    onClick={() => onPayNow('Normal', isPickup)}
                    disabled={currentCart.length === 0}
                    className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 active:scale-95"
                 >
                    <i className="fas fa-credit-card text-xs"></i>
                    Pay Now
                 </button>
              )}
           </div>
        </div>

        {/* Command Hot-Keys */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
           {[
             { label: 'Rush Order', icon: 'fa-bolt', color: 'text-indigo-500', action: () => onPlaceOrder('High', false, isPickup) },
             { label: 'Print Draft', icon: 'fa-print', color: 'text-stone-400', action: () => {} },
             { label: 'Void Order', icon: 'fa-ban', color: 'text-rose-500', action: () => {} }
           ].map((cmd, i) => (
             <button
               key={i}
               onClick={cmd.action}
               className="flex flex-col items-center justify-center py-3 bg-white border border-stone-200 rounded-2xl transition-all active:scale-95 group"
             >
                <i className={`fas ${cmd.icon} ${cmd.color} mb-1.5 text-xs`}></i>
                <span className="text-[7px] font-black uppercase tracking-widest text-stone-400 group-hover:text-stone-900">{cmd.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Modifier Modal Overlay */}
      <AnimatePresence>
        {showQuickModFor && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               exit={{ scale: 0.9, y: 20 }}
               className="bg-white w-full max-w-md rounded-[3rem] p-10 border border-stone-200 shadow-2xl"
             >
                <div className="flex justify-between items-start mb-8">
                   <div>
                      <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] mb-2">Refining Selection</h4>
                      <h3 className="text-2xl font-serif font-black italic text-stone-900">{showQuickModFor.name}</h3>
                   </div>
                   <button onClick={() => setShowQuickModFor(null)} className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-all">
                      <i className="fas fa-times"></i>
                   </button>
                </div>

                <div className="space-y-8">
                   <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Volume & Scale</p>
                      <div className="grid grid-cols-3 gap-2">
                         {['Standard', 'Shot', 'Double'].map(m => (
                            <button
                               key={m}
                               onClick={() => {
                                  const lastIdx = currentCart.length - 1;
                                  if (lastIdx >= 0) {
                                     const newPrice = calculateModifierPrice(showQuickModFor, m);
                                     onUpdateItem(lastIdx, { modifier: m as OrderItem['modifier'], priceAtOrder: newPrice });
                                  }
                                  setShowQuickModFor(null);
                               }}
                               className="py-5 bg-stone-50 border border-stone-100 rounded-3xl text-[10px] font-black uppercase text-stone-600 hover:bg-stone-900 hover:text-white transition-all shadow-sm"
                            >
                               {m}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Presentation Style</p>
                      <div className="grid grid-cols-3 gap-2">
                         {['On the Rocks', 'Neat', 'Mix'].map(m => (
                            <button
                               key={m}
                               onClick={() => {
                                  const lastIdx = currentCart.length - 1;
                                  if (lastIdx >= 0) {
                                     const newPrice = calculateModifierPrice(showQuickModFor, m);
                                     onUpdateItem(lastIdx, { modifier: m as OrderItem['modifier'], priceAtOrder: newPrice });
                                  }
                                  setShowQuickModFor(null);
                               }}
                               className="py-5 bg-stone-50 border border-stone-100 rounded-3xl text-[10px] font-black uppercase text-stone-600 hover:bg-stone-900 hover:text-white transition-all shadow-sm"
                            >
                               {m}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <button onClick={() => setShowQuickModFor(null)} className="w-full py-5 bg-indigo-500 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] mt-10 shadow-xl hover:bg-indigo-400 active:scale-95 transition-all">
                   Finalize Configuration
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className={`w-full h-full flex items-center justify-center transition-all min-h-[600px] duration-1000 ${isHardwareMode ? 'bg-stone-300 p-4 md:p-12' : 'p-0'}`}>
      <div className={`relative transition-all duration-1000 bg-stone-100 ${
        isHardwareMode 
          ? 'w-full max-w-[1400px] aspect-[4/3] rounded-[4rem] border-[16px] border-stone-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col p-8' 
          : 'w-full h-full'
      }`}>
        {isHardwareMode && (
          <div className="absolute top-1/2 -right-4 -translate-y-1/2 flex flex-col gap-4">
             <div className="w-1 h-12 bg-stone-700 rounded-l-md"></div>
             <div className="w-1 h-8 bg-stone-700 rounded-l-md"></div>
          </div>
        )}
        
        {terminalContent}

        {isHardwareMode && (
          <div className="absolute top-1/2 -right-10 -translate-y-1/2 flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-opacity">
            <div className="w-4 h-4 rounded-full border-2 border-stone-800"></div>
            <span className="text-[6px] font-black uppercase text-stone-800">Home</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdjustablePOS;

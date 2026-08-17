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

  // Lightspeed specific states
  const [covers, setCovers] = useState<number>(table.capacity > 0 ? table.capacity : 2);
  const [elapsedMinutes] = useState<number>(42); // Seated Timer duration (simulated)
  const [showSplitModal, setShowSplitModal] = useState<boolean>(false);
  const [splitType, setSplitType] = useState<'even' | 'seat'>('even');
  const [evenSplitParts, setEvenSplitParts] = useState<number>(2);
  
  // Payment tracking states
  const [paidEvenSplits, setPaidEvenSplits] = useState<Record<number, boolean>>({});
  const [paidSeats, setPaidSeats] = useState<Record<string, boolean>>({});
  
  // Payment terminal simulator state
  const [paymentTerminal, setPaymentTerminal] = useState<{
    status: 'idle' | 'tap' | 'processing' | 'success';
    activeId: string | number | null;
  }>({ status: 'idle', activeId: null });

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

  // Automatic Course Mapping helper based on item category or name
  const getItemCourse = (item: OrderItem): 'Drinks' | 'Appetizer' | 'Main' | 'Dessert' => {
    if (item.course) return item.course;
    
    const nameLower = item.name.toLowerCase();
    
    if (
      nameLower.includes('wine') || 
      nameLower.includes('cocktail') || 
      nameLower.includes('pour') || 
      nameLower.includes('beer') || 
      nameLower.includes('whiskey') || 
      nameLower.includes('spirit') || 
      nameLower.includes('vodka') || 
      nameLower.includes('gin') || 
      nameLower.includes('rum') || 
      nameLower.includes('tequila') || 
      nameLower.includes('soda') || 
      nameLower.includes('water') || 
      nameLower.includes('tonic') || 
      nameLower.includes('margarita') || 
      nameLower.includes('sour') || 
      nameLower.includes('shaker') ||
      nameLower.includes('glass')
    ) {
      return 'Drinks';
    }
    
    if (
      nameLower.includes('snack') || 
      nameLower.includes('tasting') || 
      nameLower.includes('oyster') || 
      nameLower.includes('appetizer') || 
      nameLower.includes('starter') || 
      nameLower.includes('bread') || 
      nameLower.includes('cheese') || 
      nameLower.includes('charcuterie') || 
      nameLower.includes('tartare') || 
      nameLower.includes('salad')
    ) {
      return 'Appetizer';
    }
    
    if (
      nameLower.includes('dessert') || 
      nameLower.includes('sweet') || 
      nameLower.includes('cake') || 
      nameLower.includes('chocolate') || 
      nameLower.includes('sorbet') || 
      nameLower.includes('ice cream') || 
      nameLower.includes('tart')
    ) {
      return 'Dessert';
    }
    
    return 'Main';
  };

  // Group cart items by course for Lightspeed Course-driven ticket display
  const itemsByCourse = useMemo(() => {
    const grouped: Record<'Drinks' | 'Appetizer' | 'Main' | 'Dessert', { item: OrderItem; originalIndex: number }[]> = {
      Drinks: [],
      Appetizer: [],
      Main: [],
      Dessert: []
    };
    
    currentCart.forEach((item, index) => {
      const course = getItemCourse(item);
      grouped[course].push({ item, originalIndex: index });
    });
    
    return grouped;
  }, [currentCart]);

  // Seat splitting layout computations
  const itemsBySeat = useMemo(() => {
    const seats: Record<string, { item: OrderItem; originalIndex: number }[]> = {};
    currentCart.forEach((item, index) => {
      const seatKey = item.seat !== null && item.seat !== undefined ? `Seat ${item.seat + 1}` : 'Shared';
      if (!seats[seatKey]) seats[seatKey] = [];
      seats[seatKey].push({ item, originalIndex: index });
    });
    return seats;
  }, [currentCart]);

  const seatTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(itemsBySeat).forEach(([seat, groupedItems]) => {
      totals[seat] = groupedItems.reduce((sum, g) => sum + (g.item.priceAtOrder * g.item.quantity), 0);
    });
    return totals;
  }, [itemsBySeat]);

  // Payment status verifier
  const isEntireBillPaid = useMemo(() => {
    if (cartTotal === 0) return false;
    
    if (splitType === 'even') {
      for (let i = 0; i < evenSplitParts; i++) {
        if (!paidEvenSplits[i]) return false;
      }
      return true;
    } else {
      const activeSeats = Object.keys(itemsBySeat);
      if (activeSeats.length === 0) return false;
      for (const seat of activeSeats) {
        if (!paidSeats[seat]) return false;
      }
      return true;
    }
  }, [splitType, evenSplitParts, paidEvenSplits, paidSeats, itemsBySeat, cartTotal]);

  // Simulated card terminal process
  const startPaymentProcess = (id: string | number) => {
    setPaymentTerminal({ status: 'tap', activeId: id });
    
    // Simulate card read/tap
    setTimeout(() => {
      setPaymentTerminal(prev => (prev.activeId === id ? { status: 'processing', activeId: id } : prev));
      
      // Simulate bank authorization
      setTimeout(() => {
        setPaymentTerminal(prev => {
          if (prev.activeId === id) {
            if (splitType === 'even') {
              setPaidEvenSplits(p => ({ ...p, [id as number]: true }));
            } else {
              setPaidSeats(p => ({ ...p, [id as string]: true }));
            }
            return { status: 'success', activeId: id };
          }
          return prev;
        });
        
        // Clear terminal overlay state
        setTimeout(() => {
          setPaymentTerminal({ status: 'idle', activeId: null });
        }, 1200);
      }, 1500);
    }, 1000);
  };

  // Close split billing workflow, fire POS integration triggers, clear carts
  const finalizeAndCloseBill = () => {
    if (onPayNow) {
      onPayNow('Normal', isPickup);
    } else {
      onPlaceOrder('Normal', false, isPickup);
    }
    // Clear state
    setShowSplitModal(false);
    setPaidEvenSplits({});
    setPaidSeats({});
  };

  // K-Series category colors
  const getCategoryColorStyles = (cat: string) => {
    switch (cat) {
      case 'Wine': return 'border-l-4 border-l-rose-700 bg-rose-50/50 hover:bg-rose-50 border-rose-100';
      case 'Spirit': return 'border-l-4 border-l-amber-600 bg-amber-50/50 hover:bg-amber-50 border-amber-100';
      case 'Cocktail': return 'border-l-4 border-l-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100';
      case 'Beer': return 'border-l-4 border-l-yellow-500 bg-yellow-50/50 hover:bg-yellow-50 border-yellow-100';
      case 'Mixer': return 'border-l-4 border-l-stone-400 bg-stone-50/50 hover:bg-stone-50 border-stone-100';
      case 'Snack': case 'Lunch': case 'Dinner': return 'border-l-4 border-l-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100';
      default: return 'border-l-4 border-l-stone-300 bg-white hover:bg-stone-50 border-stone-200';
    }
  };

  const gridCols = profile === 'Lightspeed' 
    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' 
    : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8';

  const terminalContent = (
    <div className={`flex h-full gap-2 transition-all duration-700 bg-stone-100 p-2 overflow-hidden ${sidebarPos === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Category Sidebar */}
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
                <div className="flex items-center gap-2">
                   <h2 className="text-xs font-black text-stone-900 uppercase tracking-widest leading-none">Lightspeed K-Series</h2>
                   <div className="px-1.5 py-0.5 bg-rose-50 rounded-md flex items-center gap-1 border border-rose-100">
                     <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                     <span className="text-[6px] font-black uppercase text-rose-600 tracking-wider">Cloud Live</span>
                   </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[8px] font-bold text-stone-400 uppercase">Table {table.number} • Guests: {covers} • Seated {elapsedMinutes}m</span>
                </div>
             </div>
             <div className="h-8 w-px bg-stone-100"></div>
             <div className="relative group">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-[10px]"></i>
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Menu..."
                  className="pl-8 pr-4 py-2 bg-stone-50 border border-stone-100 rounded-full text-xs font-bold focus:ring-2 focus:ring-stone-900 outline-none w-40 lg:w-48 transition-all"
                />
             </div>
          </div>

          <div className="flex items-center gap-1.5">
             {/* Covers Control */}
             <div className="flex items-center bg-stone-100 rounded-full p-1 border border-stone-200 gap-1 mr-2">
                <button 
                  onClick={() => setCovers(prev => Math.max(1, prev - 1))}
                  className="w-5 h-5 rounded-full bg-white text-stone-600 flex items-center justify-center text-[9px] hover:bg-stone-200 transition-colors"
                >
                  <i className="fas fa-minus"></i>
                </button>
                <span className="text-[9px] font-black text-stone-800 px-1">{covers} G</span>
                <button 
                  onClick={() => setCovers(prev => prev + 1)}
                  className="w-5 h-5 rounded-full bg-white text-stone-600 flex items-center justify-center text-[9px] hover:bg-stone-200 transition-colors"
                >
                  <i className="fas fa-plus"></i>
                </button>
             </div>

             <button onClick={() => setProfile('Lightspeed')} className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${profile === 'Lightspeed' ? 'bg-rose-500 text-white shadow-md' : 'text-stone-400 bg-stone-50'}`}>Lightspeed</button>
             <button onClick={() => setProfile('Square')} className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${profile === 'Square' ? 'bg-indigo-600 text-white shadow-md' : 'text-stone-400 bg-stone-50'}`}>Square</button>
             <button 
                onClick={() => setIsHardwareMode(!isHardwareMode)}
                className={`w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center transition-all ${isHardwareMode ? 'bg-stone-900 text-white' : 'text-stone-400'}`}
             >
                <i className="fas fa-tablet-screen-button text-[10px]"></i>
             </button>
          </div>
        </div>

        {/* Dense Grid Interface */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-6 grid ${gridCols} gap-2 lg:gap-3 custom-scrollbar touch-scrolling bg-stone-50/50`}>
          {filteredInventory.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onAddToCart(item);
                if (item.category === 'Spirit' || item.category === 'Mixer' || item.category === 'Cocktail') {
                  setShowQuickModFor(item);
                }
              }}
              className={`text-left rounded-2xl border transition-all active:scale-95 group relative flex flex-col p-4 min-h-[105px] lg:min-h-[115px] justify-between shadow-xs
                ${profile === 'Lightspeed' ? getCategoryColorStyles(item.category) : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-900'}
              `}
            >
              <div className="space-y-1">
                <p className="text-[10px] lg:text-[11px] font-black text-stone-900 uppercase leading-tight line-clamp-2">{item.name}</p>
                <span className="text-[7px] font-black text-stone-400 uppercase tracking-widest">{item.category}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                 <span className="text-xs font-black text-stone-900">${item.price}</span>
                 <div className="w-5 h-5 rounded-lg bg-stone-900 text-white flex items-center justify-center text-[7px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="fas fa-plus"></i>
                 </div>
              </div>
              {item.stock <= item.minStock && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-50 px-1 py-0.5 rounded border border-rose-100">
                   <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse"></div>
                   <span className="text-[5px] font-black text-rose-500 uppercase">Low</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Persistent Order Ticket (Right Column) */}
      <div className="w-full lg:w-[380px] xl:w-[410px] flex flex-col gap-2 shrink-0 h-full">
        
        {/* Guest Header */}
        <div className="bg-stone-900 text-white p-5 rounded-[2.5rem] border border-white/10 shadow-2xl shrink-0 flex justify-between items-center">
           <div>
              <p className="text-[7px] font-black uppercase text-rose-400 tracking-[0.3em] mb-1">Active Account</p>
              <h3 className="text-base font-serif font-black italic tracking-tight">Table {table.number} Billing</h3>
              <p className="text-[9px] text-stone-400 font-bold uppercase">{table.occupantName || 'Walk-in Guest'}</p>
           </div>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPickup(!isPickup)}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${isPickup ? 'bg-rose-500 text-white' : 'bg-white/5 text-stone-400 hover:text-white'}`}
              >
                <i className={`fas ${isPickup ? 'fa-truck-fast' : 'fa-bowl-food'} text-xs`}></i>
              </button>
           </div>
        </div>

        {/* Seat Ribbon */}
        <div className={`bg-white p-1.5 rounded-2xl border border-stone-200 flex gap-1 shrink-0 ${isPickup ? 'opacity-30 pointer-events-none' : ''}`}>
           <button 
              onClick={() => onSetActiveSeat(null)}
              className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${activeSeat === null ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-50 text-stone-400 hover:text-stone-800'}`}
           >
              Party
           </button>
           {[...Array(table.capacity > 0 ? table.capacity : 4)].map((_, i) => (
              <button
                key={i}
                onClick={() => onSetActiveSeat(i)}
                className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all ${activeSeat === i ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-50 text-stone-400 hover:text-stone-800'}`}
              >
                P{i + 1}
              </button>
           ))}
        </div>

        {/* Ticket Body - Course Grouped */}
        <div className="flex-1 bg-white rounded-[2.5rem] border border-stone-200 shadow-xl flex flex-col overflow-hidden">
           <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {currentCart.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center p-10">
                    <div className="w-10 h-10 rounded-full border border-dashed border-stone-300 flex items-center justify-center mb-3">
                       <i className="fas fa-plus text-stone-300 text-xs"></i>
                    </div>
                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Awaiting Menu Entries</p>
                 </div>
              ) : (
                (['Drinks', 'Appetizer', 'Main', 'Dessert'] as const).map(courseName => {
                  const items = itemsByCourse[courseName];
                  if (items.length === 0) return null;
                  
                  return (
                    <div key={courseName} className="space-y-1.5">
                      <div className="flex items-center justify-between bg-stone-50 px-3 py-1 rounded-lg border border-stone-100">
                        <span className="text-[7px] font-black tracking-widest text-stone-500 uppercase flex items-center gap-1.5">
                          <i className={`fas ${
                            courseName === 'Drinks' ? 'fa-glass-water text-blue-500' :
                            courseName === 'Appetizer' ? 'fa-leaf text-emerald-500' :
                            courseName === 'Main' ? 'fa-plate-wheat text-rose-500' : 'fa-ice-cream text-amber-500'
                          }`}></i>
                          {courseName} Course
                        </span>
                        <span className="text-[7px] font-black text-stone-400 uppercase">Fired</span>
                      </div>

                      {items.map(({ item, originalIndex }) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={originalIndex} 
                          className={`flex flex-col p-3 rounded-2xl border transition-all ${editingItemIdx === originalIndex ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-stone-100 hover:bg-stone-50/50'}`}
                        >
                          <div className="flex justify-between items-start gap-1">
                             <div className="flex gap-2.5 items-center min-w-0">
                                <span className="w-7 h-7 bg-stone-900 text-white rounded-lg flex items-center justify-center text-[10px] font-black italic shrink-0">{item.quantity}</span>
                                <div className="min-w-0">
                                   <p className="text-[11px] font-black text-stone-950 uppercase truncate leading-tight">{item.name}</p>
                                   <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                      <span className="text-[7px] font-black text-rose-600 bg-rose-50 px-1 rounded uppercase">
                                         {item.seat !== null && item.seat !== undefined ? `Seat ${item.seat + 1}` : 'Shared'}
                                      </span>
                                      {item.modifier && (
                                         <span className="text-[7px] font-black text-stone-400 uppercase tracking-tighter">[{item.modifier}]</span>
                                      )}
                                   </div>
                                </div>
                             </div>
                             <div className="text-right shrink-0">
                                <p className="text-[11px] font-black text-stone-900">${(item.priceAtOrder * item.quantity).toFixed(2)}</p>
                                <div className="flex gap-1 mt-1 justify-end">
                                   <button onClick={() => setEditingItemIdx(editingItemIdx === originalIndex ? null : originalIndex)} className="w-6 h-6 rounded-md bg-stone-100 text-stone-400 hover:text-stone-900 transition-all flex items-center justify-center">
                                      <i className="fas fa-sliders text-[8px]"></i>
                                   </button>
                                   <button onClick={() => onRemoveFromCart(originalIndex)} className="w-6 h-6 rounded-md bg-stone-100 text-stone-400 hover:text-rose-500 transition-all flex items-center justify-center">
                                      <i className="fas fa-times text-[8px]"></i>
                                   </button>
                                </div>
                             </div>
                          </div>

                          {/* Quick Course Transfer buttons on each item */}
                          <div className="flex items-center justify-between border-t border-dashed border-stone-100 mt-2 pt-1.5">
                            <span className="text-[6px] font-bold text-stone-400 uppercase tracking-wider">Move Course:</span>
                            <div className="flex gap-0.5">
                              {(['Drinks', 'Appetizer', 'Main', 'Dessert'] as const).map(c => (
                                <button
                                  key={c}
                                  onClick={() => {
                                    onUpdateItem(originalIndex, { course: c });
                                  }}
                                  className={`px-1 py-0.5 rounded text-[6px] font-black uppercase transition-all ${
                                    getItemCourse(item) === c 
                                      ? 'bg-rose-500 text-white' 
                                      : 'bg-stone-100 text-stone-400 hover:text-stone-800'
                                  }`}
                                >
                                  {c[0]}
                                </button>
                              ))}
                            </div>
                          </div>

                          {editingItemIdx === originalIndex && (
                             <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-2 pt-2 border-t border-stone-100 grid grid-cols-3 gap-1">
                                {['Standard', 'Shot', 'Double', 'On the Rocks', 'Neat', 'Mix'].map(m => (
                                   <button
                                      key={m}
                                      onClick={() => {
                                         const baseItem = inventory.find(inv => inv.name === item.name);
                                         if (baseItem) {
                                            const newPrice = calculateModifierPrice(baseItem, m);
                                            onUpdateItem(originalIndex, { modifier: m as OrderItem['modifier'], priceAtOrder: newPrice });
                                         }
                                         setEditingItemIdx(null);
                                      }}
                                      className={`py-1.5 rounded-lg text-[6px] font-black uppercase tracking-tighter ${item.modifier === m ? 'bg-rose-600 text-white' : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}
                                   >
                                      {m === 'Standard' ? item.unit : m}
                                   </button>
                                ))}
                             </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  );
                })
              )}
           </div>

           {/* Hardware-Style Action Pad */}
           <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4 shrink-0">
              <div className="flex justify-between items-end">
                 <div>
                    <span className="text-[7px] font-black text-stone-400 uppercase tracking-widest mb-0.5 block font-mono">SaaS Cloud Total</span>
                    <p className="text-3xl font-serif font-black italic text-stone-900">${cartTotal.toFixed(2)}</p>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <span className="text-[11px] font-black text-stone-900 italic">#{currentCart.reduce((acc, i) => acc + i.quantity, 0)} Pours</span>
                    <button 
                      onClick={() => setShowSplitModal(true)}
                      disabled={currentCart.length === 0}
                      className="text-[7px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full mt-1.5 hover:bg-indigo-100 transition-colors uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <i className="fas fa-arrows-split-up-and-left mr-1"></i>
                      Split / Pay Bill
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                 <button 
                   onClick={() => onPlaceOrder('Normal', true, isPickup)}
                   disabled={currentCart.length === 0}
                   className="py-3.5 bg-white border border-stone-200 rounded-2xl font-black uppercase text-[9px] tracking-widest text-stone-400 hover:text-stone-900 transition-all active:scale-95 disabled:opacity-30"
                 >
                    Hold Course
                 </button>
                 <button 
                   onClick={() => onPlaceOrder('Normal', false, isPickup)}
                   disabled={currentCart.length === 0}
                   className="py-3.5 bg-stone-900 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-30 shadow-md"
                 >
                    Fire Course
                 </button>
              </div>

              {onPayNow && (isPickup || isKiosk) && (
                 <button 
                    onClick={() => onPayNow('Normal', isPickup)}
                    disabled={currentCart.length === 0}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                 >
                    <i className="fas fa-credit-card text-[10px]"></i>
                    Direct Pay Now
                 </button>
              )}
           </div>
        </div>

        {/* Command Hot-Keys */}
        <div className="grid grid-cols-3 gap-1.5 shrink-0">
           {[
             { label: 'Rush Ticket', icon: 'fa-bolt-lightning', color: 'text-rose-500', action: () => onPlaceOrder('High', false, isPickup) },
             { label: 'Print Bill', icon: 'fa-receipt', color: 'text-stone-400', action: () => {} },
             { label: 'Void All', icon: 'fa-trash-can', color: 'text-stone-300', action: () => {} }
           ].map((cmd, i) => (
             <button
               key={i}
               onClick={cmd.action}
               className="flex flex-col items-center justify-center py-2 bg-white border border-stone-200 rounded-2xl transition-all active:scale-95 group"
             >
                <i className={`fas ${cmd.icon} ${cmd.color} mb-1 text-[10px]`}></i>
                <span className="text-[6px] font-black uppercase tracking-widest text-stone-400 group-hover:text-stone-900">{cmd.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Modern Lightspeed Bill Splitter & Payment Hub Modal */}
      <AnimatePresence>
        {showSplitModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-stone-200 overflow-hidden flex flex-col h-[520px]"
            >
              {/* Header */}
              <div className="px-8 py-5 border-b border-stone-100 bg-stone-900 text-white flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black tracking-widest text-rose-500 uppercase">Lightspeed Payments</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[6px] font-black uppercase text-stone-400">Terminal Connected</span>
                  </div>
                  <h3 className="text-xl font-serif font-black italic tracking-tight">Cloud Bill splitting Hub</h3>
                </div>
                <button 
                  onClick={() => setShowSplitModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>

              {/* Mode Selectors */}
              <div className="flex border-b border-stone-100 bg-stone-50 p-2 shrink-0">
                <button
                  onClick={() => setSplitType('even')}
                  className={`flex-1 py-3 text-center rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                    splitType === 'even' ? 'bg-white text-rose-500 shadow-sm border border-stone-200' : 'text-stone-400 hover:text-stone-800'
                  }`}
                >
                  <i className="fas fa-calculator mr-2"></i>
                  Split Evenly
                </button>
                <button
                  onClick={() => setSplitType('seat')}
                  className={`flex-1 py-3 text-center rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                    splitType === 'seat' ? 'bg-white text-rose-500 shadow-sm border border-stone-200' : 'text-stone-400 hover:text-stone-800'
                  }`}
                >
                  <i className="fas fa-users-viewfinder mr-2"></i>
                  Split by Guest Seat
                </button>
              </div>

              {/* Central Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-stone-50/30">
                
                {splitType === 'even' ? (
                  <div className="space-y-6">
                    {/* Even Split Controls */}
                    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-xs flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase text-stone-400 tracking-wider">Configure Splits</p>
                        <h4 className="text-2xl font-serif font-black italic text-stone-900 mt-1">{evenSplitParts} Ways Evenly</h4>
                        <p className="text-[10px] font-medium text-stone-500 mt-1">${(cartTotal / evenSplitParts).toFixed(2)} per guest share</p>
                      </div>
                      <div className="flex items-center bg-stone-100 p-1.5 rounded-full border border-stone-200 gap-2">
                        <button 
                          onClick={() => setEvenSplitParts(prev => Math.max(2, prev - 1))}
                          className="w-8 h-8 rounded-full bg-white text-stone-700 flex items-center justify-center font-bold hover:bg-stone-200 transition-colors"
                        >
                          <i className="fas fa-minus text-xs"></i>
                        </button>
                        <span className="text-sm font-black text-stone-900 px-2">{evenSplitParts}</span>
                        <button 
                          onClick={() => setEvenSplitParts(prev => Math.min(8, prev + 1))}
                          className="w-8 h-8 rounded-full bg-white text-stone-700 flex items-center justify-center font-bold hover:bg-stone-200 transition-colors"
                        >
                          <i className="fas fa-plus text-xs"></i>
                        </button>
                      </div>
                    </div>

                    {/* Split Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                      {[...Array(evenSplitParts)].map((_, idx) => {
                        const amount = cartTotal / evenSplitParts;
                        const isPaid = paidEvenSplits[idx];
                        
                        return (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-3xl border flex items-center justify-between bg-white transition-all ${
                              isPaid ? 'border-emerald-200 bg-emerald-50/10' : 'border-stone-100 hover:border-stone-200'
                            }`}
                          >
                            <div>
                              <span className="text-[7px] font-black text-stone-400 uppercase">Share {idx + 1} of {evenSplitParts}</span>
                              <p className="text-base font-black text-stone-900 mt-0.5">${amount.toFixed(2)}</p>
                            </div>
                            
                            {isPaid ? (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-emerald-200">
                                <i className="fas fa-check-double"></i> Paid
                              </span>
                            ) : (
                              <button
                                onClick={() => startPaymentProcess(idx)}
                                className="px-3 py-1.5 bg-stone-900 text-white hover:bg-stone-800 active:scale-95 transition-all text-[8px] font-black uppercase tracking-widest rounded-xl"
                              >
                                Pay Share
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Split by Seat Breakdown */}
                    {Object.keys(itemsBySeat).length === 0 ? (
                      <div className="text-center py-10 bg-white rounded-3xl border border-stone-100">
                        <i className="fas fa-circle-info text-stone-300 text-xl mb-2"></i>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">No Seat Assignments. All items are shared.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(itemsBySeat).map(([seat, seatItems]) => {
                          const total = seatTotals[seat];
                          const isPaid = paidSeats[seat];
                          
                          return (
                            <div 
                              key={seat}
                              className={`p-5 rounded-3xl border bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                                isPaid ? 'border-emerald-200 bg-emerald-50/10' : 'border-stone-100 hover:border-stone-200'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-md text-[8px] font-black uppercase border border-rose-100">
                                    {seat}
                                  </span>
                                  <span className="text-[9px] font-black text-stone-900">${total.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {seatItems.map(({ item }, i) => (
                                    <span key={i} className="text-[8px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-mono">
                                      {item.quantity}x {item.name}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div>
                                {isPaid ? (
                                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-emerald-200">
                                    <i className="fas fa-check-double"></i> Paid
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => startPaymentProcess(seat)}
                                    className="px-3.5 py-2 bg-stone-900 text-white hover:bg-stone-800 active:scale-95 transition-all text-[8px] font-black uppercase tracking-widest rounded-xl shadow-xs"
                                  >
                                    Pay {seat}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status Footer */}
              <div className="p-6 border-t border-stone-100 bg-white flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[7px] font-black text-stone-400 uppercase tracking-widest block font-mono">Total Transaction Amount</span>
                  <p className="text-2xl font-serif font-black italic text-stone-900">${cartTotal.toFixed(2)}</p>
                </div>

                {isEntireBillPaid ? (
                  <motion.button 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    onClick={finalizeAndCloseBill}
                    className="px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center gap-2"
                  >
                    <i className="fas fa-circle-check"></i>
                    Sync & Close Table
                  </motion.button>
                ) : (
                  <button 
                    disabled 
                    className="px-6 py-4 bg-stone-100 text-stone-400 rounded-2xl font-black uppercase text-[9px] tracking-widest border border-stone-200 cursor-not-allowed"
                  >
                    Pending Payments
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Payment Process Overlay */}
      <AnimatePresence>
        {paymentTerminal.status !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-stone-900 text-white w-full max-w-sm rounded-[3.5rem] p-10 border border-white/10 shadow-2xl text-center space-y-8"
            >
              <div className="flex flex-col items-center">
                 {/* Card Terminal Visual Icon */}
                 <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center border border-white/10 mb-4 relative overflow-hidden">
                    {paymentTerminal.status === 'tap' && (
                      <motion.div 
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-rose-500/10 rounded-full"
                      />
                    )}
                    <i className={`fas ${
                      paymentTerminal.status === 'tap' ? 'fa-credit-card text-rose-400 animate-bounce' :
                      paymentTerminal.status === 'processing' ? 'fa-spinner fa-spin text-indigo-400' : 'fa-circle-check text-emerald-400 text-3xl'
                    } text-2xl`}></i>
                 </div>

                 {paymentTerminal.status === 'tap' && (
                   <div className="space-y-2 animate-pulse">
                      <p className="text-[9px] font-black uppercase text-rose-400 tracking-[0.3em]">Lightspeed Terminal v3</p>
                      <h4 className="text-xl font-serif font-black italic">Tap or Swipe Card</h4>
                      <p className="text-[10px] text-stone-500 font-semibold">Simulated merchant terminal environment ready</p>
                   </div>
                 )}

                 {paymentTerminal.status === 'processing' && (
                   <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.3em]">EMV Handshake</p>
                      <h4 className="text-xl font-serif font-black italic">Authorizing Payment...</h4>
                      <p className="text-[10px] text-stone-500 font-semibold">Connecting to cloud ledger gateway</p>
                   </div>
                 )}

                 {paymentTerminal.status === 'success' && (
                   <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-emerald-400 tracking-[0.3em]">Transaction Approved</p>
                      <h4 className="text-xl font-serif font-black italic text-emerald-400">Payment Accepted</h4>
                      <p className="text-[10px] text-stone-500 font-semibold">Receipt printed & cached locally</p>
                   </div>
                 )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                      <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-[0.3em] mb-2">Modifier Tuning</h4>
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

                <button onClick={() => setShowQuickModFor(null)} className="w-full py-5 bg-stone-900 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] mt-10 shadow-xl hover:bg-stone-850 active:scale-95 transition-all">
                   Finalize Selection
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
          ? 'w-full max-w-[1400px] aspect-[4/3] rounded-[4rem] border-[16px] border-stone-850 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col p-8' 
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
            <div className="w-4 h-4 rounded-full border-2 border-stone-850"></div>
            <span className="text-[6px] font-black uppercase text-stone-800">Home</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdjustablePOS;

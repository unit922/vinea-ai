import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InventoryItem, ServiceOrder, OrderItem, Table } from '../types';
import { geminiService } from '../services/geminiService';

interface VisitorMenuProps {
  table: Table;
  inventory: InventoryItem[];
  onPlaceOrder: (items: OrderItem[]) => void;
  activeOrders: ServiceOrder[];
  onExit: () => void;
}

const VisitorMenu: React.FC<VisitorMenuProps> = ({ table, inventory, onPlaceOrder, activeOrders, onExit }) => {
  const [view, setView] = useState<'welcome' | 'menu' | 'sommelier' | 'tab'>('welcome');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'vinea', text: string}[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isSettlementRequested, setIsSettlementRequested] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const categories = ['Wine', 'Beer', 'Spirit', 'Mixer', 'Snack'] as const;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });
  };

  const cartTotal: number = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = inventory.find(i => i.id === id);
      return sum + (item?.price || 0) * (qty as number);
    }, 0);
  }, [cart, inventory]);

  const handleCheckout = () => {
    const items: OrderItem[] = Object.entries(cart).map(([id, qty]) => {
      const inv = inventory.find(i => i.id === id)!;
      return {
        id: `voi-${Date.now()}-${id}`,
        name: inv.name,
        quantity: qty as number,
        status: 'Pending',
        prepType: inv.category === 'Snack' ? 'Complex' : (inv.category === 'Mixer' ? 'Mix' : 'Pour'),
        priceAtOrder: inv.price,
        style: inv.category
      };
    });
    
    onPlaceOrder(items);
    setCart({});
    setView('tab');
    window.dispatchEvent(new Event('storage'));
  };

  const handleChatSubmit = async (e?: React.FormEvent, overrideMsg?: string) => {
    if (e) e.preventDefault();
    const msg = overrideMsg || chatInput;
    if (!msg.trim() || isThinking) return;
    
    if (!overrideMsg) setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setIsThinking(true);

    try {
      const response = await geminiService.getTrainingResponse(`As an elegant restaurant sommelier, answer this guest question: ${msg}`, []);
      setChatHistory(prev => [...prev, { role: 'vinea', text: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'vinea', text: "I apologize, my knowledge archives are temporarily unreachable. How else may I assist you?" }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAskAboutItem = (itemName: string) => {
    setView('sommelier');
    handleChatSubmit(undefined, `Tell me more about the ${itemName}. What are its tasting notes and a recommended food pairing?`);
  };

  const currentTabTotal = useMemo(() => {
    return activeOrders.reduce((sum, order) => {
      return sum + order.items.reduce((iSum, i) => iSum + (i.priceAtOrder * i.quantity), 0);
    }, 0);
  }, [activeOrders]);

  if (view === 'welcome') {
    return (
      <div className="fixed inset-0 z-[700] h-full w-full bg-rose-950 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden font-serif">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-20 scale-110"></div>
         <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px]"></div>
         
         <div className="relative z-10 space-y-12 animate-in fade-in zoom-in duration-1000">
            <div className="space-y-4">
               <span className="text-[11px] font-black uppercase tracking-[0.7em] text-amber-500 block">ESTABLISHED 2025</span>
               <h1 className="text-8xl md:text-9xl font-black text-stone-100 tracking-tighter italic leading-none drop-shadow-2xl">Vinea</h1>
               <div className="h-[1px] w-40 bg-amber-500/40 mx-auto mt-6"></div>
            </div>
            
            <div className="space-y-4">
               <h2 className="text-3xl text-stone-200 italic font-medium">Welcome, Table {table.number}</h2>
               <p className="text-stone-400 text-sm max-w-xs mx-auto leading-relaxed">Please enjoy our curated collection of technical vintages and artisanal small plates.</p>
            </div>

            <button 
              onClick={() => setView('menu')}
              className="px-16 py-7 bg-stone-100 text-rose-950 rounded-full font-bold uppercase text-[11px] tracking-[0.5em] shadow-2xl hover:bg-amber-500 transition-all active:scale-95"
            >
              Enter Experience
            </button>
         </div>
      </div>
    );
  }

  // After early return above, 'view' is narrowed to: 'menu' | 'sommelier' | 'tab'
  return (
    <div className="fixed inset-0 z-[700] h-full w-full flex flex-col bg-stone-50 overflow-hidden font-serif relative">
      <div className="absolute inset-0 opacity-40 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 scroll-smooth pb-40">
        {view === 'menu' && (
          <div className="p-8 md:p-12 space-y-16 animate-in fade-in duration-700">
            <header className="text-center space-y-4 pt-10">
               <h3 className="text-rose-950/40 font-bold uppercase tracking-[0.5em] text-[10px]">Technical Selection</h3>
               <h1 className="text-6xl font-black text-rose-950 tracking-tighter italic">The Vinea List</h1>
            </header>

            {categories.map(cat => {
              const items = inventory.filter(i => i.category === cat && i.stock > 0);
              if (items.length === 0) return null;
              return (
                <div key={cat} className="space-y-8">
                  <div className="flex items-center gap-6">
                    <h4 className="text-xl font-bold italic text-rose-900 whitespace-nowrap">{cat}</h4>
                    <div className="h-[1px] w-full bg-rose-900/10"></div>
                  </div>
                  <div className="space-y-10">
                    {items.map(item => (
                      <div key={item.id} className="group flex flex-col gap-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-lg font-bold text-stone-800 leading-none">{item.name}</span>
                          <div className="flex-1 mx-4 border-b border-dotted border-stone-300"></div>
                          <span className="text-lg font-bold text-rose-950">${item.price}</span>
                        </div>
                        <p className="text-xs text-stone-400 italic pr-12 line-clamp-2 leading-relaxed">
                          {item.description || 'Artisanal selection curated for technical flavor profiles and heritage.'}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              {cart[item.id] ? (
                                <div className="inline-flex items-center gap-4 bg-rose-950 text-white rounded-full px-4 py-1.5 shadow-lg">
                                  <button onClick={() => removeFromCart(item.id)} className="hover:text-amber-500"><i className="fas fa-minus text-[9px]"></i></button>
                                  <span className="text-xs font-black w-4 text-center">{cart[item.id]}</span>
                                  <button onClick={() => addToCart(item.id)} className="hover:text-amber-500"><i className="fas fa-plus text-[9px]"></i></button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => addToCart(item.id)}
                                  className="text-[9px] font-black uppercase tracking-widest text-stone-600 hover:text-rose-900 flex items-center gap-2 transition-all active:scale-95 border border-stone-200 px-4 py-2 rounded-full bg-white shadow-sm"
                                >
                                  <i className="fas fa-plus-circle"></i> Add to Round
                                </button>
                              )}
                           </div>
                           <button 
                             onClick={() => handleAskAboutItem(item.name)}
                             className="text-[9px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 flex items-center gap-2 transition-all active:scale-95"
                           >
                             <i className="fas fa-sparkles"></i> Technical Insight
                           </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === 'sommelier' && (
          <div className="h-full flex flex-col p-8 md:p-12 space-y-10 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            <header className="text-center space-y-2 pt-8">
               <h3 className="text-amber-600 font-bold uppercase tracking-[0.4em] text-[10px]">Your Digital Expert</h3>
               <h1 className="text-5xl font-black text-rose-950 italic tracking-tighter">AI Sommelier</h1>
            </header>

            <div className="flex-1 overflow-y-auto space-y-6 min-h-[400px] bg-white/40 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-inner border border-stone-200/50 flex flex-col">
              {chatHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 opacity-60">
                   <div className="w-20 h-20 bg-rose-100 rounded-[2rem] flex items-center justify-center text-rose-900 shadow-sm border border-rose-200/50">
                      <i className="fas fa-brain text-4xl"></i>
                   </div>
                   <div className="space-y-2">
                      <p className="text-rose-950 font-bold text-lg">Inquire with the expert.</p>
                      <p className="text-stone-500 italic leading-relaxed text-sm max-w-xs">Ask about tasting notes, spirit heritage, or food pairings for any item on the list.</p>
                   </div>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                     <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-sm ${msg.role === 'user' ? 'bg-rose-950 text-white rounded-br-none' : 'bg-white border border-stone-100 text-stone-800 rounded-bl-none italic font-medium text-sm leading-relaxed'}`}>
                        <p>{msg.text}</p>
                     </div>
                  </div>
                ))
              )}
              {isThinking && (
                <div className="flex justify-start">
                   <div className="bg-white p-4 rounded-full border border-stone-100 flex gap-2 shadow-sm">
                      <div className="w-1.5 h-1.5 bg-rose-900 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-rose-900 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-rose-900 rounded-full animate-bounce delay-150"></div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="relative mt-auto">
               <input 
                 value={chatInput} 
                 onChange={e => setChatInput(e.target.value)}
                 placeholder="Search our technical archives..."
                 className="w-full px-10 py-6 bg-white border border-stone-200 rounded-full text-sm font-bold focus:outline-none focus:border-rose-900 shadow-xl transition-all italic placeholder:text-stone-300"
               />
               <button type="submit" disabled={isThinking || !chatInput.trim()} className="absolute right-4 top-4 w-10 h-10 bg-rose-950 text-white rounded-full flex items-center justify-center shadow-lg disabled:opacity-30 active:scale-90 transition-transform">
                  <i className="fas fa-paper-plane text-[10px]"></i>
               </button>
            </form>
          </div>
        )}

        {view === 'tab' && (
          <div className="p-8 md:p-12 space-y-12 animate-in slide-in-from-right-4 duration-500">
             <header className="text-center space-y-2 pt-8">
                <h3 className="text-amber-600 font-bold uppercase tracking-[0.4em] text-[10px]">Your Selection</h3>
                <h1 className="text-5xl font-black text-rose-950 italic tracking-tighter">Current Tab</h1>
             </header>

             <div className="bg-white border border-stone-200 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-receipt text-8xl text-rose-950"></i></div>
                <div className="space-y-10 relative z-10">
                   <div className="flex justify-between items-end border-b-2 border-stone-50 pb-8">
                      <div>
                         <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Balance Due</p>
                         <p className="text-5xl font-bold text-rose-950 tracking-tighter">${currentTabTotal.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase text-stone-400 mb-1">Table</p>
                         <p className="text-2xl font-bold text-stone-800 italic">{table.number}</p>
                      </div>
                   </div>

                   <div className="space-y-6">
                      {activeOrders.length === 0 ? (
                        <p className="text-center py-20 text-stone-300 italic">No rounds fired yet. Visit the menu to begin.</p>
                      ) : (
                        activeOrders.map(order => (
                          <div key={order.id} className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black text-rose-900 uppercase tracking-widest italic">Round @ {order.timestamp}</span>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                   order.status === 'Ready' ? 'bg-emerald-50 text-white' : 'bg-amber-50 text-rose-950'
                                }`}>{order.status}</span>
                             </div>
                             <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                   <div key={idx} className="flex justify-between items-center text-sm font-bold">
                                      <span className="text-stone-700">x{item.quantity} {item.name}</span>
                                      <span className="text-stone-400 font-medium">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </div>

             {isSettlementRequested ? (
               <div className="p-10 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] text-center animate-in zoom-in-95 duration-500">
                  <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <i className="fas fa-check text-xl"></i>
                  </div>
                  <h4 className="text-xl font-bold text-emerald-900 mb-2">Request Transmitted</h4>
                  <p className="text-sm text-emerald-700 font-medium italic">"A sommelier will be at your table shortly to finalize the journey. Thank you."</p>
               </div>
             ) : (
               <button 
                 onClick={() => setIsSettlementRequested(true)}
                 disabled={activeOrders.length === 0}
                 className="w-full py-6 bg-rose-950 text-white rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] shadow-xl shadow-rose-950/20 active:scale-95 transition-all disabled:opacity-30"
               >
                 Request Settlement
               </button>
             )}
          </div>
        )}
      </div>

      {/* Floating Chat Trigger */}
      {view !== 'sommelier' && (
        <button 
          onClick={() => setView('sommelier')}
          className="fixed bottom-32 right-8 z-[150] w-16 h-16 bg-amber-500 text-rose-950 rounded-2xl shadow-[0_20px_50px_rgba(245,158,11,0.4)] flex items-center justify-center animate-bounce hover:animate-none hover:scale-110 transition-all active:scale-95 group"
        >
          <i className="fas fa-brain text-2xl"></i>
          <span className="absolute right-full mr-4 bg-stone-900 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Ask Sommelier
          </span>
        </button>
      )}

      {/* Floating Order Bar */}
      {view === 'menu' && cartTotal > 0 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[90%] z-50 animate-in slide-in-from-bottom-10">
           <div className="bg-rose-950 text-stone-100 p-4 rounded-full shadow-[0_20px_50px_rgba(45,10,10,0.5)] flex justify-between items-center border border-white/10">
              <div className="pl-6">
                 <p className="text-[8px] font-black uppercase text-stone-400">Round Total</p>
                 <p className="text-xl font-bold italic text-amber-500">${cartTotal.toFixed(2)}</p>
              </div>
              <button 
                onClick={handleCheckout}
                className="px-10 py-4 bg-amber-500 text-stone-900 rounded-full font-black uppercase text-[10px] tracking-[0.2em] hover:bg-amber-400 active:scale-95 transition-all shadow-xl"
              >
                Fire Round
              </button>
           </div>
        </div>
      )}

      {/* Guest Bottom Navigation Bar */}
      <nav className="absolute bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-xl border-t border-stone-200 z-[100] px-8 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
         <button onClick={() => setView('menu')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'menu' ? 'text-rose-900' : 'text-stone-300 hover:text-stone-600'}`}>
            <i className={`fas fa-wine-glass text-xl ${view === 'menu' ? 'scale-110' : ''}`}></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Menu</span>
         </button>
         <button onClick={() => setView('sommelier')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'sommelier' ? 'text-rose-900' : 'text-stone-300 hover:text-stone-600'}`}>
            <i className={`fas fa-brain text-xl ${view === 'sommelier' ? 'scale-110' : ''}`}></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Expert</span>
         </button>
         <button onClick={() => setView('tab')} className={`flex flex-col items-center gap-1.5 transition-all relative ${view === 'tab' ? 'text-rose-900' : 'text-stone-300 hover:text-stone-600'}`}>
            <i className={`fas fa-receipt text-xl ${view === 'tab' ? 'scale-110' : ''}`}></i>
            <span className="text-[8px] font-black uppercase tracking-widest">My Tab</span>
            {activeOrders.length > 0 && <span className="absolute -top-1 -right-3 w-4 h-4 bg-amber-500 text-rose-950 text-[8px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">{activeOrders.length}</span>}
         </button>
         <button onClick={onExit} className="flex flex-col items-center gap-1.5 text-stone-300 hover:text-rose-500 transition-all">
            <i className="fas fa-door-open text-xl"></i>
            <span className="text-[8px] font-black uppercase tracking-widest">Exit</span>
         </button>
      </nav>
    </div>
  );
};

export default VisitorMenu;

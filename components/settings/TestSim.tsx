
import React, { useState } from 'react';
import { InventoryItem, ServiceOrder, RetailTransaction } from '../../lib/types';
import { INITIAL_INVENTORY } from '../../constants';
import { supabaseSync } from '../../services/supabaseSync';

interface TestSimProps {
  onClose: () => void;
  restaurantName: string;
}

const TestSim: React.FC<TestSimProps> = ({ onClose, restaurantName }) => {
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
        method: 'Credit & Debit Card',
        timestamp: new Date().toISOString(),
        status: 'Completed',
        type: 'Retail',
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

  const total = calculateTotal();

  return (
    <div className="fixed inset-0 z-[700] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="bg-[#1a1a1a] w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col border-r border-white/5">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
            <div>
              <h2 className="text-white font-black uppercase text-xs tracking-[0.3em] flex items-center gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                Vinetelligence POS Simulator
              </h2>
              <p className="text-stone-500 text-[10px] uppercase font-bold mt-1 tracking-widest">{restaurantName} Node</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
            {inventory.map(item => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="group relative bg-white/5 border border-white/10 p-6 rounded-3xl text-left hover:bg-white/10 transition-all active:scale-95 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <i className={`fas ${
                    item.category === 'Wine' ? 'fa-wine-bottle' :
                    item.category === 'Spirit' ? 'fa-glass-whiskey' :
                    'fa-beer-mug-empty'
                  } text-4xl`}></i>
                </div>
                <p className="text-white font-bold text-sm truncate pr-8">{item.name}</p>
                <p className="text-stone-500 text-[9px] font-black uppercase tracking-widest mt-1">{item.category}</p>
                <div className="mt-4 flex justify-between items-end">
                  <p className="text-amber-500 font-black text-lg">${item.price}</p>
                  <p className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${item.stock > 5 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    Stock: {item.stock}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="w-full md:w-96 bg-black/40 flex flex-col">
          <div className="p-8 border-b border-white/5">
            <h3 className="text-white font-black uppercase text-[10px] tracking-widest">Current Order</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <i className="fas fa-shopping-cart text-4xl text-stone-500"></i>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Cart is empty</p>
              </div>
            ) : (
              cart.map((c, i) => (
                <div key={i} className="flex justify-between items-center animate-in slide-in-from-right-4">
                  <div>
                    <p className="text-white text-xs font-bold">{c.item.name}</p>
                    <p className="text-stone-500 text-[9px] font-black uppercase tracking-widest">Qty: {c.qty}</p>
                  </div>
                  <p className="text-white font-black text-sm">${(c.item.price * c.qty).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-black/60 space-y-6">
            <div className="flex justify-between items-end">
              <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Total Amount</p>
              <p className="text-white text-3xl font-black">${total.toFixed(2)}</p>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95 shadow-xl shadow-amber-500/10 flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Syncing with Vinetelligence...
                </>
              ) : (
                <>
                  <i className="fas fa-credit-card"></i>
                  Process Payment
                </>
              )}
            </button>

            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
              <p className="text-[8px] text-stone-500 leading-relaxed italic text-center">
                <i className="fas fa-info-circle mr-2 text-amber-500"></i>
                Processing payment will trigger a real-time inventory webhook to the Vinetelligence Cloud Silo.
              </p>
            </div>
          </div>
        </div>

        {showSuccess && (
          <div className="absolute inset-0 z-[800] bg-emerald-500 flex flex-col items-center justify-center text-center p-10 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-emerald-500 text-4xl shadow-2xl mb-6">
              <i className="fas fa-check"></i>
            </div>
            <h3 className="text-white text-4xl font-serif font-black italic mb-2">Order Synced!</h3>
            <p className="text-white/80 text-sm font-medium max-w-xs">
              The POS has successfully notified Vinetelligence. Inventory levels have been updated across all nodes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSim;

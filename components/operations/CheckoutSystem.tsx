import React from 'react';
import { Table, ServiceOrder, PaymentMethod } from '../../lib/types';
import { FISCAL_ENGINE_CONFIG } from '../../constants';

interface CheckoutSystemProps {
  activeTable: Table;
  getTableHistory: (tableNum: string) => ServiceOrder[];
  subtotalValue: number;
  tipPercent: number;
  setTipPercent: (pct: number) => void;
  selectedPayment: PaymentMethod;
  setSelectedPayment: (method: PaymentMethod) => void;
  guestFeedback: string;
  setGuestFeedback: (val: string) => void;
  guestRating: number;
  setGuestRating: (val: number) => void;
  isSettling: boolean;
  handleSettleTable: () => void;
  setActiveTab: (tab: 'floor' | 'ordering' | 'checkout' | 'deployment' | 'history' | 'operation' | 'guest' | 'journey' | 'labor' | 'facility' | 'system') => void;
}

const CheckoutSystem: React.FC<CheckoutSystemProps> = ({
  activeTable,
  getTableHistory,
  subtotalValue,
  tipPercent,
  setTipPercent,
  selectedPayment,
  setSelectedPayment,
  guestFeedback,
  setGuestFeedback,
  guestRating,
  setGuestRating,
  isSettling,
  handleSettleTable,
  setActiveTab
}) => {
  return (
    <div className="h-full flex flex-col items-center animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-20">
      <div className="w-full max-w-4xl bg-white rounded-[3.5rem] border border-stone-200 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 md:p-10 border-b border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 block mb-1 italic underline decoration-2">Protocol: Settlement</span>
            <h3 className="text-3xl md:text-4xl font-serif font-black text-stone-900 italic tracking-tighter">Table {activeTable.number} Terminal</h3>
            <p className="text-stone-500 text-sm italic font-medium">Guest: <span className="text-stone-900 font-bold">{activeTable.occupantName || 'Walk-in Anonymous'}</span></p>
          </div>
          <button onClick={() => setActiveTab('ordering')} className="w-full sm:w-auto px-8 py-3 bg-stone-100 text-stone-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-50 transition-all border border-stone-200">
            Add to Tab
          </button>
        </div>

        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-stone-100">
          <div className="flex-1 p-10 space-y-10">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-50 pb-2">Active Staging Archive</h4>
              <div className="space-y-4">
                {getTableHistory(activeTable.number).map(order => (
                  <div key={order.id} className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm font-bold">
                        <div className="flex flex-col">
                          <span className="text-stone-800">x{item.quantity} {item.name}</span>
                          {item.modifier && (
                            <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest leading-none mt-1">
                              [{item.modifier}]
                            </span>
                          )}
                        </div>
                        <span className="text-stone-500 font-serif">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 space-y-3 border-t border-stone-900/5">
              <div className="flex justify-between items-center text-sm font-bold text-stone-500">
                <span className="uppercase tracking-widest">Subtotal</span>
                <span className="font-serif">${subtotalValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-stone-500 italic opacity-60">
                <span className="tracking-widest">Fiscal Alpha (Tax {FISCAL_ENGINE_CONFIG.TAX_RATE * 100}%)</span>
                <span className="font-serif">${(subtotalValue * FISCAL_ENGINE_CONFIG.TAX_RATE).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-serif font-black text-stone-900 border-t border-stone-900 pt-4">
                <span className="italic uppercase tracking-tighter">Gross Yield</span>
                <span className="text-emerald-600">${(subtotalValue * (1 + FISCAL_ENGINE_CONFIG.TAX_RATE)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[380px] p-10 space-y-10 bg-stone-50/30">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Gratuity Allocation</h4>
              <div className="grid grid-cols-3 gap-2">
                {[18, 20, 25].map(pct => (
                  <button key={pct} onClick={() => setTipPercent(pct)} className={`py-3 rounded-xl text-[10px] font-black transition-all ${tipPercent === pct ? 'bg-stone-900 text-white shadow-lg' : 'bg-white text-stone-400 border border-stone-100'}`}>
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Gateway Selection</h4>
              <div className="grid grid-cols-3 gap-2">
                {['Stripe', 'PayPal', 'Cash'].map((method) => (
                  <button 
                    key={method} 
                    onClick={() => setSelectedPayment(method as PaymentMethod)}
                    className={`py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${selectedPayment === method ? 'bg-white border-amber-500 shadow-xl scale-105' : 'bg-transparent border-stone-100 text-stone-400'}`}
                  >
                    <i className={`fas ${
                      method === 'Stripe' ? 'fa-credit-card' :
                      method === 'PayPal' ? 'fa-brands fa-paypal' : 'fa-money-bill-wave'
                    }`}></i>
                    <span className="text-[8px] font-black uppercase">{method}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Guest Sentiment</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-stone-100 p-2 rounded-xl">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      onClick={() => setGuestRating(star)}
                      className={`text-lg transition-all ${guestRating >= star ? 'text-amber-500 scale-110' : 'text-stone-300'}`}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
                <textarea 
                  value={guestFeedback}
                  onChange={(e) => setGuestFeedback(e.target.value)}
                  placeholder="Record guest feedback, special requests, or sommelier observations..."
                  className="w-full h-24 p-4 bg-white border border-stone-200 rounded-2xl text-[11px] font-medium text-stone-600 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none italic"
                />
              </div>
            </div>

            <div className="pt-8">
              <button 
                onClick={handleSettleTable}
                disabled={isSettling}
                className="w-full py-6 bg-stone-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-4"
              >
                {isSettling ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-shield-check text-amber-500"></i>}
                Finalize Settlement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSystem;

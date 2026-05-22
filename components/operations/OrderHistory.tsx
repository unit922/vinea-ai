import React from 'react';
import { ServiceOrder, RetailTransaction } from '../../lib/types';

interface OrderHistoryProps {
  orders: ServiceOrder[];
  draftOrders: ServiceOrder[];
  transactions: RetailTransaction[];
  handleFireDraft: (id: string) => void;
  handleCancelOrder: (id: string) => void;
  handleUpdateOrderStatus?: (id: string, status: ServiceOrder['status']) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ 
  orders, 
  draftOrders, 
  transactions, 
  handleFireDraft, 
  handleCancelOrder,
  handleUpdateOrderStatus
}) => {
  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl flex-1 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <h3 className="text-xs font-black uppercase text-stone-500 tracking-widest italic">Operational Order Ledger</h3>
          <div className="flex gap-2">
            <span className="text-xs font-black bg-amber-500 text-stone-900 px-4 py-1.5 rounded-full">{orders.length} Active Rounds</span>
            <span className="text-xs font-black bg-emerald-500 text-white px-4 py-1.5 rounded-full">{transactions.length} Settled</span>
            <span className="text-xs font-black bg-stone-900 text-white px-4 py-1.5 rounded-full">{draftOrders.length} Drafts</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-10">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">Active & Draft Orders</h4>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="text-xs font-black uppercase text-stone-400 border-b border-stone-50 bg-stone-50/20">
                      <th className="px-6 md:px-10 py-6">Timestamp</th>
                      <th className="px-6 md:px-10 py-6">Table</th>
                      <th className="px-6 md:px-10 py-6">Source</th>
                      <th className="px-6 md:px-10 py-6">Items</th>
                      <th className="px-6 md:px-10 py-6">Priority</th>
                      <th className="px-6 md:px-10 py-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {[...orders, ...draftOrders].sort((a,b) => b.id.localeCompare(a.id)).map(order => (
                      <tr key={order.id} className="hover:bg-stone-50 transition-all group">
                        <td className="px-6 md:px-10 py-6">
                          <p className="text-xs font-bold text-stone-900">{order.timestamp}</p>
                          <p className="text-[10px] text-stone-400 font-mono mt-0.5">{order.id}</p>
                        </td>
                        <td className="px-6 md:px-10 py-6">
                          <p className="text-base font-black text-stone-800 italic">T{order.tableNumber || '??'}</p>
                        </td>
                        <td className="px-6 md:px-10 py-6">
                          <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border ${order.source === 'Visitor' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-stone-100 border-stone-200 text-stone-600'}`}>
                            {order.source}
                          </span>
                        </td>
                        <td className="px-6 md:px-10 py-6">
                          <p className="text-xs font-bold text-stone-700">{order.items.length} Units</p>
                          <div className="mt-1 space-y-0.5">
                            {order.items.map((item, i) => (
                              <p key={i} className="text-[10px] text-stone-400 italic truncate max-w-[200px]">
                                {item.quantity}x {item.name} 
                                {item.modifier && <span className="text-amber-500 ml-1">[{item.modifier}]</span>}
                                {item.seat !== null && item.seat !== undefined && <span className="text-stone-500 ml-1">(P{item.seat + 1})</span>}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 md:px-10 py-6">
                          <span className={`text-[10px] font-black uppercase ${order.priority === 'High' ? 'text-amber-600' : order.priority === 'VIP' ? 'text-rose-600' : 'text-stone-400'}`}>
                            {order.priority}
                          </span>
                        </td>
                        <td className="px-6 md:px-10 py-6 text-right">
                          <div className="flex flex-col items-end gap-2">
                            <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full ${
                              order.status === 'Ready' ? 'bg-emerald-500 text-white' : 'bg-amber-100 text-stone-900'
                            }`}>
                              {order.status}
                            </span>
                            {draftOrders.some(d => d.id === order.id) ? (
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleFireDraft(order.id)}
                                  className="px-6 py-2 bg-amber-500 text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg active:scale-95"
                                >
                                  Fire Order
                                </button>
                                <button 
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="px-4 py-2 bg-stone-100 text-stone-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all active:scale-95"
                                >
                                  Discard
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-2">
                                {order.status === 'Ready' && handleUpdateOrderStatus && (
                                  <button 
                                    onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                                    className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg active:scale-95"
                                  >
                                    Mark Delivered
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="px-4 py-1.5 bg-stone-100 text-stone-400 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all"
                                >
                                  Void Round
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 italic">Settled Transactions</h4>
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="text-xs font-black uppercase text-stone-400 border-b border-stone-50 bg-stone-50/20">
                      <th className="px-6 md:px-10 py-6">Timestamp</th>
                      <th className="px-6 md:px-10 py-6">Table</th>
                      <th className="px-6 md:px-10 py-6">Guest</th>
                      <th className="px-6 md:px-10 py-6">Total</th>
                      <th className="px-6 md:px-10 py-6">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {transactions.sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map(tx => (
                      <tr key={tx.id} className="hover:bg-stone-50 transition-all">
                        <td className="px-6 md:px-10 py-6">
                          <p className="text-xs font-bold text-stone-900">{tx.timestamp}</p>
                        </td>
                        <td className="px-6 md:px-10 py-6">
                          <p className="text-base font-black text-stone-800 italic">T{tx.tableNumber}</p>
                        </td>
                        <td className="px-6 md:px-10 py-6">
                          <p className="text-xs font-bold text-stone-700">{tx.guestName}</p>
                        </td>
                        <td className="px-6 md:px-10 py-6">
                          <p className="text-xs font-black text-stone-900">${tx.total.toFixed(2)}</p>
                        </td>
                        <td className="px-6 md:px-10 py-6">
                          <span className="text-[10px] font-black uppercase text-stone-400">{tx.paymentMethod}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;

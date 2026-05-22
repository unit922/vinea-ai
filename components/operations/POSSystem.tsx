import React from 'react';
import { Table, InventoryItem, OrderItem } from '../../lib/types';
import AdjustablePOS from '../AdjustablePOS';

interface POSSystemProps {
  activeTable: Table;
  inventory: InventoryItem[];
  currentCart: OrderItem[];
  activeSeat: number;
  addToCart: (item: InventoryItem, seat: number) => void;
  removeFromCart: (idx: number) => void;
  updateCartItem: (idx: number, updates: Partial<OrderItem>) => void;
  setActiveSeat: (seat: number) => void;
  handlePlaceOrder: (items: OrderItem[], source: 'Staff' | 'Visitor', priority: 'Normal' | 'High' | 'VIP', isDraft: boolean) => void;
  onPayNow?: (priority: 'Normal' | 'High' | 'VIP') => void;
  refreshInventory: () => void;
}

const POSSystem: React.FC<POSSystemProps> = ({
  activeTable,
  inventory,
  currentCart,
  activeSeat,
  addToCart,
  removeFromCart,
  updateCartItem,
  setActiveSeat,
  handlePlaceOrder,
  onPayNow,
  refreshInventory
}) => {
  return (
    <div className="h-full flex flex-col animate-in fade-in duration-300 overflow-hidden">
      <AdjustablePOS 
        table={activeTable}
        inventory={inventory}
        currentCart={currentCart}
        activeSeat={activeSeat}
        onAddToCart={addToCart}
        onRemoveFromCart={removeFromCart}
        onUpdateItem={updateCartItem}
        onSetActiveSeat={setActiveSeat}
        onPlaceOrder={(priority, isDraft) => handlePlaceOrder(currentCart, 'Staff', priority, isDraft)}
        onPayNow={onPayNow}
        onRefreshInventory={refreshInventory}
      />
    </div>
  );
};

export default POSSystem;

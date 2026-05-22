import { OrderItem, InventoryItem } from '../lib/types';

/**
 * Calculates the amount to decrement from inventory based on order item details.
 * Handles fractional decrements for Spirits and Wine when tracked in Bottles/Liters.
 */
export const calculateDecrementAmount = (item: OrderItem, invItem: InventoryItem): number => {
  let amount = item.quantity;
  const unit = (invItem.unit || '').toLowerCase();
  const isFractionalUnit = unit.includes('bottle') || unit.includes('liter');
  
  if ((invItem.category === 'Spirit' || invItem.category === 'Wine') && isFractionalUnit) {
    const volumePerUnit = invItem.volumePerUnit || (unit.includes('liter') ? 1000 : 750);
    let servingSize = 50; // Default for Spirit (ml)
    
    if (invItem.category === 'Wine') {
      servingSize = 150; // Standard Wine Pour (ml)
    }

    // Adjust serving size based on modifier
    if (item.modifier === 'Double') servingSize = 100;
    if (item.modifier === 'Shot') servingSize = 25;
    if (item.modifier === 'Rocks' || item.modifier === 'On the Rocks' || item.modifier === 'Mix' || item.modifier === 'Measurement Mix' || item.modifier === 'Neat' || item.modifier === 'Standard') servingSize = 50;
    if (item.modifier === 'Glass') servingSize = 150; // Explicit Wine/Spirit glass
    if (item.modifier === 'Bottle') servingSize = volumePerUnit; // Whole bottle
    
    amount = (servingSize / volumePerUnit) * item.quantity;
  }
  
  return amount;
};

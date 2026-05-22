
import { useVineaStore } from '../store/vineaStore';
import { authService } from '../services/authService';
import { supabaseSync, generateUUID } from '../services/supabaseSync';
import { RestaurantProfile, AppView, Cocktail, InventoryItem } from '../lib/types';

export const useVineaActions = () => {
  const store = useVineaStore();

  const handleLogout = async () => {
    try {
      await authService.signOut();
      localStorage.removeItem('vinea_profile');
      localStorage.removeItem('vinea_onboarded');
      localStorage.removeItem('vinea_inventory');
      localStorage.removeItem('vinea_orders');
      localStorage.removeItem('vinea_journeys');
      localStorage.removeItem('vinea_staff_list');
      localStorage.removeItem('vinea_tables');
      localStorage.removeItem('vinea_transactions');
      localStorage.removeItem('vinea_draft_orders');
      
      store.setRestaurantProfile(null);
      store.setSession(null);
      store.setInventory([]);
      store.setOrders([]);
      store.setJourneys([]);
      store.setTables([]);
      store.setTransactions([]);
      store.setAuthMode('demo');
      store.setIsDeveloper(false);
      store.setDevToolsUnlocked(false);
      store.setActiveView(AppView.DASHBOARD);
      
      window.location.reload();
    } catch (e) {
      console.error("Vinea: Logout failed", e);
    }
  };

  const updateProfileValue = async (key: keyof RestaurantProfile, value: string | number | boolean | null) => {
    if (!store.restaurantProfile) return;
    
    const updated = { ...store.restaurantProfile, [key]: value };
    store.setRestaurantProfile(updated);
    localStorage.setItem('vinea_profile', JSON.stringify(updated));
    
    if (store.authMode === 'secure' && store.restaurantProfile.id) {
      try {
        await supabaseSync.saveRestaurantProfile(updated);
      } catch (e) {
        console.error("Vinea: Failed to sync profile update", e);
      }
    }
  };

  const handleAddToMenu = async (cocktail: Cocktail) => {
    const newItem: InventoryItem = {
      id: generateUUID(),
      name: cocktail.name,
      category: 'Cocktail',
      stock: 0,
      unit: 'Servings',
      minStock: 10,
      price: 15,
      originalPrice: 15,
      description: cocktail.instructions.join(' '),
      consumed: 0
    };

    const updated = [...store.inventory, newItem];
    store.setInventory(updated);
    localStorage.setItem('vinea_inventory', JSON.stringify(updated));
    
    if (store.authMode === 'secure' && store.restaurantProfile?.id) {
      supabaseSync.updateInventoryItem(store.restaurantProfile.id, newItem).catch(e => {
        console.error("Vinea: Failed to sync new cocktail to Supabase", e);
      });
    }
    
    window.dispatchEvent(new Event('storage'));
  };

  const handleRemoveFromMenu = async (cocktailId: string) => {
    const updated = store.inventory.filter(i => i.id !== cocktailId);
    store.setInventory(updated);
    localStorage.setItem('vinea_inventory', JSON.stringify(updated));
    
    if (store.authMode === 'secure' && store.restaurantProfile?.id) {
      supabaseSync.deleteInventoryItem(store.restaurantProfile.id, cocktailId).catch(e => {
        console.error("Vinea: Failed to delete cocktail from Supabase", e);
      });
    }
    
    window.dispatchEvent(new Event('storage'));
  };

  return {
    handleLogout,
    updateProfileValue,
    handleAddToMenu,
    handleRemoveFromMenu
  };
};

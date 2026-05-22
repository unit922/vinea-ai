
import { useCallback } from 'react';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { authService } from '../services/authService';
import { supabaseSync, generateUUID } from '../services/supabaseSync';
import { RestaurantProfile, AppView, Cocktail, InventoryItem } from '../lib/types';

export const useVinetelligenceActions = () => {
  const restaurantProfile = useVinetelligenceStore(state => state.restaurantProfile);
  const inventory = useVinetelligenceStore(state => state.inventory);
  const authMode = useVinetelligenceStore(state => state.authMode);

  const setRestaurantProfile = useVinetelligenceStore(state => state.setRestaurantProfile);
  const setInventory = useVinetelligenceStore(state => state.setInventory);
  const setOrders = useVinetelligenceStore(state => state.setOrders);
  const setJourneys = useVinetelligenceStore(state => state.setJourneys);
  const setTables = useVinetelligenceStore(state => state.setTables);
  const setTransactions = useVinetelligenceStore(state => state.setTransactions);
  const setSession = useVinetelligenceStore(state => state.setSession);
  const setAuthMode = useVinetelligenceStore(state => state.setAuthMode);
  const setIsDeveloper = useVinetelligenceStore(state => state.setIsDeveloper);
  const setDevToolsUnlocked = useVinetelligenceStore(state => state.setDevToolsUnlocked);
  const setActiveView = useVinetelligenceStore(state => state.setActiveView);

  const handleLogout = useCallback(async () => {
    try {
      await authService.signOut();
      localStorage.removeItem('vinetelligence_profile');
      localStorage.removeItem('vinetelligence_onboarded');
      localStorage.removeItem('vinetelligence_inventory');
      localStorage.removeItem('vinetelligence_orders');
      localStorage.removeItem('vinetelligence_journeys');
      localStorage.removeItem('vinetelligence_staff_list');
      localStorage.removeItem('vinetelligence_tables');
      localStorage.removeItem('vinetelligence_transactions');
      localStorage.removeItem('vinetelligence_draft_orders');
      
      localStorage.removeItem('intelligence_profile');
      localStorage.removeItem('intelligence_onboarded');
      localStorage.removeItem('intelligence_inventory');
      localStorage.removeItem('intelligence_orders');
      localStorage.removeItem('intelligence_journeys');
      localStorage.removeItem('intelligence_staff_list');
      localStorage.removeItem('intelligence_tables');
      localStorage.removeItem('intelligence_transactions');
      localStorage.removeItem('intelligence_draft_orders');
      
      localStorage.removeItem('oenovia_profile');
      localStorage.removeItem('oenovia_onboarded');
      localStorage.removeItem('oenovia_inventory');
      localStorage.removeItem('oenovia_orders');
      localStorage.removeItem('oenovia_journeys');
      localStorage.removeItem('oenovia_staff_list');
      localStorage.removeItem('oenovia_tables');
      localStorage.removeItem('oenovia_transactions');
      localStorage.removeItem('oenovia_draft_orders');
      
      localStorage.removeItem('vinetelligence_profile');
      localStorage.removeItem('vinetelligence_onboarded');
      localStorage.removeItem('vinetelligence_inventory');
      localStorage.removeItem('vinetelligence_orders');
      localStorage.removeItem('vinetelligence_journeys');
      localStorage.removeItem('vinetelligence_staff_list');
      localStorage.removeItem('vinetelligence_tables');
      localStorage.removeItem('vinetelligence_transactions');
      localStorage.removeItem('vinetelligence_draft_orders');
      
      // Also clear legacy keys
      localStorage.removeItem('vinea_profile');
      localStorage.removeItem('vinea_onboarded');
      localStorage.removeItem('vinea_inventory');
      localStorage.removeItem('vinea_orders');
      localStorage.removeItem('vinea_journeys');
      localStorage.removeItem('vinea_staff_list');
      localStorage.removeItem('vinea_tables');
      localStorage.removeItem('vinea_transactions');
      localStorage.removeItem('vinea_draft_orders');
      
      setRestaurantProfile(null);
      setSession(null);
      setInventory([]);
      setOrders([]);
      setJourneys([]);
      setTables([]);
      setTransactions([]);
      setAuthMode('demo');
      setIsDeveloper(false);
      setDevToolsUnlocked(false);
      setActiveView(AppView.DASHBOARD);
      
      window.location.reload();
    } catch (e) {
      console.error("Vinetelligence: Logout failed", e);
    }
  }, [setRestaurantProfile, setSession, setInventory, setOrders, setJourneys, setTables, setTransactions, setAuthMode, setIsDeveloper, setDevToolsUnlocked, setActiveView]);

  const updateProfileValue = useCallback(async (key: keyof RestaurantProfile, value: string | number | boolean | null) => {
    if (!restaurantProfile) return;
    
    const updated = { ...restaurantProfile, [key]: value };
    setRestaurantProfile(updated);
    localStorage.setItem('vinetelligence_profile', JSON.stringify(updated));
    
    if (authMode === 'secure' && restaurantProfile.id) {
      try {
        await supabaseSync.saveRestaurantProfile(updated);
      } catch (e) {
        console.error("Vinetelligence: Failed to sync profile update", e);
      }
    }
  }, [restaurantProfile, authMode, setRestaurantProfile]);

  const handleAddToMenu = useCallback(async (cocktail: Cocktail) => {
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

    const updated = [...inventory, newItem];
    setInventory(updated);
    localStorage.setItem('vinetelligence_inventory', JSON.stringify(updated));
    
    if (authMode === 'secure' && restaurantProfile?.id) {
      supabaseSync.updateInventoryItem(restaurantProfile.id, newItem).catch(e => {
        console.error("Vinetelligence: Failed to sync new cocktail to Supabase", e);
      });
    }
    
    window.dispatchEvent(new Event('storage'));
  }, [inventory, authMode, restaurantProfile, setInventory]);

  const handleRemoveFromMenu = useCallback(async (cocktailId: string) => {
    const updated = inventory.filter(i => i.id !== cocktailId);
    setInventory(updated);
    localStorage.setItem('vinetelligence_inventory', JSON.stringify(updated));
    
    if (authMode === 'secure' && restaurantProfile?.id) {
      supabaseSync.deleteInventoryItem(restaurantProfile.id, cocktailId).catch(e => {
        console.error("Vinetelligence: Failed to delete cocktail from Supabase", e);
      });
    }
    
    window.dispatchEvent(new Event('storage'));
  }, [inventory, authMode, restaurantProfile, setInventory]);

  return {
    handleLogout,
    updateProfileValue,
    handleAddToMenu,
    handleRemoveFromMenu
  };
};

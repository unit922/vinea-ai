
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { supabaseSync, generateUUID } from '../services/supabaseSync';
import { InventoryItem, DynamicPriceSuggestion, VisionAuditResult, StaffShift } from '../lib/types';
import { getBrandedTerm } from '../utils/branding';
import VisionAuditor from './VisionAuditor';
import InventoryReport from './InventoryReport';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import * as XLSX from 'xlsx';

const Inventory: React.FC<{ 
  searchQuery?: string; 
  onOpenVisionAudit?: () => void;
  userRole?: StaffShift['role'];
  inventory?: InventoryItem[];
  authMode?: 'demo' | 'secure';
}> = ({ searchQuery = '', onOpenVisionAudit, userRole, inventory: propInventory = [], authMode = 'demo' }) => {
  const store = useVinetelligenceStore();
  const tierConfig = store.getTierConfig();

  const canManageInventory = useMemo(() => 
    ['Manager', 'Admin', 'Owner', 'Developer'].includes(userRole || ''), 
  [userRole]);

  const [items, setItems] = useState<InventoryItem[]>(propInventory);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propInventory) {
      setItems(propInventory);
    }
  }, [propInventory]);
  const [isForecasting, setIsForecasting] = useState(false);
  const [showVisionAuditor, setShowVisionAuditor] = useState(false);
  const [priceSuggestions, setPriceSuggestions] = useState<DynamicPriceSuggestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Wine',
    stock: 0,
    unit: 'Bottles',
    volumePerUnit: 750,
    minStock: 12,
    price: 0,
    description: ''
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('vinetelligence_inventory') || localStorage.getItem('vinea_inventory');
      if (saved) setItems(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const persistToSilo = useCallback(async (updatedItems: InventoryItem[]) => {
    setItems(updatedItems);
    localStorage.setItem('vinetelligence_inventory', JSON.stringify(updatedItems));
    localStorage.setItem('vinea_inventory', JSON.stringify(updatedItems));
    
    const profileToSync = JSON.parse(localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile') || '{}');
    if (profileToSync.edition !== 'demo' && profileToSync.id && profileToSync.id !== 'demo-id') {
      setIsSyncing(true);
      console.log("Vinetelligence: Syncing local buffer to Cloud Silo via Bulk Update...");
      try {
        await supabaseSync.bulkUpdateInventory(profileToSync.id, updatedItems);
      } catch (e) {
        console.error("Vinetelligence: Bulk inventory sync failed", e);
      } finally {
        setIsSyncing(false);
      }
    }
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [items, searchQuery, activeCategory]);

  const handleRunForecast = async () => {
    setIsForecasting(true);
    try {
      const transactions = JSON.parse(localStorage.getItem('vinetelligence_transactions') || localStorage.getItem('vinea_transactions') || '[]');
      const res = await geminiService.getInventoryIntelligence(items, transactions);
      const updated = items.map(item => {
        const pred = res.predictions.find((p: { itemName: string; suggestedOrder: number }) => p.itemName === item.name);
        return pred ? { ...item, predictedDemand: pred.suggestedOrder } : item;
      });
      persistToSilo(updated);
      setNotification({ message: "AI Demand Forecast Completed: Reorder levels calibrated based on consumption velocity.", type: 'success' });
      setTimeout(() => setNotification(null), 5000);
    } catch (e) { 
      console.error(e);
      setNotification({ message: "Forecast failed. Check logs for details.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
    finally { setIsForecasting(false); }
  };

  const updateStock = (id: string, delta: number) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const newStock = Math.max(0, item.stock + delta);
        const consumedDelta = delta < 0 ? Math.abs(delta) : 0;
        return { 
          ...item, 
          stock: newStock,
          consumed: (item.consumed || 0) + consumedDelta
        };
      }
      return item;
    });
    persistToSilo(updated);
  };

  const handleAddItem = () => {
    setModalMode('add');
    setIsReviewing(false);
    setFormData({ name: '', category: 'Wine', stock: 0, unit: 'Bottles', volumePerUnit: 750, minStock: 12, price: 0, description: '' });
    setShowItemModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setModalMode('edit');
    setIsReviewing(false);
    setEditingItemId(item.id);
    setFormData({ ...item });
    setShowItemModal(true);
  };

  const handleVisionCommit = async (result: VisionAuditResult) => {
    try {
      const existingItem = items.find(i => 
        i.name.toLowerCase().includes(result.brandName.toLowerCase()) || 
        result.brandName.toLowerCase().includes(i.name.toLowerCase())
      );

      if (existingItem) {
        // Reconcile existing item
        const updatedItems = items.map(i => i.id === existingItem.id ? {
          ...i,
          stock: i.stock + 1, // Increment stock by 1 for the scanned bottle
          sustainabilityScore: result.sustainability.carbonScore,
          originalPrice: result.estimatedPrice,
          // Update price if it's currently 0 or significantly different
          price: i.price === 0 ? result.estimatedPrice * 2.5 : i.price
        } : i);
        
        await persistToSilo(updatedItems);
        setNotification({ 
          message: `Reconciled: Updated stock for ${existingItem.name}.`, 
          type: 'success' 
        });
        setTimeout(() => setNotification(null), 5000);
        setShowVisionAuditor(false);
      } else {
        // Add as new item
        setModalMode('add');
        setIsReviewing(true);
        setFormData({
          name: `${result.brandName} ${result.vintage}`,
          category: 'Wine',
          stock: 1,
          unit: 'Bottles',
          volumePerUnit: 750,
          minStock: 6,
          price: result.estimatedPrice * 2.5, // Standard hospitality markup
          originalPrice: result.estimatedPrice,
          description: result.tastingNotes,
          sustainabilityScore: result.sustainability.carbonScore
        });
        setShowVisionAuditor(false);
        setShowItemModal(true);
      }
    } catch (e) {
      console.error("Vinetelligence: Vision commit failed", e);
      setNotification({ message: "Vision reconciliation failed.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      persistToSilo(items.filter(i => i.id !== itemToDelete));
      setItemToDelete(null);
      setNotification({ message: "Item node removed from operational syncs.", type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let updated: InventoryItem[];
    if (modalMode === 'add') {
      // Enforce Subscription Limits
      if (items.length >= tierConfig.maxInventory) {
        setNotification({ 
          message: `${tierConfig.name} Limit Reached: Maximum ${tierConfig.maxInventory} inventory items allowed. Please upgrade for more capacity.`, 
          type: 'error' 
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      const newItem: InventoryItem = {
        ...formData as InventoryItem,
        id: generateUUID(),
        originalPrice: formData.originalPrice || formData.price || 0,
        consumed: 0
      };
      updated = [...items, newItem];
    } else {
      updated = items.map(i => i.id === editingItemId ? { ...i, ...formData } : i);
    }
    await persistToSilo(updated);
    setShowItemModal(false);
    window.dispatchEvent(new Event('storage'));
  };

  const handleQuickImport = async (dataToImport?: Record<string, unknown>[]) => {
    try {
      let imported: Record<string, unknown>[] = [];
      
      if (dataToImport) {
        imported = dataToImport;
      } else {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(importText);
          imported = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // Fallback to simple CSV-like parsing (Name, Category, Stock, Price)
          const lines = importText.split('\n').filter(l => l.trim());
          imported = lines.map(line => {
            const parts = line.split(',').map(s => s.trim());
            return {
              name: parts[0],
              category: parts[1] || 'Wine',
              stock: parseFloat(parts[2]) || 0,
              price: parseFloat(parts[3]) || 0,
              unit: parts[4] || 'Units',
              minStock: parseFloat(parts[5]) || 12,
              description: parts[6] || ''
            };
          });
        }
      }

      const validatedItems = imported.filter(item => item.name);

      if (validatedItems.length === 0) {
        setNotification({ message: "No valid items found in the data.", type: 'error' });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      // Enforce Subscription Limits for Import
      if ((items.length + validatedItems.length) > tierConfig.maxInventory) {
        setNotification({ 
          message: `${tierConfig.name} Limit Reached: Import would exceed the ${tierConfig.maxInventory} item limit.`, 
          type: 'error' 
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      const newItems: InventoryItem[] = validatedItems.map((item) => ({
        id: generateUUID(),
        name: (item.name as string) || 'Unknown Item',
        category: (item.category as InventoryItem['category']) || 'Wine',
        stock: parseFloat(String(item.stock)) || 0,
        unit: (item.unit as string) || 'Units',
        minStock: parseFloat(String(item.minStock)) || 12,
        price: parseFloat(String(item.price)) || 0,
        originalPrice: parseFloat(String(item.price)) || 0,
        description: (item.description as string) || '',
        consumed: 0,
        volumePerUnit: parseFloat(String(item.volumePerUnit)) || ((item.unit === 'Bottles') ? 750 : 0)
      }));

      const updated = [...items, ...newItems];
      await persistToSilo(updated);
      setShowImportModal(false);
      setImportText('');
      window.dispatchEvent(new Event('storage'));
      setNotification({ message: `Successfully imported ${newItems.length} items.`, type: 'success' });
      setTimeout(() => setNotification(null), 5000);
    } catch (e) {
      console.error("Vinetelligence: Import failed", e);
      setNotification({ message: "Import failed. Please check your data format.", type: 'error' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        name: "Example Wine Estate 2021",
        category: "Wine",
        stock: 24,
        price: 45.00,
        unit: "Bottles",
        minStock: 12,
        volumePerUnit: 750,
        description: "Elegant red with notes of cherry."
      },
      {
        name: "Premium Gin",
        category: "Spirit",
        stock: 12,
        price: 65.00,
        unit: "Bottles",
        minStock: 3,
        volumePerUnit: 700,
        description: "Botanical dry gin."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory_Template");
    XLSX.writeFile(wb, "Vinetelligence_Inventory_Template.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
        handleQuickImport(data);
      } catch (err) {
        console.error("Vinetelligence: File parsing failed", err);
        setNotification({ message: "Failed to parse file. Ensure it is a valid Excel or CSV file.", type: 'error' });
        setTimeout(() => setNotification(null), 5000);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const categories = ['All', 'Wine', 'Spirit', 'Beer', 'Mixer', 'Cocktail', 'Lunch', 'Dinner', 'Snack', 'Garnish'];

  return (
    <div className="space-y-6 flex flex-col pb-24 md:pb-8 animate-in fade-in duration-500 px-4 md:px-0">
      {showVisionAuditor && <VisionAuditor onCommit={handleVisionCommit} onClose={() => setShowVisionAuditor(false)} />}
      {showReport && <InventoryReport items={items} onClose={() => setShowReport(false)} />}
      
      {authMode === 'demo' && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 flex items-center justify-between rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-500">
              Inventory Simulation Active: Using Synthetic Supply Data
            </p>
          </div>
          <p className="text-[9px] italic text-indigo-500/60">
            Connect a production profile to view live inventory intelligence.
          </p>
        </div>
      )}
      
      {notification && (
        <div className={`fixed top-6 right-6 z-[700] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-right-4 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' :
          notification.type === 'error' ? 'bg-indigo-500 text-white border-indigo-400' :
          'bg-stone-900 text-white border-stone-800'
        }`}>
          <i className={`fas ${
            notification.type === 'success' ? 'fa-circle-check' :
            notification.type === 'error' ? 'fa-circle-exclamation' :
            'fa-circle-info'
          }`}></i>
          <span className="text-[10px] font-black uppercase tracking-widest">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-4 opacity-50 hover:opacity-100 transition-opacity">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {itemToDelete && (
        <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 p-10 text-center space-y-8">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <i className="fas fa-trash-can text-3xl"></i>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-black italic text-stone-900">Execute Deletion?</h3>
              <p className="text-stone-500 text-xs leading-relaxed italic">
                This will remove the item node from all operational syncs. This action is irreversible.
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">Confirm Deletion</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-3">
              <h2 className="text-2xl font-serif font-bold text-stone-900">Inventory Intelligence</h2>
              {isSyncing && <i className="fas fa-rotate fa-spin text-[10px] text-indigo-500"></i>}
           </div>
           <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mt-1">{getBrandedTerm('predictive_logistics', store.profile || undefined)}</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => setShowReport(true)}
             className="px-6 py-2.5 bg-white border border-stone-200 text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 hover:border-indigo-500 transition-all active:scale-95"
           >
             <i className="fas fa-chart-line text-indigo-500"></i>
             Inventory Report
           </button>
           <button 
             onClick={onOpenVisionAudit || (() => setShowVisionAuditor(true))}
             className="px-6 py-2.5 bg-indigo-500 text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-indigo-400 transition-all active:scale-95"
           >
             <i className="fas fa-eye"></i>
             Vision Audit
           </button>
           {canManageInventory && (
             <>
               <button 
                 onClick={() => setShowImportModal(true)}
                 className="px-6 py-2.5 bg-white border border-stone-200 text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 hover:border-indigo-500 transition-all active:scale-95"
               >
                 <i className="fas fa-file-import text-indigo-500"></i>
                 Quick Import
               </button>
               <button 
                 onClick={handleAddItem}
                 className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-stone-800 transition-all active:scale-95"
               >
                 <i className="fas fa-plus text-indigo-500"></i>
                 Initialize Registry
               </button>
             </>
           )}
           <button 
             onClick={handleRunForecast} 
             disabled={isForecasting}
             className="px-6 py-2.5 bg-white border border-stone-200 text-stone-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 hover:border-indigo-500 transition-all active:scale-95 disabled:opacity-50"
           >
             {isForecasting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-crystal-ball text-indigo-500"></i>}
             Demand Forecast
           </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
              activeCategory === cat ? 'bg-stone-900 text-white shadow-md' : 'bg-white text-stone-400 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 lg:overflow-hidden">
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col">
           <div className="flex-1 overflow-x-auto lg:overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="sticky top-0 bg-stone-50 z-10 border-b border-stone-200">
                  <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                    <th className="px-8 py-5">Item Identity</th>
                    <th className="px-8 py-5">Stock</th>
                    <th className="px-8 py-5">Consumed</th>
                    <th className="px-8 py-5">Bottles Available</th>
                    <th className="px-8 py-5">ESG</th>
                    <th className="px-8 py-5">Value</th>
                    <th className="px-8 py-5">Forecast</th>
                    {canManageInventory && <th className="px-8 py-5 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredItems.map(item => {
                    const isLow = item.stock <= item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-stone-50 transition-all group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs shadow-sm ${
                               item.category === 'Wine' ? 'bg-indigo-50 text-indigo-600' :
                                item.category === 'Spirit' ? 'bg-indigo-50 text-indigo-600' :
                                (item.category === 'Lunch' || item.category === 'Dinner') ? 'bg-emerald-50 text-emerald-600' :
                                'bg-blue-50 text-blue-600'
                              }`}>
                                <i className={`fas ${
                                  item.category === 'Wine' ? 'fa-wine-bottle' :
                                  item.category === 'Spirit' ? 'fa-glass-whiskey' :
                                  item.category === 'Beer' ? 'fa-beer-mug-empty' : 
                                  (item.category === 'Lunch' || item.category === 'Dinner') ? 'fa-utensils' : 'fa-bowl-food'
                                }`}></i>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-stone-800 truncate">{item.name}</p>
                                <p className="text-[9px] text-stone-400 font-black uppercase tracking-tighter">{item.category}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <span className={`text-lg font-black ${isLow ? 'text-indigo-600' : 'text-stone-900'}`}>{(item.stock || 0).toFixed(2)}</span>
                              <span className="text-[9px] font-bold text-stone-400 uppercase">{item.unit}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <span className="text-lg font-black text-indigo-600">{(item.consumed || 0).toFixed(2)}</span>
                              <span className="text-[9px] font-bold text-stone-400 uppercase">{item.unit}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-stone-700">
                                 {item.unit === 'Bottles' ? (item.stock || 0).toFixed(2) : ((item.stock * (item.volumePerUnit || 0)) / 750).toFixed(2)}
                              </span>
                              <span className="text-[7px] font-black text-stone-400 uppercase">750ml EQ</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2">
                              {item.sustainabilityScore ? (
                                <div className="flex flex-col gap-1">
                                   <div className="w-12 h-1 bg-stone-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${item.sustainabilityScore}%` }}></div>
                                   </div>
                                   <span className="text-[7px] font-black text-emerald-600 uppercase">{item.sustainabilityScore} ALPHA</span>
                                </div>
                              ) : (
                                <span className="text-[7px] font-bold text-stone-300 italic">No ESG Data</span>
                              )}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-sm font-black text-stone-700">${item.price}</span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col">
                              <span className={`text-sm font-black ${item.predictedDemand && item.predictedDemand > item.stock ? 'text-indigo-600' : 'text-stone-700'}`}>
                                 {item.predictedDemand || '--'}
                              </span>
                              <span className="text-[7px] font-black text-stone-400 uppercase">Next 7D</span>
                           </div>
                        </td>
                        {canManageInventory && (
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end gap-2">
                                <div className="flex gap-0.5 bg-stone-100 rounded-lg p-0.5 mr-2">
                                  <button onClick={() => updateStock(item.id, -1)} className="w-8 h-8 rounded-md hover:bg-white text-stone-400 hover:text-indigo-600 transition-all flex items-center justify-center"><i className="fas fa-minus text-[8px]"></i></button>
                                  <button onClick={() => updateStock(item.id, 1)} className="w-8 h-8 rounded-md hover:bg-white text-stone-400 hover:text-emerald-600 transition-all flex items-center justify-center"><i className="fas fa-plus text-[8px]"></i></button>
                                </div>
                                <button onClick={() => handleEditItem(item)} className="w-9 h-9 rounded-xl bg-stone-100 text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center"><i className="fas fa-pen-to-square text-xs"></i></button>
                                <button onClick={() => handleDeleteItem(item.id)} className="w-9 h-9 rounded-xl bg-stone-100 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center"><i className="fas fa-trash-can text-xs"></i></button>
                             </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6 lg:overflow-y-auto custom-scrollbar">
           {priceSuggestions.length > 0 && (
             <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-right-4">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><i className="fas fa-coins text-7xl text-indigo-500"></i></div>
                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6 italic">{getBrandedTerm('yield_alpha_suggestions', store.profile || undefined)}</h4>
                <div className="space-y-4">
                   {priceSuggestions.map((s, i) => (
                     <div key={i} className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-4 hover:bg-white/10 transition-all group">
                        <div className="flex justify-between items-start">
                           <p className="font-bold text-sm truncate max-w-[150px]">{s.itemName}</p>
                           <div className="text-right">
                              <p className="text-emerald-400 font-black">${s.suggestedPrice}</p>
                              <p className="text-[8px] text-stone-500 line-through">${s.currentPrice}</p>
                           </div>
                        </div>
                        <p className="text-[10px] text-stone-400 italic leading-relaxed line-clamp-2">"{s.rationale}"</p>
                        <div className="flex gap-2">
                           <button onClick={() => setActiveRationale(s.rationale)} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase text-stone-400 hover:text-white transition-all">Rationale</button>
                           {canManageInventory && (
                             <button onClick={() => {
                               const updated = items.map(item => item.name === s.itemName ? { ...item, price: s.suggestedPrice } : item);
                               persistToSilo(updated);
                               setPriceSuggestions(prev => prev.filter(ps => ps.itemName !== s.itemName));
                             }} className="flex-1 py-2 bg-indigo-500 text-stone-950 rounded-xl text-[8px] font-black uppercase hover:bg-indigo-400 transition-all">Apply</button>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-6">
              <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest">Analytics Pulse</h3>
              <div className="space-y-4">
                 <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
                    <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Health Index</p>
                    <p className="text-2xl font-serif font-black italic text-emerald-900">Optimal</p>
                    <p className="text-[10px] text-emerald-700/60 mt-1 italic leading-relaxed">System sync confirmed across all floor nodes.</p>
                 </div>
                 <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl">
                    <p className="text-[9px] font-black text-indigo-600 uppercase mb-1">Attention Required</p>
                    <p className="text-2xl font-serif font-black italic text-indigo-900">
                      {items.filter(i => i.stock <= i.minStock).length} {getBrandedTerm('registry_node', store.profile || undefined)}s
                    </p>
                    <p className="text-[10px] text-indigo-700/60 mt-1 italic leading-relaxed">Depletion detected in critical categories.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Quick Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col">
            <div className="p-8 bg-stone-900 text-white flex justify-between items-center">
               <div>
                  <span className="text-[10px] font-black uppercase text-indigo-500 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">Bulk Logistics</span>
                  <h3 className="text-3xl font-serif font-bold italic tracking-tight mt-2">Quick Import</h3>
               </div>
               <button onClick={() => setShowImportModal(false)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-10 space-y-6">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 p-6 rounded-3xl border border-stone-100">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-stone-800">Smart Excel/CSV Import</p>
                    <p className="text-[10px] text-stone-500 italic">Download our verified template to ensure perfect registry sync.</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={handleDownloadTemplate}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-stone-200 text-stone-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-indigo-500 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-download text-indigo-500"></i>
                      Template
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-upload text-indigo-500"></i>
                      Upload File
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx, .xls, .csv"
                      className="hidden"
                    />
                  </div>
               </div>

               <div className="relative">
                 <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center px-8 pointer-events-none">
                    <div className="w-full h-px bg-stone-100"></div>
                    <span className="px-4 text-[8px] font-black uppercase text-stone-300 tracking-[0.3em] bg-white">OR PASTE DATA</span>
                    <div className="w-full h-px bg-stone-100"></div>
                 </div>
               </div>

               <div className="space-y-4">
                 <textarea 
                   value={importText}
                   onChange={e => setImportText(e.target.value)}
                   className="w-full bg-stone-50 border border-stone-200 rounded-3xl px-6 py-6 text-sm font-mono shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-48 resize-none"
                   placeholder={`Paste CSV data here:\nName, Category, Stock, Price, Unit, MinStock, Description\n\nOr paste JSON array...`}
                 />
                 <p className="text-[9px] text-stone-400 italic text-center">
                   Format: Name, Category, Stock, Price (Base), Unit, MinStock, Description
                 </p>
               </div>

               <div className="flex gap-4">
                  <button onClick={() => setShowImportModal(false)} className="flex-1 py-5 bg-stone-100 text-stone-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all">Cancel</button>
                  <button onClick={() => handleQuickImport()} className="flex-[2] py-5 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-500 hover:text-stone-950 transition-all active:scale-95">Execute Manual Import</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Add/Edit Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-stone-200 flex flex-col">
            <div className="p-8 bg-stone-900 text-white flex justify-between items-center relative">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><i className="fas fa-box-open text-8xl"></i></div>
               <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase text-indigo-500 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">Item Configuration</span>
                  <h3 className="text-3xl font-serif font-bold italic tracking-tight mt-2">
                     {isReviewing ? 'Review Scanned Item' : (modalMode === 'add' ? 'Initialize Item' : `Modify ${getBrandedTerm('registry_node', store.profile || undefined)}`)}
                   </h3>
               </div>
               <button onClick={() => setShowItemModal(false)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-20 active:scale-90 border border-white/5 shadow-xl"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-10 space-y-8 overflow-y-auto custom-scrollbar max-h-[70vh]">
               <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-stone-500 tracking-widest mb-3 ml-1">Identity (Name)</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="e.g. Suntory Toki Whisky"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-500 tracking-widest mb-3 ml-1">Category Silo</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value as InventoryItem['category']})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                      >
                        {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-500 tracking-widest mb-3 ml-1">Measurement Unit</label>
                      <select 
                        value={formData.unit}
                        onChange={e => {
                          const unit = e.target.value;
                          let vol = formData.volumePerUnit || 750;
                          if (unit === 'Bottles') vol = 750;
                          if (unit === 'Glass') vol = 150;
                          if (unit === 'On the Rocks') vol = 60;
                          if (unit === 'Mix') vol = 45;
                          if (unit === 'Portions' || unit === 'Servings' || unit === 'Units') vol = 0;
                          setFormData({...formData, unit, volumePerUnit: vol});
                        }}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                      >
                        <option value="Bottles">Bottles</option>
                        <option value="Glass">Glass</option>
                        <option value="On the Rocks">On the Rocks</option>
                        <option value="Mix">Mix</option>
                        <option value="Liters">Liters</option>
                        <option value="Milliliters">Milliliters</option>
                        <option value="Units">Units</option>
                        <option value="Portions">Portions</option>
                        <option value="Servings">Servings</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-500 tracking-widest mb-3 ml-1">Volume per Unit (ml)</label>
                      <input 
                        type="number" 
                        value={formData.volumePerUnit}
                        onChange={e => setFormData({...formData, volumePerUnit: parseFloat(e.target.value) || 0})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 text-sm font-black shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="e.g. 750 for a standard bottle"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-500 tracking-widest mb-3 ml-1">Base Price ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 text-sm font-black shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-500 tracking-widest mb-3 ml-1">Current Stock</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.stock}
                        onChange={e => setFormData({...formData, stock: parseFloat(e.target.value) || 0})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 text-sm font-black shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-500 tracking-widest mb-3 ml-1">Par Level (Min)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.minStock}
                        onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value) || 0})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 text-sm font-black shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-stone-500 tracking-widest mb-3 ml-1">Historical Note / Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-3xl px-6 py-6 text-sm font-medium shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 transition-all h-32 resize-none italic leading-relaxed"
                      placeholder="List origin, flavor notes, or specific pairing logic..."
                    />
                  </div>
               </div>

               <div className="flex gap-4 pt-4 shrink-0">
                  <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-5 bg-stone-100 text-stone-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all">Discard</button>
                  <button type="submit" className="flex-[2] py-5 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-500 hover:text-stone-950 transition-all active:scale-95">Commit Registry Node</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {showReport && (
        <InventoryReport 
          items={items} 
          onClose={() => setShowReport(false)} 
        />
      )}
    </div>
  );
};

export default Inventory;

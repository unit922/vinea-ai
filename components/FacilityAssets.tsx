
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Plus, 
  Settings, 
  Wind, 
  Refrigerator, 
  Utensils, 
  Trash2,
  RefreshCw,
  Clock,
  Gauge
} from 'lucide-react';
import { FacilityAsset } from '../lib/types';
import { supabaseSync } from '../services/supabaseSync';

interface FacilityAssetsProps {
  restaurantId: string;
}

const FacilityAssets: React.FC<FacilityAssetsProps> = ({ restaurantId }) => {
  const [assets, setAssets] = useState<FacilityAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [newAsset, setNewAsset] = useState<Partial<FacilityAsset>>({
    name: '',
    type: 'Kitchen',
    health_score: 100,
    status: 'Optimal',
    telemetry: {}
  });

  const fetchAssets = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await supabaseSync.getEquipment(restaurantId);
      setAssets(data);
    } catch (err: unknown) {
      console.error("Vinetelligence: Failed to fetch assets", err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await supabaseSync.addEquipment({
        ...newAsset,
        restaurant_id: restaurantId
      });
      setShowAddModal(false);
      setNewAsset({
        name: '',
        type: 'Kitchen',
        health_score: 100,
        status: 'Optimal',
        telemetry: {}
      });
      fetchAssets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setFeedback({ message: "Failed to add equipment: " + message, type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleDeleteAsset = (id: string) => {
    setAssetToDelete(id);
  };

  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    try {
      await supabaseSync.deleteEquipment(assetToDelete);
      setAssetToDelete(null);
      setFeedback({ message: "Asset successfully decommissioned.", type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
      fetchAssets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setFeedback({ message: "Failed to delete asset: " + message, type: 'error' });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Optimal': return 'text-emerald-400 bg-emerald-400/10';
      case 'Warning': return 'text-amber-400 bg-amber-400/10';
      case 'Critical': return 'text-rose-400 bg-rose-400/10';
      default: return 'text-stone-400 bg-stone-400/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hvac': return <Wind className="w-5 h-5" />;
      case 'refrigeration': return <Refrigerator className="w-5 h-5" />;
      case 'kitchen': return <Utensils className="w-5 h-5" />;
      case 'bar': return <Activity className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto relative">
      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 ${
              feedback.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
            }`}
          >
            <span className="text-xs font-black uppercase tracking-widest">{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="opacity-50 hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {assetToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssetToDelete(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-stone-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl text-center space-y-6"
            >
              <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto">
                <Trash2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold text-white">Decommission Asset?</h3>
                <p className="text-stone-500 text-sm leading-relaxed">
                  Are you sure you want to decommission this asset? This action is irreversible and will stop all telemetry syncs.
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setAssetToDelete(null)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-stone-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteAsset}
                  className="flex-1 bg-rose-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-rose-700 transition-colors"
                >
                  Decommission
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-serif font-bold text-white mb-2">Facility Assets</h1>
          <p className="text-stone-500">Real-time telemetry and health monitoring for critical infrastructure.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-stone-200 transition-colors"
        >
          <Plus className="w-5 h-5" /> Register Asset
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-stone-700 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <motion.div 
              key={asset.id}
              layoutId={asset.id}
              className="bg-stone-900/50 border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-colors group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${getStatusColor(asset.status)}`}>
                  {getTypeIcon(asset.type)}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="p-2 text-stone-600 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{asset.name}</h3>
                  <p className="text-stone-500 text-sm uppercase tracking-widest font-black">{asset.type}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-stone-500 uppercase">Health Score</span>
                    <span className={asset.health_score < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                      {asset.health_score}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${asset.health_score}%` }}
                      className={`h-full rounded-full ${
                        asset.health_score < 50 ? 'bg-rose-500' : 
                        asset.health_score < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-stone-500 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>Last Service: {asset.last_service ? new Date(asset.last_service).toLocaleDateString() : 'Never'}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {assets.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-white/5 rounded-3xl p-12 text-center">
              <Gauge className="w-12 h-12 text-stone-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-stone-400">No Assets Registered</h3>
              <p className="text-stone-600 max-w-xs mx-auto mt-2">
                Begin monitoring your facility by registering your first critical infrastructure asset.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-stone-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-serif font-bold text-white mb-6">Register New Asset</h2>
              <form onSubmit={handleAddAsset} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Asset Name</label>
                  <input 
                    required
                    value={newAsset.name}
                    onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                    placeholder="e.g. Main Walk-in Cooler"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-white outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest ml-1">Asset Type</label>
                  <select 
                    value={newAsset.type}
                    onChange={e => setNewAsset({...newAsset, type: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-white outline-none appearance-none"
                  >
                    <option value="HVAC">HVAC</option>
                    <option value="Refrigeration">Refrigeration</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Bar">Bar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-stone-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-white text-black px-6 py-4 rounded-2xl font-bold hover:bg-stone-200 transition-colors"
                  >
                    Register
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FacilityAssets;

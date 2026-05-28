import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabaseSync } from '../services/supabaseSync';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';

export const ConnectivityMonitor: React.FC = () => {
  const store = useVinetelligenceStore();
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('online');

  const checkDatabase = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus('offline');
      store.setIsOnline(false);
      return;
    }

    setStatus('checking');
    const isReachable = await supabaseSync.ping();
    store.setIsDatabaseConnected(isReachable);
    setStatus(isReachable ? 'online' : 'offline');
  }, [store]);

  useEffect(() => {
    const handleOnline = () => {
      setStatus('online');
      store.setIsOnline(true);
    };
    const handleOffline = () => {
      setStatus('offline');
      store.setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial database check - wrap in timeout to avoid synchronous state update in effect
    const initialCheck = setTimeout(() => {
      checkDatabase();
    }, 0);

    // Periodic check every 60 seconds
    const interval = setInterval(checkDatabase, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [checkDatabase, store]);

  const isVisible = store.isOnline === false || store.isDatabaseConnected === false || store.isSyncing;

  return (
    <AnimatePresence>
      {(isVisible) && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[9999]"
        >
          <div className={`bg-stone-900 border ${!store.isOnline || !store.isDatabaseConnected ? 'border-indigo-500/50' : 'border-stone-800'} rounded-xl p-4 shadow-2xl flex items-start gap-4`}>
            <div className={`p-2 rounded-lg ${!store.isOnline ? 'bg-red-500/20 text-red-500' : (!store.isDatabaseConnected ? 'bg-indigo-500/20 text-indigo-500' : 'bg-stone-800 text-stone-400')}`}>
              {!store.isOnline ? <WifiOff size={20} /> : (!store.isDatabaseConnected ? <AlertTriangle size={20} /> : <RefreshCw size={20} className="animate-spin" />)}
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {!store.isOnline ? 'Internet Disconnected' : (!store.isDatabaseConnected ? 'Cloud Silo Interrupted' : 'Syncing Pulse')}
              </h4>
              <p className="text-xs text-stone-400 mt-1">
                {!store.isOnline 
                  ? 'Please check your connection to continue syncing.' 
                  : (!store.isDatabaseConnected 
                    ? 'Connectivity to the Vinetelligence Cloud is offline.' 
                    : 'Updating your establishments data in realtime.')}
              </p>
              
              {(!store.isOnline || !store.isDatabaseConnected) && (
                <button 
                  onClick={checkDatabase}
                  className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  <RefreshCw size={12} className={status === 'checking' ? 'animate-spin' : ''} />
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

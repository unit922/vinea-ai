
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabaseSync } from '../services/supabaseSync';

interface DevPortalProps {
  onSelect: (choice: 'demo' | 'investor' | 'enterprise') => void;
  userEmail?: string;
}

const DevPortal: React.FC<DevPortalProps> = ({ onSelect, userEmail }) => {
  const [purging, setPurging] = useState(false);
  const [purgeResult, setPurgeResult] = useState<{ count: number; message: string } | null>(null);

  const handlePurgeOrphans = async () => {
    const secret = prompt("Vinetelligence Security Protocol: Enter Administrative Secret (Service Role Key)");
    if (!secret) return;

    setPurging(true);
    setPurgeResult(null);
    try {
      const data = await supabaseSync.purgeOrphanedAuthUsers(secret);
      setPurgeResult({ count: data.purgedCount, message: data.message });
      setTimeout(() => setPurgeResult(null), 8000);
    } catch (e: unknown) {
      const err = e as Error;
      alert(`Protocol Failure: ${err.message}`);
    } finally {
      setPurging(false);
    }
  };

  const handleGlobalTestPurge = async () => {
    const secret = prompt("DANGER: This will delete ALL Demo/Test restaurants AND their associated users. Enter Service Role Key to confirm.");
    if (!secret) return;

    setPurging(true);
    setPurgeResult(null);
    try {
      const data = await supabaseSync.purgeAllTestNodes(secret);
      setPurgeResult({ count: data.nodesTerminated, message: data.message });
      setTimeout(() => setPurgeResult(null), 8000);
    } catch (e: unknown) {
      const err = e as Error;
      alert(`Global Protocol Failure: ${err.message}`);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-stone-950 flex flex-col items-center justify-center p-6 overflow-y-auto">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-5xl relative z-10 py-12 space-y-12">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
          >
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Developer Command Center</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-serif font-black italic text-white tracking-tighter leading-none"
          >
            Welcome, <span className="text-stone-500">{userEmail?.split('@')[0]}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-stone-400 text-lg md:text-xl font-medium italic max-w-2xl mx-auto"
          >
            "Select your operational protocol for this session. Your developer credentials grant multi-node access."
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Demo Option */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => onSelect('demo')}
            className="group relative bg-white/5 border border-white/10 p-10 rounded-[3rem] text-left space-y-8 hover:border-indigo-500/40 hover:bg-white/[0.08] transition-all shadow-2xl overflow-hidden"
          >
            <div className="w-16 h-16 bg-stone-800 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-stone-950 transition-all">
              <i className="fas fa-vial text-2xl"></i>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-serif font-bold text-white italic">The Explorer</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-medium italic">
                Enter the demo environment. Local-first persistence for rapid prototyping and feature testing.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-600 group-hover:text-indigo-500">Demo Protocol</span>
              <i className="fas fa-arrow-right text-[10px] text-stone-700 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </motion.button>

          {/* Investor Option */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => onSelect('investor')}
            className="group relative bg-white/5 border border-white/10 p-10 rounded-[3rem] text-left space-y-8 hover:border-emerald-500/40 hover:bg-white/[0.08] transition-all shadow-2xl overflow-hidden"
          >
            <div className="w-16 h-16 bg-stone-800 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-stone-950 transition-all">
              <i className="fas fa-chart-line text-2xl"></i>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-serif font-bold text-white italic">The Stakeholder</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-medium italic">
                Access the Executive Intelligence Suite. View global metrics, equity alpha, and scalability roadmaps.
              </p>
            </div>
            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-600 group-hover:text-emerald-500">Investor View</span>
              <i className="fas fa-arrow-right text-[10px] text-stone-700 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </motion.button>

          {/* Enterprise Option */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => onSelect('enterprise')}
            className="group relative bg-stone-900 border border-indigo-500/30 p-10 rounded-[3rem] text-left space-y-8 hover:border-indigo-500 hover:bg-stone-800 transition-all shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-code text-8xl"></i></div>
            <div className="w-16 h-16 bg-indigo-500 text-stone-950 rounded-2xl flex items-center justify-center shadow-xl">
              <i className="fas fa-terminal text-2xl"></i>
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-serif font-bold text-white italic">Enterprise</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-medium italic">
                Full system access. Manage network silos, debug intelligence nodes, and oversee global facility registries.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Root Access</span>
              <i className="fas fa-arrow-right text-[10px] text-indigo-500 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </motion.button>
        </div>

        {/* System Maintenance Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-stone-900/50 border border-white/5 p-8 rounded-[3rem] space-y-8"
        >
          <div className="space-y-2">
            <h4 className="text-xl font-serif font-bold text-white italic">System Maintenance</h4>
            <p className="text-xs text-stone-500 font-medium italic">Management protocols for orphaned registries and test architecture.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Orphan Cleanup</p>
                <p className="text-[10px] text-stone-400 font-medium italic">Remove authenticated users whose establishments no longer exist in the database.</p>
              </div>
              <button 
                onClick={handlePurgeOrphans}
                disabled={purging}
                className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all inline-flex items-center justify-center gap-3 ${
                  purging 
                    ? 'bg-stone-800 text-stone-500 cursor-wait' 
                    : 'bg-stone-800 text-white border border-white/10 hover:bg-stone-700'
                }`}
              >
                {purging ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-user-minus"></i>}
                Purge Orphaned Users
              </button>
            </div>

            <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Global Test Purge</p>
                <p className="text-[10px] text-stone-400 font-medium italic">Wipe ALL nodes labeled "Test/Demo" and their associated user credentials.</p>
              </div>
              <button 
                onClick={handleGlobalTestPurge}
                disabled={purging}
                className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all inline-flex items-center justify-center gap-3 ${
                  purging 
                    ? 'bg-stone-800 text-stone-500 cursor-wait' 
                    : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                {purging ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-skull"></i>}
                Purge All Test Data
              </button>
            </div>
          </div>

          {purgeResult && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
            >
              <i className="fas fa-check-circle text-sm"></i>
              {purgeResult.message}
            </motion.div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <p className="text-[9px] font-black text-stone-700 uppercase tracking-[0.5em]">Vinetelligence Intelligence Suite // Dev Auth 3.1.0</p>
        </motion.div>
      </div>
    </div>
  );
};


export default DevPortal;


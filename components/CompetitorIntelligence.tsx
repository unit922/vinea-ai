
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  TrendingUp, 
  Target, 
  Plus, 
  Trash2, 
  Sparkles, 
  Loader2,
  ChevronRight,
  Globe,
  Zap,
  Info
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { InventoryItem, MarketStrategy } from '../lib/types';

interface CompetitorIntelligenceProps {
  inventory: InventoryItem[];
}

const CompetitorIntelligence: React.FC<CompetitorIntelligenceProps> = ({ inventory }) => {
  const [competitors, setCompetitors] = useState<{ name: string; type: string }[]>(() => {
    const saved = localStorage.getItem('vinetelligence_competitors');
    return saved ? JSON.parse(saved) : [{ name: 'The Golden Cask', type: 'Cocktail Bar' }];
  });
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [newCompetitorType, setNewCompetitorType] = useState('Cocktail Bar');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [strategy, setStrategy] = useState<MarketStrategy | null>(() => {
    const saved = localStorage.getItem('vinetelligence_market_strategy');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedCompetitor, setSelectedCompetitor] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('vinetelligence_competitors', JSON.stringify(competitors));
  }, [competitors]);

  useEffect(() => {
    if (strategy) {
      localStorage.setItem('vinetelligence_market_strategy', JSON.stringify(strategy));
    }
  }, [strategy]);

  const addCompetitor = () => {
    if (!newCompetitorName.trim()) return;
    setCompetitors([...competitors, { name: newCompetitorName, type: newCompetitorType }]);
    setNewCompetitorName('');
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const runAnalysis = async () => {
    if (competitors.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await geminiService.getCompetitorAnalysis(competitors, inventory);
      setStrategy(result);
    } catch (e) {
      console.error("Vinetelligence: Market analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 p-8 overflow-y-auto custom-scrollbar pb-20 selection:bg-amber-500 selection:text-white">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-serif font-black italic text-stone-900 tracking-tighter">Market Sentinel</h2>
          <p className="text-stone-500 text-sm font-medium italic">Competitor performance analysis and strategic counter-mapping.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
            <Globe className="w-3 h-3 text-amber-500" />
            Global Trend Sync Active
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Setup & Competitor List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] flex items-center gap-2">
                <Plus className="w-3 h-3" /> Add Competitor Node
              </h4>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Establishment Name" 
                  value={newCompetitorName}
                  onChange={e => setNewCompetitorName(e.target.value)}
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-inner"
                />
                <select 
                  value={newCompetitorType}
                  onChange={e => setNewCompetitorType(e.target.value)}
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-amber-500/20 outline-none transition-all shadow-inner appearance-none cursor-pointer"
                >
                  <option>Cocktail Bar</option>
                  <option>Wine Lounge</option>
                  <option>Fine Dining</option>
                  <option>Bistro</option>
                  <option>Neural Cafe</option>
                </select>
                <button 
                  onClick={addCompetitor}
                  className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-all active:scale-95"
                >
                  Authorize Node
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-stone-100" />

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em]">Active Nodes</h4>
              <div className="space-y-2">
                <AnimatePresence>
                  {competitors.map((c, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex justify-between items-center group hover:border-amber-500/30 transition-all"
                    >
                      <div>
                        <p className="text-xs font-bold text-stone-900">{c.name}</p>
                        <p className="text-[9px] text-stone-500 uppercase font-black">{c.type}</p>
                      </div>
                      <button 
                        onClick={() => removeCompetitor(i)}
                        className="w-8 h-8 rounded-full bg-white text-stone-300 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {competitors.length === 0 && (
                  <div className="py-10 text-center opacity-30 italic text-xs text-stone-500">
                    No nodes authorized.
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={runAnalysis}
              disabled={isAnalyzing || competitors.length === 0}
              className="w-full py-6 bg-amber-500 text-stone-950 rounded-[1.8rem] font-black uppercase text-xs tracking-[0.3em] shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate Strategy
            </button>
          </div>

          <div className="bg-stone-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp className="w-12 h-12" /></div>
            <h5 className="text-[10px] font-black uppercase text-amber-500 mb-4 tracking-widest">Aura Intelligence</h5>
            <p className="text-xs leading-relaxed italic text-stone-300 font-medium">
              "Competitive advantage in the neural era isn't about matching prices; it's about identifying the organoleptic gaps in their ecosystem."
            </p>
          </div>
        </div>

        {/* Right Col: Strategy & Trends */}
        <div className="lg:col-span-8 space-y-8 pb-20">
          {!strategy && !isAnalyzing ? (
            <div className="h-full min-h-[500px] bg-white rounded-[4rem] border border-stone-200 border-dashed flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="w-24 h-24 bg-stone-50 rounded-[3rem] flex items-center justify-center text-stone-200">
                <Target className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black italic text-stone-400">Analysis Pending</h3>
                <p className="text-stone-400 text-sm italic max-w-sm font-medium">Add competitors and trigger the Sentinel to synthesize a market offensive.</p>
              </div>
            </div>
          ) : isAnalyzing ? (
            <div className="h-full min-h-[500px] bg-white rounded-[4rem] border border-stone-200 flex flex-col items-center justify-center text-center p-12 space-y-8 animate-pulse">
              <div className="w-24 h-24 relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
                <div className="absolute inset-4 bg-amber-500 rounded-full flex items-center justify-center text-white">
                  <Zap className="w-8 h-8" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-black italic text-stone-900">Synthesizing Strategy</h3>
                <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.4em]">Mining Regional Consumption Trends...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
              {/* Market Trends */}
              <div className="bg-white p-10 rounded-[3.5rem] border border-stone-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Info className="w-32 h-32" /></div>
                <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-[0.4em] mb-8 italic">Current Regional Trends</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategy?.marketTrends.map((trend, i) => (
                    <div key={i} className="flex gap-4 items-center bg-stone-50 p-6 rounded-3xl border border-stone-100 group hover:border-amber-500/30 transition-all">
                      <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_10px_#f59e0b]" />
                      <p className="text-xs font-bold text-stone-800 italic leading-relaxed">{trend}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competitor Focus */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] ml-4">Node Breakdown</h4>
                  <div className="space-y-2">
                    {strategy?.competitors.map((c, i) => (
                      <button 
                        key={i} 
                        onClick={() => setSelectedCompetitor(i)}
                        className={`w-full text-left p-6 rounded-[2.5rem] transition-all border ${
                          selectedCompetitor === i 
                            ? 'bg-stone-900 text-white border-stone-900 shadow-xl' 
                            : 'bg-white text-stone-800 border-stone-100 hover:border-amber-500/30 shadow-sm'
                        }`}
                      >
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedCompetitor === i ? 'text-amber-500' : 'text-stone-400'}`}>Competitor {i + 1}</p>
                        <p className="text-sm font-bold truncate">{c.name}</p>
                        <div className="mt-4 flex items-center justify-between">
                           <ChevronRight className={`w-4 h-4 transition-transform ${selectedCompetitor === i ? 'translate-x-1' : 'opacity-0'}`} />
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${selectedCompetitor === i ? 'bg-white/10 text-white' : 'bg-stone-50 text-stone-400'}`}>Analyzed</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-8">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={selectedCompetitor}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white p-10 rounded-[4rem] border border-stone-200 shadow-xl h-full space-y-10"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-3xl font-serif font-black italic text-stone-900 leading-tight">{strategy?.competitors[selectedCompetitor]?.name}</h3>
                          <div className="flex gap-2 mt-4">
                            <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">Strength Identified</span>
                            <span className="text-[9px] font-black uppercase bg-rose-50 text-rose-600 px-3 py-1 rounded-full border border-rose-100">Vulnerability Detected</span>
                          </div>
                        </div>
                        <Target className="w-10 h-10 text-stone-100" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Market Dominance</h5>
                          <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                            <p className="text-xs text-emerald-800 leading-relaxed font-medium italic">
                              "{strategy?.competitors[selectedCompetitor]?.strength}"
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Logic Gap</h5>
                          <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                            <p className="text-xs text-rose-800 leading-relaxed font-medium italic">
                              "{strategy?.competitors[selectedCompetitor]?.weakness}"
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-10 border-t border-stone-100">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                               <Shield className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Offensive Mapping</p>
                               <p className="text-sm font-bold text-stone-800">Counter-Strategy Protocol</p>
                            </div>
                         </div>
                         <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><Zap className="w-16 h-16 text-amber-500" /></div>
                            <p className="text-lg font-serif italic text-stone-700 leading-relaxed relative z-10">
                              "{strategy?.competitors[selectedCompetitor]?.strategy}"
                            </p>
                         </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Overall Strategy */}
              <div className="bg-stone-900 p-12 rounded-[5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:scale-110 transition-transform duration-[10s]"><Shield className="w-64 h-64" /></div>
                <div className="relative z-10 space-y-8">
                  <header className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-[1.5rem] flex items-center justify-center text-stone-900 shadow-xl shadow-amber-500/20 animate-pulse">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-3xl font-serif font-black italic tracking-tighter">Strategic Synthesis</h4>
                      <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.4em]">Unified Market Offensive</p>
                    </div>
                  </header>
                  
                  <div className="bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/10">
                    <p className="text-2xl font-serif italic leading-relaxed text-stone-200">
                      {strategy?.overallStrategy}
                    </p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <div className="px-6 py-3 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                      Trend-Driven Analysis
                    </div>
                    <div className="px-6 py-3 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                      Inventory Mapped
                    </div>
                    <div className="px-6 py-3 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                      Neural Execution Ready
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitorIntelligence;

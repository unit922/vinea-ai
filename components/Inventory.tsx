
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { INITIAL_INVENTORY } from '../constants';
import { geminiService } from '../services/geminiService';
import { supabaseSync, getSupabaseConfig } from '../services/supabaseClient';
import { InventoryItem, DynamicPriceSuggestion } from '../types';

const VisionScanner: React.FC<{ onResult: (res: any) => void; onClose: () => void }> = ({ onResult, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'calibrating' | 'scanning' | 'analyzing' | 'complete'>('calibrating');
  const [scanProgress, setScanProgress] = useState(0);

  const startCamera = async () => {
    setError(null);
    setStatus('calibrating');
    try {
      const constraints = { 
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } 
      };
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setStatus('idle');
        };
      }
    } catch (err) {
      setError("Camera access denied.");
      setStatus('idle');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const initiateScan = async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);
    setStatus('scanning');
    setScanProgress(0);
    const scanDuration = 2000; 
    const startTime = Date.now();
    const updateScan = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / scanDuration, 1);
      setScanProgress(progress * 100);
      if (progress < 1) requestAnimationFrame(updateScan);
      else captureAndAnalyze();
    };
    requestAnimationFrame(updateScan);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);
    setStatus('analyzing');
    try {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
      const result = await geminiService.analyzeVisionFrame(base64);
      setStatus('complete');
      setTimeout(() => onResult(result), 800);
    } catch (e) {
      setError("Vision intelligence sync failed.");
      setIsCapturing(false);
      setStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-stone-950 flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl aspect-[9/16] md:aspect-[3/4] bg-stone-900 rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl">
        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-all duration-700 ${status === 'scanning' ? 'brightness-125 saturate-150' : 'grayscale opacity-80'}`} />
        {showFlash && <div className="absolute inset-0 bg-white z-[60] animate-in fade-out duration-200"></div>}
        <div className="absolute top-10 left-10 right-10 z-50 flex justify-between items-center">
           <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'scanning' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-stone-500'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-200">{status}</span>
           </div>
        </div>
        <div className="absolute inset-0 pointer-events-none z-40">
           {status === 'scanning' && <div className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_25px_#3b82f6]" style={{ top: `${scanProgress}%` }}></div>}
        </div>
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12 items-center px-10 z-50">
          <button onClick={onClose} className="w-14 h-14 bg-black/40 text-white rounded-full flex items-center justify-center border border-white/10"><i className="fas fa-times"></i></button>
          {status === 'idle' && <button onClick={initiateScan} className="w-24 h-24 bg-white rounded-full border-8 border-stone-200"><i className="fas fa-barcode text-3xl"></i></button>}
        </div>
      </div>
    </div>
  );
};

const calculateYield = (item: InventoryItem) => {
  const { category, stock, unit } = item;
  switch (category) {
    case 'Wine': return { count: Math.floor(stock * 5), label: 'Glasses', icon: 'fa-wine-glass-alt', pour: '5oz / 150ml' };
    case 'Spirit': return { count: Math.floor(stock * (unit.toLowerCase().includes('liter') ? 22.2 : 16.8)), label: 'Shots', icon: 'fa-glass-whiskey-rocks', pour: '1.5oz / 45ml' };
    case 'Beer': return { count: stock, label: 'Servings', icon: 'fa-beer-mug-empty', pour: '1 Unit' };
    case 'Mixer': return { count: Math.floor(stock * 16), label: 'Servings', icon: 'fa-blender', pour: '2oz / 60ml' };
    case 'Snack': return { count: stock, label: 'Portions', icon: 'fa-cookie-bite', pour: '1 Portion' };
    default: return { count: stock, label: 'Units', icon: 'fa-box', pour: 'N/A' };
  }
};

const Inventory: React.FC<{ searchQuery?: string }> = ({ searchQuery = '' }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPricing, setIsPricing] = useState(false);
  const [priceSuggestions, setPriceSuggestions] = useState<DynamicPriceSuggestion[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
  
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastResults, setForecastResults] = useState<{summary: string, predictions: any[]} | null>(null);

  const isEnterprise = !!getSupabaseConfig();

  useEffect(() => {
    const load = async () => {
      const local = localStorage.getItem('vinea_inventory');
      const initial = local ? JSON.parse(local) : INITIAL_INVENTORY.map(i => ({...i, originalPrice: i.price}));
      if (isEnterprise) {
        setIsSyncing(true);
        const cloudData = await supabaseSync.pullData('inventory');
        setItems(cloudData && cloudData.length > 0 ? cloudData : initial);
        setIsSyncing(false);
      } else {
        setItems(initial);
      }
    };
    load();
  }, [isEnterprise]);

  useEffect(() => {
    if (items.length > 0) localStorage.setItem('vinea_inventory', JSON.stringify(items));
  }, [items]);

  const handlePricingAnalysis = async () => {
    setForecastResults(null);
    setIsPricing(true);
    try {
      const res = await geminiService.getDynamicPricingSuggestions(items);
      setPriceSuggestions(res.suggestions);
    } catch (e) { console.error(e); }
    finally { setIsPricing(false); }
  };

  const handleDemandForecast = async () => {
    setPriceSuggestions([]);
    setIsForecasting(true);
    try {
      const res = await geminiService.getInventoryIntelligence(items);
      setForecastResults(res);
    } catch (e) { console.error(e); }
    finally { setIsForecasting(false); }
  };

  const applyPrice = (suggest: DynamicPriceSuggestion) => {
    setItems(prev => prev.map(item => item.name === suggest.itemName ? { ...item, price: suggest.suggestedPrice } : item));
    setPriceSuggestions(prev => prev.filter(s => s.itemName !== suggest.itemName));
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let result = items.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q)
    );

    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'desc') {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [items, searchQuery, sortOrder]);

  return (
    <div className="space-y-6 h-full flex flex-col pb-20">
      {showScanner && <VisionScanner onClose={() => setShowScanner(false)} onResult={(res) => setShowScanner(false)} />}
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-bold text-stone-900">Supply & Revenue Intelligence</h2>
          <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Inventory Ledger v4.1 • Yield Analytics Active</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleDemandForecast} disabled={isForecasting} className="px-6 py-3 bg-white border border-stone-200 text-stone-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-amber-500 transition-all shadow-sm">
             {isForecasting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-chart-line text-amber-500"></i>}
             Demand Forecast
          </button>
          <button onClick={handlePricingAnalysis} disabled={isPricing} className="px-6 py-3 bg-white border border-stone-200 text-stone-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-amber-500 transition-all shadow-sm">
             {isPricing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-coins text-amber-500"></i>}
             Yield Analysis
          </button>
          <button onClick={() => setShowScanner(true)} className="px-8 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-stone-800 transition-all border border-amber-500/30">
             <i className="fas fa-barcode text-amber-500"></i> Vision Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1 min-h-0">
        <div className="xl:col-span-8 flex flex-col min-h-0">
           <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col flex-1">
              <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col">
                 {items.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                      <div className="w-32 h-32 bg-stone-50 rounded-[3rem] flex items-center justify-center mb-8 border border-stone-100 text-stone-200 text-5xl animate-pulse"><i className="fas fa-wine-bottle"></i></div>
                      <h3 className="text-2xl font-serif font-bold text-stone-900 mb-3">Ledger Silent</h3>
                      <button onClick={() => setShowScanner(true)} className="mt-8 px-10 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Launch Vision Audit</button>
                   </div>
                 ) : (
                   <table className="w-full text-left">
                      <thead className="sticky top-0 bg-stone-50 border-b border-stone-100 z-10">
                         <tr className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                            <th className="px-8 py-5">
                               <div className="flex items-center gap-2">
                                 <span>Item Identifier</span>
                                 <div className="relative group/sort">
                                    <select 
                                      value={sortOrder} 
                                      onChange={(e) => setSortOrder(e.target.value as any)}
                                      className="bg-transparent border-none text-[8px] font-black uppercase tracking-widest text-stone-400 focus:ring-0 cursor-pointer appearance-none pr-4 hover:text-amber-500 transition-colors"
                                    >
                                      <option value="none">Sort</option>
                                      <option value="asc">A-Z</option>
                                      <option value="desc">Z-A</option>
                                    </select>
                                    <i className="fas fa-sort absolute right-0 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none group-hover/sort:text-amber-500 transition-colors"></i>
                                 </div>
                               </div>
                            </th>
                            <th className="px-8 py-5">Silo Stock</th>
                            <th className="px-8 py-5">Yield IQ</th>
                            <th className="px-8 py-5 text-right">Retail Value</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                         {filteredItems.map(item => {
                            const yieldData = calculateYield(item);
                            return (
                              <tr key={item.id} onClick={() => setSelectedItem(item)} className={`group cursor-pointer transition-all ${selectedItem?.id === item.id ? 'bg-amber-50/50' : 'hover:bg-stone-50'}`}>
                                 <td className="px-8 py-6"><p className="text-sm font-bold text-stone-900">{item.name}</p><p className="text-[9px] text-stone-400 uppercase font-black">{item.category}</p></td>
                                 <td className="px-8 py-6"><div className="flex items-center gap-3"><div className={`w-1.5 h-1.5 rounded-full ${item.stock < item.minStock ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500'}`}></div><span className="text-sm font-black text-stone-700">{item.stock} <span className="text-[10px] text-stone-400">{item.unit}</span></span></div></td>
                                 <td className="px-8 py-6"><div className="flex items-center gap-2 text-stone-600"><i className={`fas ${yieldData.icon} text-[10px] text-amber-500`}></i><span className="text-xs font-bold">{yieldData.count} {yieldData.label}</span></div></td>
                                 <td className="px-8 py-6 text-right"><span className="text-xs font-serif font-bold text-stone-400">${(item.stock * item.price).toLocaleString()}</span></td>
                              </tr>
                            );
                         })}
                      </tbody>
                   </table>
                 )}
              </div>
           </div>
        </div>

        <div className="xl:col-span-4 space-y-6 overflow-y-auto custom-scrollbar pr-2">
           {forecastResults && (
              <div className="bg-amber-500 text-stone-900 p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-right-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-chart-line text-7xl"></i></div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60 italic">Intelligence Results</h4>
                 <h3 className="text-2xl font-serif font-black italic tracking-tighter mb-6 leading-none">Supply Alpha Forecast</h3>
                 <p className="text-xs font-bold mb-8 leading-relaxed">"{forecastResults.summary}"</p>
                 <div className="space-y-4">
                    {forecastResults.predictions.map((p: any, i: number) => (
                       <div key={i} className="bg-stone-900/5 border border-stone-900/10 p-5 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center"><p className="text-xs font-black">{p.itemName}</p><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${p.status === 'Critical' ? 'bg-rose-600 text-white' : 'bg-stone-900 text-white'}`}>{p.status}</span></div>
                          <p className="text-[10px] font-medium leading-relaxed italic opacity-80">"{p.rationale}"</p>
                          <div className="pt-2 flex justify-between items-center"><p className="text-[9px] font-black uppercase text-stone-700">Suggested Order:</p><p className="text-sm font-black">{p.suggestedOrder} Units</p></div>
                       </div>
                    ))}
                 </div>
                 <button onClick={() => setForecastResults(null)} className="w-full mt-8 py-4 bg-stone-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Acknowledge</button>
              </div>
           )}

           {priceSuggestions.length > 0 && (
              <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-right-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-coins text-7xl text-amber-500"></i></div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest mb-2 text-amber-500 italic">Yield Alpha Suggestions</h4>
                 <h3 className="text-2xl font-serif font-black italic tracking-tighter mb-6 leading-none text-white">Dynamic Pricing Audit</h3>
                 
                 <div className="space-y-4">
                    {priceSuggestions.map((s, i) => (
                       <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3 hover:bg-white/10 transition-colors">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="text-xs font-black text-amber-400">{s.itemName}</p>
                                <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border mt-1 inline-block ${s.reasonType === 'Scarcity' ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-blue-500/20 border-blue-500/40 text-blue-300'}`}>{s.reasonType}</span>
                             </div>
                             <div className="text-right">
                                <p className="text-[8px] font-black text-stone-500 uppercase">New Target</p>
                                <p className="text-sm font-black text-emerald-400">${s.suggestedPrice}</p>
                             </div>
                          </div>
                          <p className="text-[10px] font-medium leading-relaxed italic text-stone-400">"{s.rationale}"</p>
                          <button 
                            onClick={() => applyPrice(s)}
                            className="w-full py-2 bg-amber-500 text-stone-900 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all"
                          >
                            Commit New Price
                          </button>
                       </div>
                    ))}
                 </div>
                 <button onClick={() => setPriceSuggestions([])} className="w-full mt-6 text-[9px] font-black uppercase text-stone-500 hover:text-stone-300 transition-colors">Dismiss Suggestions</button>
              </div>
           )}

           {selectedItem && (
             <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-right-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><i className={`fas ${calculateYield(selectedItem).icon} text-8xl`}></i></div>
                <div className="relative z-10">
                   <div className="flex justify-between items-start mb-6">
                      <div><span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 block">Yield IQ</span><h4 className="text-2xl font-serif font-bold italic leading-tight">{selectedItem.name}</h4></div>
                      <button onClick={() => setSelectedItem(null)} className="text-stone-600 hover:text-white"><i className="fas fa-times"></i></button>
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center"><p className="text-[9px] font-black uppercase text-stone-500 mb-1">Standard Pour</p><p className="text-xs font-bold text-amber-400">{calculateYield(selectedItem).pour}</p></div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center"><p className="text-[9px] font-black uppercase text-stone-500 mb-1">Yield (Proj)</p><p className="text-xs font-bold text-white">{calculateYield(selectedItem).count} Units</p></div>
                   </div>
                   <button className="w-full py-4 bg-amber-500 text-stone-900 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">Manual Ledger Adjustment</button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;

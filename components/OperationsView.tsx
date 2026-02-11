
import React, { useState, useEffect, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { INITIAL_SHIFTS, INITIAL_INVENTORY } from '../constants';
import { Table, StaffShift, ServiceOrder, InventoryItem, PaymentMethod, AppView, OrderItem, RetailTransaction, EquipmentStatus, SustainabilityReport, GuestJourney } from '../types';
import VisitorMenu from './VisitorMenu';

const INITIAL_TABLES: Table[] = [
  { id: 't1', number: '1', capacity: 2, status: 'Available', x: 1, y: 1 },
  { id: 't2', number: '2', capacity: 2, status: 'Available', x: 2, y: 1 },
  { id: 't3', number: '3', capacity: 4, status: 'Available', x: 1, y: 2 },
  { id: 't4', number: '4', capacity: 4, status: 'Available', x: 2, y: 2 },
  { id: 't5', number: '5', capacity: 6, status: 'Available', x: 3, y: 1 },
  { id: 't6', number: '6', capacity: 2, status: 'Available', x: 3, y: 2 },
  { id: 't7', number: 'V1', capacity: 4, status: 'Available', x: 1, y: 3, zoneId: 'VIP' },
  { id: 't8', number: 'V2', capacity: 4, status: 'Available', x: 2, y: 3, zoneId: 'VIP' },
];

const INITIAL_EQUIPMENT: EquipmentStatus[] = [
  { id: 'hvac-01', name: 'Main HVAC Unit', type: 'HVAC', healthScore: 92, status: 'Optimal', lastService: '2024-11-15', telemetry: { load: 45 } },
  { id: 'ref-01', name: 'Wine Cellar Cooler', type: 'Refrigeration', healthScore: 78, status: 'Warning', lastService: '2024-08-10', telemetry: { temp: 14.2, vibration: 'High' } },
  { id: 'bar-01', name: 'Draft System Node', type: 'Bar', healthScore: 98, status: 'Optimal', lastService: '2025-01-05', telemetry: { load: 12 } },
  { id: 'ref-02', name: 'Bar Back Chiller', type: 'Refrigeration', healthScore: 64, status: 'Critical', lastService: '2024-05-20', telemetry: { temp: 6.8, vibration: 'Normal' } },
];

const OperationsView: React.FC<{ setActiveView?: (view: AppView) => void }> = ({ setActiveView }) => {
  const [activeTab, setActiveTab] = useState<'floor' | 'ordering' | 'checkout' | 'facility'>('floor');
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('vinea_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [inventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('vinea_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('Credit Card');
  const [tipPercent, setTipPercent] = useState(20);
  const [isSettling, setIsSettling] = useState(false);
  const [showQRPortal, setShowQRPortal] = useState(false);
  const [showVisitorMenu, setShowVisitorMenu] = useState(false);
  const [isHighVelocity, setIsHighVelocity] = useState(false);
  
  const [isAuditing, setIsAuditing] = useState(false);
  const [staffingInsight, setStaffingInsight] = useState<any>(null);

  const [posCart, setPosCart] = useState<Record<string, number>>({});

  // Facility Health State
  const [equipment, setEquipment] = useState<EquipmentStatus[]>(INITIAL_EQUIPMENT);
  const [maintenanceBrief, setMaintenanceBrief] = useState<any>(null);
  const [isAnalyzingMaintenance, setIsAnalyzingMaintenance] = useState(false);
  const [sustainabilityReport, setSustainabilityReport] = useState<SustainabilityReport | null>(null);
  const [isAuditingSustainability, setIsAuditingSustainability] = useState(false);

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem('vinea_tables');
      if (saved) setTables(JSON.parse(saved));
      else setTables(INITIAL_TABLES);
      const savedOrders = localStorage.getItem('vinea_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const handleAuditLabor = async () => {
    setIsAuditing(true);
    try {
      const res = await geminiService.getStaffingInsights([], []);
      setStaffingInsight(res);
    } catch (e) { console.error(e); }
    finally { setIsAuditing(false); }
  };

  const handleMaintenanceAudit = async () => {
    setIsAnalyzingMaintenance(true);
    try {
      const brief = await geminiService.getFacilityMaintenanceBrief(equipment);
      setMaintenanceBrief(brief);
    } catch (e) { console.error(e); }
    finally { setIsAnalyzingMaintenance(false); }
  };

  const handleSustainabilityAudit = async () => {
    setIsAuditingSustainability(true);
    try {
      const report = await geminiService.getSustainabilityImpactAudit([]);
      setSustainabilityReport(report);
    } catch (e) { console.error(e); }
    finally { setIsAuditingSustainability(false); }
  };

  const getTableHistory = (tableNum: string) => orders.filter(o => o.tableNumber === tableNum);
  
  const calculateSubtotal = (tableNum: string): number => {
    return getTableHistory(tableNum).reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + (item.priceAtOrder * item.quantity), 0);
    }, 0);
  };

  const handlePlaceOrder = (items: OrderItem[], source: 'Staff' | 'Visitor' = 'Staff') => {
    if (!activeTable) return;
    const newOrder: ServiceOrder = { 
      id: `ORD-${Date.now()}`, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      tableNumber: activeTable.number, 
      serverName: source === 'Staff' ? 'Floor Ops' : 'Guest Portal', 
      items, 
      status: 'Pending', 
      priority: 'Normal', 
      source 
    };
    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    localStorage.setItem('vinea_orders', JSON.stringify(updatedOrders));
    const updatedTables = tables.map(t => t.id === activeTable.id ? { ...t, status: 'Occupied' as const } : t);
    setTables(updatedTables);
    localStorage.setItem('vinea_tables', JSON.stringify(updatedTables));
    setShowVisitorMenu(false);
    setActiveTab('floor');
    window.dispatchEvent(new Event('storage'));
  };

  const handlePOSOrder = () => {
    const items: OrderItem[] = Object.entries(posCart).map(([id, qty]) => {
      const inv = inventory.find(i => i.id === id)!;
      return { 
        id: `pos-${Date.now()}-${id}`, 
        name: inv.name, 
        quantity: qty as number, 
        status: 'Pending', 
        prepType: 'Pour', 
        priceAtOrder: inv.price, 
        style: inv.category 
      };
    });
    handlePlaceOrder(items, 'Staff');
    setPosCart({});
  };

  const handleFinalizeSettlement = async () => {
    if (!activeTable) return;
    setIsSettling(true);
    
    const subtotal = calculateSubtotal(activeTable.number);
    const tax = subtotal * 0.09;
    const gratuity = subtotal * (tipPercent / 100);
    const total = subtotal + tax + gratuity;

    const transaction: RetailTransaction = {
      id: `TX-${Date.now()}`,
      timestamp: new Date().toISOString(),
      tableNumber: activeTable.number,
      items: getTableHistory(activeTable.number).flatMap(o => o.items),
      subtotal,
      tax,
      gratuity,
      total,
      paymentMethod: selectedPayment
    };

    // Update Guest Journey Status to 'Completed'
    const savedJourneys = localStorage.getItem('vinea_journeys');
    if (savedJourneys && activeTable.occupantName) {
      const journeys: GuestJourney[] = JSON.parse(savedJourneys);
      // Try to find the journey by table number first, or matching name
      const updatedJourneys = journeys.map(j => {
        // If the table number matches and it was seated, or if the name matches the occupant name
        if ((j.tableNumber === activeTable.number && j.status === 'Seated') || 
            (activeTable.occupantName && activeTable.occupantName.includes(j.profile.name))) {
          return { ...j, status: 'Completed' as const };
        }
        return j;
      });
      localStorage.setItem('vinea_journeys', JSON.stringify(updatedJourneys));
    }

    const updatedOrders = orders.filter(o => o.tableNumber !== activeTable.number);
    setOrders(updatedOrders);
    localStorage.setItem('vinea_orders', JSON.stringify(updatedOrders));

    const updatedTables = tables.map(t => t.id === activeTable.id ? { ...t, status: 'Available' as const, occupantName: undefined } : t);
    setTables(updatedTables);
    localStorage.setItem('vinea_tables', JSON.stringify(updatedTables));

    const savedTx = JSON.parse(localStorage.getItem('vinea_transactions') || '[]');
    localStorage.setItem('vinea_transactions', JSON.stringify([...savedTx, transaction]));

    setTimeout(() => {
      setIsSettling(false);
      setActiveTable(null);
      setActiveTab('floor');
      window.dispatchEvent(new Event('storage'));
    }, 1000);
  };

  const subtotalValue: number = activeTable ? calculateSubtotal(activeTable.number) : 0;
  const taxValue: number = subtotalValue * 0.09;
  const gratuityValue: number = subtotalValue * (tipPercent / 100);
  const totalValue: number = subtotalValue + taxValue + gratuityValue;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {showVisitorMenu && activeTable && (
        <VisitorMenu 
          table={activeTable} 
          inventory={inventory} 
          onPlaceOrder={(items) => handlePlaceOrder(items, 'Visitor')} 
          activeOrders={getTableHistory(activeTable.number)} 
          onExit={() => setShowVisitorMenu(false)} 
        />
      )}
      
      {showQRPortal && activeTable && (
        <div className="fixed inset-0 z-[600] bg-stone-950/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-sm rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 shadow-2xl border border-stone-200">
              <h3 className="text-2xl font-serif font-black italic">Table {activeTable.number} Portal</h3>
              <div className="w-48 h-48 bg-stone-50 border-8 border-stone-100 rounded-3xl p-4 flex items-center justify-center shadow-inner">
                <i className="fas fa-qrcode text-8xl text-stone-900 opacity-80"></i>
              </div>
              <button 
                onClick={() => { setShowQRPortal(false); setShowVisitorMenu(true); }} 
                className="w-full py-4 bg-amber-500 text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95"
              >
                Launch Guest Experience
              </button>
              <button onClick={() => setShowQRPortal(false)} className="text-[10px] font-black uppercase text-stone-400">Cancel</button>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-stone-200 mb-6 shrink-0">
        <div className="flex gap-8 overflow-x-auto custom-scrollbar whitespace-nowrap">
           <button onClick={() => setActiveTab('floor')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2 ${activeTab === 'floor' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Floor Map</button>
           <button disabled={!activeTable} onClick={() => setActiveTab('ordering')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2 disabled:opacity-30 ${activeTab === 'ordering' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>POS Terminal {activeTable && `(T${activeTable.number})`}</button>
           <button disabled={!activeTable || subtotalValue === 0} onClick={() => setActiveTab('checkout')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2 disabled:opacity-30 ${activeTab === 'checkout' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Settlement</button>
           <button onClick={() => setActiveTab('facility')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2 ${activeTab === 'facility' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Facility Health</button>
        </div>
        <div className="pb-4 hidden lg:flex items-center gap-3">
           <button 
             onClick={() => setIsHighVelocity(!isHighVelocity)} 
             className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${isHighVelocity ? 'bg-rose-500 text-white border-rose-600 shadow-lg animate-pulse' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
           >
              <i className={`fas fa-tachometer-alt mr-2 ${isHighVelocity ? 'text-white' : 'text-rose-500'}`}></i>
              High Velocity Mode
           </button>
           <button onClick={handleAuditLabor} disabled={isAuditing} className="px-5 py-1.5 bg-stone-100 text-stone-500 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all border border-stone-200">
             {isAuditing ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-chart-pie mr-2 text-blue-500"></i>}
             Labor Audit
           </button>
           {activeTable && (
             <button onClick={() => setShowQRPortal(true)} className="text-[10px] font-black text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-200 hover:bg-amber-100 transition-all uppercase tracking-widest">
               <i className="fas fa-qrcode mr-2"></i> Guest Menu
             </button>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'floor' && (
          <div className="h-full bg-stone-50 rounded-[3rem] border border-stone-200 shadow-inner p-8 overflow-auto custom-scrollbar flex flex-col items-center">
             <div className={`grid gap-8 max-w-6xl pt-10 transition-all ${isHighVelocity ? 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8' : 'grid-cols-2 md:grid-cols-4'}`}>
                {tables.map(table => {
                  const isOccupied = table.status === 'Occupied';
                  const size = isHighVelocity ? 'w-24 h-24' : 'w-36 h-36';
                  return (
                    <button 
                      key={table.id} 
                      onClick={() => { setActiveTable(table); setActiveTab(isOccupied ? 'checkout' : 'ordering'); }} 
                      className={`group ${size} rounded-[2.5rem] border-4 transition-all flex flex-col items-center justify-center gap-1 shadow-lg relative overflow-hidden ${isOccupied ? 'bg-white border-amber-500 scale-105 shadow-amber-200' : 'bg-white border-stone-200 hover:border-amber-300'}`}
                    >
                      <span className={`${isHighVelocity ? 'text-base' : 'text-2xl'} font-serif font-black text-stone-900`}>T{table.number}</span>
                      {!isHighVelocity && (
                        <div className="space-y-1 text-center">
                          <span className={`text-[8px] font-black uppercase block ${isOccupied ? 'text-amber-600' : 'text-stone-400'}`}>{table.status}</span>
                          {isOccupied && table.occupantName && (
                            <span className="text-[9px] font-bold text-stone-500 italic truncate max-w-[100px] block border-t border-stone-100 pt-1">
                              {table.occupantName}
                            </span>
                          )}
                        </div>
                      )}
                      {isOccupied && <div className={`absolute top-2 right-2 ${isHighVelocity ? 'w-4 h-4 text-[7px]' : 'w-6 h-6 text-[10px]'} bg-amber-500 text-stone-900 rounded-full flex items-center justify-center border-2 border-white font-black animate-bounce shadow-md`}><i className="fas fa-receipt"></i></div>}
                    </button>
                  );
                })}
             </div>
             {isHighVelocity && (
               <div className="mt-12 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-[10px] font-black uppercase tracking-widest animate-in fade-in">
                  Simplified Interface Active: Priority on table turnover and rapid fire.
               </div>
             )}
          </div>
        )}

        {activeTab === 'facility' && (
          <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
             <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-2/3 space-y-6 overflow-y-auto custom-scrollbar pr-2 max-h-[600px]">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-6">
                      <div className="flex justify-between items-center">
                         <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 italic">Core Asset Monitoring</h3>
                         <button onClick={handleMaintenanceAudit} disabled={isAnalyzingMaintenance} className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                            {isAnalyzingMaintenance ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-microchip text-amber-500"></i>}
                            Predictive Audit
                         </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {equipment.map(item => (
                           <div key={item.id} className="p-6 bg-stone-50 border border-stone-100 rounded-3xl space-y-4 hover:border-amber-500 transition-all group">
                              <div className="flex justify-between items-start">
                                 <div>
                                    <p className="text-xs font-black text-stone-900 group-hover:text-amber-600 transition-colors">{item.name}</p>
                                    <p className="text-[9px] font-black text-stone-400 uppercase tracking-tighter">{item.type}</p>
                                 </div>
                                 <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                   item.status === 'Optimal' ? 'bg-emerald-50 text-emerald-600' : item.status === 'Warning' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                 }`}>{item.status}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <div className="flex-1 mr-4">
                                    <div className="flex justify-between text-[8px] font-black text-stone-400 uppercase mb-1"><span>Health Index</span><span>{item.healthScore}%</span></div>
                                    <div className="h-1 w-full bg-stone-200 rounded-full overflow-hidden">
                                       <div className={`h-full transition-all duration-1000 ${item.healthScore > 80 ? 'bg-emerald-500' : item.healthScore > 60 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${item.healthScore}%` }}></div>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[8px] font-black text-stone-400 uppercase">Last Sync</p>
                                    <p className="text-[10px] font-bold text-stone-600">{item.lastService}</p>
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm space-y-6">
                      <div className="flex justify-between items-center">
                         <h3 className="text-sm font-black uppercase tracking-widest text-stone-400 italic">Sustainability Pulse</h3>
                         <button onClick={handleSustainabilityAudit} disabled={isAuditingSustainability} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                            {isAuditingSustainability ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-leaf"></i>}
                            Run Impact Audit
                         </button>
                      </div>
                      {sustainabilityReport ? (
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-bottom-2">
                            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center space-y-1">
                               <p className="text-3xl font-black text-emerald-600">{sustainabilityReport.wasteReductionPct}%</p>
                               <p className="text-[8px] font-black uppercase text-emerald-700 tracking-widest">Spoilage Reduction</p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center space-y-1">
                               <p className="text-3xl font-black text-blue-600">${sustainabilityReport.fiscalSavings.toLocaleString()}</p>
                               <p className="text-[8px] font-black uppercase text-blue-700 tracking-widest">Projected Savings</p>
                            </div>
                            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-center space-y-1">
                               <p className="text-3xl font-black text-amber-600">8.2k</p>
                               <p className="text-[8px] font-black uppercase text-amber-700 tracking-widest">Co2 Offset (kg)</p>
                            </div>
                         </div>
                      ) : (
                         <div className="h-32 flex items-center justify-center bg-stone-50 rounded-3xl border border-dashed border-stone-200 opacity-40">
                            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Awaiting Impact Synthesis...</p>
                         </div>
                      )}
                   </div>
                </div>

                <div className="lg:w-1/3 space-y-6">
                   {maintenanceBrief && (
                      <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-right-4 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-shield-virus text-8xl text-amber-500"></i></div>
                         <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 italic">Predictive Analysis</h4>
                         <p className="text-sm font-bold leading-relaxed italic mb-8">"{maintenanceBrief.riskSummary}"</p>
                         <div className="space-y-4">
                            {maintenanceBrief.alerts.map((alert: any, i: number) => (
                               <div key={i} className={`p-5 rounded-2xl border flex items-start gap-4 ${
                                 alert.priority === 'High' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                               }`}>
                                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                     <i className={`fas ${alert.priority === 'High' ? 'fa-triangle-exclamation' : 'fa-clock'} text-xs`}></i>
                                  </div>
                                  <div>
                                     <p className="text-xs font-black uppercase">{alert.prediction}</p>
                                     <p className="text-[10px] opacity-70 mt-1">Silo Failure Projection: {alert.timeToFailure}</p>
                                  </div>
                               </div>
                            ))}
                         </div>
                         <button onClick={() => setMaintenanceBrief(null)} className="w-full mt-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-white transition-all">Acknowledge</button>
                      </div>
                   )}

                   {sustainabilityReport && (
                      <div className="bg-emerald-950 text-white p-8 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-right-4 border border-emerald-800/30">
                         <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-6 italic">Eco-Efficiency Roadmap</h4>
                         <div className="space-y-4">
                            {sustainabilityReport.aiActionPlan.map((step, i) => (
                               <div key={i} className="flex gap-4 group">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-800 flex items-center justify-center text-[10px] font-black text-emerald-400 group-hover:bg-emerald-400 group-hover:text-emerald-950 transition-all shrink-0">{i+1}</div>
                                  <p className="text-xs font-medium leading-relaxed opacity-80">{step}</p>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                   
                   {!maintenanceBrief && !sustainabilityReport && (
                      <div className="p-8 bg-stone-100 rounded-[2.5rem] border border-stone-200 flex flex-col items-center justify-center text-center space-y-4 opacity-40 grayscale h-[300px]">
                         <i className="fas fa-solar-panel text-5xl text-stone-300"></i>
                         <p className="text-xs font-black uppercase tracking-widest text-stone-400">Launch Diagnostics to retrieve operational telemetry.</p>
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'floor' && staffingInsight && (
          <div className="absolute top-4 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-500">
             <div className="bg-stone-900 text-white p-6 rounded-3xl shadow-2xl border border-white/5 flex items-center justify-between">
                <div className="flex gap-6 items-center">
                   <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20"><i className="fas fa-chart-line"></i></div>
                   <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Efficiency Alpha Audit</p>
                      <p className="text-sm font-bold text-stone-200">Recommended Floor Coverage Adjustment: <span className="text-amber-500">+1 Sommelier for Peak</span></p>
                   </div>
                </div>
                <button onClick={() => setStaffingInsight(null)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-stone-500 transition-all"><i className="fas fa-times"></i></button>
             </div>
          </div>
        )}

        {activeTab === 'ordering' && activeTable && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
             <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 gap-3 custom-scrollbar">
                   {inventory.map(item => (
                     <button 
                        key={item.id} 
                        onClick={() => setPosCart(prev => ({...prev, [item.id]: (prev[item.id] || 0) + 1}))} 
                        className="p-4 bg-stone-50 border border-stone-100 rounded-2xl text-left hover:border-amber-500 transition-all group active:scale-95"
                     >
                        <p className="text-xs font-bold text-stone-800">{item.name}</p>
                        <p className="text-[9px] font-black text-stone-400 uppercase mt-1">${item.price}</p>
                     </button>
                   ))}
                </div>
             </div>
             <div className="lg:col-span-4 bg-stone-900 rounded-[2.5rem] p-8 flex flex-col shadow-2xl">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-6 italic">Round Staging: T{activeTable.number}</h4>
                <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 text-white">
                   {Object.entries(posCart).map(([id, qty]) => {
                     const item = inventory.find(i => i.id === id)!;
                     return (
                       <div key={id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 animate-in slide-in-from-right-4">
                          <div>
                            <p className="text-xs font-bold">{item.name}</p>
                            <p className="text-[10px] text-amber-500 font-bold uppercase">x{qty} • ${(item.price * (qty as number)).toFixed(2)}</p>
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => setPosCart(prev => {const next={...prev}; if(next[id]>1) next[id]--; else delete next[id]; return next;})} 
                              className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-rose-500 transition-all"
                            >
                              <i className="fas fa-minus text-[8px]"></i>
                            </button>
                            <button 
                              onClick={() => setPosCart(prev => ({...prev, [id]: (prev[id] || 0) + 1}))} 
                              className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-all"
                            >
                              <i className="fas fa-plus text-[8px]"></i>
                            </button>
                          </div>
                       </div>
                     );
                   })}
                   {Object.keys(posCart).length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center opacity-20 text-center py-10">
                       <i className="fas fa-shaker text-4xl mb-4"></i>
                       <p className="text-[10px] font-black uppercase tracking-widest">Cart Disengaged</p>
                     </div>
                   )}
                </div>
                <button 
                  disabled={Object.keys(posCart).length === 0} 
                  onClick={handlePOSOrder} 
                  className="w-full py-5 bg-amber-500 text-stone-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all mt-6 shadow-xl active:scale-95 disabled:opacity-30"
                >
                  Fire Floor Round
                </button>
             </div>
          </div>
        )}

        {activeTab === 'checkout' && activeTable && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden flex flex-col h-full">
                   <div className="p-10 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                      <div>
                        <h3 className="text-3xl font-serif font-black italic text-stone-900">Settlement Brief</h3>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">Table {activeTable.number} • Audit Log</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-stone-500">Fired: {getTableHistory(activeTable.number).length} Rounds</p>
                        <p className="text-xs font-bold text-stone-500">Items: {getTableHistory(activeTable.number).reduce((acc, o) => acc + o.items.length, 0)} Units</p>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                      {getTableHistory(activeTable.number).map(order => (
                        <div key={order.id} className="space-y-4">
                           <div className="flex items-center gap-4 text-stone-300">
                              <span className="text-[10px] font-black uppercase tracking-[0.4em] whitespace-nowrap">Round @ {order.timestamp}</span>
                              <div className="h-[1px] w-full bg-stone-100"></div>
                           </div>
                           <div className="space-y-2 pl-4">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center group">
                                   <div className="flex items-center gap-4">
                                      <span className="w-8 h-8 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center text-xs font-black text-stone-400 group-hover:text-stone-900 transition-colors">{item.quantity}x</span>
                                      <span className="text-sm font-bold text-stone-700">{item.name}</span>
                                   </div>
                                   <span className="text-sm font-serif font-bold text-stone-400">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="bg-stone-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col relative overflow-hidden shrink-0">
                   <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><i className="fas fa-receipt text-9xl"></i></div>
                   <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-8 italic">Payment Synthesis</h4>
                   
                   <div className="space-y-4 mb-10">
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                         <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Subtotal (Retail)</span>
                         <span className="text-xl font-bold text-white">${subtotalValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                         <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Synthesis Tax (9%)</span>
                         <span className="text-xl font-bold text-white">${taxValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-white/5 pb-2">
                         <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Gratuity Strategy ({tipPercent}%)</span>
                         <span className="text-xl font-bold text-amber-500">${gratuityValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-baseline pt-4">
                         <span className="text-[11px] font-black text-stone-300 uppercase tracking-[0.5em]">Total Settlement</span>
                         <span className="text-5xl font-serif font-black italic text-white tracking-tighter">${totalValue.toFixed(2)}</span>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-2">
                        {[18, 20, 22].map(p => (
                          <button 
                            key={p} 
                            onClick={() => setTipPercent(p)}
                            className={`py-3 rounded-xl text-[10px] font-black transition-all border ${tipPercent === p ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-lg' : 'bg-white/5 border-white/10 text-stone-500 hover:border-white/20'}`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {(['Credit Card', 'Cash', 'Apple Pay', 'Debit Card'] as PaymentMethod[]).map(method => (
                          <button 
                            key={method} 
                            onClick={() => setSelectedPayment(method)}
                            className={`py-4 rounded-2xl flex items-center justify-center gap-3 transition-all border ${selectedPayment === method ? 'bg-white text-stone-900 border-white shadow-xl' : 'bg-white/5 border-white/10 text-stone-500 hover:bg-white/10'}`}
                          >
                             <i className={`fas ${
                               method === 'Credit Card' ? 'fa-credit-card' : 
                               method === 'Cash' ? 'fa-money-bill-wave' : 
                               method === 'Apple Pay' ? 'fab fa-apple' : 
                               'fa-id-card-clip'
                             } text-sm`}></i>
                             <span className="text-[10px] font-black uppercase tracking-widest">{method}</span>
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={handleFinalizeSettlement}
                        disabled={isSettling}
                        className="w-full py-6 bg-amber-500 text-stone-900 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-[0_20px_50px_rgba(245,158,11,0.2)] hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50"
                      >
                         {isSettling ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-double"></i>}
                         {isSettling ? 'Synthesizing...' : 'Finalize Settlement'}
                      </button>
                   </div>
                </div>
                
                <div className="p-6 bg-stone-100 border border-stone-200 rounded-[2.5rem] flex gap-5 items-center">
                   <div className="w-12 h-12 bg-white rounded-2xl border border-stone-200 flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                      <i className="fas fa-robot"></i>
                   </div>
                   <p className="text-[10px] text-stone-500 font-bold leading-relaxed italic">
                      "Settlement terminates the active table session and archives transaction data for yield analytics. A digital receipt has been dispatched to the guest portal."
                   </p>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsView;

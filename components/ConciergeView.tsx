
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { geminiService } from '../services/geminiService';
import { supabaseSync, getSupabaseConfig } from '../services/supabaseClient';
import { GuestJourney, GuestProfile, Table, InventoryItem, MarketingCampaign } from '../types';
import GuestReservationPortal from './GuestReservationPortal';

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

const MOCK_JOURNEYS: GuestJourney[] = [
  {
    id: 'j-1',
    arrivalTime: '19:00',
    status: 'Confirmed',
    tableNumber: '??',
    profile: {
      name: 'Alexander Mercer',
      location: 'New York, US',
      favoriteBeverages: 'Peated Scotch, Old World Reds',
      dietaryRestrictions: 'None',
      pastOrders: 'Laphroaig 10, Barolo 2016',
      pairingStyle: 'Classic'
    },
    specialOccasion: 'Business Dinner',
    pacingMode: 'Standard'
  },
  {
    id: 'j-2',
    arrivalTime: '20:30',
    status: 'Arrived',
    tableNumber: '??',
    profile: {
      name: 'Elena Rossi',
      location: 'Milan, IT',
      favoriteBeverages: 'Negroni, Franciacorta',
      dietaryRestrictions: 'Gluten-Free',
      pastOrders: 'Negroni Sbagliato, Risotto (GF)',
      pairingStyle: 'Adventurous'
    },
    specialOccasion: 'Birthday',
    pacingMode: 'Leisurely'
  }
];

const FacialIDScanner: React.FC<{ onRecognized: (name: string) => void, onClose: () => void }> = ({ onRecognized, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'calibrating' | 'scanning' | 'matched' | 'error'>('calibrating');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('scanning');
      } catch (err) {
        setStatus('error');
      }
    };
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (status === 'scanning') {
      const timer = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(timer);
            setStatus('matched');
            setTimeout(() => onRecognized("Julianne Moore"), 1500);
            return 100;
          }
          return p + 2;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-[700] bg-stone-950 flex flex-col items-center justify-center p-6 backdrop-blur-3xl animate-in fade-in">
       <div className="relative w-full max-w-lg aspect-square bg-black rounded-[4rem] overflow-hidden border-4 border-amber-500/20 shadow-[0_0_100px_rgba(245,158,11,0.2)]">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60 grayscale scale-110" />
          <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-amber-500/50 rounded-full animate-pulse"></div>
             <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 shadow-[0_0_20px_#f59e0b] animate-scan-line" style={{ top: `${progress}%` }}></div>
             <div className="absolute top-10 left-10 text-[9px] font-black uppercase text-amber-500/80 space-y-1">
                <p>Biometric Matrix: Active</p>
                <p>Probability: {(85 + progress/10).toFixed(1)}%</p>
             </div>
          </div>
          <div className="absolute bottom-12 left-0 right-0 px-10 flex flex-col items-center gap-6">
             {status === 'matched' ? (
               <div className="bg-emerald-500 text-stone-950 px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest animate-in zoom-in shadow-xl">
                 Identity Verified: Julianne Moore
               </div>
             ) : (
               <div className="bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-white">
                 Facial Recognition Protocol... {progress}%
               </div>
             )}
             <button onClick={onClose} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-all">
                <i className="fas fa-times"></i>
             </button>
          </div>
       </div>
    </div>
  );
};

const ConciergeView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'arrivals' | 'campaigns'>('arrivals');
  const [journeys, setJourneys] = useState<GuestJourney[]>(() => {
    const saved = localStorage.getItem('vinea_journeys');
    return saved ? JSON.parse(saved) : MOCK_JOURNEYS;
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [engagement, setEngagement] = useState<any>(null);
  const [serviceBrief, setServiceBrief] = useState<string | null>(null);
  const [pacingRecs, setPacingRecs] = useState<string[]>([]);
  const [outreach, setOutreach] = useState<any>(null);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [showPublicPortal, setShowPublicPortal] = useState(false);
  const [showFacialScanner, setShowFacialScanner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Advanced Seating State
  const [isSeating, setIsSeating] = useState(false);
  const [selectedTableForSeating, setSelectedTableForSeating] = useState<Table | null>(null);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [isRobotEscorting, setIsRobotEscorting] = useState(false);

  // Marketing State
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [isSynthesizingCampaign, setIsSynthesizingCampaign] = useState(false);
  const [targetPalateTag, setTargetPalateTag] = useState('Peated Malt Enthusiasts');

  const inventory: InventoryItem[] = JSON.parse(localStorage.getItem('vinea_inventory') || '[]');
  const activeJourney = journeys.find(j => j.id === selectedId);
  const isProduction = !!getSupabaseConfig();

  const handleSync = async () => {
    setIsRefreshing(true);
    
    // Fallback for tables to ensure map is never blank
    const savedTables = localStorage.getItem('vinea_tables');
    const tableData = savedTables ? JSON.parse(savedTables) : INITIAL_TABLES;
    setTables(tableData);
    if (!savedTables) localStorage.setItem('vinea_tables', JSON.stringify(INITIAL_TABLES));

    if (isProduction) {
      const cloudJourneys = await supabaseSync.pullJourneys();
      if (cloudJourneys) {
        setJourneys(cloudJourneys);
        localStorage.setItem('vinea_journeys', JSON.stringify(cloudJourneys));
      }
    } else {
      const saved = localStorage.getItem('vinea_journeys');
      if (saved) setJourneys(JSON.parse(saved));
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    handleSync();
    window.addEventListener('storage', handleSync);
    if (!selectedId && journeys.length > 0) setSelectedId(journeys[0].id);
    return () => window.removeEventListener('storage', handleSync);
  }, [selectedId]);

  const generateAIToolkit = async () => {
    if (!activeJourney) return;
    setIsGenerating(true);
    setEngagement(null);
    setOutreach(null);
    setAutoTags([]);
    
    try {
      const [engResult, briefResult, pacingResult, outreachResult, tagsResult] = await Promise.all([
        geminiService.generateGuestEngagement(activeJourney.profile, {}),
        geminiService.generateServiceBrief(activeJourney.profile),
        geminiService.getServicePacingRecommendations(activeJourney.profile, activeJourney.pacingMode || 'Standard'),
        geminiService.getPreArrivalOutreach(activeJourney.profile, inventory),
        geminiService.analyzeGuestTags(activeJourney.profile, activeJourney.specialOccasion || '')
      ]);
      
      setEngagement(engResult); 
      setServiceBrief(briefResult || null);
      setPacingRecs(pacingResult.recommendations || []);
      setOutreach(outreachResult);
      setAutoTags(tagsResult);
    } catch (error) { console.error(error); }
    finally { setIsGenerating(false); }
  };

  const handleArrivalUpdate = (id: string, status: GuestJourney['status']) => {
    const updated = journeys.map(j => j.id === id ? { ...j, status } : j);
    setJourneys(updated);
    localStorage.setItem('vinea_journeys', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
  };

  const handleFinalSeatGuest = () => {
    if (!activeJourney || !selectedTableForSeating || selectedSeatIndex === null) return;
    
    setIsRobotEscorting(true);
    
    setTimeout(() => {
      const updatedJourneys = journeys.map(j => j.id === activeJourney.id ? { ...j, status: 'Seated' as const, tableNumber: selectedTableForSeating.number } : j);
      setJourneys(updatedJourneys);
      localStorage.setItem('vinea_journeys', JSON.stringify(updatedJourneys));

      const updatedTables = tables.map(t => t.id === selectedTableForSeating.id ? { ...t, status: 'Occupied' as const, occupantName: `${activeJourney.profile.name} (Seat ${selectedSeatIndex + 1})` } : t);
      setTables(updatedTables);
      localStorage.setItem('vinea_tables', JSON.stringify(updatedTables));

      setIsSeating(false);
      setSelectedTableForSeating(null);
      setSelectedSeatIndex(null);
      setIsRobotEscorting(false);
      window.dispatchEvent(new Event('storage'));
    }, 2500);
  };

  const synthesizeCampaign = async () => {
    setIsSynthesizingCampaign(true);
    try {
      const result = await geminiService.getPalateMarketingCampaign({ tag: targetPalateTag }, inventory);
      const newCampaign: MarketingCampaign = {
        id: `camp-${Date.now()}`,
        title: result.title,
        targetCluster: result.targetCluster,
        reach: Math.floor(Math.random() * 450) + 50,
        subject: result.subject,
        body: result.body,
        offerItem: result.offerItem,
        status: 'Draft'
      };
      setCampaigns([newCampaign, ...campaigns]);
    } catch (e) { console.error(e); }
    finally { setIsSynthesizingCampaign(false); }
  };

  // Fix: Added useMemo hook to the list of imports from React at the top of the file
  const sortedJourneys = useMemo(() => {
    const statusPriority = { 'Arrived': 0, 'Seated': 1, 'Confirmed': 2, 'Engagement Sent': 3, 'Completed': 4 };
    return [...journeys].sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
  }, [journeys]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-hidden pb-10">
      {showFacialScanner && <FacialIDScanner onRecognized={(n) => { setShowFacialScanner(false); handleArrivalUpdate(selectedId!, 'Arrived'); }} onClose={() => setShowFacialScanner(false)} />}
      
      {isRobotEscorting && (
        <div className="fixed inset-0 z-[800] bg-stone-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in">
           <div className="relative w-64 h-64 mb-10">
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-4 border-2 border-amber-500/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                 <i className="fas fa-robot text-5xl text-amber-500 animate-bounce"></i>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">BeeBot-Escort</p>
              </div>
           </div>
           <div className="text-center space-y-4 max-w-sm">
              <h3 className="text-2xl font-serif font-black text-white italic">Robot Escort Protocol</h3>
              <p className="text-stone-400 text-sm leading-relaxed italic">"Guiding {activeJourney?.profile.name} to Table {selectedTableForSeating?.number}, Seat {selectedSeatIndex! + 1}. Adjusting smart-room ambiance to 'Relaxed' preset."</p>
           </div>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-stone-200 mb-6 shrink-0">
        <div className="flex gap-8">
           <button onClick={() => setActiveTab('arrivals')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2 ${activeTab === 'arrivals' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Arrival Hub</button>
           <button onClick={() => setActiveTab('campaigns')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2 ${activeTab === 'campaigns' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>Marketing Engines</button>
        </div>
        <div className="pb-4 flex gap-2">
           <button onClick={() => setShowFacialScanner(true)} className="px-4 py-1.5 bg-amber-500 text-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg border border-amber-400"><i className="fas fa-face-viewfinder mr-2"></i> Facial Check-in</button>
           <button onClick={() => setShowPublicPortal(true)} className="px-4 py-1.5 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg border border-white/10"><i className="fas fa-link text-amber-500 mr-2"></i> Portal Link</button>
        </div>
      </div>

      {activeTab === 'arrivals' ? (
        <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden">
          <div className="lg:w-80 flex flex-col gap-4 min-h-0">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between shrink-0 px-1 mb-4">
                 <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 italic">Arrival Queue</h3>
                 <div className="flex items-center gap-2">
                    <button onClick={handleSync} className={`text-stone-300 hover:text-amber-500 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}><i className="fas fa-rotate text-xs"></i></button>
                    <span className="bg-stone-900 text-white px-2 py-0.5 rounded-full text-[9px] font-black">{journeys.length}</span>
                 </div>
              </div>
              <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                {sortedJourneys.map(journey => (
                  <button key={journey.id} onClick={() => { setSelectedId(journey.id); setSelectedTableForSeating(null); setSelectedSeatIndex(null); }} className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedId === journey.id ? 'bg-stone-900 border-stone-900 text-white shadow-lg' : 'bg-stone-50 border-stone-100 text-stone-800 hover:bg-white hover:border-amber-200'} ${journey.status === 'Completed' ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-between items-start mb-1"><span className="font-bold text-sm truncate pr-2">{journey.profile.name}</span><span className="text-[9px] font-black text-stone-400">{journey.arrivalTime}</span></div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                        journey.status === 'Arrived' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        journey.status === 'Seated' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        journey.status === 'Completed' ? 'bg-stone-800 text-stone-300 border-stone-700' :
                        'bg-stone-200 text-stone-500 border-stone-300'
                      }`}>{journey.status}</span>
                      <span className="text-[8px] font-black uppercase text-stone-400">{journey.pacingMode || 'Standard'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
            {activeJourney ? (
              <>
                <div className={`bg-stone-900 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden shrink-0 ${activeJourney.status === 'Completed' ? 'grayscale' : ''}`}>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <span className={`bg-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic ${activeJourney.status === 'Completed' ? 'bg-stone-600' : ''}`}>
                            {activeJourney.status === 'Completed' ? 'Journey Archived' : 'VIP Synthesis'}
                          </span>
                          <span className="text-[10px] font-black uppercase border border-white/20 text-stone-400 px-3 py-1 rounded-full">{activeJourney.pacingMode || 'Standard'} PACE</span>
                       </div>
                       <h2 className="text-4xl md:text-6xl font-serif font-black italic tracking-tighter">{activeJourney.profile.name}</h2>
                       {activeJourney.status === 'Completed' && (
                         <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-widest">
                            <i className="fas fa-check-circle text-emerald-500"></i>
                            Guest has settled and departed.
                         </div>
                       )}
                    </div>
                    <div className="flex gap-3">
                       {activeJourney.status === 'Confirmed' && (
                         <button onClick={() => handleArrivalUpdate(activeJourney.id, 'Arrived')} className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all shadow-xl active:scale-95">Mark Arrived</button>
                       )}
                       {activeJourney.status === 'Arrived' && (
                         <button onClick={() => setIsSeating(true)} className="px-10 py-5 bg-amber-500 text-stone-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all shadow-xl active:scale-95 flex items-center gap-3"><i className="fas fa-chair"></i> Initialize Seating</button>
                       )}
                       {activeJourney.status === 'Completed' && (
                         <button className="px-8 py-4 bg-white/5 border border-white/10 text-stone-400 rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-default">Archive Access Restricted</button>
                       )}
                    </div>
                  </div>
                </div>

                {isSeating ? (
                  <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-2xl animate-in slide-in-from-bottom-4">
                     {!selectedTableForSeating ? (
                       <div className="space-y-10">
                          <div className="flex justify-between items-end">
                             <div>
                                <h3 className="text-3xl font-serif font-bold text-stone-900 italic">Facility Architecture</h3>
                                <p className="text-xs text-stone-500 mt-1 uppercase font-black tracking-widest">Select physical node for table deployment</p>
                             </div>
                             <div className="flex gap-4">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-stone-100 border border-stone-200 rounded-md"></div><span className="text-[9px] font-black uppercase text-stone-400">Available</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-100 border border-rose-200 rounded-md"></div><span className="text-[9px] font-black uppercase text-stone-400">Occupied</span></div>
                             </div>
                          </div>
                          
                          {/* Visual Floor Layout Simulation */}
                          <div className="bg-stone-50 rounded-[2.5rem] border border-stone-100 p-12 aspect-[16/9] relative shadow-inner overflow-hidden min-h-[400px]">
                             {tables.length === 0 ? (
                               <div className="flex items-center justify-center h-full">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Retrieving Floor Data...</p>
                               </div>
                             ) : (
                               tables.map(table => {
                                 const isOccupied = table.status === 'Occupied';
                                 return (
                                   <button 
                                     key={table.id}
                                     disabled={isOccupied}
                                     onClick={() => setSelectedTableForSeating(table)}
                                     style={{ left: `${(table.x * 25)}%`, top: `${(table.y * 25)}%` }}
                                     className={`absolute -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-[2rem] border-4 transition-all flex flex-col items-center justify-center gap-1 ${
                                       isOccupied ? 'bg-rose-50 border-rose-200 opacity-40 grayscale cursor-not-allowed' : 'bg-white border-stone-200 hover:border-amber-500 hover:scale-110 shadow-lg'
                                     }`}
                                   >
                                      <span className="text-2xl font-serif font-black text-stone-800">T{table.number}</span>
                                      <span className="text-[8px] font-black uppercase text-stone-400">{table.capacity} Positions</span>
                                   </button>
                                 );
                               })
                             )}
                             {/* Floor Annotations */}
                             <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-stone-900/5 rounded-full text-[8px] font-black text-stone-300 uppercase tracking-widest italic">Main Dining Deck</div>
                             <div className="absolute bottom-4 right-8 text-[8px] font-black text-stone-300 uppercase tracking-widest border border-stone-200 px-3 py-1 rounded-lg italic">Bar Silo A</div>
                          </div>
                       </div>
                     ) : (
                       <div className="space-y-12 animate-in fade-in duration-500">
                          <div className="flex justify-between items-center">
                             <button onClick={() => setSelectedTableForSeating(null)} className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 flex items-center gap-2"><i className="fas fa-arrow-left"></i> Change Table</button>
                             <div className="text-center">
                                <h3 className="text-4xl font-serif font-black text-stone-900 italic">Anchor Position</h3>
                                <p className="text-xs text-amber-600 font-black uppercase tracking-widest mt-1">Refining Hyper-Personalized Node for Table {selectedTableForSeating.number}</p>
                             </div>
                             <div className="w-20"></div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
                             <div className="relative w-72 h-72 bg-stone-100 rounded-[4rem] border-4 border-stone-200 flex items-center justify-center shadow-inner">
                                <div className="text-center space-y-1">
                                   <p className="text-2xl font-serif font-black text-stone-800">T{selectedTableForSeating.number}</p>
                                   <p className="text-[9px] font-black text-stone-400 uppercase">Interactive Core</p>
                                </div>
                                {/* Circular Seat Placement */}
                                {[...Array(selectedTableForSeating.capacity)].map((_, i) => {
                                  const angle = (i * 360) / selectedTableForSeating.capacity;
                                  const rad = (angle * Math.PI) / 180;
                                  const x = Math.cos(rad) * 110;
                                  const y = Math.sin(rad) * 110;
                                  return (
                                    <button 
                                      key={i}
                                      onClick={() => setSelectedSeatIndex(i)}
                                      style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
                                      className={`absolute w-16 h-16 rounded-2xl border-4 transition-all flex items-center justify-center font-black text-sm shadow-xl active:scale-90 ${
                                        selectedSeatIndex === i ? 'bg-amber-500 border-amber-400 text-stone-900 scale-110' : 'bg-white border-stone-100 text-stone-300 hover:border-amber-200'
                                      }`}
                                    >
                                       {i + 1}
                                    </button>
                                  );
                                })}
                             </div>

                             <div className="flex-1 space-y-6 max-w-sm">
                                <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
                                   <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-brain text-5xl"></i></div>
                                   <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest italic border-b border-white/10 pb-4">AI Anchor Insight</h4>
                                   <p className="text-sm font-bold leading-relaxed italic">
                                      {selectedSeatIndex === null 
                                        ? "Select a physical anchor point to finalize the guest journey deployment." 
                                        : `Position ${selectedSeatIndex + 1} provides optimal line-of-sight for technical service. Calibrating smart-room preset: 'Warm-Candelight' (User Preference: ${activeJourney.profile.pairingStyle}).`}
                                   </p>
                                </div>
                                <button 
                                  disabled={selectedSeatIndex === null}
                                  onClick={handleFinalSeatGuest}
                                  className="w-full py-6 bg-stone-900 text-white rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
                                >
                                   Finalize Architecture
                                </button>
                             </div>
                          </div>
                       </div>
                     )}
                  </div>
                ) : (
                  <div className={`grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20 ${activeJourney.status === 'Completed' ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="space-y-6">
                      <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm">
                         <h3 className="text-xs font-black uppercase text-stone-400 mb-6 flex items-center gap-2"><i className="fas fa-brain text-amber-500"></i>Palate Intelligence</h3>
                         <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                  <p className="text-[9px] font-black text-stone-400 uppercase mb-2">Service Style</p>
                                  <p className="text-sm font-bold text-stone-800">{activeJourney.profile.pairingStyle}</p>
                               </div>
                               <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                  <p className="text-[9px] font-black text-stone-400 uppercase mb-2">Restrictions</p>
                                  <p className="text-sm font-bold text-stone-800">{activeJourney.profile.dietaryRestrictions}</p>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xs font-black text-stone-400 flex items-center gap-2"><i className="fas fa-wand-magic-sparkles text-amber-500"></i>Journey Synthesis</h3>
                          <button onClick={generateAIToolkit} disabled={isGenerating || activeJourney.status === 'Completed'} className="text-[10px] font-black uppercase bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2">
                             {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
                             {isGenerating ? 'Synthesizing...' : 'Generate Toolkit'}
                          </button>
                       </div>
                       
                       {engagement ? (
                         <div className="space-y-6 flex-1 animate-in fade-in">
                            {serviceBrief && (
                              <div className="bg-stone-950 text-white p-6 rounded-2xl border border-amber-500/20 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-user-tie text-5xl"></i></div>
                                <p className="text-[9px] font-black uppercase text-amber-500 mb-2 relative z-10 tracking-widest italic">Host/Server Briefing</p>
                                <p className="text-sm font-bold leading-relaxed relative z-10 italic">"{serviceBrief}"</p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="p-5 bg-stone-50 border border-stone-100 rounded-2xl">
                                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 flex justify-between items-center">Email Hub <i className="fas fa-envelope text-[8px]"></i></p>
                                  <p className="text-[10px] text-stone-500 leading-relaxed italic line-clamp-3">"{engagement.email.body}"</p>
                               </div>
                               <div className="p-5 bg-stone-50 border border-stone-100 rounded-2xl">
                                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 flex justify-between items-center">Mobile Trigger <i className="fas fa-comment text-[8px]"></i></p>
                                  <p className="text-[10px] text-stone-500 leading-relaxed font-bold">"{engagement.sms.body}"</p>
                               </div>
                            </div>
                         </div>
                       ) : (
                         <div className="flex-1 flex flex-col items-center justify-center opacity-30 py-20 grayscale">
                            <i className="fas fa-robot text-4xl mb-4 animate-bounce"></i>
                            <p className="text-xs font-black uppercase tracking-widest text-center">Awaiting Synthesis Sequence.</p>
                         </div>
                       )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 bg-stone-50 rounded-[2.5rem] border-2 border-dashed border-stone-200">
                 <i className="fas fa-user-clock text-5xl text-stone-200 mb-6"></i>
                 <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Identify a guest node to initialize arrival synthesis.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Marketing Campaigns Tab */
        <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
              <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-stone-200 shadow-xl space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-bullhorn text-9xl"></i></div>
                 <div className="space-y-2">
                    <h3 className="text-3xl font-serif font-black italic tracking-tighter text-stone-900">Palate Marketing Synthesis</h3>
                    <p className="text-stone-500 text-sm font-medium italic">Create targeted campaigns for guest clusters matching specific palate fingerprints.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="flex-1 relative">
                       <i className="fas fa-fingerprint absolute left-5 top-1/2 -translate-y-1/2 text-amber-500"></i>
                       <input 
                         type="text" 
                         value={targetPalateTag} 
                         onChange={e => setTargetPalateTag(e.target.value)}
                         placeholder="Cluster Tag (e.g. Peated Malt Enthusiasts)" 
                         className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-sm shadow-inner" 
                       />
                    </div>
                    <button 
                      onClick={synthesizeCampaign}
                      disabled={isSynthesizingCampaign || !targetPalateTag}
                      className="px-10 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                       {isSynthesizingCampaign ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles text-amber-500"></i>}
                       Synthesize Campaign
                    </button>
                 </div>
              </div>
              <div className="bg-amber-500 text-stone-900 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 italic">Campaign Success Alpha</p>
                 <h4 className="text-5xl font-serif font-black italic leading-none">+28%</h4>
                 <p className="text-xs font-bold leading-relaxed">Average conversion lift for palate-mapped automated outreach vs standard broadcasts.</p>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
              {campaigns.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-stone-50 rounded-[3rem] border-2 border-dashed border-stone-200 opacity-40">
                   <i className="fas fa-rocket text-4xl text-stone-300 mb-4"></i>
                   <p className="text-xs font-black uppercase tracking-widest text-stone-400">Awaiting Campaign Dispatch.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {campaigns.map(camp => (
                     <div key={camp.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                           <div>
                              <span className="text-[9px] font-black uppercase bg-stone-100 text-stone-500 px-2 py-0.5 rounded border border-stone-200 mb-2 inline-block">{camp.targetCluster}</span>
                              <h4 className="text-xl font-serif font-black italic text-stone-900 leading-tight group-hover:text-amber-600 transition-colors">{camp.title}</h4>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] font-black uppercase text-stone-400">Reach Projection</p>
                              <p className="text-sm font-black text-stone-800">{camp.reach} Nodes</p>
                           </div>
                        </div>
                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 mb-6">
                           <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Subject Protocol</p>
                           <p className="text-xs font-bold text-stone-800 italic">"{camp.subject}"</p>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-stone-50">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Target: {camp.offerItem}</span>
                           </div>
                           <button className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg">Commit Dispatch</button>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default ConciergeView;

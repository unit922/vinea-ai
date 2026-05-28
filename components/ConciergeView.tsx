
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useVinetelligenceStore } from '../store/vinetelligenceStore';
import { SubscriptionTier } from '../lib/types';
import { geminiService } from '../services/geminiService';
import { supabaseSync, generateUUID } from '../services/supabaseSync';
import { INITIAL_TABLES, INITIAL_ZONES } from '../constants';
import { formatTime } from '../utils';
import { GuestJourney, Table, InventoryItem, MarketingCampaign, RestaurantProfile, ServiceOrder } from '../lib/types';
import GuestReservationPortal from './GuestReservationPortal';
import { FacialIDScanner } from './FacialIDScanner';

// Removed local INITIAL_TABLES to use constants.tsx

interface ConciergeViewProps {
  journeys: GuestJourney[];
  setJourneys: React.Dispatch<React.SetStateAction<GuestJourney[]>>;
  profile: RestaurantProfile | null;
  orders: ServiceOrder[];
  tables: Table[];
  setTables: (tables: Table[]) => void;
}

const ConciergeView: React.FC<ConciergeViewProps> = ({ journeys, setJourneys, profile, orders, tables, setTables }) => {
  const store = useVinetelligenceStore();
  const tier = store.restaurantProfile?.tier || SubscriptionTier.OPERATOR;
  const isOperator = tier === SubscriptionTier.OPERATOR;

  const [activeTab, setActiveTab] = useState<'arrivals' | 'campaigns' | 'intelligence'>('arrivals');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [engagement, setEngagement] = useState<{ email: { body: string }; sms: { body: string } } | null>(null);
  const [serviceBrief, setServiceBrief] = useState<string | null>(null);
  const [pacingRecs, setPacingRecs] = useState<string[]>([]);
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [seatingSuggestion, setSeatingSuggestion] = useState<{ tableId: string; rationale: string } | null>(null);
  const [isSuggestingSeating, setIsSuggestingSeating] = useState(false);
  const [showPortalLinkModal, setShowPortalLinkModal] = useState(false);
  const [showFacialScanner, setShowFacialScanner] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastBriefUpdate, setLastBriefUpdate] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const isGeneratingRef = useRef(false);
  const lastBriefRef = useRef<string | null>(null);

  const inventory: InventoryItem[] = JSON.parse(localStorage.getItem('vinetelligence_inventory') || localStorage.getItem('vinea_inventory') || '[]');
  const activeJourney = journeys.find(j => j.id === selectedId);

  const generateAIToolkit = useCallback(async () => {
    if (!activeJourney || isGeneratingRef.current) return;
    setIsGenerating(true);
    isGeneratingRef.current = true;
    setEngagement(null);
    setAutoTags([]);
    
    try {
      const activeTableOrders = orders.filter(o => o.tableNumber === activeJourney.tableNumber);
      
      const sessionInfo = activeJourney.seatedAt ? {
        startTime: activeJourney.seatedAt,
        tableNumber: activeJourney.tableNumber,
        durationMinutes: Math.floor((new Date().getTime() - new Date(activeJourney.seatedAt).getTime()) / 60000)
      } : undefined;

      const [engResult, briefResult, pacingResult, outreachResult, tagsResult] = await Promise.all([
        geminiService.generateGuestEngagement(activeJourney.profile, {}),
        geminiService.generateServiceBrief(activeJourney.profile, sessionInfo, activeTableOrders),
        geminiService.getServicePacingRecommendations(activeJourney.profile, activeJourney.pacingMode || 'Standard', activeTableOrders),
        geminiService.getPreArrivalOutreach(activeJourney.profile, inventory),
        geminiService.analyzeGuestTags(activeJourney.profile, activeJourney.specialOccasion || '')
      ]);
      
      setEngagement(engResult); 
      setServiceBrief(briefResult || null);
      setPacingRecs(pacingResult.recommendations || []);
      setAutoTags(tagsResult);
      setLastBriefUpdate(new Date());
      console.log("AI Synthesis Complete", { pacingRecs: pacingResult.recommendations, outreach: outreachResult, autoTags: tagsResult });
    } catch (error) { console.error(error); }
    finally { 
      setIsGenerating(false); 
      isGeneratingRef.current = false;
    }
  }, [activeJourney, orders, inventory]);

  // Auto-refresh brief when relevant data changes
  useEffect(() => {
    if (!activeJourney || isGenerating || isGeneratingRef.current) return;
    
    const activeOrders = orders.filter(o => o.tableNumber === activeJourney.tableNumber);
    const eventHash = `${activeJourney.status}-${activeOrders.length}-${activeJourney.pacingMode}`;
    
    // Only auto-generate if we have an active journey and haven't updated in at least 3 minutes, 
    // or if the event hash changed (e.g. new order)
    const timeSinceLastUpdate = lastBriefUpdate ? (new Date().getTime() - lastBriefUpdate.getTime()) / 60000 : 999;
    
    if (timeSinceLastUpdate > 3 || lastBriefRef.current !== eventHash) {
      lastBriefRef.current = eventHash;
      generateAIToolkit();
    }
  }, [activeJourney, isGenerating, lastBriefUpdate, orders, generateAIToolkit]);

  // Force re-render for live timers
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeJourney && activeJourney.status === 'Seated') {
        setTick(t => t + 1);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [activeJourney]);

  const [isSeating, setIsSeating] = useState(false);
  const [selectedTableForSeating, setSelectedTableForSeating] = useState<Table | null>(null);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  const [isRobotEscorting, setIsRobotEscorting] = useState(false);
  const [showReservationPortal, setShowReservationPortal] = useState(false);

  // Marketing State
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [isSynthesizingCampaign, setIsSynthesizingCampaign] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [targetPalateTag, setTargetPalateTag] = useState('Peated Malt Enthusiasts');
  const [suggestedClusters] = useState<string[]>(['Old World Reds', 'Peated Malt Enthusiasts', 'Negroni Purists', 'Gluten-Free Gourmets']);

  const getBookingUrl = () => {
    if (profile?.manualPortalUrl) return profile.manualPortalUrl;
    return `${window.location.origin}${window.location.pathname}?view=book&rid=${profile?.id || 'demo'}`;
  };

  const getMenuUrl = () => {
    if (profile?.manualMenuUrl) return profile.manualMenuUrl;
    return `${window.location.origin}${window.location.pathname}?view=menu&rid=${profile?.id || 'demo'}`;
  };

  const handleSync = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // 1. Tables Sync
      if (profile?.id && profile.id !== 'demo') {
        const cloudTables = await supabaseSync.pullTables(profile.id);
        if (cloudTables && cloudTables.length > 0) {
          setTables(cloudTables);
          localStorage.setItem('vinetelligence_tables', JSON.stringify(cloudTables));
          localStorage.setItem('vinea_tables', JSON.stringify(cloudTables));
        } else {
          // Fallback to local/initial if cloud is empty
          const savedTables = localStorage.getItem('vinetelligence_tables') || localStorage.getItem('vinea_tables');
          const tableData = savedTables ? (JSON.parse(savedTables) as Table[]) : INITIAL_TABLES;
          setTables(tableData);
          if (!savedTables) {
            localStorage.setItem('vinetelligence_tables', JSON.stringify(INITIAL_TABLES));
            localStorage.setItem('vinea_tables', JSON.stringify(INITIAL_TABLES));
          }
        }
      } else {
        const savedTables = localStorage.getItem('vinetelligence_tables') || localStorage.getItem('vinea_tables');
        const tableData = savedTables ? (JSON.parse(savedTables) as Table[]) : INITIAL_TABLES;
        setTables(tableData);
        if (!savedTables) {
          localStorage.setItem('vinetelligence_tables', JSON.stringify(INITIAL_TABLES));
          localStorage.setItem('vinea_tables', JSON.stringify(INITIAL_TABLES));
        }
      }

      // 2. Journeys Sync
      const initialJourneys = await supabaseSync.pullJourneys(profile?.id || 'demo');
      if (initialJourneys && initialJourneys.length > 0) {
        setJourneys(initialJourneys);
        localStorage.setItem('vinetelligence_journeys', JSON.stringify(initialJourneys));
        localStorage.setItem('vinea_journeys', JSON.stringify(initialJourneys));
      }
    } catch (e) {
      console.error("Vinetelligence: Sync failed", e);
    }

    setIsRefreshing(false);
  }, [profile?.id, setJourneys, setTables]);

  useEffect(() => {
    handleSync();
    
    window.addEventListener('storage', handleSync);
    
    return () => {
      window.removeEventListener('storage', handleSync);
    };
  }, [handleSync]);

  useEffect(() => {
    if (!selectedId && journeys.length > 0) {
      setSelectedId(journeys[0].id);
    }
  }, [selectedId, journeys]);

  const handleCompleteJourney = async (id: string) => {
    const journey = journeys.find(j => j.id === id);
    if (!journey) return;

    const updatedJourney = { ...journey, status: 'Completed' as const };
    const updatedJourneys = journeys.map(j => j.id === id ? updatedJourney : j);
    setJourneys(updatedJourneys);
    localStorage.setItem('vinetelligence_journeys', JSON.stringify(updatedJourneys));
    localStorage.setItem('vinea_journeys', JSON.stringify(updatedJourneys));

    // Free the table if they were seated
    if (journey.tableNumber && journey.tableNumber !== 'Pending' && journey.tableNumber !== 'Walk-in') {
      const savedTables = localStorage.getItem('vinetelligence_tables') || localStorage.getItem('vinea_tables');
      if (savedTables) {
        const tables: Table[] = JSON.parse(savedTables);
        const updatedTables = tables.map(t => t.number === journey.tableNumber ? { 
          ...t, 
          status: 'Available' as const, 
          occupantName: undefined,
          occupantCount: 0
        } : t);
        setTables(updatedTables);
        localStorage.setItem('vinetelligence_tables', JSON.stringify(updatedTables));
        localStorage.setItem('vinea_tables', JSON.stringify(updatedTables));
        
        // Sync table to Supabase
        const updatedTable = updatedTables.find(t => t.number === journey.tableNumber);
        if (updatedTable) {
          supabaseSync.saveTable(profile?.id || 'demo', updatedTable).catch(e => console.error("Vinetelligence: Failed to sync table status", e));
        }
      }
    }

    // Sync journey to Supabase
    try {
      await supabaseSync.pushJourney(profile?.id || 'demo', updatedJourney);
    } catch (e) {
      console.error("Vinetelligence: Failed to sync completion", e);
    }
    
    window.dispatchEvent(new Event('storage'));
  };

  const handleArrivalUpdate = async (id: string, status: GuestJourney['status'], facialId?: string) => {
    const journey = journeys.find(j => j.id === id);
    if (!journey) return;

    const updatedJourney = { ...journey, status, facialId: facialId || journey.facialId };
    const updated = journeys.map(j => j.id === id ? updatedJourney : j);
    setJourneys(updated);
    localStorage.setItem('vinetelligence_journeys', JSON.stringify(updated));
    localStorage.setItem('vinea_journeys', JSON.stringify(updated));
    
    // Push to Supabase
    try {
      await supabaseSync.pushJourney(profile?.id || 'demo', updatedJourney);
    } catch (e) {
      console.error("Vinetelligence: Failed to sync journey update", e);
    }
    
    window.dispatchEvent(new Event('storage'));
  };

  const handleSeatWalkIn = () => {
    const newJourney: GuestJourney = {
      id: generateUUID(),
      arrivalTime: new Date().toISOString(),
      status: 'Arrived',
      tableNumber: 'Pending',
      partySize: 2,
      profile: {
        id: generateUUID(),
        name: 'Walk-in Guest',
        email: '',
        phone: '',
        palateTags: ['New Guest'],
        visitCount: 1,
        lastVisit: new Date().toISOString(),
        totalSpend: 0,
        averageSpend: 0,
        preferredTable: '',
        notes: 'Walk-in arrival'
      },
      pacingMode: 'Standard'
    };

    const updated = [newJourney, ...journeys];
    setJourneys(updated);
    localStorage.setItem('vinetelligence_journeys', JSON.stringify(updated));
    localStorage.setItem('vinea_journeys', JSON.stringify(updated));
    setSelectedId(newJourney.id);
    setIsSeating(true);
    
    // Push to Supabase
    supabaseSync.pushJourney(profile?.id || 'demo', newJourney).catch(e => console.error("Vinetelligence: Failed to sync new journey", e));
    window.dispatchEvent(new Event('storage'));
  };

  const handleFinalSeatGuest = () => {
    if (!activeJourney || !selectedTableForSeating || selectedSeatIndex === null) return;
    
    setIsRobotEscorting(true);
    
    setTimeout(async () => {
      const now = new Date().toISOString();
      const updatedJourney: GuestJourney = { 
        ...activeJourney, 
        status: 'Seated' as const, 
        tableNumber: selectedTableForSeating.number,
        seatedAt: now
      };
      
      const updatedJourneys = journeys.map(j => j.id === activeJourney.id ? updatedJourney : j);
      setJourneys(updatedJourneys);
      localStorage.setItem('vinetelligence_journeys', JSON.stringify(updatedJourneys));
      localStorage.setItem('vinea_journeys', JSON.stringify(updatedJourneys));

      // Push to Supabase
      try {
        await supabaseSync.pushJourney(profile?.id || 'demo', updatedJourney);
      } catch (e) {
        console.error("Vinetelligence: Failed to sync seating update", e);
      }

      const updatedTables = tables.map(t => t.id === selectedTableForSeating.id ? { 
        ...t, 
        status: 'Occupied' as const, 
        occupantName: `${activeJourney.profile.name} (Party of ${activeJourney.partySize || 1})`,
        occupantCount: activeJourney.partySize || 1
      } : t);
      setTables(updatedTables);
      localStorage.setItem('vinetelligence_tables', JSON.stringify(updatedTables));
      localStorage.setItem('vinea_tables', JSON.stringify(updatedTables));

      // Push to Supabase
      const updatedTable = updatedTables.find(t => t.id === selectedTableForSeating.id);
      if (updatedTable) {
        supabaseSync.saveTable(profile?.id || 'demo', updatedTable).catch(e => console.error("Vinetelligence: Failed to sync table status", e));
      }

      setIsSeating(false);
      setSelectedTableForSeating(null);
      setSelectedSeatIndex(null);
      setSeatingSuggestion(null);
      setIsRobotEscorting(false);
      window.dispatchEvent(new Event('storage'));
    }, 2500);
  };

  const getSeatingSuggestion = async () => {
    if (!activeJourney || tables.length === 0) return;
    setIsSuggestingSeating(true);
    try {
      const res = await geminiService.getSmartSeatingSuggestion(activeJourney.profile, tables, activeJourney.partySize || 2);
      setSeatingSuggestion(res);
      if (res.tableId) {
        const table = tables.find(t => t.id === res.tableId);
        if (table) setSelectedTableForSeating(table);
      }
    } catch (e) { console.error(e); }
    finally { setIsSuggestingSeating(false); }
  };

  const handleFacialScan = (facialId: string) => {
    // Find guest by facial ID or mark as arrived if matched
    const matched = journeys.find(j => j.facialId === facialId);
    if (matched) {
      handleArrivalUpdate(matched.id, 'Arrived');
      setSelectedId(matched.id);
    } else {
      // If no match, we could potentially create a new journey or alert
      console.log("No guest matched facial ID:", facialId);
      // For demo, let's just assign it to the first 'Confirmed' guest if any
      const firstConfirmed = journeys.find(j => j.status === 'Confirmed');
      if (firstConfirmed) {
        const updated = { ...firstConfirmed, facialId, status: 'Arrived' as const };
        const updatedJourneys = journeys.map(j => j.id === firstConfirmed.id ? updated : j);
        setJourneys(updatedJourneys);
        setSelectedId(firstConfirmed.id);
      }
    }
    setShowFacialScanner(false);
  };

  const synthesizeCampaign = async () => {
    setIsSynthesizingCampaign(true);
    try {
      const result = await geminiService.getPalateMarketingCampaign({ tag: targetPalateTag }, inventory);
      const newCampaign: MarketingCampaign = {
        id: generateUUID(),
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

  const handleDispatchCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign || dispatchingId) return;

    setDispatchingId(campaignId);

    try {
      // Notify Backend
      const response = await fetch('/api/campaigns/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaign, 
          establishment: profile 
        })
      });

      if (!response.ok) throw new Error("Synthesis dispatch failed");

      // Visual delay for "Neural Transmission"
      await new Promise(r => setTimeout(r, 1200));

      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      
      setNotification({ 
        message: "Campaign Synthesized & Dispatched: Neural outreach sequence active.", 
        type: 'success' 
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) { 
      console.error("Vinetelligence: Campaign dispatch failed", err);
      setNotification({ 
        message: "Dispatch Error: System failed to bridge the communication gap.", 
        type: 'error' 
      });
    } finally {
      setDispatchingId(null);
    }
  };

  const handlePreviewCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    setIsPreviewLoading(true);
    try {
      const response = await fetch('/api/campaigns/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaign, 
          establishment: profile 
        })
      });

      if (!response.ok) throw new Error("Preview synthesis failed");
      const { html } = await response.json();
      setPreviewHtml(html);
    } catch (err) {
      console.error("Vinetelligence: Preview synthesis error", err);
      setNotification({ message: "Neural Synthesis Error: Failed to generate visual preview.", type: 'error' });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const sortedJourneys = useMemo(() => {
    const statusPriority: Record<GuestJourney['status'], number> = { 'Arrived': 0, 'Seated': 1, 'Confirmed': 2, 'Engagement Sent': 3, 'Completed': 4 };
    return journeys
      .filter(j => j.status !== 'Completed')
      .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
  }, [journeys]);

  return (
    <>
    <div className="flex flex-col animate-in fade-in duration-500 pb-10">
      {notification && (
        <div className={`fixed top-6 right-6 z-[700] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 animate-in slide-in-from-right-4 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' :
          notification.type === 'error' ? 'bg-rose-500 text-white border-rose-400' :
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
      {showFacialScanner && <FacialIDScanner onScan={handleFacialScan} onClose={() => setShowFacialScanner(false)} />}
      
      {showReservationPortal && (
        <GuestReservationPortal 
          onComplete={() => setShowReservationPortal(false)} 
          isPublic={false}
        />
      )}
      
      {/* Public Portal Link Modal */}
      {showPortalLinkModal && (
        <div className="fixed inset-0 z-[600] bg-stone-950/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 flex flex-col space-y-8 shadow-2xl border border-stone-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-stone-900 shadow-lg">
                <i className="fas fa-link text-2xl"></i>
              </div>
              <div>
                <h3 className="text-2xl font-serif font-black italic">Marketing & Access Hub</h3>
                <p className="text-stone-500 text-sm mt-2 leading-relaxed">Deploy these links across your digital presence to initialize guest journeys.</p>
              </div>
              <div className="space-y-6">
                {/* Return URL Configuration */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-3">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest flex items-center gap-2">
                    <i className="fas fa-undo"></i> Return Destination (Optional)
                  </label>
                  <input 
                    type="url"
                    placeholder="https://your-restaurant.com/thank-you"
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    onChange={(e) => {
                      const val = e.target.value;
                      const rid = profile?.id || 'demo';
                      
                      const bookEl = document.getElementById('link-book') as HTMLInputElement;
                      const menuEl = document.getElementById('link-menu') as HTMLInputElement;
                      
                      if (bookEl) {
                        const base = profile?.manualPortalUrl || `${window.location.origin}${window.location.pathname}?view=book&rid=${rid}`;
                        bookEl.value = `${base}${base.includes('?') ? '&' : '?'}${val ? `return_url=${encodeURIComponent(val)}` : ''}`;
                      }
                      if (menuEl) {
                        const base = profile?.manualMenuUrl || `${window.location.origin}${window.location.pathname}?view=menu&rid=${rid}`;
                        menuEl.value = `${base}${base.includes('?') ? '&' : '?'}${val ? `return_url=${encodeURIComponent(val)}` : ''}`;
                      }
                    }}
                  />
                  <p className="text-[9px] text-stone-400 italic">Guests will be redirected here after completing their journey.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Booking Link */}
                  <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-900 text-white rounded-lg flex items-center justify-center text-xs">
                        <i className="fas fa-calendar-check"></i>
                      </div>
                      <h4 className="font-bold text-sm">Reservations</h4>
                    </div>
                    <div className="relative">
                      <input 
                        id="link-book"
                        readOnly
                        value={getBookingUrl()}
                        className="w-full pl-3 pr-10 py-2 bg-white border border-stone-200 rounded-lg text-[9px] font-mono text-stone-600 outline-none"
                      />
                      <button 
                        onClick={() => {
                          const el = document.getElementById('link-book') as HTMLInputElement;
                          navigator.clipboard.writeText(el.value);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-indigo-500 transition-colors"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>

                  {/* Menu Link */}
                  <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500 text-stone-900 rounded-lg flex items-center justify-center text-xs">
                        <i className="fas fa-wine-glass"></i>
                      </div>
                      <h4 className="font-bold text-sm">Digital Menu</h4>
                    </div>
                    <div className="relative">
                      <input 
                        id="link-menu"
                        readOnly
                        value={getMenuUrl()}
                        className="w-full pl-3 pr-10 py-2 bg-white border border-stone-200 rounded-lg text-[9px] font-mono text-stone-600 outline-none"
                      />
                      <button 
                        onClick={() => {
                          const el = document.getElementById('link-menu') as HTMLInputElement;
                          navigator.clipboard.writeText(el.value);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-indigo-500 transition-colors"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="p-6 bg-stone-950 text-white rounded-[2.5rem] space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-500">In-Venue QR Intelligence</h4>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-white p-2 rounded-xl flex items-center justify-center">
                      <i className="fas fa-qrcode text-4xl text-stone-900"></i>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Table #" 
                          className="w-20 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] outline-none focus:border-indigo-500"
                          onChange={(e) => {
                            const table = e.target.value;
                            const el = document.getElementById('link-qr') as HTMLInputElement;
                            const base = window.location.origin + window.location.pathname;
                            const rid = profile?.id || 'demo';
                            el.value = `${base}?view=menu&rid=${rid}&table=${table || 'T1'}`;
                          }}
                        />
                        <input 
                          id="link-qr"
                          readOnly
                          value={`${window.location.origin}${window.location.pathname}?view=menu&rid=${profile?.id || 'demo'}&table=T1`}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[8px] font-mono text-stone-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowPortalLinkModal(false)}
                className="w-full py-4 bg-stone-100 text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-stone-200 transition-all"
              >
                Close Hub
              </button>
           </div>
        </div>
      )}

      {isRobotEscorting && (
        <div className="fixed inset-0 z-[800] bg-stone-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in">
           <div className="relative w-64 h-64 mb-10">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping"></div>
              <div className="absolute inset-4 border-2 border-indigo-500/40 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                 <i className="fas fa-robot text-5xl text-indigo-500 animate-bounce"></i>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">BeeBot-Escort</p>
              </div>
           </div>
           <div className="text-center space-y-4 max-w-sm">
              <h3 className="text-2xl font-serif font-black text-white italic">Robot Escort Protocol</h3>
              <p className="text-stone-400 text-sm leading-relaxed italic">"Guiding {activeJourney?.profile.name} to Table {selectedTableForSeating?.number}, Seat {selectedSeatIndex! + 1}. Adjusting smart-room ambiance to 'Relaxed' preset."</p>
           </div>
        </div>
      )}

      {showFacialScanner && (
        <FacialIDScanner 
          onScan={handleFacialScan} 
          onClose={() => setShowFacialScanner(false)} 
        />
      )}

      <div className="flex justify-between items-center border-b border-stone-200 mb-6 shrink-0">
        <div className="flex gap-8">
           <button onClick={() => setActiveTab('arrivals')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2 ${activeTab === 'arrivals' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-stone-400 hover:text-stone-600'}`}>Arrival Hub</button>
           {!isOperator && (
             <>
               <button onClick={() => setActiveTab('campaigns')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2 ${activeTab === 'campaigns' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-stone-400 hover:text-stone-600'}`}>Marketing Engines</button>
               <button onClick={() => setActiveTab('intelligence')} className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all px-2 ${activeTab === 'intelligence' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-stone-400 hover:text-stone-600'}`}>Intelligence Hub</button>
             </>
           )}
        </div>
        <div className="pb-4 flex gap-2">
           <button onClick={() => setShowReservationPortal(true)} className="px-4 py-1.5 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg border border-white/10"><i className="fas fa-plus mr-2"></i> Manual Booking</button>
           <button onClick={handleSeatWalkIn} className="px-4 py-1.5 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg border border-emerald-500"><i className="fas fa-walking mr-2"></i> Walk-in Arrival</button>
           <button onClick={() => setShowFacialScanner(true)} className="px-4 py-1.5 bg-indigo-500 text-stone-900 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg border border-indigo-400"><i className="fas fa-face-viewfinder mr-2"></i> Facial Check-in</button>
           <button onClick={() => setShowPortalLinkModal(true)} className="px-4 py-1.5 bg-stone-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg border border-white/10"><i className="fas fa-link text-indigo-500 mr-2"></i> Portal Link</button>
        </div>
      </div>

      {activeTab === 'arrivals' ? (
        <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden animate-in fade-in duration-500">
          <div className="lg:w-80 flex flex-col gap-4 min-h-0">
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-sm flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between shrink-0 px-1 mb-4">
                 <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 italic">Arrival Queue</h3>
                 <div className="flex items-center gap-2">
                    <button onClick={handleSync} className={`text-stone-300 hover:text-indigo-500 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}><i className="fas fa-rotate text-xs"></i></button>
                    <span className="bg-stone-900 text-white px-2 py-0.5 rounded-full text-[9px] font-black">{journeys.length}</span>
                 </div>
              </div>
              <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                {sortedJourneys.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center py-20 grayscale">
                    <i className="fas fa-user-clock text-4xl mb-4"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest">Queue Silent</p>
                  </div>
                ) : sortedJourneys.map(journey => (
                  <button key={journey.id} onClick={() => { setSelectedId(journey.id); setSelectedTableForSeating(null); setSelectedSeatIndex(null); }} className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedId === journey.id ? 'bg-stone-900 border-stone-900 text-white shadow-lg' : 'bg-stone-50 border-stone-100 text-stone-800 hover:bg-white hover:border-indigo-200'} ${journey.status === 'Completed' ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-between items-start mb-1"><span className="font-bold text-sm truncate pr-2">{journey.profile.name}</span><span className="text-[9px] font-black text-stone-400">{formatTime(journey.arrivalTime)}</span></div>
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                        journey.status === 'Arrived' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        journey.status === 'Seated' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        journey.status === 'Completed' ? 'bg-stone-800 text-stone-300 border-stone-700' :
                        'bg-stone-200 text-stone-500 border-stone-300'
                      }`}>{journey.status}</span>
                      <div className="flex items-center gap-2">
                        {journey.facialId && <span className="text-[7px] font-black uppercase bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-500/20"><i className="fas fa-face-viewfinder mr-1"></i> Facial ID</span>}
                        <span className="text-[8px] font-black uppercase text-stone-400">{journey.pacingMode || 'Standard'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2" data-tick={tick}>
            {activeJourney ? (
              <>
                 <div className={`bg-stone-900 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden shrink-0 ${activeJourney.status === 'Completed' ? 'grayscale' : ''}`}>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="space-y-4">
                       <div className="flex items-center gap-3">
                          <span className={`bg-indigo-500 text-stone-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full italic ${activeJourney.status === 'Completed' ? 'bg-stone-600' : ''}`}>
                            {activeJourney.status === 'Completed' ? 'Journey Archived' : 'VIP Synthesis'}
                          </span>
                          <span className="text-[10px] font-black uppercase border border-white/20 text-stone-400 px-3 py-1 rounded-full">{activeJourney.pacingMode || 'Standard'} PACE</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <h2 className="text-4xl md:text-6xl font-serif font-black italic tracking-tighter">{activeJourney.profile.name}</h2>
                          {activeJourney.facialId && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 flex flex-col items-center gap-1 shadow-inner">
                              <i className="fas fa-face-viewfinder text-indigo-500 text-xl"></i>
                              <span className="text-[7px] font-black text-indigo-500/60 uppercase tracking-widest">Verified</span>
                            </div>
                          )}
                       </div>
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
                         <div className="flex gap-3">
                           <button onClick={() => setIsSeating(true)} className="px-10 py-5 bg-indigo-500 text-stone-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-400 transition-all shadow-xl active:scale-95 flex items-center gap-3"><i className="fas fa-chair"></i> Initialize Seating</button>
                           <button onClick={() => handleCompleteJourney(activeJourney.id)} className="px-10 py-5 bg-stone-100 text-stone-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-stone-200 transition-all shadow-xl active:scale-95 flex items-center gap-3"><i className="fas fa-door-open"></i> No-Show/Left</button>
                         </div>
                       )}
                       {activeJourney.status === 'Seated' && (
                         <button onClick={() => handleCompleteJourney(activeJourney.id)} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 transition-all shadow-xl active:scale-95 flex items-center gap-3"><i className="fas fa-door-open"></i> Mark Departed</button>
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
                             <div className="flex gap-4 items-center">
                                {!isOperator && (
                                  <button 
                                    onClick={getSeatingSuggestion}
                                    disabled={isSuggestingSeating}
                                    className="px-4 py-2 bg-indigo-500 text-stone-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all flex items-center gap-2 shadow-lg"
                                  >
                                    {isSuggestingSeating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                                    AI Suggestion
                                  </button>
                                )}
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-stone-100 border border-stone-200 rounded-md"></div><span className="text-[9px] font-black uppercase text-stone-400">Available</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded-md"></div><span className="text-[9px] font-black uppercase text-stone-400">Occupied</span></div>
                             </div>
                          </div>
                          
                          {seatingSuggestion && (
                            <div className="bg-indigo-50 border-indigo-200 p-6 rounded-3xl animate-in slide-in-from-top-2">
                               <div className="flex items-center gap-3 mb-2">
                                  <i className="fas fa-brain text-indigo-500"></i>
                                  <h4 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">AI Seating Rationale</h4>
                               </div>
                               <p className="text-xs text-stone-700 italic leading-relaxed">"{seatingSuggestion.rationale}"</p>
                            </div>
                          )}
                          
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
                                       isOccupied ? 'bg-indigo-50 border-indigo-200 opacity-40 grayscale cursor-not-allowed' : 'bg-white border-stone-200 hover:border-indigo-500 hover:scale-110 shadow-lg'
                                     }`}
                                   >
                                      <span className="text-2xl font-serif font-black text-stone-800">T{table.number}</span>
                                      <span className="text-[8px] font-black uppercase text-stone-400">{table.capacity} Positions</span>
                                   </button>
                                 );
                               })
                             )}
                          </div>
                       </div>
                     ) : (
                       <div className="space-y-12 animate-in fade-in duration-500">
                          <div className="flex justify-between items-center">
                             <button onClick={() => setSelectedTableForSeating(null)} className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 flex items-center gap-2"><i className="fas fa-arrow-left"></i> Change Table</button>
                             <div className="text-center">
                                <h3 className="text-4xl font-serif font-black text-stone-900 italic">Anchor Position</h3>
                                <p className="text-xs text-indigo-600 font-black uppercase tracking-widest mt-1">Refining Hyper-Personalized Node for Table {selectedTableForSeating.number}</p>
                             </div>
                             <div className="w-20"></div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
                             <div className="relative w-72 h-72 bg-stone-100 rounded-[4rem] border-4 border-stone-200 flex items-center justify-center shadow-inner">
                                <div className="text-center space-y-1">
                                   <p className="text-2xl font-serif font-black text-stone-800">T{selectedTableForSeating.number}</p>
                                   <p className="text-[9px] font-black text-stone-400 uppercase">Interactive Core</p>
                                </div>
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
                                        selectedSeatIndex === i ? 'bg-indigo-50 border-indigo-400 text-stone-900 scale-110' : 'bg-white border-stone-100 text-stone-300 hover:border-indigo-200'
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
                                   <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest italic border-b border-white/10 pb-4">AI Anchor Insight</h4>
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
                         <h3 className="text-xs font-black uppercase text-stone-400 mb-6 flex items-center gap-2"><i className="fas fa-brain text-indigo-500"></i>Palate Intelligence</h3>
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
                            {!isOperator && (
                              <>
                                {autoTags.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {autoTags.map(tag => (
                                      <span key={tag} className="px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-full text-[8px] font-black uppercase border border-indigo-500/20">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {pacingRecs.length > 0 && (
                                  <div className="p-6 bg-stone-900 text-white rounded-[2rem] space-y-4 shadow-xl border border-indigo-500/10">
                                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                      <p className="text-[10px] font-black uppercase text-indigo-500 tracking-widest flex items-center gap-2">
                                        <i className="fas fa-clock"></i> Service Pacing Strategy
                                      </p>
                                      <div className="flex gap-1">
                                        {(['Leisurely', 'Standard', 'Brisk'] as const).map(mode => (
                                          <button
                                            key={mode}
                                            onClick={async () => {
                                              const updatedJourney = { ...activeJourney, pacingMode: mode };
                                              const updated = journeys.map(j => j.id === activeJourney.id ? updatedJourney : j);
                                              setJourneys(updated);
                                              localStorage.setItem('vinetelligence_journeys', JSON.stringify(updated));
                                              if (profile?.id) {
                                                await supabaseSync.pushJourney(profile.id, updatedJourney);
                                              }
                                              // Re-generate pacing recs with new mode
                                              setIsGenerating(true);
                                              try {
                                                const activeTableOrders = orders.filter(o => o.tableNumber === activeJourney.tableNumber);
                                                const res = await geminiService.getServicePacingRecommendations(activeJourney.profile, mode, activeTableOrders);
                                                setPacingRecs(res.recommendations || []);
                                              } catch (e) { console.error(e); }
                                              finally { setIsGenerating(false); }
                                            }}
                                            className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${
                                              activeJourney.pacingMode === mode 
                                                ? 'bg-indigo-500 text-stone-900' 
                                                : 'bg-white/5 text-stone-500 hover:text-white'
                                            }`}
                                          >
                                            {mode}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <ul className="space-y-3">
                                      {pacingRecs.map((rec, i) => (
                                        <li key={i} className="text-[11px] italic flex gap-3 leading-relaxed">
                                          <span className="text-indigo-500 shrink-0">•</span>
                                          {rec}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </>
                            )}
                         </div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xs font-black text-stone-400 flex items-center gap-2"><i className="fas fa-wand-magic-sparkles text-indigo-500"></i>Journey Synthesis</h3>
                          <button onClick={generateAIToolkit} disabled={isGenerating || activeJourney.status === 'Completed'} className="text-[10px] font-black uppercase bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-stone-800 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2">
                             {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bolt"></i>}
                             {isGenerating ? 'Synthesizing...' : 'Generate Toolkit'}
                          </button>
                       </div>
                       
                       {engagement ? (
                         <div className="space-y-6 flex-1 animate-in fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {serviceBrief && (
                                <div className="bg-stone-950 text-white p-6 rounded-2xl border border-indigo-500/20 shadow-xl relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><i className="fas fa-user-tie text-5xl"></i></div>
                                  <div className="flex justify-between items-center mb-2 relative z-10">
                                     <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest italic">Host/Server Briefing</p>
                                     {lastBriefUpdate && <span className="text-[7px] text-stone-500 font-bold uppercase tracking-widest">Updated {new Date(lastBriefUpdate).toLocaleTimeString()}</span>}
                                  </div>
                                  <p className="text-sm font-bold leading-relaxed relative z-10 italic">"{serviceBrief}"</p>
                                </div>
                              )}

                              {activeJourney.status === 'Seated' && (
                                <div className="bg-stone-50 border border-stone-200 p-6 rounded-2xl flex flex-col justify-between">
                                   <div className="flex justify-between items-start">
                                      <div>
                                         <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Live Session Monitor</p>
                                         <h4 className="text-xl font-serif font-black italic">Table {activeJourney.tableNumber}</h4>
                                      </div>
                                      <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                         Live
                                      </div>
                                   </div>
                                   <div className="flex gap-6 mt-4">
                                      <div>
                                         <p className="text-[8px] font-black text-stone-400 uppercase">Duration</p>
                                         <p className="text-sm font-bold">{activeJourney.seatedAt ? `${Math.floor((new Date().getTime() - new Date(activeJourney.seatedAt).getTime()) / 60000)}m` : '0m'}</p>
                                      </div>
                                      <div>
                                         <p className="text-[8px] font-black text-stone-400 uppercase">Total Orders</p>
                                         <p className="text-sm font-bold">{orders.filter(o => o.tableNumber === activeJourney.tableNumber).length}</p>
                                      </div>
                                   </div>
                                </div>
                              )}
                            </div>

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
      ) : activeTab === 'campaigns' ? (
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
                       <i className="fas fa-fingerprint absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500"></i>
                       <input 
                         type="text" 
                         value={targetPalateTag} 
                         onChange={e => setTargetPalateTag(e.target.value)}
                         placeholder="Cluster Tag (e.g. Peated Malt Enthusiasts)" 
                         className="w-full pl-12 pr-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm shadow-inner" 
                       />
                    </div>
                    <button 
                      onClick={synthesizeCampaign}
                      disabled={isSynthesizingCampaign || !targetPalateTag}
                      className="px-10 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                       {isSynthesizingCampaign ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles text-indigo-500"></i>}
                       Synthesize Campaign
                    </button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <p className="text-[9px] font-black uppercase text-stone-400 w-full mb-1">Suggested Clusters:</p>
                    {suggestedClusters.map(cluster => (
                      <button 
                        key={cluster} 
                        onClick={() => setTargetPalateTag(cluster)}
                        className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border transition-all ${
                          targetPalateTag === cluster 
                            ? 'bg-indigo-500 border-indigo-500 text-stone-900' 
                            : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-indigo-500'
                        }`}
                      >
                        {cluster}
                      </button>
                    ))}
                 </div>
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
                              <h4 className="text-xl font-serif font-black italic text-stone-900 leading-tight group-hover:text-indigo-600 transition-colors">{camp.title}</h4>
                           </div>
                        </div>
                        <div className={`flex justify-between items-center pt-6 border-t border-stone-50 ${dispatchingId && dispatchingId !== camp.id ? 'opacity-30' : ''}`}>
                           <div className="flex gap-2">
                             <button 
                               onClick={() => handlePreviewCampaign(camp.id)}
                               disabled={dispatchingId !== null || isPreviewLoading}
                               className="px-4 py-2.5 bg-stone-100 text-stone-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-stone-200 transition-all active:scale-95 flex items-center gap-2"
                             >
                               <i className="fas fa-eye text-indigo-500"></i>
                               Preview Synthesis
                             </button>
                             <button 
                               onClick={() => handleDispatchCampaign(camp.id)}
                               disabled={dispatchingId !== null}
                               className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center gap-2 ${
                                 dispatchingId === camp.id 
                                   ? 'bg-emerald-500 text-stone-900 cursor-wait' 
                                   : 'bg-stone-900 text-white hover:bg-emerald-600'
                               }`}
                             >
                               {dispatchingId === camp.id ? (
                                 <>
                                   <i className="fas fa-spinner fa-spin"></i>
                                   Neural Transmission...
                                 </>
                               ) : (
                                 <>
                                   <i className="fas fa-paper-plane"></i>
                                   Commit Dispatch
                                 </>
                               )}
                             </button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      ) : (
        /* Intelligence Hub Tab */
        <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                 <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Seated VIPs</p>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-serif font-black italic">{journeys.filter(j => j.status === 'Seated').length}</span>
                    <span className="text-[10px] text-emerald-500 font-bold mb-1">Live Neurons</span>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                 <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Arrival Pipeline</p>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-serif font-black italic">{journeys.filter(j => j.status === 'Confirmed' || j.status === 'Arrived').length}</span>
                    <span className="text-[10px] text-indigo-500 font-bold mb-1">Pending Nodes</span>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                 <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Active Stations</p>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-serif font-black italic">{tables.filter(t => t.status === 'Occupied').length}</span>
                    <span className="text-[10px] text-stone-400 font-bold mb-1">/ {tables.length} Total</span>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                 <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest mb-1">Neural Readiness</p>
                 <div className="flex items-end gap-2">
                    <span className="text-3xl font-serif font-black italic">98%</span>
                    <span className="text-[10px] text-emerald-400 font-bold mb-1">Optimized</span>
                 </div>
              </div>
           </div>

           <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
              {/* Floor Activities */}
              <div className="flex-1 bg-white rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col overflow-hidden">
                 <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <div>
                       <h3 className="text-xl font-serif font-black italic text-stone-900 leading-tight">Room-Wide Operations</h3>
                       <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-1">Real-time telemetry from Floor Zones A, B & VIP</p>
                    </div>
                    <div className="flex gap-2">
                       <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase border border-emerald-100">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Floor Active
                       </span>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {INITIAL_ZONES.filter(z => z.id !== 'z1').map(zone => (
                      <div key={zone.id} className="space-y-4">
                         <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${zone.color}`}></div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600 italic">{zone.name}</h4>
                            <div className="flex-1 h-px bg-stone-100"></div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tables.filter(t => zone.tables.includes(t.number)).map(table => {
                               const activeJourney = journeys.find(j => j.tableNumber === table.number && j.status === 'Seated');
                               const tableOrders = orders.filter(o => o.tableNumber === table.number && o.status !== 'Delivered');
                               return (
                                 <div key={table.id} className={`p-5 rounded-[1.5rem] border transition-all ${table.status === 'Occupied' ? 'bg-stone-50 border-stone-200 shadow-sm' : 'bg-white border-dashed border-stone-200 opacity-60'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                       <span className="text-lg font-serif font-black italic">T{table.number}</span>
                                       <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${table.status === 'Occupied' ? 'bg-indigo-500 text-stone-900 border border-indigo-600' : table.status === 'Reserved' ? 'bg-emerald-500 text-white border border-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                                          {table.status}
                                       </span>
                                    </div>
                                    {activeJourney ? (
                                      <div className="space-y-2">
                                         <p className="text-xs font-bold text-stone-900 truncate">{activeJourney.profile.name}</p>
                                         <div className="flex justify-between items-center text-[9px]">
                                            <span className="text-stone-400 font-bold uppercase">{activeJourney.seatedAt ? `${Math.floor((new Date().getTime() - new Date(activeJourney.seatedAt).getTime()) / 60000)}m` : '0m'}</span>
                                            <span className={`font-black ${tableOrders.length > 0 ? 'text-indigo-600' : 'text-stone-400'}`}>{tableOrders.length} PULSES</span>
                                         </div>
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-stone-300 italic">Inactive node</p>
                                    )}
                                 </div>
                               );
                            })}
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

               {/* Bar Station Monitoring */}
               <div className="lg:w-96 bg-stone-950 text-white rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-45"><i className="fas fa-beer-mug-empty text-9xl text-indigo-500"></i></div>
                  <div className="p-8 border-b border-white/5 bg-white/5 relative z-10">
                     <div className="flex justify-between items-start">
                        <div>
                           <h3 className="text-xl font-serif font-black italic text-indigo-500 leading-tight">Bar Station Console</h3>
                           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-500 mt-1">High-Frequency Beverage Flow</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                           <i className="fas fa-bolt text-indigo-500 text-sm animate-pulse"></i>
                        </div>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10 relative z-10">
                     {/* The Bar Table */}
                     {tables.filter(t => t.number === 'Bar').map(table => {
                        const activeJourney = journeys.find(j => j.tableNumber === table.number && j.status === 'Seated');
                        const barOrders = orders.filter(o => o.tableNumber === 'Bar' && o.status !== 'Delivered');
                        return (
                          <div key={table.id} className="space-y-8">
                             <div className={`p-8 rounded-[2rem] border transition-all duration-700 ${table.status === 'Occupied' ? 'bg-white/5 border-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'bg-white/5 border-white/10 border-dashed'}`}>
                                <div className="flex justify-between items-center mb-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                      <h4 className="text-xl font-serif font-black italic">Station Center</h4>
                                   </div>
                                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${table.status === 'Occupied' ? 'bg-indigo-500 text-stone-900' : 'bg-white/10 text-stone-500'}`}>
                                      {table.status}
                                   </span>
                                </div>
                                {activeJourney ? (
                                  <div className="space-y-6">
                                     <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-500 rounded-[1.25rem] flex items-center justify-center text-stone-900 font-black text-xl shadow-2xl rotate-3">
                                           {activeJourney.profile.name.charAt(0)}
                                        </div>
                                        <div>
                                           <p className="text-base font-bold truncate text-white">{activeJourney.profile.name}</p>
                                           <p className="text-[9px] text-indigo-500/80 uppercase font-black tracking-widest italic">{activeJourney.profile.pairingStyle} Palate</p>
                                        </div>
                                     </div>
                                     <div className="p-5 bg-black/60 rounded-2xl border border-white/10 space-y-3">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                           <span className="text-stone-500 italic">Session Pulse:</span>
                                           <span className="text-indigo-500">{activeJourney.seatedAt ? `${Math.floor((new Date().getTime() - new Date(activeJourney.seatedAt).getTime()) / 60000)}m` : '0m'} Active</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                           <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '65%' }}></div>
                                        </div>
                                     </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl opacity-40">
                                     <i className="fas fa-glass-whiskey text-3xl text-stone-600 mb-2"></i>
                                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Wait-Mode Initialized</p>
                                  </div>
                                )}
                             </div>

                             <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                   <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Live Queue</h5>
                                   <span className="text-[9px] font-bold text-indigo-500">{barOrders.length} Pending</span>
                                </div>
                                {barOrders.length === 0 ? (
                                  <div className="text-center py-10 grayscale opacity-20">
                                     <i className="fas fa-list-check text-2xl mb-4"></i>
                                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">Queue Silent</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                     {barOrders.map(order => (
                                       <div key={order.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all cursor-default relative overflow-hidden shadow-sm">
                                          {order.priority === 'High' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"></div>}
                                          <div className="relative z-10 flex-1">
                                             <p className="text-xs font-serif font-black text-white italic truncate pr-4">{order.items[0].name}</p>
                                             <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full ${order.priority === 'High' ? 'bg-indigo-500/20 text-indigo-500 border border-indigo-500/30' : 'bg-white/5 text-stone-500'}`}>{order.priority}</span>
                                                <span className="text-[7px] text-stone-500 font-bold uppercase tracking-widest">{order.timestamp ? formatTime(order.timestamp) : 'Now'}</span>
                                             </div>
                                          </div>
                                          <div className={`w-2.5 h-2.5 rounded-full relative z-10 ${order.status === 'Ready' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`}></div>
                                       </div>
                                    ))}
                                  </div>
                                )}
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>

    {/* Campaign Preview Modal */}
    {previewHtml && (
      <div className="fixed inset-0 z-[1000] bg-stone-950/90 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
         <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full max-h-[90vh]">
            <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-900 text-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-eye"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-black italic text-stone-900">Neural Outreach Preview</h3>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Verifying guest-facing synthesis & establishment metadata</p>
                  </div>
               </div>
               <button 
                 onClick={() => setPreviewHtml(null)}
                 className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
               >
                 <i className="fas fa-times text-xl"></i>
               </button>
            </div>
            <div className="flex-1 bg-stone-100 p-8 overflow-hidden flex justify-center">
               <div className="w-full max-w-[640px] bg-white shadow-2xl rounded-xl overflow-auto h-full border border-stone-200">
                  <iframe 
                    title="Vinetelligence Synthesis Preview"
                    srcDoc={previewHtml} 
                    className="w-full h-full border-none"
                  />
               </div>
            </div>
            <div className="p-8 bg-white border-t border-stone-100 flex justify-center">
               <button 
                 onClick={() => setPreviewHtml(null)}
                 className="px-12 py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-500 transition-all active:scale-95 shadow-xl"
               >
                 Ready for Dispatch
               </button>
            </div>
         </div>
      </div>
    )}
    </>
  );
};

export default ConciergeView;

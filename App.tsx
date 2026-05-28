
import React, { useState, useEffect, useCallback } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AppView, RestaurantProfile, ServiceOrder, InventoryItem, Table, GuestJourney } from './lib/types';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import TutorialOverlay from './components/TutorialOverlay';
import AuthView from './components/AuthView';
import DevPortal from './components/DevPortal';
import GuestReservationPortal from './components/GuestReservationPortal';
import VisitorMenu from './components/VisitorMenu';
import { SocialPromo } from './components/SocialPromo';
import AIAvatarChat from './components/AIAvatarChat';
import WelcomeBriefing from './components/modals/WelcomeBriefing';
import AppViewManager from './components/AppViewManager';
import { authService } from './services/authService';
import { supabaseSync, isValidUUID } from './services/supabaseSync';
import { isVinetelligenceAdmin } from './lib/authUtils';
import { analyticsService } from './services/analyticsService';
import { INITIAL_INVENTORY } from './constants';
import { calculateDecrementAmount } from './lib/inventoryUtils';
import { useVinetelligenceStore } from './store/vinetelligenceStore';
import { useVinetelligenceInitialization } from './hooks/useVinetelligenceInitialization';
import { useVinetelligenceActions } from './hooks/useVinetelligenceActions';

import { ErrorBoundary } from './components/ErrorBoundary';
import { ConnectivityMonitor } from './components/ConnectivityMonitor';

// Settings Sub-components

const App: React.FC = () => {
  console.log("Vinetelligence: App component rendering");
  
  // Use selectors to avoid subscribing to the whole store
  const activeView = useVinetelligenceStore(state => state.activeView);
  const session = useVinetelligenceStore(state => state.session);
  const restaurantProfile = useVinetelligenceStore(state => state.restaurantProfile);
  const isReady = useVinetelligenceStore(state => state.isReady);
  const authMode = useVinetelligenceStore(state => state.authMode);
  const isDeveloper = useVinetelligenceStore(state => state.isDeveloper);
  const devToolsUnlocked = useVinetelligenceStore(state => state.devToolsUnlocked);
  const orders = useVinetelligenceStore(state => state.orders);
  const inventory = useVinetelligenceStore(state => state.inventory);
  const journeys = useVinetelligenceStore(state => state.journeys);
  const ownedCount = useVinetelligenceStore(state => state.ownedCount);
  const isOnline = useVinetelligenceStore(state => state.isOnline);

  const setRestaurantProfile = useVinetelligenceStore(state => state.setRestaurantProfile);
  const setInventory = useVinetelligenceStore(state => state.setInventory);
  const setOrders = useVinetelligenceStore(state => state.setOrders);
  const setJourneys = useVinetelligenceStore(state => state.setJourneys);
  const setTables = useVinetelligenceStore(state => state.setTables);
  const setSession = useVinetelligenceStore(state => state.setSession);
  const setIsReady = useVinetelligenceStore(state => state.setIsReady);
  const setAuthMode = useVinetelligenceStore(state => state.setAuthMode);
  const setIsDeveloper = useVinetelligenceStore(state => state.setIsDeveloper);
  const setDevToolsUnlocked = useVinetelligenceStore(state => state.setDevToolsUnlocked);
  const setActiveView = useVinetelligenceStore(state => state.setActiveView);
  const setOwnedCount = useVinetelligenceStore(state => state.setOwnedCount);
  const setCurrentUserRole = useVinetelligenceStore(state => state.setCurrentUserRole);
  const addOrder = useVinetelligenceStore(state => state.addOrder);
  
  useVinetelligenceInitialization();
  const { handleLogout, updateProfileValue } = useVinetelligenceActions();

  const [initialAcademyTab, setInitialAcademyTab] = useState<'academy' | 'mixology' | 'signature' | 'roster' | 'pairing' | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<'login' | 'signup' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  const [publicView, setPublicView] = useState<'book' | 'menu' | 'promo' | null>(null);
  const [publicRid, setPublicRid] = useState<string | null>(null);
  const [publicTable, setPublicTable] = useState<string | null>(null);
  const [isPublicRoute, setIsPublicRoute] = useState(false);
  const [isPublicEntry, setIsPublicEntry] = useState(false);
  
  const [showDevPortal, setShowDevPortal] = useState(false);
  const [isWelcomeBriefingOpen, setIsWelcomeBriefingOpen] = useState(false);
  
  const prevStates = React.useRef<Record<string, string | number | boolean | null>>({});
  useEffect(() => {
    const currentStates = {
      activeView: activeView, session: !!session, restaurantProfile: !!restaurantProfile,
      isReady: isReady, isPublicRoute, ordersCount: orders.length, inventoryCount: inventory.length,
      journeysCount: journeys.length, authMode: authMode, showAuth, showOnboarding,
      isDeveloper: isDeveloper, showDevPortal, devToolsUnlocked: devToolsUnlocked
    };
    
    const changes = Object.entries(currentStates).filter(([key, val]) => prevStates.current[key] !== val);
    if (changes.length > 0) {
      console.log("Vinetelligence: App state changed", Object.fromEntries(changes));
    }
    prevStates.current = currentStates;
  }, [activeView, session, restaurantProfile, isReady, isPublicRoute, orders.length, inventory.length, journeys.length, authMode, showAuth, showOnboarding, isDeveloper, showDevPortal, devToolsUnlocked]);

  // Track Page Views via Google Analytics
  useEffect(() => {
    analyticsService.logPageView(`/${activeView}`);
    console.log("Analytics Sync: Page View Tracked", activeView);
  }, [activeView]);

  useEffect(() => {
    const initializeApp = async () => {
      // Initialize Analytics
      analyticsService.initGA();
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const ridParam = params.get('rid');
      const tableParam = params.get('table');
      
      const modeParam = params.get('mode');
      
      const pathname = window.location.pathname;
      const pathParts = pathname.split('/').filter(p => p);
      const slugCandidate = pathParts[0];
      const subView = pathParts[1];

      // Reset to onboarding if mode=demo is requested
      if (modeParam === 'demo') {
        const tierFromUrl = params.get('tier');
        localStorage.removeItem('vinetelligence_profile');
        localStorage.removeItem('vinea_profile');
        localStorage.removeItem('vinetelligence_onboarded');
        localStorage.removeItem('vinea_onboarded');
        
        if (tierFromUrl) {
          const defaultProfile = {
            id: 'demo-id',
            name: '',
            ownerEmail: '',
            type: 'Restaurant',
            focus: 'Wine & Spirits',
            edition: tierFromUrl === 'operator' ? 'free' : (tierFromUrl === 'visionary' ? 'paid' : 'demo'),
            tier: tierFromUrl.charAt(0).toUpperCase() + tierFromUrl.slice(1),
            demoMode: 'operator',
            aiPersona: 'technical'
          };
          localStorage.setItem('vinetelligence_profile', JSON.stringify(defaultProfile));
          localStorage.setItem('vinea_profile', JSON.stringify(defaultProfile));
        }

        setRestaurantProfile(null);
        setShowOnboarding(true);
        setIsReady(true);
        // Clean URL
        window.history.pushState({}, '', '/');
        return;
      }

      // Handle direct slug access: vinetelligence.live/establishment-name or vinetelligence.live/slug/menu
      const RESERVED_SLUGS = ['login', 'signup', 'auth', 'settings', 'admin', 'developer', 'demo', 'callback', 'guest', 'api', 'vinea', 'vinetelligence'];
      if (slugCandidate && !RESERVED_SLUGS.includes(slugCandidate.toLowerCase()) && !viewParam && !ridParam && !pathname.includes('callback') && pathname !== '/') {
         try {
            console.log("Vinetelligence: Potentially resolving slug path:", slugCandidate);
            const slugProfile = await supabaseSync.getRestaurantBySlug(slugCandidate).catch(() => null);
            if (slugProfile) {
               console.log("Vinetelligence: Established connection via slug:", slugCandidate, "subview:", subView);
               setIsPublicRoute(true);
               setIsPublicEntry(true);
               
               // Default to 'promo' for landing, but respect sub-paths
               let targetView: 'book' | 'menu' | 'promo' = 'promo';
               if (subView === 'book' || subView === 'reserve') targetView = 'book';
               if (subView === 'menu' || subView === 'list') targetView = 'menu';
               
               setPublicView(targetView);
               setPublicRid(slugProfile.id);
               setRestaurantProfile(slugProfile);
               setAuthMode('secure');
               setIsReady(true);
               return;
            }
         } catch (e) {
            console.error("Vinetelligence: Slug check failed", e);
         }
      }

      if (viewParam === 'book' || viewParam === 'menu' || viewParam === 'promo' || viewParam === 'guest') {
        setIsPublicRoute(true);
        setIsPublicEntry(true);
        setPublicView(viewParam === 'guest' ? 'menu' : viewParam);
        setPublicRid(ridParam);
        setPublicTable(tableParam);
        
        const targetRid = ridParam || 'demo-id';
        if (targetRid && targetRid !== 'demo-id' && targetRid !== 'demo') {
          try {
            const cloudProfile = await supabaseSync.getRestaurantProfile(targetRid).catch(() => null);
            if (cloudProfile) {
              setRestaurantProfile(cloudProfile);
              setAuthMode('secure');
            }
          } catch (e) {
            console.error("Vinetelligence: Failed to fetch public profile", e);
          }
        } else if (targetRid === 'demo-id' || targetRid === 'demo') {
          setRestaurantProfile({
            id: 'demo-id',
            name: 'Vinetelligence Explorer (Demo)',
            type: 'Restaurant',
            focus: 'General',
            description: 'Demo environment',
            edition: 'demo',
            demoMode: 'operator',
            tier: 'Operator',
            aiPersona: 'technical'
          });
          setInventory(INITIAL_INVENTORY);
        }
        
        setIsReady(true);
        return;
      }

      setIsPublicRoute(false);
      setPublicView(null);

      try {
        console.log("Vinetelligence: Booting application...");
        // Fast asynchronous background verification so the workspace boots instantly in under 50ms
        supabaseSync.verifySchema().catch(() => {});

        const storedProfile = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
        const onboarded = (localStorage.getItem('vinetelligence_onboarded') || localStorage.getItem('vinea_onboarded')) === 'true';
        
        if (storedProfile && onboarded) {
          const p = JSON.parse(storedProfile);
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          if (p.edition !== 'demo' && p.id && uuidRegex.test(p.id)) {
            const cloudProfile = await supabaseSync.getRestaurantProfile(p.id).catch(() => null);
            if (cloudProfile) {
              setRestaurantProfile(cloudProfile);
              localStorage.setItem('vinetelligence_profile', JSON.stringify(cloudProfile));
              localStorage.setItem('vinea_profile', JSON.stringify(cloudProfile));
            } else {
              setRestaurantProfile(p);
            }
          } else {
            setRestaurantProfile(p);
          }

          const isDemo = p.edition === 'demo';
          if (!isDemo) {
            setAuthMode('secure');
            const currentSession = await authService.getSession().catch(() => null);
            setSession(currentSession);
            if (!currentSession) {
              setShowAuth('login');
            } else {
              const email = currentSession.user.email || '';
              const isDev = isVinetelligenceAdmin(email) || currentSession.user.user_metadata?.role === 'Developer';
              const isOwner = currentSession.user.user_metadata?.role === 'Owner' || currentSession.user.user_metadata?.role === 'Investor';
              
              let ownedCountVal = 0;
              if (email && !isDev) {
                ownedCountVal = await supabaseSync.getOwnedRestaurantCount(email).catch(() => 0);
                setOwnedCount(ownedCountVal);
              } else if (isDev) {
                ownedCountVal = 999;
                setOwnedCount(999);
              }

              setIsDeveloper(isDev);
              const persistedView = localStorage.getItem('vinetelligence_active_view') as AppView | null;
              const hasPersistedView = persistedView && Object.values(AppView).includes(persistedView);

              if (hasPersistedView) {
                if (isDev) setDevToolsUnlocked(true);
                setActiveView(persistedView);
              } else if (isDev) {
                setDevToolsUnlocked(true);
                setActiveView(AppView.GLOBAL_LEDGER);
              } else if (isOwner) {
                // Vinetelligence Intelligence (Owner Analytics) is only for Enterprise Owners (multiple stores) or Staff
                const canSeeIntelligence = isDev || ownedCountVal > 1;
                setActiveView(canSeeIntelligence ? AppView.OWNER_ANALYTICS : AppView.DASHBOARD);
              } else {
                setActiveView(AppView.BAR_STATION);
              }
            }
          } else {
            const currentSession = await authService.getSession().catch(() => null);
            const hasRealSession = currentSession && currentSession.user.user_metadata?.restaurant_id && currentSession.user.user_metadata.restaurant_id !== 'demo-id';
            
            if (hasRealSession) {
              const rid = currentSession.user.user_metadata.restaurant_id;
              const cloudProfile = await supabaseSync.getRestaurantProfile(rid).catch(() => null);
              if (cloudProfile) {
                setSession(currentSession);
                setRestaurantProfile(cloudProfile);
                localStorage.setItem('vinetelligence_profile', JSON.stringify(cloudProfile));
                localStorage.setItem('vinea_profile', JSON.stringify(cloudProfile));
                setAuthMode('secure');
                const email = currentSession.user.email || '';
                const isDev = isVinetelligenceAdmin(email) || currentSession.user.user_metadata?.role === 'Developer';
                setIsDeveloper(isDev);
                
                const persistedView = localStorage.getItem('vinetelligence_active_view') as AppView | null;
                const hasPersistedView = persistedView && Object.values(AppView).includes(persistedView);

                if (hasPersistedView) {
                  if (isDev) setDevToolsUnlocked(true);
                  setActiveView(persistedView);
                } else if (isDev) {
                  setDevToolsUnlocked(true);
                  setActiveView(AppView.GLOBAL_LEDGER);
                } else {
                  setActiveView(AppView.BAR_STATION);
                }
                setInventory([]);
                setOrders([]);
                setJourneys([]);
              } else {
                setAuthMode('demo');
                setSession(currentSession);
              }
            } else {
              setAuthMode('demo');
              if (!currentSession) {
                const res = await authService.signInAnonymously().catch(() => ({ session: null }));
                setSession(res.session);
              } else {
                setSession(currentSession);
              }
            }
          }
        } else {
          const currentSession = await authService.getSession().catch(() => null);
          if (currentSession && currentSession.user.user_metadata?.restaurant_id && currentSession.user.user_metadata.restaurant_id !== 'demo-id') {
            const rid = currentSession.user.user_metadata.restaurant_id;
            const cloudProfile = await supabaseSync.getRestaurantProfile(rid).catch(() => null);
            if (cloudProfile) {
              setSession(currentSession);
              setRestaurantProfile(cloudProfile);
              localStorage.setItem('vinetelligence_profile', JSON.stringify(cloudProfile));
              localStorage.setItem('vinea_profile', JSON.stringify(cloudProfile));
              localStorage.setItem('vinetelligence_onboarded', 'true');
              localStorage.setItem('vinea_onboarded', 'true');
              setAuthMode('secure');
              const email = currentSession.user.email || '';
              const isDev = isVinetelligenceAdmin(email) || currentSession.user.user_metadata?.role === 'Developer';
              setIsDeveloper(isDev);
              
              const persistedView = localStorage.getItem('vinetelligence_active_view') as AppView | null;
              const hasPersistedView = persistedView && Object.values(AppView).includes(persistedView);

              if (hasPersistedView) {
                if (isDev) setDevToolsUnlocked(true);
                setActiveView(persistedView);
              } else if (isDev) {
                setDevToolsUnlocked(true);
                setActiveView(AppView.GLOBAL_LEDGER);
              }
            } else {
              setShowOnboarding(true);
            }
          } else {
            setShowOnboarding(true);
          }
        }
      } catch (err) {
        console.error("Vinetelligence: Boot failed", err);
        setShowOnboarding(true);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();

    const handlePopState = () => initializeApp();
    window.addEventListener('popstate', handlePopState);

    const unsubscribe = authService.onAuthChange((newSession) => {
      setSession(newSession);
      if (newSession) {
        setShowAuth(null);
        setIsWelcomeBriefingOpen(true);
        const email = newSession.user.email || '';
        const isDev = isVinetelligenceAdmin(email) || newSession.user.user_metadata?.role === 'Developer';
        setIsDeveloper(isDev);
        if (isDev) setShowDevPortal(true);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    setSession, setIsDeveloper, setRestaurantProfile, setInventory, 
    setOrders, setJourneys, setIsReady, setAuthMode, setActiveView, 
    setOwnedCount, setDevToolsUnlocked
  ]);

  useEffect(() => {
    if (session?.user?.user_metadata?.role) {
      const userRole = session.user.user_metadata.role;
      setCurrentUserRole(userRole);
      const isAdmin = ['Owner', 'Manager', 'Developer', 'Investor'].includes(userRole);
      const isGuestDemo = restaurantProfile?.edition === 'demo' && restaurantProfile?.demoMode === 'guest';
      
      if (!isAdmin && activeView === AppView.DASHBOARD) {
        if (isGuestDemo) {
          setActiveView(AppView.CONCIERGE);
        } else {
          setActiveView(AppView.BAR_STATION);
        }
      }
    }
  }, [session, activeView, restaurantProfile, setActiveView, setCurrentUserRole]);

  const handlePublicExit = () => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('return_url');
    const referrer = document.referrer;

    const tableNum = publicTable || 'Digital';
    const savedJourneys = localStorage.getItem('vinetelligence_journeys') || localStorage.getItem('vinea_journeys');
    if (savedJourneys) {
      try {
        const journeys: GuestJourney[] = JSON.parse(savedJourneys);
        const updatedJourneys = journeys.map(j => 
          (j.tableNumber === tableNum && j.status !== 'Completed') 
            ? { ...j, status: 'Completed' as const } 
            : j
        );
        localStorage.setItem('vinetelligence_journeys', JSON.stringify(updatedJourneys));
        localStorage.setItem('vinea_journeys', JSON.stringify(updatedJourneys));
        setJourneys(updatedJourneys);
        
        const savedTables = localStorage.getItem('vinetelligence_tables') || localStorage.getItem('vinea_tables');
        if (savedTables && tableNum !== 'Digital') {
          const tables: Table[] = JSON.parse(savedTables);
          const updatedTables = tables.map(t => t.number === tableNum ? { 
            ...t, 
            status: 'Available' as const, 
            occupantName: undefined, 
            occupantCount: 0 
          } : t);
          localStorage.setItem('vinetelligence_tables', JSON.stringify(updatedTables));
          localStorage.setItem('vinea_tables', JSON.stringify(updatedTables));
          setTables(updatedTables);
          
          const updatedTable = updatedTables.find(t => t.number === tableNum);
          if (updatedTable && authMode === 'secure' && restaurantProfile?.id) {
            supabaseSync.saveTable(restaurantProfile.id, updatedTable).catch(() => {});
          }
        }
        
        const completedJourney = updatedJourneys.find(j => j.tableNumber === tableNum && j.status === 'Completed');
        if (completedJourney && authMode === 'secure' && restaurantProfile?.id) {
          supabaseSync.pushJourney(restaurantProfile.id, completedJourney).catch(() => {});
        }

        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error("Vinetelligence: Error completing journey on exit", e);
      }
    }

    if (restaurantProfile?.edition !== 'demo') {
      if (returnUrl) {
        // Safety: Do not redirect to internal platform bridge URLs which can cause unsafe frame loading errors
        if (returnUrl.includes('applet-auth-bridge')) {
          console.warn("Vinetelligence: Blocked unsafe redirect to auth bridge from within iframe");
          return;
        }
        window.location.href = returnUrl;
        return;
      }
      
      // For public entries, even in paid tiers, we want to return to the establishment page (promo/slug)
      // rather than just redirecting to the document referrer which might be a social media site
      if (isPublicEntry && restaurantProfile) {
        // Fall through to the slug/promo logic below
      } else if (referrer && !referrer.includes(window.location.origin)) {
        // Safety: Check if referrer is a bridge
        if (referrer.includes('applet-auth-bridge')) {
          console.warn("Vinetelligence: Blocked unsafe redirect to auth bridge referrer");
          return;
        }
        window.location.href = referrer;
        return;
      }
    }

    if (restaurantProfile?.edition === 'demo' && restaurantProfile?.demoMode === 'guest') {
      localStorage.removeItem('vinetelligence_profile');
      localStorage.removeItem('vinea_profile');
      localStorage.removeItem('vinetelligence_onboarded');
      localStorage.removeItem('vinea_onboarded');
      setRestaurantProfile(null);
      setShowOnboarding(true);
      return;
    }

    const pathname = window.location.pathname;
    const pathParts = pathname.split('/').filter(p => p);
    const hasSlug = pathParts.length > 0 && !pathname.includes('callback') && pathname !== '/';

    // If I came from a slug or a public landing, I should go back to the promo page
    if ((hasSlug || isPublicEntry) && restaurantProfile) {
      setPublicView('promo');
      setPublicTable(null);
      
      const targetSlug = restaurantProfile.slug || pathParts[0];
      if (targetSlug) {
        window.history.pushState({}, '', `/${targetSlug}`);
      } else {
        const url = new URL(window.location.href);
        url.search = `?view=promo&rid=${restaurantProfile.id}`;
        window.history.pushState({}, '', url.toString());
      }
      return;
    }

    setIsPublicRoute(false);
    setPublicView(null);
    setPublicRid(null);
    setPublicTable(null);
    setIsPublicEntry(false); // Reset entry flag when returning to app
    
    const url = new URL(window.location.href);
    url.search = '';
    window.history.pushState({}, '', url.toString());
    
    if (restaurantProfile?.edition !== 'demo' && !session) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = (profile: RestaurantProfile) => {
    setRestaurantProfile(profile);
    localStorage.setItem('vinetelligence_profile', JSON.stringify(profile));
    localStorage.setItem('vinea_profile', JSON.stringify(profile));
    localStorage.setItem('vinetelligence_onboarded', 'true');
    localStorage.setItem('vinea_onboarded', 'true');
    
    if (profile.edition !== 'demo' || isValidUUID(profile.id)) {
      localStorage.removeItem('vinetelligence_inventory');
      localStorage.removeItem('vinea_inventory');
      localStorage.removeItem('vinetelligence_orders');
      localStorage.removeItem('vinea_orders');
      localStorage.removeItem('vinetelligence_journeys');
      localStorage.removeItem('vinea_journeys');
      localStorage.removeItem('vinetelligence_staff');
      localStorage.removeItem('vinea_staff');
      setInventory([]);
      setOrders([]);
      setJourneys([]);
    }

    if (profile.edition === 'demo') {
      setShowOnboarding(false);
      setAuthMode('demo');
      if (profile.demoMode === 'guest') {
        const params = new URLSearchParams(window.location.search);
        params.set('view', 'guest');
        params.set('table', 'D1');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        window.location.reload();
      }
    } else {
      setShowOnboarding(false);
      setAuthMode('secure');
      setShowAuth('signup');
    }
  };

  const handleRelaunchOnboarding = useCallback(() => {
    setShowOnboarding(true);
    setShowAuth(null);
  }, []);

  const handleDevPortalSelect = (choice: 'demo' | 'investor' | 'enterprise') => {
    setShowDevPortal(false);
    if (choice === 'demo') {
      setAuthMode('demo');
      setActiveView(AppView.DASHBOARD);
    } else if (choice === 'investor') {
      setAuthMode('secure');
      setDevToolsUnlocked(true);
      setActiveView(AppView.INVESTOR);
    } else if (choice === 'enterprise') {
      setAuthMode('secure');
      setDevToolsUnlocked(true);
      setActiveView(AppView.NETWORK_ADMIN);
    }
  };

  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-indigo-950 flex flex-col items-center justify-center p-12 text-center font-serif">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-10"></div>
         <div className="relative z-10 space-y-8 animate-pulse">
            <h1 className="text-6xl font-black text-stone-100 tracking-tighter italic">Vinetelligence</h1>
            <div className="flex items-center gap-3 justify-center">
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.5em]">Initializing Intelligence</p>
         </div>
      </div>
    );
  }

  if (restaurantProfile && (restaurantProfile.status === 'Suspended' || restaurantProfile.status === 'Terminated')) {
    return (
      <div className="fixed inset-0 z-[9999] bg-stone-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-32 h-32 bg-indigo-500/20 text-indigo-500 rounded-full flex items-center justify-center text-5xl mx-auto shadow-[0_0_50px_rgba(79,70,229,0.3)]">
            <i className="fas fa-lock"></i>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-serif font-black text-white italic">Access Restricted</h1>
            <p className="text-stone-400 text-lg leading-relaxed italic">
              This establishment node ({restaurantProfile.name}) has been {restaurantProfile.status.toLowerCase()} by Vinetelligence Network Command. 
              Please contact your account manager for restoration protocols.
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-12 py-5 bg-white text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-200 transition-all shadow-xl"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ConnectivityMonitor />
      {showDevPortal && isDeveloper && (
        <DevPortal 
          userEmail={session?.user.email} 
          onSelect={handleDevPortalSelect} 
        />
      )}
      
      {isPublicRoute ? (
        <div className="min-h-screen bg-[#1c1917] overflow-y-auto touch-scrolling">
          {publicView === 'promo' && (
            <SocialPromo 
              profile={restaurantProfile!} 
              onBack={session ? () => setIsPublicRoute(false) : undefined}
              onOpenAvatarChat={() => setIsAIChatOpen(true)}
              onNavigate={(view) => {
                setPublicView(view);
                const parts = window.location.pathname.split('/').filter(p => p);
                if (parts.length > 0) {
                  const slug = parts[0];
                  const subPath = view === 'promo' ? '' : view;
                  window.history.pushState({}, '', `/${slug}${subPath ? '/' + subPath : ''}`);
                }
              }}
            />
          )}
          {publicView === 'book' && (
            <GuestReservationPortal 
              rid={publicRid || undefined}
              onComplete={handlePublicExit} 
              isPublic 
            />
          )}
          {publicView === 'menu' && (
            <VisitorMenu 
              table={{ id: 'pub-t', number: publicTable || 'Digital', capacity: 4, status: 'Occupied', x: 0, y: 0 }}
              inventory={inventory}
              activeOrders={orders.filter((o: ServiceOrder) => o.tableNumber === (publicTable || 'Digital'))}
              restaurantProfile={restaurantProfile}
              onPlaceOrder={(items) => {
                const tableNum = publicTable || 'Digital';
                const newOrder: ServiceOrder = {
                  id: `ORD-PUB-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  tableNumber: tableNum,
                  serverName: 'Guest (Web)',
                  items,
                  status: 'Pending',
                  priority: 'Normal',
                  source: 'Visitor'
                };
                
                const firedOrder = { ...newOrder, status: 'Pending' as const };
                addOrder(firedOrder);
                localStorage.setItem('vinetelligence_orders', JSON.stringify([firedOrder, ...orders]));
                localStorage.setItem('vinea_orders', JSON.stringify([firedOrder, ...orders]));
                
                if (authMode === 'secure' && restaurantProfile?.id) {
                  supabaseSync.saveOrder(restaurantProfile.id, newOrder).catch(() => {});
                }
 
                const updatedInventory = inventory.map((invItem: InventoryItem) => {
                  const orderedItem = items.find(i => i.name === invItem.name);
                  if (orderedItem) {
                    const decrementAmount = calculateDecrementAmount(orderedItem, invItem);
                    const newStock = Math.max(0, invItem.stock - decrementAmount);
                    const newConsumed = (invItem.consumed || 0) + decrementAmount;
                    const updatedItem = { ...invItem, stock: newStock, consumed: newConsumed };
                    
                    if (authMode === 'secure' && restaurantProfile?.id) {
                      supabaseSync.updateInventoryItem(restaurantProfile.id, updatedItem).catch(() => {});
                    }
                    
                    return updatedItem;
                  }
                  return invItem;
                });
                setInventory(updatedInventory);
                localStorage.setItem('vinetelligence_inventory', JSON.stringify(updatedInventory));
                localStorage.setItem('vinea_inventory', JSON.stringify(updatedInventory));
                window.dispatchEvent(new Event('storage'));
              }}
              onExit={handlePublicExit}
            />
          )}
        </div>
      ) : (
        <>
          {showOnboarding && (
            <Onboarding 
              currentUserEmail={session?.user?.email}
              onComplete={handleOnboardingComplete} 
              onSelectAuth={(mode) => { setShowAuth(mode); setShowOnboarding(false); }}
            />
          )}
          
          {showAuth && !showOnboarding && (
            <AuthView 
              initialMode={showAuth}
              onSuccess={async (newSession) => {
                setSession(newSession);
                setShowAuth(null);
                const email = newSession.user.email || '';
                const isDev = isVinetelligenceAdmin(email) || newSession.user.user_metadata?.role === 'Developer';
                setIsDeveloper(isDev);
                if (isDev) setShowDevPortal(true);

                setIsWelcomeBriefingOpen(true);

                const rid = newSession.user.user_metadata?.restaurant_id;
                if (rid && rid !== 'demo-id') {
                  try {
                    const profile = await supabaseSync.getRestaurantProfile(rid).catch(() => null);
                    if (profile) {
                      localStorage.removeItem('vinetelligence_inventory');
                      localStorage.removeItem('vinea_inventory');
                      localStorage.removeItem('vinetelligence_orders');
                      localStorage.removeItem('vinea_orders');
                      localStorage.removeItem('vinetelligence_journeys');
                      localStorage.removeItem('vinea_journeys');
                      localStorage.removeItem('vinetelligence_staff_list');
                      localStorage.removeItem('vinea_staff_list');
                      localStorage.removeItem('vinetelligence_tables');
                      localStorage.removeItem('vinea_tables');
                      localStorage.removeItem('vinetelligence_transactions');
                      localStorage.removeItem('vinea_transactions');
                      localStorage.removeItem('vinetelligence_draft_orders');
                      localStorage.removeItem('vinea_draft_orders');
                      
                      setInventory([]);
                      setOrders([]);
                      setJourneys([]);
                      
                      setRestaurantProfile(profile);
                      localStorage.setItem('vinetelligence_profile', JSON.stringify(profile));
                      localStorage.setItem('vinea_profile', JSON.stringify(profile));
                      localStorage.setItem('vinetelligence_onboarded', 'true');
                      localStorage.setItem('vinea_onboarded', 'true');
                      setAuthMode('secure');
                      
                      window.dispatchEvent(new Event('storage'));
                    }
                  } catch (e) {
                    console.error("Vinetelligence: Failed to restore profile after login", e);
                  }
                }
              }} 
              onAbort={() => {
                setShowAuth(null);
                if (!restaurantProfile) setShowOnboarding(true);
              }}
            />
          )}
          
          {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
          
          <Layout 
            activeView={activeView} 
            setActiveView={setActiveView} 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery}
            onOpenTutorial={() => setShowTutorial(true)}
            onLogout={handleLogout}
            onUpdateProfile={updateProfileValue}
            userSession={session}
            restaurantProfile={restaurantProfile}
            establishmentName={restaurantProfile?.name}
            isDeveloper={isDeveloper}
            ownedCount={ownedCount}
            devToolsUnlocked={devToolsUnlocked}
            onSetDevToolsUnlocked={setDevToolsUnlocked}
          >
            <AppViewManager 
              searchQuery={searchQuery}
              initialAcademyTab={initialAcademyTab}
              setInitialAcademyTab={setInitialAcademyTab}
              setIsAIChatOpen={setIsAIChatOpen}
              setIsPublicRoute={setIsPublicRoute}
              setPublicView={setPublicView}
              onRelaunchOnboarding={handleRelaunchOnboarding}
            />
          </Layout>
        </>
      )}

      {(showOnboarding || !isPublicRoute || (isPublicRoute && publicView === 'promo')) && (
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="fixed bottom-8 right-8 z-[1500] w-16 h-16 bg-emerald-500 text-[#141414] rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        >
          <i className="fas fa-brain text-2xl group-hover:animate-pulse"></i>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-[#141414] animate-bounce"></div>
          <div className="absolute right-full mr-4 bg-[#141414] border border-emerald-500/30 px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <p className="text-[10px] font-mono font-black text-emerald-500 uppercase tracking-widest">Live Coaching Active</p>
          </div>
        </button>
      )}

      {!isOnline && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4">
           <i className="fas fa-wifi-slash animate-pulse"></i>
           <p className="text-[10px] font-black uppercase tracking-widest">Offline Mode: Local Sync Active</p>
        </div>
      )}

      <AIAvatarChat 
        isOpen={isAIChatOpen} 
        onClose={() => setIsAIChatOpen(false)} 
        restaurantName={restaurantProfile?.name}
        isIntroMode={showOnboarding || (isPublicRoute && publicView === 'promo')}
        onUpdateProfile={(name, email, edition, type) => {
          const stored = localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
          let p = {
            id: 'demo-id',
            name: '',
            type: 'Restaurant',
            focus: 'Wine & Spirits',
            edition: 'demo',
            ownerEmail: '',
            slug: '',
            aiPersona: 'technical'
          };
          
          if (stored) {
            try {
              p = JSON.parse(stored);
            } catch (e) {
              console.error("Vinetelligence: AI profile update failed during parse", e);
            }
          }
          
          const updated = { 
            ...p, 
            name: name || p.name, 
            ownerEmail: email || p.ownerEmail,
            edition: edition || p.edition,
            type: type || p.type
          };
          
          localStorage.setItem('vinetelligence_profile', JSON.stringify(updated));
          localStorage.setItem('vinea_profile', JSON.stringify(updated));
          
          if (restaurantProfile) {
            setRestaurantProfile(updated);
          }
          
          // If we are in onboarding, signal it to advance
          if (showOnboarding) {
            localStorage.setItem('vinetelligence_ai_signal', 'advance');
          }
          
          // Send signal to components (like Onboarding) that storage updated
          window.dispatchEvent(new Event('storage'));
          console.log("Vinetelligence: Profile synced via AI assistance for establishment:", name);
        }}
      />

      <WelcomeBriefing 
        isOpen={isWelcomeBriefingOpen}
        onClose={() => setIsWelcomeBriefingOpen(false)}
        onOpenManual={() => {
          setIsWelcomeBriefingOpen(false);
          setShowTutorial(true);
        }}
        onOpenAIChat={() => {
          setIsWelcomeBriefingOpen(false);
          setIsAIChatOpen(true);
        }}
        userName={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "Operator"}
      />

      <SpeedInsights />
    </ErrorBoundary>
  );
};

export default App;

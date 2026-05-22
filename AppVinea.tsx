import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AppView, RestaurantProfile, ServiceOrder, InventoryItem, GuestJourney } from './lib/types';
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
import DemoExitModal from './components/modals/DemoExitModal';
import AppViewManager from './components/AppViewManager';
import { authService } from './services/authService';
import { supabaseSync } from './services/supabaseSync';
import { isSystemAdmin } from './lib/authUtils';
import { analyticsService } from './services/analyticsService';
import { INITIAL_INVENTORY } from './constants';
import { calculateDecrementAmount } from './lib/inventoryUtils';
import { useVinetelligenceStore } from './store/vinetelligenceStore';
import { useVinetelligenceInitialization } from './hooks/useVinetelligenceInitialization';
import { useVinetelligenceActions } from './hooks/useVinetelligenceActions';

import AppRoutes from './AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConnectivityMonitor } from './components/ConnectivityMonitor';

const AppVinea: React.FC = () => {
  console.log("Vinea: AppVinea component rendering");
  
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
  const setSession = useVinetelligenceStore(state => state.setSession);
  const setIsReady = useVinetelligenceStore(state => state.setIsReady);
  const setAuthMode = useVinetelligenceStore(state => state.setAuthMode);
  const setIsDeveloper = useVinetelligenceStore(state => state.setIsDeveloper);
  const setDevToolsUnlocked = useVinetelligenceStore(state => state.setDevToolsUnlocked);
  const setActiveView = useVinetelligenceStore(state => state.setActiveView);
  const setOwnedCount = useVinetelligenceStore(state => state.setOwnedCount);
  const setCurrentUserRole = useVinetelligenceStore(state => state.setCurrentUserRole);
  const addOrder = useVinetelligenceStore(state => state.addOrder);
  
  const setAIChatOpen = useVinetelligenceStore(state => state.setAIChatOpen);
  const isAIChatOpen = useVinetelligenceStore(state => state.isAIChatOpen);
  
  useVinetelligenceInitialization();
  const { handleLogout, updateProfileValue } = useVinetelligenceActions();

  const location = useLocation();

  const [initialAcademyTab, setInitialAcademyTab] = useState<'academy' | 'mixology' | 'signature' | 'roster' | 'pairing' | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isDemoExitModalOpen, setIsDemoExitModalOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<'login' | 'signup' | null>(null);
  const [onboardingSource, setOnboardingSource] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPublicRoute, setIsPublicRoute] = useState(false);
  
  // Auto-open AI Avatar for new visitors
  useEffect(() => {
    const hasBeenPrompted = sessionStorage.getItem('vinetelligence_auto_greeted');
    
    if (!hasBeenPrompted && !session && !isPublicRoute && !showOnboarding && !showAuth) {
      const timer = setTimeout(() => {
        setAIChatOpen(true);
        sessionStorage.setItem('vinetelligence_auto_greeted', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [session, isPublicRoute, showOnboarding, showAuth, setAIChatOpen]);
  
  const [publicView, setPublicView] = useState<'book' | 'menu' | 'promo' | null>(null);
  const [publicRid, setPublicRid] = useState<string | null>(null);
  const [publicTable, setPublicTable] = useState<string | null>(null);
  
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
      console.log("Vinea: AppVinea state changed", Object.fromEntries(changes));
    }
    prevStates.current = currentStates;
  }, [activeView, session, restaurantProfile, isReady, isPublicRoute, orders.length, inventory.length, journeys.length, authMode, showAuth, showOnboarding, isDeveloper, showDevPortal, devToolsUnlocked]);

  // Track Page Views via Google Analytics
  useEffect(() => {
    analyticsService.logPageView(`/${activeView}`);
    console.log("Vinea Analytics Sync: Page View Tracked", activeView);
    
    // Set dynamic, human-friendly webpage title based on active view in Vinea
    const cleanViewName = activeView 
      ? activeView.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
      : '';
    document.title = `Vinea AI${cleanViewName ? ` - ${cleanViewName}` : ' | Hospitality Service OS'}`;
    
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", "Vinea AI: Modern Hospitality Operating System. Unified guest operations, live cellar inventory synchronizations, and neural service guidelines.");
    }
  }, [activeView]);

  useEffect(() => {
    const initializeApp = async () => {
      analyticsService.initGA();

      // Pre-load dynamic server-provided Gemini API key
      try {
        const keyResponse = await fetch('/api/config/gemini-key').catch(() => null);
        if (keyResponse && keyResponse.ok) {
          const keyData = await keyResponse.json().catch(() => null);
          if (keyData && keyData.apiKey) {
            sessionStorage.setItem('vinetelligence_server_api_key', keyData.apiKey);
          }
        }
      } catch (err) {
        console.error("Vinea: Failed to pre-load sandbox keys", err);
      }

      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const ridParam = params.get('rid');
      const tableParam = params.get('table');
      
      const modeParam = params.get('mode');
      const authParam = params.get('auth');
      const onboardingParam = params.get('onboarding');
      const sourceParam = params.get('source');
      const demoParam = params.get('demo');
      
      // Auto-trigger Demo if requested via URL redirect
      if (demoParam === 'true') {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('demo');
        window.history.replaceState({}, '', newUrl.toString());
        handleInstantDemo();
        return;
      }

      // Auto-trigger onboarding if requested via URL
      if (onboardingParam === 'true') {
        setIsDemoMode(false);
        setShowOnboarding(true);
        if (sourceParam) setOnboardingSource(sourceParam);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('onboarding');
        newUrl.searchParams.delete('source');
        window.history.replaceState({}, '', newUrl.toString());
      }

      // Auto-trigger login if requested via URL
      if (modeParam === 'login' || authParam === 'login') {
        setShowAuth('login');
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('mode');
        newUrl.searchParams.delete('auth');
        window.history.replaceState({}, '', newUrl.toString());
      }

      const pathname = window.location.pathname;
      const pathParts = pathname.split('/').filter(p => p);
      const slugCandidate = pathParts[0];
      const subView = pathParts[1];

      // Handle direct sandbox access via mode=demo parameter
      if (modeParam === 'demo') {
        const demoProfile: RestaurantProfile = {
          id: 'demo-id',
          name: 'The Nebula Reserve (Demo)',
          ownerEmail: 'demo@vinetelligence.live',
          type: 'Restaurant',
          focus: 'Wine & Spirits',
          edition: 'demo',
          tier: 'Explorer',
          demoMode: 'operator',
          aiPersona: 'technical',
          subscriptionStatus: 'active'
        };
        
        localStorage.setItem('vinetelligence_profile', JSON.stringify(demoProfile));
        sessionStorage.setItem('vinetelligence_demo_active', 'true');
        
        setRestaurantProfile(demoProfile);
        setInventory(INITIAL_INVENTORY);
        setIsDemoMode(true);
        setShowOnboarding(true);
        setAuthMode('demo');
        setIsReady(true);
        window.history.pushState({}, '', '/');
        return;
      }

      // Handle direct slug access
      const RESERVED_SLUGS = [
        'login', 'signup', 'auth', 'settings', 'admin', 'developer', 'demo', 
        'callback', 'guest', 'api', 'vinetelligence', 'vinea', 'promo', 
        'promo.html', 'promo-pdf.html', 'competitor-matrix', 'competitor-matrix.html'
      ];
      if (slugCandidate && 
          !slugCandidate.toLowerCase().endsWith('.html') && 
          !RESERVED_SLUGS.includes(slugCandidate.toLowerCase()) && 
          !viewParam && !ridParam && !pathname.includes('callback') && pathname !== '/') {
         try {
            console.log("Vinea: Potentially resolving slug path:", slugCandidate);
            const slugProfile = await supabaseSync.getRestaurantBySlug(slugCandidate).catch(() => null);
            if (slugProfile) {
               console.log("Vinea: Established connection via slug:", slugCandidate, "subview:", subView);
               setIsPublicRoute(true);
               setIsPublicEntry(true);
               
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
            console.error("Vinea: Slug check failed", e);
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
            console.error("Vinea: Failed to fetch public profile", e);
          }
        } else if (targetRid === 'demo-id' || targetRid === 'demo') {
          setRestaurantProfile({
            id: 'demo-id',
            name: 'Vinetelligence Explorer (Demo)',
            type: 'Restaurant',
            focus: 'General',
            description: 'Demo Caribbean environment',
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
        console.log("Vinea: Booting application...");
        await supabaseSync.verifySchema().catch(() => {});

        const storedProfile = localStorage.getItem('vinetelligence_profile');
        const onboarded = localStorage.getItem('vinetelligence_onboarded') === 'true';
        const demoActive = sessionStorage.getItem('vinetelligence_demo_active') === 'true';
        
        if (storedProfile && (onboarded || demoActive)) {
          let p;
          try {
            p = JSON.parse(storedProfile);
          } catch (pe) {
            console.error("Vinea: Profile parse error", pe);
            p = null;
          }
          
          if (p) {
            const isDemo = p.edition === 'demo';
            
            if (isDemo && !demoActive) {
              console.log("Vinea: Demo profile found but inactive. Defaulting to landing.");
              setRestaurantProfile(null);
              setIsReady(true);
              return;
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            
            if (p.edition !== 'demo' && p.id && uuidRegex.test(p.id)) {
              const cloudProfile = await supabaseSync.getRestaurantProfile(p.id).catch(() => null);
              if (cloudProfile) {
                setRestaurantProfile(cloudProfile);
                localStorage.setItem('vinetelligence_profile', JSON.stringify(cloudProfile));
              } else {
                setRestaurantProfile(p);
              }
            } else {
              setRestaurantProfile(p);
            }

            if (!isDemo) {
              setAuthMode('secure');
              const currentSession = await authService.getSession().catch(() => null);
              setSession(currentSession);
              if (!currentSession) {
                setShowAuth('login');
              } else {
                const email = currentSession.user.email || '';
                const isDev = isSystemAdmin(email) || currentSession.user.user_metadata?.role === 'Developer';
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
                if (isDev) {
                  setDevToolsUnlocked(true);
                  setActiveView(AppView.GLOBAL_LEDGER);
                } else if (isOwner) {
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
                  setAuthMode('secure');
                  const email = currentSession.user.email || '';
                  const isDev = isSystemAdmin(email) || currentSession.user.user_metadata?.role === 'Developer';
                  setIsDeveloper(isDev);
                  if (isDev) {
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
             setShowOnboarding(false);
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
              localStorage.setItem('vinetelligence_onboarded', 'true');
              setAuthMode('secure');
              const email = currentSession.user.email || '';
              const isDev = isSystemAdmin(email) || currentSession.user.user_metadata?.role === 'Developer';
              setIsDeveloper(isDev);
              if (isDev) {
                setDevToolsUnlocked(true);
                setActiveView(AppView.GLOBAL_LEDGER);
              }
            } else {
              setShowOnboarding(false);
            }
          } else {
            setShowOnboarding(false);
          }
        }
      } catch (err) {
        console.error("Vinea: Boot failed", err);
        setShowOnboarding(false);
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
        const isDev = isSystemAdmin(email) || newSession.user.user_metadata?.role === 'Developer';
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
    setOwnedCount, setDevToolsUnlocked, location.search
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
    const savedJourneys = localStorage.getItem('vinetelligence_journeys');
    if (savedJourneys) {
      try {
        const journeys: GuestJourney[] = JSON.parse(savedJourneys);
        const updatedJourneys = journeys.map(j => 
          (j.tableNumber === tableNum && j.status !== 'Completed') 
            ? { ...j, status: 'Completed' as const } 
            : j
        );
        localStorage.setItem('vinetelligence_journeys', JSON.stringify(updatedJourneys));
        setJourneys(updatedJourneys);
      } catch (e) {
        console.error("Vinea: Failed page exit sync", e);
      }
    }

    if (returnUrl) {
      window.location.href = returnUrl;
      return;
    }
    if (referrer && !referrer.includes(window.location.hostname)) {
      window.location.href = referrer;
      return;
    }
    
    setIsPublicRoute(false);
    setPublicView(null);
    setPublicTable(null);
    setPublicRid(null);
    setIsPublicEntry(false);
    
    // Clean query parameters and path
    const url = new URL(window.location.href);
    url.search = '';
    url.pathname = '/';
    window.history.pushState({}, '', url.toString());
  };

  const handleOnboardingComplete = (profile: RestaurantProfile) => {
    if (profile) {
      setRestaurantProfile(profile);
      localStorage.setItem('vinetelligence_profile', JSON.stringify(profile));
      localStorage.setItem('vinetelligence_onboarded', 'true');
      setShowOnboarding(false);
      
      if (profile.edition !== 'demo') {
        setAuthMode('secure');
      } else {
        setAuthMode('demo');
      }

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

  const handleInstantDemo = () => {
    console.log("Vinea: Triggering Instant Demo Access");
    const demoProfile: RestaurantProfile = {
      id: 'demo-id',
      name: 'The Nebula Reserve (Demo)',
      ownerEmail: 'demo@vinetelligence.live',
      type: 'Restaurant',
      focus: 'Wine & Spirits',
      edition: 'demo',
      tier: 'Explorer',
      demoMode: 'operator',
      aiPersona: 'technical',
      subscriptionStatus: 'active'
    };
    
    localStorage.setItem('vinetelligence_profile', JSON.stringify(demoProfile));
    sessionStorage.setItem('vinetelligence_demo_active', 'true');
    setRestaurantProfile(demoProfile);
    setInventory(INITIAL_INVENTORY);
    setIsDemoMode(true);
    setShowOnboarding(true);
    setAuthMode('demo');
    
    if (!session) {
      authService.signInAnonymously().then(res => {
        if (res.session) setSession(res.session);
      });
    }

    setIsReady(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleInternalLogout = () => {
    if (restaurantProfile?.edition === 'demo') {
      setIsDemoExitModalOpen(true);
    } else {
      handleLogout();
    }
  };

  const handleDemoExitChoice = (choice: 'essential' | 'growth' | 'later') => {
    setIsDemoExitModalOpen(false);
    
    localStorage.removeItem('vinetelligence_profile');
    localStorage.removeItem('vinetelligence_onboarded');
    localStorage.removeItem('vinetelligence_inventory');
    localStorage.removeItem('vinetelligence_orders');
    localStorage.removeItem('vinetelligence_journeys');
    localStorage.removeItem('vinetelligence_staff_list');
    
    setRestaurantProfile(null);
    setIsDemoMode(false);

    if (choice === 'later') {
      setIsPublicRoute(false);
      setShowOnboarding(false);
      setOnboardingSource(undefined);
      const url = new URL(window.location.href);
      url.search = '';
      window.history.pushState({}, '', url.toString());
    } else {
      setOnboardingSource(`demo_${choice}`);
      setShowOnboarding(true);
    }
  };

  if (!isReady) {
    return (
      <div className="fixed inset-0 bg-indigo-950 flex flex-col items-center justify-center p-12 text-center font-serif">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-10"></div>
         <div className="relative z-10 space-y-8 animate-pulse">
            <h1 className="text-6xl font-black text-stone-100 tracking-tighter italic">Vinea AI</h1>
            <div className="flex items-center gap-3 justify-center">
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
               <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Service Intelligence</p>
         </div>
      </div>
    );
  }

  const isVinetelligenceDomain = typeof window !== 'undefined' && window.location.hostname.includes('vinetelligence.live');

  // Show Fallback/Multi-Page Website if not logged in and not on an OS route
  if (!session && !isPublicRoute && !showOnboarding && !showAuth) {
    return (
      <ErrorBoundary>
        <AppRoutes 
          onEnterDemo={handleInstantDemo} 
          onStartOnboarding={() => {
            if (isVinetelligenceDomain) {
              window.location.href = 'https://vinea.live?onboarding=true';
              return;
            }
            setIsDemoMode(false);
            setShowOnboarding(true);
          }}
          onLogin={() => {
            if (isVinetelligenceDomain) {
              window.location.href = 'https://vinea.live?mode=login';
              return;
            }
            setShowAuth('login');
          }}
        />
        
        <button
          onClick={() => setAIChatOpen(true)}
          className="fixed bottom-8 right-8 z-[1500] w-16 h-16 bg-emerald-950 text-[#141414] rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-2 border-emerald-500 overflow-hidden"
        >
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
            className="w-full h-full object-cover"
            alt="AI Specialist"
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#141414] animate-bounce"></div>
          <div className="absolute right-full mr-4 bg-stone-950 border border-emerald-500/30 px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
            <p className="text-[10px] font-mono font-black text-emerald-500 uppercase tracking-widest">Neural Specialist Active</p>
          </div>
        </button>

        <AIAvatarChat 
          isOpen={isAIChatOpen} 
          onClose={() => setAIChatOpen(false)} 
          restaurantName={restaurantProfile?.name}
          isIntroMode={true}
        />
        <SpeedInsights />
      </ErrorBoundary>
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
              This establishment node ({restaurantProfile.name}) has been {restaurantProfile.status.toLowerCase()} by Vinea Network Command. 
              Please contact your corporate node for restoration protocols.
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
              onOpenAvatarChat={() => setAIChatOpen(true)}
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
              isDemo={isDemoMode}
              source={onboardingSource}
            />
          )}
          
          {showAuth && !showOnboarding && (
            <AuthView 
              initialMode={showAuth}
              onSuccess={async (newSession) => {
                setSession(newSession);
                setShowAuth(null);
                const email = newSession.user.email || '';
                const isDev = isSystemAdmin(email) || newSession.user.user_metadata?.role === 'Developer';
                setIsDeveloper(isDev);
                if (isDev) setShowDevPortal(true);

                setIsWelcomeBriefingOpen(true);

                const rid = newSession.user.user_metadata?.restaurant_id;
                if (rid && rid !== 'demo-id') {
                  try {
                    const profile = await supabaseSync.getRestaurantProfile(rid).catch(() => null);
                    if (profile) {
                      localStorage.removeItem('vinetelligence_inventory');
                      localStorage.removeItem('vinetelligence_orders');
                      localStorage.removeItem('vinetelligence_journeys');
                      localStorage.removeItem('vinetelligence_staff_list');
                      localStorage.removeItem('vinetelligence_tables');
                      localStorage.removeItem('vinetelligence_transactions');
                      localStorage.removeItem('vinetelligence_draft_orders');
                      
                      setInventory([]);
                      setOrders([]);
                      setJourneys([]);
                      
                      setRestaurantProfile(profile);
                      localStorage.setItem('vinetelligence_profile', JSON.stringify(profile));
                      localStorage.setItem('vinetelligence_onboarded', 'true');
                      setAuthMode('secure');
                      
                      window.dispatchEvent(new Event('storage'));
                    }
                  } catch (e) {
                    console.error("Vinea: Failed to restore profile after login", e);
                  }
                }
              }} 
              onAbort={() => {
                setShowAuth(null);
                setShowOnboarding(false);
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
            onLogout={handleInternalLogout}
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
              setAIChatOpen={setAIChatOpen}
              setIsPublicRoute={setIsPublicRoute}
              setPublicView={setPublicView}
              onRelaunchOnboarding={handleRelaunchOnboarding}
            />
          </Layout>
        </>
      )}

      {(showOnboarding || !isPublicRoute || (isPublicRoute && publicView === 'promo')) && (
        <button
          onClick={() => setAIChatOpen(true)}
          className="fixed bottom-8 right-8 z-[1500] w-16 h-16 bg-emerald-950 text-[#141414] rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-2 border-emerald-500 overflow-hidden"
        >
          <img 
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
            className="w-full h-full object-cover"
            alt="AI Specialist"
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#141414] animate-bounce"></div>
          <div className="absolute right-full mr-4 bg-stone-950 border border-emerald-500/30 px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl">
            <p className="text-[10px] font-mono font-black text-emerald-500 uppercase tracking-widest">Neural Specialist Active</p>
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
        onClose={() => setAIChatOpen(false)} 
        restaurantName={restaurantProfile?.name}
        isIntroMode={showOnboarding || (isPublicRoute && publicView === 'promo')}
        onUpdateProfile={(name, email, edition, type) => {
          const stored = localStorage.getItem('intelligence_profile') || localStorage.getItem('oenovia_profile') || localStorage.getItem('vinetelligence_profile') || localStorage.getItem('vinea_profile');
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
              console.error("Vinea: AI profile update failed reference", e);
            }
          }
          
          const updated = { 
            ...p, 
            name: name || p.name, 
            ownerEmail: email || p.ownerEmail,
            edition: edition || p.edition,
            type: type || p.type
          };
          
          localStorage.setItem('intelligence_profile', JSON.stringify(updated));
          localStorage.setItem('oenovia_profile', JSON.stringify(updated));
          localStorage.setItem('vinetelligence_profile', JSON.stringify(updated));
          localStorage.setItem('vinea_profile', JSON.stringify(updated));
          
          if (restaurantProfile) {
            setRestaurantProfile(updated);
          }
          
          if (showOnboarding) {
            localStorage.setItem('intelligence_ai_signal', 'advance');
            localStorage.setItem('vinetelligence_ai_signal', 'advance');
          }
          
          window.dispatchEvent(new Event('storage'));
          console.log("Vinea: Profile synced via AI guidance for establishment:", name);
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
          setAIChatOpen(true);
        }}
        userName={session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "Operator"}
      />

      <DemoExitModal 
        isOpen={isDemoExitModalOpen}
        onClose={() => setIsDemoExitModalOpen(false)}
        onLater={() => handleDemoExitChoice('later')}
        onProceed={(tier) => handleDemoExitChoice(tier)}
      />

      <SpeedInsights />
    </ErrorBoundary>
  );
};

export default AppVinea;

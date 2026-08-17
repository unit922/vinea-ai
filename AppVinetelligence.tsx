import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SpeedInsights } from "@vercel/speed-insights/react";
import AppRoutes from './AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';
import AIAvatarChat from './components/AIAvatarChat';
import { analyticsService } from './services/analyticsService';

const AppVinetelligence: React.FC = () => {
  const [isAIChatOpen, setAIChatOpen] = useState<boolean>(false);
  const location = useLocation();

  // Initialize Analytics
  useEffect(() => {
    analyticsService.initGA();
  }, []);

  // Track Page Views via Google Analytics on Route/Location change
  useEffect(() => {
    analyticsService.logPageView(location.pathname + location.search);
    console.log("Vinetelligence Analytics Sync: Page View Tracked", location.pathname + location.search);
  }, [location]);

  // Auto-open AI Avatar for new visitors
  useEffect(() => {
    // Set webpage title & dynamic descriptors for Vinetelligence
    document.title = "Vinetelligence | AI-Powered Hospitality Excellence";
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", "Vinetelligence AI: Global leader in AI-Powered Hospitality. Professional SaaS infrastructure for beverage programs, predictive inventory, and human-centric service mastery.");
    }
    
    const hasBeenPrompted = sessionStorage.getItem('vinetelligence_auto_greeted');
    if (!hasBeenPrompted) {
      const timer = setTimeout(() => {
        setAIChatOpen(true);
        sessionStorage.setItem('vinetelligence_auto_greeted', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const getTargetApp = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('vinea')) {
        return 'vinea';
      }
    }
    return 'vinetelligence';
  };

  const handleInstantDemo = () => {
    analyticsService.logEvent('Public Landing', 'Instant Demo Clicked');
    if (typeof window !== 'undefined') {
      const targetApp = getTargetApp();
      localStorage.setItem('platform_selected_app', targetApp);
      localStorage.setItem('vinetelligence_preview_target', targetApp);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('demo', 'true');
      window.history.replaceState({}, '', newUrl.toString());
      window.location.reload();
    }
  };

  const handleStartOnboarding = () => {
    analyticsService.logEvent('Public Landing', 'Onboarding Started');
    if (typeof window !== 'undefined') {
      const targetApp = getTargetApp();
      localStorage.setItem('platform_selected_app', targetApp);
      localStorage.setItem('vinetelligence_preview_target', targetApp);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('onboarding', 'true');
      window.history.replaceState({}, '', newUrl.toString());
      window.location.reload();
    }
  };

  const handleLogin = () => {
    analyticsService.logEvent('Public Landing', 'Login Clicked');
    if (typeof window !== 'undefined') {
      const targetApp = getTargetApp();
      localStorage.setItem('platform_selected_app', targetApp);
      localStorage.setItem('vinetelligence_preview_target', targetApp);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('mode', 'login');
      window.history.replaceState({}, '', newUrl.toString());
      window.location.reload();
    }
  };

  return (
    <ErrorBoundary>
      <AppRoutes 
        onEnterDemo={handleInstantDemo} 
        onStartOnboarding={handleStartOnboarding}
        onLogin={handleLogin}
      />
      
      {/* Neural Specialist AI Chat Button */}
      <button
        onClick={() => setAIChatOpen(true)}
        className="fixed bottom-8 right-8 z-[1500] w-16 h-16 bg-emerald-950 text-[#141414] rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-2 border-emerald-500 overflow-hidden"
        id="neural-chat-trigger"
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
        isIntroMode={true}
      />
      <SpeedInsights />
    </ErrorBoundary>
  );
};

export default AppVinetelligence;

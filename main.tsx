import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import AppVinea from './AppVinea';
import AppVinetelligence from './AppVinetelligence';
import './index.css';

console.log("Vinetelligence/Vinea Dual-Platform selector booting in main.tsx");

// Global error handling
window.addEventListener('error', (event) => {
    console.error("Platform: Global Error Caught:", event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error("Platform: Unhandled Rejection Detected");
    console.error("Reason:", event.reason);
    
    if (event.reason instanceof Error) {
        console.error("Stack Trace:", event.reason.stack);
    }
});

type AppMode = 'vinetelligence' | 'vinea' | 'marketing';

const AppSelectorRoot: React.FC = () => {
  // Check if there is an explicit environment-isolated target set (like inside production Vercel builds)
  const isIsolatedTarget = 
    import.meta.env?.VITE_APP_TARGET === 'vinea' || 
    import.meta.env?.VITE_APP_TARGET === 'vinetelligence' || 
    import.meta.env?.VITE_APP_TARGET === 'marketing';

  const [appMode, setAppMode] = useState<AppMode>(() => {
    // 1. Production hostname checks HAVE ABSOLUTE HIGHEST PRIORITY under all circumstances to prevent multi-tenant app crossover
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('vinea.live')) {
        return 'vinea';
      }
      if (hostname.includes('vinetelligence.live')) {
        const stored = localStorage.getItem('platform_selected_app');
        if (stored === 'vinetelligence') {
          return 'vinetelligence';
        }
        return 'marketing';
      }
    }

    // 2. URL parameter overrides has next priority (for developer sandbox previews)
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app');
    if (appParam === 'vinea' || appParam === 'vinetelligence' || appParam === 'marketing') {
      localStorage.setItem('platform_selected_app', appParam);
      return appParam;
    }

    // 3. Explicit environment-isolated target has priority for standard isolated builds
    if (isIsolatedTarget) {
      return import.meta.env.VITE_APP_TARGET as AppMode;
    }

    // 4. Fallback to other subdomains or local keywords for development
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname.includes('vinea')) {
        return 'vinea';
      }
      if (hostname.includes('vinetelligence')) {
        const stored = localStorage.getItem('platform_selected_app');
        if (stored === 'vinetelligence') {
          return 'vinetelligence';
        }
        return 'marketing';
      }
    }
    
    // 5. Fallback to LocalStorage for development & sandbox switching
    const stored = localStorage.getItem('platform_selected_app');
    if (stored === 'vinea' || stored === 'vinetelligence' || stored === 'marketing') {
      return stored as AppMode;
    }
    
    // 5. Default fallback to Vinetelligence Portal
    return 'vinetelligence';
  });

  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  useEffect(() => {
    // Clear URL param to keep it clean
    const params = new URLSearchParams(window.location.search);
    if (params.has('app')) {
      params.delete('app');
      const cleanSearch = params.toString();
      const newUrl = `${window.location.pathname}${cleanSearch ? '?' + cleanSearch : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleSwitchApp = (mode: AppMode) => {
    localStorage.setItem('platform_selected_app', mode);
    setAppMode(mode);
    
    // Reload to ensure all store instances and states clear and reload fresh
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const renderActiveApp = () => {
    switch (appMode) {
      case 'vinea':
        return <AppVinea />;
      case 'marketing':
        return <AppVinetelligence />;
      case 'vinetelligence':
      default:
        return <App />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {renderActiveApp()}

      {/* Dynamic Comparison & Brand Switcher Dock (Floating preview utility) */}
      {!isIsolatedTarget && (
        <div className="fixed bottom-24 left-4 md:bottom-4 md:left-[280px] z-[9999] flex flex-col-reverse gap-2">
          <button
            onClick={() => setIsComparisonOpen(!isComparisonOpen)}
            className="px-4 py-3 bg-[#0c0a09]/95 text-stone-200 border border-stone-800 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.5)] flex items-center gap-3 text-[11px] font-black uppercase tracking-widest hover:bg-stone-900 transition-all pointer-events-auto backdrop-blur-md"
          >
            <i className="fas fa-arrows-spin text-indigo-500 animate-spin duration-[10s]"></i>
            <span>App Switcher & Comparison</span>
            <i className={`fas ${isComparisonOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-stone-500 ml-1`}></i>
          </button>

          {isComparisonOpen && (
            <div className="w-[380px] bg-[#0c0a09]/95 border border-stone-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300 backdrop-blur-md text-stone-300">
              <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Layout Comparison</h4>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-wider">Compare Brand Architectures</p>
                </div>
                <button 
                  onClick={() => setIsComparisonOpen(false)}
                  className="w-6 h-6 rounded-full bg-stone-900 hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white transition-all"
                >
                  <i className="fas fa-times text-[10px]"></i>
                </button>
              </div>

              {/* Selection Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSwitchApp('vinetelligence')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    appMode === 'vinetelligence'
                      ? 'bg-indigo-950/20 border-indigo-500/50 text-white'
                      : 'bg-stone-950 border-stone-900 hover:bg-stone-900/50 text-stone-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] ${
                    appMode === 'vinetelligence' ? 'bg-indigo-500 text-white' : 'bg-stone-900 text-stone-500'
                  }`}>
                    <i className="fas fa-server"></i>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-wider leading-none">Vinetelligence Portal</p>
                    <p className="text-[9px] text-stone-500 leading-normal">Operational AI engine, inventory predictions & staff training.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSwitchApp('vinea')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    appMode === 'vinea'
                      ? 'bg-amber-950/20 border-amber-500/50 text-white'
                      : 'bg-stone-950 border-stone-900 hover:bg-stone-900/50 text-stone-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] ${
                    appMode === 'vinea' ? 'bg-amber-500 text-white' : 'bg-stone-900 text-stone-500'
                  }`}>
                    <i className="fas fa-wine-glass"></i>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-wider leading-none">Vinea AI System</p>
                    <p className="text-[9px] text-stone-500 leading-normal">Hospitality Service OS, sommelier vectors & cellar mapping.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSwitchApp('marketing')}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    appMode === 'marketing'
                      ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                      : 'bg-stone-950 border-stone-900 hover:bg-stone-900/50 text-stone-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] ${
                    appMode === 'marketing' ? 'bg-emerald-500 text-white' : 'bg-stone-900 text-stone-500'
                  }`}>
                    <i className="fas fa-globe"></i>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black uppercase tracking-wider leading-none">Corporate Website</p>
                    <p className="text-[9px] text-stone-500 leading-normal">Public presentations, ROI calculators & product tours.</p>
                  </div>
                </button>
              </div>

              {/* Quick Summary Comparison Card */}
              <div className="bg-stone-950 border border-stone-900 rounded-2xl p-4 space-y-3">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Platform Comparisons</h5>
                <div className="grid grid-cols-2 gap-3 text-[9px] text-stone-400 leading-relaxed font-mono">
                  <div className="space-y-1.5 border-r border-stone-900 pr-2">
                    <p className="text-white font-black uppercase tracking-wider">Vinetelligence</p>
                    <p>• Royal Blue Theme</p>
                    <p>• Inter UI Sans</p>
                    <p>• Predictive Logistics</p>
                    <p>• Heavy Backend SaaS</p>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    <p className="text-white font-black uppercase tracking-wider">Vinea AI</p>
                    <p>• Elegant Amber/Stone</p>
                    <p>• Sophisticated Serifs</p>
                    <p>• Guest Taste Mapping</p>
                    <p>• Sommelier Focused</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');

if (!rootElement) {
    console.error("Vinetelligence: Root element not found!");
} else {
    try {
        const root = ReactDOM.createRoot(rootElement);
        root.render(
            <React.StrictMode>
              <BrowserRouter>
                <AppSelectorRoot />
              </BrowserRouter>
            </React.StrictMode>
        );
        console.log("Vinetelligence/Vinea Selector: React loaded successfully");
    } catch (error) {
        console.error("Platform: Critical initialization error:", error);
        rootElement.innerHTML = `
            <div style="padding: 20px; color: white; background: red;">
                <h1>Critical Initialization Error</h1>
                <pre>${error instanceof Error ? error.stack : String(error)}</pre>
            </div>
        `;
    }
}


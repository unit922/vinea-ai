import React from 'react';
import AppVinea from './AppVinea';
import AppVinetelligence from './AppVinetelligence';

const App: React.FC = () => {
  // Determine target application:
  // 1. Check build-time VITE_APP_TARGET environment variable (configured in Vercel project settings)
  // 2. Fall back to runtime hostname detection (vinetelligence.live domains represent the marketing site; other domains represent Vinea)
  const target = import.meta.env.VITE_APP_TARGET || 
    (typeof window !== 'undefined' && window.location.hostname.includes('vinetelligence.live') 
      ? 'vinetelligence' 
      : 'vinea');

  console.log("Vinetelligence Workspace: Routing target to:", target);

  if (target === 'vinetelligence') {
    return <AppVinetelligence />;
  }

  return <AppVinea />;
};

export default App;

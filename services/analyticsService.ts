import ReactGA from 'react-ga4';

// Dynamically select Google Analytics Measurement ID depending on the active domain
const getMeasurementId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  const hostname = window.location.hostname;
  const isVinetelligence = hostname.includes('vinetelligence.live');
  
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  const vinetelligenceId = import.meta.env.VITE_GA_VINETELLIGENCE_ID;
  
  if (isVinetelligence) {
    // If on Vinetelligence, prioritize custom tracker ID, with a solid default to user's specified tracker
    return (vinetelligenceId && vinetelligenceId.indexOf('VITE_') === -1) ? vinetelligenceId : "G-3YVY58JCNJ";
  }
  
  return (gaId && gaId.indexOf('VITE_') === -1) ? gaId : undefined;
};

const GA_MEASUREMENT_ID = getMeasurementId();

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    try {
      ReactGA.initialize(GA_MEASUREMENT_ID);
      console.log('Analytics Sync: Google Analytics Initialized at runtime', GA_MEASUREMENT_ID);
    } catch (e) {
      console.error('Analytics Sync: Error during ReactGA initialize', e);
    }
  } else {
    console.warn('Analytics Sync: No active Google Analytics ID found for this domain. Tracking isolated.');
  }
};

export const logPageView = (path: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const logEvent = (category: string, action: string, label?: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
    });
  }
};

export const analyticsService = {
  initGA,
  logPageView,
  logEvent,
};

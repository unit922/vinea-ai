import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('Analytics Sync: Google Analytics Initialized', GA_MEASUREMENT_ID);
  } else {
    console.warn('Analytics Sync: VITE_GOOGLE_ANALYTICS_ID not found. Tracking disabled.');
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

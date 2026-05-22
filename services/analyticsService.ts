import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || process.env.VITE_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag: (command: string, action: string, params?: Record<string, unknown>) => void;
  }
}

export const initGA = () => {
  // Initialize GA4
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log('Analytics Sync: Google Analytics Initialized', GA_MEASUREMENT_ID);
  } else {
    console.warn('Analytics Sync: VITE_GA_MEASUREMENT_ID not found. GA Tracking disabled.');
  }

  // Google Tag (gtag.js) is already hardcoded in index.html for maximum performance
  console.log('Analytics Sync: Google Tag (gtag.js) Initialized via index.html');
};

export const logPageView = (path: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }

  // Push Page View to gtag
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      vinetelligence_view: path
    });
    console.log('Analytics Sync: gtag Page View Pushed', path);
  }
};

export const logEvent = (category: string, action: string, label?: string, value?: number) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
  }

  // Push Event to gtag
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

export const analyticsService = {
  initGA,
  logPageView,
  logEvent,
};

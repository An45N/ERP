/**
 * Analytics integration for Google Analytics and Plausible
 */

// Google Analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    plausible?: (...args: any[]) => void;
  }
}

/**
 * Initialize Google Analytics
 */
export function initGoogleAnalytics() {
  if (import.meta.env.VITE_ENABLE_ANALYTICS !== 'true') {
    console.log('Analytics is disabled');
    return;
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  // Load GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.gtag = function() {
    // @ts-ignore
    window.dataLayer = window.dataLayer || [];
    // @ts-ignore
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false, // We'll send manually
  });
}

/**
 * Initialize Plausible Analytics
 */
export function initPlausible() {
  if (import.meta.env.VITE_ENABLE_ANALYTICS !== 'true') return;

  const domain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  if (!domain) return;

  const script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', domain);
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string) {
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    });
  }

  // Plausible (auto-tracks page views)
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, properties);
  }

  // Plausible
  if (window.plausible) {
    window.plausible(eventName, { props: properties });
  }
}

/**
 * Track user action
 */
export function trackAction(action: string, category: string, label?: string, value?: number) {
  trackEvent(action, {
    event_category: category,
    event_label: label,
    value,
  });
}

/**
 * Track error
 */
export function trackError(error: Error, context?: string) {
  trackEvent('error', {
    error_message: error.message,
    error_stack: error.stack,
    context,
  });
}

/**
 * Track conversion
 */
export function trackConversion(conversionId: string, value?: number) {
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: conversionId,
      value,
    });
  }
}

import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

/**
 * Web Vitals performance monitoring
 * Tracks Core Web Vitals and sends to analytics endpoint
 */

function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  });

  // Send to custom endpoint
  const endpoint = import.meta.env.VITE_WEB_VITALS_ENDPOINT;
  if (endpoint) {
    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
    } else {
      fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(console.error);
    }
  }

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating);
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals() {
  if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING !== 'true') {
    console.log('Performance monitoring is disabled');
    return;
  }

  // Cumulative Layout Shift (CLS)
  onCLS(sendToAnalytics);

  // Interaction to Next Paint (INP) - replaces FID in web-vitals v4
  onINP(sendToAnalytics);

  // First Contentful Paint (FCP)
  onFCP(sendToAnalytics);

  // Largest Contentful Paint (LCP)
  onLCP(sendToAnalytics);

  // Time to First Byte (TTFB)
  onTTFB(sendToAnalytics);
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domInteractive: navigation.domInteractive - navigation.fetchStart,
    domComplete: navigation.domComplete - navigation.fetchStart,
    loadComplete: navigation.loadEventEnd - navigation.fetchStart,

    // Paint timing
    fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    
    // Memory (if available)
    memory: (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
    } : null,
  };
}

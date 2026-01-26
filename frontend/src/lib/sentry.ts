import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  if (import.meta.env.VITE_ENABLE_ERROR_TRACKING !== 'true') {
    console.log('Sentry error tracking is disabled');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Release tracking
    release: `erp-frontend@${import.meta.env.VITE_APP_VERSION}`,
    // Before send hook to filter sensitive data
    beforeSend(event: Sentry.ErrorEvent, _hint: Sentry.EventHint) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['Cookie'];
        }
      }
      return event;
    },
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Set user context
 */
export function setUserContext(user: { id: string; email: string; name: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

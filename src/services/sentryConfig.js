import * as Sentry from 'sentry-expo';

// Initialize Sentry for error monitoring
export const initSentry = () => {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN_HERE', // Replace with your actual Sentry DSN
    enableInExpoDevelopment: true,
    debug: __DEV__, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
    environment: __DEV__ ? 'development' : 'production',
  });
};

// Error logging utility
export const logError = (error, context = {}) => {
  console.error('Error logged to Sentry:', error, context);
  
  if (__DEV__) {
    // In development, just log to console
    console.error('Error:', error);
    console.error('Context:', context);
  } else {
    // In production, send to Sentry
    Sentry.Native.captureException(error, {
      contexts: {
        custom: context
      }
    });
  }
};

// User identification for Sentry
export const setSentryUser = (user) => {
  if (user) {
    Sentry.Native.setUser({
      id: user.uid,
      email: user.email,
      username: user.displayName,
      // Add any other user context
    });
  } else {
    Sentry.Native.setUser(null);
  }
};

// Breadcrumb logging
export const addBreadcrumb = (message, category = 'general', data = {}) => {
  Sentry.Native.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

// Performance monitoring
export const startTransaction = (name, operation) => {
  return Sentry.Native.startTransaction({
    name,
    operation,
  });
};

export default {
  initSentry,
  logError,
  setSentryUser,
  addBreadcrumb,
  startTransaction
};
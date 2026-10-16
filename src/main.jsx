import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Register service worker safely for installable PWA only in production
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({ immediate: true });
  } catch (e) {
    console.warn('PWA service worker registration notice:', e);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

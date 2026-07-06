import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {HelmetProvider} from 'react-helmet-async';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

console.trace('[Trace] main.tsx start');

// Setup Fetch and Axios Interceptors to secure APIs with active user tokens
if (typeof window !== 'undefined') {
  // Handle hash mismatches / chunk load failures by forcing a reload (once per session to avoid loops)
  window.addEventListener('error', (event) => {
    const isChunkLoadError = 
      event.message?.includes('Failed to fetch dynamically imported module') || 
      event.message?.includes('Importing a module script failed') ||
      (event.target && (event.target as any).tagName === 'SCRIPT' && !(event.target as any).src?.includes('sw.js'));

    if (isChunkLoadError) {
      const lastReload = sessionStorage.getItem('session_repair_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload) > 30000) {
        sessionStorage.setItem('session_repair_reload', now.toString());
        console.warn('[Critical Repair] Chunk load failure detected. Forcing page refresh...');
        window.location.reload();
      }
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || '';
    if (message.includes('Failed to fetch dynamically imported module') || message.includes('Importing a module script failed')) {
       console.warn('[Critical Repair] Promise rejection from failed chunk load.');
       const lastReload = sessionStorage.getItem('session_repair_reload');
       const now = Date.now();
       if (!lastReload || now - parseInt(lastReload) > 30000) {
        sessionStorage.setItem('session_repair_reload', now.toString());
        window.location.reload();
      }
    }
  });

  // 2. Axios Interceptor
  axios.interceptors.request.use(async (config) => {
    if (config.url && (config.url.startsWith('/api/') || config.url.includes('/api/'))) {
      try {
        const authInstance = getAuth();
        if (authInstance.currentUser) {
          const token = await authInstance.currentUser.getIdToken();
          const headers = (config.headers as any) || {};
          if (!headers.Authorization) {
            headers.Authorization = `Bearer ${token}`;
          }
          config.headers = headers;
        }
      } catch (e) {
        // Safe fallback if auth isn't initialized yet
      }
    }
    return config;
  }, (error) => {
    return Promise.reject(error);
  });
}

// Define global listener to capture early PWA install prompts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
    console.log('[PWA Entry] Captured beforeinstallprompt event globally!');
  });
}

// Register background Service Worker for Push Notifications (runs even when app is closed) in production only
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isPreviewUrl = window.location.hostname.endsWith('run.app') || 
                      window.location.hostname.includes('localhost') || 
                      window.location.hostname.includes('127.0.0.1');

  if (import.meta.env.PROD && !isPreviewUrl) {
    window.addEventListener('load', () => {
      // Helper function for resilient registration to avoid 429 loops during asset sync
      const registerResiliently = (script: string, label: string, delay: number = 60000, attempt: number = 1) => {
        const MAX_ATTEMPTS = 1;
        
        // Delay registration significantly to allow primary assets to load first and avoid initial congestion
        setTimeout(() => {
          navigator.serviceWorker.register(script)
            .then((reg) => console.log(`${label} registered:`, reg.scope))
            .catch((err) => {
              const msg = err.message || '';
              if (msg.includes('429') && attempt <= MAX_ATTEMPTS) {
                const nextDelay = delay * 2;
                console.warn(`${label} throttled (429). Attempt ${attempt}/${MAX_ATTEMPTS}. Retrying in ${nextDelay/1000}s...`);
                registerResiliently(script, label, nextDelay, attempt + 1);
              } else if (!msg.includes('redirect')) {
                console.warn(`${label} registration failed:`, err);
              }
            });
        }, delay);
      };

      // Register PWA Cache SW
      registerResiliently('/sw.js', 'PWA SW', 60000);

      // Register FCM SW
      registerResiliently('/firebase-messaging-sw.js', 'FCM SW', 120000);
    });
  } else {
    // In development mode or AI Studio preview sandbox, clear all active service worker registrations to prevent them from intercepting dev asset loads and causing 429 rate limit issues
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister()
            .then((unregistered) => {
              if (unregistered) {
                console.log('[Dev/Sandbox Clean SW] Unregistered active service worker:', registration.scope);
              }
            });
        }
      })
      .catch((err) => {
        console.warn('[Dev/Sandbox Clean SW] Failed to clear background service worker:', err);
      });
  }
}

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary fallback={<div style={{padding: 20, color: 'red'}}>Root Error: Application failed to initialize. Please check console for details.</div>}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (e) {
  console.error("Critical Render Error:", e);
  document.getElementById('root')!.innerHTML = '<div style="padding: 20px; color: red;">Critical Failure: ' + e + '</div>';
}

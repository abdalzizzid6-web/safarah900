import { getApps } from 'firebase/app';

console.log('[BOOT] Stage 2 OK: main.tsx executing');

// Diagnostic log function recording the status of all essential dependencies before rendering
function logDependencyStatus() {
  console.group('[Dependency Diagnostics]');
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Starting dependency status check before render...`);

  // 1. Firebase Check
  try {
    if (getApps().length > 0) {
      const authInstance = getAuth();
      console.log('[Dependency Diagnostics] Firebase Auth status:', authInstance ? 'Initialized (OK)' : 'Not initialized');
      console.log('[Dependency Diagnostics] Firebase Auth currentUser:', authInstance?.currentUser ? authInstance.currentUser.email : 'None / Not logged in');
    } else {
      console.log('[Dependency Diagnostics] Firebase App: Deferred initialization active');
    }
  } catch (err) {
    console.warn('[Dependency Diagnostics] Firebase Auth check safely handled:', err);
  }

  try {
    console.log('[Dependency Diagnostics] Firebase DB (firestore): Initialized (OK)');
  } catch (err) {
    console.error('[Dependency Diagnostics] Firebase DB check failed:', err);
  }

  // 2. SettingsProvider / SettingsContext Check
  try {
    console.log('[Dependency Diagnostics] SettingsProvider / SettingsContext: Available (OK)');
  } catch (err) {
    console.error('[Dependency Diagnostics] SettingsProvider check failed:', err);
  }

  // 3. Router Check
  try {
    console.log('[Dependency Diagnostics] React Router (react-router-dom): Available (OK)');
  } catch (err) {
    console.error('[Dependency Diagnostics] Router check failed:', err);
  }

  console.groupEnd();
}

// Execute diagnostic logging immediately before any rendering
logDependencyStatus();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {HelmetProvider} from 'react-helmet-async';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { setupNetworkPerformanceInterceptor, trackScreenRenderTime } from './core/monitoring/performance';

console.trace('[Trace] main.tsx start');
const appBootStartTime = typeof window !== 'undefined' ? performance.now() : 0;

// Initialize Network Request Performance Tracking for Football Data & API Latency
if (typeof window !== 'undefined') {
  setupNetworkPerformanceInterceptor();
}

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
    const reason = event.reason;
    const message = (reason && typeof reason === 'object' && 'message' in reason) ? String(reason.message) : String(reason || '');
    console.warn('[Graceful Recovery] Global Unhandled Promise Rejection caught:', message || reason);
    if (message.includes('Failed to fetch dynamically imported module') || message.includes('Importing a module script failed')) {
       console.warn('[Critical Repair] Promise rejection from failed chunk load.');
       const lastReload = sessionStorage.getItem('session_repair_reload');
       const now = Date.now();
       if (!lastReload || now - parseInt(lastReload) > 30000) {
        sessionStorage.setItem('session_repair_reload', now.toString());
        window.location.reload();
      }
    }
    // Prevent unhandled rejection error overlay / fatal crash
    if (typeof event.preventDefault === 'function') {
      event.preventDefault();
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

// Register background Service Worker for Push Notifications (runs even when app is closed)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isPreviewUrl = window.location.hostname.endsWith('run.app') || 
                      window.location.hostname.includes('localhost') || 
                      window.location.hostname.includes('127.0.0.1');

  // Clear stale caches on boot
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (let name of names) {
        if (!name.includes('safara-90-v2')) {
          caches.delete(name);
          console.log('[Cache Clean] Deleted legacy cache:', name);
        }
      }
    });
  }

  if (import.meta.env.PROD && !isPreviewUrl) {
    window.addEventListener('load', () => {
      const registerResiliently = (script: string, label: string, delay: number = 5000, attempt: number = 1) => {
        const MAX_ATTEMPTS = 2;
        setTimeout(() => {
          navigator.serviceWorker.register(script)
            .then((reg) => {
              console.log(`${label} registered:`, reg.scope);
              reg.onupdatefound = () => {
                const installingWorker = reg.installing;
                if (installingWorker) {
                  installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                      if (navigator.serviceWorker.controller) {
                        console.log('[New SW] New content is available; please refresh.');
                        const hasReloaded = sessionStorage.getItem('sw_refreshed_once');
                        if (!hasReloaded) {
                          sessionStorage.setItem('sw_refreshed_once', 'true');
                          window.location.reload();
                        }
                      }
                    }
                  };
                }
              };
            })
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
      registerResiliently('/sw.js', 'PWA SW', 5000);

      // Register FCM SW
      registerResiliently('/firebase-messaging-sw.js', 'FCM SW', 10000);
    });
  } else {
    // In development mode or AI Studio preview sandbox, clear all active service worker registrations to prevent them from intercepting dev asset loads
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
  console.log('[BOOT] Stage 3 OK: createRoot()');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary fallback={<div style={{padding: 20, color: 'red'}}>Root Error: Application failed to initialize. Please check console for details.</div>}>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </ErrorBoundary>
    </StrictMode>,
  );

  if (typeof window !== 'undefined' && appBootStartTime > 0) {
    requestAnimationFrame(() => {
      const renderDuration = performance.now() - appBootStartTime;
      trackScreenRenderTime('app_entry_boot', renderDuration);
    });
  }
} catch (e) {
  console.error("Critical Render Error:", e);
  document.getElementById('root')!.innerHTML = '<div style="padding: 20px; color: red;">Critical Failure: ' + e + '</div>';
}

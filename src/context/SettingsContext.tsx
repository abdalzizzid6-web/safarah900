import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsRepositoryV2, AppSettings } from '../core/repository/SettingsRepositoryV2';

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  setLogo: (logoUrl: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'Safara 90',
    logoUrl: '/logo-master.png',
    iconUrl: '/logo-master.png',
    adsEnabled: true,
    adPublisherId: 'ca-pub-3940256099942544',
    worldCupModule: {
      enabled: true,
      title: 'كأس العالم 2026',
      icon: 'Globe',
      url: 'https://korea90.xyz'
    }
  });
  const [loading, setLoading] = useState(true);

  const setLogo = (logoUrl: string) => {
    localStorage.setItem('CUSTOM_APP_LOGO', logoUrl);
    setSettings(prev => ({ ...prev, logoUrl }));
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem('Safara 90_cached_settings', JSON.stringify(updated));
    } catch(e) {
      console.warn("Failed to update localStorage settings:", e);
    }
    
    // Create a copy for Firestore to prevent saving huge base64 strings
    // AND strictly filter to only allowed fields to prevent bloat from unknown merged data
    const firestorePayload: any = {};
    const allowedKeys: (keyof AppSettings)[] = [
      'appName', 'primaryColor', 'adsEnabled', 'adPublisherId', 'admobAppId',
      'worldCupModule', 'navigation', 'installWidgetEnabled', 'installWidgetText',
      'installWidgetPosition', 'installWidgetDismissDelayHours', 'logoUrl', 'iconUrl', 'liveScoreWidgetEnabled', 'favoriteLeagues'
    ];

    allowedKeys.forEach(key => {
      if (updated[key] !== undefined) {
        firestorePayload[key] = updated[key];
      }
    });

    // Stricter size check: 100KB max for base64 strings in Firestore to ensure we stay under 1MB total
    if (firestorePayload.logoUrl && firestorePayload.logoUrl.length > 100000) {
      delete firestorePayload.logoUrl;
      console.warn("Logo URL too large for Firestore sync (>100KB), stored locally only");
    }
    if (firestorePayload.iconUrl && firestorePayload.iconUrl.length > 100000) {
      delete firestorePayload.iconUrl;
      console.warn("Icon URL too large for Firestore sync (>100KB), stored locally only");
    }

    try {
      // Use repository to save settings
      await settingsRepositoryV2.saveSettings(firestorePayload);
    } catch(e: any) {
      console.error("Failed to save settings to Firestore:", e);
    }
  };

  useEffect(() => {
    async function fetchSettings() {
      // Load custom logo from localStorage immediately
      const customLogo = localStorage.getItem('CUSTOM_APP_LOGO');
      const CACHE_KEY = 'Safara 90_cached_settings';
      const cached = localStorage.getItem(CACHE_KEY);
      
      let finalSettings = {
        appName: 'Safara 90',
        logoUrl: customLogo || '/logo-master.png',
        iconUrl: '/logo-master.png',
        adsEnabled: true,
        adPublisherId: 'ca-pub-3940256099942544',
        worldCupModule: {
          enabled: true,
          title: 'كأس العالم 2026',
          icon: 'Globe',
          url: 'https://korea90.xyz'
        },
        navigation: {
          showBackButton: true,
          showBreadcrumbs: true,
          animationType: 'slide',
          position: 'top'
        }
      };

      if (cached) {
        try {
          finalSettings = { ...finalSettings, ...JSON.parse(cached) };
          if (customLogo) {
            finalSettings.logoUrl = customLogo;
          }
          setSettings(finalSettings);
          setLoading(false); 
        } catch (e) {
          console.warn("[SettingsContext] Failed to parse cached settings:", e);
        }
      }

      // Always try to fetch fresh configurations in a non-blocking/resilient way
      try {
        const data = await settingsRepositoryV2.getSettings();
        
        if (data) {
          finalSettings = { ...finalSettings, ...data };
          if (customLogo) {
            finalSettings.logoUrl = customLogo;
          }
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(finalSettings));
          } catch (e) {
            console.warn("Could not save settings to localStorage, skipping.", e);
          }
          setSettings(finalSettings);
        }
      } catch (error: any) {
        if (error?.code === 'resource-exhausted') {
          console.warn("[SettingsContext] Firestore Quota Exceeded for Settings. Using defaults/cached values.");
        } else if (error?.message?.includes('offline') || error?.code === 'unavailable') {
          console.warn("[SettingsContext] Client is currently offline. Operating perfectly with cached settings.");
        } else {
          console.warn("[SettingsContext] Failed to retrieve settings from database:", error?.message || error);
        }
      } finally {
        // Run essential initialization logic based on either fresh, cached, or default settings
        
        // Update Favicon and Title
        const iconSource = finalSettings.iconUrl || finalSettings.logoUrl;
        if (iconSource) {
          const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = iconSource;
          document.getElementsByTagName('head')[0].appendChild(link);

          // Also update apple-touch-icon
          const appleLink: HTMLLinkElement = document.querySelector("link[rel='apple-touch-icon']") || document.createElement('link');
          appleLink.rel = 'apple-touch-icon';
          appleLink.href = iconSource;
          document.getElementsByTagName('head')[0].appendChild(appleLink);
        }

        if (finalSettings.appName) {
          document.title = finalSettings.appName;
        }

        // Adsense integration
        if ((finalSettings as any).adsEnabled && (finalSettings as any).adPublisherId) {
            const adsenseId = 'google-adsense-script';
            if (!document.getElementById(adsenseId)) {
                const script = document.createElement('script');
                script.id = adsenseId;
                script.async = true;
                script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${(finalSettings as any).adPublisherId}`;
                script.crossOrigin = 'anonymous';
                document.head.appendChild(script);
            }
        } else {
              const existingScript = document.getElementById('google-adsense-script');
              if (existingScript) existingScript.remove();
        }

        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, setLogo, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

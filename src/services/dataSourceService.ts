import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type FootballProvider = 'TheSportsDB' | 'API-Football' | 'SportMonks' | 'Custom' | 'None';

export interface CustomApi {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  headers: Record<string, string>;
}

export interface DataSourceSettings {
  matchProvider: FootballProvider;
  leagueProvider: FootballProvider;
  teamProvider: FootballProvider;
  playerProvider: FootballProvider;
  standingsProvider: FootballProvider;
  statisticsProvider: FootballProvider;
  streamProvider: FootballProvider;
  
  // API Keys
  theSportsDBApiKey: string;
  apiFootballKey: string;
  sportMonksKey: string;

  // Custom APIs
  customApis?: CustomApi[];

  // Cache Settings
  cacheEnabled: boolean;
  cacheTtlMinutes: number;

  // Fallback Settings
  fallbackProvider: FootballProvider | 'None';

  // Modules
  worldCupModuleEnabled: boolean;
}

const STORAGE_KEY = 'Safara 90_data_sources_settings';

export const DEFAULT_DATA_SOURCE_SETTINGS: DataSourceSettings = {
  matchProvider: 'API-Football',
  leagueProvider: 'API-Football',
  teamProvider: 'API-Football',
  playerProvider: 'API-Football',
  standingsProvider: 'API-Football',
  statisticsProvider: 'API-Football',
  streamProvider: 'API-Football',
  
  theSportsDBApiKey: '',
  apiFootballKey: '',
  sportMonksKey: '',
  
  customApis: [],

  cacheEnabled: true,
  cacheTtlMinutes: 10,

  fallbackProvider: 'None',
  worldCupModuleEnabled: true,
};

// In-memory active cache
let cachedSettings: DataSourceSettings = { ...DEFAULT_DATA_SOURCE_SETTINGS };
let lastFetchTime = 0;

// Load initial settings from localStorage synchronously so it is available before async firestore completes
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      cachedSettings = { ...DEFAULT_DATA_SOURCE_SETTINGS, ...parsed };
      // Boost initial fetch time slightly to allow immediate startup fallback if Firestore fails
      lastFetchTime = Date.now() - 5 * 60 * 1000; // 5 mins ago
    }
  } catch (err) {
    console.warn('[dataSourceService] Fails to load settings from localStorage:', err);
  }
}

export const dataSourceService = {
  /**
   * Returns current settings synchronously from memory or localStorage cache.
   */
  getSettingsSync(): DataSourceSettings {
    return cachedSettings;
  },

  /**
   * Fetches latest settings from Firestore and updates memory and localStorage.
   */
  async getSettings(): Promise<DataSourceSettings> {
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours limit to reduce O(1) reads
    if (Date.now() - lastFetchTime < CACHE_TTL) {
      return cachedSettings;
    }

    try {
      const docRef = doc(db, 'settings', 'data_sources');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<DataSourceSettings>;
        const merged: DataSourceSettings = { ...DEFAULT_DATA_SOURCE_SETTINGS, ...data };
        if (!merged.sportMonksKey && DEFAULT_DATA_SOURCE_SETTINGS.sportMonksKey) {
          merged.sportMonksKey = DEFAULT_DATA_SOURCE_SETTINGS.sportMonksKey;
        }
        cachedSettings = merged;
        lastFetchTime = Date.now();
        
        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedSettings));
        } catch (err) {}
      } else {
        // Initialize doc in Firestore if it doesn't exist
        await this.saveSettings(DEFAULT_DATA_SOURCE_SETTINGS);
      }
    } catch (err) {
      console.warn('[dataSourceService] Failed to load data sources settings from Firestore, using cache:', err);
      // Throttle retry attempts even on failure to avoid looping Firebase quota exhaustion
      lastFetchTime = Date.now() - 8 * 60 * 1000; // retry in 2 minutes
    }
    return cachedSettings;
  },

  /**
   * Saves settings to Firestore and local memory/caches.
   */
  async saveSettings(settings: DataSourceSettings): Promise<void> {
    cachedSettings = { ...settings };
    lastFetchTime = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedSettings));
    } catch (err) {}

    try {
      const docRef = doc(db, 'settings', 'data_sources');
      await setDoc(docRef, settings);
    } catch (err: any) {
      console.error('[dataSourceService] Failed to save settings to Firestore:', err);
      throw err;
    }
  },

  /**
   * Tests the connection for a specified provider and API key
   */
  async testProviderConnection(provider: FootballProvider, key: string, token?: string): Promise<{ success: boolean; message: string }> {
    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('/api/test-api-key', {
            method: 'POST',
            headers,
            body: JSON.stringify({ provider, key }),
        });
        return await response.json();
    } catch (err: any) {
      return { success: false, message: `Error testing connection: ${err.message || err}` };
    }
  }
};

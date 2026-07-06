import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { telemetry } from '../core/monitoring/telemetry';

export interface WorldCupConfig {
  showSection: boolean;
  displayOrder: number;
  matchesCount: number;
  backgroundImage: string;
  title: string;
  subtitle: string;
  showAllMatchesBtn: boolean;
  showGroupsBtn: boolean;
  showBracketBtn: boolean;
}

const DEFAULT_CONFIG: WorldCupConfig = {
  showSection: true,
  displayOrder: 1,
  matchesCount: 5,
  backgroundImage: '/src/assets/images/wc2026_premium_bg_1781077994238.png',
  title: 'كأس العالم FIFA 2026',
  subtitle: 'الحدث الكروي الأكبر في التاريخ - الولايات المتحدة، كندا، المكسيك',
  showAllMatchesBtn: true,
  showGroupsBtn: true,
  showBracketBtn: true
};

const STORAGE_KEY = 'korea90_wc_config_cache';

export const worldCupConfigService = {
  getInitialConfig(): WorldCupConfig {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.warn("Failed to load WC config from cache", e);
    }
    return DEFAULT_CONFIG;
  },

  async getConfig(): Promise<WorldCupConfig> {
    if (telemetry.isFirestoreQuotaExceeded()) {
      return this.getInitialConfig();
    }
    try {
      const docRef = doc(db, 'settings', 'world_cup');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as WorldCupConfig;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      console.warn("Failed to fetch WC config from Firestore", e);
    }
    return this.getInitialConfig();
  },

  async saveConfig(config: WorldCupConfig): Promise<void> {
    if (telemetry.isFirestoreQuotaExceeded()) return;
    try {
      const docRef = doc(db, 'settings', 'world_cup');
      await setDoc(docRef, config);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
    }
  },

  subscribe(callback: (config: WorldCupConfig) => void) {
    if (telemetry.isFirestoreQuotaExceeded()) {
      callback(this.getInitialConfig());
      return () => {};
    }
    const docRef = doc(db, 'settings', 'world_cup');
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as WorldCupConfig;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        callback(data);
      } else {
        callback(DEFAULT_CONFIG);
      }
    }, (error: any) => {
      if (error.message?.includes('quota') || error.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      console.warn("[worldCupConfigService] Firestore onSnapshot failed, using cached config:", error);
      // Immediately fallback to cached config to keep UI working
      callback(this.getInitialConfig());
    });
  }
};

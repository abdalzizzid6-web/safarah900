import { BaseRepository } from './BaseRepository';
import { telemetry } from '../monitoring/telemetry';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AppSettings {
  logoUrl?: string;
  iconUrl?: string;
  appName?: string;
  primaryColor?: string;
  adsEnabled?: boolean;
  adPublisherId?: string;
  admobAppId?: string;
  worldCupModule?: {
    enabled: boolean;
    title: string;
    icon: string;
    url: string;
  };
  navigation?: {
    showBackButton: boolean;
    showBreadcrumbs: boolean;
    animationType: string;
    position: string;
  };
  installWidgetEnabled?: boolean;
  installWidgetText?: string;
  installWidgetPosition?: string;
  installWidgetDismissDelayHours?: number;
  liveScoreWidgetEnabled?: boolean;
  favoriteLeagues?: string[];
}

export class SettingsRepositoryV2 extends BaseRepository<AppSettings> {
  constructor() {
    super('settings');
  }

  async getSettings(): Promise<AppSettings | null> {
    telemetry.logApiCall('SettingsRepositoryV2.getSettings');
    try {
      return await this.getById('config');
    } catch (e) {
      telemetry.logError('SETTINGS_GET_FAILURE', e);
      throw e;
    }
  }

  async updateSettings(settings: Partial<AppSettings>) {
    telemetry.logApiCall('SettingsRepositoryV2.updateSettings');
    try {
      await setDoc(doc(db, 'settings', 'config'), settings, { merge: true });
    } catch (e) {
      telemetry.logError('SETTINGS_UPDATE_FAILURE', e);
      throw e;
    }
  }

  async saveSettings(settings: AppSettings) {
    telemetry.logApiCall('SettingsRepositoryV2.saveSettings');
    try {
      // Use setDoc WITHOUT merge to replace the document and clean up any existing bloat
      await setDoc(doc(db, 'settings', 'config'), settings);
    } catch (e) {
      telemetry.logError('SETTINGS_SAVE_FAILURE', e);
      throw e;
    }
  }
}

export const settingsRepositoryV2 = new SettingsRepositoryV2();

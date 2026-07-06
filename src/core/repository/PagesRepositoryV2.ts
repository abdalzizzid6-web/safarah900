import { BaseRepository } from './BaseRepository';
import { telemetry } from '../monitoring/telemetry';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface PageDoc {
  id: string;
  title: string;
  content: string;
  lastUpdated?: string;
}

export class PagesRepositoryV2 extends BaseRepository<PageDoc> {
  constructor() {
    super('pages');
  }

  async getPage(id: string): Promise<PageDoc | null> {
    telemetry.logApiCall('PagesRepositoryV2.getPage');
    try {
      const docSnap = await getDoc(doc(db, 'pages', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as PageDoc;
      }
      return null;
    } catch (e) {
      telemetry.logError('PAGES_GET_PAGE_FAILURE', e);
      throw e;
    }
  }

  async savePage(page: PageDoc) {
    telemetry.logApiCall('PagesRepositoryV2.savePage');
    try {
      const payload = { 
        ...page, 
        lastUpdated: new Date().toISOString() 
      };
      await setDoc(doc(db, 'pages', page.id), payload, { merge: true });
    } catch (e) {
      telemetry.logError('PAGES_SAVE_PAGE_FAILURE', e);
      throw e;
    }
  }
}

export const pagesRepositoryV2 = new PagesRepositoryV2();

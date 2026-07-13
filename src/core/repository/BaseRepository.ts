import { db } from '../../firebase';
import { telemetry } from '../monitoring/telemetry';
import { CacheLayer } from '../api-management/cache/CacheLayer';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  setDoc,
  query, 
  QueryConstraint,
  writeBatch,
  limit
} from 'firebase/firestore';

export abstract class BaseRepository<T> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  async getAll(limitVal: number = 50): Promise<T[]> {
    const cacheKey = `${this.collectionName}_all_${limitVal}`;
    const cached = CacheLayer.get<T[]>(cacheKey);
    if (cached) return cached;

    if (telemetry.isFirestoreQuotaExceeded()) {
      console.warn(`[BaseRepository] Skipping getAll for ${this.collectionName} due to quota exhaustion.`);
      return [];
    }
    try {
      const safeLimit = Math.min(limitVal, 100);
      const q = query(collection(db, this.collectionName), limit(safeLimit));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      
      CacheLayer.set(cacheKey, results, 5); // 5 mins cache
      return results;
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  async getById(id: string): Promise<T | null> {
    const cacheKey = `${this.collectionName}_doc_${id}`;
    const cached = CacheLayer.get<T>(cacheKey);
    if (cached) return cached;

    if (telemetry.isFirestoreQuotaExceeded()) {
      return null;
    }
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      const result = docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as T) : null;
      
      if (result) CacheLayer.set(cacheKey, result, 10); // 10 mins cache for specific docs
      return result;
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  protected invalidateCache(id?: string): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const prefix = 'safara_cache_';
      const keysToClear: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.startsWith(prefix + this.collectionName) ||
          key.includes(this.collectionName)
        )) {
          keysToClear.push(key);
        }
      }
      keysToClear.forEach(key => sessionStorage.removeItem(key));
    }
    if (id) {
      CacheLayer.invalidate(`${this.collectionName}_doc_${id}`);
    }
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    if (telemetry.isFirestoreQuotaExceeded()) throw new Error('Firestore Quota Exceeded');
    try {
      const docRef = await addDoc(collection(db, this.collectionName), data as any);
      this.invalidateCache(docRef.id);
      return docRef.id;
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  async setById(id: string, data: Partial<T>): Promise<void> {
    if (telemetry.isFirestoreQuotaExceeded()) throw new Error('Firestore Quota Exceeded');
    try {
      const docRef = doc(db, this.collectionName, id);
      await setDoc(docRef, data as any, { merge: true });
      this.invalidateCache(id);
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    if (telemetry.isFirestoreQuotaExceeded()) throw new Error('Firestore Quota Exceeded');
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, data as any);
      this.invalidateCache(id);
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  async delete(id: string): Promise<void> {
    if (telemetry.isFirestoreQuotaExceeded()) throw new Error('Firestore Quota Exceeded');
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      this.invalidateCache(id);
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  async bulkUpdate(ids: string[], data: Partial<T>): Promise<void> {
    if (telemetry.isFirestoreQuotaExceeded()) throw new Error('Firestore Quota Exceeded');
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, this.collectionName, id), data as any);
      });
      await batch.commit();
      ids.forEach(id => this.invalidateCache(id));
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    if (telemetry.isFirestoreQuotaExceeded()) throw new Error('Firestore Quota Exceeded');
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, this.collectionName, id));
      });
      await batch.commit();
      ids.forEach(id => this.invalidateCache(id));
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  // Helpers for subclasses to implement more complex queries
  protected async query(constraints: QueryConstraint[]): Promise<T[]> {
    if (telemetry.isFirestoreQuotaExceeded()) {
      return [];
    }
    try {
      // Append safety limit at the end of custom query constraints to prevent unbounded scanning
      const safeConstraints = [...constraints, limit(100)];
      const q = query(collection(db, this.collectionName), ...safeConstraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }
}

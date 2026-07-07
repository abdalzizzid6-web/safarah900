import { db } from '../../firebase';
import { telemetry } from '../monitoring/telemetry';
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
    if (telemetry.isFirestoreQuotaExceeded()) {
      console.warn(`[BaseRepository] Skipping getAll for ${this.collectionName} due to quota exhaustion.`);
      return [];
    }
    try {
      const q = query(collection(db, this.collectionName), limit(limitVal));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  async getById(id: string): Promise<T | null> {
    if (telemetry.isFirestoreQuotaExceeded()) {
      return null;
    }
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as T) : null;
    } catch (e: any) {
      if (e.message?.includes('quota') || e.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      throw e;
    }
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    if (telemetry.isFirestoreQuotaExceeded()) throw new Error('Firestore Quota Exceeded');
    try {
      const docRef = await addDoc(collection(db, this.collectionName), data as any);
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
      const q = query(collection(db, this.collectionName), ...constraints);
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

import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, limit } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';

export class UserRepositoryV2 extends BaseRepository<any> {
  constructor() {
    super('users');
  }

  async getDocRaw(uid: string) {
    const userDocRef = doc(db, 'users', uid);
    return await getDoc(userDocRef);
  }

  async setDocRaw(uid: string, data: any) {
    const userDocRef = doc(db, 'users', uid);
    return await setDoc(userDocRef, data);
  }

  async getAllUsers(max: number = 50) {
    const q = query(collection(db, 'users'), limit(max));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  }

  async getUserRole(uid: string) {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) return null;
    return userDocSnap.data()?.role;
  }

  async ensureSuperAdmin(uid: string, email: string) {
    if (email === 'abdalziz2022@gmail.com') {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists() && userDocSnap.data()?.role !== 'super_admin') {
         await updateDoc(userDocRef, { role: 'super_admin' });
      }
    }
  }

  async updateLastLogin(uid: string) {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { lastLogin: new Date().toISOString() });
  }

  async updateUser(uid: string, updates: any) {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, { ...updates, updatedAt: new Date().toISOString() });
  }

  async updateProfile(uid: string, data: any) {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
  }

  async searchUsers(searchQuery: string) {
    const q = query(
      collection(db, 'users'),
      where('email', '>=', searchQuery),
      where('email', '<=', searchQuery + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  }
}

export const userRepositoryV2 = new UserRepositoryV2();

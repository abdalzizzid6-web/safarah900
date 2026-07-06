import { db } from '../../../firebase';
import { collection, doc, getDocs, updateDoc, deleteDoc, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, setDoc } from 'firebase/firestore';

export const worldCupAdminRepository = {
  saveMatchOverride: async (matchId: string, data: any) => {
    const ref = doc(db, 'cms_match_overrides', String(matchId));
    await setDoc(ref, {
      ...data,
      id: matchId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  saveTeamOverride: async (teamId: string, data: any) => {
    const ref = doc(db, 'cms_teams', String(teamId));
    await setDoc(ref, {
      ...data,
      id: teamId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },

  getNews: async () => {
    const snap = await getDocs(query(collection(db, 'news'), limit(200)));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  },
  addNews: async (data: any) => {
    await addDoc(collection(db, 'news'), { ...data, date: new Date().toISOString() });
  },
  updateNews: async (id: string, data: any) => {
    await updateDoc(doc(db, 'news', id), data);
  },
  deleteNews: async (id: string) => {
    await deleteDoc(doc(db, 'news', id));
  },
  
  getStreams: async () => {
    const snap = await getDocs(query(collection(db, 'matchStreams'), limit(200)));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  },
  updateStream: async (id: string, data: any) => {
    await updateDoc(doc(db, 'matchStreams', id), data);
  },
  addStream: async (id: string, data: any) => {
    // If we want to use the matchId as the stream document ID
    await setDoc(doc(db, 'matchStreams', id), data);
  },
  deleteStream: async (id: string) => {
    await deleteDoc(doc(db, 'matchStreams', id));
  },

  getUsers: async () => {
    const snap = await getDocs(query(collection(db, 'users'), limit(500)));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  },

  updateUserRole: async (id: string, roleData: any) => {
    await updateDoc(doc(db, 'users', id), roleData);
  },

  subscribeToApiLogs: (callback: (logs: any[]) => void) => {
    const q = query(collection(db, 'api_logs'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      callback(logs);
    }, (error: any) => {
      console.warn("[worldCupAdminRepository] subscribeToApiLogs failed:", error);
      callback([]); // Gracefully fallback to empty logs
    });
  }
};

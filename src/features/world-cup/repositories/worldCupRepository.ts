import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';

export const getMatchStreams = async (matchId: string | number) => {
  try {
    const q = query(
      collection(db, 'matchStreams'),
      where('matchId', '==', String(matchId)),
      where('isActive', '!=', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[worldCupRepository] Error getting match streams:', error);
    return [];
  }
};

export const getNews = async (limitCount: number = 20) => {
  try {
    const q = query(
      collection(db, 'news'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[worldCupRepository] Error getting news:', error);
    return [];
  }
};

import { db } from '../firebase'; // Assuming firebase is initialized
import { collection, addDoc, getDocs, where, query, Timestamp } from 'firebase/firestore';

export interface Competition {
  id?: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate: Date;
  endDate: Date;
  rules: any;
  type: string;
}

export const competitionService = {
  async getAllCompetitions() {
    const q = query(collection(db, 'competitions'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Competition));
  },

  async createCompetition(data: Competition) {
    return await addDoc(collection(db, 'competitions'), {
        ...data,
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate)
    });
  }
};

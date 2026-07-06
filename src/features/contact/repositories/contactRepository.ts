import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

export interface ContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
}

export const submitContactMessage = async (data: ContactMessage) => {
  try {
    await addDoc(collection(db, 'contact_messages'), {
      ...data,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('[contactRepository] Error submitting contact message:', error);
    throw error;
  }
};

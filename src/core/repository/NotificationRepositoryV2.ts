import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, addDoc, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';

export class NotificationRepositoryV2 extends BaseRepository<any> {
  constructor() {
    super('notifications');
  }

  async getFCMTokens(uid: string) {
    const q = query(collection(db, 'fcm_tokens'), where('uid', '==', uid));
    return await getDocs(q);
  }

  async findFCMTokenByToken(token: string) {
    const q = query(collection(db, 'fcm_tokens'), where('token', '==', token), limit(1));
    return await getDocs(q);
  }

  async addFCMToken(data: any) {
    return await addDoc(collection(db, 'fcm_tokens'), data);
  }

  async updateFCMToken(docId: string, data: any) {
    return await updateDoc(doc(db, 'fcm_tokens', docId), data);
  }

  subscribeToUserNotifications(uid: string, callback: (snap: any) => void, onError?: (err: any) => void) {
    const q = query(
      collection(db, 'notifications'),
      where('targetUids', 'array-contains', uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    return onSnapshot(q, callback, onError);
  }

  async markAsRead(notificationId: string) {
    return await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
  }

  async markAllNotificationsAsRead(userId: string) {
    const q = query(
      collection(db, 'notifications'),
      where('targetUids', 'array-contains', userId),
      where('isRead', '==', false),
      limit(100)
    );
    return await getDocs(q);
  }

  async getNotificationsByTarget(targetId: string, targetType: string) {
    const q = query(
      collection(db, 'notifications'),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType)
    );
    return await getDocs(q);
  }

  async addNotification(data: any) {
    return await addDoc(collection(db, 'notifications'), data);
  }

  async addNotificationHistory(data: any) {
    return await addDoc(collection(db, 'notification_history'), data);
  }

  async fetchNotificationHistory() {
    const q = query(collection(db, 'notification_history'), orderBy('timestamp', 'desc'), limit(50));
    return await getDocs(q);
  }

  async checkFollow(uid: string, matchId: string) {
    const followRef = doc(db, `users/${uid}/followed_matches/${matchId}`);
    return await getDoc(followRef);
  }

  async setFollow(uid: string, matchId: string, data: any) {
    const followRef = doc(db, `users/${uid}/followed_matches/${matchId}`);
    return await setDoc(followRef, data);
  }

  async unfollow(uid: string, matchId: string) {
    const followRef = doc(db, `users/${uid}/followed_matches/${matchId}`);
    return await setDoc(followRef, { active: false }, { merge: true });
  }

  async saveMatchGoalFollow(userId: string, matchId: string, data: any) {
    const followRef = doc(db, 'match_follows', `${userId}_${matchId}`);
    return await setDoc(followRef, data, { merge: true });
  }

  async fetchMatchGoalFollow(userId: string, matchId: string) {
    const followRef = doc(db, 'match_follows', `${userId}_${matchId}`);
    return await getDoc(followRef);
  }
}

export const notificationRepositoryV2 = new NotificationRepositoryV2();

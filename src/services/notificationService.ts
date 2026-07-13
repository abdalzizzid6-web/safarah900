import { collection, addDoc, query, where, getDocs, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { db, messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { AppNotification, NotificationType } from '../types';
import { telemetry } from '../core/monitoring/telemetry';

export const notificationService = {
  // FCM Token Management
  async registerFcmToken(userId: string) {
    if (!messaging || telemetry.isFirestoreQuotaExceeded()) return;
    
    try {
      const vapidKey = (import.meta.env.VITE_FCM_VAPID_KEY as string);
      if (!vapidKey) return;

      const token = await getToken(messaging, { vapidKey });
      if (token) {
        const tokensRef = collection(db, 'fcm_tokens');
        const q = query(tokensRef, where('token', '==', token), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          await addDoc(tokensRef, {
            token,
            userId,
            device: navigator.userAgent,
            updatedAt: new Date().toISOString()
          });
        } else {
          const docId = snap.docs[0].id;
          await updateDoc(doc(db, 'fcm_tokens', docId), {
            userId,
            updatedAt: new Date().toISOString()
          });
        }
        return token;
      }
    } catch (err: any) {
      if (err.message?.includes('quota') || err.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      console.warn('[NotificationService] FCM registration skipped:', err);
    }
  },

  // In-App Notifications
  subscribeToUserNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
    if (telemetry.isFirestoreQuotaExceeded()) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, 'notifications'),
      where('targetUids', 'array-contains', userId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, (snap) => {
      const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      callback(notifications);
    }, (error: any) => {
      if (error.message?.includes('quota') || error.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
      console.warn("[NotificationService] Firestore onSnapshot failed for user notifications:", error);
      callback([]); 
    });
  },

  async markAsRead(notificationId: string) {
    if (telemetry.isFirestoreQuotaExceeded()) return;
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
    } catch (err: any) {
      if (err.message?.includes('quota') || err.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
    }
  },

  async markAllAsRead(userId: string) {
    if (telemetry.isFirestoreQuotaExceeded()) return;
    try {
      const q = query(
        collection(db, 'notifications'),
        where('targetUids', 'array-contains', userId),
        where('isRead', '==', false),
        limit(100)
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.update(d.ref, { isRead: true }));
      await batch.commit();
    } catch (err: any) {
      if (err.message?.includes('quota') || err.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
    }
  },

  // Admin: Send Broadcast
  async sendBroadcast(title: string, body: string, type: NotificationType = NotificationType.SYSTEM_BROADCAST, target: 'ALL' | 'VIP' = 'ALL') {
    const notifData = {
      title,
      body,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
      targetUids: [target], // 'ALL' or 'VIP' targeting
      imageUrl: '/safera-logo-512.png'
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notifData);

    // Add to notification history log
    await addDoc(collection(db, 'notification_history'), {
      notificationId: docRef.id,
      title,
      body,
      type,
      target,
      timestamp: new Date().toISOString(),
      deliveryStatus: '✓ Sent (' + (target === 'VIP' ? 'VIP Users Only' : 'All Users') + ')'
    });
  },

  async getNotificationHistory() {
    const q = query(collection(db, 'notification_history'), orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Real-time listener for FCM foreground messages
  onForegroundMessage(callback: (payload: any) => void) {
    if (!messaging) return () => {};
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  },

  async subscribeToMatchGoals(userId: string, matchId: string) {
    try {
      const token = await this.registerFcmToken(userId);
      if (!token) return false;

      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, topic: `match_${matchId}` })
      });
      
      if (response.ok) {
        // Track follows in Firestore for UI state
        const followRef = doc(db, 'match_follows', `${userId}_${matchId}`);
        await setDoc(followRef, {
          userId,
          matchId,
          topic: `match_${matchId}`,
          createdAt: new Date().toISOString()
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('[NotificationService] Failed to subscribe:', err);
      return false;
    }
  },

  async unsubscribeFromMatchGoals(userId: string, matchId: string) {
    try {
      const token = await this.registerFcmToken(userId);
      if (!token) return false;

      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, topic: `match_${matchId}` })
      });

      if (response.ok) {
        const followRef = doc(db, 'match_follows', `${userId}_${matchId}`);
        await setDoc(followRef, { active: false }, { merge: true });
        return true;
      }
      return false;
    } catch (err) {
      console.error('[NotificationService] Failed to unsubscribe:', err);
      return false;
    }
  },

  async isFollowingMatch(userId: string, matchId: string): Promise<boolean> {
    try {
      const followRef = doc(db, 'match_follows', `${userId}_${matchId}`);
      const snap = await getDoc(followRef);
      return snap.exists() && snap.data()?.active !== false;
    } catch (err) {
      return false;
    }
  }
};

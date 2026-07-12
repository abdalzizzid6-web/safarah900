import { notificationRepositoryV2 } from '../core/repository/NotificationRepositoryV2';

import { db, messaging } from '../firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { AppNotification, NotificationType } from '../types';
import { telemetry } from '../core/monitoring/telemetry';
import { writeBatch } from 'firebase/firestore';

export const notificationService = {
  // FCM Token Management
  async registerFcmToken(userId: string) {
    if (!messaging || telemetry.isFirestoreQuotaExceeded()) return;
    
    try {
      const vapidKey = (import.meta.env.VITE_FCM_VAPID_KEY as string);
      if (!vapidKey) return;

      const token = await getToken(messaging, { vapidKey });
      if (token) {
        const snap = await notificationRepositoryV2.findFCMTokenByToken(token);
        
        if (snap.empty) {
          await notificationRepositoryV2.addFCMToken({
            token,
            userId,
            device: navigator.userAgent,
            updatedAt: new Date().toISOString()
          });
        } else {
          const docId = snap.docs[0].id;
          await notificationRepositoryV2.updateFCMToken(docId, {
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
    
    return notificationRepositoryV2.subscribeToUserNotifications(
      userId,
      (snap: any) => {
        const notifications = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AppNotification));
        callback(notifications);
      },
      (error: any) => {
        if (error.message?.includes('quota') || error.code === 'resource-exhausted') {
          telemetry.setFirestoreQuotaExceeded(true);
        }
        console.warn("[NotificationService] Firestore onSnapshot failed for user notifications:", error);
        callback([]); 
      }
    );
  },

  async markAsRead(notificationId: string) {
    if (telemetry.isFirestoreQuotaExceeded()) return;
    try {
      await notificationRepositoryV2.markAsRead(notificationId);
    } catch (err: any) {
      if (err.message?.includes('quota') || err.code === 'resource-exhausted') {
        telemetry.setFirestoreQuotaExceeded(true);
      }
    }
  },

  async markAllAsRead(userId: string) {
    if (telemetry.isFirestoreQuotaExceeded()) return;
    try {
      const snap = await notificationRepositoryV2.markAllNotificationsAsRead(userId);
      const batch = writeBatch(db);
      snap.docs.forEach((d: any) => batch.update(d.ref, { isRead: true }));
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
    
    const docRef = await notificationRepositoryV2.addNotification(notifData);

    // Add to notification history log
    await notificationRepositoryV2.addNotificationHistory({
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
    const snap = await notificationRepositoryV2.fetchNotificationHistory();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
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
        // Track follows in Firestore for UI state via Repository
        await notificationRepositoryV2.saveMatchGoalFollow(userId, matchId, {
          userId,
          matchId,
          topic: `match_${matchId}`,
          active: true,
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
        await notificationRepositoryV2.saveMatchGoalFollow(userId, matchId, { active: false });
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
      const snap = await notificationRepositoryV2.fetchMatchGoalFollow(userId, matchId);
      return snap.exists() && snap.data()?.active !== false;
    } catch (err) {
      return false;
    }
  }
};

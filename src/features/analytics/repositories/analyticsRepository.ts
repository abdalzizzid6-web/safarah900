import { doc, setDoc, increment, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../../../firebase';

export const logAnalyticsEvent = async (eventId: string, payload: any) => {
  try {
    const eventRef = doc(db, 'analytics_events', eventId);
    await setDoc(eventRef, {
      ...payload,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('[analyticsRepository] Error logging analytics event:', error);
    throw error;
  }
};

export const updateDailyAggregation = async (dateStr: string, data: {
  currentUserId: string;
  currentSessionId: string;
  device: string;
  os: string;
  source: string;
}) => {
  try {
    const dailyRef = doc(db, 'analytics_daily', dateStr);
    
    // Zero-read update using increment and arrayUnion
    // setDoc with merge: true will create the doc if it doesn't exist
    // This dramatically reduces Firestore reads by eliminating getDoc
    await setDoc(dailyRef, {
      date: dateStr,
      pageViews: increment(1),
      uniqueVisitors: arrayUnion(data.currentUserId),
      sessions: arrayUnion(data.currentSessionId),
      [`deviceTypes.${data.device}`]: increment(1),
      [`osTypes.${data.os}`]: increment(1),
      [`sources.${data.source}`]: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });

  } catch (error) {
    // Fail silently in production for background analytics to prevent user disruption
    if (process.env.NODE_ENV !== 'production') {
       console.error('[analyticsRepository] Error updating daily analytics:', error);
    }
  }
};

export const updatePresence = async (sessionId: string, payload: any) => {
  try {
    const presenceRef = doc(db, 'analytics_presence', sessionId);
    await setDoc(presenceRef, {
      ...payload,
      lastSeenAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    // Fail silently for presence
  }
};
